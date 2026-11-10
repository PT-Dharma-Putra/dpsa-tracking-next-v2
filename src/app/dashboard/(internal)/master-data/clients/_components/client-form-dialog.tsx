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
import { ClientService, Client } from "@/features/clients/services/client-service"
import { RegionalHerminaService } from "@/features/regional-hermina/services/regional-hermina-service"

interface ClientFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    client?: Client | null
}

export function ClientFormDialog({ open, onOpenChange, client }: ClientFormDialogProps) {
    const queryClient = useQueryClient()
    const [kode, setKode] = React.useState("")
    const [name, setName] = React.useState("")
    const [companyName, setCompanyName] = React.useState("")
    const [directorName, setDirectorName] = React.useState("")
    const [email, setEmail] = React.useState("")
    const [financeEmail, setFinanceEmail] = React.useState("")
    const [phone, setPhone] = React.useState("")
    const [address, setAddress] = React.useState("")
    const [generalAffairName, setGeneralAffairName] = React.useState("")
    const [generalAffairHp, setGeneralAffairHp] = React.useState("")
    const [namaBank, setNamaBank] = React.useState("")
    const [rekening, setRekening] = React.useState("")
    const [npwp, setNpwp] = React.useState("")
    const [hermina, setHermina] = React.useState<number>(0)
    const [regionalHerminaId, setRegionalHerminaId] = React.useState<string>("")

    const { data: regionalHerminaList = [] } = useQuery({
        queryKey: ["regional-hermina"],
        queryFn: () => RegionalHerminaService.getRegionalHermina(),
        enabled: open,
    })

    React.useEffect(() => {
        if (client) {
            setKode(client.kode !== null && client.kode !== undefined ? String(client.kode) : "")
            setName(client.name || "")
            setCompanyName(client.company_name || "")
            setDirectorName(client.director_name || "")
            setEmail(client.email || "")
            setFinanceEmail(client.finance_email || client.email_keuangan || "")
            setPhone(client.phone_number || client.phone || "")
            setAddress(client.address || "")
            setGeneralAffairName(client.general_affair_name || client.nama_jangum || "")
            setGeneralAffairHp(client.general_affair_hp || client.hp_jangum || "")
            setNamaBank(client.nama_bank || "")
            setRekening(client.rekening || "")
            setNpwp(client.npwp || "")
            setHermina(client.hermina ?? 0)
            setRegionalHerminaId(client.regional_hermina_id ? String(client.regional_hermina_id) : "")
        } else {
            setKode("")
            setName("")
            setCompanyName("")
            setDirectorName("")
            setEmail("")
            setFinanceEmail("")
            setPhone("")
            setAddress("")
            setGeneralAffairName("")
            setGeneralAffairHp("")
            setNamaBank("")
            setRekening("")
            setNpwp("")
            setHermina(0)
            setRegionalHerminaId("")
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
            company_name: companyName || undefined,
            director_name: directorName || undefined,
            email: email || undefined,
            finance_email: financeEmail || undefined,
            phone: phone || undefined,
            phone_number: phone || undefined,
            address: address || undefined,
            general_affair_name: generalAffairName || undefined,
            general_affair_hp: generalAffairHp || undefined,
            nama_bank: namaBank || undefined,
            rekening: rekening || undefined,
            npwp: npwp || undefined,
            hermina: Number(hermina),
            regional_hermina_id: regionalHerminaId ? Number(regionalHerminaId) : null,
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] flex flex-col p-6 overflow-hidden">
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <DialogHeader className="shrink-0 pb-2">
                        <DialogTitle>{client ? "Edit Client" : "Tambah Client"}</DialogTitle>
                        <DialogDescription>
                            {client ? "Perbarui informasi lengkap client." : "Tambah client baru ke sistem."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
                        {/* Section 1: Informasi Dasar */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider pb-1 border-b">
                                Informasi Dasar
                            </h4>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-1 grid gap-1.5">
                                    <Label htmlFor="kode" className="text-xs">Kode Client</Label>
                                    <Input
                                        id="kode"
                                        type="number"
                                        value={kode}
                                        onChange={(e) => setKode(e.target.value)}
                                        placeholder="Contoh: 101"
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <div className="col-span-2 grid gap-1.5">
                                    <Label htmlFor="name" className="text-xs">Nama Client <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Contoh: RS Hermina Jatinegara"
                                        required
                                        className="h-8 text-xs font-medium"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="companyName" className="text-xs">Nama Perusahaan (PT/CV)</Label>
                                    <Input
                                        id="companyName"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        placeholder="Contoh: PT. Medikaloka Hermina Tbk"
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="directorName" className="text-xs">Nama Direktur</Label>
                                    <Input
                                        id="directorName"
                                        value={directorName}
                                        onChange={(e) => setDirectorName(e.target.value)}
                                        placeholder="Contoh: dr. Sri Dyah..."
                                        className="h-8 text-xs"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Kategori Hermina & Regional */}
                        <div className="space-y-3">
                            <div className="grid gap-1.5">
                                <Label className="text-xs">Kategori Client</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setHermina(0)}
                                        className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer select-none ${
                                            hermina === 0
                                                ? "border-orange-500 bg-orange-50/70 text-orange-700 ring-2 ring-orange-400/20 font-semibold"
                                                : "border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100/70 text-neutral-600"
                                        }`}
                                    >
                                        <span className="text-xs">Non Hermina (0)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setHermina(1)}
                                        className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer select-none ${
                                            hermina === 1
                                                ? "border-blue-500 bg-blue-50/70 text-blue-700 ring-2 ring-blue-400/20 font-semibold"
                                                : "border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100/70 text-neutral-600"
                                        }`}
                                    >
                                        <span className="text-xs">Hermina (1)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setHermina(2)}
                                        className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer select-none ${
                                            hermina === 2
                                                ? "border-emerald-500 bg-emerald-50/70 text-emerald-700 ring-2 ring-emerald-400/20 font-semibold"
                                                : "border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100/70 text-neutral-600"
                                        }`}
                                    >
                                        <span className="text-xs">Managed Hermina (2)</span>
                                    </button>
                                </div>
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="regionalHermina" className="text-xs">
                                    Regional Hermina (Opsional)
                                </Label>
                                <Select
                                    value={regionalHerminaId || "none"}
                                    onValueChange={(val) => setRegionalHerminaId(val === "none" ? "" : val)}
                                >
                                    <SelectTrigger id="regionalHermina" className="h-8 text-xs bg-white">
                                        <SelectValue placeholder="Pilih Regional Hermina" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none" className="text-xs">-- Tidak Ada / Kosong --</SelectItem>
                                        {regionalHerminaList.map((reg) => (
                                            <SelectItem key={reg.id} value={String(reg.id)} className="text-xs">
                                                {reg.regional} {reg.angka_romawi ? `(${reg.angka_romawi})` : ""} {reg.nama_direktur ? `- ${reg.nama_direktur}` : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Section 3: Kontak & Penanggung Jawab */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider pb-1 border-b">
                                Kontak & Penanggung Jawab
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="email" className="text-xs">Email Umum</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="contact@company.com"
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="phone" className="text-xs">No. Telepon / HP</Label>
                                    <Input
                                        id="phone"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="0812..."
                                        className="h-8 text-xs font-mono"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="financeEmail" className="text-xs">Email Keuangan</Label>
                                    <Input
                                        id="financeEmail"
                                        type="email"
                                        value={financeEmail}
                                        onChange={(e) => setFinanceEmail(e.target.value)}
                                        placeholder="keuangan@company.com"
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="generalAffairName" className="text-xs">Nama Jangum / GA</Label>
                                    <Input
                                        id="generalAffairName"
                                        value={generalAffairName}
                                        onChange={(e) => setGeneralAffairName(e.target.value)}
                                        placeholder="Contoh: Ibu Era"
                                        className="h-8 text-xs"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="generalAffairHp" className="text-xs">No. HP Jangum / GA</Label>
                                    <Input
                                        id="generalAffairHp"
                                        value={generalAffairHp}
                                        onChange={(e) => setGeneralAffairHp(e.target.value)}
                                        placeholder="0812..."
                                        className="h-8 text-xs font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Bank & Pajak */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider pb-1 border-b">
                                Bank & Pajak
                            </h4>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="namaBank" className="text-xs">Nama Bank</Label>
                                    <Input
                                        id="namaBank"
                                        value={namaBank}
                                        onChange={(e) => setNamaBank(e.target.value)}
                                        placeholder="BCA / Mandiri..."
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="rekening" className="text-xs">No. Rekening</Label>
                                    <Input
                                        id="rekening"
                                        value={rekening}
                                        onChange={(e) => setRekening(e.target.value)}
                                        placeholder="1234567890"
                                        className="h-8 text-xs font-mono"
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="npwp" className="text-xs">NPWP</Label>
                                    <Input
                                        id="npwp"
                                        value={npwp}
                                        onChange={(e) => setNpwp(e.target.value)}
                                        placeholder="12.345.678.9-000.000"
                                        className="h-8 text-xs font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 5: Alamat */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="address" className="text-xs">Alamat Lengkap</Label>
                            <Textarea
                                id="address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Jalan Sudirman No. 1..."
                                className="min-h-[70px] text-xs"
                            />
                        </div>
                    </div>

                    <DialogFooter className="shrink-0 pt-3 border-t">
                        <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                            Batal
                        </Button>
                        <Button type="submit" size="sm" disabled={mutation.isPending} className="bg-orange-600 hover:bg-orange-700 text-white">
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {client ? "Simpan Perubahan" : "Tambah Client"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
