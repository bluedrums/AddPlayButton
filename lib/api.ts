// lib/api.ts
let csrfToken: string | null = null;

async function getCsrfToken(): Promise<string> {
  if (csrfToken) {
    return csrfToken;
  }

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
    // Invalidate the token so we retry next time
    csrfToken = null; 
    throw error;
  }
}

// Call this once when the app initializes
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

  if (['POST', 'PUT', 'DELETE'].includes(method.toUpperCase())) {
    const token = await getCsrfToken();
    if (token) {
      resolvedHeaders.set('X-CSRF-Token', token);
    }
  }

  const response = await fetch(endpoint, {
    method,
    headers: resolvedHeaders,
    credentials: 'include',
    body: body ? JSON.stringify(body) : null,
    ...rest,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API request failed: ${response.statusText}`);
  }

  // Invalidate CSRF token after a successful state-changing request
  if (['POST', 'PUT', 'DELETE'].includes(method.toUpperCase())) {
    csrfToken = null;
    getCsrfToken();
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
