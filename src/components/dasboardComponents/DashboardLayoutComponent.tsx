"use client"

import type React from "react"
import { Building2, LayoutDashboard, Bot, FileText, Users, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter, usePathname } from "next/navigation"
import { UserProfile } from "./UserProfile"

const navItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/overview" },
  { icon: Bot, label: "AI Agents", path: "/agents" },
  { icon: FileText, label: "Blueprints", path: "/blueprints" },
  { icon: Users, label: "Subcontractors", path: "/subcontractors" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
]

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

export function DashboardLayout({ 
  children, 
  activeSection, 
  onSectionChange 
}: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  return (
    <div className="flex h-screen bg-background dark">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Building2 className="w-6 h-6 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-sidebar-foreground">BuildCRM</h1>
              <p className="text-xs text-sidebar-foreground/60">Construction Manager</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.label}>
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
                    pathname === item.path
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <UserProfile />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  )
}
