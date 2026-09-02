"use client"

import { useState } from "react"
import { TaskItTable } from "./_components/task-it-table"
import { useQuery } from "@tanstack/react-query"
import { ClipboardList, Loader2, Sparkles, CheckCircle2 } from "lucide-react"
import { taskItService } from "@/features/projects/services/task-it-service"

export default function TaskItPage() {
    const [statusFilter, setStatusFilter] = useState<string | null>(null)

    const { data: tasks, isLoading } = useQuery({
        queryKey: ["task-its"],
        queryFn: () => taskItService.getTasks(),
    })

    const totalCount = tasks?.length ?? 0
    const clientCount = tasks?.filter(t => t.tipe === 'Request Fitur' || t.tipe === 'Lapor Kendala' || t.user?.client_id).length ?? 0
    const completedCount = tasks?.filter(t => t.status.toLowerCase() === 'completed' || t.status.toLowerCase() === 'done' || t.status.toLowerCase() === 'selesai').length ?? 0
    const pendingCount = tasks?.filter(t => t.status.toLowerCase() === 'pending' || t.status.toLowerCase() === 'tunda').length ?? 0
    const inProgressCount = tasks?.filter(t => t.status.toLowerCase() === 'in progress' || t.status.toLowerCase() === 'progress' || t.status.toLowerCase() === 'sedang dikerjakan').length ?? 0

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight pt-4">Task IT</h1>
                <p className="text-sm text-muted-foreground">
                    Kelola daftar pekerjaan IT internal dan tiket masuk dari klien.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Total Tasks Card */}
                <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 h-1 w-full bg-neutral-400 group-hover:bg-neutral-500 transition-colors" />
                    <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Pekerjaan</p>
                        <p className="text-2xl font-black text-neutral-800 mt-1">{isLoading ? "..." : totalCount}</p>
                    </div>
                    <div className="h-9 w-9 rounded-lg bg-neutral-50 flex items-center justify-center border border-neutral-100 group-hover:scale-105 transition-transform">
                        <ClipboardList className="h-4 w-4 text-neutral-600" />
                    </div>
                </div>

                {/* Client Tickets Card */}
                <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 h-1 w-full bg-purple-500 group-hover:bg-purple-600 transition-colors" />
                    <div>
                        <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">Tiket Client</p>
                        <p className="text-2xl font-black text-purple-950 mt-1">{isLoading ? "..." : clientCount}</p>
                    </div>
                    <div className="h-9 w-9 rounded-lg bg-purple-50 flex items-center justify-center border border-purple-100 group-hover:scale-105 transition-transform">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                    </div>
                </div>

                {/* Pending Tasks Card */}
                <button
                    type="button"
                    onClick={() => setStatusFilter(statusFilter === "pending" ? null : "pending")}
                    className={`text-left bg-white border rounded-xl p-5 shadow-sm flex items-center justify-between transition-all duration-300 relative overflow-hidden group cursor-pointer w-full
                        ${statusFilter === "pending"
                            ? "border-yellow-400 ring-2 ring-yellow-300 shadow-yellow-100"
                            : "border-neutral-200 hover:shadow-md"
                        }`}
                >
                    <div className={`absolute top-0 left-0 h-1 w-full transition-colors ${statusFilter === "pending" ? "bg-yellow-500" : "bg-yellow-400 group-hover:bg-yellow-500"}`} />
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pekerjaan Pending</p>
                        <p className="text-3xl font-black text-neutral-800 mt-1">{isLoading ? "..." : pendingCount}</p>
                        {statusFilter === "pending" && (
                            <p className="text-xs text-yellow-600 font-semibold mt-0.5">Filter aktif</p>
                        )}
                    </div>
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center border transition-transform group-hover:scale-105
                        ${statusFilter === "pending" ? "bg-yellow-100 border-yellow-200" : "bg-yellow-50 border-yellow-100"}`}>
                        <Loader2 className="h-5 w-5 text-yellow-600 animate-pulse" />
                    </div>
                </button>

                {/* In Progress Tasks Card */}
                <button
                    type="button"
                    onClick={() => setStatusFilter(statusFilter === "inprogress" ? null : "inprogress")}
                    className={`text-left bg-white border rounded-xl p-5 shadow-sm flex items-center justify-between transition-all duration-300 relative overflow-hidden group cursor-pointer w-full
                        ${statusFilter === "inprogress"
                            ? "border-blue-400 ring-2 ring-blue-300 shadow-blue-100"
                            : "border-neutral-200 hover:shadow-md"
                        }`}
                >
                    <div className={`absolute top-0 left-0 h-1 w-full transition-colors ${statusFilter === "inprogress" ? "bg-blue-500" : "bg-blue-400 group-hover:bg-blue-500"}`} />
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sedang Dikerjakan</p>
                        <p className="text-3xl font-black text-neutral-800 mt-1">{isLoading ? "..." : inProgressCount}</p>
                        {statusFilter === "inprogress" && (
                            <p className="text-xs text-blue-600 font-semibold mt-0.5">Filter aktif</p>
                        )}
                    </div>
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center border transition-transform group-hover:scale-105
                        ${statusFilter === "inprogress" ? "bg-blue-100 border-blue-200" : "bg-blue-50 border-blue-100"}`}>
                        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" style={{ animationDuration: '3s' }} />
                    </div>
                </button>

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
                <TaskItTable statusFilter={statusFilter} onClearFilter={() => setStatusFilter(null)} />
            </div>
        </div>
    )
}
