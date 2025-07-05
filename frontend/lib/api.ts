/**
 * API utility functions
 * Provides helper functions for making API calls
 */

import { API_BASE_URL, AUTH_ENDPOINTS } from './config'

/**
 * Makes an authenticated API request
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Authentication API functions
 */
export const authApi = {
  /**
   * Log in a user
   */
  login: async (credentials: { username: string; password: string }) => {
    return apiRequest(AUTH_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  },

  /**
   * Register a new user
   */
  register: async (userData: any) => {
    return apiRequest(AUTH_ENDPOINTS.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  },

  /**
   * Log out the current user
   */
  logout: async () => {
    return apiRequest(AUTH_ENDPOINTS.LOGOUT, {
      method: 'POST',
    })
  },
}
