"use client"

import { use, useState, useRef } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Download, CheckCircle, CheckCircle2, AlertCircle, MessageSquare, PlusCircle, FileText, Eye, Upload, CalendarIcon, Lock, X, History, Clock, MapPin, Sparkles, Video, Image as ImageIcon, Loader2, AlertTriangle } from "lucide-react"
import { ProjectService } from "@/features/projects/services/project-service"
import { projectV2Service, SiteReadiness } from "@/features/projects/services/project-v2-service"
import { DesignService, Design } from "@/features/projects/services/design-service"
import { DocumentService } from "@/features/projects/services/document-service"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OverviewTab } from "@/features/projects/components/phases/overview-tab"
import { SPHViewerDialog } from "@/features/projects/components/sph/sph-viewer-dialog"
import { SPKViewerDialog } from "@/features/projects/components/spk/spk-viewer-dialog"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { MessageService } from "@/features/projects/services/message-service"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { cn } from "@/lib/utils"

import { useRouter } from "next/navigation"
import { ClientTaskDialog } from "@/features/dashboard/components/client/client-task-dialog"

export default function ClientProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const queryClient = useQueryClient();
    const [ticketDialogOpen, setTicketDialogOpen] = useState(false);

    // Fetch Project Data
    const { data: project, isLoading } = useQuery({
        queryKey: ["project", id],
        queryFn: () => ProjectService.getProject(id),
    });

    if (isLoading) return <div className="p-8 text-center animate-pulse">Loading project data...</div>
    if (!project) return <div className="p-8 text-center text-red-500">Project not found.</div>

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 w-full">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="text-neutral-400 hover:text-orange-600 transition-colors cursor-pointer"
                            title="Kembali"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">{project.name}</h1>
                        {/* <Badge variant="outline" className="bg-orange-50 text-orange-700 border-none uppercase tracking-wider text-[10px]">
                            {project.status?.replace(/_/g, " ")}
                        </Badge> */}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 ml-8">
                        <p className="text-neutral-500 text-sm">
                            {project.description || "Project details and tracking information."}
                        </p>
                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            <div className="text-sm font-medium text-neutral-700 bg-neutral-100 px-3 py-1 rounded-md border border-neutral-200 inline-flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5 text-neutral-500" />
                                <span>Nomor SPK:</span>
                                <span className="font-semibold text-neutral-900">{project.spk_number || (project as any).spk?.nomor_spk || "-"}</span>
                            </div>
                            {project.tanggal_selesai && (
                                <div className="text-sm font-medium text-emerald-800 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200 inline-flex items-center gap-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                    <span>Tanggal Selesai:</span>
                                    <span className="font-bold text-emerald-900">
                                        {format(new Date(project.tanggal_selesai), 'd MMMM yyyy', { locale: idLocale })}
                                    </span>
                                </div>
                            )}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setTicketDialogOpen(true)}
                                className="h-7 text-xs font-semibold rounded-md border-neutral-200 text-neutral-700 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors inline-flex items-center gap-1.5"
                            >
                                <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                                <span>Lapor Kendala / Request</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Main Tabs */}
            <Tabs defaultValue="tracking" className="w-full">
                <TabsList className="bg-neutral-100 p-1 mb-6">
                    <TabsTrigger value="tracking" className="px-6 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm">Tracking & Status</TabsTrigger>
                    <TabsTrigger value="designs" className="px-6 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm">Design Approvals</TabsTrigger>
                    <TabsTrigger value="docs" className="px-6 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm">Documents</TabsTrigger>
                    <TabsTrigger value="kesiapan-lokasi" className="px-6 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm">Kesiapan Lokasi</TabsTrigger>
                    {/* <TabsTrigger value="chat" className="px-6 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm">Discussion</TabsTrigger> */}
                </TabsList>

                <TabsContent value="tracking" className="space-y-6">
                    <OverviewTab projectId={Number(id)} />
                </TabsContent>

                <TabsContent value="designs" className="space-y-6">
                    <DesignTabContent projectId={id} />
                </TabsContent>

                <TabsContent value="docs" className="space-y-4">
                    <DocumentsTabContent projectId={id} />
                </TabsContent>

                <TabsContent value="kesiapan-lokasi" className="space-y-6">
                    <KesiapanLokasiTabContent projectId={id} />
                </TabsContent>

                <TabsContent value="chat" className="space-y-4">
                    <ChatTabContent projectId={id} />
                </TabsContent>
            </Tabs>

            <ClientTaskDialog
                open={ticketDialogOpen}
                onOpenChange={setTicketDialogOpen}
                defaultProjectId={Number(id)}
                defaultProjectName={project.name}
                defaultTipe="Lapor Kendala"
            />
        </div>
    )
}

