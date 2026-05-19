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
    FileDown,
    Check,
    ChevronsUpDown
} from "lucide-react"
import { format, differenceInDays } from "date-fns"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
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

export default function EngineerDetailPage() {
    const params = useParams()
    const router = useRouter()
    const queryClient = useQueryClient()
    const projectId = parseInt(params.id as string)

    const [isItemFormOpen, setIsItemFormOpen] = React.useState(false)
    const [selectedItem, setSelectedItem] = React.useState<ProjectItemV2 | null>(null)
    const [isItemDeleteDialogOpen, setIsItemDeleteDialogOpen] = React.useState(false)
    const [itemToDelete, setItemToDelete] = React.useState<ProjectItemV2 | null>(null)
    const [openPicPopover, setOpenPicPopover] = React.useState<number | null>(null)

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

    const { data: designers } = useQuery({
        queryKey: ["designers"],
        queryFn: () => projectV2Service.getDesigners(),
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
        mutationFn: (payload: { 
            tahap_design_id: number, 
            tanggal_mulai?: string | null,
            tanggal_selesai?: string | null,
            catatan?: string | null,
            file?: File | null
        }) => projectV2Service.updateDesignProgress(designId!, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects-v2", projectId] })
            queryClient.invalidateQueries({ queryKey: ["design-progress", designId] })
            toast.success("Progress updated")
            setProgressFile(null)
            setProgressNote("")
        }
    })

    const deleteProgressMutation = useMutation({
        mutationFn: (id: number) => projectV2Service.deleteDesignProgress(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects-v2", projectId] })
            queryClient.invalidateQueries({ queryKey: ["design-progress", designId] })
            toast.success("Progress milestone removed")
        }
    })

    const updatePicMutation = useMutation({
        mutationFn: ({ itemId, picId }: { itemId: number, picId: number }) => 
            projectV2Service.updateProjectItemPic(itemId, picId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-v2-items", projectId] })
            toast.success("PIC updated")
            setOpenPicPopover(null)
        },
        onError: () => {
            toast.error("Failed to update PIC")
        }
    })

    // Local States for Progress Form
    const [newStageName, setNewStageName] = React.useState("")
    const [selectedStageId, setSelectedStageId] = React.useState<string>("")
    const [startDate, setStartDate] = React.useState<string>(format(new Date(), "yyyy-MM-dd"))
    const [completionDate, setCompletionDate] = React.useState<string>(format(new Date(), "yyyy-MM-dd"))
    const [progressNote, setProgressNote] = React.useState<string>("")
    const [progressFile, setProgressFile] = React.useState<File | null>(null)

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
            tanggal_mulai: startDate || null,
            tanggal_selesai: completionDate || null,
            catatan: progressNote || null,
            file: progressFile || null
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
    const [gkFile, setGkFile] = React.useState<File | string | null>(null)
    const [gkStart, setGkStart] = React.useState<string>("")
    const [gkEnd, setGkEnd] = React.useState<string>("")

    const uploadGkMutation = useMutation({
        mutationFn: (payload: { file?: File | string; tanggal_mulai?: string; tanggal_selesai?: string }) => 
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
        setGkFile(item.gambar_kerja?.file || null)
        setIsGkDialogOpen(true)
    }

    const [isSpdCollapsed, setIsSpdCollapsed] = React.useState(true);
    const [isAccCollapsed, setIsAccCollapsed] = React.useState(true);
    const [isProgressCollapsed, setIsProgressCollapsed] = React.useState(true);
    const [isLfCollapsed, setIsLfCollapsed] = React.useState(true);

    const orderGk = project?.order_gambar_kerja?.[0];
    const existingSpd = project?.designs?.[0];
    const existingAcc = existingSpd?.acc_design;
    const hasProgress = (existingSpd?.design_progres?.length || 0) > 0;
    
    const totalItems = items?.length || 0;
    const gambarKerjaCount = items?.filter((item) => 
        item.gambar_kerja?.file || item.mdl_item?.link_gambar_kerja
    ).length || 0;

    React.useEffect(() => {
        if (project?.list_furnitur) {
            if (project.list_furnitur.tanggal_mulai) setLfStart(project.list_furnitur.tanggal_mulai)
            if (project.list_furnitur.tanggal_selesai) setLfEnd(project.list_furnitur.tanggal_selesai)
        }
    }, [project?.list_furnitur])

    React.useEffect(() => {
        if (orderGk?.file) {
            setIsProgressCollapsed(false);
            setIsSpdCollapsed(true);
        } else {
            setIsProgressCollapsed(true);
            setIsSpdCollapsed(false);
        }
    }, [orderGk?.file]);

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
            title: 'Order Gambar Kerja',
            description: 'Engineering Order',
            isCompleted: !!orderGk?.file,
            isActive: true,
            icon: FileText,
            color: 'text-orange-600',
            bgColor: 'bg-orange-500',
            lightBg: 'bg-orange-50',
            borderColor: 'border-orange-200',
        },
        {
            id: 2,
            title: 'Gambar Kerja',
            description: 'Technical Drawings',
            isCompleted: hasProgress,
            isActive: !!orderGk?.file,
            icon: ImageIcon,
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
                            <p className='text-xs text-muted-foreground'>Engineer View - Design Progress Tracking</p>
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
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 w-full'>
                {/* 1. ORDER GAMBAR KERJA SECTION */}
                <Card
                    className={`relative border shadow-sm transition-all duration-300 ${
                        flowSteps[0].isActive
                            ? flowSteps[0].isCompleted
                                ? 'border-orange-200 bg-white ring-1 ring-orange-100'
                                : 'border-orange-300 bg-white ring-2 ring-orange-500 ring-offset-2'
                            : 'border-neutral-200 bg-neutral-50/80 opacity-60 grayscale-[0.5]'
                    }`}
                >
                    {orderGk?.file && (
                        <div className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm z-10 animate-in zoom-in duration-300">
                            <CheckCircle2 className="h-3 w-3 text-white" />
                        </div>
                    )}
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
                                    Order Gambar Kerja
                                </CardTitle>
                                <p className='text-[10px] text-muted-foreground uppercase tracking-wider'>
                                    Engineering Order
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
                            {orderGk?.file ? (
                                <div className='p-3 rounded-xl bg-orange-50/80 border border-orange-100 flex items-center justify-between shadow-sm'>
                                    <div className='flex items-center gap-3'>
                                        <div className='h-8 w-8 rounded-lg bg-white shadow-sm border border-orange-100 flex items-center justify-center text-orange-600'>
                                            <FileText className='h-4 w-4' />
                                        </div>
                                        <div>
                                            <p className='text-xs font-bold text-orange-900'>
                                                Order Drawing
                                            </p>
                                            <p className='text-[10px] text-orange-600/80'>
                                                Target:{" "}
                                                {format(
                                                    new Date(orderGk.created_at),
                                                    'MMM d, yyyy'
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className='flex items-center gap-2'>
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
                                                ).replace('/api', '')}/storage/${orderGk.file}`}
                                                target='_blank'
                                                rel='noopener noreferrer'
                                            >
                                                <FileDown className='h-4 w-4' />
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <p className='text-xs text-muted-foreground italic'>
                                    Belum ada Order Gambar Kerja.
                                </p>
                            )}
                        </CardContent>
                    )}
                </Card>

                {/* 2. DESIGN PROGRESS SECTION */}
                <Card
                    className={`relative border shadow-sm transition-all duration-300 ${
                        gambarKerjaCount === totalItems && totalItems > 0
                            ? 'border-emerald-200 bg-white ring-1 ring-emerald-100'
                            : designId
                            ? 'border-blue-200 bg-white ring-1 ring-blue-100'
                            : 'border-neutral-200 bg-neutral-50/80 opacity-60 grayscale-[0.5]'
                    }`}
                >
                    {gambarKerjaCount === totalItems && totalItems > 0 && (
                        <div className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm z-10 animate-in zoom-in duration-300">
                            <CheckCircle2 className="h-3 w-3 text-white" />
                        </div>
                    )}
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
                                    Gambar Kerja
                                </CardTitle>
                                <p className='text-[10px] text-muted-foreground uppercase tracking-wider'>
                                    Technical Drawings
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
                        <CardContent className='pt-0'>
                             <div className='h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden mt-4'>
                                <div className='h-full bg-orange-500 transition-all duration-500' style={{ width: `${totalItems ? (gambarKerjaCount / totalItems) * 100 : 0}%` }} />
                            </div>
                            <div className='flex justify-between items-center mt-1'>
                                <p className='text-[10px] font-bold text-neutral-700'>{gambarKerjaCount} / {totalItems} Drawings Uploaded</p>
                                <p className='text-[10px] font-bold text-orange-600'>{Math.round(totalItems ? (gambarKerjaCount / totalItems) * 100 : 0)}%</p>
                            </div>
                            
                            <div className='pt-2 space-y-2 border-t border-neutral-100 mt-2'>
                                {project.order_gambar_kerja && project.order_gambar_kerja.length > 0 ? (
                                    <div className='space-y-1.5 max-h-[120px] overflow-y-auto pr-1'>
                                        {project.order_gambar_kerja.map((order, idx) => (
                                            <div key={idx} className='flex flex-col gap-1.5 bg-neutral-50 p-2 rounded border border-neutral-100'>
                                                <div className='flex items-center justify-between'>
                                                    <div className='flex items-center gap-2'>
                                                        <span className='font-bold text-[10px] text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded'>
                                                            Target: {order.target_selesai ? format(new Date(order.target_selesai), 'dd MMM yyyy') : '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className='text-[9px] text-muted-foreground italic text-center py-1'>No orders yet</p>
                                )}
                            </div>
                        </CardContent>
                    )}
                </Card>
            </div>

            {/* Items Table */}
            <Card className='border shadow-sm overflow-hidden'>
                <CardHeader className='pb-0 flex flex-row items-center justify-between bg-neutral-50/50 border-b'>
                    <div className='py-4 px-2'>
                        <CardTitle className='text-lg font-bold text-neutral-800 flex items-center gap-2'>
                            <Package className='h-5 w-5 text-orange-500' />
                            Project Items
                        </CardTitle>
                        <p className='text-xs text-muted-foreground'>Manage items and technical drawings</p>
                    </div>
                </CardHeader>
                <CardContent className='p-0'>
                    <div className='overflow-x-auto'>
                        <Table>
                            <TableHeader className='bg-neutral-50/50'>
                                <TableRow>
                                    <TableHead className='w-[60px] text-center'>#</TableHead>
                                    <TableHead>Kode Barang</TableHead>
                                    <TableHead>Item Name</TableHead>
                                    <TableHead>Location / Floor</TableHead>
                                    <TableHead className='text-center'>Ukuran</TableHead>
                                    <TableHead className='text-center'>Volume</TableHead>
                                    <TableHead className='text-center'>Qty</TableHead>
                                    <TableHead>PO Divisi</TableHead>
                                    <TableHead className='text-center'>PIC</TableHead>
                                    <TableHead>Submit</TableHead>
                                    <TableHead>Tepat Waktu</TableHead>
                                    <TableHead>GK MDL</TableHead>
                                    <TableHead>Gambar Kerja</TableHead>
                                    <TableHead>Timeline Drawing</TableHead>
                                    <TableHead className='text-right'>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingItems ? (
                                    <TableRow>
                                        <TableCell colSpan={18} className='h-32 text-center'>
                                            <Loader2 className='h-6 w-6 animate-spin mx-auto text-neutral-300' />
                                        </TableCell>
                                    </TableRow>
                                ) : items?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={18} className='h-32 text-center text-muted-foreground italic'>
                                            No items added to this project yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items?.map((item, index) => (
                                        <TableRow key={item.id} className='group hover:bg-neutral-50/50 transition-colors'>
                                            <TableCell className='text-center font-medium text-neutral-400'>{index + 1}</TableCell>
                                            <TableCell className='text-xs text-neutral-500 font-mono'>
                                                {item.mdl_item?.kode_barang || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <div className='flex flex-col'>
                                                    <div className='flex items-center gap-2'>
                                                        <span className='font-bold text-neutral-900'>{item.item}</span>
                                                        {item.custom && (
                                                            <Badge variant='destructive' className='text-[8px] h-3.5 px-1 font-bold uppercase'>Custom</Badge>
                                                        )}
                                                    </div>
                                                    <span className='text-[10px] text-muted-foreground uppercase tracking-tight'>{item.material_utama}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className='flex flex-col gap-0.5'>
                                                    <span className='text-xs text-neutral-700'>{item.lokasi || '-'}</span>
                                                    {item.lantai && (
                                                        <Badge variant='secondary' className='w-fit text-[9px] h-4 px-1.5 font-normal bg-neutral-100'>
                                                            Floor {item.lantai}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className='text-center text-[10px] tabular-nums text-neutral-600'>
                                                {item.panjang || 0}x{item.lebar || 0}x{item.tinggi || 0}
                                            </TableCell>
                                            <TableCell className='text-center text-[10px] tabular-nums text-neutral-600'>
                                                {item.volume || 0}
                                            </TableCell>
                                            <TableCell className='text-center'>
                                                <Badge variant='outline' className='font-bold tabular-nums'>
                                                    {item.jumlah} {item.satuan}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {item.divisi ? (
                                                    <Badge variant='outline' className='bg-purple-50 text-purple-700 border-purple-200 text-[10px] h-5'>
                                                        {item.divisi.nama}
                                                    </Badge>
                                                ) : (
                                                    <span className='text-[10px] text-muted-foreground italic'>-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Popover 
                                                    open={openPicPopover === item.id} 
                                                    onOpenChange={(open) => setOpenPicPopover(open ? item.id : null)}
                                                >
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className={cn(
                                                                "h-8 justify-start text-left font-normal px-2 hover:bg-neutral-100",
                                                                !item.pic_engineer && "text-muted-foreground italic"
                                                            )}
                                                        >
                                                            <User className="mr-2 h-3 w-3 text-neutral-400" />
                                                            <span className="truncate max-w-[100px]">
                                                                {item.pic_engineer?.name || "Set PIC..."}
                                                            </span>
                                                            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[200px] p-0" align="start">
                                                        <Command>
                                                            <CommandInput placeholder="Search engineer..." />
                                                            <CommandList>
                                                                <CommandEmpty>No engineer found.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {designers?.map((designer) => (
                                                                        <CommandItem
                                                                            key={designer.id}
                                                                            value={designer.name}
                                                                            onSelect={() => {
                                                                                updatePicMutation.mutate({ 
                                                                                    itemId: item.id, 
                                                                                    picId: designer.id 
                                                                                })
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    item.pic_engineer_id === designer.id
                                                                                        ? "opacity-100"
                                                                                        : "opacity-0"
                                                                                )}
                                                                            />
                                                                            {designer.name}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                            </TableCell>
                                            <TableCell className='text-xs text-neutral-600'>
                                                {item.gambar_kerja?.tanggal_selesai 
                                                    ? format(new Date(item.gambar_kerja.tanggal_selesai), 'MMM d, yyyy') 
                                                    : '-'}
                                            </TableCell>
                                            <TableCell className='text-center'>
                                                {(() => {
                                                    const target = project?.order_gambar_kerja?.[0]?.target_selesai;
                                                    const submit = item.gambar_kerja?.tanggal_selesai;
                                                    if (!target || !submit) return <span className='text-[10px] text-muted-foreground italic'>-</span>;
                                                    
                                                    const isOnTime = new Date(submit) <= new Date(target);
                                                    return (
                                                        <Badge variant='outline' className={cn(
                                                            "font-bold text-[10px]",
                                                            isOnTime 
                                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                                                : "bg-red-50 text-red-700 border-red-200"
                                                        )}>
                                                            {isOnTime ? "Ya" : "Tidak"}
                                                        </Badge>
                                                    );
                                                })()}
                                            </TableCell>
                                            <TableCell>
                                                {!item.custom ? (
                                                    item.mdl_item?.link_gambar_kerja ? (
                                                        <Button variant='ghost' size='icon' className='h-7 w-7 text-blue-600' asChild>
                                                            <a href={item.mdl_item.link_gambar_kerja} target='_blank' rel='noopener noreferrer'>
                                                                <Eye className='h-4 w-4' />
                                                            </a>
                                                        </Button>
                                                    ) : (
                                                        <Button variant='outline' size='sm' className='h-6 text-[9px] border-blue-200 text-blue-600 hover:bg-blue-50 px-2' asChild>
                                                            <a href="/dashboard/mdl">Upload</a>
                                                        </Button>
                                                    )
                                                ) : (
                                                    <span className='text-[10px] text-muted-foreground italic'>-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {item.gambar_kerja?.file ? (
                                                    <div className='flex items-center gap-2'>
                                                        <Badge variant='outline' className='bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]'>
                                                            Uploaded
                                                        </Badge>
                                                        <Button variant='ghost' size='icon' className='h-7 w-7 text-emerald-600' asChild>
                                                            <a 
                                                                href={item.gambar_kerja.file.startsWith('http') 
                                                                    ? item.gambar_kerja.file 
                                                                    : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('/api', '')}/storage/${item.gambar_kerja.file}`}
                                                                target='_blank'
                                                                rel='noopener noreferrer'
                                                            >
                                                                <FileDown className='h-4 w-4' />
                                                            </a>
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button 
                                                        variant='ghost' 
                                                        size='sm' 
                                                        className='h-7 text-[10px] text-orange-600 hover:bg-orange-50 gap-1'
                                                        onClick={() => openGkUpload(item)}
                                                    >
                                                        <Upload className='h-3 w-3' />
                                                        Upload GK
                                                    </Button>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {item.gambar_kerja?.tanggal_mulai ? (
                                                    <div className='flex flex-col gap-0.5'>
                                                        <span className='text-[10px] text-neutral-600 flex items-center gap-1'>
                                                            <Clock className='h-2.5 w-2.5 text-neutral-400' />
                                                            {format(new Date(item.gambar_kerja.tanggal_mulai), 'MMM d')} - {item.gambar_kerja.tanggal_selesai ? format(new Date(item.gambar_kerja.tanggal_selesai), 'MMM d') : '?'}
                                                        </span>
                                                        <Button 
                                                            variant='link' 
                                                            className='h-auto p-0 text-[9px] text-muted-foreground w-fit hover:text-orange-600'
                                                            onClick={() => openGkUpload(item)}
                                                        >
                                                            Edit Timeline
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className='text-[10px] text-muted-foreground italic'>Not set</span>
                                                )}
                                            </TableCell>
                                            <TableCell className='text-right'>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant='ghost' size='icon' className='h-8 w-8 rounded-full'>
                                                            <MoreHorizontal className='h-4 w-4' />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align='end' className='w-[160px]'>
                                                        {(item.custom || !item.mdl_item?.link_gambar_kerja) && (
                                                            <DropdownMenuItem onClick={() => openGkUpload(item)}>
                                                                <Upload className='mr-2 h-4 w-4' />
                                                                Edit Gambar
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Gambar Kerja Upload Dialog */}
            <AlertDialog open={isGkDialogOpen} onOpenChange={setIsGkDialogOpen}>
                <AlertDialogContent className='max-w-md'>
                    <AlertDialogHeader>
                        <AlertDialogTitle className='flex items-center gap-2'>
                            <ImageIcon className='h-5 w-5 text-orange-500' />
                            Upload Gambar Kerja
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Upload technical drawing for <strong>{gkItem?.item}</strong>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className='grid gap-4 py-4'>
                        <div className='grid grid-cols-2 gap-4'>
                            <div className='space-y-2'>
                                <Label>Tanggal Mulai</Label>
                                <Input 
                                    type='date' 
                                    value={gkStart}
                                    onChange={(e) => setGkStart(e.target.value)}
                                    className='text-xs'
                                />
                            </div>
                            <div className='space-y-2'>
                                <Label>Tanggal Selesai</Label>
                                <Input 
                                    type='date' 
                                    value={gkEnd}
                                    onChange={(e) => setGkEnd(e.target.value)}
                                    className='text-xs'
                                />
                            </div>
                        </div>
                        <div className='space-y-2'>
                            <Label>Link Gambar Kerja</Label>
                            <Input 
                                type='text'
                                value={typeof gkFile === 'string' ? gkFile : ''}
                                onChange={(e) => setGkFile(e.target.value)}
                                placeholder="Paste link here..."
                                className='text-xs'
                            />
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsGkDialogOpen(false)}>Cancel</AlertDialogCancel>
                        <Button 
                            className='bg-orange-600 hover:bg-orange-700'
                            onClick={handleGkUpload}
                            disabled={uploadGkMutation.isPending}
                        >
                            {uploadGkMutation.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                            Save Drawings
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    )
}
