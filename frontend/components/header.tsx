"use client"
import { usePathname } from "next/navigation"
import { Bell, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/store/userContext";


export function Header() {
  const pathname = usePathname()
  const params = useParams();
  const router = useRouter();

  // Don't show header on sign-in page
  if (pathname === "/sign-in") {
    return null
  }

  // Use the centralized user context
  const { user, logout } = useUser();
  
  const handleLogout = async () => {
    await logout();
    router.push("/sign-in");
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6 w-full">
      <div className="hidden md:block">
        <SidebarTrigger />
      </div>
      <div className="hidden md:block md:w-full max-w-md">
        {/* <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
          />
        </div> */}
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <ThemeToggle />
        {/* <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button> */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={`https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(user?.name || user?.email || '')}`}
                  alt={user?.name || user?.email || 'User Avatar'}
                />
                <AvatarFallback>
                  {user?.name
                    ? user?.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                    : user?.email
                    ? user?.email[0].toUpperCase()
                    : 'DU'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* <DropdownMenuItem>Profile</DropdownMenuItem> */}
            {/* <DropdownMenuItem onClick={() => router.push("/settings") }>Settings</DropdownMenuItem> */}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
