"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ProjectService } from "../../services/project-service"
import { DocumentService } from "../../services/document-service"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, UploadCloud } from "lucide-react"

interface SPHUploadModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    projectId: number
    onSuccess?: () => void
}

export function SPHUploadModal({ open, onOpenChange, projectId, onSuccess }: SPHUploadModalProps) {
    const queryClient = useQueryClient()
    const [sphNumber, setSphNumber] = useState("")
    const [file, setFile] = useState<File | null>(null)

    // Mutation 1: Save Number
    const saveNumberMutation = useMutation({
        mutationFn: (variable: { id: number, number: string }) =>
            ProjectService.saveSPHNumber(variable.id, variable.number)
    })

    // Mutation 2: Upload File
    const uploadFileMutation = useMutation({
        mutationFn: (variable: { id: number, file: File }) =>
            ProjectService.uploadSPH(variable.id, variable.file)
    })

    // Mutation 3: Auto-approve after upload
    const approveMutation = useMutation({
        mutationFn: (projectId: number) => DocumentService.approveSPH(projectId)
    })

    const handleUpload = async () => {
        if (!sphNumber || !file) {
            toast.error("Please fill SPH Number and select a file")
            return
        }

        try {
            // 1. Save Number first
            await saveNumberMutation.mutateAsync({ id: projectId, number: sphNumber })

            // 2. Upload File
            await uploadFileMutation.mutateAsync({ id: projectId, file: file })

            // 3. Auto-approve SPH after upload
            await approveMutation.mutateAsync(projectId)

            toast.success("SPH Uploaded & Approved Successfully!")
            queryClient.invalidateQueries({ queryKey: ['project', projectId] })
            queryClient.invalidateQueries({ queryKey: ['sph', projectId] })
            onOpenChange(false)
            onSuccess?.()
        } catch (error) {
            console.error(error)
            toast.error("Failed to upload SPH")
        }
    }

    const isLoading = saveNumberMutation.isPending || uploadFileMutation.isPending || approveMutation.isPending

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload Quotation (SPH)</DialogTitle>
                    <DialogDescription>
                        Upload the SPH document. This will allow you to proceed with contract signing (SPK).
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
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
                        <div className="border-2 border-dashed border-neutral-200 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-50 transition-colors relative">
                            <input
                                type="file"
                                accept="application/pdf"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                            {file ? (
                                <div className="text-center">
                                    <p className="font-medium text-sm text-neutral-900">{file.name}</p>
                                    <p className="text-xs text-neutral-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            ) : (
                                <div className="text-center text-neutral-500">
                                    <UploadCloud className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Click to browse or drag file here</p>
                                    <p className="text-xs mt-1">PDF only, max 10MB</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleUpload} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            "Upload & Confirm"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
