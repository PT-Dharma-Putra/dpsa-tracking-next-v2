"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Printer, Save, Send, FileText, Upload } from "lucide-react"
import { SPHUploadModal } from "./sph-upload-modal"
import { useState } from "react"
import { useParams } from "next/navigation"

interface SPHSummaryProps {
    total: number;
    onSave: () => void;
    onGenerate: () => void;
}

export function SPHSummary({ total, onSave, onGenerate }: SPHSummaryProps) {
    const ppn = total * 0.11
    const grandTotal = total + ppn

    // Upload Modal State
    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const { id } = useParams() // Assuming we are in /projects/[id]/sph context

    return (
        <Card className="sticky top-20 border-orange-100 shadow-sm">
            <CardHeader className="pb-3 bg-neutral-50/50 border-b border-neutral-100">
                <CardTitle className="text-sm uppercase tracking-widest text-neutral-500">Quotation Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-neutral-600">
                        <span>Subtotal</span>
                        <span className="font-mono">{new Intl.NumberFormat('id-ID').format(total)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-600">
                        <span>PPN (11%)</span>
                        <span className="font-mono">{new Intl.NumberFormat('id-ID').format(ppn)}</span>
                    </div>
                    <div className="border-t border-dashed border-neutral-200 my-2 pt-2 flex justify-between font-bold text-lg text-neutral-900">
                        <span>Total</span>
                        <span>Rp {new Intl.NumberFormat('id-ID').format(grandTotal)}</span>
                    </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-neutral-100">
                    <Button className="w-full bg-neutral-900 hover:bg-neutral-800" onClick={onSave}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Draft
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                        onClick={() => setIsUploadOpen(true)}
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Final SPH (PDF)
                    </Button>

                    <p className="text-[10px] text-center text-neutral-400">
                        Uploading SPH will make it visible to Client.
                    </p>
                </div>

                {/* Upload Modal */}
                <SPHUploadModal
                    open={isUploadOpen}
                    onOpenChange={setIsUploadOpen}
                    projectId={Number(id)}
                    onSuccess={() => {
                        // Optional: Refresh or redirect
                    }}
                />
            </CardContent>
        </Card>
    )
}
