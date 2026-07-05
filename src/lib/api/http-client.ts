import { ApiResponse } from '@/types/api.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class HttpClientError extends Error {
  statusCode: number;
  errorCode: string | null;
  details: any;

  constructor(message: string, statusCode: number, errorCode: string | null = null, details: any = null) {
    super(message);
    this.name = 'HttpClientError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...customConfig } = options;
  
  // 1. Resolve query params
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  // 2. Resolve headers (inject auth token if running on client)
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    const lang = localStorage.getItem('x-language') || 'en';
    defaultHeaders['x-language'] = lang;
  }

  const config: RequestInit = {
    method: customConfig.method || 'GET',
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    ...customConfig,
  };

  // 3. Fire fetch request
  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (err: any) {
    throw new HttpClientError(err.message || 'Network request failed', 0);
  }

  // 4. Parse JSON response
  let json: any;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    json = await response.json();
  }

  if (!response.ok) {
    // Backend formats errors as: { success: false, statusCode, message, errorCode, details }
    const errorMsg = json?.message || response.statusText || 'An error occurred';
    const errorCode = json?.errorCode || null;
    const details = json?.details || null;
    throw new HttpClientError(errorMsg, response.status, errorCode, details);
  }

  // Backend formats success responses as: { success: true, statusCode, message, data }
  if (json?.data !== undefined) {
    if (json.pagination !== undefined && typeof json.data === 'object' && json.data !== null) {
      Object.defineProperty(json.data, 'pagination', {
        value: json.pagination,
        writable: true,
        enumerable: false,
        configurable: true
      });
    }
    return json.data;
  }
  return json as T;
}

export const httpClient = {
  get: <T>(endpoint: string, options: RequestOptions = {}) =>
    request<T>(endpoint, { ...options, method: 'GET' }),
    
  post: <T>(endpoint: string, body: any, options: RequestOptions = {}) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
    
  put: <T>(endpoint: string, body: any, options: RequestOptions = {}) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
    
  patch: <T>(endpoint: string, body: any, options: RequestOptions = {}) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
    
  delete: <T>(endpoint: string, options: RequestOptions = {}) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
