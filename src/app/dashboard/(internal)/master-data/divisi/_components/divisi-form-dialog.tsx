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
import { Switch } from "@/components/ui/switch"
import { projectV2Service, Divisi } from "@/features/projects/services/project-v2-service"

interface DivisiFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    divisi?: Divisi | null
}

export function DivisiFormDialog({ open, onOpenChange, divisi }: DivisiFormDialogProps) {
    const queryClient = useQueryClient()
    const [nama, setNama] = React.useState("")
    const [namaPanjang, setNamaPanjang] = React.useState("")
    const [isDpsaGroup, setIsDpsaGroup] = React.useState(false)
    const [urutan, setUrutan] = React.useState<string>("")

    React.useEffect(() => {
        if (divisi) {
            setNama(divisi.nama)
            setNamaPanjang(divisi.nama_panjang || "")
            setIsDpsaGroup(Boolean(divisi.is_dpsa_group))
            setUrutan(divisi.urutan !== null && divisi.urutan !== undefined ? String(divisi.urutan) : "")
        } else {
            setNama("")
            setNamaPanjang("")
            setIsDpsaGroup(false)
            setUrutan("")
        }
    }, [divisi, open])

    const mutation = useMutation({
        mutationFn: (data: {
            nama: string
            nama_panjang?: string
            is_dpsa_group?: boolean
            urutan?: number | null
        }) => {
            if (divisi) {
                return projectV2Service.updateDivisi(divisi.id, data)
            }
            return projectV2Service.createDivisi(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["divisions"] })
            toast.success(divisi ? "Divisi berhasil diperbarui" : "Divisi berhasil ditambahkan")
            onOpenChange(false)
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Terjadi kesalahan saat menyimpan divisi")
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        mutation.mutate({
            nama,
            nama_panjang: namaPanjang || undefined,
            is_dpsa_group: isDpsaGroup,
            urutan: urutan === "" ? null : Number(urutan)
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[440px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{divisi ? "Edit Divisi" : "Tambah Divisi"}</DialogTitle>
                        <DialogDescription>
                            {divisi ? "Perbarui informasi divisi." : "Tambah divisi baru ke sistem."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="nama">Nama Divisi</Label>
                            <Input
                                id="nama"
                                value={nama}
                                onChange={(e) => setNama(e.target.value)}
                                placeholder="Contoh: Workshop"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="nama_panjang">Nama Panjang (Opsional)</Label>
                            <Input
                                id="nama_panjang"
                                value={namaPanjang}
                                onChange={(e) => setNamaPanjang(e.target.value)}
                                placeholder="Contoh: Divisi Produksi Workshop"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="urutan">Urutan (Opsional)</Label>
                            <Input
                                id="urutan"
                                type="number"
                                value={urutan}
                                onChange={(e) => setUrutan(e.target.value)}
                                placeholder="Contoh: 1"
                                min={0}
                            />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 shadow-sm bg-neutral-50/50">
                            <div className="space-y-0.5">
                                <Label htmlFor="is_dpsa_group" className="text-sm font-medium cursor-pointer">
                                    DPSA GROUP
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    {isDpsaGroup ? "Ya (Termasuk grup DPSA)" : "Tidak (Bukan grup DPSA)"}
                                </p>
                            </div>
                            <Switch
                                id="is_dpsa_group"
                                checked={isDpsaGroup}
                                onCheckedChange={setIsDpsaGroup}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {divisi ? "Simpan Perubahan" : "Tambah Divisi"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
