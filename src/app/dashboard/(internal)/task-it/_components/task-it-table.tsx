"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Trash2, Loader2, Search, ClipboardList, FileText, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { toast } from "sonner"
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
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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

import { taskItService, TaskIt } from "@/features/projects/services/task-it-service"
import { TaskItFormDialog } from "./task-it-form-dialog"

interface TaskItTableProps {
    statusFilter?: string | null
    onClearFilter?: () => void
}

export function TaskItTable({ statusFilter, onClearFilter }: TaskItTableProps = {}) {
    const queryClient = useQueryClient()
    const [search, setSearch] = React.useState("")
    const [isFormOpen, setIsFormOpen] = React.useState(false)
    const [selectedTask, setSelectedTask] = React.useState<TaskIt | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
    const [taskToDelete, setTaskToDelete] = React.useState<TaskIt | null>(null)

    const [page, setPage] = React.useState(1)
    const pageSize = 10

    const [sortKey, setSortKey] = React.useState<string>("created_at")
    const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc")

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
        } else {
            setSortKey(key)
            setSortOrder("asc")
        }
    }

    React.useEffect(() => {
        setPage(1)
    }, [search])

    React.useEffect(() => {
        setPage(1)
    }, [statusFilter])

    const { data: tasks, isLoading } = useQuery({
        queryKey: ["task-its"],
        queryFn: () => taskItService.getTasks(),
    })


    const deleteMutation = useMutation({
        mutationFn: (id: number) => taskItService.deleteTask(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["task-its"] })
            toast.success("Task berhasil dihapus")
            setIsDeleteDialogOpen(false)
            setTaskToDelete(null)
        },
        onError: () => {
            toast.error("Gagal menghapus task")
        }
    })

    const updateFieldMutation = useMutation({
        mutationFn: ({ id, status, userId, deskripsi, tanggalSelesai, prioritas }: { id: number, status: string, userId: number, deskripsi: string, tanggalSelesai: string | null, prioritas: string }) => {
            const formData = new FormData()
            formData.append("user_id", userId.toString())
            formData.append("deskripsi", deskripsi)
            formData.append("status", status)
            formData.append("prioritas", prioritas)
            if (tanggalSelesai) {
                formData.append("tanggal_selesai", tanggalSelesai)
            }
            return taskItService.updateTask(id, formData)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["task-its"] })
        },
        onError: () => {
            toast.error("Gagal memperbarui task")
        }
    })

    const handleEdit = (task: TaskIt) => {
        setSelectedTask(task)
        setIsFormOpen(true)
    }

    const handleDelete = (task: TaskIt) => {
        setTaskToDelete(task)
        setIsDeleteDialogOpen(true)
    }

    const handleCreate = () => {
        setSelectedTask(null)
        setIsFormOpen(true)
    }

    const filtered = (tasks ?? []).filter(t => {
        if (statusFilter === "inprogress") {
            const s = t.status.toLowerCase()
            if (s !== "in progress" && s !== "progress" && s !== "sedang dikerjakan") return false
        } else if (statusFilter === "pending") {
            const s = t.status.toLowerCase()
            if (s !== "pending" && s !== "tunda") return false
        }
        if (!search) return true
        return (
            t.deskripsi.toLowerCase().includes(search.toLowerCase()) ||
            (t.user?.name.toLowerCase().includes(search.toLowerCase()) ?? false) ||
            t.status.toLowerCase().includes(search.toLowerCase())
        )
    })

    const sorted = React.useMemo(() => {
        if (!filtered) return []
        return [...filtered].sort((a, b) => {
            let valA: any = ""
            let valB: any = ""

            switch (sortKey) {
                case "deskripsi":
                    valA = a.deskripsi.toLowerCase()
                    valB = b.deskripsi.toLowerCase()
                    break
                case "user":
                    valA = (a.user?.name || "").toLowerCase()
                    valB = (b.user?.name || "").toLowerCase()
                    break
                case "status":
                    valA = a.status.toLowerCase()
                    valB = b.status.toLowerCase()
                    break
                case "prioritas":
                    valA = (a.prioritas || "").toLowerCase()
                    valB = (b.prioritas || "").toLowerCase()
                    break
                case "tanggal_selesai":
                    valA = a.tanggal_selesai ? new Date(a.tanggal_selesai).getTime() : 0
                    valB = b.tanggal_selesai ? new Date(b.tanggal_selesai).getTime() : 0
                    break
                case "created_at":
                default:
                    valA = a.created_at ? new Date(a.created_at).getTime() : 0
                    valB = b.created_at ? new Date(b.created_at).getTime() : 0
                    break
            }

            if (valA < valB) return sortOrder === "asc" ? -1 : 1
            if (valA > valB) return sortOrder === "asc" ? 1 : -1
            return 0
        })
    }, [filtered, sortKey, sortOrder])

    const totalItems = filtered.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const startIndex = (page - 1) * pageSize
    const paginatedItems = sorted.slice(startIndex, startIndex + pageSize)

    const renderSortIcon = (key: string) => {
        if (sortKey !== key) {
            return <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-50 shrink-0" />
        }
        if (sortOrder === "asc") {
            return <ArrowUp className="ml-1.5 h-3.5 w-3.5 text-orange-600 shrink-0" />
        }
        return <ArrowDown className="ml-1.5 h-3.5 w-3.5 text-orange-600 shrink-0" />
    }

    const sortableHeader = (key: string, label: string) => {
        return (
            <button
                type="button"
                className="flex items-center hover:text-neutral-900 transition-colors focus:outline-none font-semibold text-neutral-600 text-xs"
                onClick={() => handleSort(key)}
            >
                <span>{label}</span>
                {renderSortIcon(key)}
            </button>
        )
    }

    const getStatusSelect = (task: TaskIt) => {
        const isUpdating = updateFieldMutation.isPending && updateFieldMutation.variables?.id === task.id
        
        const getStatusStyles = (statusVal: string) => {
            switch (statusVal.toLowerCase()) {
                case "completed":
                case "done":
                case "selesai":
                    return "bg-green-50 text-green-700 border-green-200 focus:ring-green-500 font-bold"
                case "in progress":
                case "progress":
                case "sedang dikerjakan":
                    return "bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-500 font-bold"
                case "pending":
                case "tunda":
                default:
                    return "bg-yellow-50 text-yellow-700 border-yellow-200 focus:ring-yellow-500 font-bold"
            }
        }

        return (
            <div className="flex items-center gap-1.5">
                <Select
                    value={task.status}
                    disabled={isUpdating}
                    onValueChange={(newStatus) => {
                        let finalTanggalSelesai = task.tanggal_selesai
                        if (newStatus === "Completed") {
                            const now = new Date()
                            const tzOffset = now.getTimezoneOffset() * 60000
                            finalTanggalSelesai = new Date(now.getTime() - tzOffset).toISOString().slice(0, 19).replace('T', ' ')
                        }
                        updateFieldMutation.mutate({
                            id: task.id,
                            status: newStatus,
                            userId: task.user_id,
                            deskripsi: task.deskripsi,
                            tanggalSelesai: finalTanggalSelesai,
                            prioritas: task.prioritas
                        }, {
                            onSuccess: () => {
                                toast.success("Status task berhasil diperbarui")
                            }
                        })
                    }}
                >
                    <SelectTrigger className={`w-[115px] h-7 rounded-full border text-xs px-2 focus:outline-none focus:ring-1 ${getStatusStyles(task.status)}`}>
                        <SelectValue placeholder="Pilih Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                </Select>
                {isUpdating && <Loader2 className="h-3 w-3 animate-spin text-neutral-400" />}
            </div>
        )
    }

    const getPrioritasSelect = (task: TaskIt) => {
        const isUpdating = updateFieldMutation.isPending && updateFieldMutation.variables?.id === task.id
        
        const getPrioritasStyles = (prioritasVal: string) => {
            switch (prioritasVal.toLowerCase()) {
                case "high":
                    return "bg-red-50 text-red-700 border-red-200 focus:ring-red-500 font-bold"
                case "low":
                    return "bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-500 font-bold"
                case "medium":
                default:
                    return "bg-yellow-50 text-yellow-700 border-yellow-200 focus:ring-yellow-500 font-bold"
            }
        }

        return (
            <div className="flex items-center gap-1.5">
                <Select
                    value={task.prioritas}
                    disabled={isUpdating}
                    onValueChange={(newPrioritas) => {
                        updateFieldMutation.mutate({
                            id: task.id,
                            status: task.status,
                            userId: task.user_id,
                            deskripsi: task.deskripsi,
                            tanggalSelesai: task.tanggal_selesai,
                            prioritas: newPrioritas
                        }, {
                            onSuccess: () => {
                                toast.success("Prioritas task berhasil diperbarui")
                            }
                        })
                    }}
                >
                    <SelectTrigger className={`w-[100px] h-7 rounded-full border text-xs px-2 focus:outline-none focus:ring-1 ${getPrioritasStyles(task.prioritas)}`}>
                        <SelectValue placeholder="Pilih Prioritas" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                </Select>
                {isUpdating && <Loader2 className="h-3 w-3 animate-spin text-neutral-400" />}
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-orange-100 flex items-center justify-center">
                        <ClipboardList className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-neutral-800">Daftar Pekerjaan IT</p>
                        <p className="text-xs text-muted-foreground">{filtered.length} task tercatat</p>
                    </div>
                </div>
                <Button onClick={handleCreate} className="bg-orange-600 hover:bg-orange-700 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Task
                </Button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari deskripsi, user, atau status..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 bg-neutral-50 border-neutral-200 focus:bg-white"
                    />
                </div>
                {statusFilter === "inprogress" && (
                    <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                        <Loader2 className="h-3 w-3 animate-spin" style={{ animationDuration: '3s' }} />
                        <span>Sedang Dikerjakan</span>
                        <button
                            type="button"
                            onClick={onClearFilter}
                            className="ml-1 hover:text-blue-900 transition-colors"
                            aria-label="Hapus filter"
                        >
                            ✕
                        </button>
                    </div>
                )}
                {statusFilter === "pending" && (
                    <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                        <Loader2 className="h-3 w-3 animate-pulse" />
                        <span>Pekerjaan Pending</span>
                        <button
                            type="button"
                            onClick={onClearFilter}
                            className="ml-1 hover:text-yellow-900 transition-colors"
                            aria-label="Hapus filter"
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-neutral-50/80">
                        <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead className="max-w-[300px]">{sortableHeader("deskripsi", "Deskripsi")}</TableHead>
                            <TableHead>{sortableHeader("user", "User Assigned")}</TableHead>
                            <TableHead>{sortableHeader("prioritas", "Prioritas")}</TableHead>
                            <TableHead>{sortableHeader("status", "Status")}</TableHead>
                            <TableHead>{sortableHeader("created_at", "Tanggal Dibuat")}</TableHead>
                            <TableHead>{sortableHeader("tanggal_selesai", "Tanggal Selesai")}</TableHead>
                            <TableHead>File</TableHead>
                            <TableHead className="w-[120px] text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-32 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-neutral-400" />
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground text-sm">
                                    {search ? "Tidak ada task yang cocok." : "Belum ada task IT. Klik 'Tambah Task' untuk memulai."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedItems.map((task, index) => (
                                <TableRow key={task.id} className="hover:bg-neutral-50/50 transition-colors">
                                    <TableCell className="font-medium text-muted-foreground">{startIndex + index + 1}</TableCell>
                                    <TableCell className="max-w-[300px] whitespace-pre-line text-sm text-neutral-800 font-medium">
                                        {task.deskripsi}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-neutral-700">{task.user?.name || "Unassigned"}</span>
                                            <span className="text-xs text-muted-foreground">{task.user?.email || "-"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getPrioritasSelect(task)}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusSelect(task)}
                                    </TableCell>
                                    <TableCell className="text-xs text-neutral-600">
                                        {task.created_at ? format(new Date(task.created_at), "d MMM yyyy") : <span className="text-muted-foreground italic">-</span>}
                                    </TableCell>
                                    <TableCell className="text-xs text-neutral-600">
                                        {task.tanggal_selesai ? format(new Date(task.tanggal_selesai), "d MMM yyyy HH:mm") : <span className="text-muted-foreground italic">-</span>}
                                    </TableCell>
                                    <TableCell>
                                        {task.file_url ? (
                                            <a
                                                href={task.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 font-semibold"
                                            >
                                                <FileText className="h-4 w-4" />
                                                <span>Unduh File</span>
                                            </a>
                                        ) : (
                                            <span className="text-muted-foreground italic text-xs">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                                                onClick={() => handleEdit(task)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                                                onClick={() => handleDelete(task)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-4 border-t border-neutral-200 bg-neutral-50/50 rounded-b-xl">
                    <div className="text-xs text-muted-foreground">
                        Menampilkan {startIndex + 1} hingga {Math.min(startIndex + pageSize, totalItems)} dari {totalItems} task
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="h-8 border-neutral-200"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" /> Sebelum
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <Button
                                    key={p}
                                    variant={page === p ? "default" : "outline"}
                                    size="sm"
                                    className={`h-8 w-8 p-0 ${page === p ? "bg-orange-600 hover:bg-orange-700 text-white" : "border-neutral-200"}`}
                                    onClick={() => setPage(p)}
                                >
                                    {p}
                                </Button>
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="h-8 border-neutral-200"
                        >
                            Berikut <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Form Dialog */}
            <TaskItFormDialog
                open={isFormOpen}
                onOpenChange={(open) => {
                    setIsFormOpen(open)
                    if (!open) setSelectedTask(null)
                }}
                task={selectedTask}
            />

            {/* Delete Confirm Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Task</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus task IT ini? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => taskToDelete && deleteMutation.mutate(taskToDelete.id)}
                        >
                            {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
