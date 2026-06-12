"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { BarangService, Barang } from "@/features/barang/services/barang-service"
import { JenisBarangService } from "@/features/barang/services/jenis-barang-service"

interface BarangFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    barang?: Barang | null
}

/**
 * Generates a kode from nama:
 * - Takes first 3 letters of each word
 * - Appends any digits found in that word
 * - Joins parts with "-"
 * Example: "MEJA 120" → "MEJ-120", "KURSI KERJA" → "KUR-KER"
 */
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

function formatRupiah(value: string | number): string {
    if (value === null || value === undefined || value === "") return ""
    const numberString = String(value).replace(/[^0-9]/g, "")
    if (!numberString) return ""
    const parsed = parseInt(numberString, 10)
    return parsed.toLocaleString("id-ID")
}

function parseRupiah(value: string): number | null {
    if (!value) return null
    const clean = value.replace(/[^0-9]/g, "")
    return clean ? parseInt(clean, 10) : null
}

const emptyForm = {
    nama: "",
    kode: "",
    spesifikasi: "",
    panjang: "",
    lebar: "",
    tinggi: "",
    satuan: "",
    harga: "",
    garansi: "",
    link_gambar_kerja: "",
    jenis_barang_id: "",
}

export function BarangFormDialog({ open, onOpenChange, barang }: BarangFormDialogProps) {
    const queryClient = useQueryClient()
    const [form, setForm] = React.useState(emptyForm)

    const { data: jenisBarangList = [] } = useQuery({
        queryKey: ["jenis-barang"],
        queryFn: () => JenisBarangService.getAll(),
    })

    React.useEffect(() => {
        if (barang) {
            setForm({
                nama: barang.nama ?? "",
                kode: barang.kode ?? "",
                spesifikasi: barang.spesifikasi ?? "",
                panjang: barang.panjang != null ? String(barang.panjang) : "",
                lebar: barang.lebar != null ? String(barang.lebar) : "",
                tinggi: barang.tinggi != null ? String(barang.tinggi) : "",
                satuan: barang.satuan ?? "",
                harga: barang.harga != null ? formatRupiah(barang.harga) : "",
                garansi: barang.garansi ?? "",
                link_gambar_kerja: barang.link_gambar_kerja ?? "",
                jenis_barang_id: barang.jenis_barang_id != null ? String(barang.jenis_barang_id) : "",
            })
        } else {
            setForm(emptyForm)
        }
    }, [barang, open])

    const set = (key: keyof typeof emptyForm) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const val = e.target.value
        const upperFields = ["nama", "kode", "spesifikasi"]
        const newVal = upperFields.includes(key) ? val.toUpperCase() : val
        setForm(prev => {
            const updated = { ...prev, [key]: newVal }
            // Auto-generate kode when nama changes
            if (key === "nama") {
                updated.kode = generateKode(newVal)
            }
            return updated
        })
    }

    const handleHargaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setForm(prev => ({ ...prev, harga: formatRupiah(val) }))
    }

    const mutation = useMutation({
        mutationFn: (data: Partial<Barang>) =>
            barang
                ? BarangService.updateBarang(barang.id, data)
                : BarangService.createBarang(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["barang"] })
            toast.success(barang ? "Barang berhasil diperbarui" : "Barang berhasil ditambahkan")
            onOpenChange(false)
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Terjadi kesalahan")
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        mutation.mutate({
            nama: form.nama,
            kode: form.kode,
            spesifikasi: form.spesifikasi || null,
            panjang: form.panjang !== "" ? Number(form.panjang) : null,
            lebar: form.lebar !== "" ? Number(form.lebar) : null,
            tinggi: form.tinggi !== "" ? Number(form.tinggi) : null,
            satuan: form.satuan || null,
            harga: form.harga !== "" ? parseRupiah(form.harga) : null,
            garansi: form.garansi || null,
            link_gambar_kerja: form.link_gambar_kerja || null,
            jenis_barang_id: form.jenis_barang_id !== "" ? Number(form.jenis_barang_id) : null,
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{barang ? "Edit Barang" : "Tambah Barang"}</DialogTitle>
                        <DialogDescription>
                            {barang ? "Perbarui informasi barang." : "Tambah data barang baru ke sistem."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Row 1: Nama & Kode */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="nama">Nama Barang <span className="text-red-500">*</span></Label>
                                <Input
                                    id="nama"
                                    value={form.nama}
                                    onChange={set("nama")}
                                    placeholder="Contoh: COUNTER (AM)"
                                    className="uppercase"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="kode">Kode Barang <span className="text-red-500">*</span></Label>
                                <Input
                                    id="kode"
                                    value={form.kode}
                                    onChange={set("kode")}
                                    placeholder="Contoh: CNTR"
                                    className="uppercase"
                                    required
                                />
                            </div>
                        </div>

                        {/* Jenis */}
                        <div className="grid gap-2">
                            <Label htmlFor="jenis_barang_id">Jenis</Label>
                            <Select
                                value={form.jenis_barang_id}
                                onValueChange={(val) => setForm(prev => ({ ...prev, jenis_barang_id: val }))}
                            >
                                <SelectTrigger id="jenis_barang_id">
                                    <SelectValue placeholder="Pilih jenis..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {jenisBarangList.map((j) => (
                                        <SelectItem key={j.id} value={String(j.id)}>{j.nama}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Spesifikasi */}
                        <div className="grid gap-2">
                            <Label htmlFor="spesifikasi">Spesifikasi</Label>
                            <Textarea
                                id="spesifikasi"
                                value={form.spesifikasi}
                                onChange={set("spesifikasi")}
                                placeholder="Masukkan spesifikasi barang..."
                                className="uppercase resize-none"
                                rows={3}
                            />
                        </div>

                        {/* Row 2: Satuan & Garansi */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="satuan">Satuan</Label>
                                <Select
                                    value={form.satuan}
                                    onValueChange={(val) => setForm(prev => ({ ...prev, satuan: val }))}
                                >
                                    <SelectTrigger id="satuan">
                                        <SelectValue placeholder="Pilih satuan..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="M1">M1</SelectItem>
                                        <SelectItem value="M2">M2</SelectItem>
                                        <SelectItem value="UNIT">UNIT</SelectItem>
                                        <SelectItem value="SET">SET</SelectItem>
                                        <SelectItem value="PCS">PCS</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="garansi">Garansi</Label>
                                <Select
                                    value={form.garansi}
                                    onValueChange={(val) => setForm(prev => ({ ...prev, garansi: val }))}
                                >
                                    <SelectTrigger id="garansi">
                                        <SelectValue placeholder="Pilih garansi..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="3 BULAN">3 BULAN</SelectItem>
                                        <SelectItem value="6 BULAN">6 BULAN</SelectItem>
                                        <SelectItem value="1 TAHUN">1 TAHUN</SelectItem>
                                        <SelectItem value="2 TAHUN">2 TAHUN</SelectItem>
                                        <SelectItem value="3 TAHUN">3 TAHUN</SelectItem>
                                        <SelectItem value="5 TAHUN">5 TAHUN</SelectItem>
                                        <SelectItem value="8 TAHUN">8 TAHUN</SelectItem>
                                        <SelectItem value="10 TAHUN">10 TAHUN</SelectItem>
                                        <SelectItem value="25 TAHUN">25 TAHUN</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Row 3: Dimensi */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="panjang">Panjang</Label>
                                <Input
                                    id="panjang"
                                    type="number"
                                    step="any"
                                    value={form.panjang}
                                    onChange={set("panjang")}
                                    placeholder="0"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="lebar">Lebar</Label>
                                <Input
                                    id="lebar"
                                    type="number"
                                    step="any"
                                    value={form.lebar}
                                    onChange={set("lebar")}
                                    placeholder="0"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="tinggi">Tinggi</Label>
                                <Input
                                    id="tinggi"
                                    type="number"
                                    step="any"
                                    value={form.tinggi}
                                    onChange={set("tinggi")}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Row 4: Harga */}
                        <div className="grid gap-2">
                            <Label htmlFor="harga">Harga</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-sm text-muted-foreground font-medium">Rp</span>
                                <Input
                                    id="harga"
                                    type="text"
                                    value={form.harga}
                                    onChange={handleHargaChange}
                                    placeholder="0"
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        {/* Row 6: Link Gambar Kerja */}
                        <div className="grid gap-2">
                            <Label htmlFor="link_gambar_kerja">Link Gambar Kerja</Label>
                            <Textarea
                                id="link_gambar_kerja"
                                value={form.link_gambar_kerja}
                                onChange={set("link_gambar_kerja")}
                                placeholder="https://..."
                                className="resize-none"
                                rows={2}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={mutation.isPending}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {barang ? "Simpan Perubahan" : "Tambah Barang"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
