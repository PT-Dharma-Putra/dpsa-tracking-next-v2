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
import { Textarea } from "@/components/ui/textarea"
import { RegionalHerminaService, RegionalHermina } from "@/features/regional-hermina/services/regional-hermina-service"

interface RegionalHerminaFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    regionalHermina?: RegionalHermina | null
}

export function RegionalHerminaFormDialog({ open, onOpenChange, regionalHermina }: RegionalHerminaFormDialogProps) {
    const queryClient = useQueryClient()
    const [regional, setRegional] = React.useState("")
    const [angkaRomawi, setAngkaRomawi] = React.useState("")
    const [namaDirektur, setNamaDirektur] = React.useState("")
    const [keterangan, setKeterangan] = React.useState("")

    React.useEffect(() => {
        if (regionalHermina) {
            setRegional(regionalHermina.regional || "")
            setAngkaRomawi(regionalHermina.angka_romawi || "")
            setNamaDirektur(regionalHermina.nama_direktur || "")
            setKeterangan(regionalHermina.keterangan || "")
        } else {
            setRegional("")
            setAngkaRomawi("")
            setNamaDirektur("")
            setKeterangan("")
        }
    }, [regionalHermina, open])

    const mutation = useMutation({
        mutationFn: (data: Partial<RegionalHermina>) => {
            if (regionalHermina) {
                return RegionalHerminaService.updateRegionalHermina(regionalHermina.id, data)
            }
            return RegionalHerminaService.createRegionalHermina(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["regional-hermina"] })
            toast.success(regionalHermina ? "Regional Hermina berhasil diperbarui" : "Regional Hermina berhasil ditambahkan")
            onOpenChange(false)
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Terjadi kesalahan saat menyimpan data")
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        mutation.mutate({
            regional,
            angka_romawi: angkaRomawi || null,
            nama_direktur: namaDirektur || null,
            keterangan: keterangan || null,
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{regionalHermina ? "Edit Regional Hermina" : "Tambah Regional Hermina"}</DialogTitle>
                        <DialogDescription>
                            {regionalHermina ? "Perbarui informasi regional Hermina." : "Tambah data regional Hermina baru ke sistem."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2 grid gap-2">
                                <Label htmlFor="regional">Regional <span className="text-red-500">*</span></Label>
                                <Input
                                    id="regional"
                                    value={regional}
                                    onChange={(e) => setRegional(e.target.value)}
                                    placeholder="Contoh: Regional 1"
                                    required
                                />
                            </div>
                            <div className="col-span-1 grid gap-2">
                                <Label htmlFor="angka_romawi">Angka Romawi</Label>
                                <Input
                                    id="angka_romawi"
                                    value={angkaRomawi}
                                    onChange={(e) => setAngkaRomawi(e.target.value)}
                                    placeholder="Contoh: I"
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="nama_direktur">Nama Direktur</Label>
                            <Input
                                id="nama_direktur"
                                value={namaDirektur}
                                onChange={(e) => setNamaDirektur(e.target.value)}
                                placeholder="Contoh: dr. Nama Direktur, MARS"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="keterangan">Keterangan</Label>
                            <Textarea
                                id="keterangan"
                                value={keterangan}
                                onChange={(e) => setKeterangan(e.target.value)}
                                placeholder="Tambahkan catatan atau cakupan wilayah..."
                                className="min-h-[90px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={mutation.isPending} className="bg-orange-600 hover:bg-orange-700 text-white">
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {regionalHermina ? "Simpan Perubahan" : "Tambah Regional"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
