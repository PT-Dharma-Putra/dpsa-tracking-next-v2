"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ProjectService } from "@/features/projects/services/project-service"
import { PPICService } from "@/features/projects/services/ppic-service"
import { Loader2, Save, FileText, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface DivisionAssignmentWidgetProps {
    projectId: number;
    spkNumber?: string;
}

const DIVISIONS = [
    { value: "ASD", label: "ASD" },
    { value: "BACY", label: "BACY" },
    { value: "DCA", label: "DCA" },
    { value: "DPSA", label: "DPSA" },
    { value: "KJAS", label: "KJAS" },
    { value: "KPSA", label: "KPSA" },
    { value: "SDB", label: "SDB" },
    { value: "SMB", label: "SMB" },
    { value: "SSDA", label: "SSDA" },
    { value: "UISA", label: "UISA" },
];

export function DivisionAssignmentWidget({ projectId, spkNumber }: DivisionAssignmentWidgetProps) {
    const queryClient = useQueryClient();
    const [assignments, setAssignments] = useState<Record<number, string>>({});

    // 1. Fetch SPH Items
    const { data: items, isLoading } = useQuery({
        queryKey: ["sph-items", projectId],
        queryFn: () => ProjectService.getSPHItems(projectId)
    });

    // 2. Mutation for Bulk Assign
    const bulkAssignMutation = useMutation({
        mutationFn: async () => {
            const payload = Object.entries(assignments).map(([itemId, divisi]) => ({
                item_id: Number(itemId),
                divisi
            }));
            if (payload.length === 0) return;
            return await PPICService.bulkAssignDivisi(payload);
        },
        onSuccess: () => {
            toast.success("Division assignments saved successfully");
            queryClient.invalidateQueries({ queryKey: ["sph-items", projectId] });
            setAssignments({});
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to save assignments");
        }
    });

    // Handle Change
    const handleDivisionChange = (itemId: number, value: string) => {
        setAssignments(prev => ({ ...prev, [itemId]: value }));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8 border rounded-lg bg-white">
                <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
            </div>
        )
    }

    const hasChanges = Object.keys(assignments).length > 0;

    return (
        <Card className="border-neutral-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-neutral-50/50 border-b border-neutral-100 pb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-sm font-bold uppercase tracking-wide text-neutral-500 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Division Assignment
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Assign production items to specific divisions.
                        </CardDescription>
                    </div>
                    {/* SPK Parent Context */}
                    <div className="text-right">
                        <p className="text-xs font-semibold text-neutral-400 uppercase">SPK Reference</p>
                        <p className="text-sm font-bold text-neutral-900 font-mono">
                            {spkNumber || "No SPK Number"}
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-neutral-100">
                    {items && items.length > 0 ? (
                        items.map((item: any) => {
                            const currentDivisi = assignments[item.id] || item.divisi;

                            return (
                                <div key={item.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-neutral-50/50 transition-colors">
                                    {/* Item Info */}
                                    <div className="col-span-12 md:col-span-8">
                                        <div className="flex items-start gap-3">
                                            <div className="h-8 w-8 rounded bg-neutral-100 flex items-center justify-center shrink-0">
                                                <span className="text-xs font-bold text-neutral-500">{item.qty}x</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-neutral-900 line-clamp-1">{item.name}</p>
                                                <p className="text-xs text-neutral-500 line-clamp-1">{item.description || "No description"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Division Selector */}
                                    <div className="col-span-12 md:col-span-4">
                                        <Select
                                            value={currentDivisi || ""}
                                            onValueChange={(val) => handleDivisionChange(item.id, val)}
                                        >
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Select Division" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DIVISIONS.map(div => (
                                                    <SelectItem key={div.value} value={div.value}>
                                                        {div.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="p-8 text-center text-neutral-400">
                            No items found for this project.
                        </div>
                    )}
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-end">
                    <Button
                        size="sm"
                        onClick={() => bulkAssignMutation.mutate()}
                        disabled={!hasChanges || bulkAssignMutation.isPending}
                        className={hasChanges ? "animate-pulse" : ""}
                    >
                        {bulkAssignMutation.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-3 w-3" />
                                Save Assignments ({Object.keys(assignments).length})
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
