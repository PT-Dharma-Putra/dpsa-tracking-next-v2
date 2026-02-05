"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { PPICService } from "@/features/projects/services/ppic-service"
import { DocumentService } from "@/features/projects/services/document-service"
import { ProjectService } from "@/features/projects/services/project-service"
import { Loader2, Upload, FileText, Download, CheckCircle2, AlertCircle, File as FileIcon, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
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

interface DokubahWidgetProps {
    projectId: number;
}

const MATERIAL_DOC_TYPE = "MATERIAL";

export function DokubahWidget({ projectId }: DokubahWidgetProps) {
    const queryClient = useQueryClient();
    const [file, setFile] = useState<File | null>(null);
    const [itemFiles, setItemFiles] = useState<Record<number, File | null>>({});

    // 1. Fetch Dokubah Data (General Material List)
    const { data: dokubahData, isLoading } = useQuery({
        queryKey: ["dokubah", projectId],
        queryFn: () => PPICService.getDokubah(projectId)
    });

    // 2. Fetch SPH Items for per-item material lists
    const { data: sphItems, isLoading: itemsLoading } = useQuery({
        queryKey: ["sph-items", projectId],
        queryFn: () => ProjectService.getSPHItems(projectId)
    });

    // 3. Upload General Dokubah Mutation
    const uploadMutation = useMutation({
        mutationFn: async () => {
            if (!file) throw new Error("Please select a file first");
            return await PPICService.uploadDokubah(projectId, file);
        },
        onSuccess: () => {
            toast.success("Dokubah uploaded successfully");
            setFile(null);
            queryClient.invalidateQueries({ queryKey: ["dokubah", projectId] });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to upload Dokubah");
        }
    });

    // 4. Upload Item Material List Mutation
    const uploadItemMaterialMutation = useMutation({
        mutationFn: async ({ itemId, file }: { itemId: number, file: File }) => {
            return await DocumentService.uploadDocument(projectId, file, MATERIAL_DOC_TYPE, itemId);
        },
        onSuccess: (_, variables) => {
            toast.success("Material list uploaded");
            setItemFiles(prev => ({ ...prev, [variables.itemId]: null }));
            queryClient.invalidateQueries({ queryKey: ["item-materials", projectId, variables.itemId] });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to upload material list");
        }
    });

    // 5. Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (docId: number) => {
            return await DocumentService.deleteDocument(projectId, docId);
        },
        onSuccess: () => {
            toast.success("Material list deleted");
            queryClient.invalidateQueries({ queryKey: ["item-materials"] });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete");
        }
    });

    const status = dokubahData?.data?.dokubah_status || 'not_uploaded';
    const fileUrl = dokubahData?.data?.file_url;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    if (isLoading || itemsLoading) {
        return (
            <div className="flex items-center justify-center p-8 border rounded-lg bg-neutral-50">
                <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
            </div>
        )
    }

    return (
        <Card className="border-neutral-200 shadow-sm h-full">
            <CardHeader className="bg-neutral-50/50 border-b border-neutral-100 pb-4">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-bold uppercase tracking-wide text-neutral-500 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Dokubah (Material List)
                    </CardTitle>
                    <Badge variant={status === 'not_uploaded' ? 'outline' : 'default'} className={
                        status === 'uploaded' ? 'bg-green-600 hover:bg-green-700' :
                            status === 'revised' ? 'bg-blue-600 hover:bg-blue-700' : ''
                    }>
                        {status === 'not_uploaded' ? 'Pending' : status === 'revised' ? 'Revised' : 'Uploaded'}
                    </Badge>
                </div>
                <CardDescription>
                    General material list and per-item material breakdown.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">

                {/* General Dokubah Section */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-neutral-700">General Material List</h3>

                    {fileUrl ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between bg-green-50 border border-green-100 rounded-lg p-3">
                                <p className="text-sm text-green-900 font-medium">Dokubah available</p>
                                <Link href={fileUrl} target="_blank">
                                    <Button size="sm" variant="outline" className="border-green-200 text-green-700 hover:bg-green-100">
                                        <Download className="mr-2 h-3 w-3" /> Download
                                    </Button>
                                </Link>
                            </div>
                            {/* PDF Viewer */}
                            <div className="border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50">
                                <iframe
                                    src={fileUrl}
                                    className="w-full h-[400px]"
                                    title="Dokubah PDF Viewer"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="bg-neutral-50 border border-neutral-100 rounded-lg p-4 flex items-center gap-3">
                            <div className="bg-white p-2 rounded-full border border-neutral-200 shadow-sm">
                                <AlertCircle className="h-5 w-5 text-neutral-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-neutral-900">No Dokubah yet</p>
                                <p className="text-xs text-neutral-500">Please upload using the form below.</p>
                            </div>
                        </div>
                    )}

                    {/* Upload Form */}
                    <div className="space-y-3 pt-2 border-t border-neutral-100">
                        <label className="text-xs font-semibold text-neutral-500 uppercase">Update / Upload New</label>
                        <div className="flex gap-2">
                            <input
                                type="file"
                                accept=".pdf,.xlsx,.xls,.doc,.docx"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-neutral-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-md file:border-0
                                    file:text-xs file:font-semibold
                                    file:bg-orange-50 file:text-orange-700
                                    hover:file:bg-orange-100
                                    border border-neutral-200 rounded-md cursor-pointer
                                "
                            />
                            <Button
                                size="sm"
                                onClick={() => uploadMutation.mutate()}
                                disabled={!file || uploadMutation.isPending}
                            >
                                {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            </Button>
                        </div>
                        <p className="text-[10px] text-neutral-400">Supported: PDF, Excel, Word (Max 15MB)</p>
                    </div>
                </div>

                {/* Per-Item Material Lists */}
                <div className="space-y-3 pt-4 border-t border-neutral-100">
                    <h3 className="text-sm font-semibold text-neutral-700">Per-Item Material Lists</h3>

                    <Accordion type="multiple" className="w-full">
                        {sphItems && sphItems.length > 0 ? (
                            sphItems.map((item: any) => (
                                <ItemMaterialAccordion
                                    key={item.id}
                                    item={item}
                                    projectId={projectId}
                                    onUpload={(file: File) => uploadItemMaterialMutation.mutate({ itemId: item.id, file })}
                                    onDelete={(docId: number) => deleteMutation.mutate(docId)}
                                    isUploading={uploadItemMaterialMutation.isPending}
                                    currentFile={itemFiles[item.id]}
                                    onFileChange={(file: File | null) => setItemFiles(prev => ({ ...prev, [item.id]: file }))}
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

// Sub-component for each item's material lists
function ItemMaterialAccordion({ item, projectId, onUpload, onDelete, isUploading, currentFile, onFileChange }: any) {
    const { data: materials } = useQuery({
        queryKey: ["item-materials", projectId, item.id],
        queryFn: () => DocumentService.getDocuments(projectId, "MATERIAL", item.id)
    });

    const materialsList = materials?.data || [];

    return (
        <AccordionItem value={`item-${item.id}`} className="border border-neutral-200 rounded-lg mb-2 px-4">
            <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                    <span className="text-sm font-medium text-neutral-900">{item.name}</span>
                    <Badge variant="outline" className="text-xs">
                        {materialsList.length} files
                    </Badge>
                </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
                {/* File List */}
                <div className="space-y-2">
                    {materialsList.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between p-2 bg-neutral-50 rounded border border-neutral-100 group hover:bg-neutral-100">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <FileIcon className="h-4 w-4 text-orange-600 shrink-0" />
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
                                            <AlertDialogTitle>Delete Material List?</AlertDialogTitle>
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
                        accept=".pdf,.xlsx,.xls"
                        onChange={(e) => e.target.files && onFileChange(e.target.files[0])}
                        className="block w-full text-xs text-neutral-500
                            file:mr-3 file:py-1.5 file:px-3
                            file:rounded-md file:border-0
                            file:text-xs file:font-semibold
                            file:bg-orange-50 file:text-orange-700
                            hover:file:bg-orange-100
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
