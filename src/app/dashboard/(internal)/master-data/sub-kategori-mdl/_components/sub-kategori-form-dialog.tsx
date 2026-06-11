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
import { SubKategoriMDLService, SubKategoriMDL } from "@/features/sub-kategori-mdl/services/sub-kategori-mdl-service"

interface SubKategoriFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    subKategori?: SubKategoriMDL | null
}

export function SubKategoriFormDialog({ open, onOpenChange, subKategori }: SubKategoriFormDialogProps) {
    const queryClient = useQueryClient()
    const [nama, setNama] = React.useState("")
    const [kode, setKode] = React.useState("")

    React.useEffect(() => {
        if (subKategori) {
            setNama(subKategori.nama || "")
            setKode(subKategori.kode || "")
        } else {
            setNama("")
            setKode("")
        }
    }, [subKategori, open])

    const mutation = useMutation({
        mutationFn: (data: Partial<SubKategoriMDL>) => {
            if (subKategori) {
                return SubKategoriMDLService.updateSubKategori(subKategori.id, data)
            }
            return SubKategoriMDLService.createSubKategori(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sub-kategori-mdl"] })
            toast.success(subKategori ? "Sub kategori berhasil diperbarui" : "Sub kategori berhasil ditambahkan")
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
                        <DialogTitle>{subKategori ? "Edit Sub Kategori MDL" : "Tambah Sub Kategori MDL"}</DialogTitle>
                        <DialogDescription>
                            {subKategori ? "Perbarui informasi sub kategori MDL." : "Tambah sub kategori MDL baru ke sistem."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="nama">Nama Sub Kategori</Label>
                            <Input
                                id="nama"
                                value={nama}
                                onChange={(e) => setNama(e.target.value.toUpperCase())}
                                placeholder="Contoh: IGD PADMA"
                                className="uppercase"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="kode">Kode Sub Kategori</Label>
                            <Input
                                id="kode"
                                value={kode}
                                onChange={(e) => setKode(e.target.value.toUpperCase())}
                                placeholder="Contoh: IGDPDM"
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
                            {subKategori ? "Simpan Perubahan" : "Tambah Sub Kategori"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
