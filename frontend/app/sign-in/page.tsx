"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/store/userContext";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function SignInPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { fetchUser, isInitializing } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  // Prevent going back to the application after logout
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Clear any existing history
      window.history.pushState(null, '', window.location.href);
      
      // Add event listener to prevent back navigation
      const handleBackButton = (e: PopStateEvent) => {
        e.preventDefault();
        window.history.pushState(null, '', window.location.href);
        // Force reload to ensure no cached content is shown
        window.location.reload();
      };
      
      window.addEventListener('popstate', handleBackButton);
      
      // Push another state to prevent back navigation
      window.history.pushState(null, '', window.location.href);
      
      // Cleanup
      return () => {
        window.removeEventListener('popstate', handleBackButton);
      };
    }
  }, []);

  // Show loading state while checking auth
  if (isInitializing) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground"></p>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    //call api to authenticate
    const response = await fetch(API_BASE_URL + "/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      setIsLoading(false);
      const errorData = await response
        .json()
        .catch(() => ({ message: "Login failed" }));
      toast({
        variant: "destructive",
        title: "Authentication failed",
        description: errorData.message || "Invalid username or password",
      });
      return;
    }

    const data = await response.json();
    if (data.success) {
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      setIsLoading(false);
      localStorage.setItem("access_token", data.data.AuthenticationResult.AccessToken);
      localStorage.setItem("id_token", data.data.AuthenticationResult.IdToken);
      localStorage.setItem("refresh_token", data.data.AuthenticationResult.RefreshToken);
      
      // Fetch user data after successful login
      await fetchUser();
      
      // Navigate to home page
      router.push("/home");
    } else {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Authentication failed",
        description: data.message || "Invalid username or password",
      });
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background overflow-hidden">
      {/* Decorative top-right circle */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-[750px] w-[750px] rounded-full bg-blue-50 dark:bg-blue-900/20 z-0" />
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <div className="flex flex-col items-center w-full z-10">
        {/* Centered logo above card */}
        <div className="flex items-center space-x-2 mb-8">
          <svg
            width="51"
            height="40"
            viewBox="0 0 51 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12.446 0L22.7801 8.82887C23.3936 9.35302 23.7473 10.1222 23.7473 10.9323V17.5862L13.4131 8.75734C12.7996 8.23319 12.446 7.464 12.446 6.65386V0Z"
              fill="#2563eb"
            ></path>
            <path
              d="M12.446 40L22.7801 31.1711C23.3936 30.647 23.7473 29.8778 23.7473 29.0677V22.4138L13.4131 31.2427C12.7996 31.7668 12.446 32.536 12.446 33.3461V40Z"
              fill="#2563eb"
            ></path>
            <path
              d="M0.117188 9.31034L10.3108 17.9705C10.805 18.3904 11.4308 18.6207 12.0775 18.6207H20.2982L10.1297 9.96253C9.63514 9.54141 9.00837 9.31034 8.36065 9.31034H0.117188Z"
              fill="#2563eb"
            ></path>
            <path
              d="M0.117188 30.6897L10.2481 22.0345C10.7432 21.6115 11.3713 21.3793 12.0206 21.3793H20.3227L10.1291 30.0394C9.63487 30.4593 9.00904 30.6897 8.36236 30.6897H0.117188Z"
              fill="#2563eb"
            ></path>
            <path
              d="M37.7884 0L27.4542 8.82887C26.8407 9.35302 26.4871 10.1222 26.4871 10.9323V17.5862L36.8212 8.75734C37.4347 8.23319 37.7884 7.464 37.7884 6.65386V0Z"
              fill="#2563eb"
            ></path>
            <path
              d="M37.7884 40L27.4542 31.1711C26.8407 30.647 26.4871 29.8778 26.4871 29.0677V22.4138L36.8212 31.2427C37.4347 31.7668 37.7884 32.536 37.7884 33.3461V40Z"
              fill="#2563eb"
            ></path>
            <path
              d="M50.1172 9.31034L39.9236 17.9705C39.4294 18.3904 38.8035 18.6207 38.1569 18.6207H29.9361L40.1047 9.96253C40.5992 9.54141 41.226 9.31034 41.8737 9.31034H50.1172Z"
              fill="#2563eb"
            ></path>
            <path
              d="M50.1172 30.6897L39.9863 22.0345C39.4912 21.6115 38.863 21.3793 38.2137 21.3793H29.9117L40.1052 30.0394C40.5995 30.4593 41.2253 30.6897 41.872 30.6897H50.1172Z"
              fill="#2563eb"
            ></path>
          </svg>
          <span className="text-lg font-semibold text-foreground">EmbedOrg</span>
        </div>
        <div className="w-full max-w-md">
          <div className="rounded-lg border bg-card text-card-foreground p-8 shadow-sm w-full">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
              <p className="text-sm text-muted-foreground">Sign in to your account</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="pl-8"
                  />
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-400"
                    >
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="pl-8 pr-10"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-400"
                    >
                      <rect
                        width="18"
                        height="11"
                        x="3"
                        y="11"
                        rx="2"
                        ry="2"
                      ></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
            <div className="mt-4 text-center text-xs text-muted-foreground">
              Don't have an account?{" "}
              <span className="underline text-foreground hover:text-primary transition-colors">Contact your administrator</span>
            </div>
            {/* <div className="mt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={() => {
                toast({
                  title: "Test Toast",
                  description: "This is a test toast notification",
                })
              }}
            >
              Test Toast
            </Button>
          </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
