"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { DocumentService } from "@/features/projects/services/document-service"
import { Loader2, Upload, File as FileIcon, Trash2, Download, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import Link from "next/link"
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

interface EngineeringWidgetProps {
    projectId: number;
}

const DOC_TYPE = "ENGINEERING";

export function EngineeringWidget({ projectId }: EngineeringWidgetProps) {
    const queryClient = useQueryClient();
    const [file, setFile] = useState<File | null>(null);

    // 1. Fetch Documents
    const { data: documents, isLoading } = useQuery({
        queryKey: ["project-documents", projectId, DOC_TYPE],
        queryFn: () => DocumentService.getDocuments(projectId, DOC_TYPE)
    });

    // 2. Upload Mutation
    const uploadMutation = useMutation({
        mutationFn: async () => {
            if (!file) throw new Error("Please select a file first");
            return await DocumentService.uploadDocument(projectId, file, DOC_TYPE);
        },
        onSuccess: () => {
            toast.success("Drawing uploaded successfully");
            setFile(null);
            queryClient.invalidateQueries({ queryKey: ["project-documents", projectId, DOC_TYPE] });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to upload drawing");
        }
    });

    // 3. Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (docId: number) => {
            return await DocumentService.deleteDocument(projectId, docId);
        },
        onSuccess: () => {
            toast.success("Drawing deleted");
            queryClient.invalidateQueries({ queryKey: ["project-documents", projectId, DOC_TYPE] });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete drawing");
        }
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const docsList = documents?.data || [];

    if (isLoading) {
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
                    <span className="text-xs text-neutral-500 font-medium">{docsList.length} Files</span>
                </div>
                <CardDescription>
                    Upload working drawings for production.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                {/* File List */}
                <div className="divide-y divide-neutral-100 max-h-[300px] overflow-y-auto">
                    {docsList.length > 0 ? (
                        docsList.map((doc: any) => (
                            <div key={doc.id} className="p-3 flex items-center justify-between hover:bg-neutral-50 group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="h-8 w-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                        <FileIcon className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-neutral-900 truncate">{doc.name}</p>
                                        <p className="text-[10px] text-neutral-400">{new Date(doc.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link href={doc.file_url} target="_blank">
                                        <Button size="icon" variant="ghost" className="h-7 w-7">
                                            <Download className="h-3 w-3 text-neutral-500" />
                                        </Button>
                                    </Link>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-red-50 hover:text-red-600">
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Drawing?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete <b>{doc.name}</b>.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => deleteMutation.mutate(doc.id)}
                                                    className="bg-red-600 hover:bg-red-700"
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-neutral-400 text-sm">
                            No drawings uploaded yet.
                        </div>
                    )}
                </div>

                {/* Upload Area */}
                <div className="p-4 bg-neutral-50 border-t border-neutral-100">
                    <div className="flex gap-2">
                        <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-neutral-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-xs file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100
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
                </div>
            </CardContent>
        </Card>
    )
}
