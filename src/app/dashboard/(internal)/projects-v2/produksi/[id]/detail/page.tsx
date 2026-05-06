"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
    Plus, 
    Pencil, 
    Trash2, 
    MoreHorizontal,
    Loader2,
    ArrowLeft,
    Calendar,
    FileText,
    Activity,
    ListChecks,
    CheckCircle2,
    Clock,
    Eye,
    Image as ImageIcon,
    Upload,
    BarChart3
} from "lucide-react"
import { format } from "date-fns"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

import { projectV2Service, ProjectItemV2, TahapDesign, DesignProgres, Produksi } from "@/features/projects/services/project-v2-service"
import { ProjectItemFormDialog } from "../../../_components/project-item-form-dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export default function ProduksiDetailPage() {
    const params = useParams()
    const router = useRouter()
    const queryClient = useQueryClient()
    const projectId = parseInt(params.id as string)

    const [isItemFormOpen, setIsItemFormOpen] = React.useState(false)
    const [selectedItem, setSelectedItem] = React.useState<ProjectItemV2 | null>(null)
    const [isItemDeleteDialogOpen, setIsItemDeleteDialogOpen] = React.useState(false)
    const [itemToDelete, setItemToDelete] = React.useState<ProjectItemV2 | null>(null)

    // Data Queries
    const { data: project, isLoading: isLoadingProject } = useQuery({
        queryKey: ["projects-v2", projectId],
        queryFn: () => projectV2Service.getProject(projectId),
    })

    const designId = project?.designs?.[0]?.id

    const { data: items, isLoading: isLoadingItems } = useQuery({
        queryKey: ["project-v2-items", projectId],
        queryFn: () => projectV2Service.getProjectItems(projectId),
    })

    const { data: stages, isLoading: isLoadingStages } = useQuery({
        queryKey: ["design-stages"],
        queryFn: () => projectV2Service.getDesignStages(),
    })

    const { data: progress, isLoading: isLoadingProgress } = useQuery({
        queryKey: ["design-progress", designId],
        queryFn: () => designId ? projectV2Service.getDesignProgress(designId) : Promise.resolve([]),
        enabled: !!designId
    })

    const { data: divisions } = useQuery({
        queryKey: ["divisions"],
        queryFn: () => projectV2Service.getDivisions(),
    })

    const { data: pics } = useQuery({
        queryKey: ["pics"],
        queryFn: () => projectV2Service.getPics(),
    })

    // Mutations
    const deleteItemMutation = useMutation({
        mutationFn: (id: number) => projectV2Service.deleteProjectItem(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-v2-items", projectId] })
            toast.success("Item deleted successfully")
            setIsItemDeleteDialogOpen(false)
        },
        onError: () => {
            toast.error("Failed to delete item")
        }
    })

    const addStageMutation = useMutation({
        mutationFn: (nama: string) => projectV2Service.addDesignStage(nama),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["design-stages"] })
            toast.success("Design stage added")
        }
    })

    const updateProgressMutation = useMutation({
        mutationFn: (payload: { tahap_design_id: number, tanggal_selesai?: string | null }) => 
            projectV2Service.updateDesignProgress(designId!, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["design-progress", designId] })
            toast.success("Progress updated")
        }
    })

    const deleteProgressMutation = useMutation({
        mutationFn: (id: number) => projectV2Service.deleteDesignProgress(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["design-progress", designId] })
            toast.success("Progress milestone removed")
        }
    })

    // Local States for Progress Form
    const [newStageName, setNewStageName] = React.useState("")
    const [selectedStageId, setSelectedStageId] = React.useState<string>("")
    const [completionDate, setCompletionDate] = React.useState<string>(format(new Date(), "yyyy-MM-dd"))

    const handleAddStage = () => {
        if (!newStageName) return
        addStageMutation.mutate(newStageName)
        setNewStageName("")
    }

    const handleUpdateProgress = () => {
        if (!selectedStageId) {
            toast.error("Please select a stage")
            return
        }
        updateProgressMutation.mutate({
            tahap_design_id: parseInt(selectedStageId),
            tanggal_selesai: completionDate || null
        })
    }

    // List Furnitur State
    const [lfFile, setLfFile] = React.useState<File | null>(null)
    const [lfStart, setLfStart] = React.useState<string>("")
    const [lfEnd, setLfEnd] = React.useState<string>("")

    const uploadLfMutation = useMutation({
        mutationFn: (payload: { file?: File; tanggal_mulai?: string; tanggal_selesai?: string }) => 
            projectV2Service.uploadListFurnitur(projectId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects-v2", projectId] })
            toast.success("List Furnitur updated")
            setLfFile(null)
        },
        onError: () => {
            toast.error("Failed to update List Furnitur")
        }
    })

    const handleLfUpload = () => {
        uploadLfMutation.mutate({
            file: lfFile || undefined,
            tanggal_mulai: lfStart || undefined,
            tanggal_selesai: lfEnd || undefined
        })
    }

    // Gambar Kerja State
    const [isGkDialogOpen, setIsGkDialogOpen] = React.useState(false)
    const [gkItem, setGkItem] = React.useState<ProjectItemV2 | null>(null)
    const [gkFile, setGkFile] = React.useState<File | null>(null)
    const [gkStart, setGkStart] = React.useState<string>("")
    const [gkEnd, setGkEnd] = React.useState<string>("")

    const uploadGkMutation = useMutation({
        mutationFn: (payload: { file?: File; tanggal_mulai?: string; tanggal_selesai?: string }) => 
            projectV2Service.uploadGambarKerja(gkItem!.id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-v2-items", projectId] })
            toast.success("Gambar Kerja updated")
            setIsGkDialogOpen(false)
            setGkFile(null)
        },
        onError: () => {
            toast.error("Failed to update Gambar Kerja")
        }
    })

    const handleGkUpload = () => {
        if (!gkItem) return
        uploadGkMutation.mutate({
            file: gkFile || undefined,
            tanggal_mulai: gkStart || undefined,
            tanggal_selesai: gkEnd || undefined
        })
    }

    const openGkUpload = (item: ProjectItemV2) => {
        setGkItem(item)
        setGkStart(item.gambar_kerja?.tanggal_mulai || "")
        setGkEnd(item.gambar_kerja?.tanggal_selesai || "")
        setGkFile(null)
        setIsGkDialogOpen(true)
    }

    // Dokubah State
    const [isDokubahDialogOpen, setIsDokubahDialogOpen] = React.useState(false)
    const [dokubahItem, setDokubahItem] = React.useState<ProjectItemV2 | null>(null)
    const [dokubahFile, setDokubahFile] = React.useState<File | null>(null)
    const [dokubahStart, setDokubahStart] = React.useState<string>("")
    const [dokubahEnd, setDokubahEnd] = React.useState<string>("")

    const uploadDokubahMutation = useMutation({
        mutationFn: (payload: { file?: File; tanggal_mulai?: string; tanggal_selesai?: string }) =>
            projectV2Service.uploadDokubah(dokubahItem!.id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-v2-items", projectId] })
            toast.success("Dokubah updated")
            setIsDokubahDialogOpen(false)
            setDokubahFile(null)
        },
        onError: () => {
            toast.error("Failed to update Dokubah")
        }
    })

    const handleDokubahUpload = () => {
        if (!dokubahItem) return
        uploadDokubahMutation.mutate({
            file: dokubahFile || undefined,
            tanggal_mulai: dokubahStart || undefined,
            tanggal_selesai: dokubahEnd || undefined
        })
    }

    const openDokubahUpload = (item: ProjectItemV2) => {
        setDokubahItem(item)
        setDokubahStart(item.dokubah?.tanggal_mulai || "")
        setDokubahEnd(item.dokubah?.tanggal_selesai || "")
        setDokubahFile(null)
        setIsDokubahDialogOpen(true)
    }

    // Stok Material State
    const [isStokDialogOpen, setIsStokDialogOpen] = React.useState(false)
    const [stokItem, setStokItem] = React.useState<ProjectItemV2 | null>(null)
    const [stokMenerima, setStokMenerima] = React.useState<string>("")
    const [stokKeluar, setStokKeluar] = React.useState<string>("")
    const [stokPicId, setStokPicId] = React.useState<string>("")
    const [stokStatus, setStokStatus] = React.useState<string>("")

    const updateStokMutation = useMutation({
        mutationFn: (payload: { tanggal_menerima_dokubah?: string; tanggal_keluar?: string; pic_id?: number; ketersediaan_stok?: string }) => 
            projectV2Service.updateBahanBaku(stokItem!.id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-v2-items", projectId] })
            toast.success("Stok Material updated")
            setIsStokDialogOpen(false)
        },
        onError: () => {
            toast.error("Failed to update Stok Material")
        }
    })

    const handleStokUpdate = () => {
        if (!stokItem) return
        updateStokMutation.mutate({
            tanggal_menerima_dokubah: stokMenerima || undefined,
            tanggal_keluar: stokKeluar || undefined,
            pic_id: stokPicId ? parseInt(stokPicId) : undefined,
            ketersediaan_stok: stokStatus || undefined
        })
    }

    const openStokDialog = (item: ProjectItemV2) => {
        setStokItem(item)
        setStokMenerima(item.bahan_baku?.tanggal_menerima_dokubah || "")
        setStokKeluar(item.bahan_baku?.tanggal_keluar || "")
        setStokPicId(item.bahan_baku?.pic_id?.toString() || "")
        setStokStatus(item.bahan_baku?.ketersediaan_stok || "")
        setIsStokDialogOpen(true)
    }

    // Produksi State
    const [isProduksiDialogOpen, setIsProduksiDialogOpen] = React.useState(false)
    const [produksiItem, setProduksiItem] = React.useState<ProjectItemV2 | null>(null)
    const [produksiData, setProduksiData] = React.useState<Partial<Produksi>>({})

    const updateProduksiMutation = useMutation({
        mutationFn: (payload: any) => projectV2Service.updateProduksi(produksiItem!.id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-v2-items", projectId] })
            queryClient.invalidateQueries({ queryKey: ["projects-v2", projectId] })
            toast.success("Produksi updated")
            setIsProduksiDialogOpen(false)
        },
        onError: () => {
            toast.error("Failed to update Produksi")
        }
    })

    const handleProduksiUpdate = () => {
        if (!produksiItem) return
        updateProduksiMutation.mutate(produksiData)
    }

    const openProduksiDialog = (item: ProjectItemV2) => {
        setProduksiItem(item)
        setProduksiData(item.produksi || {
            jumlah_order: item.jumlah,
            cold_press: 0,
            running_saw: 0,
            edging: 0,
            cnc: 0,
            tukang_kayu: 0,
            tukang_jok: 0,
            finishing: 0,
            rakit: 0,
            quality_control: 0,
            packing: 0,
            persen: 0
        })
        setIsProduksiDialogOpen(true)
    }

    React.useEffect(() => {
        if (isProduksiDialogOpen && produksiData) {
            const fields = ['cold_press', 'running_saw', 'edging', 'cnc', 'tukang_kayu', 'tukang_jok', 'finishing', 'rakit', 'quality_control', 'packing'] as const;
            const totalSum = fields.reduce((sum, field) => sum + (Number(produksiData[field]) || 0), 0);
            const order = Number(produksiData.jumlah_order) || 1;
            const calculatedPersen = (totalSum * 10) / order;
            
            if (produksiData.persen !== calculatedPersen) {
                setProduksiData(prev => ({ ...prev, persen: calculatedPersen }));
            }
        }
    }, [
        produksiData.cold_press, 
        produksiData.running_saw, 
        produksiData.edging, 
        produksiData.cnc, 
        produksiData.tukang_kayu, 
        produksiData.tukang_jok, 
        produksiData.finishing, 
        produksiData.rakit, 
        produksiData.quality_control, 
        produksiData.packing,
        produksiData.jumlah_order,
        isProduksiDialogOpen
    ]);

    const [editingDivisiItemId, setEditingDivisiItemId] = React.useState<number | null>(null)

    const updateItemDivisiMutation = useMutation({
        mutationFn: ({ itemId, divisiId }: { itemId: number, divisiId: number }) => 
            projectV2Service.updateProjectItem(itemId, { divisi_id: divisiId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-v2-items", projectId] })
            toast.success("Division assigned successfully")
            setEditingDivisiItemId(null)
        },
        onError: () => {
            toast.error("Failed to assign division")
        }
    })

    React.useEffect(() => {
        if (project?.list_furnitur) {
            if (project.list_furnitur.tanggal_mulai) setLfStart(project.list_furnitur.tanggal_mulai)
            if (project.list_furnitur.tanggal_selesai) setLfEnd(project.list_furnitur.tanggal_selesai)
        }
    }, [project?.list_furnitur])

    if (isLoadingProject) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            </div>
        )
    }

    if (!project) {
        return <div className="p-8 text-center text-muted-foreground">Project not found.</div>
    }

    const existingSpd = project?.designs?.[0]

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Produksi Detail</h1>
                    <p className="text-sm text-muted-foreground">Produksi View - Project Items Management</p>
                </div>
            </div>

            {/* Project Info Card */}
            <Card className="border-none shadow-sm bg-gradient-to-br from-white to-neutral-50/50">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-neutral-500">
                        <FileText className="h-4 w-4 text-orange-500" />
                        Project Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                        <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground uppercase">Project Name</Label>
                            <p className="font-bold text-neutral-900">{project.name}</p>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground uppercase">Client</Label>
                            <p className="font-semibold text-neutral-800">{project.client?.name || "-"}</p>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground uppercase">SPK Number</Label>
                            <p className="text-neutral-700">{project.spk_number || project.spk?.nomor_spk || "-"}</p>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground uppercase">Deadline</Label>
                            <p className="font-bold text-orange-600">
                                {project.deadline ? format(new Date(project.deadline), "MMM d, yyyy") : "-"}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground uppercase">List Furnitur</Label>
                            <div className="pt-1">
                                {project?.list_furnitur?.file ? (
                                    <div className="p-2 rounded-lg border border-purple-100 bg-white flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded bg-purple-50 flex items-center justify-center text-purple-600">
                                                <FileText className="h-3 w-3" />
                                            </div>
                                            <span className="text-[10px] font-medium text-neutral-600 truncate max-w-[80px]">
                                                File
                                            </span>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-purple-600" asChild>
                                            <a 
                                                href={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('/api', '')}/storage/${project.list_furnitur.file}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                            >
                                                <Eye className="h-3 w-3" />
                                            </a>
                                        </Button>
                                    </div>
                                ) : "-"}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground uppercase">Persentase per SPK</Label>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 max-w-[100px]">
                                    <Progress 
                                        value={project.progres_produksi || 0} 
                                        className="h-2 bg-neutral-100" 
                                    />
                                </div>
                                <span className="text-sm font-bold text-neutral-900">
                                    {Number(project.progres_produksi || 0).toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Items Table Section */}
            <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <ListChecks className="h-5 w-5 text-neutral-400" />
                        Project Items
                    </h2>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader className="bg-neutral-50/80">
                            <TableRow>
                                <TableHead className="w-[50px]">#</TableHead>
                                <TableHead>Floor</TableHead>
                                <TableHead>Room</TableHead>
                                <TableHead>Item Name</TableHead>
                                <TableHead>Desc</TableHead>
                                <TableHead>Vol</TableHead>
                                <TableHead>Dimensions</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>Gambar Kerja</TableHead>
                                <TableHead>PO Divisi</TableHead>
                                <TableHead>Stok Material</TableHead>
                                <TableHead>Persentase Produksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingItems ? (
                                <TableRow>
                                    <TableCell colSpan={14} className="h-32 text-center text-muted-foreground">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : items?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={14} className="h-32 text-center text-muted-foreground">
                                        No items recorded for this project.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items?.map((item, index) => (
                                    <TableRow key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                                        <TableCell className="text-muted-foreground font-medium">{index + 1}</TableCell>
                                        <TableCell className="text-xs font-medium">{item.lantai || "-"}</TableCell>
                                        <TableCell className="text-xs max-w-[120px] truncate">{item.ruang || "-"}</TableCell>
                                        <TableCell className="font-bold text-neutral-800">{item.item}</TableCell>
                                        <TableCell className="max-w-[150px] truncate text-xs text-muted-foreground">{item.keterangan || "-"}</TableCell>
                                        <TableCell className="font-bold text-blue-600 text-xs">{item.volume || "-"}</TableCell>
                                        <TableCell className="text-[10px] text-muted-foreground">
                                            {item.panjang || "-"}x{item.lebar || "-"}x{item.tinggi || "-"} {item.satuan}
                                        </TableCell>
                                        <TableCell className="font-bold">{item.jumlah}</TableCell>
                                        <TableCell>
                                            {item.gambar_kerja?.file ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-600" asChild>
                                                        <a href={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('/api', '')}/storage/${item.gambar_kerja.file}`} target="_blank" rel="noopener noreferrer">
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </a>
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="h-7 text-[10px] border-orange-200 text-orange-600 hover:bg-orange-50"
                                                    onClick={() => openGkUpload(item)}
                                                >
                                                    <Upload className="h-3 w-3 mr-1" />
                                                    Upload
                                                </Button>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {item.divisi && editingDivisiItemId !== item.id ? (
                                                <div className="flex items-center gap-2 group">
                                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 font-bold">
                                                        {item.divisi.nama}
                                                    </Badge>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => setEditingDivisiItemId(item.id)}
                                                    >
                                                        <Pencil className="h-3 w-3 text-neutral-400" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <Select 
                                                        defaultValue={item.divisi_id?.toString()}
                                                        onValueChange={(val) => updateItemDivisiMutation.mutate({ itemId: item.id, divisiId: parseInt(val) })}
                                                    >
                                                        <SelectTrigger className="h-7 text-[10px] w-[100px] bg-white border-neutral-200">
                                                            <SelectValue placeholder="Pilih" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {divisions?.map(d => (
                                                                <SelectItem key={d.id} value={d.id.toString()}>{d.nama}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {editingDivisiItemId === item.id && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-6 w-6 text-neutral-400"
                                                            onClick={() => setEditingDivisiItemId(null)}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div 
                                                className="cursor-pointer hover:bg-neutral-100 p-1 rounded transition-colors"
                                                onClick={() => openStokDialog(item)}
                                            >
                                                {item.bahan_baku ? (
                                                    <div className="space-y-1">
                                                        <Badge variant="outline" className={`font-bold ${
                                                            item.bahan_baku.ketersediaan_stok === 'Tersedia' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                            item.bahan_baku.ketersediaan_stok === 'Belum Tersedia' ? 'bg-red-50 text-red-700 border-red-200' :
                                                            'bg-amber-50 text-amber-700 border-amber-200'
                                                        }`}>
                                                            {item.bahan_baku.ketersediaan_stok}
                                                        </Badge>
                                                        {item.bahan_baku.pic && (
                                                            <p className="text-[9px] text-muted-foreground">PIC: {item.bahan_baku.pic.nama}</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground italic">Set Stok</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div 
                                                className="cursor-pointer hover:bg-neutral-100 p-2 rounded-lg transition-colors group"
                                                onClick={() => openProduksiDialog(item)}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[10px] font-bold text-neutral-600">{Math.round(item.produksi?.persen || 0)}%</span>
                                                    <BarChart3 className="h-3 w-3 text-neutral-300 group-hover:text-orange-500" />
                                                </div>
                                                <Progress value={item.produksi?.persen || 0} className="h-1.5 bg-neutral-100" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <ProjectItemFormDialog 
                open={isItemFormOpen} 
                onOpenChange={setIsItemFormOpen} 
                projectId={projectId}
                item={selectedItem}
            />

            <AlertDialog open={isItemDeleteDialogOpen} onOpenChange={setIsItemDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Project Item</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{itemToDelete?.item}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => itemToDelete && deleteItemMutation.mutate(itemToDelete.id)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Gambar Kerja Upload Dialog */}
            <AlertDialog open={isGkDialogOpen} onOpenChange={setIsGkDialogOpen}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <ImageIcon className="h-5 w-5 text-orange-500" />
                            Upload Gambar Kerja
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Upload technical drawing for item: <strong>{gkItem?.item}</strong>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="gk-file">File Gambar (PDF/JPG/PNG)</Label>
                            <Input 
                                id="gk-file" 
                                type="file" 
                                onChange={e => setGkFile(e.target.files?.[0] || null)}
                                className="text-xs"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="gk-start">Mulai</Label>
                                <Input 
                                    id="gk-start" 
                                    type="date" 
                                    value={gkStart}
                                    onChange={e => setGkStart(e.target.value)}
                                    className="text-xs"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gk-end">Selesai</Label>
                                <Input 
                                    id="gk-end" 
                                    type="date" 
                                    value={gkEnd}
                                    onChange={e => setGkEnd(e.target.value)}
                                    className="text-xs"
                                />
                            </div>
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsGkDialogOpen(false)}>Cancel</AlertDialogCancel>
                        <Button 
                            className="bg-orange-600 hover:bg-orange-700"
                            onClick={handleGkUpload}
                            disabled={uploadGkMutation.isPending}
                        >
                            {uploadGkMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                            Save Gambar Kerja
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dokubah Upload Dialog */}
            <AlertDialog open={isDokubahDialogOpen} onOpenChange={setIsDokubahDialogOpen}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-500" />
                            Upload Dokubah
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Upload dokubah untuk item: <strong>{dokubahItem?.item}</strong>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="dokubah-file">File (PDF/JPG/PNG/XLS)</Label>
                            <Input
                                id="dokubah-file"
                                type="file"
                                onChange={e => setDokubahFile(e.target.files?.[0] || null)}
                                className="text-xs"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="dokubah-start">Mulai</Label>
                                <Input
                                    id="dokubah-start"
                                    type="date"
                                    value={dokubahStart}
                                    onChange={e => setDokubahStart(e.target.value)}
                                    className="text-xs"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dokubah-end">Selesai</Label>
                                <Input
                                    id="dokubah-end"
                                    type="date"
                                    value={dokubahEnd}
                                    onChange={e => setDokubahEnd(e.target.value)}
                                    className="text-xs"
                                />
                            </div>
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsDokubahDialogOpen(false)}>Cancel</AlertDialogCancel>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={handleDokubahUpload}
                            disabled={uploadDokubahMutation.isPending}
                        >
                            {uploadDokubahMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                            Save Dokubah
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Stok Material Dialog */}
            <AlertDialog open={isStokDialogOpen} onOpenChange={setIsStokDialogOpen}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-emerald-500" />
                            Update Stok Material
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Ketersediaan stok untuk item: <strong>{stokItem?.item}</strong>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Ketersediaan Stok</Label>
                            <Select value={stokStatus} onValueChange={setStokStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Tersedia">Tersedia</SelectItem>
                                    <SelectItem value="Belum Tersedia">Belum Tersedia</SelectItem>
                                    <SelectItem value="Mutasi">Mutasi</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tgl Menerima Dokubah</Label>
                                <Input 
                                    type="date" 
                                    value={stokMenerima} 
                                    onChange={e => setStokMenerima(e.target.value)} 
                                    className="text-xs"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tgl Keluar</Label>
                                <Input 
                                    type="date" 
                                    value={stokKeluar} 
                                    onChange={e => setStokKeluar(e.target.value)} 
                                    className="text-xs"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>PIC</Label>
                            <Select value={stokPicId} onValueChange={setStokPicId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih PIC" />
                                </SelectTrigger>
                                <SelectContent>
                                    {pics?.map(p => (
                                        <SelectItem key={p.id} value={p.id.toString()}>
                                            {p.nama} ({p.jabatan})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsStokDialogOpen(false)}>Cancel</AlertDialogCancel>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={handleStokUpdate}
                            disabled={updateStokMutation.isPending}
                        >
                            {updateStokMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                            Update Stok
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Produksi Update Dialog */}
            <AlertDialog open={isProduksiDialogOpen} onOpenChange={setIsProduksiDialogOpen}>
                <AlertDialogContent className="max-w-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-orange-500" />
                            Update Progress Produksi
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Input jumlah item yang telah selesai di setiap tahapan untuk: <strong>{produksiItem?.item}</strong>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4 space-y-6">
                        {/* Jumlah Order - Top Center */}
                        <div className="flex justify-center">
                            <div className="w-1/2 space-y-2 text-center">
                                <Label className="text-sm font-bold">Jumlah Order</Label>
                                <Input 
                                    type="number" 
                                    value={produksiData.jumlah_order || 0} 
                                    onChange={e => setProduksiData({...produksiData, jumlah_order: parseInt(e.target.value)})} 
                                    disabled
                                    className="bg-neutral-50 font-bold text-center text-lg h-12"
                                />
                            </div>
                        </div>

                        {/* Mesin Section */}
                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm text-neutral-500 uppercase tracking-wider border-b pb-2">Mesin</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Cold Press</Label>
                                    <Input 
                                        type="number" 
                                        value={produksiData.cold_press === 0 ? "" : (produksiData.cold_press || "")} 
                                        onChange={e => setProduksiData({...produksiData, cold_press: parseInt(e.target.value) || 0})} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Running Saw</Label>
                                    <Input 
                                        type="number" 
                                        value={produksiData.running_saw === 0 ? "" : (produksiData.running_saw || "")} 
                                        onChange={e => setProduksiData({...produksiData, running_saw: parseInt(e.target.value) || 0})} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Edging</Label>
                                    <Input 
                                        type="number" 
                                        value={produksiData.edging === 0 ? "" : (produksiData.edging || "")} 
                                        onChange={e => setProduksiData({...produksiData, edging: parseInt(e.target.value) || 0})} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>CNC</Label>
                                    <Input 
                                        type="number" 
                                        value={produksiData.cnc === 0 ? "" : (produksiData.cnc || "")} 
                                        onChange={e => setProduksiData({...produksiData, cnc: parseInt(e.target.value) || 0})} 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Manual Section */}
                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm text-neutral-500 uppercase tracking-wider border-b pb-2">Manual</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Tukang Kayu</Label>
                                    <Input 
                                        type="number" 
                                        value={produksiData.tukang_kayu === 0 ? "" : (produksiData.tukang_kayu || "")} 
                                        onChange={e => setProduksiData({...produksiData, tukang_kayu: parseInt(e.target.value) || 0})} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tukang Jok</Label>
                                    <Input 
                                        type="number" 
                                        value={produksiData.tukang_jok === 0 ? "" : (produksiData.tukang_jok || "")} 
                                        onChange={e => setProduksiData({...produksiData, tukang_jok: parseInt(e.target.value) || 0})} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Finishing</Label>
                                    <Input 
                                        type="number" 
                                        value={produksiData.finishing === 0 ? "" : (produksiData.finishing || "")} 
                                        onChange={e => setProduksiData({...produksiData, finishing: parseInt(e.target.value) || 0})} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Rakit</Label>
                                    <Input 
                                        type="number" 
                                        value={produksiData.rakit === 0 ? "" : (produksiData.rakit || "")} 
                                        onChange={e => setProduksiData({...produksiData, rakit: parseInt(e.target.value) || 0})} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Quality Control</Label>
                                    <Input 
                                        type="number" 
                                        value={produksiData.quality_control === 0 ? "" : (produksiData.quality_control || "")} 
                                        onChange={e => setProduksiData({...produksiData, quality_control: parseInt(e.target.value) || 0})} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Packing</Label>
                                    <Input 
                                        type="number" 
                                        value={produksiData.packing === 0 ? "" : (produksiData.packing || "")} 
                                        onChange={e => setProduksiData({...produksiData, packing: parseInt(e.target.value) || 0})} 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Persen Section */}
                        <div className="pt-2 border-t">
                            <div className="space-y-2 max-w-[200px] mx-auto text-center">
                                <Label className="text-sm font-bold">Persen (%)</Label>
                                <Input 
                                    type="text" 
                                    value={typeof produksiData.persen === 'number' ? produksiData.persen.toFixed(2) : (Number(produksiData.persen) || 0).toFixed(2)} 
                                    disabled
                                    className="bg-orange-50 font-bold text-orange-700 text-center text-lg h-12 disabled:opacity-100"
                                />
                            </div>
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsProduksiDialogOpen(false)}>Cancel</AlertDialogCancel>
                        <Button
                            className="bg-orange-600 hover:bg-orange-700"
                            onClick={handleProduksiUpdate}
                            disabled={updateProduksiMutation.isPending}
                        >
                            {updateProduksiMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                            Update Progress
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
