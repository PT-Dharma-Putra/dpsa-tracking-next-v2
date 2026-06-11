"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Download, Upload, CheckCircle2 } from "lucide-react"
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
import { MdlService } from "@/features/mdl/services/mdl-service"

interface MdlImportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function MdlImportDialog({ open, onOpenChange }: MdlImportDialogProps) {
    const queryClient = useQueryClient()
    const [file, setFile] = React.useState<File | null>(null)
    const [isLoadingFile, setIsLoadingFile] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
        if (!open) {
            setFile(null)
        }
    }, [open])

    const handleDownloadTemplate = () => {
        const headers = [["lantai", "kategori_mdl_kode", "sub_kategori_mdl_kode", "lokasi_mdl_kode", "barang_kode", "kode_mdl"]]
        const worksheet = XLSX.utils.aoa_to_sheet(headers)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template MDL V2")
        XLSX.writeFile(workbook, "Template_Import_MDL_V2.xlsx")
        toast.success("Template Excel berhasil didownload")
    }

    const mutation = useMutation({
        mutationFn: (items: any[]) => MdlService.importMdl(items),
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ["mdl-list"] })
            toast.success(data.message || "Data MDL berhasil diimpor")
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

                const items = json.map((row) => {
                    const lantaiVal = row.lantai || row.Lantai || row["Lantai/Floor"] || ""
                    const katVal = row.kategori_mdl_kode || row.kategori_kode || row["Kategori Code"] || row["Kategori MDL Kode"] || ""
                    const subVal = row.sub_kategori_mdl_kode || row.sub_kategori_kode || row["Sub Kategori Code"] || row["Sub Kategori MDL Kode"] || ""
                    const lokVal = row.lokasi_mdl_kode || row.lokasi_kode || row["Lokasi Code"] || row["Lokasi MDL Kode"] || ""
                    const brgVal = row.barang_kode || row.kode_barang || row["Barang Code"] || row["Kode Barang"] || ""
                    const kodeMdlVal = row.kode_mdl || row.kode || row["Kode MDL"] || ""
                    
                    return {
                        lantai: String(lantaiVal).trim(),
                        kategori_mdl_kode: String(katVal).trim(),
                        sub_kategori_mdl_kode: String(subVal).trim(),
                        lokasi_mdl_kode: String(lokVal).trim(),
                        barang_kode: String(brgVal).trim(),
                        kode_mdl: String(kodeMdlVal).trim(),
                    }
                }).filter(item => item.kategori_mdl_kode || item.barang_kode)

                if (items.length === 0) {
                    toast.error("Format data di dalam Excel tidak sesuai (pastikan kolom terisi)")
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
                        <DialogTitle>Import Data MDL</DialogTitle>
                        <DialogDescription>
                            Import data MDL secara massal menggunakan file Excel (.xlsx atau .xls).
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-6 py-4">
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