function DesignTabContent({ projectId }: { projectId: string }) {
    const queryClient = useQueryClient();

    // Fetch Designs
    const { data: designData, isLoading } = useQuery({
        queryKey: ["designs", projectId],
        queryFn: () => DesignService.getProjectDesigns(projectId),
    });

    // Fetch Project V2 details (for ACC Design data from marketing/studio workflow)
    const { data: projectV2 } = useQuery({
        queryKey: ["project-v2", projectId],
        queryFn: () => projectV2Service.getProject(Number(projectId)),
    });

    const designs = Array.isArray(designData) ? designData : [];
    const approvedClientDesign = designs.find((d: Design) => d.status === 'approved');

    // Mutations
    const approveMutation = useMutation({
        mutationFn: DesignService.approveDesign,
        onSuccess: () => {
            toast.success("Design Approved!");
            queryClient.invalidateQueries({ queryKey: ["designs", projectId] });
            queryClient.invalidateQueries({ queryKey: ["project-v2", projectId] });
        }
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, comment }: { id: number, comment: string }) => DesignService.rejectDesign(id, comment),
        onSuccess: () => {
            toast.success("Revision Requested");
            queryClient.invalidateQueries({ queryKey: ["designs", projectId] });
            queryClient.invalidateQueries({ queryKey: ["project-v2", projectId] });
        }
    });

    // Debug Seed
    const seedMutation = useMutation({
        mutationFn: () => DesignService.seedDummyDesigns(projectId),
        onSuccess: () => {
            toast.success("Debug Designs Seeded");
            queryClient.invalidateQueries({ queryKey: ["designs", projectId] });
        },
        onError: () => toast.error("Seeding failed (maybe already exists?)")
    });

    if (isLoading) return <div>Loading designs...</div>;

    return (
        <div className="space-y-6">
            {/* ACC Design Card */}
            <AccDesignCard projectV2={projectV2} approvedClientDesign={approvedClientDesign} />

            {/* {designs.length === 0 ? (
                <div className="text-center p-12 border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50/50">
                    <p className="text-neutral-400 mb-4">No designs uploaded yet.</p>
                    <Button onClick={() => seedMutation.mutate()} variant="outline" className="text-orange-600 border-orange-200">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Simulate Studio Upload (Debug)
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {designs.map((design: Design) => (
                        <DesignCard
                            key={design.id}
                            design={design}
                            onApprove={() => approveMutation.mutate(design.id)}
                            onReject={(comment) => rejectMutation.mutate({ id: design.id, comment })}
                            isProcessing={approveMutation.isPending || rejectMutation.isPending}
                        />
                    ))}
                </div>
            )} */}
        </div>
    )
}

