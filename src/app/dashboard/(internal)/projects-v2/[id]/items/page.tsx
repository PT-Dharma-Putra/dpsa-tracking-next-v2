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
    CheckCircle2
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

export default function ProjectItemsPage() {
    const params = useParams()
    const router = useRouter()
    const queryClient = useQueryClient()
    const projectId = parseInt(params.id as string)

    const [isFormOpen, setIsFormOpen] = React.useState(false)
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
        setSelectedItem(null)
        setIsFormOpen(true)
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

    const updateAccMutation = useMutation({
        mutationFn: (payload: { tanggal_kirim?: string; tanggal_acc?: string; status: string }) => 
            projectV2Service.updateAccDesign(projectId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects-v2", projectId] })
            toast.success("ACC Design updated successfully")
        },
        onError: () => {
            toast.error("Failed to update ACC Design")
        }
    })

    const handleAccUpdate = () => {
        updateAccMutation.mutate({
            tanggal_kirim: accSentDate,
            tanggal_acc: accDoneDate || undefined,
            status: accStatus
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

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">Project Items</h1>
            </div>

            <Card className="border-none shadow-sm bg-gradient-to-br from-white to-neutral-50/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-neutral-800">
                        <FileText className="h-5 w-5 text-orange-500" />
                        Project Details
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="space-y-1">
                            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Building2 className="h-4 w-4" /> Project Name
                            </div>
                            <p className="font-semibold text-neutral-900">{project.name}</p>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <User className="h-4 w-4" /> Client
                            </div>
                            <p className="font-semibold text-neutral-900">{project.client?.name || "-"}</p>
                        </div>
                        <div className="space-y-1 lg:col-span-1">
                            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Description
                            </div>
                            <p className="text-neutral-700">{project.description || "-"}</p>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4" /> SPK Number
                            </div>
                            <p className="text-neutral-700">{project.spk_number || project.spk?.nomor_spk || "-"}</p>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4" /> Deadline
                            </div>
                            <p className="font-semibold text-neutral-900">
                                {project.deadline ? format(new Date(project.deadline), "MMM d, yyyy") : "-"}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6 pt-6 mt-6 border-t border-neutral-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                            {/* SPD SECTION */}
                            <div className="space-y-4 p-4 rounded-2xl bg-neutral-50/50 border border-neutral-100 hover:border-orange-200 transition-all">
                                <div className="space-y-3">
                                    <Label htmlFor="spd-file" className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                                        1. Upload SPD
                                    </Label>
                                    <div className="flex flex-col gap-2.5">
                                        <Input 
                                            id="spd-file"
                                            type="file" 
                                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                            onChange={(e) => setSpdFile(e.target.files?.[0] || null)}
                                            className="h-9 text-xs border-neutral-200 bg-white shadow-sm focus:ring-orange-500"
                                        />
                                        <Input 
                                            type="date"
                                            value={spdDate}
                                            onChange={(e) => setSpdDate(e.target.value)}
                                            className="h-9 text-xs border-neutral-200 bg-white shadow-sm focus:ring-orange-500"
                                        />
                                        <Button 
                                            onClick={handleSpdUpload} 
                                            disabled={!spdFile || uploadSpdMutation.isPending}
                                            className="w-full h-9 text-xs bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-100 transition-all active:scale-95"
                                        >
                                            {uploadSpdMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-3 w-3 mr-2" />}
                                            Upload SPD
                                        </Button>
                                    </div>
                                </div>

                                {existingSpd?.spd_file && (
                                    <div className="p-2.5 rounded-xl bg-white border border-orange-100 flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-2.5">
                                            <div className="h-7 w-7 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                                                <FileText className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-bold text-neutral-800 line-clamp-1">SPD Ready</p>
                                                <p className="text-[9px] text-neutral-500">{format(new Date(existingSpd.tanggal || existingSpd.created_at), "MMM d, yyyy")}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-orange-600" asChild>
                                            <a href={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('/api', '')}/storage/${existingSpd.spd_file}`} target="_blank" rel="noopener noreferrer">
                                                <FileDown className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* ACC DESIGN SECTION */}
                            <div className="space-y-4 p-4 rounded-2xl bg-neutral-50/50 border border-neutral-100 hover:border-emerald-200 transition-all">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        2. ACC Design
                                    </Label>
                                    <div className="flex flex-col gap-2.5">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-medium text-neutral-400 ml-1">Kirim</span>
                                                <Input 
                                                    type="date"
                                                    value={accSentDate}
                                                    onChange={(e) => setAccSentDate(e.target.value)}
                                                    className="h-9 text-xs border-neutral-200 bg-white"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-medium text-neutral-400 ml-1">Status</span>
                                                <Select value={accStatus} onValueChange={setAccStatus}>
                                                    <SelectTrigger className="h-9 text-xs border-neutral-200 bg-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="In Review">In Review</SelectItem>
                                                        <SelectItem value="Approved">Approved</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        
                                        {accStatus === "Approved" && (
                                            <div className="space-y-1 animate-in fade-in slide-in-from-top-1">
                                                <span className="text-[9px] font-medium text-neutral-400 ml-1">Approved</span>
                                                <Input 
                                                    type="date"
                                                    value={accDoneDate}
                                                    onChange={(e) => setAccDoneDate(e.target.value)}
                                                    className="h-9 text-xs border-neutral-200 bg-white"
                                                />
                                            </div>
                                        )}

                                        <Button 
                                            onClick={handleAccUpdate} 
                                            disabled={updateAccMutation.isPending}
                                            className="w-full h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-100 transition-all active:scale-95"
                                        >
                                            {updateAccMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-2" />}
                                            Update Status
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* SPH SECTION */}
                            <div className="space-y-4 p-4 rounded-2xl bg-neutral-50/50 border border-neutral-100 hover:border-blue-200 transition-all">
                                <div className="space-y-3">
                                    <Label htmlFor="sph-file" className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                        3. Upload SPH
                                    </Label>
                                    <div className="flex flex-col gap-2.5">
                                        <Input 
                                            id="sph-file"
                                            type="file" 
                                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                            onChange={(e) => setSphFile(e.target.files?.[0] || null)}
                                            className="h-9 text-xs border-neutral-200 bg-white shadow-sm focus:ring-blue-500"
                                        />
                                        <Input 
                                            placeholder="No SPH"
                                            value={sphNumber}
                                            onChange={(e) => setSphNumber(e.target.value)}
                                            className="h-9 text-xs border-neutral-200 bg-white shadow-sm focus:ring-blue-500"
                                        />
                                        <Button 
                                            onClick={handleSphUpload} 
                                            disabled={!sphFile || !sphNumber || uploadSphMutation.isPending}
                                            className="w-full h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-100 transition-all active:scale-95"
                                        >
                                            {uploadSphMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-3 w-3 mr-2" />}
                                            Upload SPH
                                        </Button>
                                    </div>
                                </div>

                                {existingSph?.file && (
                                    <div className="p-2.5 rounded-xl bg-white border border-blue-100 flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-2.5">
                                            <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                                <FileText className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-bold text-neutral-800 line-clamp-1">{existingSph.nomor_sph}</p>
                                                <p className="text-[9px] text-neutral-500">
                                                    Uploaded: <span className="font-medium text-neutral-700">{format(new Date(existingSph.created_at), "MMM d, yyyy")}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" asChild>
                                            <a href={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('/api', '')}/storage/${existingSph.file}`} target="_blank" rel="noopener noreferrer">
                                                <FileDown className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* SPK SECTION */}
                            <div className="space-y-4 p-4 rounded-2xl bg-neutral-50/50 border border-neutral-100 hover:border-purple-200 transition-all">
                                <div className="space-y-3">
                                    <Label htmlFor="spk-file" className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                                        4. Upload SPK
                                    </Label>
                                    <div className="flex flex-col gap-2.5">
                                        <Input 
                                            id="spk-file"
                                            type="file" 
                                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                            onChange={(e) => setSpkFile(e.target.files?.[0] || null)}
                                            className="h-9 text-xs border-neutral-200 bg-white shadow-sm focus:ring-purple-500"
                                        />
                                        <Input 
                                            placeholder="No SPK"
                                            value={spkNumber}
                                            onChange={(e) => setSpkNumber(e.target.value)}
                                            className="h-9 text-xs border-neutral-200 bg-white shadow-sm focus:ring-purple-500"
                                        />
                                        <Button 
                                            onClick={handleSpkUpload} 
                                            disabled={!spkFile || !spkNumber || uploadSpkMutation.isPending}
                                            className="w-full h-9 text-xs bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-100 transition-all active:scale-95"
                                        >
                                            {uploadSpkMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-3 w-3 mr-2" />}
                                            Upload SPK
                                        </Button>
                                    </div>
                                </div>

                                {existingSpk?.file && (
                                    <div className="p-2.5 rounded-xl bg-white border border-purple-100 flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-2.5">
                                            <div className="h-7 w-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                                                <FileText className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-bold text-neutral-800 line-clamp-1">{existingSpk.nomor_spk}</p>
                                                <p className="text-[9px] text-neutral-500">
                                                    Uploaded: <span className="font-medium text-neutral-700">{format(new Date(existingSpk.created_at), "MMM d, yyyy")}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-purple-600" asChild>
                                            <a href={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('/api', '')}/storage/${existingSpk.file}`} target="_blank" rel="noopener noreferrer">
                                                <FileDown className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Items List</h2>
                <Button onClick={handleAddItem} className="bg-orange-600 hover:bg-orange-700 shadow-sm transition-all hover:scale-[1.02]">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                </Button>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-neutral-50/80">
                        <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>Lantai</TableHead>
                            <TableHead>Ruang</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead>Keterangan</TableHead>
                            <TableHead>Vol</TableHead>
                            <TableHead>Size (P x L x T)</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead className="w-[80px] text-right">Actions</TableHead>
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
                                <TableCell colSpan={10} className="h-32 text-center text-muted-foreground font-medium">
                                    No items found. Click "Add Item" to start.
                                </TableCell>
                            </TableRow>
                        ) : (
                            items?.map((item, index) => (
                                <TableRow key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                                    <TableCell className="text-muted-foreground font-medium">{index + 1}</TableCell>
                                    <TableCell className="text-xs">{item.lantai || "-"}</TableCell>
                                    <TableCell className="text-xs max-w-[120px] truncate">{item.ruang || "-"}</TableCell>
                                    <TableCell className="font-semibold text-neutral-800 text-sm">{item.item}</TableCell>
                                    <TableCell className="max-w-[150px] truncate text-xs">{item.keterangan || "-"}</TableCell>
                                    <TableCell className="font-medium text-blue-600 text-sm">{item.volume || "-"}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {item.panjang || "-"} x {item.lebar || "-"} x {item.tinggi || "-"} {item.satuan}
                                    </TableCell>
                                    <TableCell className="font-medium text-sm">{item.jumlah}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-neutral-100">
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
                                                    className="text-red-600 focus:text-red-600"
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
        </div>
    )
}
