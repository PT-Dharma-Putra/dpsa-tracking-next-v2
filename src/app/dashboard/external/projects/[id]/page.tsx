"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Download, CheckCircle, AlertCircle, MessageSquare, PlusCircle, FileText, Eye } from "lucide-react"
import { ProjectService } from "@/features/projects/services/project-service"
import { DesignService, Design } from "@/features/projects/services/design-service"
import { DocumentService } from "@/features/projects/services/document-service"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { OverviewTab } from "@/features/projects/components/phases/overview-tab"
import { SPHViewerDialog } from "@/features/projects/components/sph/sph-viewer-dialog"
import { SPKViewerDialog } from "@/features/projects/components/spk/spk-viewer-dialog"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { MessageService } from "@/features/projects/services/message-service"

export default function ClientProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const queryClient = useQueryClient();

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
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/external/projects" className="text-neutral-400 hover:text-orange-600 transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">{project.name}</h1>
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-none uppercase tracking-wider text-[10px]">
                            {project.status?.replace(/_/g, " ")}
                        </Badge>
                    </div>
                    <p className="text-neutral-500 text-sm ml-8">
                        {project.description || "Project details and tracking information."}
                    </p>
                </div>

                <div className="flex gap-2 ml-8 md:ml-0">
                    <Button variant="outline" className="text-neutral-600">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Contact Team
                    </Button>
                </div>
            </div>

            <Separator />

            {/* Main Tabs */}
            <Tabs defaultValue="tracking" className="w-full">
                <TabsList className="bg-neutral-100 p-1 mb-6">
                    <TabsTrigger value="tracking" className="px-6 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm">Tracking & Status</TabsTrigger>
                    <TabsTrigger value="designs" className="px-6 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm">Design Approvals</TabsTrigger>
                    <TabsTrigger value="docs" className="px-6 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm">Documents</TabsTrigger>
                    <TabsTrigger value="chat" className="px-6 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm">Discussion</TabsTrigger>
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

                <TabsContent value="chat" className="space-y-4">
                    <ChatTabContent projectId={id} />
                </TabsContent>
            </Tabs>
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

    const designs = Array.isArray(designData) ? designData : [];

    // Mutations
    const approveMutation = useMutation({
        mutationFn: DesignService.approveDesign,
        onSuccess: () => {
            toast.success("Design Approved!");
            queryClient.invalidateQueries({ queryKey: ["designs", projectId] });
        }
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, comment }: { id: number, comment: string }) => DesignService.rejectDesign(id, comment),
        onSuccess: () => {
            toast.success("Revision Requested");
            queryClient.invalidateQueries({ queryKey: ["designs", projectId] });
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

    if (designs.length === 0) {
        return (
            <div className="text-center p-12 border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50/50">
                <p className="text-neutral-400 mb-4">No designs uploaded yet.</p>
                <Button onClick={() => seedMutation.mutate()} variant="outline" className="text-orange-600 border-orange-200">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Simulate Studio Upload (Debug)
                </Button>
            </div>
        );
    }

    return (
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
    )
}

function DesignCard({ design, onApprove, onReject, isProcessing }: {
    design: Design,
    onApprove: () => void,
    onReject: (c: string) => void,
    isProcessing: boolean
}) {
    const [comment, setComment] = useState("");
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [isImageOpen, setIsImageOpen] = useState(false);

    return (
        <>
            <Card className={`overflow-hidden transition-all duration-300 ${design.status === 'approved' ? 'border-green-200 bg-green-50/10' : 'border-neutral-200 shadow-md hover:shadow-lg'}`}>
                <div
                    className="h-64 bg-neutral-200 relative group cursor-pointer overflow-hidden"
                    onClick={() => setIsImageOpen(true)}
                >
                    <img src={design.image_url} alt={design.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />

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
                    <DialogTitle className="sr-only">View Image: {design.title}</DialogTitle>
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                        <img
                            src={design.image_url}
                            alt={design.title}
                            className="max-w-full max-h-full object-contain"
                        />
                        <button
                            onClick={() => setIsImageOpen(false)}
                            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
                        >
                            <ArrowLeft className="h-6 w-6" /> {/* reusing ArrowLeft as 'Close' to avoid importing X if not available, or use native behavior */}
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
        mutationFn: () => DocumentService.approveSPH(projectId),
        onSuccess: () => {
            toast.success("SPH Approved! We will prepare the SPK.");
            queryClient.invalidateQueries({ queryKey: ["sph", projectId] });
            setIsViewerOpen(false);
        }
    });

    const [isSPKViewerOpen, setIsSPKViewerOpen] = useState(false);

    const approveSPKMutation = useMutation({
        mutationFn: () => DocumentService.approveSPK(projectId),
        onSuccess: () => {
            toast.success("SPK Signed & Approved!");
            queryClient.invalidateQueries({ queryKey: ["spk", projectId] });
            setIsSPKViewerOpen(false);
        }
    });

    if (isLoadingSPH || isLoadingSPK || isLoadingInvoices) return <div>Loading documents...</div>;

    return (
        <div className="space-y-6">

            {/* 1. SPH Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex justify-between">
                        <span>Quotation (SPH)</span>
                        {sph?.status === 'approved' && <Badge className="bg-green-600">Approved</Badge>}
                        {sph?.status === 'pending' && <Badge variant="outline" className="text-orange-600 border-orange-200">Waiting Approval</Badge>}
                        {sph?.status === 'rejected' && <Badge className="bg-red-600">Revision Requested</Badge>}
                        {sph?.status === 'draft' && <Badge variant="outline" className="text-neutral-400">Draft</Badge>}
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
                                    <p className="text-xs text-neutral-500">Amount: Rp {sph.total_amount?.toLocaleString()}</p>
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
                                            <Eye className="h-4 w-4 mr-2" /> View & Approve
                                        </Button>

                                        <SPHViewerDialog
                                            open={isViewerOpen}
                                            onOpenChange={setIsViewerOpen}
                                            url={sph.file_url}
                                            sphNumber={sph.sph_number}
                                            status={sph.status}
                                            onApprove={() => approveSPHMutation.mutate()}
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
                </CardContent>
            </Card>

            {/* 2. SPK Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Contract (SPK)</CardTitle>
                    <CardDescription>Signed work agreement.</CardDescription>
                </CardHeader>
                <CardContent>
                    {spk ? (
                        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-medium text-neutral-900">{spk.spk_number}</p>
                                    <p className="text-xs text-neutral-500">{spk.spk_file_url ? 'Signed & Valid' : 'Draft / Waiting Signature'}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {(spk.spk_file_url || spk.file_path) && (
                                    <>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-white bg-blue-600 hover:bg-blue-700 border-none"
                                            onClick={() => setIsSPKViewerOpen(true)}
                                        >
                                            <Eye className="h-4 w-4 mr-2" /> View & Sign
                                        </Button>

                                        <SPKViewerDialog
                                            open={isSPKViewerOpen}
                                            onOpenChange={setIsSPKViewerOpen}
                                            url={spk.spk_file_url || spk.file_path}
                                            spkNumber={spk.spk_number}
                                            status={spk.status} // creating new status prop or logic if needed, usually 'pending' for external if not signed
                                            onApprove={() => approveSPKMutation.mutate()}
                                            isApproving={approveSPKMutation.isPending}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6 border-dashed border-2 rounded-lg text-neutral-400 text-sm">
                            SPK not yet available.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 3. Invoices */}
            <Card>
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
            </Card>
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
