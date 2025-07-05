"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { fetchWithAuth, clearAuthTokens } from '@/lib/authUtils';

// Define user type
export interface User {
  name: string;
  email: string;
  avatar?: string;
  "custom:role"?: string;
  [key: string]: any; // For any additional properties
}

// Define context type
interface UserContextType {
  user: User | null;
  isLoading: boolean;
  isInitializing: boolean; // Tracks initial auth check
  error: string | null;
  fetchUser: () => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

// Create context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider component
export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = useCallback(async (): Promise<void> => {
    // Skip if running on server
    if (typeof window === 'undefined') {
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("access_token");
      console.log('Current access token:', token ? 'Token exists' : 'No token found');
      
      if (!token) {
        console.log('No auth token found, skipping user fetch');
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        console.log('Attempting to fetch user from /me endpoint...');
        const userData = await fetchWithAuth<User>("/me");
        console.log("User Data received:", userData);
        
        if (!userData) {
          throw new Error('No user data returned from /me endpoint');
        }
        
        setUser(userData);
        
        // Check if user is admin
        console.log('User role:', userData["custom:role"]);
        const isUserAdmin = userData["custom:role"] === "amazonAdmi";
        console.log('User admin status:', isUserAdmin);
        setIsAdmin(isUserAdmin);
        
      } catch (fetchError) {
        console.error('Error in fetchWithAuth:', fetchError);
        // Clear invalid tokens if the fetch fails
        clearAuthTokens();
        setUser(null);
        setIsAdmin(false);
        throw fetchError;
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error("Error in fetchUser:", errorMessage, err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);



  // Check for existing session on initial load
  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;

    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (token) {
          try {
            await fetchUser();
          } catch (err) {
            console.error("Error fetching user on mount:", err);
            // Clear invalid tokens if the fetch fails
            if (err instanceof Error && (err.message.includes('401') || err.message.includes('403'))) {
              clearAuthTokens();
              if (isMounted) {
                setUser(null);
                setIsAdmin(false);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error in auth check:", err);
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    checkAuth();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [fetchUser]);

  

  const logout = useCallback(async (): Promise<void> => {
    try {
      // Use the fetchWithAuth utility
      await fetchWithAuth("/auth/logout", { method: "GET" });
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      // Clear tokens and reset state
      clearAuthTokens();
      setUser(null);
      setIsAdmin(false);
      
      // Clear any cached data that might be used to restore state
      if (typeof window !== 'undefined') {
        // Clear session storage and local storage
        sessionStorage.clear();
        
        // Clear specific items from localStorage if needed
        // localStorage.removeItem('specific-key');
        
        // Replace current history with sign-in page
        window.history.replaceState(null, '', '/sign-in');
        
        // Force a hard redirect to ensure all state is cleared
        window.location.href = '/sign-in';
      }
    }
  }, [router]);

  // Prevent flash of sign-in page when user is already authenticated
  useEffect(() => {
    if (!isInitializing && user) {
      router.push('/home');
    }
  }, [user, isInitializing, router]);

  return (
    <UserContext.Provider value={{ user, isLoading, isInitializing, error, fetchUser, logout, isAdmin }}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook to use the user context
export function useUser() {
  const context = useContext(UserContext);
  console.log("UserContext:", context);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
