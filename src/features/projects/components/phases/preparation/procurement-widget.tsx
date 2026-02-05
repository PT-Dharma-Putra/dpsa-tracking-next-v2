"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { WarehouseService } from "@/features/projects/services/warehouse-service"
import { Loader2, Box, Check, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"

interface ProcurementWidgetProps {
    projectId: number;
}

const MATERIAL_STATUSES = [
    { value: "Waiting", label: "Waiting", color: "bg-neutral-100 text-neutral-600" },
    { value: "Ordered", label: "Ordered", color: "bg-blue-100 text-blue-700" },
    { value: "Ready", label: "Ready (In Stock)", color: "bg-green-100 text-green-700" },
    { value: "Issue", label: "Issue / Delay", color: "bg-red-100 text-red-700" },
];

export function ProcurementWidget({ projectId }: ProcurementWidgetProps) {
    const queryClient = useQueryClient();

    // 1. Fetch Warehouse Items
    const { data: itemsResponse, isLoading } = useQuery({
        queryKey: ["warehouse-items", projectId],
        queryFn: () => WarehouseService.getWarehouseItems(projectId)
    });

    const items = itemsResponse?.data || [];

    // 2. Update Status Mutation
    const updateStatusMutation = useMutation({
        mutationFn: async ({ itemId, status }: { itemId: number, status: string }) => {
            return await WarehouseService.updateMaterialStatus(itemId, status, new Date());
        },
        onSuccess: () => {
            toast.success("Material status updated");
            queryClient.invalidateQueries({ queryKey: ["warehouse-items", projectId] });
        },
        onError: (error: any) => {
            toast.error("Failed to update status");
        }
    });

    // Calculate Progress
    const totalItems = items.length;
    const readyItems = items.filter((i: any) => i.material_status === 'Ready').length;
    const progress = totalItems > 0 ? (readyItems / totalItems) * 100 : 0;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8 border rounded-lg bg-neutral-50 h-full">
                <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
            </div>
        )
    }

    return (
        <Card className="border-neutral-200 shadow-sm h-full flex flex-col">
            <CardHeader className="bg-neutral-50/50 border-b border-neutral-100 pb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-sm font-bold uppercase tracking-wide text-neutral-500 flex items-center gap-2">
                            <Box className="h-4 w-4" />
                            Procurement Status
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Track material readiness.
                        </CardDescription>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-neutral-900">{Math.round(progress)}%</span>
                        <p className="text-[10px] text-neutral-500 uppercase font-semibold">Ready</p>
                    </div>
                </div>
                <Progress value={progress} className="h-1 mt-2" />
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto max-h-[500px]">
                {items.length > 0 ? (
                    <div className="divide-y divide-neutral-100">
                        {items.map((item: any) => (
                            <div key={item.id} className="p-4 hover:bg-neutral-50/50 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-sm font-medium text-neutral-900 line-clamp-1">{item.name}</p>
                                        <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-5">{item.divisi || "No Div"}</Badge>
                                            <span>{item.ruang || "No Room"}</span>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="text-[10px]">{item.jumlah}x</Badge>
                                </div>

                                <Select
                                    value={item.material_status}
                                    onValueChange={(val) => updateStatusMutation.mutate({ itemId: item.id, status: val })}
                                >
                                    <SelectTrigger className={`h-8 text-xs w-full ${MATERIAL_STATUSES.find(s => s.value === item.material_status)?.color || ''}`}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MATERIAL_STATUSES.map(status => (
                                            <SelectItem key={status.value} value={status.value}>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${status.color.split(' ')[0].replace('bg-', 'bg-')}`} />
                                                    {status.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center">
                        <div className="bg-neutral-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Box className="h-6 w-6 text-neutral-400" />
                        </div>
                        <p className="text-sm font-medium text-neutral-900">No Items to Procure</p>
                        <p className="text-xs text-neutral-500 mt-1">Assign divisions to items first.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
