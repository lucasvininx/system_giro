"use client"

import Link from "next/link"
import { LayoutDashboard, Users, Briefcase, Handshake, Settings, LogOut, ChevronFirst, ChevronLast } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/login/actions"

interface AppSidebarProps {
  userRole: string
}

export function AppSidebar({ userRole }: AppSidebarProps) {
  const { state, toggleSidebar } = useSidebar()

  const menuItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "USER"] },
    { href: "/operacoes", label: "Minhas Operações", icon: Briefcase, roles: ["ADMIN", "USER"] },
    { href: "/parceiros", label: "Parceiros", icon: Handshake, roles: ["ADMIN", "USER"] },
    { href: "/usuarios", label: "Usuários", icon: Users, roles: ["ADMIN"] },
    { href: "/configuracoes", label: "Configurações", icon: Settings, roles: ["ADMIN", "USER"] },
  ]

  return (
    <Sidebar>
      <SidebarHeader className="p-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/placeholder.svg?width=32&height=32" alt="Giro Capital Logo" className="h-8 w-8" />
          {state === "expanded" && <h1 className="text-xl font-bold text-primary">Giro Capital</h1>}
        </Link>
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hidden md:flex">
          {state === "expanded" ? <ChevronFirst /> : <ChevronLast />}
        </Button>
      </SidebarHeader>
      <SidebarContent className="flex-1">
        <SidebarMenu>
          {menuItems
            .filter((item) => item.roles.includes(userRole))
            .map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild>
                  <Link href={item.href}>
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <form action={logout} className="w-full">
              <SidebarMenuButton type="submit" className="w-full">
                <LogOut className="h-5 w-5" />
                <span>Sair</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
