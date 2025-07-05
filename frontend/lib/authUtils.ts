/**
 * Authentication utilities for making API requests
 */

import { API_BASE_URL } from './config';

/**
 * Makes an authenticated API request with the current access token
 * @param endpoint API endpoint path (without base URL)
 * @param options Fetch options
 * @returns Promise with the response data
 */
export async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('access_token');
  
  const url = endpoint.startsWith('http') || endpoint.startsWith('https')
    ? endpoint 
    : `${API_BASE_URL}${endpoint}`;
  
  console.log(`Making request to: ${url}`);
  
  // Create a new headers object to avoid mutation issues
  const requestHeaders = new Headers(options.headers);
  
  // Set default content type if not already set
  if (!requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }
  
  // Add authorization if token exists
  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: requestHeaders,
      credentials: 'include', // Include cookies for cross-origin requests
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);

    // If unauthorized, clear tokens and throw specific error
    if (response.status === 401) {
      clearAuthTokens();
      throw new Error('Session expired. Please log in again.');
    }

    // Handle other error statuses
    if (!response.ok) {
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If we can't parse JSON, use the status text
        console.error('Failed to parse error response:', e);
      }
      throw new Error(errorMessage);
    }

    // For 204 No Content responses, return empty object
    if (response.status === 204) {
      return {} as T;
    }

    // Parse JSON with proper type casting
    try {
      const data = await response.json();
      console.log('Response data:', data);
      return data as T;
    } catch (e) {
      console.error('Failed to parse JSON response:', e);
      throw new Error('Invalid response from server');
    }
  } catch (error) {
    console.error('Network error:', error);
    if (error instanceof Error) {
      throw new Error(`Network error: ${error.message}`);
    }
    throw new Error('An unknown network error occurred');
  }
}

/**
 * Check if user is authenticated
 * @returns boolean indicating if user has an access token
 */
export function isAuthenticated(): boolean {
  // Skip during SSR
  if (typeof window === 'undefined') {
    return false;
  }
  return !!localStorage.getItem('access_token');
}

/**
 * Clear all authentication tokens
 */
export function clearAuthTokens(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('id_token');
  localStorage.removeItem('refresh_token');
}
