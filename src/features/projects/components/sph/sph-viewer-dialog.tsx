import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, Download, ExternalLink, Loader2 } from "lucide-react"

interface SPHViewerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    url: string | null | undefined
    sphNumber: string
    onApprove: (file: File | null) => void // Updated signature
    onReject?: (reason: string) => void // Added onReject prop
    isApproving: boolean
    status: 'pending' | 'approved' | 'rejected' | 'draft' | 'sent' | 'revisied' | undefined
}

export function SPHViewerDialog({
    open,
    onOpenChange,
    url,
    sphNumber,
    onApprove,
    onReject,
    isApproving,
    status
}: SPHViewerDialogProps) {

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
            <DialogContent className="min-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] flex flex-col p-0 gap-0">
                <DialogHeader className="p-4 border-b bg-neutral-50/50 shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle>Quotation Review ({sphNumber})</DialogTitle>
                            <DialogDescription>
                                {isRejectMode ? "Please provide a reason for revision request." : "Review document and upload signed copy to approve."}
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
                            title="SPH Viewer"
                        />
                    </div>

                    {/* Sidebar / Overlay for Actions */}
                    {status && status !== 'approved' && (
                        <div className="w-full md:w-[320px] bg-white border-l p-6 flex flex-col gap-6 shrink-0 overflow-y-auto">
                            {!isRejectMode ? (
                                <>
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg text-neutral-900">Approve Quotation</h3>
                                    </div>

                                    <Button
                                        onClick={() => onApprove(null)}
                                        disabled={isApproving}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white mt-2"
                                    >
                                        {isApproving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                        Approve
                                    </Button>

                                    <Button variant="outline" onClick={() => setIsRejectMode(true)} className="w-full text-red-600 border-red-200 hover:bg-red-50">
                                        Request Revision
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg text-red-700">Request Revision</h3>
                                        <p className="text-sm text-neutral-500">Tell us what needs to be changed via the toast below.</p>

                                        <Textarea
                                            placeholder="Example: Price is too high, item X quantity is wrong..."
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
