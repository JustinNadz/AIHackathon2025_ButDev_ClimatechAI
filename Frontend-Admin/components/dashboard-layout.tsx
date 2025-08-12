"use client"

import type React from "react"
import { useEffect, useState } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  TrendingUp,
  AlertTriangle,
  FileText,
  Settings,
  HelpCircle,
  Bell,
  User,
  Shield,
  ChevronDown,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { usePathname } from "next/navigation"

const menuItems = [
  { title: "Dashboard Overview", icon: LayoutDashboard, url: "/dashboard" },
  { title: "Emergency Protocols", icon: AlertTriangle, url: "/dashboard/emergency" },
  { title: "Reports & Logs", icon: FileText, url: "/dashboard/reports" },
  { title: "System and User Management", icon: Settings, url: "/dashboard/admin" },
  { title: "Help & Support", icon: HelpCircle, url: "/dashboard/help" },
]

function AppSidebar() {
  const pathname = usePathname()
  
  return (
    <Sidebar className="border-r border-blue-200">
      <SidebarHeader className="border-b border-blue-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-blue-900" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-blue-900">ClimaTech AI</h2>
            <p className="text-xs text-blue-600">Disaster Management</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-blue-700 font-semibold">Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = pathname === item.url || 
                  (item.url === "/dashboard" && pathname === "/dashboard") ||
                  (item.url !== "/dashboard" && pathname.startsWith(item.url))
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="text-blue-700 hover:bg-blue-50 data-[active=true]:bg-blue-100 data-[active=true]:text-blue-900"
                    >
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>


    </Sidebar>
  )
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

function MainContent({ children }: { children: React.ReactNode }) {
  const { state } = useSidebar();
  const [sidebarState, setSidebarState] = useState(state);
  
  useEffect(() => {
    setSidebarState(state);
    
    // Force layout recalculation on sidebar state change
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event('resize'));
    }
  }, [state]);
  
  return (
    <div 
      className={`flex-1 flex flex-col min-w-0 max-w-full transition-all duration-200 ${
        sidebarState === "collapsed" ? "sidebar-collapsed" : "sidebar-expanded"
      }`}
    >
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <SidebarTrigger className="text-blue-700" />
            <h1 className="text-2xl font-bold text-blue-900">Dashboard Overview</h1>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-blue-700" />
              <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 bg-red-500 text-white text-xs flex items-center justify-center">
                3
              </Badge>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-700" />
                  </div>
                  <span className="text-blue-700">Admin User</span>
                  <ChevronDown className="w-4 h-4 text-blue-700" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content with proper padding and overflow handling */}
      <main className="flex-1 p-6 overflow-x-auto">
        <div className="w-full max-w-full">{children}</div>
      </main>
    </div>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="relative flex min-h-screen bg-gray-50 w-full overflow-hidden">
        <AppSidebar />
        <MainContent>{children}</MainContent>
      </div>
    </SidebarProvider>
  )
}
