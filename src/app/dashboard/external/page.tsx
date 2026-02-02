"use client"

import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "@/lib/auth-store"
import { ActivityTicker } from "@/features/dashboard/components/client/activity-ticker"
import { ClientProjectCard } from "@/features/dashboard/components/client/project-card"
import { ClientService } from "@/features/dashboard/services/client-service"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { ActionCenter } from "@/features/dashboard/components/client/action-center"

export default function ClientDashboardPage() {
    // OLD MOCK DATA REMOVED

    const { user } = useAuthStore()

    const { data: projects = [], isLoading } = useQuery({
        queryKey: ["client-projects"],
        queryFn: ClientService.getMyProjects
    });

    // Calculate Stats
    const activeProjects = projects.filter(p => !['done', 'cancelled', 'deleted'].includes(p.status.toLowerCase())).length;

    // Action Needed: Projects in 'Design Review', 'Waiting Approval' etc.
    const actionNeeded = projects.filter(p =>
        p.status.toLowerCase().includes('review') ||
        p.status.toLowerCase().includes('approval') ||
        p.status.toLowerCase().includes('sph') // Uploaded SPH needing check
    ).length;

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 1. Ticker */}
            <div className="-mt-8 -mx-4 sm:-mx-6 lg:-mx-8 mb-8 sticky top-20 z-40">
                <ActivityTicker />
            </div>

            {/* 2. Welcome & Stats */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-neutral-200">
                <div className="space-y-2">
                    <h2 className="text-3xl font-light text-neutral-900">
                        Good Afternoon, <span className="font-bold">{user?.name || 'Valued Client'}</span>
                    </h2>
                    <p className="text-neutral-500">Here is the latest progress on your interior projects.</p>
                </div>

                <div className="flex gap-4 sm:gap-8">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-neutral-900 tracking-tight">{activeProjects}</div>
                        <div className="text-xs text-neutral-400 uppercase tracking-widest font-medium mt-1">Active Projects</div>
                    </div>
                    <div className="w-px bg-neutral-200 h-12"></div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-orange-600 tracking-tight">{actionNeeded}</div>
                        <div className="text-xs text-neutral-400 uppercase tracking-widest font-medium mt-1">Action Needed</div>
                    </div>
                </div>
            </div>

            {/* 2.5 Action Center */}
            <div className="mb-8">
                <ActionCenter />
            </div>

            {/* 3. Projects Grid */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                        Active Projects
                        <Badge variant="outline" className="ml-2 bg-orange-50 text-orange-700 border-none">{activeProjects} Ongoing</Badge>
                    </h3>
                    <span className="text-sm text-neutral-400">Sorted by Priority</span>
                </div>

                {projects.length === 0 ? (
                    <div className="text-center py-12 bg-neutral-50 rounded-xl border-dashed border-2 border-neutral-200">
                        <p className="text-neutral-400">No active projects found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {projects.map(project => (
                            <ClientProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
