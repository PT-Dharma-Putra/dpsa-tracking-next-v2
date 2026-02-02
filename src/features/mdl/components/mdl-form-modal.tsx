"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { MDLItem } from "../types"
import { mdlService } from "../api/mdl-service"
import { MDL_CATEGORIES } from "../constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Upload, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const itemSchema = z.object({
    kategori_mdl: z.string().min(1, "Wajib diisi"),
    sub_kategori: z.string().optional(),
    lokasi_ruangan: z.string().optional(),
    kode_barang: z.string().optional(),
    nama_barang: z.string().min(3, "Minimal 3 karakter"),
    spesifikasi_dan_material: z.string().optional(),

    // Dimensi (bisa null/empty string saat input, handle parsing manual)
    dimensi_panjang: z.coerce.number().optional(),
    dimensi_lebar: z.coerce.number().optional(),
    dimensi_tinggi: z.coerce.number().optional(),
    volume: z.coerce.number().optional(),

    kode_satuan_beli: z.string().optional(),
    nama_satuan_beli: z.string().optional(),

    harga_jabodetabek: z.coerce.number().optional(),
    harga_pulau_jawa: z.coerce.number().optional(),
    harga_luar_jawa: z.coerce.number().optional(),

    prioritas_garansi: z.string().optional(),
    link_gambar_kerja: z.string().optional(),
})

interface MDLFormModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item?: MDLItem | null
    onSuccess: () => void
}

export function MDLFormModal({ open, onOpenChange, item, onSuccess }: MDLFormModalProps) {

    const [isLoading, setIsLoading] = useState(false)


    const form = useForm<z.infer<typeof itemSchema>>({
        resolver: zodResolver(itemSchema) as any,
        defaultValues: {
            kategori_mdl: "",
            sub_kategori: "",
            nama_barang: "",
            kode_barang: "",
            lokasi_ruangan: "",
            spesifikasi_dan_material: "",
            prioritas_garansi: "1 Bulan",
            nama_satuan_beli: "UNIT",
            // prices defaults
            harga_jabodetabek: 0,
            harga_pulau_jawa: 0,
            harga_luar_jawa: 0,
        },
    })

    // Reset Form when item/open changes
    useEffect(() => {
        if (open) {
            if (item) {
                form.reset({
                    kategori_mdl: item.kategori_mdl,
                    sub_kategori: item.sub_kategori || "",
                    lokasi_ruangan: item.lokasi_ruangan || "",
                    kode_barang: item.kode_barang || "",
                    nama_barang: item.nama_barang,
                    spesifikasi_dan_material: item.spesifikasi_dan_material || "",
                    dimensi_panjang: item.dimensi_panjang,
                    dimensi_lebar: item.dimensi_lebar,
                    dimensi_tinggi: item.dimensi_tinggi,
                    volume: item.volume,
                    kode_satuan_beli: item.kode_satuan_beli || "",
                    nama_satuan_beli: item.nama_satuan_beli || "",
                    harga_jabodetabek: item.harga_jabodetabek,
                    harga_pulau_jawa: item.harga_pulau_jawa,
                    harga_luar_jawa: item.harga_luar_jawa,
                    prioritas_garansi: item.prioritas_garansi || "",
                    link_gambar_kerja: item.link_gambar_kerja || "",
                })
            } else {
                form.reset({
                    kategori_mdl: "",
                    sub_kategori: "",
                    nama_barang: "",
                    prioritas_garansi: "6 Bulan",
                    nama_satuan_beli: "UNIT",
                    harga_jabodetabek: 0,
                    harga_pulau_jawa: 0,
                    harga_luar_jawa: 0,
                })
            }
        }
    }, [item, open, form])

    // Auto-Calculate Volume if needed (simple PxLxT)
    function calculateVolume() {
        const p = form.getValues('dimensi_panjang') || 0
        const l = form.getValues('dimensi_lebar') || 0
        const t = form.getValues('dimensi_tinggi') || 0
        if (p && l && t) {
            const vol = (p * l * t).toFixed(4)
            form.setValue('volume', parseFloat(vol))
        }
    }

    async function onSubmit(values: z.infer<typeof itemSchema>) {
        setIsLoading(true)
        try {
            let savedItem;

            if (item) {
                savedItem = await mdlService.updateItem(item.id, values)
                toast.success("Item berhasil diperbarui")
            } else {
                savedItem = await mdlService.createItem(values)
                toast.success("Item berhasil dibuat")
            }



            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            console.error(error)
            console.error(error)
            toast.error(error.response?.data?.message || "Terjadi kesalahan sistem")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{item ? 'Edit Item MDL' : 'Tambah Item Baru'}</DialogTitle>
                    <DialogDescription>
                        Isi form di bawah untuk {item ? 'mengubah' : 'menambah'} data master barang.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <Tabs defaultValue="main" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="main">Informasi Utama</TabsTrigger>
                                <TabsTrigger value="specs">Dimensi & Spek</TabsTrigger>
                                <TabsTrigger value="pricing">Harga & Lainnya</TabsTrigger>
                            </TabsList>

                            {/* TAB 1: MAIN INFO */}
                            <TabsContent value="main" className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="kategori_mdl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Kategori *</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Pilih Kategori" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {MDL_CATEGORIES.map(cat => (
                                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="sub_kategori"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Sub Kategori</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Contoh: Meja, Kursi" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="nama_barang"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nama Barang *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nama lengkap item..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="kode_barang"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Kode Barang (Opsional)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Kode unik" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="lokasi_ruangan"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Lokasi / Ruangan</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Gudang A / Ruang Tamu" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>


                            </TabsContent>

                            {/* TAB 2: SPECS */}
                            <TabsContent value="specs" className="space-y-4 py-4">
                                <FormLabel>Dimensi (meter)</FormLabel>
                                <div className="grid grid-cols-4 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="dimensi_panjang"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Panjang</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} onChange={e => { field.onChange(e); calculateVolume(); }} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="dimensi_lebar"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Lebar</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} onChange={e => { field.onChange(e); calculateVolume(); }} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="dimensi_tinggi"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Tinggi</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} onChange={e => { field.onChange(e); calculateVolume(); }} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="volume"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Volume (m³)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.0001" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="spesifikasi_dan_material"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Spesifikasi & Material</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Detail material, finishing, dll..." className="min-h-[120px]" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="link_gambar_kerja"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Link Gambar Kerja (URL)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://drive.google.com/..." {...field} />
                                            </FormControl>
                                            <FormDescription className="text-xs">Link ke Google Drive atau penyimpanan cloud lainnya.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </TabsContent>

                            {/* TAB 3: PRICING */}
                            <TabsContent value="pricing" className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="nama_satuan_beli"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Satuan</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="UNIT / SET / M2" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="prioritas_garansi"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Garansi</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Contoh: 1 Tahun" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="space-y-3 pt-2">
                                    <h4 className="text-sm font-medium border-b pb-2">Daftar Harga</h4>
                                    <FormField
                                        control={form.control}
                                        name="harga_pulau_jawa"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Harga Pulau Jawa (Utama)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="harga_jabodetabek"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Harga Jabodetabek</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="harga_luar_jawa"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Harga Luar Jawa</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
                            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {item ? 'Simpan Perubahan' : 'Buat Item Baru'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
