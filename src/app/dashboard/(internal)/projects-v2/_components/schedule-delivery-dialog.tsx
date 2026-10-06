"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Plus, Loader2, Trash2, Pencil, Truck, X, Check } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { projectV2Service, ProjectV2, JadwalPengiriman } from "@/features/projects/services/project-v2-service"

interface ScheduleDeliveryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    project: ProjectV2 | null
}

export function ScheduleDeliveryDialog({
    open,
    onOpenChange,
    project
}: ScheduleDeliveryDialogProps) {
    const queryClient = useQueryClient()
    const [selectedDivisiId, setSelectedDivisiId] = React.useState<string>("")
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined)
    const [keterangan, setKeterangan] = React.useState<string>("")
    const [editingId, setEditingId] = React.useState<number | null>(null)
    const [isCalendarOpen, setIsCalendarOpen] = React.useState(false)
    const [deletingId, setDeletingId] = React.useState<number | null>(null)

    // Fetch divisions list
    const { data: allDivisions = [], isLoading: isLoadingDivisions } = useQuery({
        queryKey: ["divisions"],
        queryFn: () => projectV2Service.getDivisions(),
        enabled: open,
    })

    // Fetch project team to get divisi_id assigned to this project
    const { data: teamData, isLoading: isLoadingTeam } = useQuery({
        queryKey: ["project-team", project?.id],
        queryFn: () => project?.id ? projectV2Service.getProjectTeam(project.id) : null,
        enabled: open && !!project?.id,
    })

    // Filter divisions that belong to project_team.divisi_id
    const projectDivisiIds = React.useMemo(() => {
        const raw = teamData?.divisi_id ?? project?.project_team?.divisi_id ?? ""
        if (!raw) return []
        return raw
            .split(",")
            .map((s: string) => parseInt(s.trim(), 10))
            .filter((n: number) => !isNaN(n) && n > 0)
    }, [teamData?.divisi_id, project?.project_team?.divisi_id])

    const availableDivisions = React.useMemo(() => {
        if (!projectDivisiIds.length) return []
        return allDivisions.filter((d) => projectDivisiIds.includes(d.id))
    }, [allDivisions, projectDivisiIds])

    // Dropdown options include availableDivisions and the current editing schedule's division (if not already in list)
    const dropdownOptions = React.useMemo(() => {
        const list = [...availableDivisions]
        if (selectedDivisiId) {
            const idNum = parseInt(selectedDivisiId, 10)
            if (!list.some((d) => d.id === idNum)) {
                const found = allDivisions.find((d) => d.id === idNum)
                if (found) list.push(found)
            }
        }
        return list
    }, [availableDivisions, selectedDivisiId, allDivisions])

    // Reset form state when dialog opens or project changes
    React.useEffect(() => {
        if (open) {
            setSelectedDate(undefined)
            setKeterangan("")
            setEditingId(null)
            setIsCalendarOpen(false)
            setDeletingId(null)
            if (availableDivisions.length === 1) {
                setSelectedDivisiId(String(availableDivisions[0].id))
            } else {
                setSelectedDivisiId("")
            }
        }
    }, [open, project?.id, availableDivisions.length])

    // Query schedules for current project
    const { data: schedules = [], isLoading: isLoadingSchedules } = useQuery({
        queryKey: ["jadwal-pengiriman", project?.id],
        queryFn: () => project?.id ? projectV2Service.getJadwalPengiriman({ project_id: project.id }) : Promise.resolve([]),
        enabled: !!project?.id && open,
    })

    // Fallback schedules from project prop
    const fallbackSchedules = React.useMemo(() => {
        if (!project?.jadwal_pengiriman) return []
        return Array.isArray(project.jadwal_pengiriman)
            ? project.jadwal_pengiriman
            : [project.jadwal_pengiriman]
    }, [project])

    const displaySchedules: JadwalPengiriman[] = schedules && schedules.length > 0 
        ? schedules 
        : (isLoadingSchedules ? fallbackSchedules : schedules || [])

    // Add schedule mutation
    const addMutation = useMutation({
        mutationFn: (payload: { project_id: number; divisi_id?: number | null; tanggal: string; keterangan?: string }) =>
            projectV2Service.storeJadwalPengiriman(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["jadwal-pengiriman", project?.id] })
            queryClient.invalidateQueries({ queryKey: ["projects-v2"] })
            toast.success("Jadwal pengiriman berhasil ditambahkan")
            setSelectedDate(undefined)
            setKeterangan("")
            setSelectedDivisiId(availableDivisions.length === 1 ? String(availableDivisions[0].id) : "")
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.message || "Gagal menambahkan jadwal pengiriman"
            toast.error(msg)
        }
    })

    // Update schedule mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: { divisi_id?: number | null; tanggal: string; keterangan?: string } }) =>
            projectV2Service.updateJadwalPengiriman(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["jadwal-pengiriman", project?.id] })
            queryClient.invalidateQueries({ queryKey: ["projects-v2"] })
            toast.success("Jadwal pengiriman berhasil diperbarui")
            setEditingId(null)
            setSelectedDate(undefined)
            setKeterangan("")
            setSelectedDivisiId(availableDivisions.length === 1 ? String(availableDivisions[0].id) : "")
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.message || "Gagal memperbarui jadwal pengiriman"
            toast.error(msg)
        }
    })

    // Delete schedule mutation
    const deleteMutation = useMutation({
        mutationFn: (id: number) => projectV2Service.deleteJadwalPengiriman(id),
        onMutate: (id) => {
            setDeletingId(id)
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ["jadwal-pengiriman", project?.id] })
            queryClient.invalidateQueries({ queryKey: ["projects-v2"] })
            toast.success("Jadwal pengiriman berhasil dihapus")
            if (editingId === id) {
                setEditingId(null)
                setSelectedDate(undefined)
                setKeterangan("")
                setSelectedDivisiId(availableDivisions.length === 1 ? String(availableDivisions[0].id) : "")
            }
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.message || "Gagal menghapus jadwal pengiriman"
            toast.error(msg)
        },
        onSettled: () => {
            setDeletingId(null)
        }
    })

    const handleStartEdit = (s: JadwalPengiriman) => {
        setEditingId(s.id)
        setSelectedDivisiId(s.divisi_id ? String(s.divisi_id) : "")
        const dateStr = s.tanggal || s.tanggal_pengiriman?.tanggal
        if (dateStr) {
            setSelectedDate(new Date(dateStr))
        } else {
            setSelectedDate(undefined)
        }
        setKeterangan(s.keterangan || "")
    }

    const handleCancelEdit = () => {
        setEditingId(null)
        setSelectedDate(undefined)
        setKeterangan("")
        setSelectedDivisiId(availableDivisions.length === 1 ? String(availableDivisions[0].id) : "")
    }

    const handleSubmit = () => {
        if (!project?.id) return
        if (dropdownOptions.length > 0 && !selectedDivisiId) {
            toast.error("Pilih divisi terlebih dahulu")
            return
        }
        if (!selectedDate) {
            toast.error("Pilih tanggal pengiriman terlebih dahulu")
            return
        }

        const dateFormatted = format(selectedDate, "yyyy-MM-dd")
        const divisiIdNum = selectedDivisiId ? parseInt(selectedDivisiId, 10) : undefined

        if (editingId) {
            updateMutation.mutate({
                id: editingId,
                payload: {
                    divisi_id: divisiIdNum,
                    tanggal: dateFormatted,
                    keterangan: keterangan.trim() || undefined,
                }
            })
        } else {
            addMutation.mutate({
                project_id: project.id,
                divisi_id: divisiIdNum,
                tanggal: dateFormatted,
                keterangan: keterangan.trim() || undefined,
            })
        }
    }

    const isSubmitting = addMutation.isPending || updateMutation.isPending

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <Truck className="h-5 w-5 text-orange-500 shrink-0" />
                        Jadwal Pengiriman
                    </DialogTitle>
                    <DialogDescription>
                        Kelola jadwal pengiriman bertahap untuk proyek <strong className="text-foreground">{project?.name}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* List Existing Schedules */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                Daftar Jadwal ({displaySchedules.length})
                            </span>
                            {isLoadingSchedules && (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                            )}
                        </div>

                        {displaySchedules.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-5 border border-dashed rounded-lg text-center bg-neutral-50/50">
                                <Truck className="h-7 w-7 text-neutral-300 mb-1.5" />
                                <p className="text-xs font-medium text-neutral-600">Belum ada jadwal pengiriman</p>
                                <p className="text-[11px] text-muted-foreground">Silakan tentukan jadwal pada form di bawah.</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                {displaySchedules.map((s, idx) => {
                                    const scheduleDate = s.tanggal || s.tanggal_pengiriman?.tanggal
                                    const isBeingEdited = editingId === s.id
                                    const divisiNama = s.divisi?.nama || allDivisions.find((d) => d.id === s.divisi_id)?.nama
                                    return (
                                        <div
                                            key={s.id}
                                            className={cn(
                                                "flex items-center justify-between p-2.5 border rounded-lg bg-card transition-colors gap-2",
                                                isBeingEdited ? "border-orange-500 bg-orange-50/30" : "hover:bg-neutral-50/80"
                                            )}
                                        >
                                            <div className="flex items-start gap-2.5 min-w-0">
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] font-semibold bg-orange-50 text-orange-700 border-orange-200 shrink-0 mt-0.5"
                                                >
                                                    Tahap {idx + 1}
                                                </Badge>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        {divisiNama && (
                                                            <Badge
                                                                variant="secondary"
                                                                className="text-[10px] h-4 px-1.5 font-medium bg-neutral-100 text-neutral-800 border"
                                                            >
                                                                {divisiNama}
                                                            </Badge>
                                                        )}
                                                        <p className="text-xs font-semibold text-neutral-900">
                                                            {scheduleDate
                                                                ? format(new Date(scheduleDate), "EEEE, d MMMM yyyy")
                                                                : "-"}
                                                        </p>
                                                    </div>
                                                    {s.keterangan && (
                                                        <p className="text-[11px] text-muted-foreground mt-0.5 break-words">
                                                            {s.keterangan}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-0.5 shrink-0">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-neutral-500 hover:text-neutral-900"
                                                    title="Edit Jadwal"
                                                    onClick={() => handleStartEdit(s)}
                                                    disabled={isSubmitting || deletingId !== null}
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    title="Hapus Jadwal"
                                                    disabled={deletingId === s.id || isSubmitting}
                                                    onClick={() => deleteMutation.mutate(s.id)}
                                                >
                                                    {deletingId === s.id ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-3 w-3" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Add / Edit Schedule Form */}
                    <div className="p-3.5 border rounded-lg bg-neutral-50/70 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                                {editingId ? "Edit Jadwal Pengiriman" : "Tambah Jadwal Pengiriman"}
                            </span>
                            {editingId && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs text-muted-foreground hover:text-neutral-900 px-1.5"
                                    onClick={handleCancelEdit}
                                >
                                    <X className="h-3 w-3 mr-1" /> Batal Edit
                                </Button>
                            )}
                        </div>

                        {/* Dropdown Divisi (sebelum Tanggal Pengiriman) */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-neutral-700">
                                Divisi {dropdownOptions.length > 0 && <span className="text-red-500">*</span>}
                            </label>
                            {dropdownOptions.length > 0 ? (
                                <Select
                                    value={selectedDivisiId || undefined}
                                    onValueChange={setSelectedDivisiId}
                                >
                                    <SelectTrigger className="w-full bg-white h-9 text-xs">
                                        <SelectValue placeholder="Pilih Divisi..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {dropdownOptions.map((d) => (
                                            <SelectItem key={d.id} value={String(d.id)}>
                                                {d.nama} {d.nama_panjang ? `(${d.nama_panjang})` : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="text-xs text-amber-700 bg-amber-50/80 p-2.5 rounded border border-amber-200">
                                    {isLoadingDivisions || isLoadingTeam
                                        ? "Memuat data divisi..."
                                        : "Tidak ada divisi yang terdaftar pada Project Team proyek ini."}
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-neutral-700">
                                Tanggal Pengiriman <span className="text-red-500">*</span>
                            </label>
                            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal bg-white h-9 text-xs",
                                            !selectedDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-3.5 w-3.5 text-orange-500 shrink-0" />
                                        {selectedDate
                                            ? format(selectedDate, "EEEE, d MMMM yyyy")
                                            : "Pilih tanggal pengiriman..."}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={(d) => {
                                            setSelectedDate(d)
                                            setIsCalendarOpen(false)
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-neutral-700">
                                Keterangan (Opsional)
                            </label>
                            <Textarea
                                placeholder="Catatan pengiriman (misal: Pengiriman Tahap 1, Lantai 2)..."
                                rows={2}
                                className="resize-none bg-white text-xs"
                                value={keterangan}
                                onChange={(e) => setKeterangan(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-end pt-1">
                            <Button
                                type="button"
                                size="sm"
                                className="bg-orange-600 hover:bg-orange-700 text-white gap-1.5 text-xs h-8"
                                disabled={
                                    isSubmitting ||
                                    !selectedDate ||
                                    (dropdownOptions.length > 0 && !selectedDivisiId)
                                }
                                onClick={handleSubmit}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : editingId ? (
                                    <Check className="h-3.5 w-3.5" />
                                ) : (
                                    <Plus className="h-3.5 w-3.5" />
                                )}
                                {editingId ? "Simpan Perubahan" : "Tambah Jadwal"}
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter className="sm:justify-end">
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
