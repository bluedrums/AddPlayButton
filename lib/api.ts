// lib/api.ts
let csrfToken: string | null = null;
let csrfTokenPromise: Promise<string> | null = null;

async function getCsrfToken(): Promise<string> {
  // If we already have the token, return it
  if (csrfToken) {
    return csrfToken;
  }

  // If a request for the token is already in flight, wait for it to complete
  if (csrfTokenPromise) {
    return csrfTokenPromise;
  }

  // Otherwise, start a new request for the token
  csrfTokenPromise = (async () => {
    try {
      const res = await fetch('/api/auth/csrf');
      if (!res.ok) {
        throw new Error('Failed to fetch CSRF token');
      }
      const data = await res.json();
      csrfToken = data.csrfToken;
      return csrfToken as string;
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
      throw error;
    } finally {
      // Clear the promise so the next call will create a new request if needed
      csrfTokenPromise = null;
    }
  })();
  
  return csrfTokenPromise;
}

// Pre-fetch the token as soon as the app loads so it's ready for the first API call.
getCsrfToken();

type ApiOptions = Omit<RequestInit, 'body'> & {
  body?: any;
};

export async function api<T = any>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {}, ...rest } = options;

  const resolvedHeaders = new Headers(headers);

  if (body) {
    resolvedHeaders.set('Content-Type', 'application/json');
  }

  // Add the CSRF token to all state-changing requests
  if (['POST', 'PUT', 'DELETE'].includes(method.toUpperCase())) {
    const token = await getCsrfToken();
    if (token) {
      resolvedHeaders.set('X-CSRF-Token', token);
    }
  }

  const response = await fetch(endpoint, {
    method,
    headers: resolvedHeaders,
    credentials: 'include', // Always send cookies
    body: body ? JSON.stringify(body) : null,
    ...rest,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: `Request failed with status: ${response.status}` };
    }
    throw new Error(errorData.error || 'API request failed');
  }

  // Handle responses with no content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
