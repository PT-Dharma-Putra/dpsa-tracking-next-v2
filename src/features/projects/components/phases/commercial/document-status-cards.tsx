"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DocumentService } from "@/features/projects/services/document-service";
import { BusinessRole, canManageSPH, canApproveSPH, canReviseDocs } from "@/lib/get-user-role";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
    FileText, Check, Lock, Upload, ChevronRight, ChevronDown,
    RotateCw, Plus, Eye, AlertCircle, Clock, History, Loader2
} from "lucide-react";
import Link from "next/link";

interface Props {
    projectId: string | number;
    role: BusinessRole;
}

/** Version model — gracefully handles backends with/without versioning */
interface DocVersion {
    version: number;
    file_url?: string;
    status: string;
    uploaded_by?: string;
    created_at?: string;
    reason?: string;
}

interface DocData {
    id?: number;
    sph_number?: string;
    spk_number?: string;
    status?: string;
    type?: string;
    parent_sph_id?: number;
    current_version?: number;
    versions?: DocVersion[];
    file_url?: string;
    created_at?: string;
}

export function DocumentStatusCards({ projectId, role }: Props) {
    const { data: sphData, isLoading: sphLoading } = useQuery<DocData>({
        queryKey: ['sph', projectId],
        queryFn: () => DocumentService.getSPH(projectId),
    });

    const { data: spkData, isLoading: spkLoading } = useQuery<DocData>({
        queryKey: ['spk', projectId],
        queryFn: () => DocumentService.getSPK(projectId),
    });

    const isSphApproved = sphData?.status === 'approved';

    if (sphLoading || spkLoading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Skeleton className="h-40 rounded-xl" />
                <Skeleton className="h-40 rounded-xl" />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DocumentCard
                type="sph"
                label="SPH (Quotation)"
                docNumber={sphData?.sph_number}
                status={sphData?.status}
                versions={sphData?.versions}
                currentVersion={sphData?.current_version}
                fileUrl={sphData?.file_url}
                projectId={projectId}
                role={role}
                canUpload={canManageSPH(role)}
                canRevise={canReviseDocs(role)}
                canApprove={canApproveSPH(role)}
                showAddendum={canManageSPH(role)}
                linkHref={`/dashboard/tracking/${projectId}/sph`}
            />

            <DocumentCard
                type="spk"
                label="SPK (Contract)"
                docNumber={spkData?.spk_number}
                status={spkData?.status}
                versions={spkData?.versions}
                currentVersion={spkData?.current_version}
                fileUrl={spkData?.file_url}
                projectId={projectId}
                role={role}
                canUpload={canManageSPH(role)}
                canRevise={canReviseDocs(role)}
                canApprove={canApproveSPH(role)}
                locked={!isSphApproved}
                lockReason="SPH must be approved first"
                linkHref={`/dashboard/tracking/${projectId}/spk`}
            />
        </div>
    );
}

interface DocumentCardProps {
    type: 'sph' | 'spk';
    label: string;
    docNumber?: string;
    status?: string;
    versions?: DocVersion[];
    currentVersion?: number;
    fileUrl?: string;
    projectId: string | number;
    role: BusinessRole;
    canUpload: boolean;
    canRevise: boolean;
    canApprove: boolean;
    showAddendum?: boolean;
    locked?: boolean;
    lockReason?: string;
    linkHref: string;
}

