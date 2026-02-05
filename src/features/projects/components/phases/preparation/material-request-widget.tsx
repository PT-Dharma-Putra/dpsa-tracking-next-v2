"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MaterialService } from "@/features/projects/services/material-service"
import { Loader2, Package, CheckCircle2, AlertCircle, ShoppingCart, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface MaterialRequestWidgetProps {
    projectId: number;
}

export function MaterialRequestWidget({ projectId }: MaterialRequestWidgetProps) {
    const queryClient = useQueryClient();
    const [selectedStatus, setSelectedStatus] = useState<string>("all");

    // Fetch all materials for project
    const { data: materialsData, isLoading } = useQuery({
        queryKey: ["project-materials", projectId, selectedStatus],
        queryFn: () => MaterialService.getProjectMaterials(projectId, selectedStatus === "all" ? undefined : selectedStatus)
    });

    const groupedMaterials = materialsData?.data || [];

    // Count by status
    const counts = {
        all: 0,
        pending: 0,
        available: 0,
        need_purchase: 0
    };

    groupedMaterials.forEach((group: any) => {
        group.materials.forEach((material: any) => {
            counts.all++;
            if (material.status === 'pending') counts.pending++;
            if (material.status === 'available') counts.available++;
            if (material.status === 'need_purchase') counts.need_purchase++;
        });
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8 border rounded-lg bg-neutral-50">
                <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
            </div>
        )
    }

    return (
        <Card className="border-neutral-200 shadow-sm">
            <CardHeader className="bg-neutral-50/50 border-b border-neutral-100 pb-4">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-bold uppercase tracking-wide text-neutral-500 flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Material Requests
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                        {counts.all} total
                    </Badge>
                </div>
                <CardDescription>
                    Review material requests from PPIC and update availability status.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6">

                {/* Status Tabs */}
                <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 mb-6">
                        <TabsTrigger value="all" className="text-xs">
                            All ({counts.all})
                        </TabsTrigger>
                        <TabsTrigger value="pending" className="text-xs">
                            Pending ({counts.pending})
                        </TabsTrigger>
                        <TabsTrigger value="need_purchase" className="text-xs">
                            Need Purchase ({counts.need_purchase})
                        </TabsTrigger>
                        <TabsTrigger value="available" className="text-xs">
                            Available ({counts.available})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value={selectedStatus} className="space-y-4">
                        {groupedMaterials.length === 0 ? (
                            <div className="text-center py-8">
                                <Package className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                                <p className="text-sm text-neutral-500">No materials found</p>
                            </div>
                        ) : (
                            groupedMaterials.map((group: any) => (
                                <ItemMaterialGroup
                                    key={group.item.id}
                                    item={group.item}
                                    materials={group.materials}
                                    projectId={projectId}
                                />
                            ))
                        )}
                    </TabsContent>
                </Tabs>

            </CardContent>
        </Card>
    )
}

// Material Group by Item
function ItemMaterialGroup({ item, materials, projectId }: { item: any, materials: any[], projectId: number }) {
    return (
        <div className="border border-neutral-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-neutral-900">{item.name}</h3>
                <Badge variant="outline" className="text-xs">
                    {materials.length} materials
                </Badge>
            </div>
            <div className="space-y-2">
                {materials.map((material: any) => (
                    <MaterialRequestCard
                        key={material.id}
                        material={material}
                        projectId={projectId}
                    />
                ))}
            </div>
        </div>
    );
}

// Material Request Card
function MaterialRequestCard({ material, projectId }: { material: any, projectId: number }) {
    const queryClient = useQueryClient();
    const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
    const [releaseData, setReleaseData] = useState({
        released_to_pic: '',
        released_date: new Date().toISOString().split('T')[0] // Today's date as default
    });

    const updateStatusMutation = useMutation({
        mutationFn: (status: string) => MaterialService.updateMaterial(projectId, material.id, { status }),
        onSuccess: () => {
            toast.success("Status updated");
            queryClient.invalidateQueries({ queryKey: ["project-materials", projectId] });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update status");
        }
    });

    const releaseMutation = useMutation({
        mutationFn: () => MaterialService.updateMaterial(projectId, material.id, {
            status: 'released',
            released_to_pic: releaseData.released_to_pic,
            released_date: releaseData.released_date
        }),
        onSuccess: () => {
            toast.success("Material released successfully");
            queryClient.invalidateQueries({ queryKey: ["project-materials", projectId] });
            setIsReleaseModalOpen(false);
            setReleaseData({ released_to_pic: '', released_date: new Date().toISOString().split('T')[0] });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to release material");
        }
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="outline" className="text-xs"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>;
            case 'available':
                return <Badge className="text-xs bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Available</Badge>;
            case 'need_purchase':
                return <Badge className="text-xs bg-orange-600"><ShoppingCart className="h-3 w-3 mr-1" />Need Purchase</Badge>;
            case 'released':
                return <Badge className="text-xs bg-blue-600"><Truck className="h-3 w-3 mr-1" />Released</Badge>;
            default:
                return <Badge variant="outline" className="text-xs">{status}</Badge>;
        }
    };

    return (
        <div className="bg-neutral-50 border border-neutral-100 rounded-lg p-3 space-y-3">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    {/* Item Name */}
                    {material.sph_item?.name && (
                        <p className="text-xs font-medium text-blue-600 mb-1">
                            📦 {material.sph_item.name}
                        </p>
                    )}
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-neutral-900">{material.material_name}</p>
                        {getStatusBadge(material.status)}
                    </div>
                    <p className="text-xs text-neutral-500">
                        Qty: <span className="font-semibold">{material.quantity} {material.unit}</span>
                        {material.notes && <span className="ml-2">• {material.notes}</span>}
                    </p>
                </div>
            </div>

            {/* Actions */}
            {material.status !== 'released' && (
                <div className="flex items-center gap-2 pt-2 border-t border-neutral-200">
                    {material.status === 'pending' && (
                        <>
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-xs border-green-200 text-green-700 hover:bg-green-50"
                                onClick={() => updateStatusMutation.mutate('available')}
                                disabled={updateStatusMutation.isPending}
                            >
                                {updateStatusMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                                Mark Available
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-xs border-orange-200 text-orange-700 hover:bg-orange-50"
                                onClick={() => updateStatusMutation.mutate('need_purchase')}
                                disabled={updateStatusMutation.isPending}
                            >
                                {updateStatusMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShoppingCart className="h-3 w-3 mr-1" />}
                                Need Purchase
                            </Button>
                        </>
                    )}
                    {material.status === 'need_purchase' && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs border-green-200 text-green-700 hover:bg-green-50"
                            onClick={() => updateStatusMutation.mutate('available')}
                            disabled={updateStatusMutation.isPending}
                        >
                            {updateStatusMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                            Mark Available
                        </Button>
                    )}
                    {material.status === 'available' && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                            onClick={() => setIsReleaseModalOpen(true)}
                        >
                            <Truck className="h-3 w-3 mr-1" />
                            Mark Released
                        </Button>
                    )}
                </div>
            )}

            {/* Release Modal */}
            <Dialog open={isReleaseModalOpen} onOpenChange={setIsReleaseModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Release Material</DialogTitle>
                        <DialogDescription>
                            Enter the PIC (Person In Charge) and release date for {material.material_name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="pic">PIC (Person In Charge) *</Label>
                            <Input
                                id="pic"
                                placeholder="Enter PIC name"
                                value={releaseData.released_to_pic}
                                onChange={(e) => setReleaseData({ ...releaseData, released_to_pic: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="date">Release Date *</Label>
                            <Input
                                id="date"
                                type="date"
                                value={releaseData.released_date}
                                onChange={(e) => setReleaseData({ ...releaseData, released_date: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsReleaseModalOpen(false)}
                            disabled={releaseMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => releaseMutation.mutate()}
                            disabled={releaseMutation.isPending || !releaseData.released_to_pic || !releaseData.released_date}
                        >
                            {releaseMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Confirm Release
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
