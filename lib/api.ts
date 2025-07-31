// Simple fetch wrapper for client-side API calls
// Handles JSON parsing and error formatting.
export const api = async (url: string, options: RequestInit = {}) => {
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
  
    const mergedOptions: RequestInit = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
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
  