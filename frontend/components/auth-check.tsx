"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/store/userContext";
import { Loader2 } from "lucide-react";

interface AuthCheckProps {
  children: React.ReactNode;
}

export function AuthCheck({ children }: AuthCheckProps) {
  const router = useRouter();
  const { user, isLoading, fetchUser } = useUser();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Check if we have a token in localStorage
      const token = localStorage.getItem("access_token");
      
      if (!token) {
        // No token, redirect to sign-in
        router.push("/sign-in");
        return;
      }
      
      // If we have a token but no user data, fetch it
      if (!user && token) {
        await fetchUser();
      }
      
      setIsChecking(false);
    };

    checkAuth();
  }, [user, router, fetchUser]);

  // Show loading state while checking authentication
  if (isLoading || isChecking) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not loading and we have a user, render the children
  return <>{children}</>;
}
