"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Search, Check, ChevronsUpDown } from "lucide-react"
import { toast } from "sonner"

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"

import { MdlService, Mdl } from "@/features/mdl/services/mdl-service"
import { KategoriMDLService } from "@/features/kategori-mdl/services/kategori-mdl-service"
import { SubKategoriMDLService } from "@/features/sub-kategori-mdl/services/sub-kategori-mdl-service"
import { LokasiMDLService } from "@/features/lokasi-mdl/services/lokasi-mdl-service"
import { BarangService } from "@/features/barang/services/barang-service"

interface MdlFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mdl?: Mdl | null
}

const LANTAI_OPTIONS = Array.from({ length: 10 }, (_, i) => `${i + 1}`)

export function MdlFormDialog({ open, onOpenChange, mdl }: MdlFormDialogProps) {
    const queryClient = useQueryClient()
    const [selectedLantais, setSelectedLantais] = React.useState<string[]>([])
    const [kategoriMdlId, setKategoriMdlId] = React.useState("")
    const [subKategoriMdlId, setSubKategoriMdlId] = React.useState("")
    const [lokasiMdlId, setLokasiMdlId] = React.useState("")
    const [subKategoriPopoverOpen, setSubKategoriPopoverOpen] = React.useState(false)
    const [lokasiPopoverOpen, setLokasiPopoverOpen] = React.useState(false)
    const [selectedBarangIds, setSelectedBarangIds] = React.useState<number[]>([])
    const [barangSearch, setBarangSearch] = React.useState("")
    const [kodeMdl, setKodeMdl] = React.useState("")

    // Fetch lists
    const { data: kategoriRes } = useQuery({
        queryKey: ["kategori-mdl-options"],
        queryFn: () => KategoriMDLService.getKategori({ per_page: -1 }),
        enabled: open
    })
    const { data: subKategoriRes } = useQuery({
        queryKey: ["sub-kategori-mdl-options"],
        queryFn: () => SubKategoriMDLService.getSubKategori({ per_page: -1 }),
        enabled: open
    })
    const { data: lokasiRes } = useQuery({
        queryKey: ["lokasi-mdl-options"],
        queryFn: () => LokasiMDLService.getLokasi({ per_page: -1 }),
        enabled: open
    })
    const { data: barangRes } = useQuery({
        queryKey: ["barang-options"],
        queryFn: () => BarangService.getBarang({ per_page: -1 }),
        enabled: open
    })

    const kategoriOptions = kategoriRes?.data || []
    const subKategoriOptions = subKategoriRes?.data || []
    const lokasiOptions = lokasiRes?.data || []
    const barangOptions = barangRes?.data || []

    const filteredBarangOptions = barangOptions
        .filter(b =>
            b.nama.toLowerCase().includes(barangSearch.toLowerCase()) ||
            b.kode.toLowerCase().includes(barangSearch.toLowerCase())
        )
        .sort((a, b) => {
            const aSelected = selectedBarangIds.includes(a.id) ? 1 : 0
            const bSelected = selectedBarangIds.includes(b.id) ? 1 : 0
            
            // Urutkan item terpilih ke paling atas
            if (aSelected !== bSelected) {
                return bSelected - aSelected
            }
            
            // Urutkan alfabetis berdasarkan nama barang
            return a.nama.localeCompare(b.nama)
        })

    React.useEffect(() => {
        if (mdl) {
            const floors = mdl.lantai
                ? mdl.lantai.split(",").map(f => f.trim().toUpperCase().replace("LANTAI", "").trim())
                : []
            setSelectedLantais(floors)
            setKategoriMdlId(mdl.kategori_mdl_id?.toString() || "")
            setSubKategoriMdlId(mdl.sub_kategori_mdl_id?.toString() || "")
            setLokasiMdlId(mdl.lokasi_mdl_id?.toString() || "")
            setSelectedBarangIds(mdl.barang_id ? [mdl.barang_id] : [])
            setKodeMdl(mdl.kode_mdl || "")
            setBarangSearch("")
        } else {
            setSelectedLantais([])
            setKategoriMdlId("")
            setSubKategoriMdlId("")
            setLokasiMdlId("")
            setSelectedBarangIds([])
            setKodeMdl("")
            setBarangSearch("")
        }
    }, [mdl, open])

    // Code generation
    React.useEffect(() => {
        if (!mdl && open) {
            const kat = kategoriOptions.find(x => x.id.toString() === kategoriMdlId)?.kode || ""
            const sub = subKategoriOptions.find(x => x.id.toString() === subKategoriMdlId)?.kode || ""
            const lok = lokasiOptions.find(x => x.id.toString() === lokasiMdlId)?.kode || ""
            
            if (selectedBarangIds.length === 1) {
                const brg = barangOptions.find(x => x.id === selectedBarangIds[0])?.kode || ""
                const parts = [kat, sub, lok, brg].filter(Boolean)
                setKodeMdl(parts.join("-"))
            } else if (selectedBarangIds.length > 1) {
                setKodeMdl("AUTO-GENERATED")
            } else {
                const parts = [kat, sub, lok].filter(Boolean)
                setKodeMdl(parts.join("-"))
            }
        }
    }, [kategoriMdlId, subKategoriMdlId, lokasiMdlId, selectedBarangIds, kategoriOptions, subKategoriOptions, lokasiOptions, barangOptions, mdl, open])

    const mutation = useMutation({
        mutationFn: (data: any) => {
            if (mdl) {
                return MdlService.updateMdl(mdl.id, data)
            }
            return MdlService.createMdl(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["mdl-list"] })
            toast.success(mdl ? "Data MDL berhasil diperbarui" : "Data MDL berhasil ditambahkan")
            onOpenChange(false)
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Terjadi kesalahan")
        }
    })

    const toggleSelectBarang = (id: number) => {
        if (mdl) {
            // Edit mode: only single select
            setSelectedBarangIds([id])
        } else {
            // Add mode: multi select
            if (selectedBarangIds.includes(id)) {
                setSelectedBarangIds(selectedBarangIds.filter(x => x !== id))
            } else {
                setSelectedBarangIds([...selectedBarangIds, id])
            }
        }
    }

    const isAllBarangSelected = filteredBarangOptions.length > 0 && filteredBarangOptions.every(b => selectedBarangIds.includes(b.id))
    const isSomeBarangSelected = filteredBarangOptions.length > 0 && filteredBarangOptions.some(b => selectedBarangIds.includes(b.id)) && !isAllBarangSelected

    const handleSelectAllBarang = () => {
        if (mdl) return // No select all in edit mode
        if (isAllBarangSelected) {
            const filteredIds = filteredBarangOptions.map(b => b.id)
            setSelectedBarangIds(selectedBarangIds.filter(id => !filteredIds.includes(id)))
        } else {
            const newIds = filteredBarangOptions.map(b => b.id).filter(id => !selectedBarangIds.includes(id))
            setSelectedBarangIds([...selectedBarangIds, ...newIds])
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (selectedLantais.length === 0) {
            toast.error("Pilih minimal satu lantai")
            return
        }
        if (selectedBarangIds.length === 0) {
            toast.error("Pilih minimal satu barang")
            return
        }

        const payload: any = {
            lantai: selectedLantais.join(", "),
            kategori_mdl_id: kategoriMdlId ? Number(kategoriMdlId) : null,
            sub_kategori_mdl_id: subKategoriMdlId ? Number(subKategoriMdlId) : null,
            lokasi_mdl_id: lokasiMdlId ? Number(lokasiMdlId) : null,
        }

        if (mdl) {
            payload.barang_id = selectedBarangIds[0]
            payload.kode_mdl = kodeMdl
        } else {
            payload.barang_ids = selectedBarangIds
        }

        mutation.mutate(payload)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="min-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] flex flex-col p-6 overflow-hidden">
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                    <DialogHeader className="shrink-0 pb-2">
                        <DialogTitle>{mdl ? "Edit Data MDL" : "Tambah Data MDL"}</DialogTitle>
                        <DialogDescription>
                            {mdl ? "Perbarui informasi data MDL." : "Tambah data MDL baru ke sistem dengan memilih satu atau beberapa barang sekaligus."}
                        </DialogDescription>
                    </DialogHeader>
                    
                    {/* Scrollable container for Form Fields */}
                    <div className="flex-1 min-h-0 pr-1 py-4 space-y-4 flex flex-col overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-neutral-50/50 p-4 rounded-xl border border-neutral-100 shrink-0">
                            {/* Kategori MDL */}
                            <div className="grid gap-2">
                                <Label htmlFor="kategori">Kategori MDL</Label>
                                <select
                                    id="kategori"
                                    value={kategoriMdlId}
                                    onChange={(e) => setKategoriMdlId(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                                    required
                                >
                                    <option value="">-- Pilih Kategori --</option>
                                    {kategoriOptions.map(o => (
                                        <option key={o.id} value={o.id}>{o.nama} ({o.kode})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Sub Kategori MDL */}
                            <div className="grid gap-2">
                                <Label htmlFor="sub_kategori">Sub Kategori MDL</Label>
                                <Popover open={subKategoriPopoverOpen} onOpenChange={setSubKategoriPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="sub_kategori"
                                            type="button"
                                            variant="outline"
                                            className="w-full justify-between font-normal h-10 border-neutral-200 text-left px-3 text-neutral-800 bg-white hover:bg-neutral-50"
                                        >
                                            <span className="truncate">
                                                {subKategoriMdlId
                                                    ? subKategoriOptions.find(o => o.id.toString() === subKategoriMdlId)?.nama || "-- Pilih Sub Kategori --"
                                                    : "-- Pilih Sub Kategori --"}
                                            </span>
                                            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Cari sub kategori..." className="h-9" />
                                            <CommandList>
                                                <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                                                <CommandGroup>
                                                    {subKategoriOptions.map((o) => (
                                                        <CommandItem
                                                            key={o.id}
                                                            value={o.nama}
                                                            onSelect={() => {
                                                                setSubKategoriMdlId(o.id.toString())
                                                                setSubKategoriPopoverOpen(false)
                                                            }}
                                                            className="text-xs"
                                                        >
                                                            <Check
                                                                className={`mr-2 h-3.5 w-3.5 ${
                                                                    o.id.toString() === subKategoriMdlId
                                                                        ? "opacity-100"
                                                                        : "opacity-0"
                                                                }`}
                                                            />
                                                            {o.nama} ({o.kode})
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Lokasi MDL */}
                            <div className="grid gap-2">
                                <Label htmlFor="lokasi">Lokasi MDL</Label>
                                <Popover open={lokasiPopoverOpen} onOpenChange={setLokasiPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="lokasi"
                                            type="button"
                                            variant="outline"
                                            className="w-full justify-between font-normal h-10 border-neutral-200 text-left px-3 text-neutral-800 bg-white hover:bg-neutral-50"
                                        >
                                            <span className="truncate">
                                                {lokasiMdlId
                                                    ? lokasiOptions.find(o => o.id.toString() === lokasiMdlId)?.nama || "-- Pilih Lokasi --"
                                                    : "-- Pilih Lokasi --"}
                                            </span>
                                            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Cari lokasi..." className="h-9" />
                                            <CommandList>
                                                <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                                                <CommandGroup>
                                                    {lokasiOptions.map((o) => (
                                                        <CommandItem
                                                            key={o.id}
                                                            value={o.nama}
                                                            onSelect={() => {
                                                                setLokasiMdlId(o.id.toString())
                                                                setLokasiPopoverOpen(false)
                                                            }}
                                                            className="text-xs"
                                                        >
                                                            <Check
                                                                className={`mr-2 h-3.5 w-3.5 ${
                                                                    o.id.toString() === lokasiMdlId
                                                                        ? "opacity-100"
                                                                        : "opacity-0"
                                                                }`}
                                                            />
                                                            {o.nama} ({o.kode})
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Lantai (Popover Multi-select Dropdown) */}
                            <div className="grid gap-2">
                                <Label>Lantai</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full justify-between font-normal h-10 border-neutral-200 text-left px-3 text-neutral-800 bg-white hover:bg-neutral-50"
                                        >
                                            <span className="truncate">
                                                {selectedLantais.length > 0
                                                    ? `Lantai ${selectedLantais.join(", ")}`
                                                    : "-- Pilih Lantai --"}
                                            </span>
                                            <span className="text-xs text-neutral-400">({selectedLantais.length})</span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-56 p-2" align="start">
                                        <div className="space-y-1 max-h-60 overflow-y-auto">
                                            {LANTAI_OPTIONS.map((floor) => {
                                                const isChecked = selectedLantais.includes(floor)
                                                return (
                                                    <label
                                                        key={floor}
                                                        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-neutral-50 cursor-pointer text-xs font-medium text-neutral-700"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedLantais([...selectedLantais, floor])
                                                                } else {
                                                                    setSelectedLantais(selectedLantais.filter(f => f !== floor))
                                                                }
                                                            }}
                                                            className="h-4 w-4 rounded border-neutral-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                                                        />
                                                        <span>Lantai {floor}</span>
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* Kode MDL */}
                        <div className="grid gap-2 shrink-0">
                            <Label htmlFor="kode_mdl">Kode MDL</Label>
                            <Input
                                id="kode_mdl"
                                value={kodeMdl}
                                onChange={(e) => setKodeMdl(e.target.value.toUpperCase())}
                                placeholder="Otomatis atau ketik manual"
                                className="uppercase font-mono"
                                disabled={selectedBarangIds.length > 1}
                                required
                            />
                            {selectedBarangIds.length > 1 && (
                                <p className="text-xs text-orange-600 font-medium">
                                    * Kode MDL akan otomatis di-generate secara individual untuk setiap barang yang dipilih.
                                </p>
                            )}
                        </div>

                        {/* Barang Selection (Multi-select Table - Flex-1) */}
                        <div className="flex-1 min-h-0 flex flex-col gap-2 pt-2">
                            <div className="flex items-center justify-between shrink-0">
                                <Label className="text-sm font-semibold">Pilih Barang ({selectedBarangIds.length} terpilih)</Label>
                                <div className="relative w-64">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                                    <Input
                                        placeholder="Cari nama atau kode barang..."
                                        value={barangSearch}
                                        onChange={(e) => setBarangSearch(e.target.value)}
                                        className="h-8 pl-8 text-xs bg-neutral-50"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 min-h-0 overflow-y-auto border border-neutral-200 rounded-lg">
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead className="bg-neutral-50 sticky top-0 border-b border-neutral-200 z-10">
                                        <tr>
                                            <th className="p-3">Kode Barang</th>
                                            <th className="p-3">Nama Barang</th>
                                            <th className="p-3">Satuan</th>
                                            <th className="p-3 text-center w-12">
                                                {!mdl && (
                                                    <input
                                                        type="checkbox"
                                                        checked={isAllBarangSelected}
                                                        ref={(el) => {
                                                            if (el) {
                                                                el.indeterminate = isSomeBarangSelected
                                                              }
                                                        }}
                                                        onChange={handleSelectAllBarang}
                                                        className="h-4 w-4 rounded border-neutral-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                                                    />
                                                )}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        {filteredBarangOptions.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="p-4 text-center text-neutral-400 text-xs">
                                                    Tidak ada barang yang cocok.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredBarangOptions.map((b) => {
                                                const isSelected = selectedBarangIds.includes(b.id)
                                                return (
                                                    <tr 
                                                        key={b.id}
                                                        onClick={() => toggleSelectBarang(b.id)}
                                                        className={`hover:bg-neutral-50/80 cursor-pointer transition-colors ${isSelected ? "bg-orange-50/40" : ""}`}
                                                    >
                                                        <td className="p-3 font-mono font-medium text-neutral-600">{b.kode}</td>
                                                        <td className="p-3 font-semibold text-neutral-800">{b.nama}</td>
                                                        <td className="p-3 text-neutral-550">{b.satuan || "-"}</td>
                                                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => toggleSelectBarang(b.id)}
                                                                className="h-4 w-4 rounded border-neutral-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                                                            />
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="shrink-0 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={mutation.isPending} className="bg-orange-600 hover:bg-orange-700 text-white">
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {mdl ? "Simpan Perubahan" : `Tambah ${selectedBarangIds.length} Data`}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
