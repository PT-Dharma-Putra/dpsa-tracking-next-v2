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
    Upload,
    FileDown,
    CheckCircle2,
    Package,
    ClipboardCheck
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

import { projectV2Service, ProjectItemV2 } from "@/features/projects/services/project-v2-service"
import { ProjectItemFormDialog } from "../../_components/project-item-form-dialog"
import { CatalogModal } from "../../_components/catalog-modal"

export default function ProjectItemsPage() {
    const params = useParams()
    const router = useRouter()
    const queryClient = useQueryClient()
    const projectId = parseInt(params.id as string)

    const [isFormOpen, setIsFormOpen] = React.useState(false)
    const [isCatalogOpen, setIsCatalogOpen] = React.useState(false)
    const [selectedItem, setSelectedItem] = React.useState<ProjectItemV2 | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
    const [itemToDelete, setItemToDelete] = React.useState<ProjectItemV2 | null>(null)

    const { data: project, isLoading: isLoadingProject } = useQuery({
        queryKey: ["projects-v2", projectId],
        queryFn: () => projectV2Service.getProject(projectId),
    })

    const { data: items, isLoading: isLoadingItems } = useQuery({
        queryKey: ["project-v2-items", projectId],
        queryFn: () => projectV2Service.getProjectItems(projectId),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => projectV2Service.deleteProjectItem(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-v2-items", projectId] })
            toast.success("Item deleted successfully")
            setIsDeleteDialogOpen(false)
        },
        onError: () => {
            toast.error("Failed to delete item")
        }
    })

    const handleEdit = (item: ProjectItemV2) => {
        setSelectedItem(item)
        setIsFormOpen(true)
    }

    const handleAddItem = () => {
        setIsCatalogOpen(true)
    }

    const handleDeleteClick = (item: ProjectItemV2) => {
        setItemToDelete(item)
        setIsDeleteDialogOpen(true)
    }

    const confirmDelete = () => {
        if (itemToDelete) {
            deleteMutation.mutate(itemToDelete.id)
        }
    }

    const [spdFile, setSpdFile] = React.useState<File | null>(null)
    const [spdDate, setSpdDate] = React.useState<string>(format(new Date(), "yyyy-MM-dd"))

    const uploadSpdMutation = useMutation({
        mutationFn: ({ file, date }: { file: File, date: string }) => 
            projectV2Service.uploadSPD(projectId, file, date),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects-v2", projectId] })
            toast.success("SPD uploaded successfully")
            setSpdFile(null)
        },
        onError: () => {
            toast.error("Failed to upload SPD")
        }
    })

    const handleSpdUpload = () => {
        if (!spdFile) {
            toast.error("Please select a file")
            return
        }
        uploadSpdMutation.mutate({ file: spdFile, date: spdDate })
    }

    const [sphFile, setSphFile] = React.useState<File | null>(null)
    const [sphNumber, setSphNumber] = React.useState<string>("")

    const uploadSphMutation = useMutation({
        mutationFn: ({ file, number }: { file: File, number: string }) => 
            projectV2Service.uploadSPH(projectId, file, number),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects-v2", projectId] })
            toast.success("SPH uploaded successfully")
            setSphFile(null)
            setSphNumber("")
        },
        onError: () => {
            toast.error("Failed to upload SPH")
        }
    })

    const handleSphUpload = () => {
        if (!sphFile || !sphNumber) {
            toast.error("Please provide both file and SPH number")
            return
        }
        uploadSphMutation.mutate({ file: sphFile, number: sphNumber })
    }

    const [accSentDate, setAccSentDate] = React.useState<string>(format(new Date(), "yyyy-MM-dd"))
    const [accDoneDate, setAccDoneDate] = React.useState<string>("")
    const [accStatus, setAccStatus] = React.useState<string>("In Review")
    const [buktiAccFile, setBuktiAccFile] = React.useState<File | null>(null)

    const updateAccMutation = useMutation({
        mutationFn: (payload: { tanggal_kirim?: string; tanggal_acc?: string; status: string; bukti_acc?: File | null }) => 
            projectV2Service.updateAccDesign(projectId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects-v2", projectId] })
            toast.success("ACC Design updated successfully")
            setBuktiAccFile(null)
        },
        onError: () => {
            toast.error("Failed to update ACC Design")
        }
    })

    const handleAccUpdate = () => {
        updateAccMutation.mutate({
            tanggal_kirim: accSentDate,
            tanggal_acc: accDoneDate || undefined,
            status: accStatus,
            bukti_acc: buktiAccFile
        })
    }

    const [spkFile, setSpkFile] = React.useState<File | null>(null)
    const [spkNumber, setSpkNumber] = React.useState<string>("")

    const uploadSpkMutation = useMutation({
        mutationFn: ({ file, number }: { file: File, number: string }) => 
            projectV2Service.uploadSPK(projectId, file, number),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects-v2", projectId] })
            toast.success("SPK uploaded successfully")
            setSpdFile(null)
            setSpkNumber("")
        },
        onError: () => {
            toast.error("Failed to upload SPK")
        }
    })

    const handleSpkUpload = () => {
        if (!spkFile || !spkNumber) {
            toast.error("Please provide both file and SPK number")
            return
        }
        uploadSpkMutation.mutate({ file: spkFile, number: spkNumber })
    }

    const existingSpd = project?.designs?.[0]
    const existingSph = project?.sph
    const existingAcc = existingSpd?.acc_design
    const existingSpk = project?.spk

    // Sync state when project data loads
    React.useEffect(() => {
        if (existingAcc) {
            if (existingAcc.tanggal_kirim) setAccSentDate(existingAcc.tanggal_kirim)
            if (existingAcc.tanggal_acc) setAccDoneDate(existingAcc.tanggal_acc)
            setAccStatus(existingAcc.status)
        }
    }, [existingAcc])

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
            title: "Project Items", 
            description: "Add items",
            isCompleted: items && items.length > 0,
            isActive: true,
            icon: Package,
            color: "text-blue-600",
            bgColor: "bg-blue-500",
            lightBg: "bg-blue-50",
            borderColor: "border-blue-200"
        },
        { 
            id: 2, 
            title: "Upload SPD", 
            description: "Surat Permintaan Desain",
            isCompleted: !!existingSpd?.spd_file,
            isActive: items && items.length > 0,
            icon: FileText,
            color: "text-orange-600",
            bgColor: "bg-orange-500",
            lightBg: "bg-orange-50",
            borderColor: "border-orange-200"
        },
        { 
            id: 3, 
            title: "ACC Design", 
            description: "Approval Desain",
            isCompleted: existingAcc?.status === "Approved",
            isActive: !!existingSpd?.spd_file,
            icon: CheckCircle2,
            color: "text-emerald-600",
            bgColor: "bg-emerald-500",
            lightBg: "bg-emerald-50",
            borderColor: "border-emerald-200"
        },
        { 
            id: 4, 
            title: "Upload SPH", 
            description: "Surat Penawaran Harga",
            isCompleted: !!existingSph?.file,
            isActive: existingAcc?.status === "Approved",
            icon: FileText,
            color: "text-blue-600",
            bgColor: "bg-blue-500",
            lightBg: "bg-blue-50",
            borderColor: "border-blue-200"
        },
        { 
            id: 5, 
            title: "Upload SPK", 
            description: "Surat Perintah Kerja",
            isCompleted: !!existingSpk?.file,
            isActive: !!existingSph?.file,
            icon: ClipboardCheck,
            color: "text-purple-600",
            bgColor: "bg-purple-500",
            lightBg: "bg-purple-50",
            borderColor: "border-purple-200"
        }
    ]

    return (
        <div className="flex flex-col gap-6 p-6 max-w-[1600px] mx-auto w-full">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-neutral-100">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Project Workflow</h1>
                    <p className="text-sm text-muted-foreground">Manage project items and documents sequentially</p>
                </div>
            </div>

            {/* Stepper Progress */}
            <div className="py-4">
                <div className="flex items-center justify-between gap-2 overflow-x-auto pb-4 hide-scrollbar">
                    {flowSteps.map((step, index) => {
                        const Icon = step.icon
                        return (
                            <React.Fragment key={step.id}>
                                <div className={`flex flex-col gap-2 min-w-[140px] relative transition-all duration-300 ${step.isActive ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 shadow-sm transition-all duration-500
                                            ${step.isCompleted ? step.bgColor + ' border-transparent text-white scale-110' : 
                                              step.isActive ? step.lightBg + ' ' + step.borderColor + ' ' + step.color + ' ring-4 ring-neutral-50 scale-105' : 
                                              'bg-neutral-100 border-neutral-200 text-neutral-400'}
                                        `}>
                                            {step.isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-bold ${step.isCompleted || step.isActive ? 'text-neutral-900' : 'text-neutral-500'}`}>
                                                Step {step.id}
                                            </span>
                                            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                                                {step.title}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {index < flowSteps.length - 1 && (
                                    <div className="flex-1 h-[2px] min-w-[30px] rounded-full mx-2 bg-neutral-200 overflow-hidden relative">
                                        <div className={`absolute top-0 left-0 h-full w-full transition-transform duration-700 origin-left ${step.isCompleted ? step.bgColor + ' scale-x-100' : 'scale-x-0'}`} />
                                    </div>
                                )}
                            </React.Fragment>
                        )
                    })}
                </div>
            </div>

            {/* Project Details */}
            <Card className="border-none shadow-sm bg-white overflow-hidden ring-1 ring-neutral-200/50">
                <CardHeader className="bg-neutral-50/50 border-b border-neutral-100 pb-4">
                    <CardTitle className="flex items-center gap-2 text-neutral-800 text-lg">
                        <Building2 className="h-5 w-5 text-neutral-400" />
                        Project Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        <div className="space-y-1">
                            <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Project Name</div>
                            <p className="font-semibold text-neutral-900">{project.name}</p>
                        </div>
                        <div className="space-y-1">
                            <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Client</div>
                            <p className="font-semibold text-neutral-900">{project.client?.name || "-"}</p>
                        </div>
                        <div className="space-y-1 lg:col-span-1">
                            <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Description</div>
                            <p className="text-sm text-neutral-700">{project.description || "-"}</p>
                        </div>
                        <div className="space-y-1">
                            <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">SPK Number</div>
                            <p className="text-sm font-medium text-neutral-900">{project.spk_number || project.spk?.nomor_spk || "-"}</p>
                        </div>
                        <div className="space-y-1">
                            <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Deadline</div>
                            <p className="text-sm font-medium text-neutral-900">
                                {project.deadline ? format(new Date(project.deadline), "MMM d, yyyy") : "-"}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Step 1: Project Items */}
            <Card className={`border-none shadow-sm overflow-hidden transition-all duration-300 ${flowSteps[0].isActive && !flowSteps[0].isCompleted ? 'ring-2 ring-blue-500 ring-offset-2' : 'ring-1 ring-neutral-200/50'}`}>
                <CardHeader className="bg-blue-50/50 border-b border-blue-100 flex flex-row items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">1</div>
                        <div>
                            <CardTitle className="text-lg text-blue-900">Project Items</CardTitle>
                            <p className="text-xs text-blue-600/80">Add and manage items for this project</p>
                        </div>
                    </div>
                    <Button onClick={handleAddItem} className="bg-blue-600 hover:bg-blue-700 shadow-sm transition-all hover:scale-105 active:scale-95">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Item
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-white">
                                <TableRow>
                                    <TableHead className="w-[50px] whitespace-nowrap">#</TableHead>
                                    <TableHead className="whitespace-nowrap">Lantai</TableHead>
                                    <TableHead className="whitespace-nowrap">Ruang</TableHead>
                                    <TableHead className="whitespace-nowrap min-w-[200px]">Item</TableHead>
                                    <TableHead className="whitespace-nowrap min-w-[200px]">Keterangan</TableHead>
                                    <TableHead className="whitespace-nowrap">Vol</TableHead>
                                    <TableHead className="whitespace-nowrap">Size (P x L x T)</TableHead>
                                    <TableHead className="whitespace-nowrap text-center">Qty</TableHead>
                                    <TableHead className="w-[80px] text-right whitespace-nowrap">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingItems ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="h-32 text-center">
                                            <div className="flex items-center justify-center">
                                                <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : items?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="h-40 text-center">
                                            <div className="flex flex-col items-center justify-center text-muted-foreground space-y-3">
                                                <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center">
                                                    <Package className="h-6 w-6 text-neutral-400" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-semibold text-neutral-700">No items found</p>
                                                    <p className="text-xs text-neutral-500">Click "Add Item" to start adding project items.</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items?.map((item, index) => (
                                        <TableRow key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <TableCell className="text-muted-foreground font-medium">{index + 1}</TableCell>
                                            <TableCell className="text-xs">{item.lantai || "-"}</TableCell>
                                            <TableCell className="text-xs max-w-[120px] truncate" title={item.ruang}>{item.ruang || "-"}</TableCell>
                                            <TableCell className="font-semibold text-neutral-800 text-sm max-w-[200px] truncate" title={item.item}>{item.item}</TableCell>
                                            <TableCell className="max-w-[200px] truncate text-xs text-neutral-600" title={item.keterangan}>{item.keterangan || "-"}</TableCell>
                                            <TableCell className="font-medium text-blue-600 text-sm">{item.volume || "-"}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap bg-neutral-50/50 group-hover:bg-transparent">
                                                {item.panjang || "-"} x {item.lebar || "-"} x {item.tinggi || "-"} {item.satuan}
                                            </TableCell>
                                            <TableCell className="font-semibold text-sm text-center bg-blue-50/30 group-hover:bg-transparent text-blue-700">{item.jumlah}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white shadow-sm ring-1 ring-neutral-200/50">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-[160px]">
                                                        <DropdownMenuItem onClick={() => handleEdit(item)}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem 
                                                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                            onClick={() => handleDeleteClick(item)}
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
                </CardContent>
            </Card>

            {/* Steps 2-5: Documents & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 relative">
                {/* 2. SPD SECTION */}
                <Card className={`border shadow-sm transition-all duration-300 ${flowSteps[1].isActive ? (flowSteps[1].isCompleted ? 'border-orange-200 bg-white ring-1 ring-orange-100' : 'border-orange-300 bg-white ring-2 ring-orange-500 ring-offset-2') : 'border-neutral-200 bg-neutral-50/80 opacity-60 grayscale-[0.5]'}`}>
                    <CardHeader className="pb-3 flex flex-row items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${flowSteps[1].isActive ? 'bg-orange-100 text-orange-600' : 'bg-neutral-200 text-neutral-500'}`}>2</div>
                        <div>
                            <CardTitle className="text-base text-neutral-800">Upload SPD</CardTitle>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Surat Permintaan Desain</p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col gap-3">
                            <Input 
                                id="spd-file"
                                type="file" 
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={(e) => setSpdFile(e.target.files?.[0] || null)}
                                className={`h-9 text-xs shadow-sm transition-all ${flowSteps[1].isActive ? 'border-neutral-200 bg-white focus:ring-orange-500 hover:border-orange-300' : 'bg-neutral-100'}`}
                                disabled={!flowSteps[1].isActive}
                            />
                            <Input 
                                type="date"
                                value={spdDate}
                                onChange={(e) => setSpdDate(e.target.value)}
                                className={`h-9 text-xs shadow-sm transition-all ${flowSteps[1].isActive ? 'border-neutral-200 bg-white focus:ring-orange-500 hover:border-orange-300' : 'bg-neutral-100'}`}
                                disabled={!flowSteps[1].isActive}
                            />
                            <Button 
                                onClick={handleSpdUpload} 
                                disabled={!spdFile || uploadSpdMutation.isPending || !flowSteps[1].isActive}
                                className="w-full h-9 text-xs bg-orange-600 hover:bg-orange-700 text-white shadow-sm transition-all active:scale-95 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:opacity-100"
                            >
                                {uploadSpdMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-3 w-3 mr-2" />}
                                Upload SPD
                            </Button>
                        </div>

                        {existingSpd?.spd_file && (
                            <div className="p-3 rounded-xl bg-orange-50/80 border border-orange-100 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-white shadow-sm border border-orange-100 flex items-center justify-center text-orange-600">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-orange-900">SPD Document</p>
                                        <p className="text-[10px] text-orange-600/80">{format(new Date(existingSpd.tanggal || existingSpd.created_at), "MMM d, yyyy")}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-600 hover:bg-orange-200 hover:text-orange-700 bg-white shadow-sm border border-orange-100" asChild>
                                    <a href={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('/api', '')}/storage/${existingSpd.spd_file}`} target="_blank" rel="noopener noreferrer">
                                        <FileDown className="h-4 w-4" />
                                    </a>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 3. ACC DESIGN SECTION */}
                <Card className={`border shadow-sm transition-all duration-300 ${flowSteps[2].isActive ? (flowSteps[2].isCompleted ? 'border-emerald-200 bg-white ring-1 ring-emerald-100' : 'border-emerald-300 bg-white ring-2 ring-emerald-500 ring-offset-2') : 'border-neutral-200 bg-neutral-50/80 opacity-60 grayscale-[0.5]'}`}>
                    <CardHeader className="pb-3 flex flex-row items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${flowSteps[2].isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-neutral-200 text-neutral-500'}`}>3</div>
                        <div>
                            <CardTitle className="text-base text-neutral-800">ACC Design</CardTitle>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Approval Status</p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider ml-1">Tanggal Kirim</Label>
                                <Input 
                                    type="date"
                                    value={accSentDate}
                                    onChange={(e) => setAccSentDate(e.target.value)}
                                    className={`h-9 text-xs shadow-sm transition-all ${flowSteps[2].isActive ? 'border-neutral-200 bg-white hover:border-emerald-300' : 'bg-neutral-100'}`}
                                    disabled={!flowSteps[2].isActive}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider ml-1">Status</Label>
                                <Select value={accStatus} onValueChange={setAccStatus} disabled={!flowSteps[2].isActive}>
                                    <SelectTrigger className={`h-9 text-xs shadow-sm transition-all ${flowSteps[2].isActive ? 'border-neutral-200 bg-white hover:border-emerald-300' : 'bg-neutral-100'}`}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="In Review">In Review</SelectItem>
                                        <SelectItem value="Approved">Approved</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            {accStatus === "Approved" && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider ml-1">Tanggal Approved</Label>
                                        <Input 
                                            type="date"
                                            value={accDoneDate}
                                            onChange={(e) => setAccDoneDate(e.target.value)}
                                            className="h-9 text-xs border-emerald-200 bg-emerald-50/30 shadow-sm focus:ring-emerald-500"
                                            disabled={!flowSteps[2].isActive}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider ml-1">Bukti ACC</Label>
                                        <Input 
                                            type="file"
                                            onChange={(e) => setBuktiAccFile(e.target.files?.[0] || null)}
                                            className="h-9 text-xs border-emerald-200 bg-emerald-50/30 shadow-sm focus:ring-emerald-500 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 cursor-pointer"
                                            disabled={!flowSteps[2].isActive}
                                        />
                                        {existingAcc?.bukti_acc && (
                                            <a href={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('/api', '')}/storage/${existingAcc.bukti_acc}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-600 hover:underline flex items-center gap-1 mt-1 ml-1">
                                                <FileText className="h-3 w-3" />
                                                View existing file
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            <Button 
                                onClick={handleAccUpdate} 
                                disabled={updateAccMutation.isPending || !flowSteps[2].isActive}
                                className="w-full h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all active:scale-95 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:opacity-100 mt-1"
                            >
                                {updateAccMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-2" />}
                                Update Status
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. SPH SECTION */}
                <Card className={`border shadow-sm transition-all duration-300 ${flowSteps[3].isActive ? (flowSteps[3].isCompleted ? 'border-blue-200 bg-white ring-1 ring-blue-100' : 'border-blue-300 bg-white ring-2 ring-blue-500 ring-offset-2') : 'border-neutral-200 bg-neutral-50/80 opacity-60 grayscale-[0.5]'}`}>
                    <CardHeader className="pb-3 flex flex-row items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${flowSteps[3].isActive ? 'bg-blue-100 text-blue-600' : 'bg-neutral-200 text-neutral-500'}`}>4</div>
                        <div>
                            <CardTitle className="text-base text-neutral-800">Upload SPH</CardTitle>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Surat Penawaran</p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col gap-3">
                            <Input 
                                id="sph-file"
                                type="file" 
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={(e) => setSphFile(e.target.files?.[0] || null)}
                                className={`h-9 text-xs shadow-sm transition-all ${flowSteps[3].isActive ? 'border-neutral-200 bg-white focus:ring-blue-500 hover:border-blue-300' : 'bg-neutral-100'}`}
                                disabled={!flowSteps[3].isActive}
                            />
                            <Input 
                                placeholder="Nomor SPH"
                                value={sphNumber}
                                onChange={(e) => setSphNumber(e.target.value)}
                                className={`h-9 text-xs shadow-sm transition-all ${flowSteps[3].isActive ? 'border-neutral-200 bg-white focus:ring-blue-500 hover:border-blue-300' : 'bg-neutral-100'}`}
                                disabled={!flowSteps[3].isActive}
                            />
                            <Button 
                                onClick={handleSphUpload} 
                                disabled={!sphFile || !sphNumber || uploadSphMutation.isPending || !flowSteps[3].isActive}
                                className="w-full h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all active:scale-95 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:opacity-100"
                            >
                                {uploadSphMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-3 w-3 mr-2" />}
                                Upload SPH
                            </Button>
                        </div>

                        {existingSph?.file && (
                            <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-white shadow-sm border border-blue-100 flex items-center justify-center text-blue-600">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-xs font-bold text-blue-900 line-clamp-1" title={existingSph.nomor_sph}>{existingSph.nomor_sph}</p>
                                        <p className="text-[10px] text-blue-600/80">{format(new Date(existingSph.created_at), "MMM d, yyyy")}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-200 hover:text-blue-700 bg-white shadow-sm border border-blue-100 shrink-0" asChild>
                                    <a href={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('/api', '')}/storage/${existingSph.file}`} target="_blank" rel="noopener noreferrer">
                                        <FileDown className="h-4 w-4" />
                                    </a>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 5. SPK SECTION */}
                <Card className={`border shadow-sm transition-all duration-300 ${flowSteps[4].isActive ? (flowSteps[4].isCompleted ? 'border-purple-200 bg-white ring-1 ring-purple-100' : 'border-purple-300 bg-white ring-2 ring-purple-500 ring-offset-2') : 'border-neutral-200 bg-neutral-50/80 opacity-60 grayscale-[0.5]'}`}>
                    <CardHeader className="pb-3 flex flex-row items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${flowSteps[4].isActive ? 'bg-purple-100 text-purple-600' : 'bg-neutral-200 text-neutral-500'}`}>5</div>
                        <div>
                            <CardTitle className="text-base text-neutral-800">Upload SPK</CardTitle>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Surat Perintah Kerja</p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col gap-3">
                            <Input 
                                id="spk-file"
                                type="file" 
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={(e) => setSpkFile(e.target.files?.[0] || null)}
                                className={`h-9 text-xs shadow-sm transition-all ${flowSteps[4].isActive ? 'border-neutral-200 bg-white focus:ring-purple-500 hover:border-purple-300' : 'bg-neutral-100'}`}
                                disabled={!flowSteps[4].isActive}
                            />
                            <Input 
                                placeholder="Nomor SPK"
                                value={spkNumber}
                                onChange={(e) => setSpkNumber(e.target.value)}
                                className={`h-9 text-xs shadow-sm transition-all ${flowSteps[4].isActive ? 'border-neutral-200 bg-white focus:ring-purple-500 hover:border-purple-300' : 'bg-neutral-100'}`}
                                disabled={!flowSteps[4].isActive}
                            />
                            <Button 
                                onClick={handleSpkUpload} 
                                disabled={!spkFile || !spkNumber || uploadSpkMutation.isPending || !flowSteps[4].isActive}
                                className="w-full h-9 text-xs bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-all active:scale-95 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:opacity-100"
                            >
                                {uploadSpkMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-3 w-3 mr-2" />}
                                Upload SPK
                            </Button>
                        </div>

                        {existingSpk?.file && (
                            <div className="p-3 rounded-xl bg-purple-50/80 border border-purple-100 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-white shadow-sm border border-purple-100 flex items-center justify-center text-purple-600">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-xs font-bold text-purple-900 line-clamp-1" title={existingSpk.nomor_spk}>{existingSpk.nomor_spk}</p>
                                        <p className="text-[10px] text-purple-600/80">{format(new Date(existingSpk.created_at), "MMM d, yyyy")}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-600 hover:bg-purple-200 hover:text-purple-700 bg-white shadow-sm border border-purple-100 shrink-0" asChild>
                                    <a href={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('/api', '')}/storage/${existingSpk.file}`} target="_blank" rel="noopener noreferrer">
                                        <FileDown className="h-4 w-4" />
                                    </a>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <ProjectItemFormDialog 
                open={isFormOpen} 
                onOpenChange={setIsFormOpen} 
                projectId={projectId}
                item={selectedItem}
            />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the item "{itemToDelete?.item}".
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <CatalogModal 
                isOpen={isCatalogOpen}
                onClose={() => setIsCatalogOpen(false)}
                projectId={projectId}
            />
        </div>
    )
}
