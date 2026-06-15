"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Download, Upload, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"

import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BarangService } from "@/features/barang/services/barang-service"

interface BarangImportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

function generateKode(nama: string): string {
    if (!nama.trim()) return ""
    const words = nama.trim().split(/\s+/)
    const parts: string[] = []
    for (const word of words) {
        const clean = word.replace(/[^a-zA-Z0-9]/g, "")
        if (!clean) continue
        const letters = clean.replace(/[^a-zA-Z]/g, "")
        const digits  = clean.replace(/[^0-9]/g, "")
        const part = letters.slice(0, 3) + digits
        if (part) parts.push(part)
    }
    return parts.join("-").toUpperCase()
}

function parseExcelHarga(val: any): number | null {
    if (val === null || val === undefined || val === "") return null
    if (val instanceof Date) return null
    if (typeof val === "number") return isNaN(val) ? null : val

    // Strip currency symbols, spaces, and other non-numeric characters
    let str = String(val).trim().replace(/[^\d.,-]/g, "")
    if (!str) return null

    if (str.includes(",") && str.includes(".")) {
        // Indonesian format: dots=thousand, comma=decimal (e.g. 1.500.000,50)
        str = str.replace(/\./g, "").replace(",", ".")
    } else if (str.includes(",")) {
        const parts = str.split(",")
        const lastPart = parts[parts.length - 1]
        if (parts.length > 2 || lastPart.length === 3) {
            str = str.replace(/,/g, "")
        } else {
            str = str.replace(",", ".")
        }
    } else if (str.includes(".")) {
        const parts = str.split(".")
        const lastPart = parts[parts.length - 1]
        if (parts.length > 2 || lastPart.length === 3) {
            str = str.replace(/\./g, "")
        }
    }

    const num = Number(str)
    return isNaN(num) ? null : num
}

export function BarangImportDialog({ open, onOpenChange }: BarangImportDialogProps) {
    const queryClient = useQueryClient()
    const [file, setFile] = React.useState<File | null>(null)
    const [isLoadingFile, setIsLoadingFile] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => { if (!open) setFile(null) }, [open])

    const handleDownloadTemplate = () => {
        const headers = [[
            "nama", "spesifikasi", "panjang", "lebar",
            "tinggi", "satuan", "harga", "garansi", "link_gambar_kerja", "jenis_barang_id"
        ]]
        const worksheet = XLSX.utils.aoa_to_sheet(headers)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template Barang")
        XLSX.writeFile(workbook, "Template_Import_Barang.xlsx")
        toast.success("Template Excel berhasil didownload")
    }

    const mutation = useMutation({
        mutationFn: (items: any[]) => BarangService.importBarang(items),
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ["barang"] })
            toast.success(data.message || "Data barang berhasil diimpor")
            onOpenChange(false)
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Terjadi kesalahan saat mengimpor data")
        },
    })

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setFile(e.target.files[0])
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!file) { toast.error("Pilih file Excel terlebih dahulu"); return }

        setIsLoadingFile(true)
        const reader = new FileReader()
        reader.onload = (evt) => {
            try {
                const data = new Uint8Array(evt.target?.result as ArrayBuffer)
                const workbook = XLSX.read(data, { type: "array" })
                const json = XLSX.utils.sheet_to_json<any>(workbook.Sheets[workbook.SheetNames[0]], { raw: true, rawNumbers: true })

                if (!json.length) { toast.error("File Excel kosong atau tidak valid"); setIsLoadingFile(false); return }

                const items = json.map((row) => {
                    const nama = String(row.nama ?? row.Nama ?? "").trim()
                    return {
                        nama,
                        kode: generateKode(nama),
                        spesifikasi: row.spesifikasi ?? row.Spesifikasi ?? null,
                        panjang: row.panjang != null ? Number(row.panjang) : null,
                        lebar: row.lebar != null ? Number(row.lebar) : null,
                        tinggi: row.tinggi != null ? Number(row.tinggi) : null,
                        satuan: row.satuan ?? row.Satuan ?? null,
                        harga: parseExcelHarga(row.harga ?? row.Harga),
                        garansi: row.garansi != null ? String(row.garansi) : null,
                        link_gambar_kerja: row.link_gambar_kerja ?? null,
                        jenis_barang_id: row.jenis_barang_id != null ? Number(row.jenis_barang_id) : null,
                    }
                }).filter(item => item.nama)

                if (!items.length) { toast.error("Tidak ada baris valid (kolom 'nama' harus terisi)"); setIsLoadingFile(false); return }

                mutation.mutate(items)
            } catch (err) {
                console.error(err)
                toast.error("Gagal membaca file Excel")
            } finally {
                setIsLoadingFile(false)
            }
        }
        reader.readAsArrayBuffer(file)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Import Barang</DialogTitle>
                        <DialogDescription>
                            Import data barang secara massal. Kolom wajib: <strong>nama</strong>. Kode barang akan digenerate secara otomatis.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Langkah 1: Download Template</Label>
                            <Button type="button" variant="outline"
                                className="w-full justify-start border-dashed border-orange-300 hover:bg-orange-50 text-orange-700"
                                onClick={handleDownloadTemplate}>
                                <Download className="mr-2 h-4 w-4 text-orange-600" />
                                Download Template Excel
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Langkah 2: Upload File</Label>
                            <Input id="excel-file" type="file" accept=".xlsx,.xls"
                                onChange={handleFileChange} ref={fileInputRef} className="hidden" />
                            <div onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-neutral-200 rounded-lg p-6 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/20 transition-all flex flex-col items-center gap-2">
                                <Upload className="h-8 w-8 text-neutral-400" />
                                {file ? (
                                    <div className="flex items-center gap-1 text-green-700 text-sm font-semibold">
                                        <CheckCircle2 className="h-4 w-4" />{file.name}
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

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
                        <Button type="submit" disabled={!file || mutation.isPending || isLoadingFile}
                            className="bg-orange-600 hover:bg-orange-700 text-white">
                            {(mutation.isPending || isLoadingFile) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Import Data
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
