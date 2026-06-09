"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Trash2, Loader2, Database, Search, ChevronLeft, ChevronRight, Download, Upload } from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"

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

import { MdlService, Mdl } from "@/features/mdl/services/mdl-service"
import { MdlFormDialog } from "./mdl-form-dialog"
import { MdlImportDialog } from "./mdl-import-dialog"

const fmtCurrency = (val: number | null | undefined) =>
    val != null ? "Rp " + val.toLocaleString("id-ID") : "-"

export function MdlTable() {
    const queryClient = useQueryClient()
    const [page, setPage] = React.useState(1)
    const [search, setSearch] = React.useState("")
    const [isFormOpen, setIsFormOpen] = React.useState(false)
    const [isImportOpen, setIsImportOpen] = React.useState(false)
    const [selectedMdl, setSelectedMdl] = React.useState<Mdl | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
    const [mdlToDelete, setMdlToDelete] = React.useState<Mdl | null>(null)

    const { data: mdlResponse, isLoading } = useQuery({
        queryKey: ["mdl-list", page, search],
        queryFn: () => MdlService.getMdl({ page, search }),
    })

    const mdlList = mdlResponse?.data || []
    const meta = mdlResponse?.meta || { current_page: 1, last_page: 1, total: 0 }

    const deleteMutation = useMutation({
        mutationFn: (id: number) => MdlService.deleteMdl(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["mdl-list"] })
            toast.success("Data MDL berhasil dihapus")
            setIsDeleteDialogOpen(false)
            setMdlToDelete(null)
        },
        onError: () => {
            toast.error("Gagal menghapus data MDL")
        }
    })

    const handleEdit = (item: Mdl) => {
        setSelectedMdl(item)
        setIsFormOpen(true)
    }

    const handleDelete = (item: Mdl) => {
        setMdlToDelete(item)
        setIsDeleteDialogOpen(true)
    }

    const handleCreate = () => {
        setSelectedMdl(null)
        setIsFormOpen(true)
    }

    const [isExporting, setIsExporting] = React.useState(false)

    const handleExportExcel = async () => {
        if (isExporting) return
        setIsExporting(true)
        try {
            const response = await MdlService.getMdl({ per_page: -1, search })
            const allData = response.data || []
            
            if (allData.length === 0) {
                toast.error("Tidak ada data untuk diexport")
                setIsExporting(false)
                return
            }

            const sortedData = [...allData].sort((a, b) => a.id - b.id);

            const excelData = sortedData.map((item, index) => ({
                "No": index + 1,
                "ID": item.id,
                "Lantai": item.lantai || "-",
                "Kategori MDL": item.kategori_mdl?.nama || "-",
                "Kategori MDL Kode": item.kategori_mdl?.kode || "-",
                "Sub Kategori MDL": item.sub_kategori_mdl?.nama || "-",
                "Sub Kategori MDL Kode": item.sub_kategori_mdl?.kode || "-",
                "Lokasi MDL": item.lokasi_mdl?.nama || "-",
                "Lokasi MDL Kode": item.lokasi_mdl?.kode || "-",
                "Nama Barang": item.barang?.nama || "-",
                "Kode Barang": item.barang?.kode || "-",
                "Harga Barang": item.barang?.harga || "-",
                "Kode MDL": item.kode_mdl || "-"
            }))

            const worksheet = XLSX.utils.json_to_sheet(excelData)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, "MDL V2")

            XLSX.writeFile(workbook, "Data_MDL_V2.xlsx")
            toast.success("Excel berhasil didownload")
        } catch (error) {
            console.error("Failed to export excel:", error)
            toast.error("Gagal mengexport data Excel")
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <div className="p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Database className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-neutral-800">Daftar Master Data MDL V2</p>
                        <p className="text-xs text-muted-foreground">{meta.total} data MDL terdaftar</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={handleCreate} className="bg-orange-600 hover:bg-orange-700 text-white">
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah MDL
                    </Button>
                    <Button 
                        onClick={handleExportExcel} 
                        variant="outline" 
                        disabled={isExporting}
                        className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                    >
                        {isExporting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="mr-2 h-4 w-4" />
                        )}
                        Export Excel
                    </Button>
                    <Button 
                        onClick={() => setIsImportOpen(true)} 
                        variant="outline" 
                        className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        Import Excel
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Cari kode MDL, barang, lantai..."
                    value={search}
                    onChange={e => {
                        setSearch(e.target.value)
                        setPage(1)
                    }}
                    className="pl-9 bg-neutral-50 border-neutral-200 focus:bg-white"
                />
            </div>

            {/* Table */}
            <div className="rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-neutral-50/80">
                        <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>Kode MDL</TableHead>
                            <TableHead>Nama Barang</TableHead>
                            <TableHead className="text-right">Harga</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead>Sub Kategori</TableHead>
                            <TableHead>Lokasi/Ruang</TableHead>
                            <TableHead>Lantai</TableHead>
                            <TableHead>Tanggal Dibuat</TableHead>
                            <TableHead className="w-[120px] text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={10} className="h-32 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-neutral-400" />
                                </TableCell>
                            </TableRow>
                        ) : mdlList.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="h-32 text-center text-muted-foreground text-sm">
                                    {search ? "Tidak ada data MDL yang cocok." : "Belum ada data MDL. Klik 'Tambah MDL' untuk memulai."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            mdlList.map((item: Mdl, index: number) => (
                                <TableRow key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                                    <TableCell className="font-medium text-muted-foreground">{(meta.current_page - 1) * 10 + index + 1}</TableCell>
                                    <TableCell>
                                        <span className="font-mono bg-neutral-100 text-neutral-700 px-2 py-1 rounded text-xs font-semibold">
                                            {item.kode_mdl || "-"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-neutral-900">{item.barang?.nama || "-"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-neutral-800">
                                        {fmtCurrency(item.barang?.harga)}
                                    </TableCell>
                                    <TableCell className="text-sm font-medium text-neutral-750">{item.kategori_mdl?.nama || "-"}</TableCell>
                                    <TableCell className="text-sm text-neutral-700">{item.sub_kategori_mdl?.nama || "-"}</TableCell>
                                    <TableCell className="text-sm text-neutral-700">{item.lokasi_mdl?.nama || "-"}</TableCell>
                                    <TableCell className="text-sm font-semibold text-neutral-800">{item.lantai || "-"}</TableCell>
                                    <TableCell className="text-xs text-neutral-600">
                                        {item.created_at ? new Date(item.created_at).toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        }) : "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                                                onClick={() => handleEdit(item)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                                                onClick={() => handleDelete(item)}
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

            {/* Pagination */}
            <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                    Menampilkan {(meta.current_page - 1) * 10 + 1} sampai {Math.min(meta.current_page * 10, meta.total)} dari {meta.total} data
                </p>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={meta.current_page === 1 || isLoading}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: meta.last_page }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === meta.last_page || Math.abs(p - meta.current_page) <= 1)
                            .map((p, i, arr) => (
                                <React.Fragment key={p}>
                                    {i > 0 && arr[i-1] !== p - 1 && <span className="text-neutral-300">...</span>}
                                    <Button
                                        variant={p === meta.current_page ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setPage(p)}
                                        className={`h-8 w-8 p-0 text-xs ${p === meta.current_page ? "bg-orange-600 hover:bg-orange-700" : ""}`}
                                    >
                                        {p}
                                    </Button>
                                </React.Fragment>
                            ))}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                        disabled={meta.current_page === meta.last_page || isLoading}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Form Dialog */}
            <MdlFormDialog
                open={isFormOpen}
                onOpenChange={(open) => {
                    setIsFormOpen(open)
                    if (!open) setSelectedMdl(null)
                }}
                mdl={selectedMdl}
            />

            {/* Import Dialog */}
            <MdlImportDialog
                open={isImportOpen}
                onOpenChange={setIsImportOpen}
            />

            {/* Delete Confirm Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Data MDL</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus data MDL dengan kode <strong>"{mdlToDelete?.kode_mdl}"</strong>? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => mdlToDelete && deleteMutation.mutate(mdlToDelete.id)}
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
