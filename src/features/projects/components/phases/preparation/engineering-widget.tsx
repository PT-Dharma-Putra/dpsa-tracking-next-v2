"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ProjectService } from "@/features/projects/services/project-service"
import { Loader2, Upload, File as FileIcon, Trash2, Download, Image as ImageIcon, FileCheck, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import Link from "next/link"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"

interface EngineeringWidgetProps {
    projectId: number;
}

export function EngineeringWidget({ projectId }: EngineeringWidgetProps) {
    const queryClient = useQueryClient();
    const [itemFiles, setItemFiles] = useState<Record<number, File | null>>({});

    // 1. Fetch SPH Items
    const { data: sphItems, isLoading: itemsLoading } = useQuery({
        queryKey: ["sph-items", projectId],
        queryFn: () => ProjectService.getSPHItems(projectId)
    });

    // 2. Upload Item Drawing Mutation
    const uploadItemDrawingMutation = useMutation({
        mutationFn: async ({ itemId, file }: { itemId: number, file: File }) => {
            throw new Error("Legacy upload deprecated. Silakan upload gambar kerja via menu Projects V2.");
        },
        onSuccess: (_, variables) => {
            toast.success("Drawing uploaded");
            setItemFiles(prev => ({ ...prev, [variables.itemId]: null }));
            queryClient.invalidateQueries({ queryKey: ["item-drawings", projectId, variables.itemId] });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to upload drawing");
        }
    });

    // 3. Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (docId: number) => {
            throw new Error("Legacy delete deprecated.");
        },
        onSuccess: () => {
            toast.success("Drawing deleted");
            queryClient.invalidateQueries({ queryKey: ["item-drawings"] });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete");
        }
    });

    if (itemsLoading) {
        return (
            <div className="flex items-center justify-center p-8 border rounded-lg bg-white">
                <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
            </div>
        )
    }

    return (
        <Card className="border-neutral-200 shadow-sm">
            <CardHeader className="bg-neutral-50/50 border-b border-neutral-100 pb-4">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-bold uppercase tracking-wide text-neutral-500 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Engineering (Gambar Kerja)
                    </CardTitle>
                </div>
                <CardDescription>
                    Kelola berkas serah terima engineering dan gambar kerja per item.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">

                {/* Handover Document Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                            <FileCheck className="h-4 w-4" />
                            Surat Serah Terima Gambar Kerja
                        </h3>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-blue-50/70 border border-blue-100 rounded-lg p-4">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-blue-900">Modul Resmi Surat Serah Terima Gambar Kerja</p>
                            <p className="text-xs text-blue-700">Pembuatan nomor surat resmi, persetujuan, dan pencetakan dokumen serah terima gambar kerja dikelola di Projects V2.</p>
                        </div>
                        <Link href="/dashboard/projects-v2/serah-terima-gambar">
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shrink-0">
                                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                                Buka Serah Terima Gambar
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Per-Item Drawings */}
                <div className="space-y-3 pt-4 border-t border-neutral-100">
                    <h3 className="text-sm font-semibold text-neutral-700">Per-Item Drawings</h3>

                    <Accordion type="multiple" className="w-full">
                        {sphItems && sphItems.length > 0 ? (
                            sphItems.map((item: any) => (
                                <ItemDrawingAccordion
                                    key={item.id}
                                    item={item}
                                    projectId={projectId}
                                    onUpload={(file: File) => uploadItemDrawingMutation.mutate({ itemId: item.id, file })}
                                    onDelete={(docId: number) => deleteMutation.mutate(docId)}
                                    isUploading={uploadItemDrawingMutation.isPending}
                                    currentFile={itemFiles[item.id]}
                                    onFileChange={(file: File) => setItemFiles(prev => ({ ...prev, [item.id]: file }))}
                                />
                            ))
                        ) : (
                            <p className="text-sm text-neutral-400 text-center py-4">No items found</p>
                        )}
                    </Accordion>
                </div>
            </CardContent>
        </Card>
    )
}

// Sub-component for each item's drawings
function ItemDrawingAccordion({ item, projectId, onUpload, onDelete, isUploading, currentFile, onFileChange }: any) {
    const { data: drawings } = useQuery({
        queryKey: ["item-drawings", projectId, item.id],
        queryFn: () => ({ data: [] })
    });

    const drawingsList = drawings?.data || [];

    return (
        <AccordionItem value={`item-${item.id}`} className="border border-neutral-200 rounded-lg mb-2 px-4">
            <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                    <span className="text-sm font-medium text-neutral-900">{item.name}</span>
                    <Badge variant="outline" className="text-xs">
                        {drawingsList.length} files
                    </Badge>
                </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
                {/* File List */}
                <div className="space-y-2">
                    {drawingsList.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between p-2 bg-neutral-50 rounded border border-neutral-100 group hover:bg-neutral-100">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <FileIcon className="h-4 w-4 text-blue-600 shrink-0" />
                                <p className="text-xs font-medium text-neutral-900 truncate">{doc.name}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Link href={doc.file_url} target="_blank">
                                    <Button size="icon" variant="ghost" className="h-6 w-6">
                                        <Download className="h-3 w-3" />
                                    </Button>
                                </Link>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-red-50 hover:text-red-600">
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Drawing?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete <b>{doc.name}</b>.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => onDelete(doc.id)}
                                                className="bg-red-600 hover:bg-red-700"
                                            >
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Upload Form */}
                <div className="flex gap-2 pt-2 border-t border-neutral-100">
                    <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => e.target.files && onFileChange(e.target.files[0])}
                        className="block w-full text-xs text-neutral-500
                            file:mr-3 file:py-1.5 file:px-3
                            file:rounded-md file:border-0
                            file:text-xs file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100
                            border border-neutral-200 rounded-md cursor-pointer"
                    />
                    <Button
                        size="sm"
                        onClick={() => currentFile && onUpload(currentFile)}
                        disabled={!currentFile || isUploading}
                        className="shrink-0"
                    >
                        {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                    </Button>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
