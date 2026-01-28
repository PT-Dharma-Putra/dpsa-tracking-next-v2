"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Download, CheckCircle, AlertCircle, MessageSquare, PlusCircle } from "lucide-react"
import { ProjectService } from "@/features/projects/services/project-service"
import { DesignService, Design } from "@/features/projects/services/design-service" // Import Design Service
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { OverviewTab } from "@/features/projects/components/phases/overview-tab"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

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
                        <Link href="/dashboard/client/projects" className="text-neutral-400 hover:text-orange-600 transition-colors">
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
                </TabsList>

                <TabsContent value="tracking" className="space-y-6">
                    <OverviewTab projectId={Number(id)} />
                </TabsContent>

                <TabsContent value="designs" className="space-y-6">
                    <DesignTabContent projectId={id} />
                </TabsContent>

                <TabsContent value="docs" className="space-y-4">
                    <DocumentsTabContent />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function DesignTabContent({ projectId }: { projectId: string }) {
    const queryClient = useQueryClient();

    // Fetch Designs
    const { data: designs = [], isLoading } = useQuery({
        queryKey: ["designs", projectId],
        queryFn: () => DesignService.getProjectDesigns(projectId),
    });

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

    return (
        <Card className={`overflow-hidden transition-all duration-300 ${design.status === 'approved' ? 'border-green-200 bg-green-50/10' : 'border-neutral-200 shadow-md hover:shadow-lg'}`}>
            <div className="h-64 bg-neutral-200 relative group cursor-pointer overflow-hidden">
                <img src={design.image_url} alt={design.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />

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
    );
}

function DocumentsTabContent() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Project Documents</CardTitle>
                <CardDescription>Download official documents related to this project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-0">
                {[
                    { name: "Penawaran Harga (SPH) - Final.pdf", date: "20 Jan 2024", size: "2.4 MB", type: "SPH" },
                    { name: "Kontrak Kerja (SPK).pdf", date: "22 Jan 2024", size: "1.1 MB", type: "Legal" },
                    { name: "Invoice DP 30%.pdf", date: "22 Jan 2024", size: "450 KB", type: "Finance" },
                ].map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors border-b last:border-0 border-neutral-100">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                                <Download className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-medium text-neutral-900">{doc.name}</p>
                                <div className="flex items-center gap-2 text-xs text-neutral-500">
                                    <span>{doc.date}</span>
                                    <span>•</span>
                                    <span>{doc.size}</span>
                                    <Badge variant="outline" className="ml-2 h-5 text-[10px]">{doc.type}</Badge>
                                </div>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                            Download
                        </Button>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
