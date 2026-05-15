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
import { Switch } from "@/components/ui/switch"
import { ClientService, Client } from "@/features/clients/services/client-service"

interface ClientFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    client?: Client | null
}

export function ClientFormDialog({ open, onOpenChange, client }: ClientFormDialogProps) {
    const queryClient = useQueryClient()
    const [name, setName] = React.useState("")
    const [email, setEmail] = React.useState("")
    const [phone, setPhone] = React.useState("")
    const [address, setAddress] = React.useState("")
    const [isHermina, setIsHermina] = React.useState(false)

    React.useEffect(() => {
        if (client) {
            setName(client.name || "")
            setEmail(client.email || "")
            setPhone(client.phone || "")
            setAddress(client.address || "")
            setIsHermina(client.hermina === 1)
        } else {
            setName("")
            setEmail("")
            setPhone("")
            setAddress("")
            setIsHermina(false)
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
            name,
            email,
            phone: phone || undefined,
            address: address || undefined,
            hermina: isHermina ? 1 : 0
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
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nama Client / Perusahaan</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Contoh: PT. Maju Mundur"
                                required
                            />
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
                                    required
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
                        <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                            <div className="space-y-0.5">
                                <Label htmlFor="kategori">Kategori</Label>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-xs font-medium ${!isHermina ? 'text-orange-600' : 'text-neutral-400'}`}>Non Hermina</span>
                                <Switch
                                    id="kategori"
                                    checked={isHermina}
                                    onCheckedChange={setIsHermina}
                                />
                                <span className={`text-xs font-medium ${isHermina ? 'text-blue-600' : 'text-neutral-400'}`}>Hermina</span>
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
