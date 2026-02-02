"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, FileText, ChevronRight, AlertCircle, Lock, User, Paintbrush, Info } from "lucide-react";
import { Project, ProjectService } from "../../services/project-service";
import { DesignService } from "../../services/design-service";
import { DocumentService } from "../../services/document-service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";

interface CommercialPhaseProps {
    project: Project;
}

export function CommercialPhase({ project }: CommercialPhaseProps) {
    const queryClient = useQueryClient();
    const isPhaseComplete = project.current_phase > 1;

    // Fetch Design Statistics
    const { data: designData, isLoading: isLoadingDesign } = useQuery({
        queryKey: ['design-items', project.id],
        queryFn: () => DesignService.getItems(project.id),
    });

    // Fetch SPH & SPK Status for Gate
    const { data: quoteData } = useQuery({
        queryKey: ['sph', project.id],
        queryFn: () => DocumentService.getSPH(project.id)
    });

    const { data: spkData } = useQuery({
        queryKey: ['spk', project.id],
        queryFn: () => DocumentService.getSPK(project.id)
    });



    // Gate Checks
    const isDesignApproved = designData?.summary.avg_progress >= 100; // Simplified logic, ideally check status
    const isSphSent = quoteData?.status === 'approved' || quoteData?.status === 'pending'; // Approved is better
    const isSphApproved = quoteData?.status === 'approved';
    const isSpkSigned = spkData?.status === 'signed';

    // Advance Phase Mutation
    const advanceMutation = useMutation({
        mutationFn: async () => ProjectService.advancePhase(project.id, false), // force=false to respect backend checks
        onSuccess: () => {
            toast.success("Phase 1 Completed! Moved to Preparation.");
            queryClient.invalidateQueries({ queryKey: ["project", project.id] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to advance phase");
        }
    });

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-neutral-900">Commercial & Design</h3>
                    <p className="text-sm text-neutral-500">
                        Manage designs, generate quotation (SPH), and sign the contract (SPK).
                    </p>
                </div>
                {isPhaseComplete ? (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 px-3 py-1">
                        <Check className="mr-1 h-3 w-3" /> Phase Completed
                    </Badge>
                ) : (
                    <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                        In Progress
                    </Badge>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Col: Tasks */}
                <div className="lg:col-span-2 space-y-6">

                    {/* 1. Design Tracking Integration */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-sm font-bold uppercase tracking-wide text-neutral-500">Step 1: Design Tracking</CardTitle>
                                        <Badge variant="secondary" className="text-[10px] h-5">NEW</Badge>
                                    </div>
                                    <CardDescription>Manage item-level designs & progress.</CardDescription>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-bold text-neutral-900">{designData?.summary.avg_progress || 0}%</span>
                                    <p className="text-xs text-neutral-400">Avg. Progress</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Progress Bar */}
                            <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-orange-500 transition-all duration-500"
                                    style={{ width: `${designData?.summary.avg_progress || 0}%` }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <Link href={`/dashboard/tracking/${project.id}/design/marketing`}>
                                    <Button variant="outline" className="w-full justify-between h-auto py-3 px-4 border-2 border-dashed hover:border-orange-200 hover:bg-orange-50/50">
                                        <div className="text-left">
                                            <div className="font-bold text-neutral-900 flex items-center gap-2">
                                                <User className="h-4 w-4 text-orange-600" />
                                                Marketing
                                            </div>
                                            <div className="text-xs text-neutral-500 mt-0.5">Select Items & Brief</div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-neutral-400" />
                                    </Button>
                                </Link>

                                <Link href={`/dashboard/tracking/${project.id}/design/studio`}>
                                    <Button variant="outline" className="w-full justify-between h-auto py-3 px-4 border-2 border-dashed hover:border-blue-200 hover:bg-blue-50/50">
                                        <div className="text-left">
                                            <div className="font-bold text-neutral-900 flex items-center gap-2">
                                                <Paintbrush className="h-4 w-4 text-blue-600" />
                                                Studio
                                            </div>
                                            <div className="text-xs text-neutral-500 mt-0.5">Kanban & Updates</div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-neutral-400" />
                                    </Button>
                                </Link>
                            </div>

                            <div className="bg-neutral-50 rounded-md p-3 text-xs text-neutral-500 flex items-start gap-2">
                                <Info className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
                                <p>
                                    <strong>{designData?.summary.design_needed || 0} items</strong> require design.
                                    Marketing selects items, Studio updates progress.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2. Quotation (SPH) */}
                    <Link href={`/dashboard/tracking/${project.id}/sph`}>
                        <Card className={`cursor-pointer hover:border-orange-200 hover:shadow-md transition-all ${isSphApproved ? "border-green-200 bg-green-50/10" : ""}`}>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-sm font-bold uppercase tracking-wide text-neutral-500">Step 2: Quotation (SPH)</CardTitle>
                                        <CardDescription>Upload the SPH document for client approval.</CardDescription>
                                    </div>
                                    {isSphApproved ? (
                                        <Badge className="bg-green-600">Approved</Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-neutral-500">Pending</Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between bg-neutral-50 p-4 rounded-lg border border-neutral-100">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded border ${isSphApproved ? 'bg-green-50 border-green-100' : 'bg-white border-neutral-200'}`}>
                                            <FileText className={`h-5 w-5 ${isSphApproved ? 'text-green-600' : 'text-orange-600'}`} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-neutral-900">
                                                {isSphApproved ? quoteData?.sph_number || 'SPH Document' : 'Upload SPH'}
                                            </p>
                                            <p className="text-xs text-neutral-500">
                                                {isSphApproved ? 'Quotation Approved' : 'Click to upload document'}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-neutral-400" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* 3. Contract (SPK) */}
                    <Link href={`/dashboard/tracking/${project.id}/spk`}>
                        <Card className={`cursor-pointer hover:border-blue-200 hover:shadow-md transition-all ${!isSphApproved ? "opacity-60 pointer-events-none" : ""} ${isSpkSigned ? "border-green-200 bg-green-50/10" : ""}`}>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-sm font-bold uppercase tracking-wide text-neutral-500">Step 3: Contract (SPK)</CardTitle>
                                        <CardDescription>Upload the signed SPK to finalize the deal.</CardDescription>
                                    </div>
                                    {isSpkSigned ? (
                                        <Badge className="bg-green-600 flex gap-1"><Check className="h-3 w-3" /> Signed</Badge>
                                    ) : !isSphApproved ? (
                                        <Badge variant="outline" className="text-neutral-400"><Lock className="h-3 w-3 mr-1" /> Locked</Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-neutral-500">Pending</Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between bg-neutral-50 p-4 rounded-lg border border-neutral-100">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded border ${isSpkSigned ? 'bg-green-50 border-green-100' : 'bg-white border-neutral-200'}`}>
                                            <FileText className={`h-5 w-5 ${isSpkSigned ? 'text-green-600' : 'text-blue-600'}`} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-neutral-900">
                                                {isSpkSigned ? spkData?.spk_number || 'SPK Document' : isSphApproved ? 'Upload SPK' : 'Complete SPH First'}
                                            </p>
                                            <p className="text-xs text-neutral-500">
                                                {isSpkSigned ? 'Contract Signed' : isSphApproved ? 'Click to upload contract' : 'SPH must be approved first'}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-neutral-400" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                </div>

                {/* Right Col: Gate Control */}
                <div className="space-y-6">
                    <Card className="bg-neutral-900 text-white border-none shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="h-4 w-4 text-orange-500" />
                                Phase Gate
                            </CardTitle>
                            <CardDescription className="text-neutral-400">
                                Requirements to advance to Phase 2 (Preparation).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <GateRequirement label="SPH Approved" met={isSphApproved} />
                                <GateRequirement label="SPK Signed" met={isSpkSigned} />
                            </div>

                            <Separator className="bg-neutral-800" />

                            <div className="pt-2">
                                {!isPhaseComplete ? (
                                    <Button
                                        className="w-full bg-orange-600 hover:bg-orange-700 font-bold text-white"
                                        onClick={() => advanceMutation.mutate()}
                                        disabled={advanceMutation.isPending || !isSpkSigned}
                                    >
                                        {advanceMutation.isPending ? "Processing..." : "Mark Phase 1 Complete"}
                                    </Button>
                                ) : (
                                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white" disabled>
                                        Phase 1 Completed
                                    </Button>
                                )}
                                <p className="text-[10px] text-neutral-500 text-center mt-3">
                                    Ensures all documents are locked.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>


        </div>
    );
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
