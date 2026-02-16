"use client"

import { use, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { DocumentService } from "@/features/projects/services/document-service"
import { ProjectService } from "@/features/projects/services/project-service"
import { DocumentViewer } from "@/features/projects/components/document-viewer"
import { DocumentAuditLog } from "@/features/projects/components/phases/commercial/document-audit-log"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft, Upload, FileText, Check, Download, Loader2, UploadCloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SPKDocumentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const queryClient = useQueryClient()

    // Form State
    const [spkNumber, setSpkNumber] = useState("")
    const [deadline, setDeadline] = useState("")
    const [file, setFile] = useState<File | null>(null)

    // Fetch SPK Data
    const { data: spkData, isLoading } = useQuery({
        queryKey: ['spk', id],
        queryFn: () => DocumentService.getSPK(id)
    })

    // Upload Mutations
    const saveNumberMutation = useMutation({
        mutationFn: (data: { id: string, number: string, deadline?: string }) =>
            ProjectService.saveSPKNumber(data.id, data.number, data.deadline)
    })

    const uploadFileMutation = useMutation({
        mutationFn: (data: { id: string, file: File }) =>
            ProjectService.uploadSPK(data.id, data.file)
    })

    const handleUpload = async () => {
        if (!spkNumber.trim()) {
            toast.error("Please enter SPK Number")
            return
        }
        if (!file) {
            toast.error("Please select a file")
            return
        }

        try {
            await saveNumberMutation.mutateAsync({ id, number: spkNumber, deadline: deadline || undefined })
            await uploadFileMutation.mutateAsync({ id, file })

            toast.success("SPK uploaded successfully!")
            queryClient.invalidateQueries({ queryKey: ['spk', id] })
            queryClient.invalidateQueries({ queryKey: ['project', id] })

            // Reset form
            setSpkNumber("")
            setDeadline("")
            setFile(null)
        } catch (error) {
            console.error(error)
            toast.error("Failed to upload SPK")
        }
    }

    const isUploading = saveNumberMutation.isPending || uploadFileMutation.isPending
    const hasDocument = spkData?.spk_file_url || spkData?.file_path

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
                                <FileText className="h-5 w-5 text-blue-600" />
                                SPK (Contract)
                                {spkData?.status === 'signed' && (
                                    <Badge className="bg-green-600">Signed</Badge>
                                )}
                                {spkData?.status === 'pending' && (
                                    <Badge variant="outline" className="text-amber-600 border-amber-300">Pending</Badge>
                                )}
                                {!spkData && (
                                    <Badge variant="outline" className="text-neutral-500">No Document</Badge>
                                )}
                            </h1>
                            <p className="text-xs text-neutral-500">Project #{id}</p>
                        </div>
                    </div>

                    {hasDocument && (
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <a href={spkData?.spk_file_url || ''} target="_blank" rel="noopener noreferrer">
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
                {spkData?.spk_number && (
                    <Card>
                        <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-100 p-3 rounded-lg">
                                        <FileText className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-neutral-900">{spkData.spk_number}</p>
                                        {spkData.created_at && (
                                            <p className="text-sm text-neutral-500">
                                                Uploaded {new Date(spkData.created_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric', month: 'long', year: 'numeric'
                                                })}
                                            </p>
                                        )}
                                        {spkData.deadline && (
                                            <p className="text-sm text-red-600 font-medium mt-1">
                                                Deadline: {new Date(spkData.deadline).toLocaleDateString('id-ID', {
                                                    day: 'numeric', month: 'long', year: 'numeric'
                                                })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {spkData.status === 'signed' && (
                                    <div className="flex items-center gap-2 text-green-600">
                                        <Check className="h-5 w-5" />
                                        <span className="font-medium">Contract Signed</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* PDF Viewer or Upload Form */}
                {hasDocument ? (
                    <DocumentViewer
                        url={spkData?.spk_file_url}
                        title="SPK Document"
                        emptyMessage="SPK document not available"
                    />
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload SPK Document</CardTitle>
                            <CardDescription>
                                Upload the signed contract (SPK) for this project to proceed.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>SPK Number</Label>
                                    <Input
                                        placeholder="e.g. 001/SPK/DPSA/I/2026"
                                        value={spkNumber}
                                        onChange={(e) => setSpkNumber(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Deadline (Optional)</Label>
                                    <Input
                                        type="date"
                                        value={deadline}
                                        onChange={(e) => setDeadline(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Signed Contract (PDF)</Label>
                                <div className="border-2 border-dashed border-neutral-200 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-50 transition-colors relative">
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />
                                    {file ? (
                                        <div className="text-center">
                                            <FileText className="h-10 w-10 text-blue-600 mx-auto mb-2" />
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
                                        Upload Signed Contract
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Audit Log / History */}
                <DocumentAuditLog projectId={id} />
            </div>
        </div>
    )
}
