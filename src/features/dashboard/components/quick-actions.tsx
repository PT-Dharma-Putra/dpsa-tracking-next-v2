"use client"

import Link from "next/link"
import { PlusCircle, Upload, Users, FileText, ArrowRight, ShoppingCart } from "lucide-react"
import { useAuthStore } from "@/lib/auth-store"
import { cn } from "@/lib/utils"

export function QuickActions({ className }: { className?: string }) {
    const { user } = useAuthStore()
    const isAdmin = user?.roles?.some(r => r.name === 'SUPER_ADMIN' || r.name === 'ADMIN')

    // Define Actions Data
    const actions = [
        {
            title: "New Quotation",
            desc: "Create SPH manually",
            href: "/dashboard/tracking/new",
            icon: PlusCircle,
            color: "text-orange-600",
            bg: "bg-orange-50",
            border: "border-orange-100",
            primary: true
        },
        {
            title: "Import MDL",
            desc: "Upload Excel data",
            href: "/dashboard/mdl/import",
            icon: Upload,
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-blue-100"
        },
        {
            title: "Master Data",
            desc: "Manage catalog items",
            href: "/dashboard/mdl",
            icon: FileText,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            border: "border-emerald-100"
        },
        ...(isAdmin ? [{
            title: "Manage Users",
            desc: "Staff & Client access",
            href: "/dashboard/admin/users",
            icon: Users,
            color: "text-purple-600",
            bg: "bg-purple-50",
            border: "border-purple-100"
        }] : [])
    ]

    return (
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
            {actions.map((action, i) => (
                <Link key={i} href={action.href} className="group relative">
                    <div className={cn(
                        "h-full p-3 rounded-xl border transition-all duration-300",
                        "hover:shadow-md hover:-translate-y-1",
                        "bg-white",
                        action.primary ? "shadow-sm border-orange-200" : "border-neutral-200"
                    )}>
                        {/* Icon & Arrow Header */}
                        <div className="flex justify-between items-start mb-2">
                            <div className={cn(
                                "h-10 w-10 rounded-lg flex items-center justify-center",
                                action.bg, action.color
                            )}>
                                <action.icon className="h-5 w-5" />
                            </div>
                            <div className={cn(
                                "h-6 w-6 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100",
                                "bg-neutral-100 text-neutral-400 group-hover:bg-neutral-900 group-hover:text-white"
                            )}>
                                <ArrowRight className="h-3 w-3" />
                            </div>
                        </div>

                        {/* Text Content */}
                        <div>
                            <h3 className="font-bold text-neutral-900 leading-tight">
                                {action.title}
                            </h3>
                            <p className="text-xs text-neutral-500 font-medium mt-1">
                                {action.desc}
                            </p>
                        </div>
                    </div>
                </Link>
            ))}

        </div>
    )
}
