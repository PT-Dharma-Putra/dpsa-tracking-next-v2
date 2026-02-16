"use client"

import { use, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { DocumentService } from "@/features/projects/services/document-service"
import { ProjectService } from "@/features/projects/services/project-service"
import { DocumentViewer } from "@/features/projects/components/document-viewer"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft, Upload, FileText, Check, Download, Loader2, UploadCloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SPHDocumentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const queryClient = useQueryClient()

    // Form State
    const [sphNumber, setSphNumber] = useState("")
    const [file, setFile] = useState<File | null>(null)

    // Fetch SPH Data
    const { data: sphData, isLoading } = useQuery({
        queryKey: ['sph', id],
        queryFn: () => DocumentService.getSPH(id)
    })

    // Upload Mutations
    const saveNumberMutation = useMutation({
        mutationFn: (data: { id: string, number: string }) =>
            ProjectService.saveSPHNumber(data.id, data.number)
    })

    const uploadFileMutation = useMutation({
        mutationFn: (data: { id: string, file: File }) =>
            ProjectService.uploadSPH(data.id, data.file)
    })

    const approveMutation = useMutation({
        mutationFn: (projectId: string) => DocumentService.approveSPH(projectId),
        onSuccess: () => {
            toast.success("SPH Status updated to Approved")
            queryClient.invalidateQueries({ queryKey: ['sph', id] })
            queryClient.invalidateQueries({ queryKey: ['project', id] })
        },
        onError: () => toast.error("Failed to approve SPH")
    })

    const handleUpload = async () => {
        if (!sphNumber.trim()) {
            toast.error("Please enter SPH Number")
            return
        }
        if (!file) {
            toast.error("Please select a file")
            return
        }

        try {
            await saveNumberMutation.mutateAsync({ id, number: sphNumber })
            await uploadFileMutation.mutateAsync({ id, file })
            // await approveMutation.mutateAsync(id) // Removed Auto-Approve

            toast.success("SPH uploaded successfully. Waiting for approval.")
            queryClient.invalidateQueries({ queryKey: ['sph', id] })
            queryClient.invalidateQueries({ queryKey: ['project', id] })

            // Reset form
            setSphNumber("")
            setFile(null)
        } catch (error) {
            console.error(error)
            toast.error("Failed to upload SPH")
        }
    }

    // Safe SPH Extraction
    const sph = Array.isArray(sphData)
        ? sphData[0]
        : (Array.isArray(sphData?.data) ? sphData.data[0] : sphData);

    const isUploading = saveNumberMutation.isPending || uploadFileMutation.isPending || approveMutation.isPending
    const hasDocument = sph?.file_url || sph?.file_path

    if (isLoading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-neutral-50">
            {/* Header */}
            <div className="border-b border-neutral-200 bg-white sticky top-0 z-30">
                <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/dashboard/tracking/${id}`}
                            className="p-2 hover:bg-neutral-100 rounded-full text-neutral-500 transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-lg font-bold text-neutral-900 flex items-center gap-3">
                                <FileText className="h-5 w-5 text-orange-600" />
                                SPH (Quotation)
                                {sph?.status === 'approved' && (
                                    <Badge className="bg-green-600">Approved</Badge>
                                )}
                                {sph?.status === 'pending' && (
                                    <Badge variant="outline" className="text-amber-600 border-amber-300">Pending</Badge>
                                )}
                                {!sph && (
                                    <Badge variant="outline" className="text-neutral-500">No Document</Badge>
                                )}
                            </h1>
                            <p className="text-xs text-neutral-500">Project #{id}</p>
                        </div>
                    </div>

                    {hasDocument && (
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <a href={sph?.file_url || ''} target="_blank" rel="noopener noreferrer">
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                </a>
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-screen-xl mx-auto p-6 space-y-6">
                {/* Document Info */}
                {sph?.sph_number && (
                    <Card>
                        <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="bg-orange-100 p-3 rounded-lg">
                                        <FileText className="h-6 w-6 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-neutral-900">{sph.sph_number}</p>
                                        <p className="text-sm text-neutral-500">
                                            Uploaded {new Date(sph.created_at).toLocaleDateString('id-ID', {
                                                day: 'numeric', month: 'long', year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                                {sph.status === 'approved' ? (
                                    <div className="flex items-center gap-2 text-green-600">
                                        <Check className="h-5 w-5" />
                                        <span className="font-medium">Approved</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-neutral-500 italic">Waiting Approval</span>
                                        <Button
                                            size="sm"
                                            onClick={() => approveMutation.mutate(id)}
                                            disabled={approveMutation.isPending}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            {approveMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Check className="h-3 w-3 mr-2" />}
                                            Mark Approved
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* PDF Viewer or Upload Form */}
                {hasDocument ? (
                    <DocumentViewer
                        url={sph?.file_url || sph?.file_path}
                        title="SPH Document"
                        emptyMessage="SPH document not available"
                    />
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload SPH Document</CardTitle>
                            <CardDescription>
                                Upload the quotation document (SPH) for this project.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>SPH Number</Label>
                                <Input
                                    placeholder="e.g. 001/SPH/DPSA/I/2026"
                                    value={sphNumber}
                                    onChange={(e) => setSphNumber(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>SPH Document (PDF)</Label>
                                <div className="border-2 border-dashed border-neutral-200 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-50 transition-colors relative">
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />
                                    {file ? (
                                        <div className="text-center">
                                            <FileText className="h-10 w-10 text-orange-600 mx-auto mb-2" />
                                            <p className="font-medium text-neutral-900">{file.name}</p>
                                            <p className="text-sm text-neutral-500">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="text-center text-neutral-500">
                                            <UploadCloud className="h-10 w-10 mx-auto mb-3 opacity-50" />
                                            <p className="font-medium">Click to browse or drag file here</p>
                                            <p className="text-sm mt-1">PDF only, max 10MB</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="w-full"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Upload & Approve SPH
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
