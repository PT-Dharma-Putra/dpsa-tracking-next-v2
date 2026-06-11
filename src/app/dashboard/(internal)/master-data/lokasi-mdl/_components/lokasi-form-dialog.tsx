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
import { LokasiMDLService, LokasiMDL } from "@/features/lokasi-mdl/services/lokasi-mdl-service"

interface LokasiFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    lokasi?: LokasiMDL | null
}

export function LokasiFormDialog({ open, onOpenChange, lokasi }: LokasiFormDialogProps) {
    const queryClient = useQueryClient()
    const [nama, setNama] = React.useState("")
    const [kode, setKode] = React.useState("")

    React.useEffect(() => {
        if (lokasi) {
            setNama(lokasi.nama || "")
            setKode(lokasi.kode || "")
        } else {
            setNama("")
            setKode("")
        }
    }, [lokasi, open])

    const mutation = useMutation({
        mutationFn: (data: Partial<LokasiMDL>) => {
            if (lokasi) {
                return LokasiMDLService.updateLokasi(lokasi.id, data)
            }
            return LokasiMDLService.createLokasi(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lokasi-mdl"] })
            toast.success(lokasi ? "Lokasi berhasil diperbarui" : "Lokasi berhasil ditambahkan")
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
                        <DialogTitle>{lokasi ? "Edit Lokasi MDL" : "Tambah Lokasi MDL"}</DialogTitle>
                        <DialogDescription>
                            {lokasi ? "Perbarui informasi lokasi MDL." : "Tambah lokasi MDL baru ke sistem."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="nama">Nama Lokasi/Ruang</Label>
                            <Input
                                id="nama"
                                value={nama}
                                onChange={(e) => setNama(e.target.value.toUpperCase())}
                                placeholder="Contoh: RADIOLOGI"
                                className="uppercase"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="kode">Kode Lokasi/Ruang</Label>
                            <Input
                                id="kode"
                                value={kode}
                                onChange={(e) => setKode(e.target.value.toUpperCase())}
                                placeholder="Contoh: RDLG"
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
                            {lokasi ? "Simpan Perubahan" : "Tambah Lokasi"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
