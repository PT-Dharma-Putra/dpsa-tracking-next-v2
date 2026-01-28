"use client";

import { useQuery } from "@tanstack/react-query";
import { ProjectService } from "@/features/projects/services/project-service";
import { ProjectCard } from "@/features/projects/components/project-card";
import { CreateProjectModal } from "@/features/projects/components/create-project-modal";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function ProjectsPage() {
    const [search, setSearch] = useState("");
    const [phaseFilter, setPhaseFilter] = useState("all");

    const { data: projectsResponse, isLoading } = useQuery({
        queryKey: ["projects"],
        queryFn: () => ProjectService.getProjects(),
    });

    const projects = projectsResponse?.data || [];

    // Client-side filtering (since API doesn't support search yet in this iteration)
    const filteredProjects = projects.filter((project: any) => {
        const matchesSearch = project.name.toLowerCase().includes(search.toLowerCase()) ||
            project.client?.name?.toLowerCase().includes(search.toLowerCase());
        const matchesPhase = phaseFilter === "all" || project.current_phase.toString() === phaseFilter;

        return matchesSearch && matchesPhase;
    });

    return (
        <div className="flex flex-col h-full space-y-6 p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
                    <p className="text-muted-foreground">
                        Manage your ongoing projects and track progress across phases.
                    </p>
                </div>
                <CreateProjectModal />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg border shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search projects or clients..."
                        className="pl-9 w-full"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="w-full sm:w-[200px]">
                    <Select value={phaseFilter} onValueChange={setPhaseFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="All Phases" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Phases</SelectItem>
                            <SelectItem value="1">Phase 1: Deal</SelectItem>
                            <SelectItem value="2">Phase 2: Prep</SelectItem>
                            <SelectItem value="3">Phase 3: Build</SelectItem>
                            <SelectItem value="4">Phase 4: Close</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-[250px] w-full bg-muted animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
                    <h3 className="text-lg font-medium">No projects found</h3>
                    <p className="text-muted-foreground">Try adjusting your filters or create a new project.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProjects.map((project: any) => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            )}
        </div>
    );
}
