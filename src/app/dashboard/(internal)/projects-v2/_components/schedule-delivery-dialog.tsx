"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Plus, Loader2, Check, ChevronsUpDown } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { projectV2Service, ProjectV2, TanggalPengiriman } from "@/features/projects/services/project-v2-service"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const formSchema = z.object({
    tanggal_pengiriman_id: z.number().min(1, "Pilih tanggal pengiriman."),
    keterangan: z.string().optional(),
})

interface ScheduleDeliveryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    project: ProjectV2 | null
}

export function ScheduleDeliveryDialog({
    open,
    onOpenChange,
    project
}: ScheduleDeliveryDialogProps) {
    const queryClient = useQueryClient()
    const [isAddingDate, setIsAddingDate] = React.useState(false)
    const [newDate, setNewDate] = React.useState<Date | undefined>(new Date())

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            tanggal_pengiriman_id: undefined,
            keterangan: "",
        },
    })

    // Reset form when project changes or dialog opens
    React.useEffect(() => {
        if (open && project) {
            form.reset({
                tanggal_pengiriman_id: project.jadwal_pengiriman?.tanggal_pengiriman_id,
                keterangan: project.jadwal_pengiriman?.keterangan || "",
            })
        }
    }, [open, project, form])

    const { data: tanggalList, isLoading: isLoadingTanggal } = useQuery({
        queryKey: ["tanggal-pengiriman"],
        queryFn: () => projectV2Service.getTanggalPengiriman(),
    })

    const createDateMutation = useMutation({
        mutationFn: (tanggal: string) => projectV2Service.storeTanggalPengiriman(tanggal),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["tanggal-pengiriman"] })
            form.setValue("tanggal_pengiriman_id", data.id)
            setIsAddingDate(false)
            toast.success("Tanggal pengiriman baru berhasil ditambahkan")
        },
        onError: () => {
            toast.error("Gagal menambahkan tanggal. Mungkin tanggal sudah ada.")
        }
    })

    const scheduleMutation = useMutation({
        mutationFn: (values: z.infer<typeof formSchema>) => 
            projectV2Service.storeJadwalPengiriman({
                project_id: project!.id,
                tanggal_pengiriman_id: values.tanggal_pengiriman_id,
                keterangan: values.keterangan,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects-v2"] })
            toast.success("Jadwal pengiriman berhasil disimpan")
            onOpenChange(false)
        },
        onError: () => {
            toast.error("Gagal menyimpan jadwal pengiriman")
        }
    })

    const deleteScheduleMutation = useMutation({
        mutationFn: () => projectV2Service.deleteJadwalPengiriman(project!.jadwal_pengiriman!.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects-v2"] })
            toast.success("Jadwal pengiriman berhasil dihapus")
            onOpenChange(false)
        },
        onError: () => {
            toast.error("Gagal menghapus jadwal pengiriman")
        }
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        scheduleMutation.mutate(values)
    }

    const handleAddDate = () => {
        if (newDate) {
            createDateMutation.mutate(format(newDate, "yyyy-MM-dd"))
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Jadwalkan Pengiriman</DialogTitle>
                    <DialogDescription>
                        Tentukan tanggal pengiriman untuk project <strong>{project?.name}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="tanggal_pengiriman_id"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Tanggal Pengiriman</FormLabel>
                                    <div className="flex gap-2">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            "w-full justify-between",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {(() => {
                                                            const selected = tanggalList?.find(t => t.id === field.value);
                                                            if (selected && selected.tanggal) {
                                                                try {
                                                                    return format(new Date(selected.tanggal), "EEEE, d MMMM yyyy");
                                                                } catch(e) {
                                                                    return selected.tanggal;
                                                                }
                                                            }
                                                            return "Pilih tanggal...";
                                                        })()}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[300px] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Cari tanggal..." />
                                                    <CommandEmpty>Tanggal tidak ditemukan.</CommandEmpty>
                                                    <CommandGroup className="max-h-[200px] overflow-auto">
                                                        {tanggalList?.map((t) => (
                                                            <CommandItem
                                                                value={t.tanggal}
                                                                key={t.id}
                                                                onSelect={() => {
                                                                    form.setValue("tanggal_pengiriman_id", t.id)
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        t.id === field.value ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {format(new Date(t.tanggal), "EEEE, d MMMM yyyy")}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>

                                        <Popover open={isAddingDate} onOpenChange={setIsAddingDate}>
                                            <PopoverTrigger asChild>
                                                <Button type="button" variant="secondary" size="icon">
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="end">
                                                <div className="p-3 border-b bg-muted/50 font-medium text-xs">
                                                    Tambah Tanggal Baru
                                                </div>
                                                <Calendar
                                                    mode="single"
                                                    selected={newDate}
                                                    onSelect={setNewDate}
                                                    initialFocus
                                                />
                                                <div className="p-3 border-t flex justify-end">
                                                    <Button 
                                                        size="sm" 
                                                        onClick={handleAddDate}
                                                        disabled={createDateMutation.isPending}
                                                    >
                                                        {createDateMutation.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                                        Tambah
                                                    </Button>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="keterangan"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Keterangan</FormLabel>
                                    <FormControl>
                                        <Textarea 
                                            placeholder="Catatan untuk pengiriman ini..." 
                                            className="resize-none"
                                            {...field} 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="flex justify-between sm:justify-between items-center">
                            <div>
                                {project?.jadwal_pengiriman && (
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="sm"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => deleteScheduleMutation.mutate()}
                                        disabled={deleteScheduleMutation.isPending}
                                    >
                                        {deleteScheduleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hapus Jadwal"}
                                    </Button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={scheduleMutation.isPending}>
                                    {scheduleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Simpan Jadwal
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
