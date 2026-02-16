"use client"

import { useQuery } from "@tanstack/react-query"
import { InternalDashboardService, DashboardOverview } from "@/features/dashboard/services/internal-dashboard-service"
import {
    Briefcase,
    Clock,
    AlertTriangle,
    CheckCircle2,
    TrendingUp,
    Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCard {
    label: string
    value: number | string
    icon: React.ElementType
    color: string
    bg: string
    border: string
    suffix?: string
}

export function StatsOverview() {
    const { data, isLoading, isError } = useQuery<DashboardOverview>({
        queryKey: ['dashboard-overview'],
        queryFn: InternalDashboardService.getOverview,
        refetchInterval: 30000
    })

    const stats: StatCard[] = [
        {
            label: "Active Projects",
            value: data?.in_progress_count ?? 0,
            icon: Briefcase,
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-blue-100",
        },
        {
            label: "Pending Orders",
            value: data?.pending_count ?? 0,
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-50",
            border: "border-amber-100",
        },
        {
            label: "Overdue",
            value: data?.overdue_count ?? 0,
            icon: AlertTriangle,
            color: "text-red-600",
            bg: "bg-red-50",
            border: "border-red-100",
        },
        {
            label: "Completion Rate",
            value: data?.completion_rate ?? 0,
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            border: "border-emerald-100",
            suffix: "%",
        },
    ]

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-[76px] rounded-xl border border-neutral-100 bg-white animate-pulse">
                        <div className="p-3 flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-neutral-100" />
                            <div className="flex-1 space-y-2">
                                <div className="h-2.5 w-16 bg-neutral-100 rounded" />
                                <div className="h-5 w-10 bg-neutral-100 rounded" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (isError) {
        return (
            <div className="rounded-xl border border-red-100 bg-red-50/50 p-3 text-center">
                <p className="text-xs text-red-600 font-medium">Failed to load dashboard stats</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((stat) => (
                <div
                    key={stat.label}
                    className={cn(
                        "rounded-xl border bg-white p-3 transition-all hover:shadow-sm",
                        stat.border
                    )}
                >
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                            stat.bg
                        )}>
                            <stat.icon className={cn("h-4 w-4", stat.color)} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider truncate">
                                {stat.label}
                            </p>
                            <p className={cn("text-xl font-bold leading-tight", stat.color)}>
                                {stat.value}{stat.suffix}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
