"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, Download, ExternalLink, Loader2 } from "lucide-react"

interface SPKViewerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    url: string | null | undefined
    spkNumber: string
    onApprove: (file: File | null) => void // Updated signature
    isApproving: boolean
    status: 'pending' | 'approved' | 'rejected' | 'draft' | 'sent' | undefined
}

export function SPKViewerDialog({
    open,
    onOpenChange,
    url,
    spkNumber,
    onApprove,
    onReject,
    isApproving,
    status
}: SPKViewerDialogProps & { onReject?: (reason: string) => void }) { // Added onReject prop

    const [isRejectMode, setIsRejectMode] = useState(false);
    const [reason, setReason] = useState("");
    const [file, setFile] = useState<File | null>(null);

    // Reset state when closing
    useEffect(() => {
        if (!open) {
            setIsRejectMode(false);
            setReason("");
            setFile(null);
        }
    }, [open]);

    // Handle File Change
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    if (!url) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-4 border-b bg-neutral-50/50 shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle>Work Order Review ({spkNumber})</DialogTitle>
                            <DialogDescription>
                                {isRejectMode ? "Please provide a reason for revision request." : "Review contract and upload signed copy to approve."}
                            </DialogDescription>
                        </div>
                        <div className="flex gap-2">
                            <a href={url} target="_blank" rel="noreferrer">
                                <Button variant="outline" size="sm">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Open in New Tab
                                </Button>
                            </a>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 bg-neutral-100 relative overflow-hidden flex flex-col md:flex-row">
                    {/* PDF Viewer */}
                    <div className={`flex-1 transition-all ${isRejectMode ? 'opacity-50' : 'opacity-100'}`}>
                        <iframe
                            src={`${url}#toolbar=0`}
                            className="w-full h-full border-none"
                            title="SPK Viewer"
                        />
                    </div>

                    {/* Sidebar / Overlay for Actions */}
                    {(status === 'pending' || status === 'sent') && (
                        <div className="w-full md:w-[320px] bg-white border-l p-6 flex flex-col gap-6 shrink-0 overflow-y-auto">
                            {!isRejectMode ? (
                                <>
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg text-neutral-900">Sign & Approve</h3>
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                                            Please download the document, sign it, and upload the signed copy here to finalize.
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="signed-spk">Upload Signed SPK</Label>
                                            <Input
                                                id="signed-spk"
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={handleFileChange}
                                            />
                                            {file && <p className="text-xs text-green-600">Selected: {file.name}</p>}
                                        </div>

                                        <Button
                                            onClick={() => onApprove(file)}
                                            disabled={isApproving || !file}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            {isApproving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                            Upload & Approve
                                        </Button>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-white px-2 text-neutral-500">Or</span>
                                        </div>
                                    </div>

                                    <Button variant="outline" onClick={() => setIsRejectMode(true)} className="w-full text-red-600 border-red-200 hover:bg-red-50">
                                        Request Revision
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg text-red-700">Request Revision</h3>
                                        <p className="text-sm text-neutral-500">Tell us what needs to be changed.</p>

                                        <Textarea
                                            placeholder="Example: The deadline date is incorrect..."
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            className="min-h-[150px]"
                                        />

                                        <div className="flex gap-3">
                                            <Button variant="outline" onClick={() => setIsRejectMode(false)} className="flex-1">
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={() => onReject && onReject(reason)}
                                                disabled={!reason.trim()}
                                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                            >
                                                Submit Request
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="p-4 border-t bg-white shrink-0 md:hidden">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
