"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    LifeBuoy,
    AlertCircle,
    Sparkles,
    Plus,
    Search,
    Clock,
    CheckCircle2,
    Loader2,
    FileText,
    ExternalLink,
    Trash2,
    Building2,
    ChevronDown,
    ChevronUp,
    FolderGit2,
    Calendar,
    UserCheck
} from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
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
import { taskItService, TaskIt } from "@/features/projects/services/task-it-service"
import { ClientTaskDialog } from "@/features/dashboard/components/client/client-task-dialog"

export default function ClientRequestsPage() {
    const queryClient = useQueryClient()
    const [search, setSearch] = React.useState("")
    const [tipeFilter, setTipeFilter] = React.useState<string>("all")
    const [statusFilter, setStatusFilter] = React.useState<string>("all")
    const [isCreateOpen, setIsCreateOpen] = React.useState(false)
    const [deleteTask, setDeleteTask] = React.useState<TaskIt | null>(null)
    const [expandedIds, setExpandedIds] = React.useState<number[]>([])

    // Fetch tasks created by this client (filtered by backend for client user)
    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ["client-my-tasks"],
        queryFn: () => taskItService.getTasks(),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => taskItService.deleteTask(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["client-my-tasks"] })
            queryClient.invalidateQueries({ queryKey: ["task-its"] })
            toast.success("Tiket berhasil dibatalkan/dihapus")
            setDeleteTask(null)
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Gagal membatalkan tiket")
        }
    })

    const toggleExpand = (id: number) => {
        setExpandedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        )
    }

    const totalCount = tasks.length
    const pendingCount = tasks.filter(t => t.status.toLowerCase() === "pending" || t.status.toLowerCase() === "tunda").length
    const inProgressCount = tasks.filter(t => t.status.toLowerCase() === "in progress" || t.status.toLowerCase() === "progress" || t.status.toLowerCase() === "sedang dikerjakan").length
    const completedCount = tasks.filter(t => t.status.toLowerCase() === "completed" || t.status.toLowerCase() === "done" || t.status.toLowerCase() === "selesai").length

    const filtered = tasks.filter(t => {
        if (tipeFilter !== "all") {
            if ((t.tipe || "").toLowerCase() !== tipeFilter.toLowerCase()) return false
        }
        if (statusFilter !== "all") {
            const s = (t.status || "").toLowerCase()
            if (statusFilter === "pending" && s !== "pending" && s !== "tunda") return false
            if (statusFilter === "inprogress" && s !== "in progress" && s !== "progress" && s !== "sedang dikerjakan") return false
            if (statusFilter === "completed" && s !== "completed" && s !== "done" && s !== "selesai") return false
        }
        if (!search.trim()) return true
        const query = search.toLowerCase()
        return (
            (t.judul || "").toLowerCase().includes(query) ||
            t.deskripsi.toLowerCase().includes(query) ||
            (t.project?.name || "").toLowerCase().includes(query)
        )
    })

    const getStatusBadge = (status: string, picName?: string | null) => {
        const s = status.toLowerCase()
        if (s === "completed" || s === "done" || s === "selesai") {
            return (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    <span>Selesai Ditangani</span>
                </div>
            )
        }
        if (s === "in progress" || s === "progress" || s === "sedang dikerjakan") {
            return (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                    <span>Sedang Dikerjakan {picName ? `(${picName})` : ""}</span>
                </div>
            )
        }
        return (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                <span>Menunggu Review IT</span>
            </div>
        )
    }

    const getTipeBadge = (tipe?: string) => {
        if (tipe === "Request Fitur") {
            return (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 gap-1 text-[11px] font-semibold py-0.5">
                    <Sparkles className="h-3 w-3 text-purple-600" />
                    Request Fitur
                </Badge>
            )
        }
        return (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1 text-[11px] font-semibold py-0.5">
                <AlertCircle className="h-3 w-3 text-red-500" />
                Lapor Kendala
            </Badge>
        )
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="h-10 w-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                            <LifeBuoy className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Pusat Request & Lapor Kendala</h1>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Pantau status usulan fitur dan kendala operasional yang Anda ajukan ke tim IT.
                            </p>
                        </div>
                    </div>
                </div>

                <Button
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold shadow-sm shrink-0"
                >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Buat Tiket Baru
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
                    <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Total Tiket</p>
                    <p className="text-2xl font-black text-neutral-800 mt-1">{isLoading ? "..." : totalCount}</p>
                </div>
                <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm border-l-4 border-l-amber-400">
                    <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Menunggu Review</p>
                    <p className="text-2xl font-black text-amber-900 mt-1">{isLoading ? "..." : pendingCount}</p>
                </div>
                <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm border-l-4 border-l-blue-400">
                    <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Sedang Dikerjakan</p>
                    <p className="text-2xl font-black text-blue-900 mt-1">{isLoading ? "..." : inProgressCount}</p>
                </div>
                <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm border-l-4 border-l-green-400">
                    <p className="text-[11px] font-bold text-green-700 uppercase tracking-wider">Selesai</p>
                    <p className="text-2xl font-black text-green-900 mt-1">{isLoading ? "..." : completedCount}</p>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari subjek, deskripsi, atau proyek..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9 text-xs bg-neutral-50/70 border-neutral-200 focus:bg-white"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                    {/* Tipe Filter */}
                    <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg text-xs font-medium">
                        <button
                            type="button"
                            onClick={() => setTipeFilter("all")}
                            className={cn(
                                "px-2.5 py-1 rounded-md transition-all text-xs",
                                tipeFilter === "all" ? "bg-white text-neutral-900 shadow-sm font-semibold" : "text-neutral-500 hover:text-neutral-900"
                            )}
                        >
                            Semua Tipe
                        </button>
                        <button
                            type="button"
                            onClick={() => setTipeFilter("Request Fitur")}
                            className={cn(
                                "px-2.5 py-1 rounded-md transition-all text-xs",
                                tipeFilter === "Request Fitur" ? "bg-white text-purple-700 shadow-sm font-semibold" : "text-neutral-500 hover:text-neutral-900"
                            )}
                        >
                            Request Fitur
                        </button>
                        <button
                            type="button"
                            onClick={() => setTipeFilter("Lapor Kendala")}
                            className={cn(
                                "px-2.5 py-1 rounded-md transition-all text-xs",
                                tipeFilter === "Lapor Kendala" ? "bg-white text-red-700 shadow-sm font-semibold" : "text-neutral-500 hover:text-neutral-900"
                            )}
                        >
                            Lapor Kendala
                        </button>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg text-xs font-medium">
                        <button
                            type="button"
                            onClick={() => setStatusFilter("all")}
                            className={cn(
                                "px-2 py-1 rounded-md transition-all text-xs",
                                statusFilter === "all" ? "bg-white text-neutral-900 shadow-sm font-semibold" : "text-neutral-500 hover:text-neutral-900"
                            )}
                        >
                            Semua Status
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter("pending")}
                            className={cn(
                                "px-2 py-1 rounded-md transition-all text-xs",
                                statusFilter === "pending" ? "bg-white text-amber-700 shadow-sm font-semibold" : "text-neutral-500 hover:text-neutral-900"
                            )}
                        >
                            Pending
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter("inprogress")}
                            className={cn(
                                "px-2 py-1 rounded-md transition-all text-xs",
                                statusFilter === "inprogress" ? "bg-white text-blue-700 shadow-sm font-semibold" : "text-neutral-500 hover:text-neutral-900"
                            )}
                        >
                            Diproses
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter("completed")}
                            className={cn(
                                "px-2 py-1 rounded-md transition-all text-xs",
                                statusFilter === "completed" ? "bg-white text-green-700 shadow-sm font-semibold" : "text-neutral-500 hover:text-neutral-900"
                            )}
                        >
                            Selesai
                        </button>
                    </div>
                </div>
            </div>

            {/* List of Tickets */}
            <div className="space-y-3">
                {isLoading ? (
                    <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center">
                        <Loader2 className="h-7 w-7 animate-spin mx-auto text-orange-600 mb-2" />
                        <p className="text-sm text-neutral-500">Memuat riwayat tiket Anda...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center space-y-3">
                        <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
                            <LifeBuoy className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-neutral-800">Belum Ada Tiket yang Cocok</p>
                            <p className="text-xs text-neutral-500 mt-1">
                                {search || tipeFilter !== "all" || statusFilter !== "all"
                                    ? "Coba ubah kata kunci atau hapus filter untuk melihat data lainnya."
                                    : "Anda belum mengajukan request fitur atau laporan kendala apapun."}
                            </p>
                        </div>
                        <Button
                            onClick={() => setIsCreateOpen(true)}
                            className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold"
                        >
                            <Plus className="h-4 w-4 mr-1.5" />
                            Ajukan Tiket Pertama Anda
                        </Button>
                    </div>
                ) : (
                    filtered.map((task) => {
                        const isExpanded = expandedIds.includes(task.id)
                        const isPending = (task.status || "").toLowerCase() === "pending" || (task.status || "").toLowerCase() === "tunda"

                        return (
                            <Card key={task.id} className="border border-neutral-200 hover:border-neutral-300 transition-all shadow-sm overflow-hidden">
                                <CardContent className="p-5 space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                        <div className="space-y-1.5 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {getTipeBadge(task.tipe)}
                                                {task.project?.name && (
                                                    <Badge variant="secondary" className="bg-neutral-100 text-neutral-700 text-[10px] gap-1 font-normal">
                                                        <FolderGit2 className="h-3 w-3 text-neutral-400" />
                                                        {task.project.name}
                                                    </Badge>
                                                )}
                                            </div>

                                            <h3 className="text-base font-bold text-neutral-900 leading-snug">
                                                {task.judul || task.deskripsi.slice(0, 70)}
                                            </h3>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {getStatusBadge(task.status, task.pic?.name)}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="text-xs text-neutral-600 leading-relaxed bg-neutral-50/70 p-3 rounded-xl border border-neutral-100">
                                        <p className={cn("whitespace-pre-line", !isExpanded && "line-clamp-2")}>
                                            {task.deskripsi}
                                        </p>
                                        {task.deskripsi.length > 150 && (
                                            <button
                                                type="button"
                                                onClick={() => toggleExpand(task.id)}
                                                className="text-[11px] text-orange-600 font-semibold hover:underline mt-1.5 flex items-center gap-1"
                                            >
                                                {isExpanded ? (
                                                    <>
                                                        Tutup sebagian <ChevronUp className="h-3 w-3" />
                                                    </>
                                                ) : (
                                                    <>
                                                        Lihat selengkapnya <ChevronDown className="h-3 w-3" />
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>

                                    {/* Footer / Meta Info */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-[11px] text-neutral-400 border-t border-neutral-100">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3 text-neutral-400" />
                                                Diajukan: {format(new Date(task.created_at), "d MMMM yyyy, HH:mm", { locale: idLocale })}
                                            </span>

                                            {task.pic?.name && (
                                                <span className="flex items-center gap-1 text-blue-600 font-medium">
                                                    <UserCheck className="h-3 w-3" />
                                                    Ditangani oleh: {task.pic.name}
                                                </span>
                                            )}

                                            {task.tanggal_selesai && (
                                                <span className="flex items-center gap-1 text-green-600 font-medium">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Selesai: {format(new Date(task.tanggal_selesai), "d MMMM yyyy, HH:mm", { locale: idLocale })}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {task.file_url && (
                                                <a
                                                    href={task.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 font-semibold bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg transition-colors"
                                                >
                                                    <FileText className="h-3.5 w-3.5" />
                                                    <span>Lihat Lampiran</span>
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            )}

                                            {isPending && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setDeleteTask(task)}
                                                    className="h-7 px-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 text-[11px]"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                                                    Batalkan
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })
                )}
            </div>

            {/* Create Dialog */}
            <ClientTaskDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
            />

            {/* Delete/Cancel Confirmation */}
            <AlertDialog open={!!deleteTask} onOpenChange={(open) => !open && setDeleteTask(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Batalkan Tiket Ini?</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-neutral-500">
                            Tiket &quot;{deleteTask?.judul || deleteTask?.deskripsi.slice(0, 50)}&quot; akan dihapus dari antrean tim IT. Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl text-xs">Kembali</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteTask && deleteMutation.mutate(deleteTask.id)}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold"
                        >
                            {deleteMutation.isPending ? "Menghapus..." : "Ya, Batalkan Tiket"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
