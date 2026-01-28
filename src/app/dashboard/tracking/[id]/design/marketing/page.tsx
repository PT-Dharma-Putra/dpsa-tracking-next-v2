"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { DesignService, SPHItem } from "@/features/projects/services/design-service"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Upload, FileText, Check, Loader2, Info } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function DesignMarketingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = use(params);
    const queryClient = useQueryClient();

    // Fetch Data
    const { data, isLoading } = useQuery({
        queryKey: ['design-items', projectId],
        queryFn: () => DesignService.getItems(projectId),
    });

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-orange-600" /></div>;
    }

    const { items } = data || { items: [] };

    return (
        <div className="flex flex-col h-screen bg-neutral-50">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-neutral-200">
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/tracking/${projectId}`}>
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-neutral-900">Design Requirements</h1>
                        <p className="text-xs text-neutral-500">Marketing View: Select items needing design</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500">
                        {items.filter((i: SPHItem) => i.needs_design).length} Items Selected
                    </span>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full space-y-6">

                {items.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                        <p className="text-neutral-500">No items found in SPH yet.</p>
                        <p className="text-xs text-neutral-400 mt-1">Please create SPH items first.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {items.map((item: SPHItem) => (
                            <DesignItemCard key={item.id} item={item} projectId={projectId} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function DesignItemCard({ item, projectId }: { item: SPHItem, projectId: string }) {
    const queryClient = useQueryClient();
    const [isUploading, setIsUploading] = useState(false);

    // Toggle Mutation
    const toggleMutation = useMutation({
        mutationFn: async (checked: boolean) => DesignService.toggleNeedsDesign(item.id, checked),
        onSuccess: () => {
            toast.success("Updated design requirement");
            queryClient.invalidateQueries({ queryKey: ['design-items', projectId] });
        }
    });

    // Upload Mutation
    const uploadMutation = useMutation({
        mutationFn: async (file: File) => DesignService.uploadBrief(item.id, file),
        onSuccess: () => {
            toast.success("Brief uploaded successfully");
            setIsUploading(false);
            queryClient.invalidateQueries({ queryKey: ['design-items', projectId] });
        },
        onError: () => toast.error("Failed to upload brief")
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadMutation.mutate(file);
    };

    return (
        <Card className={cn("transition-all", item.needs_design ? "border-orange-200 bg-white" : "border-neutral-200 bg-neutral-50/50")}>
            <CardContent className="p-4 flex items-center gap-4">

                {/* 1. Checkbox */}
                <div className="flex items-center gap-2">
                    <Checkbox
                        id={`item-${item.id}`}
                        checked={item.needs_design}
                        onCheckedChange={(c) => toggleMutation.mutate(c as boolean)}
                        className="data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                    />
                </div>

                {/* 2. Item Info */}
                <div className="flex-1">
                    <label htmlFor={`item-${item.id}`} className="text-sm font-bold text-neutral-900 cursor-pointer hover:underline">
                        {item.name}
                    </label>
                    <div className="flex items-center gap-4 mt-1 text-xs text-neutral-500">
                        <span>Qty: {item.qty}</span>
                        <Separator orientation="vertical" className="h-3" />
                        <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.total_price)}</span>
                    </div>
                </div>

                {/* 3. Status Badge (if active) */}
                {item.needs_design && (
                    <Badge variant="outline" className="text-[10px] bg-neutral-50">
                        {item.design_status.replace('_', ' ')}
                    </Badge>
                )}

                {/* 4. Actions (Brief Upload) */}
                {item.needs_design && (
                    <div className="flex items-center gap-3">
                        {item.design_brief ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-md text-xs border border-green-200">
                                <FileText className="h-3 w-3" />
                                <span className="max-w-[100px] truncate" title={item.design_brief}>Brief Uploaded</span>
                                <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 hover:bg-green-100 rounded-full" onClick={() => document.getElementById(`file-${item.id}`)?.click()}>
                                    <Upload className="h-3 w-3" />
                                </Button>
                            </div>
                        ) : (
                            <div>
                                <input
                                    type="file"
                                    id={`file-${item.id}`}
                                    className="hidden"
                                    accept=".pdf,.jpg,.png,.zip"
                                    onChange={handleFileChange}
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs border-dashed border-orange-300 text-orange-600 hover:bg-orange-50"
                                    onClick={() => document.getElementById(`file-${item.id}`)?.click()}
                                    disabled={uploadMutation.isPending}
                                >
                                    {uploadMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                                    Upload Brief
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
