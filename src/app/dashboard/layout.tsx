"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useAuthStore } from "@/lib/auth-store"
import { DashboardBreadcrumb } from "@/components/dashboard-breadcrumb"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const { token, hydrated } = useAuthStore()
    const [isChecking, setIsChecking] = useState(true)

    useEffect(() => {
        // Wait for hydration
        if (!hydrated) return

        // Check token
        if (!token) {
            router.replace("/auth/internal/login")
        } else {
            setIsChecking(false)
        }
    }, [token, hydrated, router])

    if (!hydrated || isChecking) {
        return (
            <div className="flex h-screen items-center justify-center bg-neutral-50">
                <div className="flex flex-col items-center space-y-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
                    <p className="text-sm text-neutral-500">Verifying session...</p>
                </div>
            </div>
        )
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-neutral-200 bg-white px-4">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <DashboardBreadcrumb />
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-neutral-50/50">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
