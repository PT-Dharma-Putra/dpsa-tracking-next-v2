"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Trash2, Loader2, Package, Search, ChevronLeft, ChevronRight, Download, Upload } from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"

import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { BarangService, Barang } from "@/features/barang/services/barang-service"
import { BarangFormDialog } from "./barang-form-dialog"
import { BarangImportDialog } from "./barang-import-dialog"

const PAGE_SIZE = 10

const fmt = (val: number | null | undefined) =>
    val != null ? val.toLocaleString("id-ID") : "-"

const fmtCurrency = (val: number | null | undefined) =>
    val != null ? "Rp " + val.toLocaleString("id-ID") : "-"

function getFingerprint(b: Barang): string {
    return [
        b.nama?.trim().toUpperCase() ?? "",
        b.kode?.trim().toUpperCase() ?? "",
        b.spesifikasi?.trim().toUpperCase() ?? "",
        b.panjang ?? "",
        b.lebar ?? "",
        b.tinggi ?? "",
        b.satuan ?? "",
        b.harga ?? "",
        b.garansi ?? "",
        b.link_gambar_kerja?.trim() ?? "",
        b.jenis_barang_id ?? "",
    ].join("|")
}

export function BarangTable() {
    const queryClient = useQueryClient()
    const [page, setPage] = React.useState(1)
    const [search, setSearch] = React.useState("")
    const [isFormOpen, setIsFormOpen] = React.useState(false)
    const [isImportOpen, setIsImportOpen] = React.useState(false)
    const [selectedBarang, setSelectedBarang] = React.useState<Barang | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
    const [barangToDelete, setBarangToDelete] = React.useState<Barang | null>(null)
    const [isExporting, setIsExporting] = React.useState(false)
    const [showDuplicates, setShowDuplicates] = React.useState(false)

    const { data: barangResponse, isLoading } = useQuery({
        queryKey: ["barang", page, search],
        queryFn: () => BarangService.getBarang({ page, search }),
        enabled: !showDuplicates,
    })

    const { data: allBarangResponse, isLoading: isLoadingAll } = useQuery({
        queryKey: ["barang-all", search],
        queryFn: () => BarangService.getBarang({ per_page: -1, search }),
        enabled: showDuplicates,
    })

    const duplicateItems = React.useMemo(() => {
        if (!showDuplicates || !allBarangResponse?.data) return []
        const groups = new Map<string, Barang[]>()
        for (const b of allBarangResponse.data) {
            const key = getFingerprint(b)
            if (!groups.has(key)) groups.set(key, [])
            groups.get(key)!.push(b)
        }
        return Array.from(groups.values()).filter(g => g.length > 1).flat()
    }, [showDuplicates, allBarangResponse])

    const isLoadingData = showDuplicates ? isLoadingAll : isLoading

    const barangList = showDuplicates
        ? duplicateItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
        : (barangResponse?.data || [])

    const meta = showDuplicates
        ? {
            current_page: page,
            last_page: Math.max(1, Math.ceil(duplicateItems.length / PAGE_SIZE)),
            total: duplicateItems.length,
        }
        : (barangResponse?.meta || { current_page: 1, last_page: 1, total: 0 })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => BarangService.deleteBarang(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["barang"] })
            toast.success("Barang berhasil dihapus")
            setIsDeleteDialogOpen(false)
            setBarangToDelete(null)
        },
        onError: () => toast.error("Gagal menghapus barang"),
    })

    const deduplicateMutation = useMutation({
        mutationFn: () => BarangService.deduplicateBarang(),
        onSuccess: (res: any) => {
            queryClient.invalidateQueries({ queryKey: ["barang"] })
            toast.success(res.message || "Item duplikat berhasil dibersihkan")
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Gagal membersihkan item duplikat")
        }
    })

    const handleEdit = (b: Barang) => { setSelectedBarang(b); setIsFormOpen(true) }
    const handleDelete = (b: Barang) => { setBarangToDelete(b); setIsDeleteDialogOpen(true) }
    const handleCreate = () => { setSelectedBarang(null); setIsFormOpen(true) }

    const handleExportExcel = async () => {
        try {
            setIsExporting(true)
            const response = await BarangService.getBarang({ per_page: -1, search })
            const allData = response.data || []

            if (!allData.length) { toast.error("Tidak ada data untuk diexport"); return }

            const sorted = [...allData].sort((a, b) => a.id - b.id)
            const excelData = sorted.map((b, i) => ({
                "No": i + 1,
                "ID": b.id,
                "Nama": b.nama,
                "Kode": b.kode,
                "Spesifikasi": b.spesifikasi ?? "",
                "Panjang": b.panjang ?? "",
                "Lebar": b.lebar ?? "",
                "Tinggi": b.tinggi ?? "",
                "Satuan": b.satuan ?? "",
                "Harga": b.harga ?? "",
                "Garansi": b.garansi ?? "",
                "Link Gambar Kerja": b.link_gambar_kerja ?? "",
            }))

            const worksheet = XLSX.utils.json_to_sheet(excelData)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, "Barang")
            worksheet["!cols"] = [
                { wch: 5 }, { wch: 6 }, { wch: 30 }, { wch: 15 }, { wch: 30 },
                { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
                { wch: 15 }, { wch: 15 }, { wch: 40 },
            ]
            XLSX.writeFile(workbook, "Data_Barang.xlsx")
            toast.success("Excel berhasil didownload")
        } catch (err) {
            console.error(err)
            toast.error("Gagal mengexport data Excel")
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <div className="p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Package className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-neutral-800">Daftar Barang</p>
                        <p className="text-xs text-muted-foreground">{meta.total} barang terdaftar</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Button onClick={handleExportExcel} variant="outline" disabled={isExporting}
                        className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800">
                        {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Export Excel
                    </Button>
                    <Button onClick={() => setIsImportOpen(true)} variant="outline"
                        className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800">
                        <Upload className="mr-2 h-4 w-4" />
                        Import Excel
                    </Button>
                    <Button onClick={handleCreate} className="bg-orange-600 hover:bg-orange-700 text-white">
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Barang
                    </Button>
                </div>
            </div>

            {/* Search and Duplicate Actions */}
            <div className="flex items-center gap-2 flex-wrap">
                <div className="relative max-w-sm flex-1 min-w-[240px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Cari nama, kode, spesifikasi..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                        className="pl-9" />
                </div>
                <Button
                    variant={showDuplicates ? "default" : "outline"}
                    onClick={() => { setShowDuplicates(!showDuplicates); setPage(1) }}
                    className={showDuplicates ? "bg-orange-600 hover:bg-orange-700 text-white" : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"}
                >
                    {showDuplicates
                        ? `Item Duplikat (${isLoadingAll ? "..." : duplicateItems.length})`
                        : "Item Duplikat"}
                </Button>
                <Button 
                    variant="outline"
                    onClick={() => {
                        if (confirm("Apakah Anda yakin ingin menghapus salinan duplikat? Aksi ini akan menyisakan satu item unik untuk setiap nama barang yang sama.")) {
                            deduplicateMutation.mutate();
                        }
                    }}
                    disabled={deduplicateMutation.isPending}
                    className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                >
                    {deduplicateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Hapus Item Duplikat
                </Button>
            </div>

            {/* Table - scrollable horizontally */}
            <div className="border rounded-lg bg-white overflow-x-auto">
                <Table className="min-w-[1400px]">
                    <TableHeader className="bg-neutral-50">
                        <TableRow>
                            <TableHead className="w-[60px]">No</TableHead>
                            <TableHead className="min-w-[160px]">Nama</TableHead>
                            <TableHead className="min-w-[100px]">Kode</TableHead>
                            <TableHead className="min-w-[120px]">Jenis</TableHead>
                            <TableHead className="min-w-[200px]">Spesifikasi</TableHead>
                            <TableHead className="min-w-[90px] text-right">Panjang</TableHead>
                            <TableHead className="min-w-[80px] text-right">Lebar</TableHead>
                            <TableHead className="min-w-[80px] text-right">Tinggi</TableHead>
                            <TableHead className="min-w-[80px]">Satuan</TableHead>
                            <TableHead className="min-w-[130px] text-right">Harga</TableHead>
                            <TableHead className="min-w-[120px]">Garansi</TableHead>
                            <TableHead className="min-w-[180px]">Link Gambar Kerja</TableHead>
                            <TableHead className="min-w-[160px]">Tanggal Dibuat</TableHead>
                            <TableHead className="w-[100px] text-right sticky right-0 bg-neutral-50">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingData ? (
                            <TableRow>
                                <TableCell colSpan={14} className="h-24 text-center">
                                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
                                        <span>Memuat data...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : barangList.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={13} className="h-24 text-center text-muted-foreground">
                                    Tidak ada data barang.
                                </TableCell>
                            </TableRow>
                        ) : (
                            barangList.map((b, index) => (
                                <TableRow key={b.id} className="hover:bg-neutral-50/50">
                                    <TableCell className="text-muted-foreground text-sm">
                                        {(meta.current_page - 1) * 10 + index + 1}
                                    </TableCell>
                                    <TableCell className="font-semibold text-neutral-800">{b.nama}</TableCell>
                                    <TableCell>
                                        <span className="font-mono bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded text-xs">{b.kode}</span>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {b.jenis_barang ? (
                                            <span className="bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded text-xs font-medium">
                                                {b.jenis_barang.nama}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-xs text-neutral-600 max-w-[200px] truncate" title={b.spesifikasi ?? ""}>
                                        {b.spesifikasi || "-"}
                                    </TableCell>
                                    <TableCell className="text-right text-sm">{fmt(b.panjang)}</TableCell>
                                    <TableCell className="text-right text-sm">{fmt(b.lebar)}</TableCell>
                                    <TableCell className="text-right text-sm">{fmt(b.tinggi)}</TableCell>
                                    <TableCell className="text-sm">{b.satuan || "-"}</TableCell>
                                    <TableCell className="text-right text-sm">{fmtCurrency(b.harga)}</TableCell>
                                    <TableCell className="text-sm">{b.garansi || "-"}</TableCell>
                                    <TableCell className="text-xs max-w-[180px] truncate">
                                        {b.link_gambar_kerja ? (
                                            <a href={b.link_gambar_kerja} target="_blank" rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline">
                                                {b.link_gambar_kerja}
                                            </a>
                                        ) : "-"}
                                    </TableCell>
                                    <TableCell className="text-xs text-neutral-600">
                                        {b.created_at
                                            ? new Date(b.created_at).toLocaleDateString("id-ID", {
                                                day: "numeric", month: "long", year: "numeric",
                                            })
                                            : "-"}
                                    </TableCell>
                                    <TableCell className="text-right sticky right-0 bg-white">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon"
                                                className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                                                onClick={() => handleEdit(b)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon"
                                                className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                                                onClick={() => handleDelete(b)}>
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
                    Menampilkan {meta.total === 0 ? 0 : (meta.current_page - 1) * 10 + 1} sampai{" "}
                    {Math.min(meta.current_page * 10, meta.total)} dari {meta.total} data
                </p>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={meta.current_page === 1 || isLoadingData} className="h-8 w-8 p-0">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: meta.last_page }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === meta.last_page || Math.abs(p - meta.current_page) <= 1)
                            .map((p, i, arr) => (
                                <React.Fragment key={p}>
                                    {i > 0 && arr[i - 1] !== p - 1 && <span className="text-neutral-300">...</span>}
                                    <Button variant={p === meta.current_page ? "default" : "outline"} size="sm"
                                        onClick={() => setPage(p)}
                                        className={`h-8 w-8 p-0 text-xs ${p === meta.current_page ? "bg-orange-600 hover:bg-orange-700" : ""}`}>
                                        {p}
                                    </Button>
                                </React.Fragment>
                            ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                        disabled={meta.current_page === meta.last_page || isLoadingData} className="h-8 w-8 p-0">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Dialogs */}
            <BarangFormDialog
                open={isFormOpen}
                onOpenChange={(open) => { setIsFormOpen(open); if (!open) setSelectedBarang(null) }}
                barang={selectedBarang}
            />
            <BarangImportDialog open={isImportOpen} onOpenChange={setIsImportOpen} />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Barang</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus barang{" "}
                            <strong>"{barangToDelete?.nama}"</strong>? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => barangToDelete && deleteMutation.mutate(barangToDelete.id)}>
                            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