function DocumentCard({
    type,
    label,
    docNumber,
    status,
    versions,
    currentVersion,
    fileUrl,
    projectId,
    role,
    canUpload,
    canRevise,
    canApprove,
    showAddendum,
    locked,
    lockReason,
    linkHref,
}: DocumentCardProps) {
    const [showVersions, setShowVersions] = useState(false);
    const [reviseOpen, setReviseOpen] = useState(false);
    const queryClient = useQueryClient();

    const hasDoc = !!docNumber || !!fileUrl;
    const isApproved = status === 'approved' || status === 'signed';
    const activeVersion = currentVersion || (versions?.length ? versions[versions.length - 1]?.version : 1);
    const hasVersionHistory = versions && versions.length > 1;

    const statusConfig = getStatusConfig(status, type);

    // === MUTATIONS ===
    const reviseMutation = useMutation({
        mutationFn: async ({ file, reason }: { file: File; reason: string }) => {
            if (type === 'sph') return DocumentService.reviseSPH(projectId, file, reason);
            return DocumentService.reviseSPK(projectId, file, reason);
        },
        onSuccess: () => {
            toast.success(`${type.toUpperCase()} revised successfully! New version created.`);
            queryClient.invalidateQueries({ queryKey: [type, projectId] });
            queryClient.invalidateQueries({ queryKey: ['project-overview', projectId] });
            setReviseOpen(false);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || `Failed to revise ${type.toUpperCase()}`);
        },
    });

    const approveMutation = useMutation({
        mutationFn: async () => {
            if (type === 'sph') return DocumentService.approveSPH(projectId);
            return DocumentService.approveSPK(projectId);
        },
        onSuccess: () => {
            toast.success(`${type.toUpperCase()} approved successfully!`);
            queryClient.invalidateQueries({ queryKey: [type, projectId] });
            queryClient.invalidateQueries({ queryKey: ['project-overview', projectId] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || `Failed to approve ${type.toUpperCase()}`);
        },
    });

    // Locked state
    if (locked) {
        return (
            <Card className="border-neutral-200 bg-neutral-50/50 opacity-60">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold uppercase tracking-wide text-neutral-400 flex items-center gap-2">
                            <Lock className="h-3.5 w-3.5" />
                            {label}
                        </CardTitle>
                        <Badge variant="outline" className="text-neutral-400 border-neutral-200 text-[10px]">
                            <Lock className="h-2.5 w-2.5 mr-1" /> Locked
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-neutral-400 italic">{lockReason}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className={`transition-all hover:shadow-md ${isApproved ? 'border-green-200 bg-green-50/10' : 'border-neutral-200 hover:border-orange-200'}`}>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold uppercase tracking-wide text-neutral-500 flex items-center gap-2">
                            <FileText className={`h-3.5 w-3.5 ${isApproved ? 'text-green-600' : 'text-orange-600'}`} />
                            {label}
                        </CardTitle>
                        <Badge variant="outline" className={`text-[10px] font-bold ${statusConfig.color} gap-1`}>
                            {statusConfig.icon}
                            {statusConfig.label}
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="space-y-3">
                    {/* Document info */}
                    <Link href={linkHref}>
                        <div className="flex items-center justify-between bg-neutral-50 hover:bg-neutral-100/80 p-3 rounded-lg border border-neutral-100 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded border ${isApproved ? 'bg-green-50 border-green-100' : 'bg-white border-neutral-200'}`}>
                                    <FileText className={`h-4 w-4 ${isApproved ? 'text-green-600' : 'text-orange-600'}`} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-neutral-900">
                                        {hasDoc ? (docNumber || `${type.toUpperCase()} Document`) : `Upload ${type.toUpperCase()}`}
                                    </p>
                                    <p className="text-[11px] text-neutral-500">
                                        {hasDoc ? (
                                            <>
                                                {isApproved ? (type === 'spk' ? 'Contract Signed' : 'Quotation Approved') : 'Pending approval'}
                                                {activeVersion > 1 && <span className="ml-1 text-orange-600 font-medium">• v{activeVersion}</span>}
                                            </>
                                        ) : (
                                            'Click to upload document'
                                        )}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:text-orange-600 transition-colors" />
                        </div>
                    </Link>

                    {/* Action Buttons */}
                    {hasDoc && (
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Revise */}
                            {canRevise && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={`h-7 text-xs gap-1.5 ${isApproved
                                        ? 'text-amber-600 border-amber-200 hover:bg-amber-50'
                                        : 'text-orange-600 border-orange-200 hover:bg-orange-50'
                                        }`}
                                    onClick={() => setReviseOpen(true)}
                                >
                                    <RotateCw className="h-3 w-3" />
                                    {isApproved ? 'Revise (New Version)' : 'Revise'}
                                </Button>
                            )}

                            {/* Addendum (SPH only) */}
                            {showAddendum && isApproved && type === 'sph' && (
                                <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50">
                                    <Plus className="h-3 w-3" />
                                    Addendum
                                </Button>
                            )}

                            {/* Approve (Supervisor) */}
                            {canApprove && status === 'pending' && (
                                <Button
                                    size="sm"
                                    className="h-7 text-xs gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => approveMutation.mutate()}
                                    disabled={approveMutation.isPending}
                                >
                                    {approveMutation.isPending ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <Check className="h-3 w-3" />
                                    )}
                                    Approve
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Version History */}
                    {hasVersionHistory && (
                        <Collapsible open={showVersions} onOpenChange={setShowVersions}>
                            <CollapsibleTrigger asChild>
                                <button className="flex items-center gap-1.5 text-[11px] text-neutral-400 hover:text-neutral-600 transition-colors w-full">
                                    <History className="h-3 w-3" />
                                    <span>Version History ({versions!.length} versions)</span>
                                    <ChevronDown className={`h-3 w-3 ml-auto transition-transform ${showVersions ? 'rotate-180' : ''}`} />
                                </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <div className="mt-2 space-y-1.5 pl-4 border-l-2 border-neutral-100">
                                    {versions!.map((v) => (
                                        <div key={v.version} className="flex items-center justify-between text-[11px]">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-mono font-bold ${v.version === activeVersion ? 'text-orange-600' : 'text-neutral-400'}`}>
                                                    v{v.version}
                                                </span>
                                                <span className="text-neutral-500">
                                                    {v.status === 'superseded' ? 'Superseded' : v.status}
                                                </span>
                                                {v.reason && (
                                                    <span className="text-neutral-400 italic">({v.reason})</span>
                                                )}
                                            </div>
                                            {v.file_url && (
                                                <Button variant="ghost" size="sm" className="h-5 text-[10px] text-neutral-400 hover:text-blue-600 px-1.5">
                                                    <Eye className="h-2.5 w-2.5 mr-1" />
                                                    View
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    )}
                </CardContent>
            </Card>

            {/* Revise Dialog */}
            <ReviseDialog
                type={type}
                open={reviseOpen}
                onOpenChange={setReviseOpen}
                onSubmit={(file, reason) => reviseMutation.mutate({ file, reason })}
                isPending={reviseMutation.isPending}
            />
        </>
    );
}

// === REVISE DIALOG ===
interface ReviseDialogProps {
    type: 'sph' | 'spk';
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (file: File, reason: string) => void;
    isPending: boolean;
}

function ReviseDialog({ type, open, onOpenChange, onSubmit, isPending }: ReviseDialogProps) {
    const [reason, setReason] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = () => {
        if (!file) {
            toast.error('Please select a file to upload');
            return;
        }
        if (!reason.trim()) {
            toast.error('Please provide a reason for the revision');
            return;
        }
        onSubmit(file, reason.trim());
    };

    const handleClose = (value: boolean) => {
        if (!value) {
            setReason('');
            setFile(null);
        }
        onOpenChange(value);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <RotateCw className="h-4 w-4 text-orange-600" />
                        Revise {type.toUpperCase()}
                    </DialogTitle>
                    <DialogDescription>
                        Upload a corrected document. A new version will be created and the old version will be preserved.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* File Upload */}
                    <div className="space-y-2">
                        <Label htmlFor="revise-file" className="text-sm font-medium">
                            New Document <span className="text-red-500">*</span>
                        </Label>
                        <div
                            className="border-2 border-dashed border-neutral-200 rounded-lg p-4 text-center cursor-pointer hover:border-orange-300 hover:bg-orange-50/30 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {file ? (
                                <div className="flex items-center justify-center gap-2">
                                    <FileText className="h-4 w-4 text-orange-600" />
                                    <span className="text-sm font-medium text-neutral-900">{file.name}</span>
                                    <span className="text-xs text-neutral-400">
                                        ({(file.size / 1024 / 1024).toFixed(1)} MB)
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <Upload className="h-6 w-6 text-neutral-300 mx-auto mb-1" />
                                    <p className="text-sm text-neutral-500">Click to select file</p>
                                    <p className="text-xs text-neutral-400">PDF, DOC, DOCX, or image</p>
                                </>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            id="revise-file"
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <Label htmlFor="revise-reason" className="text-sm font-medium">
                            Reason for Revision <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="revise-reason"
                            placeholder="e.g., Fixed typo in item names, corrected pricing..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="resize-none h-20"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleClose(false)} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button
                        className="bg-orange-600 hover:bg-orange-700 text-white gap-1.5"
                        onClick={handleSubmit}
                        disabled={isPending || !file || !reason.trim()}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="h-3.5 w-3.5" />
                                Submit Revision
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function getStatusConfig(status: string | undefined, type: string) {
    switch (status) {
        case 'approved':
            return { label: 'Approved', color: 'bg-green-50 text-green-700 border-green-200', icon: <Check className="h-2.5 w-2.5" /> };
        case 'signed':
            return { label: 'Signed', color: 'bg-green-50 text-green-700 border-green-200', icon: <Check className="h-2.5 w-2.5" /> };
        case 'pending':
            return { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className="h-2.5 w-2.5" /> };
        case 'revision':
            return { label: 'Revision', color: 'bg-red-50 text-red-700 border-red-200', icon: <RotateCw className="h-2.5 w-2.5" /> };
        default:
            return { label: 'Not Uploaded', color: 'bg-neutral-100 text-neutral-500 border-neutral-200', icon: <AlertCircle className="h-2.5 w-2.5" /> };
    }
}
