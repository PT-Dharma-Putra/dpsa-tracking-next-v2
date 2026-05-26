"use client"

import { TaskItTable } from "./_components/task-it-table"
import { useQuery } from "@tanstack/react-query"
import { ClipboardList, Loader2 } from "lucide-react"
import { taskItService } from "@/features/projects/services/task-it-service"

export default function TaskItPage() {
    const { data: tasks, isLoading } = useQuery({
        queryKey: ["task-its"],
        queryFn: () => taskItService.getTasks(),
    })

    const totalCount = tasks?.length ?? 0
    const completedCount = tasks?.filter(t => t.status.toLowerCase() === 'completed' || t.status.toLowerCase() === 'done' || t.status.toLowerCase() === 'selesai').length ?? 0
    const pendingCount = tasks?.filter(t => t.status.toLowerCase() === 'pending' || t.status.toLowerCase() === 'tunda').length ?? 0
    const inProgressCount = tasks?.filter(t => t.status.toLowerCase() === 'in progress' || t.status.toLowerCase() === 'progress' || t.status.toLowerCase() === 'sedang dikerjakan').length ?? 0

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight pt-4">Task IT</h1>
                <p className="text-sm text-muted-foreground">
                    Kelola daftar pekerjaan IT untuk operasional internal.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Total Tasks Card */}
                <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 h-1 w-full bg-neutral-400 group-hover:bg-neutral-500 transition-colors" />
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Pekerjaan</p>
                        <p className="text-3xl font-black text-neutral-800 mt-1">{isLoading ? "..." : totalCount}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-neutral-50 flex items-center justify-center border border-neutral-100 group-hover:scale-105 transition-transform">
                        <ClipboardList className="h-5 w-5 text-neutral-600" />
                    </div>
                </div>

                {/* Pending Tasks Card */}
                <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 h-1 w-full bg-yellow-400 group-hover:bg-yellow-500 transition-colors" />
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pekerjaan Pending</p>
                        <p className="text-3xl font-black text-neutral-800 mt-1">{isLoading ? "..." : pendingCount}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-yellow-50 flex items-center justify-center border border-yellow-100 group-hover:scale-105 transition-transform">
                        <Loader2 className="h-5 w-5 text-yellow-600 animate-pulse" />
                    </div>
                </div>

                {/* In Progress Tasks Card */}
                <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 h-1 w-full bg-blue-400 group-hover:bg-blue-500 transition-colors" />
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sedang Dikerjakan</p>
                        <p className="text-3xl font-black text-neutral-800 mt-1">{isLoading ? "..." : inProgressCount}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100 group-hover:scale-105 transition-transform">
                        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" style={{ animationDuration: '3s' }} />
                    </div>
                </div>

                {/* Completed Tasks Card */}
                <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 h-1 w-full bg-green-500 group-hover:bg-green-600 transition-colors" />
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pekerjaan Selesai</p>
                        <p className="text-3xl font-black text-neutral-800 mt-1">{isLoading ? "..." : completedCount}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center border border-green-100 group-hover:scale-105 transition-transform">
                        <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
                <TaskItTable />
            </div>
        </div>
    )
}
