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
import { ClientService, Client } from "@/features/clients/services/client-service"

interface ClientFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    client?: Client | null
}

export function ClientFormDialog({ open, onOpenChange, client }: ClientFormDialogProps) {
    const queryClient = useQueryClient()
    const [kode, setKode] = React.useState("")
    const [name, setName] = React.useState("")
    const [email, setEmail] = React.useState("")
    const [phone, setPhone] = React.useState("")
    const [address, setAddress] = React.useState("")
    const [hermina, setHermina] = React.useState<number>(0)

    React.useEffect(() => {
        if (client) {
            setKode(client.kode !== null && client.kode !== undefined ? String(client.kode) : "")
            setName(client.name || "")
            setEmail(client.email || "")
            setPhone(client.phone || "")
            setAddress(client.address || "")
            setHermina(client.hermina ?? 0)
        } else {
            setKode("")
            setName("")
            setEmail("")
            setPhone("")
            setAddress("")
            setHermina(0)
        }
    }, [client, open])

    const mutation = useMutation({
        mutationFn: (data: Partial<Client>) => {
            if (client) {
                return ClientService.updateClient(client.id, data)
            }
            return ClientService.createClient(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clients"] })
            toast.success(client ? "Client updated successfully" : "Client created successfully")
            onOpenChange(false)
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Something went wrong")
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        mutation.mutate({
            kode: kode !== "" ? Number(kode) : null,
            name,
            email: email || undefined,
            phone: phone || undefined,
            address: address || undefined,
            hermina: Number(hermina)
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{client ? "Edit Client" : "Tambah Client"}</DialogTitle>
                        <DialogDescription>
                            {client ? "Perbarui informasi client." : "Tambah client baru ke sistem."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-1 grid gap-2">
                                <Label htmlFor="kode">Kode Client</Label>
                                <Input
                                    id="kode"
                                    type="number"
                                    value={kode}
                                    onChange={(e) => setKode(e.target.value)}
                                    placeholder="Contoh: 101"
                                />
                            </div>
                            <div className="col-span-2 grid gap-2">
                                <Label htmlFor="name">Nama Client / Perusahaan</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Contoh: PT. Maju Mundur"
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="contact@company.com"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">No. Telepon</Label>
                                <Input
                                    id="phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="0812..."
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Kategori Client</Label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setHermina(0)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer select-none ${
                                        hermina === 0
                                            ? "border-orange-500 bg-orange-50/70 text-orange-700 ring-2 ring-orange-400/20 font-semibold"
                                            : "border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100/70 text-neutral-600"
                                    }`}
                                >
                                    <span className="text-xs">Non Hermina</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setHermina(1)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer select-none ${
                                        hermina === 1
                                            ? "border-blue-500 bg-blue-50/70 text-blue-700 ring-2 ring-blue-400/20 font-semibold"
                                            : "border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100/70 text-neutral-600"
                                    }`}
                                >
                                    <span className="text-xs">Hermina</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setHermina(2)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer select-none ${
                                        hermina === 2
                                            ? "border-emerald-500 bg-emerald-50/70 text-emerald-700 ring-2 ring-emerald-400/20 font-semibold"
                                            : "border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100/70 text-neutral-600"
                                    }`}
                                >
                                    <span className="text-xs">Managed by Hermina</span>
                                </button>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="address">Alamat</Label>
                            <Textarea
                                id="address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Jalan Sudirman No. 1..."
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={mutation.isPending} className="bg-orange-600 hover:bg-orange-700 text-white">
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {client ? "Simpan Perubahan" : "Tambah Client"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