function AccDesignCard({ projectV2, approvedClientDesign }: { projectV2?: any; approvedClientDesign?: Design }) {
    const existingSpd = projectV2?.designs?.[0];
    const accDesign = existingSpd?.acc_design;

    const status = accDesign?.status || (approvedClientDesign ? "Approved" : null);
    const tanggalKirim = accDesign?.tanggal_kirim;
    const tanggalAcc = accDesign?.tanggal_acc || approvedClientDesign?.uploaded_at;
    const accFile = accDesign?.bukti_acc || existingSpd?.final_file_path || existingSpd?.spd_file || approvedClientDesign?.image_url;

    const getFileUrl = (path?: string | null) => {
        if (!path) return "";
        if (path.startsWith('http')) return path.replace('localhost:8081', 'localhost:8000');
        return `${STORAGE_BASE}/storage/${path.replace(/^\//, '')}`;
    };

    const isApproved = status?.toLowerCase() === 'approved';

    return (
        <Card className={`border shadow-sm transition-all duration-300 ${isApproved ? 'border-emerald-200 bg-white ring-1 ring-emerald-100' : 'border-neutral-200 bg-white'}`}>
            <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold shrink-0 ${isApproved ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-base font-bold text-neutral-800">
                            ACC Design
                        </CardTitle>
                        <CardDescription className="text-xs text-neutral-500">
                            Status persetujuan desain, tanggal pengiriman ke client, tanggal ACC, serta dokumen bukti/file desain yang disetujui.
                        </CardDescription>
                    </div>
                </div>
                {status && (
                    <Badge className={isApproved ? "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100" : "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100"}>
                        {status}
                    </Badge>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-neutral-50/80 p-4 rounded-xl border border-neutral-100">
                    <div>
                        <p className="text-xs text-neutral-500 font-medium">Status ACC</p>
                        <div className={`mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${isApproved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                            <span>{status || "Belum ada status"}</span>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs text-neutral-500 font-medium">Tanggal Dikirim ke Client</p>
                        <p className="text-sm font-semibold text-neutral-800 mt-1">
                            {tanggalKirim
                                ? format(new Date(tanggalKirim), 'd MMMM yyyy', { locale: idLocale })
                                : "-"}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-neutral-500 font-medium">Tanggal ACC</p>
                        <p className="text-sm font-semibold text-neutral-800 mt-1">
                            {tanggalAcc
                                ? format(new Date(tanggalAcc), 'd MMMM yyyy', { locale: idLocale })
                                : "-"}
                        </p>
                    </div>
                </div>

                {accFile ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-emerald-100 bg-emerald-50/40">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-neutral-800 truncate">File Desain yang Sudah ACC / Bukti ACC</p>
                                <p className="text-[10px] text-neutral-500 truncate">{accFile.split('/').pop()}</p>
                            </div>
                        </div>
                        <a
                            href={getFileUrl(accFile)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 bg-white border border-emerald-300 hover:bg-emerald-50 px-3.5 py-1.5 rounded-lg transition-colors shadow-xs shrink-0"
                        >
                            <Download className="h-3.5 w-3.5" />
                            <span>Lihat / Download File ACC</span>
                        </a>
                    </div>
                ) : (
                    <div className="p-3.5 text-xs text-neutral-400 italic bg-neutral-50 rounded-lg border border-neutral-100">
                        Belum ada file bukti atau desain yang di-ACC.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

const STORAGE_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace('/api', '');

function DesignCard({ design, onApprove, onReject, isProcessing }: {
    design: Design,
    onApprove: () => void,
    onReject: (c: string) => void,
    isProcessing: boolean
}) {
    const [comment, setComment] = useState("");
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [isImageOpen, setIsImageOpen] = useState(false);

    // Normalize URL: Ensure it's absolute and points to the correct backend
    const getFullUrl = (url: string) => {
        if (!url) return "";
        if (url.startsWith('http')) {
            // If backend APP_URL is 8081 but we are serving at 8000, fix it
            return url.replace('localhost:8081', 'localhost:8000');
        }
        return `${STORAGE_BASE}/${url.startsWith('/') ? url.slice(1) : url}`;
    };

    const imageUrl = getFullUrl(design.image_url);
    const isPdf = imageUrl.toLowerCase().endsWith('.pdf');

    return (
        <>
            <Card className={`overflow-hidden transition-all duration-300 ${design.status === 'approved' ? 'border-green-200 bg-green-50/10' : 'border-neutral-200 shadow-md hover:shadow-lg'}`}>
                <div
                    className="h-64 bg-neutral-200 relative group cursor-pointer overflow-hidden"
                    onClick={() => setIsImageOpen(true)}
                >
                    {isPdf ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-100 text-neutral-400">
                            <FileText className="h-12 w-12 mb-2" />
                            <span className="text-xs font-medium">PDF Design Document</span>
                            <span className="text-[10px]">Click to full view</span>
                        </div>
                    ) : (
                        <img src={imageUrl} alt={design.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}

                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Eye className="text-white opacity-0 group-hover:opacity-100 h-8 w-8 drop-shadow-lg transform scale-50 group-hover:scale-100 transition-all duration-300" />
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                        {design.status === 'approved' && <Badge className="bg-green-600 text-white"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>}
                        {design.status === 'rejected' && <Badge className="bg-red-600 text-white"><AlertCircle className="h-3 w-3 mr-1" /> Revision Requested</Badge>}
                        {design.status === 'pending' && <Badge className="bg-yellow-500 text-white shadow-sm flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Action Required</Badge>}
                    </div>
                </div>

                <CardHeader>
                    <CardTitle className="flex justify-between items-start">
                        <span>{design.title}</span>
                        <span className="text-xs text-neutral-400 font-normal capitalize">{design.type}</span>
                    </CardTitle>
                    <CardDescription>Uploaded by {design.uploader} • {design.uploaded_at}</CardDescription>
                </CardHeader>

                {design.status === 'rejected' && (
                    <div className="px-6 pb-4">
                        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                            <strong>My Revision Request:</strong> {design.comment}
                        </p>
                    </div>
                )}

                {design.status === 'pending' && (
                    <CardFooter className="flex gap-3 bg-neutral-50/50 p-6 z-10">
                        <Button onClick={onApprove} disabled={isProcessing} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                            <CheckCircle className="h-4 w-4 mr-2" /> Approve
                        </Button>

                        <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="flex-1 text-neutral-600">Request Revision</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Request Revision</DialogTitle>
                                    <DialogDescription>Please describe what change you need for this design.</DialogDescription>
                                </DialogHeader>
                                <Textarea
                                    placeholder="Example: Color is too dark, please make it lighter..."
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                />
                                <DialogFooter>
                                    <Button onClick={() => { onReject(comment); setIsRejectOpen(false); }} disabled={!comment}>Submit Request</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardFooter>
                )}
            </Card>

            {/* Image Preview Dialog */}
            <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
                <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0 border-none bg-black/95">
                    <DialogTitle className="sr-only">View Design: {design.title}</DialogTitle>
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                        {isPdf ? (
                            <iframe
                                src={`${imageUrl}#toolbar=0`}
                                className="w-full h-full border-none"
                                title="Design Viewer"
                            />
                        ) : (
                            <img
                                src={imageUrl}
                                alt={design.title}
                                className="max-w-full max-h-full object-contain"
                            />
                        )}
                        <button
                            onClick={() => setIsImageOpen(false)}
                            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors z-20"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                </DialogContent>
            </Dialog>
        </>
    );
}

function DocumentsTabContent({ projectId }: { projectId: string }) {
    const queryClient = useQueryClient();
    const [isViewerOpen, setIsViewerOpen] = useState(false);

    const { data: sph, isLoading: isLoadingSPH } = useQuery({
        queryKey: ["sph", projectId],
        queryFn: () => DocumentService.getSPH(projectId)
    });

    const { data: spk, isLoading: isLoadingSPK } = useQuery({
        queryKey: ["spk", projectId],
        queryFn: () => DocumentService.getSPK(projectId)
    });

    const { data: invoiceData, isLoading: isLoadingInvoices } = useQuery({
        queryKey: ["invoices", projectId],
        queryFn: () => DocumentService.getInvoices(projectId)
    });

    const invoices = Array.isArray(invoiceData)
        ? invoiceData
        : (Array.isArray(invoiceData?.data) ? invoiceData.data : []);

    const approveSPHMutation = useMutation({
        mutationFn: async (file: File | null) => {
            if (file) {
                // Return promise chain: Upload -> Approve
                await DocumentService.uploadSignedSPH(projectId, file);
            }
            return DocumentService.approveSPH(projectId);
        },
        onSuccess: () => {
            toast.success("SPH Signed & Approved!");
            queryClient.invalidateQueries({ queryKey: ["sph", projectId] });
            setIsViewerOpen(false);
        },
        onError: () => toast.error("Failed to approve SPH")
    });

    const rejectSPHMutation = useMutation({
        mutationFn: (reason: string) => DocumentService.rejectSPH(projectId, reason),
        onSuccess: () => {
            toast.success("Revision Request Sent");
            queryClient.invalidateQueries({ queryKey: ["sph", projectId] });
            setIsViewerOpen(false);
        },
        onError: () => toast.error("Failed to send revision request")
    });


    const [isSPKViewerOpen, setIsSPKViewerOpen] = useState(false);

    // Client SPK Upload State
    const [spkNumber, setSpkNumber] = useState("");
    const [spkFile, setSpkFile] = useState<File | null>(null);
    const spkFileInputRef = useRef<HTMLInputElement>(null);

    const approveSPKMutation = useMutation({
        mutationFn: async (file: File | null) => {
            if (file) {
                await DocumentService.uploadSignedSPK(projectId, file);
                return DocumentService.approveSPK(projectId);
            } else {
                toast.error("Please upload signed SPK");
                throw new Error("No file uploaded");
            }
        },
        onSuccess: () => {
            toast.success("SPK Signed & Approved!");
            queryClient.invalidateQueries({ queryKey: ["spk", projectId] });
            setIsSPKViewerOpen(false);
        },
        onError: () => toast.error("Failed to approve SPK")
    });

    const rejectSPKMutation = useMutation({
        mutationFn: (reason: string) => DocumentService.rejectSPK(projectId, reason),
        onSuccess: () => {
            toast.success("Revision Request Sent");
            queryClient.invalidateQueries({ queryKey: ["spk", projectId] });
            setIsSPKViewerOpen(false);
        },
        onError: () => toast.error("Failed to send revision request")
    });

    const uploadClientSPKMutation = useMutation({
        mutationFn: (data: { spk_number: string; deadline?: string; file: File }) =>
            DocumentService.uploadClientSPK(projectId, data),
        onSuccess: () => {
            toast.success("SPK berhasil diupload!");
            queryClient.invalidateQueries({ queryKey: ["spk", projectId] });
            setSpkNumber("");
            setSpkFile(null);
            if (spkFileInputRef.current) spkFileInputRef.current.value = "";
        },
        onError: () => toast.error("Gagal mengupload SPK")
    });

    const handleClientSPKUpload = () => {
        if (!spkNumber.trim() || !spkFile) return;
        uploadClientSPKMutation.mutate({
            spk_number: spkNumber.trim(),
            file: spkFile,
        });
    };

    const isSPHApproved = sph?.sph_status === 'approved';

    if (isLoadingSPH || isLoadingSPK || isLoadingInvoices) return <div>Loading documents...</div>;

    return (
        <div className="space-y-6">
            {/* 1. SPH Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex justify-between">
                        <span>Quotation (SPH)</span>
                        {sph?.sph_status === 'approved' && <Badge className="bg-emerald-600">Approved</Badge>}
                        {sph?.sph_status === 'pending' && <Badge variant="outline" className="text-blue-600 border-blue-200">Pending</Badge>}
                        {sph?.sph_status === 'revision' && <Badge className="bg-red-600">Revision</Badge>}
                    </CardTitle>
                    <CardDescription>Review and approve the commercial quotation.</CardDescription>
                </CardHeader>
                <CardContent>
                    {sph ? (
                        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-medium text-neutral-900">{sph.sph_number}</p>
                                    <p className="text-xs text-neutral-500">Amount: Rp {sph.amount ? Number(sph.amount).toLocaleString('id-ID') : '0'}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {sph.file_url ? (
                                    <>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-white bg-blue-600 hover:bg-blue-700 border-none"
                                            onClick={() => setIsViewerOpen(true)}
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            {sph?.sph_status !== 'approved' ? 'View & Approve' : 'View'}
                                        </Button>

                                        <SPHViewerDialog
                                            open={isViewerOpen}
                                            onOpenChange={setIsViewerOpen}
                                            url={sph.file_url}
                                            sphNumber={sph.sph_number}
                                            status={sph.sph_status}
                                            onApprove={(file) => approveSPHMutation.mutate(file)}
                                            onReject={(reason) => rejectSPHMutation.mutate(reason)}
                                            isApproving={approveSPHMutation.isPending}
                                        />
                                    </>
                                ) : (
                                    <span className="text-xs text-neutral-400 italic">No document uploaded</span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6 border-dashed border-2 rounded-lg text-neutral-400 text-sm">
                            SPH not yet generated.
                        </div>
                    )}

                    {/* SPH History Section */}
                    {sph?.sph_history && sph.sph_history.length > 1 && (
                        <div className="mt-8 pt-8 border-t border-neutral-100">
                            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <History className="h-3 w-3" />
                                Revision History
                            </h4>
                            <div className="space-y-4">
                                {sph.sph_history.slice(1).map((hist: any, idx: number) => (
                                    <div key={idx} className="group relative pl-6 border-l-2 border-neutral-100 hover:border-orange-200 transition-colors">
                                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-white border-2 border-neutral-100 group-hover:border-orange-200 transition-colors flex items-center justify-center">
                                            <div className="h-1.5 w-1.5 rounded-full bg-neutral-300 group-hover:bg-orange-400" />
                                        </div>
                                        <div className="bg-neutral-50/50 rounded-xl p-4 border border-neutral-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 bg-white rounded-lg border border-neutral-100 flex items-center justify-center text-neutral-400">
                                                        <FileText className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-neutral-800">{hist.nomor_sph}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <Clock className="h-3 w-3 text-neutral-400" />
                                                            <p className="text-[10px] text-neutral-500">
                                                                {format(new Date(hist.created_at), 'MMM d, yyyy HH:mm')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="ghost" className="h-8 text-[10px] text-blue-600 hover:bg-blue-50" asChild>
                                                    <a href={hist.file_url} target="_blank" rel="noopener noreferrer">
                                                        <Download className="h-3 w-3 mr-1.5" />
                                                        View PDF
                                                    </a>
                                                </Button>
                                            </div>
                                            {hist.note_revision && (
                                                <div className="mt-3 p-3 bg-red-50/50 rounded-lg border border-red-100/50">
                                                    <p className="text-[10px] font-bold text-red-800 uppercase tracking-tight mb-1">Feedback from Client:</p>
                                                    <p className="text-xs text-red-700 italic leading-relaxed">
                                                        "{hist.note_revision}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 2. SPK Section */}
            <Card className={spk?.spk_status === 'approved' ? 'border-green-200' : ''}>
                <CardHeader>
                    <CardTitle className="flex justify-between">
                        <span>Contract (SPK)</span>
                    </CardTitle>
                    <CardDescription>Signed work agreement.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {spk ? (
                        <>
                            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${spk.spk_status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-neutral-900">{spk.spk_number}</p>
                                        <p className="text-xs text-neutral-500">
                                            {spk.spk_status === 'approved' ? 'Approved & Signed' : spk.spk_file_url ? 'Waiting for admin approval' : 'Draft / Waiting Signature'}
                                        </p>
                                        {/* {spk.deadline && (
                                            <p className="text-xs text-neutral-400 mt-0.5">
                                                Deadline: {new Date(spk.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                        )} */}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {(spk.spk_file_url || spk.file_path) && spk.spk_status !== 'approved' && (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-white bg-blue-600 hover:bg-blue-700 border-none"
                                                onClick={() => setIsSPKViewerOpen(true)}
                                            >
                                                <Eye className="h-4 w-4 mr-2" /> View
                                            </Button>

                                            <SPKViewerDialog
                                                open={isSPKViewerOpen}
                                                onOpenChange={setIsSPKViewerOpen}
                                                url={spk.spk_file_url || spk.file_path}
                                                spkNumber={spk.spk_number}
                                                status={spk.status}
                                                onApprove={(file) => approveSPKMutation.mutate(file)}
                                                onReject={(reason) => rejectSPKMutation.mutate(reason)}
                                                isApproving={approveSPKMutation.isPending}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Signed SPK from Admin */}
                            {spk.spk_status === 'approved' && spk.spk_signed_file_url && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <span className="text-sm font-medium text-green-700">SPK Bertanda Tangan (Signed)</span>
                                    </div>
                                    <p className="text-xs text-green-600/80">
                                        Dokumen SPK yang sudah ditandatangani oleh admin tersedia untuk diunduh.
                                    </p>
                                    <a href={spk.spk_signed_file_url} target="_blank" rel="noopener noreferrer">
                                        <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-100">
                                            <Eye className="h-4 w-4 mr-2" /> View SPK Bertanda Tangan
                                        </Button>
                                    </a>
                                </div>
                            )}

                            {/* SPK History Section */}
                            {spk?.spk_history && spk.spk_history.length > 0 && (
                                <div className="mt-8 pt-8 border-t border-neutral-100">
                                    <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <History className="h-3 w-3" />
                                        SPK History
                                    </h4>
                                    <div className="space-y-4">
                                        {spk.spk_history.map((hist: any, idx: number) => (
                                            <div key={idx} className="group relative pl-6 border-l-2 border-neutral-100 hover:border-blue-200 transition-colors">
                                                <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-white border-2 border-neutral-100 group-hover:border-blue-200 transition-colors flex items-center justify-center">
                                                    <div className={`h-1.5 w-1.5 rounded-full ${hist.spk_status === 'approved' ? 'bg-green-500' : 'bg-neutral-300'}`} />
                                                </div>
                                                <div className="bg-neutral-50/50 rounded-xl p-4 border border-neutral-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`h-8 w-8 rounded-lg border border-neutral-100 flex items-center justify-center ${hist.spk_status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-white text-neutral-400'}`}>
                                                                <FileText className="h-4 w-4" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-neutral-800">{hist.nomor_spk}</p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <Clock className="h-3 w-3 text-neutral-400" />
                                                                    <p className="text-[10px] text-neutral-500">
                                                                        {format(new Date(hist.created_at), 'MMM d, yyyy HH:mm')}
                                                                    </p>
                                                                    <Badge variant="outline" className={`text-[9px] h-4 px-1.5 capitalize ${
                                                                        hist.spk_status === 'approved' ? 'border-green-200 text-green-600' : 'border-blue-200 text-blue-600'
                                                                    }`}>
                                                                        {hist.spk_status || 'Draft'}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {hist.file_url && (
                                                                <Button size="sm" variant="ghost" className="h-8 text-[10px] text-blue-600 hover:bg-blue-50" asChild>
                                                                    <a href={hist.file_url} target="_blank" rel="noopener noreferrer">
                                                                        <Eye className="h-3 w-3 mr-1.5" />
                                                                        View Draft
                                                                    </a>
                                                                </Button>
                                                            )}
                                                            {hist.spk_signed_file_url && (
                                                                <Button size="sm" variant="ghost" className="h-8 text-[10px] text-green-600 hover:bg-green-50" asChild>
                                                                    <a href={hist.spk_signed_file_url} target="_blank" rel="noopener noreferrer">
                                                                        <Download className="h-3 w-3 mr-1.5" />
                                                                        Signed PDF
                                                                    </a>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-6 border-dashed border-2 rounded-lg text-neutral-400 text-sm">
                            SPK not yet available.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 3. Client SPK Upload Section — hidden after SPK is approved */}
            {/* {spk?.spk_status !== 'approved' && !spk?.spk_signed_file_url && (
            <Card className={`relative transition-all duration-300 ${!isSPHApproved ? 'opacity-60 pointer-events-none' : 'border-blue-200 shadow-sm'}`}>
                {!isSPHApproved && (
                    <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[1px] rounded-lg flex flex-col items-center justify-center gap-2">
                        <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center">
                            <Lock className="h-5 w-5 text-neutral-400" />
                        </div>
                        <p className="text-sm font-medium text-neutral-500">SPH harus disetujui terlebih dahulu</p>
                        <p className="text-xs text-neutral-400">Approve the quotation (SPH) above to unlock this section</p>
                    </div>
                )}
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5 text-blue-600" />
                        Upload SPK (Surat Perintah Kerja)
                    </CardTitle>
                    <CardDescription>Upload your signed work order / contract document.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="spk-number" className="text-sm font-medium text-neutral-700">
                            Nomor SPK <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="spk-number"
                            placeholder="Contoh: SPK-2026/04/001"
                            value={spkNumber}
                            onChange={(e) => setSpkNumber(e.target.value)}
                            className="h-10"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="spk-file" className="text-sm font-medium text-neutral-700">
                            Upload File SPK <span className="text-red-500">*</span>
                        </Label>
                        <div
                            className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 ${
                                spkFile ? 'border-green-300 bg-green-50/30' : 'border-neutral-200 bg-neutral-50/50'
                            }`}
                            onClick={() => spkFileInputRef.current?.click()}
                        >
                            <input
                                ref={spkFileInputRef}
                                id="spk-file"
                                type="file"
                                accept=".pdf"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setSpkFile(e.target.files[0]);
                                    }
                                }}
                            />
                            {spkFile ? (
                                <div className="flex items-center justify-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                                        <FileText className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-neutral-900">{spkFile.name}</p>
                                        <p className="text-xs text-neutral-500">{(spkFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                    <button
                                        type="button"
                                        className="ml-2 h-6 w-6 rounded-full bg-neutral-200 hover:bg-red-100 flex items-center justify-center transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSpkFile(null);
                                            if (spkFileInputRef.current) spkFileInputRef.current.value = "";
                                        }}
                                    >
                                        <X className="h-3 w-3 text-neutral-600" />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
                                        <Upload className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <p className="text-sm text-neutral-600">Klik untuk memilih file</p>
                                    <p className="text-xs text-neutral-400">Format: PDF (Maks. 10MB)</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <Button
                        onClick={handleClientSPKUpload}
                        disabled={!spkNumber.trim() || !spkFile || uploadClientSPKMutation.isPending}
                        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all"
                    >
                        {uploadClientSPKMutation.isPending ? (
                            <>
                                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Mengupload...
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload SPK
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
            )} */}

            {/* 4. Invoices */}
            {/* <Card>
                <CardHeader>
                    <CardTitle>Invoices</CardTitle>
                    <CardDescription>Payment history and pending bills.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {invoices.length === 0 ? (
                        <div className="text-center py-6 border-dashed border-2 rounded-lg text-neutral-400 text-sm">
                            No invoices issued yet.
                        </div>
                    ) : (
                        invoices.map((inv: any) => (
                            <div key={inv.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-neutral-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${inv.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-neutral-900">{inv.term_name} - {inv.invoice_number}</p>
                                        <p className="text-xs text-neutral-500">Due: {inv.due_date} • Rp {inv.amount.toLocaleString()}</p>
                                    </div>
                                </div>
                                <Badge variant={inv.status === 'paid' ? 'default' : 'destructive'} className={inv.status === 'paid' ? 'bg-green-600' : ''}>
                                    {inv.status.toUpperCase()}
                                </Badge>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card> */}
        </div >
    )
}

function ChatTabContent({ projectId }: { projectId: string }) {
    const queryClient = useQueryClient();
    const [newMessage, setNewMessage] = useState("");

    // Fetch Messages
    const { data: messageData, isLoading } = useQuery({
        queryKey: ["messages", projectId],
        queryFn: () => MessageService.getMessages(projectId),
        refetchInterval: 5000,
    });

    const messages = messageData?.data?.data || [];
    const safeMessages = Array.isArray(messages) ? messages : [];

    // Send Mutation
    const sendMutation = useMutation({
        mutationFn: (msg: string) => MessageService.sendMessage(projectId, msg),
        onSuccess: () => {
            setNewMessage("");
            queryClient.invalidateQueries({ queryKey: ["messages", projectId] });
        },
        onError: () => toast.error("Failed to send message")
    });

    const handleSend = () => {
        if (!newMessage.trim()) return;
        sendMutation.mutate(newMessage);
    };

    return (
        <Card className="h-[600px] flex flex-col">
            <CardHeader>
                <CardTitle>Project Discussion</CardTitle>
                <CardDescription>Chat directly with the internal team about this project.</CardDescription>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto space-y-4 p-6 bg-neutral-50/50">
                {isLoading ? (
                    <div className="text-center text-neutral-400 py-10">Loading functionality...</div>
                ) : safeMessages.length === 0 ? (
                    <div className="text-center text-neutral-400 py-10">
                        <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    safeMessages.map((msg: any) => (
                        <div key={msg.id} className={`flex gap-3 ${msg.user_id === 9999 ? 'justify-end' : ''}`}>
                            <div className={`p-4 rounded-xl max-w-[80%] shadow-sm ${msg.type === 'system' ? 'bg-gray-100 text-gray-500 w-full text-center italic' : 'bg-white border border-neutral-100'}`}>
                                <div className="flex justify-between items-center mb-1 gap-4">
                                    <span className="font-bold text-xs text-orange-600">{msg.user?.name || 'Unknown'}</span>
                                    <span className="text-[10px] text-neutral-400">{new Date(msg.created_at).toLocaleString()}</span>
                                </div>
                                <p className="text-sm text-neutral-800">{msg.message}</p>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>

            <CardFooter className="p-4 border-t bg-white">
                <div className="flex gap-2 w-full">
                    <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message here..."
                        className="resize-none min-h-[50px]"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    <Button onClick={handleSend} disabled={sendMutation.isPending || !newMessage.trim()} className="h-auto px-6 bg-orange-600 hover:bg-orange-700">
                        {sendMutation.isPending ? "..." : "Send"}
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}

function KesiapanLokasiTabContent({ projectId }: { projectId: string | number }) {
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [lightboxTitle, setLightboxTitle] = useState<string>('');

    const { data: readinessResponse, isLoading } = useQuery({
        queryKey: ['site-readiness', projectId],
        queryFn: () => projectV2Service.getSiteReadiness(projectId),
    });

    const logs = readinessResponse?.data || [];
    const currentPercentage = readinessResponse?.readiness_percentage ?? 0;

    const getReadinessStatusInfo = (pct: number) => {
        if (pct === 100) {
            return {
                label: 'Lokasi Siap 100% (Ready for Delivery)',
                color: 'text-emerald-700 bg-emerald-50 border-emerald-300 ring-emerald-500/20',
                badgeBg: 'bg-emerald-600',
                progressBar: 'bg-emerald-500',
                icon: CheckCircle2,
            };
        }
        if (pct >= 75) {
            return {
                label: 'Sebagian Besar Siap (Final Finishing)',
                color: 'text-blue-700 bg-blue-50 border-blue-300 ring-blue-500/20',
                badgeBg: 'bg-blue-600',
                progressBar: 'bg-blue-500',
                icon: Sparkles,
            };
        }
        if (pct >= 40) {
            return {
                label: 'Dalam Pengerjaan Konstruksi / MEP',
                color: 'text-amber-700 bg-amber-50 border-amber-300 ring-amber-500/20',
                badgeBg: 'bg-amber-600',
                progressBar: 'bg-amber-500',
                icon: Clock,
            };
        }
        return {
            label: 'Tahap Awal / Belum Siap',
            color: 'text-rose-700 bg-rose-50 border-rose-300 ring-rose-500/20',
            badgeBg: 'bg-rose-600',
            progressBar: 'bg-rose-500',
            icon: AlertTriangle,
        };
    };

    const statusInfo = getReadinessStatusInfo(currentPercentage);
    const StatusIcon = statusInfo.icon;

    if (isLoading) {
        return (
            <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-neutral-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Overview Banner Card */}
            <Card className="border border-neutral-200 shadow-sm bg-gradient-to-br from-white via-neutral-50/50 to-neutral-100/30 overflow-hidden">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        {/* Left Column: Big Percentage Status */}
                        <div className="md:col-span-6 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4 text-orange-600" />
                                    Status Kesiapan Lokasi Proyek
                                </span>
                                <span className="text-3xl font-extrabold tracking-tight text-neutral-900">
                                    {currentPercentage}%
                                </span>
                            </div>

                            {/* Visual Progress Bar */}
                            <div className="w-full bg-neutral-200 h-3.5 rounded-full overflow-hidden p-0.5 border border-neutral-300 shadow-inner">
                                <div
                                    className={cn(
                                        'h-full rounded-full transition-all duration-700 ease-out',
                                        statusInfo.progressBar
                                    )}
                                    style={{ width: `${Math.min(100, Math.max(0, currentPercentage))}%` }}
                                />
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                                <span
                                    className={cn(
                                        'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border shadow-xs',
                                        statusInfo.color
                                    )}
                                >
                                    <StatusIcon className="h-3.5 w-3.5" />
                                    {statusInfo.label}
                                </span>
                            </div>
                        </div>

                        {/* Right Column: Stats info */}
                        <div className="md:col-span-6 grid grid-cols-2 gap-4 border-t md:border-t-0 md:border-l border-neutral-200 pt-4 md:pt-0 md:pl-6">
                            <div className="space-y-1">
                                <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                                    Total Riwayat Update
                                </p>
                                <p className="text-2xl font-bold text-neutral-900">
                                    {logs.length} <span className="text-xs font-normal text-neutral-500">catatan</span>
                                </p>
                                <p className="text-[11px] text-neutral-500">
                                    Dokumentasi & pemantauan fisik lokasi
                                </p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                                    Pembaruan Terakhir
                                </p>
                                {logs.length > 0 ? (
                                    <>
                                        <p className="text-xs font-semibold text-neutral-900 truncate">
                                            {format(new Date(logs[0].created_at), 'dd MMM yyyy, HH:mm', { locale: idLocale })}
                                        </p>
                                        <p className="text-[11px] text-neutral-500 truncate">
                                            Oleh: <span className="font-medium text-neutral-700">{logs[0].user?.name || 'Marketing'}</span>
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-xs text-neutral-400 italic">Belum ada data</p>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* History / Timeline Log List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-neutral-600" />
                            Riwayat Kesiapan Lokasi
                        </h2>
                        <p className="text-xs text-neutral-500">
                            Kronologis pemantauan dan dokumentasi progres kesiapan fisik lapangan proyek.
                        </p>
                    </div>
                    <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1 bg-white border-neutral-300">
                        {logs.length} Update Tercatat
                    </Badge>
                </div>

                {logs.length === 0 ? (
                    <Card className="border border-dashed border-neutral-300 p-12 text-center bg-neutral-50/50">
                        <div className="flex flex-col items-center justify-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                                <MapPin className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-neutral-800">Belum Ada Riwayat Kesiapan Lokasi</h3>
                                <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                                    Tim belum menambahkan catatan atau bukti dokumentasi kesiapan lokasi untuk proyek ini.
                                </p>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {logs.map((log: any, index: number) => {
                            const logStatus = getReadinessStatusInfo(log.persentase);

                            return (
                                <Card
                                    key={log.id}
                                    className="border border-neutral-200 shadow-sm hover:shadow-md transition-all overflow-hidden bg-white"
                                >
                                    {/* Header Card */}
                                    <CardHeader className="p-4 pb-3 border-b border-neutral-100 bg-neutral-50/40">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                {/* Percentage Badge */}
                                                <div
                                                    className={cn(
                                                        'h-10 w-12 rounded-xl flex flex-col items-center justify-center font-extrabold text-white text-sm shadow-xs shrink-0',
                                                        logStatus.badgeBg
                                                    )}
                                                >
                                                    <span>{log.persentase}%</span>
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                                                            <MapPin className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                                                            {log.ruang || 'Umum'}
                                                        </h3>
                                                        {index === 0 && (
                                                            <span className="text-[10px] font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                                                                Terkini
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                                                        <span>{format(new Date(log.created_at), 'EEEE, dd MMMM yyyy - HH:mm', { locale: idLocale })}</span>
                                                        <span>•</span>
                                                        <span>Oleh: <strong className="text-neutral-700">{log.user?.name || 'Marketing'}</strong></span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    {/* Content */}
                                    <CardContent className="p-4 space-y-4">
                                        {/* Description */}
                                        <p className="text-xs leading-relaxed text-neutral-800 whitespace-pre-line">
                                            {log.keterangan}
                                        </p>

                                        {/* Media (Photos & Videos) */}
                                        {log.media && log.media.length > 0 && (
                                          <div className="space-y-3 pt-2 border-t border-neutral-100">
                                            {/* Photos */}
                                            {log.media.filter((m: any) => m.file_type === 'image').length > 0 && (
                                              <div className="space-y-1.5">
                                                <p className="text-[11px] font-semibold text-neutral-500 flex items-center gap-1.5">
                                                  <ImageIcon className="h-3.5 w-3.5" />
                                                  Foto Lapangan:
                                                </p>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                                                  {log.media
                                                    .filter((m: any) => m.file_type === 'image')
                                                    .map((img: any) => (
                                                      <div
                                                        key={img.id}
                                                        onClick={() => {
                                                          setLightboxImage(img.url);
                                                          setLightboxTitle(img.file_name || 'Foto Lapangan');
                                                        }}
                                                        className="group relative aspect-video sm:aspect-square rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100 cursor-pointer shadow-xs hover:border-orange-400 transition-all"
                                                      >
                                                        <img
                                                          src={img.url}
                                                          alt={img.file_name || 'Foto'}
                                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                          <Eye className="h-5 w-5 text-white" />
                                                        </div>
                                                      </div>
                                                    ))}
                                                </div>
                                              </div>
                                            )}

                                            {/* Videos */}
                                            {log.media.filter((m: any) => m.file_type === 'video').length > 0 && (
                                              <div className="space-y-1.5">
                                                <p className="text-[11px] font-semibold text-neutral-500 flex items-center gap-1.5">
                                                  <Video className="h-3.5 w-3.5" />
                                                  Video Dokumentasi:
                                                </p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                  {log.media
                                                    .filter((m: any) => m.file_type === 'video')
                                                    .map((vid: any) => (
                                                      <div
                                                        key={vid.id}
                                                        className="rounded-lg overflow-hidden border border-neutral-200 bg-black aspect-video"
                                                      >
                                                        <video
                                                          src={vid.url}
                                                          controls
                                                          playsInline
                                                          className="w-full h-full object-contain"
                                                        />
                                                      </div>
                                                    ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Lightbox Modal for Fullsize Photo Preview */}
            <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
                <DialogContent className="max-w-4xl p-2 bg-neutral-950 border-neutral-800 text-white">
                    <DialogHeader className="px-4 pt-2 pb-0">
                        <DialogTitle className="text-sm font-medium text-neutral-300 truncate">
                            {lightboxTitle || 'Foto Kesiapan Lokasi'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="relative w-full flex items-center justify-center p-2 max-h-[80vh] overflow-hidden">
                        {lightboxImage && (
                            <img
                                src={lightboxImage}
                                alt={lightboxTitle || 'Preview'}
                                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
