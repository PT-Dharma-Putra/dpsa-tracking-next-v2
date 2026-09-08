"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { ListSpkMasuk, ListSpkMasukService } from "@/features/list-spk-masuk/services/list-spk-masuk-service";

interface ListSpkMasukFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    item: ListSpkMasuk | null;
}

export function ListSpkMasukFormDialog({
    isOpen,
    onClose,
    item,
}: ListSpkMasukFormDialogProps) {
    const queryClient = useQueryClient();
    const isEdit = Boolean(item);

    const [tanggalSpkMasuk, setTanggalSpkMasuk] = React.useState(format(new Date(), "yyyy-MM-dd"));
    const [marketingId, setMarketingId] = React.useState<string>("");
    const [clientId, setClientId] = React.useState<string>("");
    const [noSpk, setNoSpk] = React.useState("");
    const [namaProjek, setNamaProjek] = React.useState("");
    const [isUploaded, setIsUploaded] = React.useState(false);
    const [tanggalUpload, setTanggalUpload] = React.useState("");

    // Fetch Marketings and Clients for selection
    const { data: marketings = [] } = useQuery({
        queryKey: ["marketing-users-list"],
        queryFn: ListSpkMasukService.getMarketings,
        enabled: isOpen,
    });

    const { data: clients = [] } = useQuery({
        queryKey: ["clients-options-list"],
        queryFn: ListSpkMasukService.getClients,
        enabled: isOpen,
    });

    const toDateInputString = (dateStr?: string | null) => {
        if (!dateStr) return "";
        try {
            return format(parseISO(dateStr), "yyyy-MM-dd");
        } catch {
            return dateStr.substring(0, 10);
        }
    };

    React.useEffect(() => {
        if (item) {
            setTanggalSpkMasuk(toDateInputString(item.tanggal_spk_masuk));
            setMarketingId(item.marketing_id ? String(item.marketing_id) : "");
            setClientId(item.client_id ? String(item.client_id) : "");
            setNoSpk(item.no_spk || "");
            setNamaProjek(item.nama_projek || "");
            setIsUploaded(Boolean(item.is_uploaded));
            setTanggalUpload(toDateInputString(item.tanggal_upload));
        } else {
            setTanggalSpkMasuk(format(new Date(), "yyyy-MM-dd"));
            setMarketingId("");
            setClientId("");
            setNoSpk("");
            setNamaProjek("");
            setIsUploaded(false);
            setTanggalUpload("");
        }
    }, [item, isOpen]);

    const handleToggleUploaded = (checked: boolean) => {
        setIsUploaded(checked);
        if (checked && !tanggalUpload) {
            setTanggalUpload(format(new Date(), "yyyy-MM-dd"));
        } else if (!checked) {
            setTanggalUpload("");
        }
    };

    const mutation = useMutation({
        mutationFn: async () => {
            if (!clientId) {
                throw new Error("Client wajib dipilih");
            }
            if (!noSpk.trim()) {
                throw new Error("Nomor SPK wajib diisi");
            }
            if (!namaProjek.trim()) {
                throw new Error("Nama Projek wajib diisi");
            }

            const payload = {
                tanggal_spk_masuk: tanggalSpkMasuk,
                marketing_id: marketingId ? Number(marketingId) : null,
                client_id: Number(clientId),
                no_spk: noSpk.trim(),
                nama_projek: namaProjek.trim(),
                is_uploaded: isUploaded,
                tanggal_upload: isUploaded ? (tanggalUpload || format(new Date(), "yyyy-MM-dd")) : null,
            };

            if (isEdit && item) {
                return await ListSpkMasukService.update(item.id, payload);
            } else {
                return await ListSpkMasukService.create(payload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["list-spk-masuk"] });
            toast.success(isEdit ? "Data SPK Masuk berhasil diperbarui" : "Data SPK Masuk berhasil ditambahkan");
            onClose();
        },
        onError: (err: any) => {
            const errorMsg = err?.response?.data?.message || err?.message || "Terjadi kesalahan saat menyimpan data";
            toast.error(errorMsg);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[540px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit SPK Masuk" : "Tambah SPK Masuk"}</DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Perbarui informasi data SPK Masuk di bawah ini."
                            : "Lengkapi data untuk menambahkan SPK Masuk baru."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Tanggal SPK Masuk */}
                        <div className="space-y-1.5">
                            <Label htmlFor="tanggal_spk_masuk">
                                Tanggal SPK Masuk <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="tanggal_spk_masuk"
                                type="date"
                                required
                                value={tanggalSpkMasuk}
                                onChange={(e) => setTanggalSpkMasuk(e.target.value)}
                            />
                        </div>

                        {/* Marketing */}
                        <div className="space-y-1.5">
                            <Label htmlFor="marketing_id">Marketing</Label>
                            <Select value={marketingId} onValueChange={setMarketingId}>
                                <SelectTrigger id="marketing_id">
                                    <SelectValue placeholder="Pilih Marketing" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">-- Tanpa Marketing --</SelectItem>
                                    {marketings.map((m) => (
                                        <SelectItem key={m.id} value={String(m.id)}>
                                            {m.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Client */}
                    <div className="space-y-1.5">
                        <Label htmlFor="client_id">
                            Client <span className="text-red-500">*</span>
                        </Label>
                        <Select value={clientId} onValueChange={setClientId}>
                            <SelectTrigger id="client_id">
                                <SelectValue placeholder="Pilih Client" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                                {clients.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>
                                        {c.name} {c.company_name ? `(${c.company_name})` : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* No SPK */}
                    <div className="space-y-1.5">
                        <Label htmlFor="no_spk">
                            No SPK <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="no_spk"
                            placeholder="Contoh: SPK/2026/09/001"
                            required
                            value={noSpk}
                            onChange={(e) => setNoSpk(e.target.value)}
                        />
                    </div>

                    {/* Nama Projek */}
                    <div className="space-y-1.5">
                        <Label htmlFor="nama_projek">
                            Nama Projek <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="nama_projek"
                            placeholder="Contoh: Pengadaan Furniture Ruang Meeting"
                            required
                            value={namaProjek}
                            onChange={(e) => setNamaProjek(e.target.value)}
                        />
                    </div>

                    {/* Status Upload & Tanggal Upload */}
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-3.5 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="is_uploaded" className="text-sm font-medium cursor-pointer">
                                    Status Upload SPK
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Tandai apakah berkas SPK sudah diunggah
                                </p>
                            </div>
                            <Switch
                                id="is_uploaded"
                                checked={isUploaded}
                                onCheckedChange={handleToggleUploaded}
                            />
                        </div>

                        {isUploaded && (
                            <div className="pt-2 border-t border-neutral-200 space-y-1.5">
                                <Label htmlFor="tanggal_upload">Tanggal Upload</Label>
                                <Input
                                    id="tanggal_upload"
                                    type="date"
                                    value={tanggalUpload}
                                    onChange={(e) => setTanggalUpload(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={mutation.isPending} className="bg-orange-600 hover:bg-orange-700 text-white">
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEdit ? "Simpan Perubahan" : "Simpan Data"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
