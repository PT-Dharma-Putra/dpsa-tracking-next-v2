"use client"

import { useAuthStore } from "@/lib/auth-store"
import { StatsOverview } from "@/features/dashboard/components/internal/stats-overview"
import { DashboardCalendar } from "@/features/dashboard/components/dashboard-calendar"
import { QuickActions } from "@/features/dashboard/components/quick-actions"
import { IncomingOrdersWidget } from "@/features/dashboard/components/internal/incoming-orders-widget"
import { RecentActivity } from "@/features/dashboard/components/recent-activity"

export default function DashboardPage() {
    const { user } = useAuthStore()

    // Greeting Logic
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

    const currentDate = new Date().toLocaleDateString("en-US", {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] bg-neutral-50/50 p-3 md:p-4 overflow-hidden font-sans gap-3">

            {/* HEADER - Compact */}
            <div className="shrink-0 flex flex-col gap-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-neutral-900 leading-none">
                            {greeting}, <span className="text-neutral-600">{user?.name?.split(" ")[0]}</span>
                        </h1>
                        <p className="text-neutral-500 font-medium mt-1 flex items-center gap-2 text-xs">
                            <span className="bg-white border border-neutral-200 px-1.5 py-0.5 rounded text-neutral-600 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                Staff Portal
                            </span>
                            <span>{currentDate}</span>
                        </p>
                    </div>
                </div>

                {/* KPI Stats Row */}
                <StatsOverview />
            </div>

            {/* BENTO GRID LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">

                {/* PRIMARY COLUMN (Left - 8 cols) - Incoming Orders (Main Actionable Widget) */}
                <div className="lg:col-span-8 flex flex-col gap-3 min-h-0">
                    <div className="flex-1 min-h-[300px] overflow-hidden rounded-xl border border-neutral-200 shadow-sm bg-white">
                        <IncomingOrdersWidget />
                    </div>
                </div>

                {/* SECONDARY COLUMN (Right - 4 cols) - Stacked Widgets */}
                <div className="lg:col-span-4 flex flex-col gap-3 min-h-0 overflow-y-auto scrollbar-thin pr-0.5">

                    {/* 1. Quick Actions - Always visible */}
                    <div className="shrink-0">
                        <QuickActions className="grid-cols-2" />
                    </div>

                    {/* 2. Calendar - Compact month view */}
                    <div className="shrink-0 overflow-hidden rounded-xl border border-neutral-200 shadow-sm bg-white">
                        <DashboardCalendar />
                    </div>

                    {/* 3. Recent Activity - Fills remaining space */}
                    <div className="flex-1 min-h-[200px] bg-white border border-neutral-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
                        <RecentActivity />
                    </div>

                </div>

            </div>
        </div>
    )
}
