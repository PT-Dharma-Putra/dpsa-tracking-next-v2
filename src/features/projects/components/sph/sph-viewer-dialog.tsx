"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle, Download, ExternalLink, Loader2 } from "lucide-react"

interface SPHViewerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    url: string | null | undefined
    sphNumber: string
    onApprove: () => void
    isApproving: boolean
    status: 'pending' | 'approved' | 'rejected' | 'draft' | undefined
}

export function SPHViewerDialog({
    open,
    onOpenChange,
    url,
    sphNumber,
    onApprove,
    isApproving,
    status
}: SPHViewerDialogProps) {

    if (!url) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-4 border-b bg-neutral-50/50 shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle>Quotation Review ({sphNumber})</DialogTitle>
                            <DialogDescription>Please review the document below before approving.</DialogDescription>
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

                <div className="flex-1 bg-neutral-100 relative overflow-hidden">
                    <iframe
                        src={`${url}#toolbar=0`}
                        className="w-full h-full border-none"
                        title="SPH Viewer"
                    />
                </div>

                <DialogFooter className="p-4 border-t bg-white shrink-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>

                    {status === 'pending' && (
                        <Button onClick={onApprove} disabled={isApproving} className="bg-green-600 hover:bg-green-700 text-white min-w-[150px]">
                            {isApproving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Approving...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve Quotation
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
