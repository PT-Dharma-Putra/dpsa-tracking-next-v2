"use client"

import { useQuery } from "@tanstack/react-query"
import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ClientProjectCard } from "@/features/dashboard/components/client/project-card"
import { ClientService } from "@/features/dashboard/services/client-service"

export default function ClientProjectListPage() {
    const { data: projects = [], isLoading } = useQuery({
        queryKey: ["client-projects"],
        queryFn: ClientService.getMyProjects
    });

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">My Projects</h1>
                    <p className="text-neutral-500 text-sm">Manage and track all your active interior projects.</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <Input placeholder="Search projects..." className="pl-9 bg-white border-neutral-200 focus:ring-orange-500 rounded-full" />
                </div>
            </div>

            {projects.length === 0 ? (
                <div className="text-center py-12 bg-neutral-50 rounded-xl border-dashed border-2 border-neutral-200">
                    <p className="text-neutral-400">No projects found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {projects.map(project => (
                        <ClientProjectCard key={project.id} project={project} />
                    ))}
                </div>
            )}
        </div>
    )
}
