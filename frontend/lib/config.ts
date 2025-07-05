/**
 * Application configuration
 * Contains environment-specific settings that can be imported throughout the app
 */

// API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7410'

// Auth endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
}

// Other API endpoints can be added here
export const API_ENDPOINTS = {
  // Add your other endpoints here
}
