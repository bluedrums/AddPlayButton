// Simple fetch wrapper for client-side API calls
// Handles JSON parsing and error formatting.

// Cache for CSRF token
let csrfToken: string | null = null;

// Helper to clear CSRF token cache (useful after signout)
export const clearCsrfToken = () => {
  csrfToken = null;
};

// Helper to get CSRF token
const getCsrfToken = async (): Promise<string> => {
  if (!csrfToken) {
    try {
      const response = await fetch('/api/auth/csrf', {
        credentials: 'include',
      });
      const data = await response.json();
      csrfToken = data.csrfToken;
      console.log('🔐 CSRF token fetched:', csrfToken);
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
      throw error;
    }
  }
  return csrfToken!; // We know it's not null at this point
};

export const api = async (url: string, options: RequestInit = {}) => {
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    // Get CSRF token for state-changing requests
    let csrfHeader = {};
    if (options.method && ['POST', 'PUT', 'DELETE'].includes(options.method)) {
      try {
        const token = await getCsrfToken();
        csrfHeader = { 'X-CSRF-Token': token };
      } catch (error) {
        console.error('Failed to get CSRF token:', error);
      }
    }
    
    // In mini-app context, include user FID from sessionStorage as backup
    let fidHeader = {};
    if (typeof window !== 'undefined') {
      const storedUser = sessionStorage.getItem('farcaster_user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          if (user.fid) {
            fidHeader = { 'x-user-fid': user.fid.toString() };
          }
        } catch (err) {
          // Ignore parse errors
        }
      }
    }
  
    const mergedOptions: RequestInit = {
      ...defaultOptions,
      ...options,
      credentials: 'include', // ensure cookies (session, csrf) are sent & accepted in third-party iframe
      headers: {
        ...defaultOptions.headers,
        ...csrfHeader,
        ...fidHeader,
        ...options.headers,
      },
    };
    
    // Add timestamp to URL to prevent caching for GET requests
    let finalUrl = url;
    if (!options.method || options.method === 'GET') {
      finalUrl = url.includes('?') 
        ? `${url}&_t=${Date.now()}` 
        : `${url}?_t=${Date.now()}`;
    }
  
    try {
      const response = await fetch(finalUrl, mergedOptions);
  
      if (!response.ok) {
        // Attempt to parse error response, otherwise use status text
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          // Not a JSON response
        }
      const errorMessage = errorData?.error || response.statusText;
      // Only log the first 200 characters of mergedOptions to avoid cluttering console with large objects
      const safeOptions = JSON.parse(JSON.stringify(mergedOptions));
      if (safeOptions.body && safeOptions.body.length > 200) {
          safeOptions.body = safeOptions.body.substring(0, 200) + '... (truncated)';
      }

      console.error(`API Error: ${response.status} ${errorMessage}`, {
        url,
        options: safeOptions,
      });
      throw new Error(errorMessage);
    }
  
      // Handle cases with no content
      if (response.status === 204) {
        return null;
      }

      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        const text = await response.text();
        console.error('API returned HTML instead of JSON:', text.substring(0, 200));
        throw new Error('API returned HTML instead of JSON');
      }
  
      // Safely parse JSON with error handling
      try {
        return await response.json();
      } catch (parseError) {
        // If JSON parsing fails, the response might be HTML without proper content-type
        console.error('Failed to parse JSON response from:', url, parseError);
        throw new Error('Invalid JSON response from API');
      }
    } catch (error) {
      console.error('Fetch API failed:', { url, error });
      // Re-throw to allow individual callers to handle it
      throw error; 
    }
  };
  