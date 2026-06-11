"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Download, Upload, AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"

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
import { LokasiMDLService } from "@/features/lokasi-mdl/services/lokasi-mdl-service"

interface LokasiImportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function LokasiImportDialog({ open, onOpenChange }: LokasiImportDialogProps) {
    const queryClient = useQueryClient()
    const [file, setFile] = React.useState<File | null>(null)
    const [isLoadingFile, setIsLoadingFile] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
        if (!open) {
            setFile(null)
        }
    }, [open])

    const generateKodeFromNama = (nama: string): string => {
        // Generate kode from initials of each word in nama, uppercased
        return nama
            .trim()
            .split(/\s+/)
            .map(word => word.charAt(0).toUpperCase())
            .join("")
    }

    const handleDownloadTemplate = () => {
        const headers = [["nama", "kode (opsional, jika kosong akan digenerate otomatis)"]]
        const worksheet = XLSX.utils.aoa_to_sheet(headers)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template Lokasi")
        XLSX.writeFile(workbook, "Template_Import_Lokasi.xlsx")
        toast.success("Template Excel berhasil didownload")
    }

    const mutation = useMutation({
        mutationFn: (items: { nama: string; kode: string }[]) => LokasiMDLService.importLokasi(items),
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ["lokasi-mdl"] })
            toast.success(data.message || "Data lokasi berhasil diimpor")
            onOpenChange(false)
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Terjadi kesalahan saat mengimpor data")
        }
    })

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!file) {
            toast.error("Pilih file Excel terlebih dahulu")
            return
        }

        setIsLoadingFile(true)
        const reader = new FileReader()
        
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result
                const workbook = XLSX.read(bstr, { type: "binary" })
                const sheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[sheetName]
                const json = XLSX.utils.sheet_to_json<any>(worksheet)

                if (json.length === 0) {
                    toast.error("File Excel kosong atau tidak valid")
                    setIsLoadingFile(false)
                    return
                }

                // Normalisasi nama kolom dan ambil datanya
                const items = json.map((row) => {
                    const namaVal = row.nama || row.Nama || row["nama lokasi"] || row["Nama Lokasi"] || ""
                    const rawKode = row.kode || row.Kode || row["kode lokasi"] || row["Kode Lokasi"] || ""
                    const namaStr = String(namaVal).trim()
                    const kodeStr = String(rawKode).trim()

                    // Auto-generate kode dari inisial nama jika kosong
                    const finalKode = kodeStr !== "" ? kodeStr : generateKodeFromNama(namaStr)

                    return {
                        nama: namaStr,
                        kode: finalKode,
                    }
                }).filter(item => item.nama)

                if (items.length === 0) {
                    toast.error("Format data di dalam Excel tidak sesuai (pastikan kolom 'nama' terisi)")
                    setIsLoadingFile(false)
                    return
                }

                mutation.mutate(items)
            } catch (err) {
                console.error(err)
                toast.error("Gagal membaca file Excel")
            } finally {
                setIsLoadingFile(false)
            }
        }

        reader.readAsBinaryString(file)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Import Lokasi MDL</DialogTitle>
                        <DialogDescription>
                            Import data lokasi MDL secara massal menggunakan file Excel (.xlsx atau .xls). Kolom <strong>kode</strong> bersifat opsional — jika kosong akan digenerate otomatis dari inisial nama.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-6 py-4">
                        {/* Download Template Step */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Langkah 1: Download Template</Label>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full justify-start border-dashed border-orange-300 hover:bg-orange-50 text-orange-700"
                                onClick={handleDownloadTemplate}
                            >
                                <Download className="mr-2 h-4 w-4 text-orange-600" />
                                Download Template Excel
                            </Button>
                        </div>

                        {/* Upload File Step */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Langkah 2: Upload File</Label>
                            <div className="flex flex-col gap-2">
                                <Input
                                    id="excel-file"
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={handleFileChange}
                                    ref={fileInputRef}
                                    className="hidden"
                                />
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-neutral-200 rounded-lg p-6 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/20 transition-all flex flex-col items-center justify-center gap-2"
                                >
                                    <Upload className="h-8 w-8 text-neutral-400" />
                                    {file ? (
                                        <div className="flex items-center gap-1 text-green-700 text-sm font-semibold">
                                            <CheckCircle2 className="h-4 w-4" />
                                            {file.name}
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-sm text-neutral-600">Klik untuk memilih file Excel</span>
                                            <span className="text-xs text-neutral-400">Mendukung format .xlsx, .xls</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Batal
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={!file || mutation.isPending || isLoadingFile} 
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            {(mutation.isPending || isLoadingFile) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Import Data
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
