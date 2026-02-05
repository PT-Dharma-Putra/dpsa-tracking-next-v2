"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Project, ProjectService } from "@/features/projects/services/project-service"
import { DocumentService } from "@/features/projects/services/document-service"
import { PPICService } from "@/features/projects/services/ppic-service"
import { WarehouseService } from "@/features/projects/services/warehouse-service"
import { toast } from "sonner"
import { ScheduleWidget } from "./preparation/schedule-widget"
import { DivisionAssignmentWidget } from "./preparation/division-assignment-widget"
import { DokubahWidget } from "./preparation/dokubah-widget"
import { EngineeringWidget } from "./preparation/engineering-widget"
import { ProcurementWidget } from "./preparation/procurement-widget"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Lock, Check, AlertCircle } from "lucide-react"

interface PreparationPhaseProps {
    project: Project;
}

export function PreparationPhase({ project }: PreparationPhaseProps) {
    const queryClient = useQueryClient();
    const isPhaseComplete = project.current_phase > 2;

    // --- GATE CHECKS ---
    // 1. Schedule Check
    const isScheduleSet = Boolean(project.start_date && project.due_date);

    // 2. Dokubah Check
    const { data: dokubahData } = useQuery({
        queryKey: ["dokubah", project.id],
        queryFn: () => PPICService.getDokubah(project.id)
    });
    const isDokubahReady = dokubahData?.data?.dokubah_status === 'uploaded' || dokubahData?.data?.dokubah_status === 'revised';

    // 3. Engineering Check
    const { data: engineeringDocs } = useQuery({
        queryKey: ["project-documents", project.id, "ENGINEERING"],
        queryFn: () => DocumentService.getDocuments(project.id, "ENGINEERING")
    });
    const isDrawingReady = engineeringDocs?.data?.length > 0;

    // 4. Material Check (Procurement)
    const { data: warehouseItems } = useQuery({
        queryKey: ["warehouse-items", project.id],
        queryFn: () => WarehouseService.getWarehouseItems(project.id)
    });
    const totalItems = warehouseItems?.data?.length || 0;
    const readyItems = warehouseItems?.data?.filter((i: any) => i.material_status === 'Ready').length || 0;
    const isMaterialReady = totalItems > 0 && readyItems === totalItems; // Strict: All must be ready


    // Advance Mutation
    const advanceMutation = useMutation({
        mutationFn: async () => ProjectService.advancePhase(project.id, false),
        onSuccess: () => {
            toast.success("Phase 2 Completed! Moved to Manufacturing.");
            queryClient.invalidateQueries({ queryKey: ["project", project.id] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to advance phase");
        }
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-8">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="ppic">PPIC & Planning</TabsTrigger>
                    <TabsTrigger value="engineering">Engineering</TabsTrigger>
                    <TabsTrigger value="warehouse">Warehouse</TabsTrigger>
                </TabsList>

                {/* 1. OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Summary Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-bold uppercase tracking-wide text-neutral-500">Phase Progress</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <SummaryRow label="Schedule" met={isScheduleSet} pendingText="Not Set" />
                                <SummaryRow label="Division Assignment" met={true} pendingText="Check Items" /> {/* Always check manually */}
                                <SummaryRow label="Dokubah (Material List)" met={isDokubahReady} pendingText="Upload Required" />
                                <SummaryRow label="Engineering Drawings" met={isDrawingReady} pendingText="No Drawings" />
                                <SummaryRow label="Material Readiness" met={isMaterialReady} pendingText="Waiting Procurement" />
                            </CardContent>
                        </Card>

                        {/* Gate Control */}
                        <Card className="bg-neutral-900 text-white border-none shadow-lg h-fit">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-orange-500" />
                                    Phase Gate
                                </CardTitle>
                                <CardDescription className="text-neutral-400">
                                    Advance to Phase 3 (Manufacturing).
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <GateRequirement label="Schedule Set" met={isScheduleSet} />
                                    <GateRequirement label="Dokubah Ready" met={isDokubahReady} />
                                    <GateRequirement label="Engineering Drawings" met={isDrawingReady} />
                                    <GateRequirement label="Material Ready" met={isMaterialReady} />
                                </div>
                                <Separator className="bg-neutral-800" />
                                <div className="pt-2">
                                    {!isPhaseComplete ? (
                                        <Button
                                            className="w-full bg-orange-600 hover:bg-orange-700 font-bold text-white transition-colors"
                                            onClick={() => advanceMutation.mutate()}
                                            disabled={advanceMutation.isPending || !isScheduleSet || !isDokubahReady || !isDrawingReady}
                                        >
                                            {advanceMutation.isPending ? "Processing..." : "Start Manufacturing"}
                                        </Button>
                                    ) : (
                                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white" disabled>
                                            Phase 2 Completed
                                        </Button>
                                    )}
                                    <p className="text-[10px] text-neutral-500 text-center mt-3">
                                        Action is irreversible.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* 2. PPIC TAB */}
                <TabsContent value="ppic" className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left: Schedule & Division */}
                        <div className="space-y-8">
                            <section>
                                <h3 className="text-lg font-bold text-neutral-900 mb-4">1. Production Planning</h3>
                                <ScheduleWidget project={project} />
                            </section>
                            <section>
                                <DivisionAssignmentWidget projectId={project.id} spkNumber={project.spk_number} />
                            </section>
                        </div>
                        {/* Right: Dokubah */}
                        <div className="space-y-8">
                            <DokubahWidget projectId={project.id} />
                        </div>
                    </div>
                </TabsContent>

                {/* 3. ENGINEERING TAB */}
                <TabsContent value="engineering">
                    <div className="max-w-4xl">
                        <EngineeringWidget projectId={project.id} />
                    </div>
                </TabsContent>

                {/* 4. WAREHOUSE TAB */}
                <TabsContent value="warehouse">
                    <div className="max-w-4xl">
                        <ProcurementWidget projectId={project.id} />
                    </div>
                </TabsContent>

            </Tabs>
        </div>
    )
}

function SummaryRow({ label, met, pendingText }: { label: string, met: boolean, pendingText: string }) {
    return (
        <div className="flex items-center justify-between text-sm p-3 bg-neutral-50 rounded border border-neutral-100">
            <span className="font-medium text-neutral-700">{label}</span>
            {met ? (
                <span className="text-green-600 text-xs font-bold flex items-center bg-green-50 px-2 py-1 rounded">
                    <Check className="h-3 w-3 mr-1" /> Ready
                </span>
            ) : (
                <span className="text-neutral-400 text-xs flex items-center">
                    {pendingText}
                </span>
            )}
        </div>
    )
}

function GateRequirement({ label, met }: { label: string, met: boolean }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-300">{label}</span>
            {met ? (
                <span className="flex items-center text-green-500 text-xs font-bold">
                    <Check className="h-3 w-3 mr-1" /> OK
                </span>
            ) : (
                <span className="flex items-center text-neutral-500 text-xs text-right">
                    <AlertCircle className="h-3 w-3 mr-1" /> Pending
                </span>
            )}
        </div>
    )
}
