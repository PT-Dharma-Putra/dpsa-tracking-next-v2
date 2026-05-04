"use client"

import * as React from "react"
import { ChevronRight } from "lucide-react"
import {
    SquareTerminal,
    FileBox,
    Files,
    Users,
    PieChart,
    LogOut,
    Settings,
    User as UserIcon,
    ChevronsUpDown,
    Building2
} from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarSeparator,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    useSidebar,
} from "@/components/ui/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { authService } from "@/features/auth/api/auth-service"
import { useAuthStore } from "@/lib/auth-store"
// import { CollapsibleContent } from "./ui/collapsible"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const router = useRouter()
    const pathname = usePathname()
    const { user, logout } = useAuthStore()
    const { isMobile } = useSidebar()

    const handleLogout = async () => {
        try {
            await authService.logout()
        } catch (e) {
            console.error("Logout failed", e)
        }
        logout()
        router.push("/auth/internal/login")
    }

    // Define menu items based on Role (Can be refined later)
    const userRoles = [
        ...(user?.role ? [user.role] : []),
        ...(user?.roles?.map(r => r.name) || [])
    ];
    const isAdmin = userRoles.includes("Super-Admin");

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === '/dashboard'
        return pathname.startsWith(href)
    }

    const data = {
        versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"],
        navMain: [
            {
                title: "Marketing",
                url: "#",
                allowedRoles: ["Super-Admin", "Marketing"],
                items: [
                    {
                    title: "Projects V2",
                    url: "/dashboard/projects-v2",
                    }
                ],
            },
            {
                title: "Studio",
                url: "#",
                allowedRoles: ["Super-Admin", "Studio"],
                items: [
                    {
                    title: "Daftar Perintah Kerja",
                    url: "/dashboard/projects-v2/perintah-kerja",
                    },
                ],
            },
            {
                title: "PPIC",
                url: "#",
                allowedRoles: ["Super-Admin", "PPIC"],
                items: [
                    {
                    title: "Project V2 | PPIC",
                    url: "/dashboard/projects-v2/perencanaan",
                    },
                ],
            },
            {
                title: "Produksi",
                url: "#",
                allowedRoles: ["Super-Admin", "Produksi"],
                items: [
                    {
                    title: "Project V2 | Produksi",
                    url: "/dashboard/projects-v2/produksi",
                    },
                ],
            },
        ].filter(group => {
            if (!user) return false;
            
            // Collect all user roles into a single list
            const userRoles = [
                ...(user.role ? [user.role] : []),
                ...(user.roles?.map(r => r.name) || [])
            ];

            // Check if any user role is in the group's allowedRoles
            return group.allowedRoles.some(allowed => userRoles.includes(allowed));
        }),
    }

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-orange-600 text-sidebar-primary-foreground">
                                <Building2 className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold uppercase">DPSA System</span>
                                <span className="truncate text-xs text-muted-foreground">Internal Ops</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {/* Main Group */}
                <SidebarGroup>
                    <SidebarGroupLabel>Platform</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Dashboard" isActive={isActive('/dashboard')}>
                                    <Link href="/dashboard">
                                        <SquareTerminal />
                                        <span>Dashboard</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Tracking" isActive={isActive('/dashboard/projects')}>
                                    <Link href="/dashboard/projects">
                                        <FileBox />
                                        <span>Project Tracking</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="MDL Catalog" isActive={isActive('/dashboard/mdl')}>
                                    <Link href="/dashboard/mdl">
                                        <Files />
                                        <span>Master Data List</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {isAdmin && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Administration</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild tooltip="User Management" isActive={isActive('/dashboard/admin/users')}>
                                        <Link href="/dashboard/admin/users">
                                            <Users />
                                            <span>User Management</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild tooltip="Reports" isActive={isActive('/dashboard/reports')}>
                                        <Link href="/dashboard/reports">
                                            <PieChart />
                                            <span>Analytics & Reports</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}

                {isAdmin && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Master Data</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild tooltip="User Management" isActive={isActive('/dashboard/admin/users')}>
                                        <Link href="/dashboard/master-data/divisi">
                                            <Users />
                                            <span>Divisi</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}

                {/* add sidebar collapse  */}
                 {data.navMain.map((item) => (
                    <Collapsible
                        key={item.title}
                        title={item.title}
                        defaultOpen
                        className="group/collapsible"
                    >
                        <SidebarGroup>
                        <SidebarGroupLabel
                            asChild
                            className="group/label text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        >
                            <CollapsibleTrigger>
                            {item.title}{" "}
                            <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                            </CollapsibleTrigger>
                        </SidebarGroupLabel>
                        <CollapsibleContent>
                            <SidebarGroupContent>
                            <SidebarMenu>
                                {item.items.map((subItem) => (
                                <SidebarMenuItem key={subItem.title}>
                                    <SidebarMenuButton asChild isActive={isActive(subItem.url)}>
                                    <a href={subItem.url}>{subItem.title}</a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                            </SidebarGroupContent>
                        </CollapsibleContent>
                        </SidebarGroup>
                    </Collapsible>
                    ))}

            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        {/* Placeholder Avatar */}
                                        <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.name || "User"}&background=f97316&color=fff`} alt={user?.name} />
                                        <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">{user?.name || "Guest"}</span>
                                        <span className="truncate text-xs">{user?.email || "guest@example.com"}</span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                                side={isMobile ? "bottom" : "right"}
                                align="end"
                                sideOffset={4}
                            >
                                <DropdownMenuLabel className="p-0 font-normal">
                                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                        <Avatar className="h-8 w-8 rounded-lg">
                                            <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.name || "User"}&background=f97316&color=fff`} alt={user?.name} />
                                            <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                                        </Avatar>
                                        <div className="grid flex-1 text-left text-sm leading-tight">
                                            <span className="truncate font-semibold">{user?.name || "Guest"}</span>
                                            <span className="truncate text-xs text-muted-foreground">{user?.roles?.[0]?.name || "Staff"}</span>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Account Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-red-500 hover:text-red-600">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
