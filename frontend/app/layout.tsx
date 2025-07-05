import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/toaster"
import { UserProvider } from "@/store/userContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "EmbedOrg - Document Embedding Application",
  description: "Embed your documents with ease",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <UserProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </UserProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  )
}
