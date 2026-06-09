"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    Loader2, Search, X, Package, Check, Database, Filter, ChevronDown
} from "lucide-react"
import { toast } from "sonner"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { MdlService, Mdl } from "@/features/mdl/services/mdl-service"
import { KategoriMDLService } from "@/features/kategori-mdl/services/kategori-mdl-service"
import { SubKategoriMDLService } from "@/features/sub-kategori-mdl/services/sub-kategori-mdl-service"
import { LokasiMDLService } from "@/features/lokasi-mdl/services/lokasi-mdl-service"
import { projectV2Service } from "@/features/projects/services/project-v2-service"

interface MdlCatalogModalProps {
    isOpen: boolean
    onClose: () => void
    projectId: number
}

export function MdlCatalogModal({ isOpen, onClose, projectId }: MdlCatalogModalProps) {
    const queryClient = useQueryClient()

    // Filter state
    const [search, setSearch] = React.useState("")
    const [debouncedSearch, setDebouncedSearch] = React.useState("")
    const [selectedLantai, setSelectedLantai] = React.useState<string>("all")
    const [selectedKategoriId, setSelectedKategoriId] = React.useState<string>("all")
    const [selectedSubKategoriId, setSelectedSubKategoriId] = React.useState<string>("all")
    const [selectedLokasiId, setSelectedLokasiId] = React.useState<string>("all")
    const [page, setPage] = React.useState(1)

    // Selection state
    const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set())

    // Debounce search
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search)
            setPage(1)
        }, 400)
        return () => clearTimeout(timer)
    }, [search])

    // Reset filters & selection when modal closes
    React.useEffect(() => {
        if (!isOpen) {
            setSearch("")
            setDebouncedSearch("")
            setSelectedLantai("all")
            setSelectedKategoriId("all")
            setSelectedSubKategoriId("all")
            setSelectedLokasiId("all")
            setPage(1)
            setSelectedIds(new Set())
        }
    }, [isOpen])

    // Queries — dropdown options
    const { data: kategoriRes } = useQuery({
        queryKey: ["kategori-mdl-options"],
        queryFn: () => KategoriMDLService.getKategori({ per_page: -1 }),
        enabled: isOpen,
    })
    const { data: subKategoriRes } = useQuery({
        queryKey: ["sub-kategori-mdl-options"],
        queryFn: () => SubKategoriMDLService.getSubKategori({ per_page: -1 }),
        enabled: isOpen,
    })
    const { data: lokasiRes } = useQuery({
        queryKey: ["lokasi-mdl-options"],
        queryFn: () => LokasiMDLService.getLokasi({ per_page: -1 }),
        enabled: isOpen,
    })

    const kategoriOptions = kategoriRes?.data || []
    const subKategoriOptions = subKategoriRes?.data || []
    const lokasiOptions = lokasiRes?.data || []

    // Query — MDL table data with filters
    const { data: mdlResponse, isLoading: isLoadingMdl } = useQuery({
        queryKey: [
            "mdl-catalog-v2",
            page,
            debouncedSearch,
            selectedLantai,
            selectedKategoriId,
            selectedSubKategoriId,
            selectedLokasiId,
        ],
        queryFn: () => MdlService.getMdl({
            page,
            per_page: 15,
            search: debouncedSearch || undefined,
            lantai: selectedLantai !== "all" ? selectedLantai : undefined,
            kategori_mdl_id: selectedKategoriId !== "all" ? parseInt(selectedKategoriId) : undefined,
            sub_kategori_mdl_id: selectedSubKategoriId !== "all" ? parseInt(selectedSubKategoriId) : undefined,
            lokasi_mdl_id: selectedLokasiId !== "all" ? parseInt(selectedLokasiId) : undefined,
        }),
        enabled: isOpen,
    })

    const mdlList = mdlResponse?.data || []
    const meta = mdlResponse?.meta || { current_page: 1, last_page: 1, total: 0 }

    // Mutation — save selected MDL items as project items
    const saveMutation = useMutation({
        mutationFn: (items: any[]) => projectV2Service.createProjectItemsBulk(projectId, items),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-v2-items", projectId] })
            toast.success(`Berhasil menambahkan ${selectedIds.size} item ke project`)
            onClose()
        },
        onError: () => {
            toast.error("Gagal menambahkan item ke project")
        }
    })

    // Handlers
    const toggleSelect = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const toggleSelectAll = () => {
        const allOnPage = mdlList.map(m => m.id)
        const allSelected = allOnPage.every(id => selectedIds.has(id))
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (allSelected) {
                allOnPage.forEach(id => next.delete(id))
            } else {
                allOnPage.forEach(id => next.add(id))
            }
            return next
        })
    }

    const allOnPageSelected = mdlList.length > 0 && mdlList.every(m => selectedIds.has(m.id))
    const someOnPageSelected = mdlList.some(m => selectedIds.has(m.id)) && !allOnPageSelected

    const handleClearFilters = () => {
        setSearch("")
        setDebouncedSearch("")
        setSelectedLantai("all")
        setSelectedKategoriId("all")
        setSelectedSubKategoriId("all")
        setSelectedLokasiId("all")
        setPage(1)
    }

    const handleSave = () => {
        if (selectedIds.size === 0) {
            toast.error("Pilih minimal satu item")
            return
        }

        // Build selected MDL items array — get full data from currently loaded + selected cache
        const selectedMdlItems = mdlList.filter(m => selectedIds.has(m.id))

        const items = selectedMdlItems.map(mdl => ({
            item: mdl.barang?.nama || mdl.kode_mdl || "-",
            jumlah: 1,
            lantai: mdl.lantai || null,
            ruang: mdl.lokasi_mdl?.nama || null,
            keterangan: mdl.kode_mdl || null,
            satuan: mdl.barang?.satuan || "UNIT",
            panjang: null,
            lebar: null,
            tinggi: null,
            divisi_id: null,
        }))

        saveMutation.mutate(items)
    }

    // Lantai options from loaded MDL data (unique values)
    const lantaiOptions = React.useMemo(() => {
        const values = new Set<string>()
        mdlList.forEach(m => {
            if (m.lantai) {
                m.lantai.split(",").forEach(l => {
                    const trimmed = l.trim()
                    if (trimmed) values.add(trimmed)
                })
            }
        })
        return Array.from(values).sort()
    }, [mdlList])

    const formatRupiah = (value?: number | null) => {
        if (!value) return "-"
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value)
    }

    const hasActiveFilters = selectedLantai !== "all" || selectedKategoriId !== "all" || selectedSubKategoriId !== "all" || selectedLokasiId !== "all" || !!debouncedSearch

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="mb-4 flex h-[calc(100vh-2rem)] min-w-[calc(100vw-2rem)] flex-col gap-0 p-0 overflow-hidden">
                {/* Header */}
                <div className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0 shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center">
                            <Database className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold tracking-tight text-neutral-800">
                                Add Item V2 — MDL Catalog
                            </DialogTitle>
                            <p className="text-xs text-neutral-500 mt-0.5">
                                Pilih item dari data MDL untuk ditambahkan ke project
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 px-4 py-2 rounded-full">
                            <Check className="w-4 h-4 text-orange-500" />
                            <span className="font-semibold text-sm text-orange-700">
                                {selectedIds.size} item dipilih
                            </span>
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={selectedIds.size === 0 || saveMutation.isPending}
                            className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-6"
                        >
                            {saveMutation.isPending
                                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                : <Check className="w-4 h-4 mr-2" />
                            }
                            Simpan ke Project
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 h-9 w-9"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-neutral-50/80 border-b px-6 py-3 shrink-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        <Filter className="h-4 w-4 text-neutral-400 shrink-0" />

                        {/* Search */}
                        <div className="relative min-w-[220px] flex-1 max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                            <Input
                                placeholder="Cari nama barang, kode MDL..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 h-9 text-sm bg-white border-neutral-200"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Lantai */}
                        <Select value={selectedLantai} onValueChange={(v) => { setSelectedLantai(v); setPage(1) }}>
                            <SelectTrigger className="h-9 w-[130px] bg-white border-neutral-200 text-sm">
                                <SelectValue placeholder="Lantai" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Lantai</SelectItem>
                                {Array.from({ length: 10 }, (_, i) => `${i + 1}`).map(l => (
                                    <SelectItem key={l} value={`LANTAI ${l}`}>Lantai {l}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Kategori */}
                        <Select value={selectedKategoriId} onValueChange={(v) => { setSelectedKategoriId(v); setSelectedSubKategoriId("all"); setPage(1) }}>
                            <SelectTrigger className="h-9 w-[160px] bg-white border-neutral-200 text-sm">
                                <SelectValue placeholder="Kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Kategori</SelectItem>
                                {kategoriOptions.map(k => (
                                    <SelectItem key={k.id} value={k.id.toString()}>{k.nama}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Sub Kategori */}
                        <Select value={selectedSubKategoriId} onValueChange={(v) => { setSelectedSubKategoriId(v); setPage(1) }}>
                            <SelectTrigger className="h-9 w-[180px] bg-white border-neutral-200 text-sm">
                                <SelectValue placeholder="Sub Kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Sub Kategori</SelectItem>
                                {subKategoriOptions.map(s => (
                                    <SelectItem key={s.id} value={s.id.toString()}>{s.nama}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Lokasi */}
                        <Select value={selectedLokasiId} onValueChange={(v) => { setSelectedLokasiId(v); setPage(1) }}>
                            <SelectTrigger className="h-9 w-[160px] bg-white border-neutral-200 text-sm">
                                <SelectValue placeholder="Lokasi / Ruang" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Lokasi</SelectItem>
                                {lokasiOptions.map(l => (
                                    <SelectItem key={l.id} value={l.id.toString()}>{l.nama}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {hasActiveFilters && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClearFilters}
                                className="h-9 border-neutral-200 text-neutral-600 text-xs hover:bg-neutral-100 gap-1.5"
                            >
                                <X className="h-3 w-3" />
                                Reset Filter
                            </Button>
                        )}

                        <p className="ml-auto text-xs text-neutral-500 shrink-0">
                            Total: <span className="font-bold text-neutral-700">{meta.total}</span> data
                        </p>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-neutral-50 sticky top-0 z-10 border-b border-neutral-200">
                            <tr>
                                <th className="px-4 py-3 w-12">
                                    <input
                                        type="checkbox"
                                        checked={allOnPageSelected}
                                        ref={(el) => { if (el) el.indeterminate = someOnPageSelected }}
                                        onChange={toggleSelectAll}
                                        className="h-4 w-4 rounded border-neutral-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                                    />
                                </th>
                                <th className="px-4 py-3 text-xs font-bold text-neutral-500 uppercase tracking-wider">Kode MDL</th>
                                <th className="px-4 py-3 text-xs font-bold text-neutral-500 uppercase tracking-wider">Nama Barang</th>
                                <th className="px-4 py-3 text-xs font-bold text-neutral-500 uppercase tracking-wider">Lantai</th>
                                <th className="px-4 py-3 text-xs font-bold text-neutral-500 uppercase tracking-wider">Kategori</th>
                                <th className="px-4 py-3 text-xs font-bold text-neutral-500 uppercase tracking-wider">Sub Kategori</th>
                                <th className="px-4 py-3 text-xs font-bold text-neutral-500 uppercase tracking-wider">Lokasi / Ruang</th>
                                <th className="px-4 py-3 text-xs font-bold text-neutral-500 uppercase tracking-wider text-right">Harga</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 bg-white">
                            {isLoadingMdl ? (
                                <tr>
                                    <td colSpan={8} className="h-48 text-center">
                                        <div className="flex items-center justify-center gap-2 text-neutral-400">
                                            <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                                            <span className="text-sm">Memuat data MDL...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : mdlList.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="h-48 text-center">
                                        <div className="flex flex-col items-center gap-2 text-neutral-400">
                                            <Package className="h-10 w-10 text-neutral-200" />
                                            <p className="text-sm font-medium">Tidak ada data MDL</p>
                                            <p className="text-xs">Coba ubah filter atau kata kunci pencarian</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                mdlList.map((mdl) => {
                                    const isSelected = selectedIds.has(mdl.id)
                                    return (
                                        <tr
                                            key={mdl.id}
                                            onClick={() => toggleSelect(mdl.id)}
                                            className={`cursor-pointer transition-colors hover:bg-orange-50/40 ${isSelected ? "bg-orange-50 border-l-2 border-l-orange-500" : ""}`}
                                        >
                                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelect(mdl.id)}
                                                    className="h-4 w-4 rounded border-neutral-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-xs bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded">
                                                    {mdl.kode_mdl || "-"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-neutral-800">
                                                {mdl.barang?.nama || (
                                                    <span className="text-neutral-400 italic text-xs">Tidak ada barang</span>
                                                )}
                                                {mdl.barang?.kode && (
                                                    <p className="text-[10px] font-normal text-neutral-400 mt-0.5">{mdl.barang.kode}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {mdl.lantai ? (
                                                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                                                        {mdl.lantai}
                                                    </Badge>
                                                ) : <span className="text-neutral-300">-</span>}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-neutral-600">
                                                {mdl.kategori_mdl?.nama || <span className="text-neutral-300">-</span>}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-neutral-600">
                                                {mdl.sub_kategori_mdl?.nama || <span className="text-neutral-300">-</span>}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-neutral-600">
                                                {mdl.lokasi_mdl?.nama || <span className="text-neutral-300">-</span>}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-sm text-neutral-800">
                                                {formatRupiah(mdl.barang?.harga)}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {meta.last_page > 1 && (
                    <div className="bg-white border-t px-6 py-3 flex items-center justify-between shrink-0">
                        <p className="text-xs text-neutral-500">
                            Halaman <span className="font-bold">{meta.current_page}</span> dari{" "}
                            <span className="font-bold">{meta.last_page}</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={meta.current_page === 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="h-8 px-4 rounded-full text-xs font-medium"
                            >
                                Sebelumnya
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={meta.current_page === meta.last_page}
                                onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                                className="h-8 px-4 rounded-full text-xs font-medium"
                            >
                                Berikutnya
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
