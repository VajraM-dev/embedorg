"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FolderKanban, Users, Settings, Home } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useUser } from "@/store/userContext"

export function AppSidebar() {
  const pathname = usePathname()

  // Don't show sidebar on sign-in page
  if (pathname === "/sign-in") {
    return null
  }

  // Use the centralized user context
  const { isAdmin } = useUser()

  const menuItems = [
    {
      title: "Dashboard",
      icon: Home,
      href: "/home",
    },
   {
      title: "Teams",
      icon: Users,
      href: "/teams",
    },
    {
      title: "Projects",
      icon: FolderKanban,
      href: "/projects",
    },
    // {
    //   title: "Settings",
    //   icon: Settings,
    //   href: "/settings",
    // },
  ]

  return (
    <Sidebar>
      <SidebarHeader className="flex h-14 items-center border-b border-border/40 px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Link href="/home" className="flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors">
          <div className="mt-2">
            <svg width="41" height="30" viewBox="0 0 51 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.446 0L22.7801 8.82887C23.3936 9.35302 23.7473 10.1222 23.7473 10.9323V17.5862L13.4131 8.75734C12.7996 8.23319 12.446 7.464 12.446 6.65386V0Z" className="fill-primary"></path>
              <path d="M12.446 40L22.7801 31.1711C23.3936 30.647 23.7473 29.8778 23.7473 29.0677V22.4138L13.4131 31.2427C12.7996 31.7668 12.446 32.536 12.446 33.3461V40Z" className="fill-primary"></path>
              <path d="M0.117188 9.31034L10.3108 17.9705C10.805 18.3904 11.4308 18.6207 12.0775 18.6207H20.2982L10.1297 9.96253C9.63514 9.54141 9.00837 9.31034 8.36065 9.31034H0.117188Z" className="fill-primary"></path>
              <path d="M0.117188 30.6897L10.2481 22.0345C10.7432 21.6115 11.3713 21.3793 12.0206 21.3793H20.3227L10.1291 30.0394C9.63487 30.4593 9.00904 30.6897 8.36236 30.6897H0.117188Z" className="fill-primary"></path>
              <path d="M37.7884 0L27.4542 8.82887C26.8407 9.35302 26.4871 10.1222 26.4871 10.9323V17.5862L36.8212 8.75734C37.4347 8.23319 37.7884 7.464 37.7884 6.65386V0Z" className="fill-primary"></path>
              <path d="M37.7884 40L27.4542 31.1711C26.8407 30.647 26.4871 29.8778 26.4871 29.0677V22.4138L36.8212 31.2427C37.4347 31.7668 37.7884 32.536 37.7884 33.3461V40Z" className="fill-primary"></path>
              <path d="M50.1172 9.31034L39.9236 17.9705C39.4294 18.3904 38.8035 18.6207 38.1569 18.6207H29.9361L40.1047 9.96253C40.5992 9.54141 41.226 9.31034 41.8737 9.31034H50.1172Z" className="fill-primary"></path>
              <path d="M50.1172 30.6897L39.9863 22.0345C39.4912 21.6115 38.863 21.3793 38.2137 21.3793H29.9117L40.1052 30.0394C40.5995 30.4593 41.2253 30.6897 41.872 30.6897H50.1172Z" className="fill-primary"></path>
            </svg>
          </div>
          <span className="hidden group-data-[collapsible=icon]:hidden">EmbedOrg</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-2 py-4">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === item.href} 
                tooltip={item.title}
                className="group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-3"
              >
                <Link href={item.href} className="group relative">
                  <item.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                  <span className="transition-all duration-200 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:left-12 group-data-[collapsible=icon]:whitespace-nowrap group-data-[collapsible=icon]:px-3 group-data-[collapsible=icon]:py-1 group-data-[collapsible=icon]:text-sm group-data-[collapsible=icon]:rounded-md group-data-[collapsible=icon]:bg-popover group-data-[collapsible=icon]:text-popover-foreground group-data-[collapsible=icon]:shadow-md group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:invisible group-data-[collapsible=icon]:group-hover:opacity-100 group-data-[collapsible=icon]:group-hover:visible">
                    {item.title}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}
