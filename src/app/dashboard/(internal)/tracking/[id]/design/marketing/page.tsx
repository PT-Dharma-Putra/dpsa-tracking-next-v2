"use client"

import { use, useState, useEffect } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { DesignService, SPHItem } from "@/features/projects/services/design-service"
import { DocumentService } from "@/features/projects/services/document-service"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowLeft, Upload, FileText, Check, Loader2, Info, Plus, Lock, X, Eye, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function DesignMarketingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = use(params);
    const queryClient = useQueryClient();

    // Fetch Data
    const { data, isLoading } = useQuery({
        queryKey: ['design-items', projectId],
        queryFn: () => DesignService.getItems(projectId),
    });

    // Check SPH Status for Freeze
    const { data: sphData } = useQuery({
        queryKey: ['sph', projectId],
        queryFn: () => DocumentService.getSPH(projectId)
    });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-orange-600" /></div>;
    }

    const { items } = data || { items: [] };

    // Pagination Logic
    const itemsPerPage = 20;
    const totalPages = Math.ceil((items?.length || 0) / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);

    // Freeze if SPH is created (has a number)
    const isDesignFrozen = !!(sphData?.sph_number);

    return (
        <div className="flex flex-col h-screen bg-neutral-50">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-neutral-200">
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/tracking/${projectId}`}>
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-neutral-900">Design Requirements</h1>
                        <p className="text-xs text-neutral-500">Marketing View: Select items needing design</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500">
                        {items.filter((i: SPHItem) => i.needs_design).length} Items Selected
                    </span>
                    {isDesignFrozen && (
                        <Badge variant="secondary" className="bg-neutral-100 text-neutral-600 border-neutral-200">
                            <Lock className="h-3 w-3 mr-1" /> Frozen
                        </Badge>
                    )}
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full space-y-6">

                {/* Quick Add (New) */}
                {isDesignFrozen ? (
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-center gap-3">
                        <Lock className="h-5 w-5 text-amber-600" />
                        <div>
                            <h3 className="text-sm font-bold text-amber-800">Design Scope Frozen</h3>
                            <p className="text-xs text-amber-600">SPH has been generated. To add items, please revise the SPH first.</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-4 rounded-xl border border-neutral-200 flex items-center justify-between shadow-sm">
                        <div>
                            <h3 className="text-sm font-bold text-neutral-900">Missing Items?</h3>
                            <p className="text-xs text-neutral-500">Add items here directly to the scope.</p>
                        </div>
                        <CreateItemDialog projectId={projectId} />
                    </div>
                )}

                {/* ADD PROJECT BRIEF UPLOAD HERE */}
                {items.some((i: SPHItem) => i.needs_design) && (
                    <ProjectBriefUpload items={items} projectId={projectId} />
                )}

                {items.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                        <p className="text-neutral-500">No items found yet.</p>
                        <p className="text-xs text-neutral-400 mt-1">Add items using the button above.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500">
                                <tr>
                                    <th className="px-4 py-3 font-medium w-12 text-center">No</th>
                                    <th className="px-4 py-3 font-medium">Nama Item</th>
                                    <th className="px-4 py-3 font-medium w-24 text-center">Qty</th>
                                    <th className="px-4 py-3 font-medium">Deskripsi</th>
                                    <th className="px-4 py-3 font-medium w-32 text-center">Butuh Desain?</th>
                                    <th className="px-4 py-3 font-medium w-32 text-center">Progress</th>
                                    <th className="px-4 py-3 font-medium w-32 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200">
                                {currentItems.map((item: SPHItem, index: number) => (
                                    <DesignItemTableRow 
                                        key={item.id} 
                                        item={item} 
                                        index={indexOfFirstItem + index} 
                                        projectId={projectId} 
                                        isFrozen={isDesignFrozen} 
                                    />
                                ))}
                            </tbody>
                        </table>
                        
                        {/* Pagination Footer */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 bg-neutral-50">
                                <span className="text-xs text-neutral-500">
                                    Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, items.length)} dari {items.length} data
                                </span>
                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="h-8 w-8"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-xs font-semibold px-2">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="h-8 w-8"
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

type ItemInput = { name: string, qty: number, description: string, needs_design: boolean };

function CreateItemDialog({ projectId }: { projectId: string }) {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<ItemInput[]>([{ name: "", qty: 1, description: "", needs_design: true }]);

    const addRow = () => setItems([...items, { name: "", qty: 1, description: "", needs_design: true }]);
    const removeRow = (index: number) => setItems(items.filter((_, i) => i !== index));
    const updateItem = (index: number, field: keyof ItemInput, value: string | number | boolean) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const hasValidItem = items.some(i => i.name.trim() !== "");

    const mutation = useMutation({
        mutationFn: async () => {
            const validItems = items.filter(i => i.name.trim() !== "");
            if (validItems.length === 0) throw new Error("No valid items");
            await Promise.all(
                validItems.map(item => DesignService.createItem(projectId, { 
                    name: item.name, 
                    qty: item.qty, 
                    description: item.description,
                    needs_design: item.needs_design
                }))
            );
        },
        onSuccess: () => {
            toast.success("Items added successfully");
            setOpen(false);
            setItems([{ name: "", qty: 1, description: "", needs_design: true }]);
            queryClient.invalidateQueries({ queryKey: ['design-items', projectId] });
        },
        onError: () => toast.error("Failed to add items")
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-sm font-bold">
                    <Plus className="h-4 w-4 mr-2" /> Add Item
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[1100px]">
                <DialogHeader>
                    <DialogTitle>Add New Item(s)</DialogTitle>
                    <DialogDescription>This will add new items to the project scope.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {/* Header Row */}
                    <div className="flex items-start gap-2 px-1">
                        <Label className="flex-[2] mt-2">Nama Item</Label>
                        <Label className="w-16 text-center mt-2">Qty</Label>
                        <Label className="flex-[3] mt-2">Deskripsi</Label>
                        <Label className="w-24 text-center mt-2">Desain?</Label>
                        <div className="w-8"></div> {/* Spacer for delete button */}
                    </div>

                    {/* Inputs */}
                    <div className="space-y-4 max-h-[500px] overflow-y-auto px-1 py-1">
                        {items.map((item, index) => (
                            <div key={index} className="flex items-start gap-2">
                                <Input 
                                    placeholder="e.g. Wardrobe" 
                                    className="flex-[2]"
                                    value={item.name} 
                                    onChange={(e) => updateItem(index, 'name', e.target.value)} 
                                />
                                <Input 
                                    type="number" 
                                    min={1} 
                                    className="w-16 text-center"
                                    value={item.qty} 
                                    onChange={(e) => updateItem(index, 'qty', Number(e.target.value))} 
                                />
                                <textarea 
                                    placeholder="Dimension, material, color..." 
                                    className="flex-[3] min-h-[40px] resize-y rounded-md border border-neutral-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950"
                                    rows={2}
                                    value={item.description} 
                                    onChange={(e) => updateItem(index, 'description', e.target.value)} 
                                />
                                <div className="w-24 flex justify-center py-3">
                                    <Checkbox
                                        checked={item.needs_design}
                                        onCheckedChange={(c) => updateItem(index, 'needs_design', c as boolean)}
                                        className="data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600 mx-auto"
                                    />
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="w-8 shrink-0 text-neutral-400 hover:text-red-500 hover:bg-red-50 mt-1" 
                                    onClick={() => removeRow(index)}
                                    disabled={items.length === 1}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    <Button variant="outline" size="sm" onClick={addRow} className="mt-2 border-dashed border-2">
                        <Plus className="h-4 w-4 mr-2" /> Tambah Row
                    </Button>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button 
                        onClick={() => mutation.mutate()} 
                        disabled={!hasValidItem || mutation.isPending} 
                        className="bg-orange-600 hover:bg-orange-700 text-white shadow-sm"
                    >
                        {mutation.isPending ? "Adding..." : "Add Items"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function ProjectBriefUpload({ items, projectId }: { items: SPHItem[], projectId: string }) {
    const queryClient = useQueryClient();
    const hasBrief = items.some(i => i.needs_design && i.design_brief);
    const briefUrl = items.find(i => i.needs_design && i.design_brief)?.design_brief;

    const uploadMutation = useMutation({
        mutationFn: async (file: File) => DesignService.uploadProjectBrief(projectId, file),
        onSuccess: () => {
            toast.success("SPD Proyek berhasil diupload");
            queryClient.invalidateQueries({ queryKey: ['design-items', projectId] });
        },
        onError: () => toast.error("Gagal upload SPD Proyek")
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadMutation.mutate(file);
    };

    return (
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 flex items-center justify-between">
            <div>
                <h3 className="text-sm font-bold text-indigo-900">Surat Perintah Desain (SPD)</h3>
                <p className="text-xs text-indigo-700">Upload 1 file SPD untuk dikerjakan tim Design Studio.</p>
            </div>
            <div className="flex items-center gap-3">
                {hasBrief && (
                     <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Check className="h-3 w-3 mr-1" /> Terupload
                        </Badge>
                        <Button variant="ghost" size="sm" asChild className="text-indigo-600 hover:text-indigo-800">
                            <Link href={`${process.env.NEXT_PUBLIC_STORAGE_URL || 'http://localhost:8000/storage'}/${briefUrl}`} target="_blank">
                                <FileText className="h-4 w-4 mr-1"/> Lihat URL
                            </Link>
                        </Button>
                     </div>
                )}
                <input
                    type="file"
                    id="project-spd"
                    className="hidden"
                    accept=".pdf,.jpg,.png,.zip,.doc,.docx"
                    onChange={handleFileChange}
                />
                <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    onClick={() => document.getElementById('project-spd')?.click()}
                    disabled={uploadMutation.isPending}
                >
                    {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                    {hasBrief ? "Update SPD" : "Upload SPD"}
                </Button>
            </div>
        </div>
    )
}

function DesignItemTableRow({ item, index, projectId, isFrozen }: { item: SPHItem, index: number, projectId: string, isFrozen: boolean }) {
    const queryClient = useQueryClient();
    const [dialogMode, setDialogMode] = useState<'view' | 'edit' | null>(null);

    const toggleMutation = useMutation({
        mutationFn: async (checked: boolean) => DesignService.toggleNeedsDesign(item.id, checked),
        onSuccess: () => {
            toast.success("Updated design requirement");
            queryClient.invalidateQueries({ queryKey: ['design-items', projectId] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async () => DesignService.deleteItem(projectId, item.id),
        onSuccess: () => {
            toast.success("Item berhasil dihapus");
            queryClient.invalidateQueries({ queryKey: ['design-items', projectId] });
        },
        onError: () => toast.error("Gagal menghapus item")
    });

    const handleDelete = () => {
        if (confirm(`Apakah Anda yakin ingin menghapus item "${item.name}"?`)) {
            deleteMutation.mutate();
        }
    };

    return (
        <>
        <tr className={cn("hover:bg-neutral-50/50 transition-colors", item.needs_design ? "bg-white" : "bg-neutral-50/30 text-neutral-400")}>
            <td className="px-4 py-3 text-center">{index + 1}</td>
            <td className="px-4 py-3">
                <div className="font-medium text-neutral-900 truncate max-w-[250px]" title={item.name}>{item.name}</div>
            </td>
            <td className="px-4 py-3 text-center">
                {item.qty}
            </td>
            <td className="px-4 py-3">
                <span className="italic truncate max-w-[200px] block" title={item.specs}>{item.specs || '-'}</span>
            </td>
            <td className="px-4 py-3 align-middle text-center">
                <Checkbox
                    checked={item.needs_design}
                    disabled={isFrozen}
                    onCheckedChange={(c) => toggleMutation.mutate(c as boolean)}
                    className="data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600 mx-auto"
                />
            </td>
            <td className="px-4 py-3 align-middle text-center">
                {item.needs_design ? (
                    <Badge variant="outline" className="text-[10px] bg-neutral-50 whitespace-nowrap">
                        {item.design_status?.replace('_', ' ') || 'NONE'}
                    </Badge>
                ) : (
                    <span className="text-xs text-neutral-400">-</span>
                )}
            </td>
            <td className="px-4 py-3 align-middle text-center">
                <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => setDialogMode('view')} title="View Item">
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" disabled={isFrozen} className="h-8 w-8 text-neutral-400 hover:text-orange-600 hover:bg-orange-50" onClick={() => setDialogMode('edit')} title="Edit Item">
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" disabled={isFrozen || deleteMutation.isPending} className="h-8 w-8 text-neutral-400 hover:text-red-600 hover:bg-red-50" onClick={handleDelete} title="Delete Item">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </td>
        </tr>
        <ItemDialog mode={dialogMode} setMode={setDialogMode} item={item} projectId={projectId} />
        </>
    );
}

function ItemDialog({ mode, setMode, item, projectId }: { mode: 'view' | 'edit' | null, setMode: (m: any) => void, item: SPHItem, projectId: string }) {
    const queryClient = useQueryClient();
    const [name, setName] = useState(item.name);
    const [qty, setQty] = useState(item.qty || 1);
    const [specs, setSpecs] = useState(item.specs || "");
    const [needsDesign, setNeedsDesign] = useState(item.needs_design);

    useEffect(() => {
        if (mode) {
            setName(item.name);
            setQty(item.qty || 1);
            setSpecs(item.specs || "");
            setNeedsDesign(item.needs_design);
        }
    }, [mode, item]);

    const mutation = useMutation({
        mutationFn: async () => DesignService.updateItem(projectId, item.id, { name, qty, specs, needs_design: needsDesign }),
        onSuccess: () => {
            toast.success("Item berhasil diperbarui");
            setMode(null);
            queryClient.invalidateQueries({ queryKey: ['design-items', projectId] });
        },
        onError: () => toast.error("Gagal memperbarui item")
    });

    const isView = mode === 'view';

    return (
        <Dialog open={!!mode} onOpenChange={(o) => !o && setMode(null)}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isView ? 'Detail Item' : 'Edit Item'}</DialogTitle>
                    <DialogDescription>
                        {isView ? 'Informasi detail mengenai item ini.' : 'Ubah rincian spesifikasi desain untuk item ini sesuai instruksi proyek.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Nama Item</Label>
                        <Input readOnly={isView} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Master Bedroom Wardrobe" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input readOnly={isView} type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Deskripsi / Spesifikasi</Label>
                        <textarea 
                            readOnly={isView} 
                            rows={3}
                            className={cn(
                                "flex min-h-[80px] w-full rounded-md border border-neutral-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950",
                                isView && "bg-neutral-50 cursor-not-allowed opacity-70"
                            )}
                            value={specs} 
                            onChange={(e) => setSpecs(e.target.value)} 
                            placeholder="Material, dimensi, warna, dsb..." 
                        />
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox id={`needs-design-${item.id}`} disabled={isView} checked={needsDesign} onCheckedChange={(c) => setNeedsDesign(c as boolean)} />
                        <Label htmlFor={`needs-design-${item.id}`} className="cursor-pointer">Butuh Desain Studio?</Label>
                    </div>
                </div>
                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setMode(null)}>Tutup</Button>
                    {!isView && (
                        <Button 
                            onClick={() => mutation.mutate()} 
                            disabled={mutation.isPending || !name.trim()} 
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            {mutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
