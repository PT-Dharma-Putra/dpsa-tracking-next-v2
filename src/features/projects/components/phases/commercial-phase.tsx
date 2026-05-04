"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import { getUserBusinessRole } from "@/lib/get-user-role";
import { Project, ProjectService } from "../../services/project-service";
import { DesignService } from "../../services/design-service";
import { DocumentService } from "../../services/document-service";
import { CommercialItemTable } from "./commercial/commercial-item-table";
import { DocumentStatusCards } from "./commercial/document-status-cards";
import { DocumentAuditLog } from "./commercial/document-audit-log";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
    Check, Lock, AlertCircle, ShieldCheck, User as UserIcon,
    Paintbrush, Eye, ChevronRight
} from "lucide-react";
import Link from "next/link";

interface CommercialPhaseProps {
    project: Project;
}

const ROLE_DISPLAY: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    marketing: { label: 'Marketing', icon: <UserIcon className="h-3 w-3" />, color: 'bg-orange-50 text-orange-700 border-orange-200' },
    studio: { label: 'Studio', icon: <Paintbrush className="h-3 w-3" />, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    supervisor: { label: 'Supervisor', icon: <ShieldCheck className="h-3 w-3" />, color: 'bg-purple-50 text-purple-700 border-purple-200' },
    finance: { label: 'Finance', icon: <Eye className="h-3 w-3" />, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    other: { label: 'Viewer', icon: <Eye className="h-3 w-3" />, color: 'bg-neutral-50 text-neutral-600 border-neutral-200' },
};

export function CommercialPhase({ project }: CommercialPhaseProps) {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const role = getUserBusinessRole(user);
    const roleDisplay = ROLE_DISPLAY[role] || ROLE_DISPLAY.other;
    const isPhaseComplete = project.current_phase > 1;

    // Fetch Design Statistics
    const { data: designData } = useQuery({
        queryKey: ['design-items', project.id],
        queryFn: () => DesignService.getItems(project.id),
    });

    // Fetch SPH & SPK for Gate
    const { data: quoteData } = useQuery({
        queryKey: ['sph', project.id],
        queryFn: () => DocumentService.getSPH(project.id),
    });

    const { data: spkData } = useQuery({
        queryKey: ['spk', project.id],
        queryFn: () => DocumentService.getSPK(project.id),
    });

    // Gate Checks
    const items = designData?.items || [];
    const designFreeze = items.length === 0 || items.every(
        (i: any) => i.design_status === 'DONE' || !i.needs_design
    );
    const isSphApproved = quoteData?.status === 'approved';
    const isSpkSigned = spkData?.spk_status === 'approved';
    const canAdvance = designFreeze && isSphApproved && isSpkSigned;

    // Advance Phase
    const advanceMutation = useMutation({
        mutationFn: async () => ProjectService.advancePhase(project.id, false),
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
            {/* === HEADER === */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-neutral-900">Commercial & Design</h3>
                    <p className="text-sm text-neutral-500">
                        Manage item designs, generate quotation (SPH), and sign the contract (SPK).
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Role Badge */}
                    <Badge variant="outline" className={`text-[10px] font-bold gap-1 ${roleDisplay.color}`}>
                        {roleDisplay.icon}
                        {roleDisplay.label}
                    </Badge>

                    {/* Phase Status */}
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
            </div>

            {/* === MAIN LAYOUT === */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT: Content (2/3) */}
                <div className="lg:col-span-2 space-y-6">

                    {/* 1. Item Tracking Table */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold uppercase tracking-wide text-neutral-500">
                                    Step 1: Item Tracking
                                </h4>
                                <Badge variant="secondary" className="text-[10px] h-5">
                                    {items.length} items
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link href={`/dashboard/tracking/${project.id}/design/marketing`}>
                                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 border-orange-200 text-orange-600 hover:bg-orange-50">
                                        <UserIcon className="h-3 w-3" />
                                        Marketing View
                                        <ChevronRight className="h-3 w-3" />
                                    </Button>
                                </Link>
                                <Link href={`/dashboard/tracking/${project.id}/design/studio`}>
                                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50">
                                        <Paintbrush className="h-3 w-3" />
                                        Studio View
                                        <ChevronRight className="h-3 w-3" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        <CommercialItemTable projectId={project.id} role={role} />
                    </section>

                    {/* 2. Document Status Cards (SPH + SPK) */}
                    <section>
                        <h4 className="text-sm font-bold uppercase tracking-wide text-neutral-500 mb-3">
                            Step 2: Documents
                        </h4>
                        <DocumentStatusCards projectId={project.id} role={role} />
                    </section>

                    {/* 3. Audit Log */}
                    <section>
                        <DocumentAuditLog projectId={project.id} />
                    </section>
                </div>

                {/* RIGHT: Phase Gate (1/3) */}
                <div className="space-y-6">
                    <Card className="bg-neutral-900 text-white border-none shadow-lg sticky top-4">
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
                                <GateRequirement label="Design Freeze" met={designFreeze} detail={
                                    designFreeze
                                        ? "All item designs finalized"
                                        : `${items.filter((i: any) => i.needs_design && i.design_status !== 'DONE').length} items pending`
                                } />
                                <GateRequirement label="SPH Approved" met={isSphApproved} />
                                <GateRequirement label="SPK Signed" met={isSpkSigned} />
                            </div>

                            <Separator className="bg-neutral-800" />

                            <div className="pt-2">
                                {!isPhaseComplete ? (
                                    <Button
                                        className="w-full bg-orange-600 hover:bg-orange-700 font-bold text-white disabled:opacity-40"
                                        onClick={() => advanceMutation.mutate()}
                                        disabled={advanceMutation.isPending || !canAdvance}
                                    >
                                        {advanceMutation.isPending ? "Processing..." : "Mark Phase 1 Complete"}
                                    </Button>
                                ) : (
                                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white" disabled>
                                        Phase 1 Completed
                                    </Button>
                                )}
                                {!canAdvance && !isPhaseComplete && (
                                    <p className="text-[10px] text-neutral-500 text-center mt-3">
                                        Complete all gate requirements above to proceed.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function GateRequirement({ label, met, detail }: { label: string; met: boolean; detail?: string }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <div>
                <span className="text-neutral-300">{label}</span>
                {detail && (
                    <p className="text-[10px] text-neutral-500 mt-0.5">{detail}</p>
                )}
            </div>
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
    );
}
