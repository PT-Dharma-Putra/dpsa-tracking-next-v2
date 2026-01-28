"use client"

import { useAuthStore } from "@/lib/auth-store"
import { ProjectTicker } from "@/features/dashboard/components/project-ticker"
import { DashboardCalendar } from "@/features/dashboard/components/dashboard-calendar"
import { QuickActions } from "@/features/dashboard/components/quick-actions"
import { RecentActivity } from "@/features/dashboard/components/recent-activity"

export default function DashboardPage() {
    const { user } = useAuthStore()

    const currentDate = new Date().toLocaleDateString("en-GB", {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    })

    return (
        // Container utama dengan tinggi fix viewport agar tidak ada scroll ganda
        // 'overflow-hidden' di sini penting agar scroll hanya terjadi di dalam area konten
        <div className="h-[calc(100vh-theme(spacing.4))] w-full p-4 overflow-hidden bg-neutral-50/50">

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">

                {/* === KOLOM UTAMA (KIRI - 3/4 Layar) === */}
                <div className="lg:col-span-3 flex flex-col gap-4 h-full">

                    {/* 1. Header & Ticker digabung dalam satu blok visual */}
                    <div className="flex flex-col gap-3 shrink-0">
                        <div className="flex items-baseline justify-between px-1">
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-neutral-900">
                                    Hi, {user?.name?.split(" ")[0]}
                                </h1>
                                <p className="text-xs text-muted-foreground font-medium">{currentDate}</p>
                            </div>
                        </div>

                        {/* Ticker memanjang penuh di kolom utama */}
                        <div className="w-full">
                            <ProjectTicker />
                        </div>
                    </div>

                    {/* 2. Calendar mengambil sisa ruang vertikal */}
                    {/* card wrapper putih dengan shadow halus untuk memisahkan dari background */}
                    <div className="flex-1 min-h-0 bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-auto p-2">
                            {/* Asumsi DashboardCalendar responsif */}
                            <DashboardCalendar />
                        </div>
                    </div>
                </div>


                {/* === KOLOM PENDUKUNG (KANAN - 1/4 Layar) === */}
                {/* Ini membuat 'dinding' yang rapi di sebelah kanan */}
                <div className="lg:col-span-1 flex flex-col gap-4 h-full">

                    {/* 3. Quick Actions di kanan atas, mudah dijangkau */}
                    <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-3 shrink-0">
                        <h3 className="text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wider">Quick Actions</h3>
                        <QuickActions />
                    </div>

                    {/* 4. Activity Feed mengisi sisa ruang kanan bawah */}
                    <div className="flex-1 min-h-0 bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                        <div className="p-3 border-b border-neutral-100 bg-neutral-50">
                            <h3 className="text-sm font-semibold text-neutral-800">Latest Activity</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-0">
                            <RecentActivity />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}