"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CalendarIcon, Loader2, Check, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { Label } from "@/components/ui/label"

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
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { PengirimanService, Pengiriman } from "@/features/pengiriman/services/pengiriman-service"

const formSchema = z.object({
  tanggal: z.date({
    message: "Tanggal pengiriman wajib diisi",
  }),
  client_id: z.string().min(1, "Client wajib dipilih"),
  surat_jalan: z.string().optional().nullable(),
  setrim: z.string().optional().nullable(),
  tanggal_mulai_setting: z.date().optional().nullable(),
  tanggal_selesai_setting: z.date().optional().nullable(),
  koor_setting: z.string().optional().nullable(),
  no_kendaraan: z.string().optional().nullable(),
  supir: z.string().optional().nullable(),
})

type FormValues = z.infer<typeof formSchema>

interface SelectedItem {
  project_item_id: number;
  item_name: string;
  project_name: string;
  spk_number: string;
  jumlah: number;
  jumlah_keluar_total: number;
  jumlah_tersetting_total: number;
  jumlah_keluar: number;
  jumlah_tersetting: number;
  keterangan: string;
  selected: boolean;
}

interface PengirimanPerSpkFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pengiriman?: Pengiriman | null
  projectId?: number
  clientId?: number
  clientName?: string
  spkId?: number | null
  onSaved?: () => void
}

