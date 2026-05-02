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
    Building2,
    User,
    Calendar,
    FileText,
    Activity,
    ListChecks,
    CheckCircle2,
    Clock,
    Eye
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

import { projectV2Service, ProjectItemV2, TahapDesign, DesignProgres } from "@/features/projects/services/project-v2-service"
import { ProjectItemFormDialog } from "../../../_components/project-item-form-dialog"

export default function DesignerDetailPage() {
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
                    <h1 className="text-2xl font-bold tracking-tight">Perintah Kerja Detail</h1>
                    <p className="text-sm text-muted-foreground">Designer View - Design Progress Tracking</p>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                            <p className="text-neutral-700">{project.spk_number || "-"}</p>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground uppercase">Deadline</Label>
                            <p className="font-bold text-orange-600">
                                {project.deadline ? format(new Date(project.deadline), "MMM d, yyyy") : "-"}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Designer Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* SPD Date Card */}
                <Card className="border-none shadow-sm border border-neutral-100 overflow-hidden">
                    <CardHeader className="bg-orange-50/50 border-b border-orange-100">
                        <CardTitle className="flex items-center gap-2 text-orange-800 text-base">
                            <Calendar className="h-5 w-5" />
                            Tanggal SPD Dibuat
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {existingSpd ? (
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-orange-50 border border-orange-100">
                                <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-orange-600 shadow-sm">
                                    <Clock className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-orange-900">SPD Created On</p>
                                    <p className="text-2xl font-bold text-orange-700">
                                        {existingSpd.tanggal ? format(new Date(existingSpd.tanggal), "MMMM d, yyyy") : format(new Date(existingSpd.created_at), "MMMM d, yyyy")}
                                    </p>
                                </div>
                                {existingSpd.spd_file && (
                                    <Button variant="outline" className="ml-auto bg-white border-orange-200 text-orange-600 hover:bg-orange-50" asChild>
                                        <a 
                                            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/storage/${existingSpd.spd_file}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            View File
                                        </a>
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                                <p className="text-sm text-muted-foreground">SPD has not been created for this project.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Design Progress Card */}
                <Card className="border-none shadow-sm border border-neutral-100 flex flex-col">
                    <CardHeader className="bg-blue-50/50 border-b border-blue-100">
                        <CardTitle className="flex items-center justify-between text-blue-800 text-base">
                            <div className="flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                Progres Desain
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 flex-1 flex flex-col gap-4">
                        {!designId ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                Please create a design (SPD) first to track progress.
                            </div>
                        ) : (
                            <>
                                {/* Form to add progress */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-blue-600 font-bold">Select Stage</Label>
                                        <Select value={selectedStageId} onValueChange={setSelectedStageId}>
                                            <SelectTrigger className="bg-white">
                                                <SelectValue placeholder="Stage..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {stages?.map(s => (
                                                    <SelectItem key={s.id} value={s.id.toString()}>{s.nama}</SelectItem>
                                                ))}
                                                <div className="p-2 border-t mt-2">
                                                    <div className="flex gap-2">
                                                        <Input 
                                                            placeholder="New stage..." 
                                                            className="h-8 text-xs" 
                                                            value={newStageName}
                                                            onChange={e => setNewStageName(e.target.value)}
                                                        />
                                                        <Button size="icon" className="h-8 w-8" onClick={handleAddStage}>
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-blue-600 font-bold">Completion Date</Label>
                                        <Input 
                                            type="date" 
                                            className="bg-white" 
                                            value={completionDate}
                                            onChange={e => setCompletionDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <Button 
                                            className="w-full bg-blue-600 hover:bg-blue-700"
                                            onClick={handleUpdateProgress}
                                            disabled={updateProgressMutation.isPending}
                                        >
                                            {updateProgressMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Set Progress"}
                                        </Button>
                                    </div>
                                </div>

                                {/* Progress List */}
                                <div className="space-y-3 mt-2">
                                    {progress && progress.length > 0 ? (
                                        progress.map((p) => (
                                            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-neutral-100 bg-white shadow-sm hover:border-blue-200 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                                        <CheckCircle2 className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-neutral-800">{p.tahap_design?.nama}</p>
                                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            Completed: {p.tanggal_selesai ? format(new Date(p.tanggal_selesai), "MMM d, yyyy") : "Not set"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-neutral-400 hover:text-red-500"
                                                    onClick={() => deleteProgressMutation.mutate(p.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-6 border-2 border-dashed rounded-xl border-neutral-100">
                                            <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
                                                <ListChecks className="h-4 w-4" /> No progress recorded yet
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* List Furnitur Card */}
                <Card className="border-none shadow-sm border border-neutral-100 flex flex-col">
                    <CardHeader className="bg-purple-50/50 border-b border-purple-100">
                        <CardTitle className="flex items-center gap-2 text-purple-800 text-base">
                            <ListChecks className="h-5 w-5" />
                            List Furnitur
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase text-purple-600 font-bold">Upload File (PDF/XLS)</Label>
                                <Input 
                                    type="file" 
                                    className="bg-white text-xs" 
                                    onChange={e => setLfFile(e.target.files?.[0] || null)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase text-purple-600 font-bold">Mulai</Label>
                                    <Input 
                                        type="date" 
                                        className="bg-white text-xs" 
                                        value={lfStart}
                                        onChange={e => setLfStart(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase text-purple-600 font-bold">Selesai</Label>
                                    <Input 
                                        type="date" 
                                        className="bg-white text-xs" 
                                        value={lfEnd}
                                        onChange={e => setLfEnd(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button 
                                className="w-full bg-purple-600 hover:bg-purple-700"
                                onClick={handleLfUpload}
                                disabled={uploadLfMutation.isPending}
                            >
                                {uploadLfMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save List Furnitur"}
                            </Button>
                        </div>

                        {project?.list_furnitur?.file && (
                            <div className="p-3 rounded-lg border border-purple-100 bg-white flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-medium text-neutral-600 truncate max-w-[120px]">
                                        List Furnitur File
                                    </span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-600" asChild>
                                    <a 
                                        href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/storage/${project.list_furnitur.file}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </a>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Items Table Section */}
            <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <ListChecks className="h-5 w-5 text-neutral-400" />
                        Project Items
                    </h2>
                    <Button onClick={() => setIsItemFormOpen(true)} className="bg-orange-600 hover:bg-orange-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Item
                    </Button>
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
                                <TableHead className="w-[80px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingItems ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : items?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
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
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-neutral-100">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-[160px]">
                                                    <DropdownMenuItem onClick={() => { setSelectedItem(item); setIsItemFormOpen(true); }}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem 
                                                        className="text-red-600 focus:text-red-600"
                                                        onClick={() => { setItemToDelete(item); setIsItemDeleteDialogOpen(true); }}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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
        </div>
    )
}
