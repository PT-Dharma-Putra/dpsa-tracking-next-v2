"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ProjectService, Project } from "@/features/projects/services/project-service"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Loader2,
    AlertCircle,
    Clock,
    ChevronRight,
    Inbox,
    Building2,
    CalendarDays,
    ArrowRight,
    Layers
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

// Phase labels
const PHASES: Record<number, string> = {
    1: "Commercial",
    2: "Preparation",
    3: "Manufacturing",
    4: "Delivery",
}

// Status config
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    Pending: { label: "Pending", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", dot: "bg-amber-400" },
    Negotiation: { label: "Negotiation", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", dot: "bg-blue-400" },
    In_Progress: { label: "In Progress", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200", dot: "bg-indigo-400" },
    in_progress: { label: "In Progress", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200", dot: "bg-indigo-400" },
    Quality_Check: { label: "QC", color: "text-purple-700", bg: "bg-purple-50 border-purple-200", dot: "bg-purple-400" },
    quality_check: { label: "QC", color: "text-purple-700", bg: "bg-purple-50 border-purple-200", dot: "bg-purple-400" },
    Delivery: { label: "Delivery", color: "text-cyan-700", bg: "bg-cyan-50 border-cyan-200", dot: "bg-cyan-400" },
    Completed: { label: "Completed", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-400" },
    completed: { label: "Completed", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-400" },
}

const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG[status.replace(/ /g, "_")] || {
        label: status.replace(/_/g, " "),
        color: "text-neutral-700",
        bg: "bg-neutral-50 border-neutral-200",
        dot: "bg-neutral-400",
    }
}

// Filter tabs
const FILTER_TABS = [
    { key: "all", label: "All" },
    { key: "Pending", label: "Pending" },
    { key: "active", label: "Active" },
    { key: "completed", label: "Done" },
]

export function IncomingOrdersWidget() {
    const router = useRouter()
    const [activeFilter, setActiveFilter] = useState("all")

    const { data: projects, isLoading, isError, refetch } = useQuery({
        queryKey: ['projects', 'all-dashboard'],
        queryFn: () => ProjectService.getProjects(),
        refetchInterval: 30000,
    })

    const allProjects: any[] = Array.isArray(projects?.data) ? projects.data : (Array.isArray(projects) ? projects : [])

    // Filter logic
    const filteredProjects = allProjects.filter((p: any) => {
        if (activeFilter === "all") return true
        if (activeFilter === "Pending") return p.status === "Pending"
        if (activeFilter === "active") return !["Pending", "Completed", "completed"].includes(p.status)
        if (activeFilter === "completed") return ["Completed", "completed"].includes(p.status)
        return true
    })

    // Counts for tabs
    const counts = {
        all: allProjects.length,
        Pending: allProjects.filter((p: any) => p.status === "Pending").length,
        active: allProjects.filter((p: any) => !["Pending", "Completed", "completed"].includes(p.status)).length,
        completed: allProjects.filter((p: any) => ["Completed", "completed"].includes(p.status)).length,
    }

    // Loading skeleton
    if (isLoading) {
        return (
            <div className="h-full flex flex-col">
                <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/30">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="h-8 w-8 rounded-lg bg-neutral-100 animate-pulse" />
                        <div className="space-y-1.5">
                            <div className="h-3.5 w-28 bg-neutral-100 rounded animate-pulse" />
                            <div className="h-2.5 w-20 bg-neutral-100 rounded animate-pulse" />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-7 w-16 bg-neutral-100 rounded-full animate-pulse" />
                        ))}
                    </div>
                </div>
                <div className="flex-1 p-3 space-y-2.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-[72px] rounded-lg border border-neutral-100 bg-neutral-50/50 animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    // Error state
    if (isError) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
                    <AlertCircle className="h-6 w-6 text-red-400" />
                </div>
                <p className="text-sm font-medium text-neutral-700 mb-1">Failed to load projects</p>
                <p className="text-xs text-neutral-500 mb-3">Something went wrong fetching project data.</p>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs">
                    Try Again
                </Button>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header + Filter Tabs */}
            <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/30 shrink-0">
                <div className="flex justify-between items-center mb-2.5">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
                            <Layers className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-neutral-800 leading-none">Project Orders</h3>
                            <p className="text-[10px] text-neutral-500 mt-0.5">
                                {allProjects.length} Total Project{allProjects.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs hover:bg-neutral-100" asChild>
                        <Link href="/dashboard/projects">
                            View All <ChevronRight className="h-3 w-3 ml-1" />
                        </Link>
                    </Button>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-1">
                    {FILTER_TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveFilter(tab.key)}
                            className={cn(
                                "px-2.5 py-1 rounded-full text-[11px] font-medium transition-all",
                                activeFilter === tab.key
                                    ? "bg-neutral-900 text-white shadow-sm"
                                    : "bg-white text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
                            )}
                        >
                            {tab.label}
                            <span className={cn(
                                "ml-1 text-[10px]",
                                activeFilter === tab.key ? "text-neutral-400" : "text-neutral-400"
                            )}>
                                {counts[tab.key as keyof typeof counts]}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Project Cards */}
            <ScrollArea className="flex-1">
                <div className="p-3 space-y-2">
                    {filteredProjects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[200px] text-neutral-400">
                            <div className="h-12 w-12 rounded-full bg-neutral-50 flex items-center justify-center mb-3">
                                <Inbox className="h-6 w-6 text-neutral-300" />
                            </div>
                            <p className="text-sm font-medium text-neutral-600 mb-0.5">No projects found</p>
                            <p className="text-xs text-neutral-400">
                                {activeFilter === "all" ? "No projects yet." : `No ${FILTER_TABS.find(t => t.key === activeFilter)?.label.toLowerCase()} projects.`}
                            </p>
                        </div>
                    ) : (
                        filteredProjects.slice(0, 15).map((project: any) => {
                            const status = getStatusConfig(project.status)
                            const phase = PHASES[project.current_phase] || `Phase ${project.current_phase}`
                            const phaseProgress = Math.min(((project.current_phase || 1) / 4) * 100, 100)

                            const rawDate = project.created_at || project.updated_at || project.start_date
                            const date = rawDate ? new Date(rawDate) : null
                            const isValidDate = date && !isNaN(date.getTime())

                            return (
                                <div
                                    key={project.id}
                                    onClick={() => router.push(`/dashboard/tracking/${project.id}`)}
                                    className="group p-3 rounded-xl border border-neutral-150 bg-white hover:border-orange-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                                >
                                    {/* Top Row: Name + Status */}
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-[13px] font-bold text-neutral-900 truncate group-hover:text-orange-600 transition-colors">
                                                {project.name}
                                            </h4>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Building2 className="h-3 w-3 text-neutral-400 shrink-0" />
                                                <span className="text-[11px] text-neutral-500 truncate">
                                                    {project.client?.name || "Unknown Client"}
                                                </span>
                                            </div>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "text-[10px] px-1.5 py-0 h-5 font-semibold shadow-none shrink-0 border",
                                                status.bg,
                                                status.color
                                            )}
                                        >
                                            <span className={cn("w-1.5 h-1.5 rounded-full mr-1", status.dot)} />
                                            {status.label}
                                        </Badge>
                                    </div>

                                    {/* Bottom Row: Phase Progress + Date + Arrow */}
                                    <div className="flex items-center gap-3">
                                        {/* Phase progress bar */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[10px] font-medium text-neutral-500">{phase}</span>
                                                <span className="text-[10px] text-neutral-400">{project.current_phase || 1}/4</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${phaseProgress}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Date */}
                                        <div className="flex items-center gap-1 text-[10px] text-neutral-400 shrink-0">
                                            <CalendarDays className="h-3 w-3" />
                                            <span>
                                                {isValidDate
                                                    ? formatDistanceToNow(date, { addSuffix: true })
                                                    : "-"
                                                }
                                            </span>
                                        </div>

                                        {/* Arrow */}
                                        <div className="h-6 w-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-orange-50 text-orange-500 shrink-0">
                                            <ArrowRight className="h-3 w-3" />
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}
