"use client"

import Link from "next/link"
import { use } from "react"
import { useQuery } from "@tanstack/react-query"
import { ProjectService } from "@/features/projects/services/project-service"
import { PhaseStepper } from "@/features/tracking/components/phase-stepper"
import { CommercialPhase } from "@/features/projects/components/phases/commercial-phase"
import { PreparationPhase } from "@/features/projects/components/phases/preparation-phase"
import { ManufacturingPhase } from "@/features/projects/components/phases/manufacturing-phase"
import { ClosingPhase } from "@/features/projects/components/phases/closing-phase"
import { OverviewTab } from "@/features/projects/components/phases/overview-tab"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, ChevronRight, Printer, RotateCw, Loader2, FileText, Check, Lock, Coins, Clock, MoreHorizontal, Calendar, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    // Fetch Project Data
    const { data: project, isLoading, error } = useQuery({
        queryKey: ["project", id],
        queryFn: () => ProjectService.getProject(id),
        retry: false
    });

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-neutral-50">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
        )
    }

    if (error || !project) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-neutral-50 gap-4">
                <div className="text-center">
                    <h1 className="text-xl font-bold text-neutral-900">Project Not Found</h1>
                    <p className="text-neutral-500">The project you are looking for does not exist or you don't have permission.</p>
                </div>
                <Link href="/dashboard/projects">
                    <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.4))] w-full bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            {/* === 1. HEADER === */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-white shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/projects">
                        <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-lg font-bold text-neutral-900 tracking-tight">{project.name}</h1>
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-auto bg-neutral-50 text-neutral-600 border-neutral-200 font-medium">
                                {project.status}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span className="font-mono text-neutral-600">ID: {project.id}</span>
                            <span className="text-neutral-300">•</span>
                            <span>{project.client?.name || "No Client"}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Stepper (Only visible on large screens) */}
                    <div className="hidden xl:block mr-2 scale-90 origin-right">
                        <PhaseStepper currentPhase={project.current_phase || 1} compact />
                    </div>

                    <div className="h-8 w-px bg-neutral-200 hidden xl:block mx-2" />

                    <Button variant="ghost" size="sm" className="h-9 text-neutral-500 hover:text-neutral-900 hidden sm:flex">
                        <Printer className="mr-2 h-4 w-4" /> Report
                    </Button>
                </div>
            </header>

            {/* === 2. MAIN LAYOUT === */}
            <div className="flex flex-1 overflow-hidden">

                {/* LEFT COLUMN: WORKSPACE */}
                <div className="flex-1 flex flex-col min-w-0 bg-neutral-50/50">
                    <Tabs defaultValue="overview" className="flex flex-col h-full">

                        {/* Sticky Tab Bar */}
                        <div className="px-6 pt-2 bg-white border-b border-neutral-200 sticky top-0 z-10">
                            <TabsList className="bg-transparent h-auto p-0 w-full justify-start gap-8">
                                {["Overview", "Commercial", "Preparation", "Manufacturing", "Closing"].map((tab, i) => (
                                    <TabsTrigger
                                        key={tab}
                                        value={tab.toLowerCase()}
                                        className="relative rounded-none border-b-[3px] border-transparent px-0 py-3 text-sm font-medium text-neutral-500 data-[state=active]:border-orange-600 data-[state=active]:text-neutral-900 hover:text-neutral-700 transition-all"
                                    >
                                        <span className="mr-2 text-xs font-bold text-neutral-300 data-[state=active]:text-orange-600/50 transition-colors">0{i + 1}</span>
                                        {tab}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-8">

                            {/* OVERVIEW TAB */}
                            <TabsContent value="overview" className="mt-0 space-y-8 max-w-5xl mx-auto">
                                <OverviewTab projectId={project.id} />
                            </TabsContent>

                            {/* COMMERCIAL TAB (PHASE 1) */}
                            <TabsContent value="commercial" className="mt-0 max-w-5xl mx-auto">
                                <CommercialPhase project={project} />
                            </TabsContent>

                            {/* PREPARATION TAB */}
                            <TabsContent value="preparation" className="mt-0 max-w-5xl mx-auto">
                                <PreparationPhase project={project} />
                            </TabsContent>

                            {/* OTHER TABS */}
                            <TabsContent value="manufacturing" className="mt-0 space-y-8 max-w-4xl mx-auto">
                                <ManufacturingPhase project={project} />
                            </TabsContent>

                            <TabsContent value="closing" className="mt-0 space-y-8 max-w-5xl mx-auto">
                                <ClosingPhase project={project} />
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}

// === POLISHED HELPER COMPONENTS (Preserved) ===
// ... (Helper components if needed by other tabs later)