"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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
import { KategoriMDLService, KategoriMDL } from "@/features/kategori-mdl/services/kategori-mdl-service"

interface KategoriFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    kategori?: KategoriMDL | null
}

export function KategoriFormDialog({ open, onOpenChange, kategori }: KategoriFormDialogProps) {
    const queryClient = useQueryClient()
    const [nama, setNama] = React.useState("")
    const [kode, setKode] = React.useState("")

    React.useEffect(() => {
        if (kategori) {
            setNama(kategori.nama || "")
            setKode(kategori.kode || "")
        } else {
            setNama("")
            setKode("")
        }
    }, [kategori, open])

    const mutation = useMutation({
        mutationFn: (data: Partial<KategoriMDL>) => {
            if (kategori) {
                return KategoriMDLService.updateKategori(kategori.id, data)
            }
            return KategoriMDLService.createKategori(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["kategori-mdl"] })
            toast.success(kategori ? "Kategori MDL berhasil diperbarui" : "Kategori MDL berhasil ditambahkan")
            onOpenChange(false)
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Terjadi kesalahan")
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        mutation.mutate({
            nama,
            kode
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{kategori ? "Edit Kategori MDL" : "Tambah Kategori MDL"}</DialogTitle>
                        <DialogDescription>
                            {kategori ? "Perbarui informasi kategori MDL." : "Tambah kategori MDL baru ke sistem."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="nama">Nama Kategori</Label>
                            <Input
                                id="nama"
                                value={nama}
                                onChange={(e) => setNama(e.target.value.toUpperCase())}
                                placeholder="Contoh: PADMA"
                                className="uppercase"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="kode">Kode Kategori</Label>
                            <Input
                                id="kode"
                                value={kode}
                                onChange={(e) => setKode(e.target.value.toUpperCase())}
                                placeholder="Contoh: PDM"
                                className="uppercase"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={mutation.isPending} className="bg-orange-600 hover:bg-orange-700 text-white">
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {kategori ? "Simpan Perubahan" : "Tambah Kategori"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
