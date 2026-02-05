"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { DesignService, SPHItem, DesignStatus } from "@/features/projects/services/design-service"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, FileText, Download, Eye, Upload } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const STATUS_COLUMNS: DesignStatus[] = ['TODO', 'ON_DESIGN', 'IN_REVIEW', 'REVISION', 'DONE'];

export default function DesignStudioPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = use(params);
    const queryClient = useQueryClient();
    const [selectedItem, setSelectedItem] = useState<SPHItem | null>(null);

    // Fetch Data
    const { data, isLoading } = useQuery({
        queryKey: ['design-items', projectId],
        queryFn: () => DesignService.getItems(projectId),
    });

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-orange-600" /></div>;
    }

    const { items } = data || { items: [] };
    // Filter only items that need design
    const designItems = items.filter((i: SPHItem) => i.needs_design);

    return (
        <div className="flex flex-col h-screen bg-neutral-100 overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-neutral-200 shrink-0">
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/tracking/${projectId}`}>
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-neutral-900">Studio Workspace</h1>
                        <p className="text-xs text-neutral-500">Kanban Board & Progress Updates</p>
                    </div>
                </div>
            </header>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto p-6">
                <div className="flex gap-6 h-full min-w-[1000px]">
                    {STATUS_COLUMNS.map(status => (
                        <div key={status} className="flex-1 flex flex-col min-w-[280px] bg-neutral-50 rounded-xl border border-neutral-200 h-full">
                            <div className="p-4 border-b border-neutral-100 bg-white/50 rounded-t-xl sticky top-0 backdrop-blur-sm">
                                <h3 className="text-sm font-bold text-neutral-700 flex items-center justify-between">
                                    {status.replace('_', ' ')}
                                    <Badge variant="secondary" className="ml-2 text-[10px]">{designItems.filter((i: SPHItem) => i.design_status === status).length}</Badge>
                                </h3>
                            </div>
                            <div className="p-3 space-y-3 overflow-y-auto flex-1">
                                {designItems
                                    .filter((i: SPHItem) => i.design_status === status)
                                    .map((item: SPHItem) => (
                                        <div key={item.id} onClick={() => setSelectedItem(item)} className="cursor-pointer">
                                            <KanbanCard item={item} />
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Update Modal */}
            {selectedItem && (
                <UpdateProgressModal
                    item={selectedItem}
                    open={!!selectedItem}
                    onOpenChange={(open) => !open && setSelectedItem(null)}
                    projectId={projectId}
                />
            )}
        </div>
    )
}

function KanbanCard({ item }: { item: SPHItem }) {
    const queryClient = useQueryClient();
    const [showPDF, setShowPDF] = useState(false);
    const pdfUrl = item.design_brief
        ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage/${item.design_brief}`
        : null;

    // Upload Design Mutation
    const uploadMutation = useMutation({
        mutationFn: async (file: File) => DesignService.uploadDesign(item.id, file),
        onSuccess: () => {
            toast.success("Design berhasil diupload");
            queryClient.invalidateQueries({ queryKey: ['design-items'] });
        },
        onError: () => toast.error("Gagal upload design")
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadMutation.mutate(file);
    };

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow border-neutral-200">
            <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                    <span className="text-sm font-bold text-neutral-900 line-clamp-2 leading-tight">
                        {item.name}
                    </span>
                    {item.design_brief && (
                        <div className="flex gap-1">
                            <button
                                onClick={() => setShowPDF(!showPDF)}
                                className="shrink-0 p-1 hover:bg-blue-50 rounded transition-colors"
                                title="Preview SPD"
                            >
                                <Eye className="h-3 w-3 text-blue-600" />
                            </button>
                            <a
                                href={pdfUrl!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 p-1 hover:bg-green-50 rounded transition-colors"
                                title="Download Surat Perintah Desain"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Download className="h-3 w-3 text-green-600" />
                            </a>
                        </div>
                    )}
                </div>

                {/* PDF Preview */}
                {showPDF && pdfUrl && (
                    <div className="border rounded overflow-hidden bg-neutral-50">
                        <iframe
                            src={pdfUrl}
                            className="w-full h-[300px]"
                            title="SPD Preview"
                        />
                    </div>
                )}

                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-neutral-500">
                        <span>Progress</span>
                        <span>{item.design_progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                        <div
                            className={cn("h-full transition-all", item.design_progress === 100 ? "bg-green-500" : "bg-orange-500")}
                            style={{ width: `${item.design_progress}%` }}
                        />
                    </div>
                </div>

                {/* Upload Design Result */}
                <div className="pt-2 border-t border-neutral-100">
                    {item.design_file ? (
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-green-600 flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                Design Uploaded
                            </span>
                            <a
                                href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage/${item.design_file}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                            >
                                View
                            </a>
                        </div>
                    ) : (
                        <>
                            <input
                                type="file"
                                id={`design-${item.id}`}
                                className="hidden"
                                accept=".pdf,.jpg,.png,.zip"
                                onChange={handleFileChange}
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-7 text-[10px]"
                                onClick={() => document.getElementById(`design-${item.id}`)?.click()}
                                disabled={uploadMutation.isPending}
                            >
                                {uploadMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                                Upload Design
                            </Button>
                        </>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-neutral-400">Click to update</span>
                </div>
            </CardContent>
        </Card>
    )
}

function UpdateProgressModal({ item, open, onOpenChange, projectId }: { item: SPHItem, open: boolean, onOpenChange: (o: boolean) => void, projectId: string }) {
    const queryClient = useQueryClient();
    const [progress, setProgress] = useState(item.design_progress);
    const [note, setNote] = useState("");
    const [status, setStatus] = useState<DesignStatus>(item.design_status);

    const updateMutation = useMutation({
        mutationFn: async () => {
            // 1. Update Status if changed
            if (status !== item.design_status) {
                await DesignService.updateStatus(item.id, status);
            }
            // 2. Update Progress
            await DesignService.updateProgress(item.id, progress, note || "Progress Update");
        },
        onSuccess: () => {
            toast.success("Design updated!");
            queryClient.invalidateQueries({ queryKey: ['design-items', projectId] });
            onOpenChange(false);
        },
        onError: () => toast.error("Failed to update")
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Update Progress: {item.name}</DialogTitle>
                    <DialogDescription>
                        Update the current design status and progress.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">

                    {/* Status Selector */}
                    <div className="space-y-2">
                        <Label>Current Phase</Label>
                        <div className="flex flex-wrap gap-2">
                            {STATUS_COLUMNS.map(s => (
                                <Badge
                                    key={s}
                                    variant={status === s ? "default" : "outline"}
                                    className="cursor-pointer"
                                    onClick={() => setStatus(s)}
                                >
                                    {s.replace('_', ' ')}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Progress Selector */}
                    <div className="space-y-2">
                        <Label>Progress Percentage</Label>
                        <div className="flex gap-2">
                            {[0, 25, 50, 75, 100].map(p => (
                                <Button
                                    key={p}
                                    variant={progress === p ? "default" : "outline"}
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => setProgress(p)}
                                >
                                    {p}%
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label>Notes / Activity Log</Label>
                        <Textarea
                            placeholder="Describe what was done..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>

                    {/* History (Brief) */}
                    {item.logs && item.logs.length > 0 && (
                        <div className="bg-neutral-50 p-3 rounded-lg text-xs space-y-2 max-h-[100px] overflow-y-auto">
                            <p className="font-bold text-neutral-500">Recent History</p>
                            {item.logs.slice(0, 5).map((log: any) => (
                                <div
                                    key={log.id}
                                    className={cn(
                                        "flex justify-between items-start p-2 rounded border",
                                        log.status === 'REVISION'
                                            ? "bg-red-50 border-red-100"
                                            : "bg-white border-transparent"
                                    )}
                                >
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            {log.status === 'REVISION' && (
                                                <Badge variant="destructive" className="text-[9px] h-4 px-1">CLIENT REVISION</Badge>
                                            )}
                                            <span className={cn("text-xs", log.status === 'REVISION' ? "text-red-700 font-medium" : "text-neutral-600")}>
                                                {log.note}
                                            </span>
                                        </div>
                                        {log.created_at && (
                                            <span className="text-[9px] text-neutral-400">
                                                {new Date(log.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-neutral-400 shrink-0 ml-2">{log.progress}%</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending || !note}>
                        {updateMutation.isPending ? "Saving..." : "Save Update"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
