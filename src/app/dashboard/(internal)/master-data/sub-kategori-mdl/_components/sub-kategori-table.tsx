"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Trash2, Loader2, Tags, Search, ChevronLeft, ChevronRight, Download, Upload } from "lucide-react"
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

import { SubKategoriMDLService, SubKategoriMDL } from "@/features/sub-kategori-mdl/services/sub-kategori-mdl-service"
import { SubKategoriFormDialog } from "./sub-kategori-form-dialog"
import { SubKategoriImportDialog } from "./sub-kategori-import-dialog"

export function SubKategoriTable() {
    const queryClient = useQueryClient()
    const [page, setPage] = React.useState(1)
    const [search, setSearch] = React.useState("")
    const [isFormOpen, setIsFormOpen] = React.useState(false)
    const [isImportOpen, setIsImportOpen] = React.useState(false)
    const [selectedSubKategori, setSelectedSubKategori] = React.useState<SubKategoriMDL | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
    const [subKategoriToDelete, setSubKategoriToDelete] = React.useState<SubKategoriMDL | null>(null)

    const { data: subKategoriResponse, isLoading } = useQuery({
        queryKey: ["sub-kategori-mdl", page, search],
        queryFn: () => SubKategoriMDLService.getSubKategori({ page, search }),
    })

    const subKategoriList = subKategoriResponse?.data || []
    const meta = subKategoriResponse?.meta || { current_page: 1, last_page: 1, total: 0 }

    const deleteMutation = useMutation({
        mutationFn: (id: number) => SubKategoriMDLService.deleteSubKategori(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sub-kategori-mdl"] })
            toast.success("Sub kategori berhasil dihapus")
            setIsDeleteDialogOpen(false)
            setSubKategoriToDelete(null)
        },
        onError: () => {
            toast.error("Gagal menghapus sub kategori")
        }
    })

    const handleEdit = (subKategori: SubKategoriMDL) => {
        setSelectedSubKategori(subKategori)
        setIsFormOpen(true)
    }

    const handleDelete = (subKategori: SubKategoriMDL) => {
        setSubKategoriToDelete(subKategori)
        setIsDeleteDialogOpen(true)
    }

    const handleCreate = () => {
        setSelectedSubKategori(null)
        setIsFormOpen(true)
    }

    const [isExporting, setIsExporting] = React.useState(false)

    const handleExportExcel = async () => {
        try {
            setIsExporting(true)
            // Fetch all records without pagination, carrying current search
            const response = await SubKategoriMDLService.getSubKategori({ per_page: -1, search })
            const allData = response.data || []
            
            if (allData.length === 0) {
                toast.error("Tidak ada data untuk diexport")
                setIsExporting(false)
                return
            }

            // Sort by ID ascending (id terkecil)
            const sortedData = [...allData].sort((a, b) => a.id - b.id)

            // Map data to clean object structure for Excel headers
            const excelData = sortedData.map((subKategori, index) => ({
                "No": index + 1,
                "ID": subKategori.id,
                "Nama Sub Kategori": subKategori.nama,
                "Kode Sub Kategori": subKategori.kode
            }))

            // Create Worksheet & Workbook
            const worksheet = XLSX.utils.json_to_sheet(excelData)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, "Sub Kategori MDL")

            // Adjust column widths
            const maxNameLen = Math.max(...excelData.map(d => d["Nama Sub Kategori"].length), 20)
            const maxCodeLen = Math.max(...excelData.map(d => d["Kode Sub Kategori"].length), 15)
            worksheet["!cols"] = [
                { wch: 6 },  // No
                { wch: 6 },  // ID
                { wch: maxNameLen + 4 }, // Nama Sub Kategori
                { wch: maxCodeLen + 4 }, // Kode Sub Kategori
            ]

            // Write and download
            XLSX.writeFile(workbook, "Data_Sub_Kategori_MDL.xlsx")
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
                        <Tags className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-neutral-800">Daftar Sub Kategori MDL</p>
                        <p className="text-xs text-muted-foreground">{meta.total} sub kategori terdaftar</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
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
                    <Button 
                        onClick={handleCreate} 
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Sub Kategori
                    </Button>
                </div>
            </div>

            {/* Filter / Search */}
            <div className="flex items-center gap-2 max-w-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari nama atau kode..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setPage(1)
                        }}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="border rounded-lg bg-white overflow-hidden">
                <Table>
                    <TableHeader className="bg-neutral-50">
                        <TableRow>
                            <TableHead className="w-[80px]">No</TableHead>
                            <TableHead>Nama Sub Kategori</TableHead>
                            <TableHead>Kode Sub Kategori</TableHead>
                            <TableHead className="w-[180px]">Tanggal Dibuat</TableHead>
                            <TableHead className="w-[100px] text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
                                        <span>Memuat data...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : subKategoriList.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    Tidak ada data sub kategori.
                                </TableCell>
                            </TableRow>
                        ) : (
                            subKategoriList.map((subKategori, index) => (
                                <TableRow key={subKategori.id} className="hover:bg-neutral-50/50">
                                    <TableCell className="font-medium text-muted-foreground">
                                        {(meta.current_page - 1) * 10 + index + 1}
                                    </TableCell>
                                    <TableCell className="font-semibold text-neutral-800">
                                        {subKategori.nama}
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-mono bg-neutral-100 text-neutral-700 px-2 py-1 rounded text-xs">
                                            {subKategori.kode}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-xs text-neutral-600">
                                        {subKategori.created_at ? new Date(subKategori.created_at).toLocaleDateString("id-ID", {
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
                                                onClick={() => handleEdit(subKategori)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                                                onClick={() => handleDelete(subKategori)}
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
            <SubKategoriFormDialog
                open={isFormOpen}
                onOpenChange={(open) => {
                    setIsFormOpen(open)
                    if (!open) setSelectedSubKategori(null)
                }}
                subKategori={selectedSubKategori}
            />

            {/* Import Dialog */}
            <SubKategoriImportDialog
                open={isImportOpen}
                onOpenChange={setIsImportOpen}
            />

            {/* Delete Confirm Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Sub Kategori MDL</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus sub kategori MDL <strong>"{subKategoriToDelete?.nama}"</strong>? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => subKategoriToDelete && deleteMutation.mutate(subKategoriToDelete.id)}
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
