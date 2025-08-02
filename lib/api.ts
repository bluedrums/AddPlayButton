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
  
    const mergedOptions: RequestInit = {
      ...defaultOptions,
      ...options,
      credentials: 'include', // ensure cookies (session, csrf) are sent & accepted in third-party iframe
      headers: {
        ...defaultOptions.headers,
        ...csrfHeader,
        ...options.headers,
      },
    };
  
    try {
      const response = await fetch(url, mergedOptions);
  
      if (!response.ok) {
        // Attempt to parse error response, otherwise use status text
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          // Not a JSON response
        }
        const errorMessage = errorData?.error || response.statusText;
        console.error(`API Error: ${response.status} ${errorMessage}`, {
          url,
          options: mergedOptions,
        });
        throw new Error(errorMessage);
      }
  
      // Handle cases with no content
      if (response.status === 204) {
        return null;
      }
  
      return await response.json();
    } catch (error) {
      console.error('Fetch API failed:', { url, error });
      // Re-throw to allow individual callers to handle it
      throw error; 
    }
  };
  