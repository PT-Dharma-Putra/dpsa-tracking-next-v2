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
    RotateCw, Plus, Eye, AlertCircle, Clock, History, Loader2,
    Download, ExternalLink, Calendar
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
    // SPK-specific fields from backend
    spk_file_url?: string;
    spk_signed_file_url?: string;
    spk_status?: string;
    deadline?: string;
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
        <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
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

                {/* <DocumentCard
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
                /> */}
            </div>

            {/* Client SPK Review Card */}
            <ClientSPKReviewCard projectId={projectId} spkData={spkData as any} role={role} />
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

// === CLIENT SPK REVIEW CARD ===
interface ClientSPKReviewData {
    spk_number?: string;
    deadline?: string;
    spk_file_url?: string;
    spk_signed_file_url?: string;
    spk_status?: string;
}

function ClientSPKReviewCard({ projectId, spkData, role }: {
    projectId: string | number;
    spkData: ClientSPKReviewData | null;
    role: BusinessRole;
}) {
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const queryClient = useQueryClient();

    const hasClientSPK = !!(spkData?.spk_number && spkData?.spk_file_url);
    const isApproved = spkData?.spk_status === 'approved';
    const isPending = spkData?.spk_status === 'pending';

    const approveMutation = useMutation({
        mutationFn: (signedFile: File) => DocumentService.approveSPK(projectId, signedFile),
        onSuccess: () => {
            toast.success("SPK berhasil disetujui!");
            queryClient.invalidateQueries({ queryKey: ['spk', projectId] });
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
            queryClient.invalidateQueries({ queryKey: ['project-overview', projectId] });
            setIsReviewOpen(false);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Gagal approve SPK");
        },
    });

    return (
        <>
            <Card className={`transition-all ${
                isApproved
                    ? 'border-green-200 bg-green-50/20'
                    : isPending
                        ? 'border-blue-200 bg-blue-50/10 hover:shadow-md'
                        : 'border-neutral-200'
            }`}>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold uppercase tracking-wide text-neutral-500 flex items-center gap-2">
                            <FileText className={`h-3.5 w-3.5 ${isApproved ? 'text-green-600' : hasClientSPK ? 'text-blue-600' : 'text-neutral-400'}`} />
                            SPK dari Client
                        </CardTitle>
                        <Badge variant="outline" className={`text-[10px] font-bold gap-1 ${
                            isApproved
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : isPending
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : hasClientSPK
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                        }`}>
                            {isApproved ? (
                                <><Check className="h-2.5 w-2.5" /> Approved</>
                            ) : isPending ? (
                                <><Clock className="h-2.5 w-2.5" /> Waiting Review</>
                            ) : hasClientSPK ? (
                                <><Clock className="h-2.5 w-2.5" /> Needs Review</>
                            ) : (
                                <><AlertCircle className="h-2.5 w-2.5" /> Belum Upload</>
                            )}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {hasClientSPK ? (
                        <>
                            {/* SPK Info — clickable to open review */}
                            <div
                                className="flex items-center justify-between bg-neutral-50 hover:bg-neutral-100/80 p-3 rounded-lg border border-neutral-100 transition-colors cursor-pointer group"
                                onClick={() => setIsReviewOpen(true)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded border ${isApproved ? 'bg-green-50 border-green-100' : 'bg-blue-50 border-blue-100'}`}>
                                        <FileText className={`h-4 w-4 ${isApproved ? 'text-green-600' : 'text-blue-600'}`} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-neutral-900">{spkData!.spk_number}</p>
                                        <div className="flex items-center gap-3 text-[11px] text-neutral-500">
                                            {spkData!.deadline && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    Deadline: {new Date(spkData!.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            )}
                                            <span>{isApproved ? 'Signed & Approved' : 'Click to review & approve'}</span>
                                        </div>
                                    </div>
                                </div>
                                <Eye className="h-4 w-4 text-neutral-400 group-hover:text-blue-600 transition-colors" />
                            </div>

                            {/* Signed file info */}
                            {isApproved && spkData!.spk_signed_file_url && (
                                <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded-lg border border-green-100">
                                    <Check className="h-3.5 w-3.5" />
                                    <span className="font-medium">SPK bertanda tangan telah diupload.</span>
                                    <a
                                        href={spkData!.spk_signed_file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-auto text-green-700 hover:underline flex items-center gap-1"
                                    >
                                        <Download className="h-3 w-3" /> Download
                                    </a>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Empty state — no SPK from client yet */
                        <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-neutral-200 rounded-lg text-center">
                            <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
                                <Clock className="h-5 w-5 text-neutral-400" />
                            </div>
                            <p className="text-sm font-medium text-neutral-500">Menunggu Upload dari Client</p>
                            <p className="text-xs text-neutral-400 mt-1">Client belum mengupload dokumen SPK.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Review Dialog — only render when there's data */}
            {hasClientSPK && (
                <SPKReviewDialog
                    open={isReviewOpen}
                    onOpenChange={setIsReviewOpen}
                    spkData={spkData!}
                    isApproved={isApproved}
                    onApprove={(file) => approveMutation.mutate(file)}
                    isApproving={approveMutation.isPending}
                />
            )}
        </>
    );
}

// === SPK REVIEW DIALOG ===
function SPKReviewDialog({ open, onOpenChange, spkData, isApproved, onApprove, isApproving }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    spkData: ClientSPKReviewData;
    isApproved: boolean;
    onApprove: (file: File) => void;
    isApproving: boolean;
}) {
    const [signedFile, setSignedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset on close
    const handleClose = (value: boolean) => {
        if (!value) {
            setSignedFile(null);
        }
        onOpenChange(value);
    };

    const handleApprove = () => {
        if (!signedFile) {
            toast.error("Please upload the signed SPK file");
            return;
        }
        onApprove(signedFile);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-4 border-b bg-neutral-50/50 shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-600" />
                                Review SPK dari Client — {spkData.spk_number}
                            </DialogTitle>
                            <DialogDescription>
                                Review the client's SPK document, download it, sign it, then upload the signed version.
                            </DialogDescription>
                        </div>
                        <div className="flex gap-2">
                            {spkData.spk_file_url && (
                                <>
                                    <a href={spkData.spk_file_url} target="_blank" rel="noreferrer">
                                        <Button variant="outline" size="sm">
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            Open in Tab
                                        </Button>
                                    </a>
                                    {/* <a href={spkData.spk_file_url} download>
                                        <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                                            <Download className="h-4 w-4 mr-2" />
                                            Download SPK
                                        </Button>
                                    </a> */}
                                </>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* PDF Preview */}
                    <div className="flex-1 bg-neutral-100 relative overflow-hidden">
                        {spkData.spk_file_url ? (
                            <iframe
                                src={`${spkData.spk_file_url}#toolbar=0`}
                                className="w-full h-full border-none"
                                title="SPK Document Preview"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-neutral-400">
                                <p>No document to preview</p>
                            </div>
                        )}
                    </div>

                    {/* Right sidebar: Admin actions */}
                    {!isApproved && (
                        <div className="w-full md:w-[340px] bg-white border-l p-6 flex flex-col gap-6 shrink-0 overflow-y-auto">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg text-neutral-900">Upload & Approve</h3>
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                                    <p className="font-medium mb-1">Langkah:</p>
                                    <ol className="list-decimal list-inside space-y-1 text-xs">
                                        <li>Download dokumen SPK dari client</li>
                                        <li>Tanda tangani dokumen tersebut</li>
                                        <li>Upload file yang sudah ditanda tangani</li>
                                        <li>Klik "Upload & Approve"</li>
                                    </ol>
                                </div>

                                {/* SPK Info */}
                                <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-100 space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-neutral-500">Nomor SPK</span>
                                        <span className="font-bold text-neutral-900">{spkData.spk_number}</span>
                                    </div>
                                    {spkData.deadline && (
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-neutral-500">Deadline</span>
                                            <span className="font-medium text-red-600">
                                                {new Date(spkData.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* File Upload */}
                                <div className="space-y-2">
                                    <Label htmlFor="signed-spk-admin" className="text-sm font-medium">
                                        SPK Bertanda Tangan <span className="text-red-500">*</span>
                                    </Label>
                                    <div
                                        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                                            signedFile
                                                ? 'border-green-300 bg-green-50/30 hover:border-green-400'
                                                : 'border-neutral-200 hover:border-blue-300 hover:bg-blue-50/30'
                                        }`}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {signedFile ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <FileText className="h-4 w-4 text-green-600" />
                                                <span className="text-sm font-medium text-neutral-900">{signedFile.name}</span>
                                                <span className="text-xs text-neutral-400">
                                                    ({(signedFile.size / 1024 / 1024).toFixed(1)} MB)
                                                </span>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload className="h-6 w-6 text-neutral-300 mx-auto mb-1" />
                                                <p className="text-sm text-neutral-500">Klik untuk memilih file</p>
                                                <p className="text-xs text-neutral-400">PDF, DOC, atau gambar</p>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        id="signed-spk-admin"
                                        type="file"
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        className="hidden"
                                        onChange={(e) => setSignedFile(e.target.files?.[0] || null)}
                                    />
                                </div>

                                {/* Submit */}
                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                                    onClick={handleApprove}
                                    disabled={isApproving || !signedFile}
                                >
                                    {isApproving ? (
                                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing...</>
                                    ) : (
                                        <><Check className="h-3.5 w-3.5" /> Upload & Approve</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Approved state sidebar */}
                    {isApproved && (
                        <div className="w-full md:w-[340px] bg-white border-l p-6 flex flex-col gap-4 shrink-0 overflow-y-auto">
                            <div className="text-center py-8">
                                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                                    <Check className="h-8 w-8 text-green-600" />
                                </div>
                                <h3 className="font-bold text-lg text-green-700">SPK Approved</h3>
                                <p className="text-sm text-neutral-500 mt-1">Dokumen SPK sudah disetujui dan ditandatangani.</p>
                            </div>

                            {spkData.spk_signed_file_url && (
                                <a href={spkData.spk_signed_file_url} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" className="w-full text-green-600 border-green-200 hover:bg-green-50">
                                        <Download className="h-4 w-4 mr-2" />
                                        Download Signed SPK
                                    </Button>
                                </a>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="p-4 border-t bg-white shrink-0 md:hidden">
                    <Button variant="outline" onClick={() => handleClose(false)}>Close</Button>
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
        case 'sent':
        case 'revisied':
        case 'pending':
            return { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className="h-2.5 w-2.5" /> };
        case 'rejected':
            return { label: 'Revision Requested', color: 'bg-red-50 text-red-700 border-red-200', icon: <AlertCircle className="h-2.5 w-2.5" /> };
        case 'revision':
            return { label: 'Revision', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <RotateCw className="h-2.5 w-2.5" /> };
        default:
            return { label: 'Not Uploaded', color: 'bg-neutral-100 text-neutral-500 border-neutral-200', icon: <AlertCircle className="h-2.5 w-2.5" /> };
    }
}
