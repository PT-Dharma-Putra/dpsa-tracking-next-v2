"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { PPICService } from "@/features/projects/services/ppic-service"
import { MaterialService, type MaterialPayload } from "@/features/projects/services/material-service"
import { ProjectService } from "@/features/projects/services/project-service"
import { Loader2, Upload, FileText, Download, AlertCircle, Plus, Trash2, Edit2, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface DokubahWidgetProps {
    projectId: number;
}

export function DokubahWidget({ projectId }: DokubahWidgetProps) {
    const queryClient = useQueryClient();
    const [file, setFile] = useState<File | null>(null);

    // Fetch Dokubah Data (General Material List)
    const { data: dokubahData, isLoading } = useQuery({
        queryKey: ["dokubah", projectId],
        queryFn: () => PPICService.getDokubah(projectId)
    });

    // Fetch SPH Items
    const { data: sphItems, isLoading: itemsLoading } = useQuery({
        queryKey: ["sph-items", projectId],
        queryFn: () => ProjectService.getSPHItems(projectId)
    });

    // Upload General Dokubah Mutation
    const uploadMutation = useMutation({
        mutationFn: async () => {
            if (!file) throw new Error("Please select a file first");
            return await PPICService.uploadDokubah(projectId, file);
        },
        onSuccess: () => {
            toast.success("Dokubah uploaded successfully");
            setFile(null);
            queryClient.invalidateQueries({ queryKey: ["dokubah", projectId] });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to upload Dokubah");
        }
    });

    const status = dokubahData?.data?.dokubah_status || 'not_uploaded';
    const fileUrl = dokubahData?.data?.file_url;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    if (isLoading || itemsLoading) {
        return (
            <div className="flex items-center justify-center p-8 border rounded-lg bg-neutral-50">
                <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
            </div>
        )
    }

    return (
        <Card className="border-neutral-200 shadow-sm h-full">
            <CardHeader className="bg-neutral-50/50 border-b border-neutral-100 pb-4">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-bold uppercase tracking-wide text-neutral-500 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Dokubah (Material List)
                    </CardTitle>
                    <Badge variant={status === 'not_uploaded' ? 'outline' : 'default'} className={
                        status === 'uploaded' ? 'bg-green-600 hover:bg-green-700' :
                            status === 'revised' ? 'bg-blue-600 hover:bg-blue-700' : ''
                    }>
                        {status === 'not_uploaded' ? 'Pending' : status === 'revised' ? 'Revised' : 'Uploaded'}
                    </Badge>
                </div>
                <CardDescription>
                    General material list and per-item material requirements.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">

                {/* General Dokubah Section */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-neutral-700">General Material List (Dokubah)</h3>

                    {fileUrl ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between bg-green-50 border border-green-100 rounded-lg p-3">
                                <p className="text-sm text-green-900 font-medium">Dokubah available</p>
                                <Link href={fileUrl} target="_blank">
                                    <Button size="sm" variant="outline" className="border-green-200 text-green-700 hover:bg-green-100">
                                        <Download className="mr-2 h-3 w-3" /> Download
                                    </Button>
                                </Link>
                            </div>
                            {/* PDF Viewer */}
                            <div className="border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50">
                                <iframe
                                    src={fileUrl}
                                    className="w-full h-[400px]"
                                    title="Dokubah PDF Viewer"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="bg-neutral-50 border border-neutral-100 rounded-lg p-4 flex items-center gap-3">
                            <div className="bg-white p-2 rounded-full border border-neutral-200 shadow-sm">
                                <AlertCircle className="h-5 w-5 text-neutral-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-neutral-900">No Dokubah yet</p>
                                <p className="text-xs text-neutral-500">Please upload using the form below.</p>
                            </div>
                        </div>
                    )}

                    {/* Upload Form */}
                    <div className="space-y-3 pt-2 border-t border-neutral-100">
                        <label className="text-xs font-semibold text-neutral-500 uppercase">Update / Upload New</label>
                        <div className="flex gap-2">
                            <input
                                type="file"
                                accept=".pdf,.xlsx,.xls,.doc,.docx"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-neutral-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-md file:border-0
                                    file:text-xs file:font-semibold
                                    file:bg-orange-50 file:text-orange-700
                                    hover:file:bg-orange-100
                                    border border-neutral-200 rounded-md cursor-pointer
                                "
                            />
                            <Button
                                size="sm"
                                onClick={() => uploadMutation.mutate()}
                                disabled={!file || uploadMutation.isPending}
                            >
                                {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            </Button>
                        </div>
                        <p className="text-[10px] text-neutral-400">Supported: PDF, Excel, Word (Max 15MB)</p>
                    </div>
                </div>

                {/* Per-Item Material Requirements */}
                <div className="space-y-3 pt-4 border-t border-neutral-100">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Per-Item Material Requirements
                        </h3>
                        <Badge variant="outline" className="text-xs">
                            {sphItems?.length || 0} items
                        </Badge>
                    </div>

                    <Accordion type="multiple" className="w-full">
                        {sphItems && sphItems.length > 0 ? (
                            sphItems.map((item: any) => (
                                <ItemMaterialAccordion
                                    key={item.id}
                                    item={item}
                                    projectId={projectId}
                                />
                            ))
                        ) : (
                            <p className="text-sm text-neutral-400 text-center py-4">No items found</p>
                        )}
                    </Accordion>
                </div>

            </CardContent>
        </Card>
    )
}

// Sub-component for each item's materials
function ItemMaterialAccordion({ item, projectId }: { item: any, projectId: number }) {
    const queryClient = useQueryClient();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<any>(null);

    const { data: materials, isLoading } = useQuery({
        queryKey: ["item-materials", projectId, item.id],
        queryFn: () => MaterialService.getItemMaterials(projectId, item.id)
    });

    const materialsList = materials?.data || [];

    return (
        <AccordionItem value={`item-${item.id}`} className="border border-neutral-200 rounded-lg mb-2 px-4">
            <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                    <span className="text-sm font-medium text-neutral-900">{item.name}</span>
                    <Badge variant="outline" className="text-xs">
                        {materialsList.length} materials
                    </Badge>
                </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
                {isLoading ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
                    </div>
                ) : (
                    <>
                        {/* Material List */}
                        <div className="space-y-2">
                            {materialsList.map((material: any) => (
                                <MaterialCard
                                    key={material.id}
                                    material={material}
                                    onEdit={() => setEditingMaterial(material)}
                                />
                            ))}
                        </div>

                        {/* Add Material Button */}
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="w-full border-dashed">
                                    <Plus className="h-3 w-3 mr-2" />
                                    Add Material
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <AddMaterialForm
                                    projectId={projectId}
                                    itemId={item.id}
                                    onSuccess={() => setIsAddDialogOpen(false)}
                                />
                            </DialogContent>
                        </Dialog>

                        {/* Edit Material Dialog */}
                        {editingMaterial && (
                            <Dialog open={!!editingMaterial} onOpenChange={() => setEditingMaterial(null)}>
                                <DialogContent>
                                    <EditMaterialForm
                                        material={editingMaterial}
                                        onSuccess={() => setEditingMaterial(null)}
                                    />
                                </DialogContent>
                            </Dialog>
                        )}
                    </>
                )}
            </AccordionContent>
        </AccordionItem>
    );
}

// Material Card Component
function MaterialCard({ material, onEdit }: { material: any, onEdit: () => void }) {
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: () => MaterialService.deleteMaterial(projectId, material.id),
        onSuccess: () => {
            toast.success("Material deleted");
            queryClient.invalidateQueries({ queryKey: ["item-materials"] });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete");
        }
    });

    return (
        <div className="flex items-center justify-between p-3 bg-neutral-50 rounded border border-neutral-100 group hover:bg-neutral-100">
            <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900">{material.material_name}</p>
                <p className="text-xs text-neutral-500">
                    Qty: {material.quantity} {material.unit}
                    {material.notes && ` • ${material.notes}`}
                </p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}>
                    <Edit2 className="h-3 w-3" />
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Material?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete <b>{material.material_name}</b>.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => deleteMutation.mutate()}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}

