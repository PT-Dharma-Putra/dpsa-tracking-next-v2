"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Sparkles, AlertCircle, Upload, X, Loader2, FileText } from "lucide-react"
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
import { taskItService } from "@/features/projects/services/task-it-service"
import { useAuthStore } from "@/lib/auth-store"

interface ClientTaskDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    defaultTipe?: "Request Fitur" | "Lapor Kendala"
    defaultProjectId?: number
    defaultProjectName?: string
    onSuccess?: () => void
}

export function ClientTaskDialog({
    open,
    onOpenChange,
    defaultTipe = "Lapor Kendala",
    defaultProjectId,
    defaultProjectName,
    onSuccess,
}: ClientTaskDialogProps) {
    const queryClient = useQueryClient()
    const { user } = useAuthStore()

    const [tipe, setTipe] = React.useState<"Request Fitur" | "Lapor Kendala">(defaultTipe)
    const [judul, setJudul] = React.useState("")
    const [deskripsi, setDeskripsi] = React.useState("")
    const [file, setFile] = React.useState<File | null>(null)
    const [filePreview, setFilePreview] = React.useState<string | null>(null)

    const fileInputRef = React.useRef<HTMLInputElement>(null)

    // Reset or initialize fields when dialog opens
    React.useEffect(() => {
        if (open) {
            setTipe(defaultTipe)
            setJudul("")
            setDeskripsi("")
            setFile(null)
            setFilePreview(null)
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }, [open, defaultTipe])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            if (selectedFile.size > 15 * 1024 * 1024) {
                toast.error("Ukuran file maksimal 15MB")
                return
            }
            setFile(selectedFile)
            if (selectedFile.type.startsWith("image/")) {
                const reader = new FileReader()
                reader.onloadend = () => {
                    setFilePreview(reader.result as string)
                }
                reader.readAsDataURL(selectedFile)
            } else {
                setFilePreview(null)
            }
        }
    }

    const removeSelectedFile = () => {
        setFile(null)
        setFilePreview(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const mutation = useMutation({
        mutationFn: (formData: FormData) => taskItService.createTask(formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["task-its"] })
            queryClient.invalidateQueries({ queryKey: ["client-my-tasks"] })
            toast.success(
                tipe === "Request Fitur"
                    ? "Usulan fitur berhasil dikirim ke tim IT!"
                    : "Laporan kendala berhasil dikirim! Tim IT akan segera menindaklanjuti."
            )
            onOpenChange(false)
            onSuccess?.()
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Gagal mengirim permintaan. Silakan coba lagi.")
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!judul.trim()) {
            toast.error("Mohon isi subjek atau judul laporan")
            return
        }

        if (!deskripsi.trim()) {
            toast.error("Mohon isi deskripsi penjelasan")
            return
        }

        const formData = new FormData()
        formData.append("tipe", tipe)
        formData.append("judul", judul.trim())
        formData.append("deskripsi", deskripsi.trim())
        formData.append("prioritas", "Medium")
        formData.append("status", "Pending")

        if (defaultProjectId) {
            formData.append("project_id", defaultProjectId.toString())
        }

        if (file) {
            formData.append("file", file)
        }

        if (user?.id) {
            formData.append("user_id", user.id.toString())
        }

        mutation.mutate(formData)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px] max-h-[92vh] overflow-y-auto p-6 rounded-2xl">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <DialogHeader className="space-y-1.5 text-left">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            {tipe === "Request Fitur" ? (
                                <span className="flex items-center gap-2 text-purple-700">
                                    <Sparkles className="h-5 w-5 text-purple-600" />
                                    Request Fitur Baru
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 text-red-600">
                                    <AlertCircle className="h-5 w-5 text-red-500" />
                                    Lapor Kendala / Bug
                                </span>
                            )}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-neutral-500">
                            Sampaikan kebutuhan atau kendala Anda langsung kepada tim IT kami. Kami akan merespon tiket Anda secepat mungkin.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Tipe Selector Buttons */}
                    <div className="grid grid-cols-2 gap-3 p-1 bg-neutral-100/80 rounded-xl border border-neutral-200/70">
                        <button
                            type="button"
                            onClick={() => setTipe("Lapor Kendala")}
                            className={cn(
                                "flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                                tipe === "Lapor Kendala"
                                    ? "bg-white text-red-700 shadow-sm border border-red-200 ring-1 ring-red-100"
                                    : "text-neutral-600 hover:text-neutral-900"
                            )}
                        >
                            <AlertCircle className={cn("h-4 w-4", tipe === "Lapor Kendala" ? "text-red-500" : "text-neutral-400")} />
                            <span>Lapor Kendala</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setTipe("Request Fitur")}
                            className={cn(
                                "flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                                tipe === "Request Fitur"
                                    ? "bg-white text-purple-700 shadow-sm border border-purple-200 ring-1 ring-purple-100"
                                    : "text-neutral-600 hover:text-neutral-900"
                            )}
                        >
                            <Sparkles className={cn("h-4 w-4", tipe === "Request Fitur" ? "text-purple-600" : "text-neutral-400")} />
                            <span>Request Fitur</span>
                        </button>
                    </div>

                    {/* Subjek / Judul */}
                    <div className="space-y-1.5">
                        <Label htmlFor="judul" className="text-xs font-semibold text-neutral-700">
                            Subjek / Judul Ringkas <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="judul"
                            value={judul}
                            onChange={(e) => setJudul(e.target.value)}
                            placeholder={
                                tipe === "Request Fitur"
                                    ? "Contoh: Minta penambahan fitur filter tanggal di menu Finance"
                                    : "Contoh: Tombol cetak SPK tidak merespon saat diklik"
                            }
                            className="bg-neutral-50/50 border-neutral-200 text-sm focus:bg-white focus:ring-orange-500"
                            required
                        />
                    </div>

                    {/* Deskripsi */}
                    <div className="space-y-1.5">
                        <Label htmlFor="deskripsi" className="text-xs font-semibold text-neutral-700">
                            Deskripsi Lengkap <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="deskripsi"
                            rows={4}
                            value={deskripsi}
                            onChange={(e) => setDeskripsi(e.target.value)}
                            placeholder={
                                tipe === "Request Fitur"
                                    ? "Jelaskan ide fitur yang Anda inginkan, bagaimana cara kerjanya, dan manfaatnya untuk kebutuhan Anda..."
                                    : "Jelaskan kendala atau pesan error yang muncul, halaman tempat terjadinya kendala, atau kronologi sebelum error terjadi..."
                            }
                            className="bg-neutral-50/50 border-neutral-200 text-sm focus:bg-white focus:ring-orange-500 resize-none leading-relaxed"
                            required
                        />
                    </div>

                    {/* File Attachment / Screenshot */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-neutral-700 flex items-center justify-between">
                            <span>Lampiran / Bukti Screenshot (Opsional)</span>
                            <span className="text-[11px] text-muted-foreground font-normal">Maksimal 15MB</span>
                        </Label>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,.pdf,.doc,.docx,.zip,.rar"
                            onChange={handleFileChange}
                            className="hidden"
                            id="ticket-file-input"
                        />

                        {!file ? (
                            <label
                                htmlFor="ticket-file-input"
                                className="border border-dashed border-neutral-300 hover:border-orange-400 bg-neutral-50/50 hover:bg-orange-50/30 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors group"
                            >
                                <div className="h-9 w-9 rounded-full bg-neutral-100 group-hover:bg-orange-100 flex items-center justify-center transition-colors mb-2">
                                    <Upload className="h-4 w-4 text-neutral-500 group-hover:text-orange-600" />
                                </div>
                                <p className="text-xs font-semibold text-neutral-700">Klik untuk unggah screenshot atau dokumen</p>
                                <p className="text-[10px] text-neutral-400 mt-0.5">PNG, JPG, PDF, atau ZIP</p>
                            </label>
                        ) : (
                            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 overflow-hidden">
                                    {filePreview ? (
                                        <img src={filePreview} alt="Preview" className="h-10 w-10 object-cover rounded-lg border border-neutral-200 shrink-0" />
                                    ) : (
                                        <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                    )}
                                    <div className="truncate">
                                        <p className="text-xs font-semibold text-neutral-800 truncate">{file.name}</p>
                                        <p className="text-[10px] text-neutral-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={removeSelectedFile}
                                    className="h-8 w-8 p-0 text-neutral-400 hover:text-red-600 shrink-0"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-neutral-100">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={mutation.isPending}
                            className="rounded-xl text-xs"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={mutation.isPending}
                            className={cn(
                                "rounded-xl text-xs font-semibold text-white transition-all shadow-sm",
                                tipe === "Request Fitur"
                                    ? "bg-purple-600 hover:bg-purple-700 shadow-purple-600/20"
                                    : "bg-orange-600 hover:bg-orange-700 shadow-orange-600/20"
                            )}
                        >
                            {mutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Mengirimkan Tiket...
                                </>
                            ) : (
                                <>
                                    {tipe === "Request Fitur" ? <Sparkles className="mr-1.5 h-3.5 w-3.5" /> : <AlertCircle className="mr-1.5 h-3.5 w-3.5" />}
                                    Kirim ke Tim IT
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