export function PengirimanPerSpkFormDialog({
  open,
  onOpenChange,
  pengiriman,
  projectId,
  clientId,
  clientName,
  spkId,
  onSaved,
}: PengirimanPerSpkFormDialogProps) {
  const queryClient = useQueryClient()
  const isEdit = !!pengiriman

  // Fetch full pengiriman (with details) when editing — the list query may omit details
  const { data: fullPengirimanData } = useQuery({
    queryKey: ["pengiriman-detail", pengiriman?.id],
    queryFn: () => PengirimanService.getPengirimanById(pengiriman!.id),
    enabled: isEdit && !!pengiriman?.id && open,
  })

  const effectivePengiriman = isEdit ? (fullPengirimanData ?? pengiriman) : pengiriman

  const [selectedItems, setSelectedItems] = React.useState<SelectedItem[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tanggal: new Date(),
      client_id: clientId ? clientId.toString() : "",
      surat_jalan: "",
      setrim: "",
      tanggal_mulai_setting: null,
      tanggal_selesai_setting: null,
      koor_setting: "",
      no_kendaraan: "",
      supir: "",
    },
  })

  const selectedClientId = form.watch("client_id")

  // Fetch project items for the client, then filter by projectId
  const { data: clientItems, isLoading: isLoadingItems } = useQuery({
    queryKey: ["client-items", selectedClientId],
    queryFn: () => PengirimanService.getClientProjectItems(parseInt(selectedClientId)),
    enabled: !!selectedClientId,
  })

  // Items filtered to only the current project's SPK
  const projectItems = React.useMemo(() => {
    if (!clientItems || !projectId) return clientItems ?? []
    return clientItems.filter(item => Number(item.project_id) === projectId)
  }, [clientItems, projectId])

  // Reset and auto-fill when dialog opens
  React.useEffect(() => {
    if (open) {
      if (effectivePengiriman) {
        form.reset({
          tanggal: new Date(effectivePengiriman.tanggal),
          client_id: effectivePengiriman.client_id.toString(),
          surat_jalan: effectivePengiriman.surat_jalan || "",
          setrim: effectivePengiriman.setrim || "",
          tanggal_mulai_setting: effectivePengiriman.tanggal_mulai_setting ? new Date(effectivePengiriman.tanggal_mulai_setting) : null,
          tanggal_selesai_setting: effectivePengiriman.tanggal_selesai_setting ? new Date(effectivePengiriman.tanggal_selesai_setting) : null,
          koor_setting: effectivePengiriman.koor_setting || "",
          no_kendaraan: effectivePengiriman.no_kendaraan || "",
          supir: effectivePengiriman.supir || "",
        })
      } else {
        form.reset({
          tanggal: new Date(),
          client_id: clientId ? clientId.toString() : "",
          surat_jalan: "",
          setrim: "",
          tanggal_mulai_setting: null,
          tanggal_selesai_setting: null,
          koor_setting: "",
          no_kendaraan: "",
          supir: "",
        })
        setSelectedItems([])
      }
    }
  }, [open, effectivePengiriman, form, clientId])

  // Sync selected items when projectItems load or dialog reopens
  React.useEffect(() => {
    if (!open) return
    if (!projectItems || projectItems.length === 0) return
    // In edit mode, wait until the full pengiriman (with details) has been fetched
    if (isEdit && !fullPengirimanData) return

    const items = projectItems.map((item) => {
      const detail = effectivePengiriman?.details?.find(d => Number(d.project_item_id) === Number(item.id))
      const currentKeluar = detail ? detail.jumlah_keluar : Math.max(0, item.jumlah - item.jumlah_keluar_total)
      const currentTersetting = detail ? detail.jumlah_tersetting : 0
      const isSelected = !!detail
      const keterangan = detail ? detail.keterangan || "" : ""

      const pastKeluar = detail ? item.jumlah_keluar_total - detail.jumlah_keluar : item.jumlah_keluar_total
      const pastTersetting = detail ? item.jumlah_tersetting_total - detail.jumlah_tersetting : item.jumlah_tersetting_total

      return {
        project_item_id: item.id,
        item_name: item.item,
        project_name: item.project?.name || "-",
        spk_number: item.spk_number || "-",
        jumlah: item.jumlah,
        jumlah_keluar_total: Math.max(0, pastKeluar),
        jumlah_tersetting_total: Math.max(0, pastTersetting),
        jumlah_keluar: currentKeluar,
        jumlah_tersetting: currentTersetting,
        keterangan: keterangan,
        selected: isSelected,
      }
    })

    setSelectedItems(items)
  }, [projectItems, isEdit, effectivePengiriman, fullPengirimanData, open])

  const toggleSelect = (itemId: number) => {
    setSelectedItems(prev => prev.map(item => {
      if (item.project_item_id === itemId) {
        const newSelected = !item.selected
        return {
          ...item,
          selected: newSelected,
          jumlah_keluar: newSelected ? (item.jumlah_keluar || Math.max(0, item.jumlah - item.jumlah_keluar_total)) : 0,
          jumlah_tersetting: newSelected ? item.jumlah_tersetting : 0,
        }
      }
      return item
    }))
  }

  const handleQtyChange = (itemId: number, field: "jumlah_keluar" | "jumlah_tersetting", value: number) => {
    setSelectedItems(prev => prev.map(item => {
      if (item.project_item_id === itemId) {
        return { ...item, [field]: value, selected: value > 0 ? true : item.selected }
      }
      return item
    }))
  }

  const handleKeteranganChange = (itemId: number, value: string) => {
    setSelectedItems(prev => prev.map(item => {
      if (item.project_item_id === itemId) return { ...item, keterangan: value }
      return item
    }))
  }

  const isAllSelected = selectedItems.length > 0 && selectedItems.every(item => item.selected)
  const isSomeSelected = selectedItems.length > 0 && selectedItems.some(item => item.selected) && !isAllSelected

  const handleSelectAllToggle = () => {
    const nextSelected = !isAllSelected
    setSelectedItems(prev => prev.map(item => ({
      ...item,
      selected: nextSelected,
      jumlah_keluar: nextSelected ? (item.jumlah_keluar || Math.max(0, item.jumlah - item.jumlah_keluar_total)) : 0,
      jumlah_tersetting: nextSelected ? item.jumlah_tersetting : 0,
    })))
  }

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const activeDetails = selectedItems
        .filter(item => item.selected && (item.jumlah_keluar > 0 || item.jumlah_tersetting > 0))
        .map(item => ({
          project_item_id: item.project_item_id,
          jumlah_keluar: item.jumlah_keluar,
          jumlah_tersetting: item.jumlah_tersetting,
          keterangan: item.keterangan || null,
          spk_id: spkId ?? null,
        }))

      const payload = {
        tanggal: format(values.tanggal, "yyyy-MM-dd"),
        client_id: parseInt(values.client_id),
        surat_jalan: isEdit ? (pengiriman?.surat_jalan ?? null) : null,
        setrim: isEdit ? (pengiriman?.setrim ?? null) : null,
        tanggal_mulai_setting: values.tanggal_mulai_setting ? format(values.tanggal_mulai_setting, "yyyy-MM-dd") : null,
        tanggal_selesai_setting: values.tanggal_selesai_setting ? format(values.tanggal_selesai_setting, "yyyy-MM-dd") : null,
        koor_setting: values.koor_setting || null,
        no_kendaraan: values.no_kendaraan || null,
        supir: values.supir || null,
        details: activeDetails,
      }

      if (isEdit && pengiriman) {
        return PengirimanService.updatePengiriman(pengiriman.id, payload)
      } else {
        return PengirimanService.createPengiriman(payload)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pengiriman-list"] })
      queryClient.invalidateQueries({ queryKey: ["pengiriman-per-spk", spkId] })
      toast.success(isEdit ? "Pengiriman berhasil diubah" : "Pengiriman berhasil disimpan")
      onSaved?.()
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || "Gagal menyimpan pengiriman")
      console.error(error)
    }
  })

  const onSubmit = (values: FormValues) => {
    const activeDetails = selectedItems.filter(item => item.selected && (item.jumlah_keluar > 0 || item.jumlah_tersetting > 0))
    if (activeDetails.length === 0) {
      toast.error("Paling tidak harus ada 1 item yang dipilih dengan jumlah kirim atau tersetting lebih dari 0")
      return
    }

    const invalidItem = selectedItems.find(
      item => item.selected && (item.jumlah_keluar_total + item.jumlah_keluar) > item.jumlah
    )
    if (invalidItem) {
      toast.error(`Item "${invalidItem.item_name}" melebihi jumlah order (${invalidItem.jumlah_keluar_total + invalidItem.jumlah_keluar} / ${invalidItem.jumlah})`)
      return
    }

    saveMutation.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>{isEdit ? "Edit Pengiriman" : "Tambah Pengiriman Baru per SPK"}</DialogTitle>
          <DialogDescription>
            Isi informasi pengiriman. Item yang ditampilkan hanya dari SPK proyek ini.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 space-y-6 overflow-hidden">

            {/* Metadata Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 bg-muted/20 p-4 rounded-lg border shrink-0 items-end">

              {/* 1. Client (auto-filled, read-only) */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Client</Label>
                <div className="h-9 px-3 flex items-center rounded-md border border-neutral-200 bg-neutral-100 text-xs font-medium text-neutral-700 truncate">
                  {clientName || "—"}
                </div>
              </div>

              {/* 2. Tanggal */}
              <FormField
                control={form.control}
                name="tanggal"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-xs font-semibold">Tanggal Kirim</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal h-9 text-xs",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "dd/MM/yyyy") : <span>Pilih Tanggal</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 3. Supir */}
              <FormField
                control={form.control}
                name="supir"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Supir</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama supir" {...field} value={field.value || ""} className="h-9 text-xs" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 4. No Kendaraan */}
              <FormField
                control={form.control}
                name="no_kendaraan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">No. Kendaraan</FormLabel>
                    <FormControl>
                      <Input placeholder="B 1234 CD" {...field} value={field.value || ""} className="h-9 text-xs" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 5. Koordinator Setting */}
              <FormField
                control={form.control}
                name="koor_setting"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Koor. Setting</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama koordinator" {...field} value={field.value || ""} className="h-9 text-xs" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 6. Mulai Setting */}
              <FormField
                control={form.control}
                name="tanggal_mulai_setting"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-xs font-semibold">Mulai Setting</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal text-xs h-9",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "dd/MM/yyyy") : <span>Pilih Tanggal</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 7. Selesai Setting */}
              <FormField
                control={form.control}
                name="tanggal_selesai_setting"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-xs font-semibold">Selesai Setting</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal text-xs h-9",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "dd/MM/yyyy") : <span>Pilih Tanggal</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>

            {/* Item Selection Section */}
            <div className="flex-1 min-h-0 flex flex-col space-y-2 overflow-hidden">
              <div className="shrink-0">
                <Label className="text-sm font-semibold">Pilih Item Proyek yang Dikirim</Label>
                <p className="text-xs text-muted-foreground">
                  Menampilkan item dari SPK proyek ini saja. Masukkan kuantitas pada kolom Kirim Sekarang.
                </p>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto border rounded-md">
                {isLoadingItems ? (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    Memuat item proyek...
                  </div>
                ) : selectedItems.length === 0 ? (
                  <div className="border border-dashed rounded-lg p-12 text-center text-muted-foreground text-sm">
                    Tidak ada item pada SPK proyek ini.
                  </div>
                ) : (
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="border-b text-muted-foreground font-medium text-xs uppercase tracking-wider sticky top-0 bg-white z-10">
                        <th className="p-3 text-center w-12">
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = isSomeSelected
                            }}
                            onChange={handleSelectAllToggle}
                            className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary cursor-pointer"
                          />
                        </th>
                        <th className="p-3">No. SPK</th>
                        <th className="p-3">Item Proyek</th>
                        <th className="p-3 text-center">Jumlah Order</th>
                        <th className="p-3 text-center">Terkirim (Sebelumnya)</th>
                        <th className="p-3 text-center">Kirim Sekarang</th>
                        <th className="p-3 text-center">Tersetting Sekarang</th>
                        <th className="p-3">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedItems.map((item) => {
                        const totalKirim = item.jumlah_keluar_total + item.jumlah_keluar
                        const isOver = item.selected && totalKirim > item.jumlah

                        return (
                          <tr key={item.project_item_id} className={cn("hover:bg-muted/10 transition-colors", isOver && "bg-destructive/5", !item.selected && "opacity-75")}>
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={item.selected}
                                onChange={() => toggleSelect(item.project_item_id)}
                                className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary cursor-pointer"
                              />
                            </td>
                            <td className="p-3 font-medium max-w-50 truncate">{item.spk_number}</td>
                            <td className="p-3 max-w-87.5 truncate">
                              <span className="font-semibold">{item.item_name}</span>
                            </td>
                            <td className="p-3 text-center font-bold text-muted-foreground">{item.jumlah}</td>
                            <td className="p-3 text-center">
                              <span className="text-xs text-muted-foreground">{item.jumlah_keluar_total} / {item.jumlah}</span>
                            </td>
                            <td className="p-3">
                              <div className="flex flex-col items-center">
                                <Input
                                  type="number"
                                  min="0"
                                  value={item.jumlah_keluar}
                                  onChange={(e) => handleQtyChange(item.project_item_id, "jumlah_keluar", parseInt(e.target.value) || 0)}
                                  disabled={!item.selected}
                                  className={cn("w-24 text-center h-8 text-xs", isOver && "border-destructive focus-visible:ring-destructive")}
                                />
                                {isOver && (
                                  <span className="text-[10px] text-destructive flex items-center gap-0.5 mt-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Melebihi Order
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <Input
                                type="number"
                                min="0"
                                value={item.jumlah_tersetting}
                                onChange={(e) => handleQtyChange(item.project_item_id, "jumlah_tersetting", parseInt(e.target.value) || 0)}
                                disabled={!item.selected}
                                className="w-24 text-center h-8 text-xs mx-auto block"
                              />
                            </td>
                            <td className="p-3">
                              <Input
                                type="text"
                                placeholder="Keterangan item (opsional)"
                                value={item.keterangan || ""}
                                onChange={(e) => handleKeteranganChange(item.project_item_id, e.target.value)}
                                disabled={!item.selected}
                                className="w-full h-8 text-xs"
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Dialog Footer */}
            <DialogFooter className="shrink-0 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={saveMutation.isPending} className="font-semibold">
                {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Pengiriman
              </Button>
            </DialogFooter>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