// Add Material Form
function AddMaterialForm({ projectId, itemId, onSuccess }: { projectId: number, itemId: number, onSuccess: () => void }) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<MaterialPayload>({
        material_name: '',
        quantity: 0,
        unit: '',
        notes: ''
    });

    const addMutation = useMutation({
        mutationFn: () => MaterialService.addMaterial(projectId, itemId, formData),
        onSuccess: () => {
            toast.success("Material added");
            queryClient.invalidateQueries({ queryKey: ["item-materials", projectId, itemId] });
            onSuccess();
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to add material");
        }
    });

    return (
        <>
            <DialogHeader>
                <DialogTitle>Add Material</DialogTitle>
                <DialogDescription>Add a new material requirement for this item.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="material_name">Material Name</Label>
                    <Input
                        id="material_name"
                        placeholder="e.g., Kayu Jati, Besi Hollow, dll"
                        value={formData.material_name}
                        onChange={(e) => setFormData({ ...formData, material_name: e.target.value })}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                            id="quantity"
                            type="number"
                            step="0.01"
                            placeholder="0"
                            value={formData.quantity || ''}
                            onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="unit">Unit</Label>
                        <Input
                            id="unit"
                            placeholder="pcs, m³, kg, dll"
                            value={formData.unit}
                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                        id="notes"
                        placeholder="Additional notes..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={2}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button
                    onClick={() => addMutation.mutate()}
                    disabled={!formData.material_name || !formData.quantity || !formData.unit || addMutation.isPending}
                >
                    {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Add Material
                </Button>
            </DialogFooter>
        </>
    );
}

// Edit Material Form
function EditMaterialForm({ material, onSuccess }: { material: any, onSuccess: () => void }) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        material_name: material.material_name,
        quantity: material.quantity,
        unit: material.unit,
        notes: material.notes || ''
    });

    const updateMutation = useMutation({
        mutationFn: () => MaterialService.updateMaterial(projectId, material.id, formData),
        onSuccess: () => {
            toast.success("Material updated");
            queryClient.invalidateQueries({ queryKey: ["item-materials"] });
            onSuccess();
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update material");
        }
    });

    return (
        <>
            <DialogHeader>
                <DialogTitle>Edit Material</DialogTitle>
                <DialogDescription>Update material information.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="edit_material_name">Material Name</Label>
                    <Input
                        id="edit_material_name"
                        value={formData.material_name}
                        onChange={(e) => setFormData({ ...formData, material_name: e.target.value })}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit_quantity">Quantity</Label>
                        <Input
                            id="edit_quantity"
                            type="number"
                            step="0.01"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit_unit">Unit</Label>
                        <Input
                            id="edit_unit"
                            value={formData.unit}
                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="edit_notes">Notes</Label>
                    <Textarea
                        id="edit_notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={2}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button
                    onClick={() => updateMutation.mutate()}
                    disabled={!formData.material_name || !formData.quantity || !formData.unit || updateMutation.isPending}
                >
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Update Material
                </Button>
            </DialogFooter>
        </>
    );
}
