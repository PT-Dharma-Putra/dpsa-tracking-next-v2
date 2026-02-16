"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { axiosInstance } from "@/lib/axios"
import { AlertCircle, Loader2 } from "lucide-react"

interface QCGateModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: any
    onSuccess: () => void
}

export function QCGateModal({ open, onOpenChange, item, onSuccess }: QCGateModalProps) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [targetStage, setTargetStage] = useState("")
    const [notes, setNotes] = useState("")

    if (!item) return null

    // Calculate possible return stages based on workflow_path
    // Default to standard flow if no path
    // Filter out current stage and future stages
    const workflow = item.workflow_path || ['cutting', 'assembly', 'finishing', 'qc']
    const historyStages = workflow.slice(0, item.current_step_index) // Only allow backward

    const handleReject = async () => {
        if (!targetStage || !notes) {
            toast({ title: "Validation Error", description: "Select a target stage and provide a reason.", variant: "destructive" })
            return
        }

        setLoading(true)
        try {
            await axiosInstance.post('/production/reject', {
                project_item_id: item.id,
                target_stage: targetStage,
                notes: notes
            })

            toast({ title: "Item Rejected", description: `Returned to ${targetStage}.` })
            onSuccess()
            onOpenChange(false)
            setTargetStage("")
            setNotes("")
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to reject item",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md border-red-200">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="w-5 h-5" />
                        <DialogTitle>Reject Item</DialogTitle>
                    </div>
                    <DialogDescription>
                        Send <strong>{item.item}</strong> back to a previous stage for revision.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Return to Stage</Label>
                        <Select value={targetStage} onValueChange={setTargetStage}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select target stage" />
                            </SelectTrigger>
                            <SelectContent>
                                {historyStages.map((stage: string) => (
                                    <SelectItem key={stage} value={stage} className="capitalize">
                                        {stage}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {historyStages.length === 0 && (
                            <p className="text-xs text-red-500">No previous stages available. (Is this the first stage?)</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Reason for Rejection</Label>
                        <Textarea
                            placeholder="Describe defects or issues..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleReject} disabled={loading || !targetStage || !notes}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Reject
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
