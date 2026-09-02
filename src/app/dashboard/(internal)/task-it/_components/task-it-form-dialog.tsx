"use client"

import * as React from "react"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { Loader2, FileText, X, Check, ChevronsUpDown } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"

import { taskItService, TaskIt } from "@/features/projects/services/task-it-service"
import { adminService } from "@/features/admin/api/admin-service"
import { ProjectService } from "@/features/projects/services/project-service"

interface TaskItFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    task?: TaskIt | null
}

export function TaskItFormDialog({ open, onOpenChange, task }: TaskItFormDialogProps) {
    const queryClient = useQueryClient()
    const [tipe, setTipe] = React.useState("Internal")
    const [judul, setJudul] = React.useState("")
    const [projectId, setProjectId] = React.useState("none")
    const [deskripsi, setDeskripsi] = React.useState("")
    const [userId, setUserId] = React.useState("")
    const [picId, setPicId] = React.useState("")
    const [status, setStatus] = React.useState("Pending")
    const [prioritas, setPrioritas] = React.useState("Medium")
    const [tanggalSelesai, setTanggalSelesai] = React.useState("")
    const [file, setFile] = React.useState<File | null>(null)
    const [existingFile, setExistingFile] = React.useState<string | null>(null)
    const [removeExistingFile, setRemoveExistingFile] = React.useState(false)
    const [userPopoverOpen, setUserPopoverOpen] = React.useState(false)
    const [picPopoverOpen, setPicPopoverOpen] = React.useState(false)

    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const { data: usersResponse } = useQuery({
        queryKey: ["users-list-dropdown"],
        queryFn: () => adminService.getAllUsers({ per_page: 200 }),
        enabled: open,
    })

    const users = usersResponse?.data || []

    const { data: projectsResponse } = useQuery({
        queryKey: ["projects-list-task-dropdown"],
        queryFn: () => ProjectService.getProjects(),
        enabled: open,
    })

    const projects = Array.isArray(projectsResponse) ? projectsResponse : (projectsResponse as any)?.data || []

    React.useEffect(() => {
        if (task) {
            setTipe(task.tipe || "Internal")
            setJudul(task.judul || "")
            setProjectId(task.project_id ? task.project_id.toString() : "none")
            setDeskripsi(task.deskripsi)
            setUserId(task.user_id.toString())
            setPicId(task.pic_id ? task.pic_id.toString() : "")
            setStatus(task.status)
            setTanggalSelesai(
                task.tanggal_selesai
                    ? new Date(task.tanggal_selesai).toISOString().slice(0, 16)
                    : ""
            )
            setPrioritas(task.prioritas || "Medium")
            setExistingFile(task.file)
            setRemoveExistingFile(false)
            setFile(null)
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        } else {
            setTipe("Internal")
            setJudul("")
            setProjectId("none")
            setDeskripsi("")
            setUserId("")
            setPicId("")
            setStatus("Pending")
            setPrioritas("Medium")
            setTanggalSelesai("")
            setExistingFile(null)
            setRemoveExistingFile(false)
            setFile(null)
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }, [task, open])

    const mutation = useMutation({
        mutationFn: (formData: FormData) => {
            if (task) {
                return taskItService.updateTask(task.id, formData)
            }
            return taskItService.createTask(formData)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["task-its"] })
            toast.success(task ? "Task berhasil diperbarui" : "Task berhasil dibuat")
            onOpenChange(false)
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Terjadi kesalahan")
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!userId) {
            toast.error("Pilih user terlebih dahulu")
            return
        }

        const formData = new FormData()
        formData.append("user_id", userId)
        if (picId) {
            formData.append("pic_id", picId)
        } else {
            formData.append("pic_id", "")
        }
        formData.append("tipe", tipe)
        if (judul.trim()) {
            formData.append("judul", judul.trim())
        }
        if (projectId && projectId !== "none") {
            formData.append("project_id", projectId)
        }
        formData.append("deskripsi", deskripsi)
        formData.append("status", status)
        formData.append("prioritas", prioritas)
        
        if (tanggalSelesai) {
            formData.append("tanggal_selesai", tanggalSelesai)
        }

        if (file) {
            formData.append("file", file)
        } else if (removeExistingFile) {
            formData.append("file", "")
        }

        mutation.mutate(formData)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{task ? "Edit Task IT" : "Tambah Task IT"}</DialogTitle>
                        <DialogDescription>
                            {task ? "Perbarui informasi pekerjaan IT." : "Catat pekerjaan IT baru ke sistem."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="user_id">User Assigned</Label>
                                <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={userPopoverOpen}
                                            className={cn(
                                                "w-full justify-between bg-neutral-50 border-neutral-200 font-normal text-xs",
                                                !userId && "text-muted-foreground"
                                            )}
                                        >
                                            {userId && users.length > 0
                                                ? (() => {
                                                    const u = users.find(user => user.id.toString() === userId)
                                                    return u ? u.name : "Pilih User..."
                                                  })()
                                                : "Pilih User..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Cari user..." />
                                            <CommandList>
                                                <CommandEmpty>User tidak ditemukan.</CommandEmpty>
                                                <CommandGroup>
                                                    {users.map((user) => (
                                                        <CommandItem
                                                            key={user.id}
                                                            value={`${user.name} ${user.email}`}
                                                            onSelect={() => {
                                                                setUserId(user.id.toString())
                                                                setUserPopoverOpen(false)
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    userId === user.id.toString() ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {user.name} ({user.email})
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="pic_id">PIC IT</Label>
                                <Popover open={picPopoverOpen} onOpenChange={setPicPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={picPopoverOpen}
                                            className={cn(
                                                "w-full justify-between bg-neutral-50 border-neutral-200 font-normal text-xs",
                                                !picId && "text-muted-foreground"
                                            )}
                                        >
                                            {picId && users.length > 0
                                                ? (() => {
                                                    const u = users.find(user => user.id.toString() === picId)
                                                    return u ? u.name : "Pilih PIC..."
                                                  })()
                                                : "Pilih PIC..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Cari PIC..." />
                                            <CommandList>
                                                <CommandEmpty>User tidak ditemukan.</CommandEmpty>
                                                <CommandGroup>
                                                    <CommandItem
                                                        value="none-tanpa-pic"
                                                        onSelect={() => {
                                                            setPicId("")
                                                            setPicPopoverOpen(false)
                                                        }}
                                                    >
                                                        <span className="text-muted-foreground italic text-xs">Tanpa PIC</span>
                                                    </CommandItem>
                                                    {users.map((user) => (
                                                        <CommandItem
                                                            key={user.id}
                                                            value={`${user.name} ${user.email}`}
                                                            onSelect={() => {
                                                                setPicId(user.id.toString())
                                                                setPicPopoverOpen(false)
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    picId === user.id.toString() ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {user.name} ({user.email})
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="tipe">Tipe Task</Label>
                                <Select value={tipe} onValueChange={setTipe}>
                                    <SelectTrigger id="tipe" className="bg-neutral-50 border-neutral-200">
                                        <SelectValue placeholder="Pilih Tipe" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Internal">Internal IT</SelectItem>
                                        <SelectItem value="Request Fitur">Request Fitur</SelectItem>
                                        <SelectItem value="Lapor Kendala">Lapor Kendala</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="project_id">Terkait Proyek (Opsional)</Label>
                                <Select value={projectId} onValueChange={setProjectId}>
                                    <SelectTrigger id="project_id" className="bg-neutral-50 border-neutral-200">
                                        <SelectValue placeholder="Pilih Proyek" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Umum (Tanpa Proyek)</SelectItem>
                                        {projects.map((p: any) => (
                                            <SelectItem key={p.id} value={p.id.toString()}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="judul">Subjek / Judul Task</Label>
                            <Input
                                id="judul"
                                value={judul}
                                onChange={(e) => setJudul(e.target.value)}
                                placeholder="Contoh: Perbaikan Dashboard atau Permintaan Fitur Export"
                                className="bg-neutral-50 border-neutral-200 focus:bg-white"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="deskripsi">Deskripsi Pekerjaan</Label>
                            <Textarea
                                id="deskripsi"
                                value={deskripsi}
                                onChange={(e) => setDeskripsi(e.target.value)}
                                placeholder="Tulis rincian pekerjaan di sini..."
                                className="bg-neutral-50 border-neutral-200 focus:bg-white min-h-[100px]"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={status}
                                    onValueChange={(val) => {
                                        setStatus(val)
                                        if (val === "Completed") {
                                            const now = new Date()
                                            const tzOffset = now.getTimezoneOffset() * 60000
                                            const localISOTime = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16)
                                            setTanggalSelesai(localISOTime)
                                        }
                                    }}
                                >
                                    <SelectTrigger className="bg-neutral-50 border-neutral-200">
                                        <SelectValue placeholder="Pilih Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="prioritas">Prioritas</Label>
                                <Select
                                    value={prioritas}
                                    onValueChange={(val) => setPrioritas(val)}
                                >
                                    <SelectTrigger className="bg-neutral-50 border-neutral-200">
                                        <SelectValue placeholder="Pilih Prioritas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="High">High</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="Low">Low</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="tanggal_selesai">Tanggal Selesai (Opsional)</Label>
                            <Input
                                id="tanggal_selesai"
                                type="datetime-local"
                                value={tanggalSelesai}
                                onChange={(e) => setTanggalSelesai(e.target.value)}
                                className="bg-neutral-50 border-neutral-200 focus:bg-white"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="file">Lampiran File (Opsional)</Label>
                            
                            {existingFile && !removeExistingFile && (
                                <div className="flex items-center justify-between p-2 rounded-lg border border-neutral-200 bg-neutral-50 text-xs">
                                    <div className="flex items-center gap-1.5 text-neutral-600 truncate max-w-[80%]">
                                        <FileText className="h-4 w-4 text-neutral-400 shrink-0" />
                                        <span className="truncate">{existingFile.split("/").pop()}</span>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-red-500 hover:bg-red-50"
                                        onClick={() => setRemoveExistingFile(true)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}

                            {(!existingFile || removeExistingFile) && (
                                <Input
                                    id="file"
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            setFile(e.target.files[0])
                                        } else {
                                            setFile(null)
                                        }
                                    }}
                                    className="bg-neutral-50 border-neutral-200 focus:bg-white cursor-pointer"
                                />
                            )}

                            {removeExistingFile && (
                                <Button
                                    type="button"
                                    variant="link"
                                    className="text-xs text-orange-600 justify-start p-0 h-auto"
                                    onClick={() => {
                                        setRemoveExistingFile(false)
                                        setFile(null)
                                        if (fileInputRef.current) {
                                            fileInputRef.current.value = ""
                                        }
                                    }}
                                >
                                    Batalkan penghapusan file lama
                                </Button>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={mutation.isPending} className="bg-orange-600 hover:bg-orange-700 text-white">
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {task ? "Simpan Perubahan" : "Tambah Task"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
