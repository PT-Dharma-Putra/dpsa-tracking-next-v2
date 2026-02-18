"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { axiosInstance } from "@/lib/axios"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, QrCode, Camera } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { UpdateProgressModal } from "./update-progress-modal"
import { QCGateModal } from "./qc-gate-modal"

interface ProductionQueueProps {
    stage: string
    projectId?: string
}

export function ProductionQueue({ stage, projectId }: ProductionQueueProps) {
    const [selectedItem, setSelectedItem] = useState<any>(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [qcModalOpen, setQcModalOpen] = useState(false)

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['production-queue', stage, projectId],
        queryFn: async () => {
            const url = projectId
                ? `/production/queue?stage=${stage}&project_id=${projectId}`
                : `/production/queue?stage=${stage}`
            const res = await axiosInstance.get(url)
            return res.data
        }
    })

    if (isLoading) {
        return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
        </div>
    }

    if (error) {
        return <div className="p-4 text-red-500 bg-red-50 rounded-lg">Error loading queue.</div>
    }

    const items = data?.data || []

    if (items.length === 0) {
        return <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
            <div className="flex justify-center mb-4"><Package className="w-12 h-12 text-slate-300" /></div>
            <h3 className="text-lg font-medium">No items in {stage} queue</h3>
            <p>Wait for items to arrive from previous stages.</p>
        </div>
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item: any) => {
                    const activeJob = item.current_job;
                    return (
                        <Card key={item.id} className={`overflow-hidden border-l-4 hover:shadow-md transition-shadow ${activeJob ? 'border-l-emerald-500 bg-emerald-50/30' : 'border-l-blue-500'}`}>
                            <CardHeader className="pb-2 bg-slate-50/50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">{item.project?.spk_number || "No SPK"}</div>
                                        <CardTitle className="text-base line-clamp-1">{item.mdl_item?.nama_barang || item.item}</CardTitle>
                                    </div>
                                    <Badge variant={item.stage_status === 'rejected' ? 'destructive' : 'secondary'}>
                                        {item.stage_status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 text-sm space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Qty:</span>
                                    <span className="font-mono font-medium">{item.jumlah} {item.satuan}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Dimensions:</span>
                                    <span className="font-mono">{item.panjang}x{item.lebar}x{item.tinggi}</span>
                                </div>
                                {item.keterangan && (
                                    <div className="p-2 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-100 mt-2">
                                        Note: {item.keterangan}
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="bg-slate-50 p-3 flex gap-2">
                                {stage === 'qc' ? (
                                    <>
                                        <Button
                                            variant="outline"
                                            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                            onClick={() => {
                                                setSelectedItem(item)
                                                setQcModalOpen(true)
                                            }}
                                        >
                                            Reject
                                        </Button>
                                        <Button
                                            className="flex-1 bg-green-600 hover:bg-green-700"
                                            onClick={() => {
                                                setSelectedItem(item)
                                                setModalOpen(true) // Re-use standard complete for QC Pass
                                            }}
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                            Pass
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        className="w-full gap-2"
                                        onClick={() => {
                                            setSelectedItem(item)
                                            setModalOpen(true)
                                        }}
                                    >
                                        <Camera className="w-4 h-4" />
                                        Update Progress
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>

            <UpdateProgressModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                item={selectedItem}
                onSuccess={() => refetch()}
            />

            <QCGateModal
                open={qcModalOpen}
                onOpenChange={setQcModalOpen}
                item={selectedItem}
                onSuccess={() => refetch()}
            />
        </>
    )
}

function Package(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m7.5 4.27 9 5.15" />
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22v-9" />
        </svg>
    )
}
