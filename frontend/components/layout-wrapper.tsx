import type React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "@/components/header"
import { SidebarInset } from "@/components/ui/sidebar"

interface LayoutWrapperProps {
  children: React.ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  return (
    <div className="flex min-h-screen w-full px-6">
      <AppSidebar />
      <SidebarInset className="w-full">
        <Header />
        <div className="flex-1 w-full p-0">{children}</div>
      </SidebarInset>
    </div>
  )
}
