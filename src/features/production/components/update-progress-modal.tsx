"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ImagePlus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { axiosInstance } from "@/lib/axios"

interface UpdateProgressModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: any
    onSuccess: () => void
}

export function UpdateProgressModal({ open, onOpenChange, item, onSuccess }: UpdateProgressModalProps) {
    const [loading, setLoading] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [notes, setNotes] = useState("")

    if (!item) return null

    const handleSubmit = async () => {
        if (!file && item.stage !== 'qc') { // Photo mandatory for workers (except maybe QC pass)
            // Let's make it mandatory for everyone for now
        }

        setLoading(true)
        try {
            const formData = new FormData()
            formData.append('project_item_id', item.id)
            if (file) formData.append('photo', file)
            formData.append('notes', notes)

            await axiosInstance.post('/production/update-progress', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            toast.success("Progress Updated", { description: "Item moved to next stage." })
            onSuccess()
            onOpenChange(false)
            setFile(null)
            setNotes("")
        } catch (error: any) {
            toast.error("Error", {
                description: error.response?.data?.error || "Failed to update progress"
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Update Progress</DialogTitle>
                    <DialogDescription>
                        Mark <strong>{item.item}</strong> as completed in <strong>{item.current_stage}</strong> stage.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="picture">Photo Proof</Label>
                        <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground hover:bg-slate-50 cursor-pointer relative">
                            <input
                                type="file"
                                id="picture"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                accept="image/*"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                            {file ? (
                                <div className="text-center">
                                    <p className="font-medium text-emerald-600 truncate max-w-[200px]">{file.name}</p>
                                    <p className="text-xs">{(file.size / 1024).toFixed(0)} KB</p>
                                </div>
                            ) : (
                                <>
                                    <ImagePlus className="w-8 h-8 mb-2 opacity-50" />
                                    <span className="text-sm">Click to upload photo</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid w-full gap-1.5">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Any issues or comments..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading || (!file && item.current_stage !== 'qc')}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Complete & Move Next
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
