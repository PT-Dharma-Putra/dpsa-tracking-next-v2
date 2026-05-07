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
    Eye,
    ImageIcon,
    Upload,
    Package,
    ClipboardCheck,
    ChevronDown,
    Info,
    FileDown
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
import { Badge } from "@/components/ui/badge"

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

    const [isSpdCollapsed, setIsSpdCollapsed] = React.useState(true);
    const [isAccCollapsed, setIsAccCollapsed] = React.useState(true);
    const [isProgressCollapsed, setIsProgressCollapsed] = React.useState(true);
    const [isLfCollapsed, setIsLfCollapsed] = React.useState(true);

    const existingSpd = project?.designs?.[0];
    const existingAcc = existingSpd?.acc_design;
    const existingSph = project?.sph;
    const existingSpk = project?.spk;

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

    const flowSteps = [
        {
            id: 1,
            title: 'Upload SPD',
            description: project.need_design === 0 ? 'Not Required' : 'Surat Permintaan Desain',
            isCompleted: !!existingSpd?.spd_file,
            isActive: project.need_design !== 0,
            icon: FileText,
            color: 'text-orange-600',
            bgColor: 'bg-orange-500',
            lightBg: 'bg-orange-50',
            borderColor: 'border-orange-200',
        },
        {
            id: 2,
            title: 'ACC Design',
            description: project.need_design === 0 ? 'Not Required' : 'Approval Desain',
            isCompleted: existingAcc?.status === 'Approved',
            isActive: project.need_design !== 0 && !!existingSpd?.spd_file,
            icon: CheckCircle2,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-500',
            lightBg: 'bg-emerald-50',
            borderColor: 'border-emerald-200',
        },
        {
            id: 3,
            title: 'Upload SPH',
            description: 'Surat Penawaran Harga',
            isCompleted: !!existingSph?.file,
            isActive: project.need_design === 0 || existingAcc?.status === 'Approved',
            icon: FileText,
            color: 'text-blue-600',
            bgColor: 'bg-blue-500',
            lightBg: 'bg-blue-50',
            borderColor: 'border-blue-200',
        },
        {
            id: 4,
            title: 'Upload SPK',
            description: 'Surat Perintah Kerja',
            isCompleted: !!existingSpk?.file,
            isActive: !!existingSph?.file,
            icon: ClipboardCheck,
            color: 'text-purple-600',
            bgColor: 'bg-purple-500',
            lightBg: 'bg-purple-50',
            borderColor: 'border-purple-200',
        },
        {
            id: 5,
            title: 'Project Items',
            description: 'Add items',
            isCompleted: items && items.length > 0,
            isActive: !!existingSpk?.file,
            icon: Package,
            color: 'text-blue-600',
            bgColor: 'bg-blue-500',
            lightBg: 'bg-blue-50',
            borderColor: 'border-blue-200',
        },
    ];

    return (
        <div className='flex flex-col gap-6 p-6 max-w-[1600px] mx-auto w-full'>
            <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
                <div className='flex items-start gap-4 shrink-0'>
                    <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => router.back()}
                        className='rounded-full hover:bg-neutral-100 mt-0.5'
                    >
                        <ArrowLeft className='h-5 w-5' />
                    </Button>
                    <div className='space-y-1.5'>
                        <div>
                            <h1 className='text-2xl font-bold tracking-tight text-neutral-900'>
                                {project.name}
                            </h1>
                            <p className='text-xs text-muted-foreground'>Designer View - Design Progress Tracking</p>
                        </div>
                        <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
                            {project.client?.name && (
                                <span className='flex items-center gap-1 text-xs text-neutral-600'>
                                    <Building2 className='h-3 w-3 text-neutral-400' />
                                    {project.client.name}
                                </span>
                            )}
                            {(project.spk_number || project.spk?.nomor_spk) && (
                                <span className='flex items-center gap-1 text-xs text-neutral-600'>
                                    <FileText className='h-3 w-3 text-neutral-400' />
                                    {project.spk_number || project.spk?.nomor_spk}
                                </span>
                            )}
                            {project.deadline && (
                                <span className='flex items-center gap-1 text-xs text-neutral-600'>
                                    <Calendar className='h-3 w-3 text-neutral-400' />
                                    {format(new Date(project.deadline), 'MMM d, yyyy')}
                                </span>
                            )}
                            {project.need_design ? (
                                <span className='flex items-center gap-1 text-xs text-emerald-600'>
                                    <Info className='h-3 w-3 text-emerald-500' />
                                    Perlu Desain
                                </span>
                            ) : (
                                <span className='flex items-center gap-1 text-xs text-neutral-600'>
                                    <Info className='h-3 w-3 text-neutral-400' />
                                    Tidak Perlu Desain
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stepper Progress */}
                <div className='ml-auto overflow-x-auto hide-scrollbar shrink-0'>
                    <div className='flex items-center gap-1 min-w-max'>
                        {flowSteps.map((step, index) => {
                            const Icon = step.icon;
                            return (
                                <React.Fragment key={step.id}>
                                    <div
                                        className={`flex items-center gap-1.5 transition-all duration-300 ${
                                            step.isActive ? 'opacity-100' : 'opacity-40 grayscale'
                                        }`}
                                    >
                                        <div
                                            className={`h-6 w-6 rounded-full flex items-center justify-center border shadow-sm transition-all duration-500 shrink-0 ${
                                                step.isCompleted
                                                    ? step.bgColor + ' border-transparent text-white'
                                                    : step.isActive
                                                    ? step.lightBg +
                                                      ' ' +
                                                      step.borderColor +
                                                      ' ' +
                                                      step.color
                                                    : 'bg-neutral-100 border-neutral-200 text-neutral-400'
                                            }`}
                                        >
                                            {step.isCompleted ? (
                                                <CheckCircle2 className='h-3 w-3' />
                                            ) : (
                                                <Icon className='h-3 w-3' />
                                            )}
                                        </div>
                                        <div className='flex flex-col leading-none'>
                                            <span
                                                className={`text-[10px] font-bold whitespace-nowrap ${
                                                    step.isCompleted || step.isActive
                                                        ? 'text-neutral-800'
                                                        : 'text-neutral-400'
                                                }`}
                                            >
                                                {step.title}
                                            </span>
                                        </div>
                                    </div>
                                    {index < flowSteps.length - 1 && (
                                        <div className='w-6 h-[2px] rounded-full bg-neutral-200 overflow-hidden relative mx-0.5 shrink-0'>
                                            <div
                                                className={`absolute top-0 left-0 h-full w-full transition-transform duration-700 origin-left ${
                                                    step.isCompleted
                                                        ? step.bgColor + ' scale-x-100'
                                                        : 'scale-x-0'
                                                }`}
                                            />
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Document Section at Top */}
            <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full'>
                {/* 1. SPD SECTION */}
                <Card
                    className={`border shadow-sm transition-all duration-300 ${
                        flowSteps[0].isActive
                            ? flowSteps[0].isCompleted
                                ? 'border-orange-200 bg-white ring-1 ring-orange-100'
                                : 'border-orange-300 bg-white ring-2 ring-orange-500 ring-offset-2'
                            : 'border-neutral-200 bg-neutral-50/80 opacity-60 grayscale-[0.5]'
                    }`}
                >
                    <CardHeader className='pb-3 flex flex-row items-center justify-between gap-3'>
                        <button
                            className='flex items-center gap-3 flex-1 text-left'
                            onClick={() => setIsSpdCollapsed((v) => !v)}
                        >
                            <div
                                className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${
                                    flowSteps[0].isActive
                                        ? 'bg-orange-100 text-orange-600'
                                        : 'bg-neutral-200 text-neutral-500'
                                }`}
                            >
                                1
                            </div>
                            <div className='flex-1'>
                                <CardTitle className='text-base text-neutral-800'>
                                    SPD Document
                                </CardTitle>
                                <p className='text-[10px] text-muted-foreground uppercase tracking-wider'>
                                    Surat Permintaan Desain
                                </p>
                            </div>
                            <ChevronDown
                                className={`h-4 w-4 text-neutral-400 transition-transform duration-200 mr-1 ${
                                    isSpdCollapsed ? '-rotate-90' : ''
                                }`}
                            />
                        </button>
                    </CardHeader>
                    {!isSpdCollapsed && (
                        <CardContent>
                            {existingSpd?.spd_file ? (
                                <div className='p-3 rounded-xl bg-orange-50/80 border border-orange-100 flex items-center justify-between shadow-sm'>
                                    <div className='flex items-center gap-3'>
                                        <div className='h-8 w-8 rounded-lg bg-white shadow-sm border border-orange-100 flex items-center justify-center text-orange-600'>
                                            <FileText className='h-4 w-4' />
                                        </div>
                                        <div>
                                            <p className='text-xs font-bold text-orange-900'>
                                                SPD Document
                                            </p>
                                            <p className='text-[10px] text-orange-600/80'>
                                                {format(
                                                    new Date(
                                                        existingSpd.tanggal || existingSpd.created_at
                                                    ),
                                                    'MMM d, yyyy'
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant='ghost'
                                        size='icon'
                                        className='h-8 w-8 text-orange-600 hover:bg-orange-200 bg-white shadow-sm border border-orange-100'
                                        asChild
                                    >
                                        <a
                                            href={`${(
                                                process.env.NEXT_PUBLIC_API_URL ||
                                                'http://localhost:8000'
                                            ).replace('/api', '')}/storage/${existingSpd.spd_file}`}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                        >
                                            <FileDown className='h-4 w-4' />
                                        </a>
                                    </Button>
                                </div>
                            ) : (
                                <p className='text-xs text-muted-foreground italic'>
                                    Belum ada file SPD.
                                </p>
                            )}
                        </CardContent>
                    )}
                </Card>

                {/* 2. DESIGN PROGRESS SECTION (Replacing original Stage Tracking) */}
                <Card
                    className={`border shadow-sm transition-all duration-300 ${
                        designId
                            ? 'border-blue-200 bg-white ring-1 ring-blue-100'
                            : 'border-neutral-200 bg-neutral-50/80 opacity-60 grayscale-[0.5]'
                    }`}
                >
                    <CardHeader className='pb-3 flex flex-row items-center justify-between gap-3'>
                        <button
                            className='flex items-center gap-3 flex-1 text-left'
                            onClick={() => setIsProgressCollapsed((v) => !v)}
                        >
                            <div
                                className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${
                                    designId
                                        ? 'bg-blue-100 text-blue-600'
                                        : 'bg-neutral-200 text-neutral-500'
                                }`}
                            >
                                2
                            </div>
                            <div className='flex-1'>
                                <CardTitle className='text-base text-neutral-800'>
                                    Progres Desain
                                </CardTitle>
                                <p className='text-[10px] text-muted-foreground uppercase tracking-wider'>
                                    Stage Tracking
                                </p>
                            </div>
                            <ChevronDown
                                className={`h-4 w-4 text-neutral-400 transition-transform duration-200 mr-1 ${
                                    isProgressCollapsed ? '-rotate-90' : ''
                                }`}
                            />
                        </button>
                    </CardHeader>
                    {!isProgressCollapsed && (
                        <CardContent className="space-y-4">
                            {!designId ? (
                                <p className="text-xs text-muted-foreground italic">Create SPD to track progress.</p>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <div className="flex-1 space-y-1">
                                                <Label className="text-[10px] uppercase font-bold text-neutral-500">Stage</Label>
                                                <Select value={selectedStageId} onValueChange={setSelectedStageId}>
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue placeholder="Stage..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {stages?.map(s => (
                                                            <SelectItem key={s.id} value={s.id.toString()}>{s.nama}</SelectItem>
                                                        ))}
                                                        <div className="p-2 border-t mt-2">
                                                            <div className="flex gap-1">
                                                                <Input 
                                                                    placeholder="New..." 
                                                                    className="h-7 text-[10px]" 
                                                                    value={newStageName}
                                                                    onChange={e => setNewStageName(e.target.value)}
                                                                />
                                                                <Button size="icon" className="h-7 w-7" onClick={handleAddStage}>
                                                                    <Plus className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <Label className="text-[10px] uppercase font-bold text-neutral-500">Date</Label>
                                                <Input 
                                                    type="date" 
                                                    className="h-8 text-xs" 
                                                    value={completionDate}
                                                    onChange={e => setCompletionDate(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <Button 
                                            size="sm"
                                            className="w-full h-8 bg-blue-600 hover:bg-blue-700 text-xs"
                                            onClick={handleUpdateProgress}
                                            disabled={updateProgressMutation.isPending}
                                        >
                                            Update Progress
                                        </Button>
                                    </div>
                                    <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                        {progress?.map((p) => (
                                            <div key={p.id} className="flex items-center justify-between p-2 rounded-lg border border-neutral-100 bg-neutral-50/50">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                                    <div>
                                                        <p className="text-[10px] font-bold text-neutral-800">{p.tahap_design?.nama}</p>
                                                        <p className="text-[8px] text-muted-foreground">{p.tanggal_selesai ? format(new Date(p.tanggal_selesai), "MMM d, yy") : "-"}</p>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-5 w-5 text-neutral-400 hover:text-red-500" onClick={() => deleteProgressMutation.mutate(p.id)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    )}
                </Card>

                {/* 3. ACC DESIGN SECTION */}
                <Card
                    className={`border shadow-sm transition-all duration-300 ${
                        flowSteps[1].isActive
                            ? flowSteps[1].isCompleted
                                ? 'border-emerald-200 bg-white ring-1 ring-emerald-100'
                                : 'border-emerald-300 bg-white ring-2 ring-emerald-500 ring-offset-2'
                            : 'border-neutral-200 bg-neutral-50/80 opacity-60 grayscale-[0.5]'
                    }`}
                >
                    <CardHeader className='pb-3 flex flex-row items-center justify-between gap-3'>
                        <button
                            className='flex items-center gap-3 flex-1 text-left'
                            onClick={() => setIsAccCollapsed((v) => !v)}
                        >
                            <div
                                className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${
                                    flowSteps[1].isActive
                                        ? 'bg-emerald-100 text-emerald-600'
                                        : 'bg-neutral-200 text-neutral-500'
                                }`}
                            >
                                3
                            </div>
                            <div className='flex-1'>
                                <CardTitle className='text-base text-neutral-800'>
                                    ACC Design
                                </CardTitle>
                                <p className='text-[10px] text-muted-foreground uppercase tracking-wider'>
                                    Approval Status
                                </p>
                            </div>
                            <ChevronDown
                                className={`h-4 w-4 text-neutral-400 transition-transform duration-200 mr-1 ${
                                    isAccCollapsed ? '-rotate-90' : ''
                                }`}
                            />
                        </button>
                    </CardHeader>
                    {!isAccCollapsed && (
                        <CardContent>
                            {existingAcc ? (
                                <div className='space-y-2'>
                                    <div
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                            existingAcc.status === 'Approved'
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                                        }`}
                                    >
                                        <CheckCircle2 className='h-3 w-3' />
                                        {existingAcc.status}
                                    </div>
                                    {existingAcc.tanggal_kirim && (
                                        <p className='text-[10px] text-muted-foreground'>
                                            Kirim:{' '}
                                            {format(
                                                new Date(existingAcc.tanggal_kirim),
                                                'MMM d, yyyy'
                                            )}
                                        </p>
                                    )}
                                    {existingAcc.tanggal_acc && (
                                        <p className='text-[10px] text-muted-foreground'>
                                            ACC:{' '}
                                            {format(
                                                new Date(existingAcc.tanggal_acc),
                                                'MMM d, yyyy'
                                            )}
                                        </p>
                                    )}
                                    {existingAcc.bukti_acc && (
                                        <a
                                            href={`${(
                                                process.env.NEXT_PUBLIC_API_URL ||
                                                'http://localhost:8000'
                                            ).replace('/api', '')}/storage/${
                                                existingAcc.bukti_acc
                                            }`}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            className='text-[10px] text-emerald-600 hover:underline flex items-center gap-1'
                                        >
                                            <FileDown className='h-3 w-3' />
                                            Bukti ACC
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <p className='text-xs text-muted-foreground italic'>
                                    Belum ada data ACC.
                                </p>
                            )}
                        </CardContent>
                    )}
                </Card>

                {/* 4. LIST FURNITUR SECTION */}
                <Card
                    className={`border shadow-sm transition-all duration-300 ${
                        project.list_furnitur
                            ? 'border-purple-200 bg-white ring-1 ring-purple-100'
                            : 'border-neutral-200 bg-neutral-50/80 opacity-60 grayscale-[0.5]'
                    }`}
                >
                    <CardHeader className='pb-3 flex flex-row items-center justify-between gap-3'>
                        <button
                            className='flex items-center gap-3 flex-1 text-left'
                            onClick={() => setIsLfCollapsed((v) => !v)}
                        >
                            <div
                                className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${
                                    project.list_furnitur
                                        ? 'bg-purple-100 text-purple-600'
                                        : 'bg-neutral-200 text-neutral-500'
                                }`}
                            >
                                4
                            </div>
                            <div className='flex-1'>
                                <CardTitle className='text-base text-neutral-800'>
                                    List Furnitur
                                </CardTitle>
                                <p className='text-[10px] text-muted-foreground uppercase tracking-wider'>
                                    Item Specifications
                                </p>
                            </div>
                            <ChevronDown
                                className={`h-4 w-4 text-neutral-400 transition-transform duration-200 mr-1 ${
                                    isLfCollapsed ? '-rotate-90' : ''
                                }`}
                            />
                        </button>
                    </CardHeader>
                    {!isLfCollapsed && (
                        <CardContent className="space-y-3">
                            <div className="space-y-2">
                                <Input 
                                    type="file" 
                                    className="h-8 text-[10px] bg-neutral-50" 
                                    onChange={e => setLfFile(e.target.files?.[0] || null)}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-[8px] uppercase text-neutral-500">Mulai</Label>
                                        <Input type="date" className="h-7 text-[10px]" value={lfStart} onChange={e => setLfStart(e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[8px] uppercase text-neutral-500">Selesai</Label>
                                        <Input type="date" className="h-7 text-[10px]" value={lfEnd} onChange={e => setLfEnd(e.target.value)} />
                                    </div>
                                </div>
                                <Button 
                                    size="sm" 
                                    className="w-full h-8 bg-purple-600 hover:bg-purple-700 text-xs"
                                    onClick={handleLfUpload}
                                    disabled={uploadLfMutation.isPending}
                                >
                                    Save List Furnitur
                                </Button>
                            </div>
                            {project.list_furnitur?.file && (
                                <div className="flex items-center justify-between p-2 rounded-lg bg-purple-50/50 border border-purple-100 mt-2">
                                    <span className="text-[10px] font-medium text-purple-700">File Uploaded</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-purple-600" asChild>
                                        <a href={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('/api', '')}/storage/${project.list_furnitur.file}`} target="_blank" rel="noopener noreferrer">
                                            <FileDown className="h-3.5 w-3.5" />
                                        </a>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    )}
                </Card>
            </div>

            {/* Items Table Section */}
            <div className='flex flex-col gap-4'>
                <div className='flex items-center justify-between'>
                    <h2 className='text-lg font-bold flex items-center gap-2 text-neutral-800'>
                        <Package className='h-5 w-5 text-neutral-400' />
                        Project Items
                    </h2>
                </div>

                <div className='rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm'>
                    <Table>
                        <TableHeader className='bg-neutral-50/80'>
                            <TableRow>
                                <TableHead className='w-[50px]'>#</TableHead>
                                <TableHead>Floor</TableHead>
                                <TableHead>Room</TableHead>
                                <TableHead>Item Name</TableHead>
                                <TableHead>Desc</TableHead>
                                <TableHead>Vol</TableHead>
                                <TableHead>Dimensions</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>PO Divisi</TableHead>
                                <TableHead className='text-right'>Gambar Kerja</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingItems ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={10}
                                        className='h-32 text-center text-muted-foreground'
                                    >
                                        <Loader2 className='h-6 w-6 animate-spin mx-auto' />
                                    </TableCell>
                                </TableRow>
                            ) : items?.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={10}
                                        className='h-32 text-center text-muted-foreground'
                                    >
                                        No items recorded for this project.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items?.map((item, index) => (
                                    <TableRow
                                        key={item.id}
                                        className='hover:bg-neutral-50/50 transition-colors'
                                    >
                                        <TableCell className='text-muted-foreground font-medium'>
                                            {index + 1}
                                        </TableCell>
                                        <TableCell className='text-xs font-medium'>
                                            {item.lantai || '-'}
                                        </TableCell>
                                        <TableCell className='text-xs max-w-[120px] truncate'>
                                            {item.ruang || '-'}
                                        </TableCell>
                                        <TableCell className='font-bold text-neutral-800'>
                                            {item.item}
                                        </TableCell>
                                        <TableCell className='max-w-[150px] truncate text-[10px] text-muted-foreground'>
                                            {item.keterangan || '-'}
                                        </TableCell>
                                        <TableCell className='font-bold text-blue-600 text-xs'>
                                            {item.volume || '-'}
                                        </TableCell>
                                        <TableCell className='text-[10px] text-muted-foreground whitespace-nowrap'>
                                            {item.panjang || '-'}x{item.lebar || '-'}x
                                            {item.tinggi || '-'} {item.satuan}
                                        </TableCell>
                                        <TableCell className='font-bold text-neutral-900'>
                                            {item.jumlah}
                                        </TableCell>
                                        <TableCell>
                                            {item.divisi ? (
                                                <Badge
                                                    variant='outline'
                                                    className='bg-purple-50 text-purple-700 border-purple-200 text-[10px] h-5'
                                                >
                                                    {item.divisi.nama}
                                                </Badge>
                                            ) : (
                                                <span className='text-[10px] text-muted-foreground italic'>
                                                    -
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className='text-right'>
                                            {item.gambar_kerja?.file ? (
                                                <div className='flex items-center justify-end gap-2'>
                                                    <div className='h-6 w-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm'>
                                                        <CheckCircle2 className='h-3.5 w-3.5' />
                                                    </div>
                                                    <Button
                                                        variant='ghost'
                                                        size='icon'
                                                        className='h-7 w-7 text-blue-600 hover:bg-blue-50'
                                                        asChild
                                                    >
                                                        <a
                                                            href={`${(
                                                                process.env.NEXT_PUBLIC_API_URL ||
                                                                'http://localhost:8000'
                                                            ).replace('/api', '')}/storage/${
                                                                item.gambar_kerja.file
                                                            }`}
                                                            target='_blank'
                                                            rel='noopener noreferrer'
                                                        >
                                                            <Eye className='h-3.5 w-3.5' />
                                                        </a>
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant='outline'
                                                    size='sm'
                                                    className='h-7 text-[10px] border-orange-200 text-orange-600 hover:bg-orange-50'
                                                    onClick={() => openGkUpload(item)}
                                                >
                                                    <Upload className='h-3 w-3 mr-1' />
                                                    Upload
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Same Item Form Dialog as before */}
            <ProjectItemFormDialog 
                open={isItemFormOpen} 
                onOpenChange={setIsItemFormOpen} 
                projectId={projectId}
                item={selectedItem}
            />

            {/* Same Delete Dialog as before */}
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
        </div>
    )
}
