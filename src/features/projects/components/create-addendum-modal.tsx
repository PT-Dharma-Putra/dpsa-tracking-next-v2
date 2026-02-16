"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProjectService } from "../services/project-service";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

const formSchema = z.object({
    description: z.string().optional(),
    items: z.array(z.object({
        item: z.string().min(1, "Item name is required"),
        jumlah: z.number().min(1, "Min 1"),
        harga: z.number().optional(),
        satuan: z.string().optional(),
        ruang: z.string().optional(),
    })).optional(),
});

interface CreateAddendumModalProps {
    parentProjectId: number;
    parentProjectName: string;
    trigger?: React.ReactNode;
}

export function CreateAddendumModal({ parentProjectId, parentProjectName, trigger }: CreateAddendumModalProps) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const [items, setItems] = useState<{ item: string; jumlah: number; harga: number; satuan: string; ruang: string }[]>([]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            description: "",
        },
    });

    const mutation = useMutation({
        mutationFn: (data: { description?: string; items?: any[] }) =>
            ProjectService.createAddendum(parentProjectId, data),
        onSuccess: () => {
            toast.success("Addendum berhasil dibuat");
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["project", parentProjectId] });
            queryClient.invalidateQueries({ queryKey: ["addendums", parentProjectId] });
            setOpen(false);
            form.reset();
            setItems([]);
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to create addendum");
            console.error(error);
        },
    });

    function addItem() {
        setItems([...items, { item: "", jumlah: 1, harga: 0, satuan: "pcs", ruang: "" }]);
    }

    function removeItem(index: number) {
        setItems(items.filter((_, i) => i !== index));
    }

    function updateItem(index: number, field: string, value: any) {
        const updated = [...items];
        (updated[index] as any)[field] = value;
        setItems(updated);
    }

    function onSubmit(values: z.infer<typeof formSchema>) {
        mutation.mutate({
            description: values.description,
            items: items.length > 0 ? items.filter(i => i.item.trim() !== "") : undefined,
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Buat Addendum
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Buat Addendum</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Project induk: <span className="font-medium">{parentProjectName}</span>
                    </p>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Deskripsi Addendum</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Deskripsi item tambahan yang akan diproses..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Dynamic Items */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <FormLabel>Items (Opsional)</FormLabel>
                                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                    <Plus className="mr-1 h-3 w-3" /> Tambah Item
                                </Button>
                            </div>

                            {items.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                                    Belum ada item. Klik &quot;Tambah Item&quot; untuk menambahkan.
                                </p>
                            )}

                            {items.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-start p-3 border rounded-lg bg-muted/30">
                                    <div className="col-span-5">
                                        <Input
                                            placeholder="Nama item"
                                            value={item.item}
                                            onChange={(e) => updateItem(index, "item", e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Input
                                            type="number"
                                            placeholder="Qty"
                                            min={1}
                                            value={item.jumlah}
                                            onChange={(e) => updateItem(index, "jumlah", parseInt(e.target.value) || 1)}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Input
                                            placeholder="Satuan"
                                            value={item.satuan}
                                            onChange={(e) => updateItem(index, "satuan", e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Input
                                            placeholder="Ruang"
                                            value={item.ruang}
                                            onChange={(e) => updateItem(index, "ruang", e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-1 flex justify-center">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-destructive hover:text-destructive"
                                            onClick={() => removeItem(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending ? "Membuat..." : "Buat Addendum"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
