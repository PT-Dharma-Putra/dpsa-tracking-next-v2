"use client"

import * as React from "react"
import { useForm, useFieldArray, useWatch } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { Loader2, Plus, Trash2, Package, Layers, Boxes, FileText } from "lucide-react"

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
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Check, ChevronsUpDown, Search, X } from "lucide-react"
import { toast } from "sonner"
import { projectV2Service, ProjectItemV2, MDLItem } from "@/features/projects/services/project-v2-service"
import { LokasiMDLService } from "@/features/lokasi-mdl/services/lokasi-mdl-service"
import { cn } from "@/lib/utils"
import { MDLItemSelectorDialog } from "./mdl-item-selector-dialog"
import { useDebounce } from "@/hooks/use-debounce"

const itemSchema = z.object({
    id: z.preprocess((val) => (val === "" || val === null || val === undefined ? undefined : Number(val)), z.number().optional()), // For edit mode
    item: z.string().min(1, "Item Name is required"),
    mdl_item_id: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : Number(val)), z.number().nullable().default(null)),
    lantai: z.string().default(""),
    ruang: z.string().default(""),
    keterangan: z.string().default(""),
    volume: z.preprocess((val) => (val === "" || val === null ? null : Number(val)), z.number().nullable()),
    panjang: z.preprocess((val) => (val === "" || val === null ? null : Number(val)), z.number().nullable()),
    lebar: z.preprocess((val) => (val === "" || val === null ? null : Number(val)), z.number().nullable()),
    tinggi: z.preprocess((val) => (val === "" || val === null ? null : Number(val)), z.number().nullable()),
    satuan: z.string().default("UNIT"),
    jumlah: z.preprocess((val) => (val === "" || val === null ? 0 : Number(val)), z.number().min(0, "Quantity must be at least 0")),
    custom: z.preprocess((val) => val === true || val === 1 || val === "1" || val === "true", z.boolean().default(false)),
    catatan: z.string().default(""),
})

const formSchema = z.object({
    items: z.array(itemSchema)
})

type FormValues = z.infer<typeof formSchema>

interface ProjectItemFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    projectId: number
    item?: ProjectItemV2 | null
}

function RuangComboboxField({ value, onChange, lokasiOptions, className }: {
    value: string
    onChange: (value: string) => void
    lokasiOptions: Array<{ id: number; nama: string }>
    className?: string
}) {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState(value || '')

    React.useEffect(() => {
        setQuery(value || '')
    }, [value])

    const filtered = React.useMemo(
        () => lokasiOptions.filter(l => l.nama.toLowerCase().includes(query.toLowerCase())),
        [lokasiOptions, query]
    )

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                        "h-8 w-full text-xs justify-between font-normal px-2 bg-white",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <span className="truncate">{value || "Ruang..."}</span>
                    <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Ketik atau cari ruang..."
                        className="h-8 text-xs"
                        value={query}
                        onValueChange={(val) => {
                            setQuery(val)
                            onChange(val)
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                setOpen(false)
                            }
                        }}
                    />
                    <CommandList>
                        {filtered.length === 0 ? (
                            <CommandEmpty className="py-2 text-center text-xs text-muted-foreground">
                                {query ? `Tekan pilihan atau ketik manual` : "Tidak ditemukan"}
                            </CommandEmpty>
                        ) : (
                            <CommandGroup className="max-h-[200px] overflow-y-auto">
                                {filtered.map((lokasi) => (
                                    <CommandItem
                                        key={lokasi.id}
                                        value={lokasi.nama}
                                        onSelect={() => {
                                            setQuery(lokasi.nama)
                                            onChange(lokasi.nama)
                                            setOpen(false)
                                        }}
                                        className="text-xs"
                                    >
                                        <Check className={cn("mr-2 h-3 w-3", value === lokasi.nama ? "opacity-100" : "opacity-0")} />
                                        {lokasi.nama}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

function ItemNameComboboxField({
    value,
    onChange,
    onSelectMDLItem,
    onOpenMasterData,
    className,
}: {
    value: string
    onChange: (value: string) => void
    onSelectMDLItem?: (item: MDLItem) => void
    onOpenMasterData?: () => void
    className?: string
}) {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState(value || '')
    const debouncedQuery = useDebounce(query, 300)

    React.useEffect(() => {
        setQuery(value || '')
    }, [value])

    const { data: mdlData, isLoading } = useQuery({
        queryKey: ["mdl-items-combobox", debouncedQuery],
        queryFn: () => projectV2Service.getMDLItems({ search: debouncedQuery || undefined, per_page: 8 }),
        enabled: open,
    })

    const items: MDLItem[] = mdlData?.data || []

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                        "h-8 w-full text-xs justify-between font-normal px-2 bg-white",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <span className="truncate">{value || "Item Name..."}</span>
                    <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Ketik atau cari nama item..."
                        className="h-8 text-xs"
                        value={query}
                        onValueChange={(val) => {
                            setQuery(val)
                            onChange(val)
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                setOpen(false)
                            }
                        }}
                    />
                    <CommandList>
                        {query.trim().length > 0 && (
                            <CommandGroup heading="Nama Manual">
                                <CommandItem
                                    value={`manual-${query}`}
                                    onSelect={() => {
                                        setQuery(query)
                                        onChange(query)
                                        setOpen(false)
                                    }}
                                    className="text-xs flex items-center gap-2 cursor-pointer text-purple-700 font-medium py-1.5 hover:bg-purple-50"
                                >
                                    <Check className={cn("h-3 w-3 shrink-0", value === query ? "opacity-100" : "opacity-0")} />
                                    <span className="truncate">Gunakan: "{query}"</span>
                                </CommandItem>
                            </CommandGroup>
                        )}

                        {isLoading ? (
                            <div className="flex items-center justify-center py-4 text-xs text-muted-foreground gap-2">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Mencari di master data...</span>
                            </div>
                        ) : items.length === 0 ? (
                            <CommandEmpty className="py-2.5 px-3 text-center text-xs text-muted-foreground">
                                {query ? (
                                    <div className="space-y-1">
                                        <p className="font-medium text-neutral-700">Tidak ada di Master Data</p>
                                        <p className="text-[11px] text-purple-600 font-medium">"{query}" tersimpan sebagai nama item manual</p>
                                    </div>
                                ) : (
                                    "Ketik untuk mencari atau mengisi manual"
                                )}
                            </CommandEmpty>
                        ) : (
                            <CommandGroup heading="Pilihan Master Data" className="max-h-[200px] overflow-y-auto">
                                {items.map((mdlItem) => (
                                    <CommandItem
                                        key={mdlItem.id}
                                        value={`mdl-${mdlItem.id}`}
                                        onSelect={() => {
                                            setQuery(mdlItem.nama_barang)
                                            onChange(mdlItem.nama_barang)
                                            if (onSelectMDLItem) {
                                                onSelectMDLItem(mdlItem)
                                            }
                                            setOpen(false)
                                        }}
                                        className="text-xs flex items-center justify-between cursor-pointer py-1.5"
                                    >
                                        <div className="flex items-center min-w-0 flex-1 mr-2">
                                            <Check
                                                className={cn(
                                                    "mr-2 h-3 w-3 shrink-0",
                                                    value === mdlItem.nama_barang ? "opacity-100 text-purple-600" : "opacity-0"
                                                )}
                                            />
                                            <div className="truncate">
                                                <div className="font-medium truncate">{mdlItem.nama_barang}</div>
                                                {(mdlItem.kategori_mdl || mdlItem.kode_barang) && (
                                                    <div className="text-[10px] text-muted-foreground truncate">
                                                        {mdlItem.kategori_mdl} {mdlItem.kode_barang ? `• ${mdlItem.kode_barang}` : ''}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                    {onOpenMasterData && (
                        <div className="p-1 border-t bg-neutral-50/50">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 justify-center h-7 font-normal"
                                onClick={() => {
                                    setOpen(false)
                                    onOpenMasterData()
                                }}
                            >
                                <Search className="h-3 w-3 mr-1.5" />
                                Buka Katalog Master Data...
                            </Button>
                        </div>
                    )}
                </Command>
            </PopoverContent>
        </Popover>
    )
}

function LantaiMultiSelectField({
    value,
    onChange,
    idPrefix = "floor",
    className,
    placeholder = "Pilih Lantai..."
}: {
    value: string
    onChange: (value: string) => void
    idPrefix?: string
    className?: string
    placeholder?: string
}) {
    const selectedList = value ? value.split(", ").filter(Boolean) : []
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                        "h-8 w-full text-xs justify-between font-normal px-2 bg-white",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <div className="flex gap-1 flex-wrap truncate max-w-[90%]">
                        {selectedList.length > 0 ? (
                            selectedList.map((val: string) => (
                                <Badge variant="secondary" key={val} className="text-[10px] h-5 px-1 font-normal">
                                    {val.replace("Lantai ", "L")}
                                </Badge>
                            ))
                        ) : (
                            placeholder
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-2" align="start">
                <div className="space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b">
                        <span className="text-xs font-semibold">Pilih Lantai</span>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 text-[10px]"
                            onClick={() => onChange("")}
                        >
                            Reset
                        </Button>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto space-y-1 py-1">
                        {Array.from({ length: 10 }, (_, i) => {
                            const floorValue = `Lantai ${i + 1}`;
                            const isSelected = selectedList.includes(floorValue);
                            return (
                                <div 
                                    key={floorValue} 
                                    className="flex items-center space-x-2 p-1 hover:bg-neutral-100 rounded-md cursor-pointer"
                                    onClick={() => {
                                        let newValues;
                                        if (isSelected) {
                                            newValues = selectedList.filter((v: string) => v !== floorValue);
                                        } else {
                                            newValues = [...selectedList, floorValue].sort();
                                        }
                                        onChange(newValues.join(", "));
                                    }}
                                >
                                    <Checkbox 
                                        id={`${idPrefix}-${i}`} 
                                        checked={isSelected}
                                        onCheckedChange={() => {}}
                                    />
                                    <label
                                        htmlFor={`${idPrefix}-${i}`}
                                        className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                    >
                                        {floorValue}
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}

export function ProjectItemFormDialog({ open, onOpenChange, projectId, item }: ProjectItemFormDialogProps) {
    const queryClient = useQueryClient()
    const isEdit = !!item

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            items: [{
                mdl_item_id: null,
                item: "",
                lantai: "",
                ruang: "",
                keterangan: "",
                volume: null,
                panjang: null,
                lebar: null,
                tinggi: null,
                satuan: "UNIT",
                jumlah: 1,
                custom: false,
                catatan: "",
            }]
        },
    })

    const { fields, append, remove, replace } = useFieldArray({
        control: form.control,
        name: "items",
    })

    React.useEffect(() => {
        if (open) {
            if (item) {
                replace([{
                    id: item.id ? Number(item.id) : undefined,
                    mdl_item_id: item.mdl_item_id ? Number(item.mdl_item_id) : null,
                    item: item.item,
                    lantai: item.lantai || "",
                    ruang: item.ruang || "",
                    keterangan: item.keterangan || "",
                    volume: item.volume !== null && item.volume !== undefined ? Number(item.volume) : null,
                    panjang: item.panjang !== null && item.panjang !== undefined ? Number(item.panjang) : null,
                    lebar: item.lebar !== null && item.lebar !== undefined ? Number(item.lebar) : null,
                    tinggi: item.tinggi !== null && item.tinggi !== undefined ? Number(item.tinggi) : null,
                    satuan: item.satuan || "UNIT",
                    jumlah: item.jumlah !== null && item.jumlah !== undefined ? Number(item.jumlah) : 1,
                    custom: (item.custom as any) === true || (item.custom as any) === 1 || (item.custom as any) === "1",
                    catatan: item.catatan || "",
                }])
            } else {
                replace([{
                    mdl_item_id: null,
                    item: "",
                    lantai: "",
                    ruang: "",
                    keterangan: "",
                    volume: null,
                    panjang: null,
                    lebar: null,
                    tinggi: null,
                    satuan: "UNIT",
                    jumlah: 1,
                    custom: false,
                    catatan: "",
                }])
            }
        }
    }, [open, item, replace])

    const watchedItems = useWatch({
        control: form.control,
        name: "items"
    });

    React.useEffect(() => {
        if (!watchedItems) return;

        watchedItems.forEach((item, index) => {
            const panjang = Number(item.panjang) || 0;
            const lebar = Number(item.lebar) || 0;
            const tinggi = Number(item.tinggi) || 0;
            const qty = Number(item.jumlah) || 0;
            const satuan = item.satuan;

            let calculatedVolume = item.volume;

            if (satuan === "M1") {
                calculatedVolume = panjang;
            } else if (satuan === "M2 (pxl)" || satuan === "M2_PXL") {
                calculatedVolume = panjang * lebar;
            } else if (satuan === "M2 (pxt)" || satuan === "M2_PXT") {
                calculatedVolume = panjang * tinggi;
            } else if (satuan === "UNIT" || satuan === "SET") {
                calculatedVolume = 1;
            }

            if (calculatedVolume !== item.volume) {
                form.setValue(`items.${index}.volume` as any, calculatedVolume, { 
                    shouldDirty: true,
                    shouldValidate: true
                });
            }
        });
    }, [watchedItems, form]);

    const { data: lokasiRes } = useQuery({
        queryKey: ['lokasi-mdl-options'],
        queryFn: () => LokasiMDLService.getLokasi({ per_page: -1 }),
        enabled: open,
    })
    const lokasiOptions = lokasiRes?.data || []

    const [selectorOpen, setSelectorOpen] = React.useState(false)
    const [activeIndex, setActiveIndex] = React.useState<number | null>(null)

    const selectMDLItemAtIndex = (index: number, mdlItem: MDLItem) => {
        form.setValue(`items.${index}.mdl_item_id` as any, mdlItem.id)
        form.setValue(`items.${index}.item` as any, mdlItem.nama_barang)
        form.setValue(`items.${index}.ruang` as any, mdlItem.lokasi_ruangan || "")
        form.setValue(`items.${index}.keterangan` as any, mdlItem.spesifikasi_dan_material || "")
        form.setValue(`items.${index}.panjang` as any, mdlItem.dimensi_panjang ?? null)
        form.setValue(`items.${index}.lebar` as any, mdlItem.dimensi_lebar ?? null)
        form.setValue(`items.${index}.tinggi` as any, mdlItem.dimensi_tinggi ?? null)
        form.setValue(`items.${index}.volume` as any, mdlItem.volume ?? null)
        if (mdlItem.kode_satuan_beli) {
            // Determine if kode_satuan_beli matches the allowed enum values: 'M1', 'M2', 'UNIT', 'SET'
            const normalizedSatuan = mdlItem.kode_satuan_beli.toUpperCase();
            if (['M1', 'M2', 'UNIT', 'SET'].includes(normalizedSatuan)) {
                form.setValue(`items.${index}.satuan` as any, normalizedSatuan)
            } else if (normalizedSatuan === 'PCS') {
                form.setValue(`items.${index}.satuan` as any, 'UNIT')
            } else {
                form.setValue(`items.${index}.satuan` as any, normalizedSatuan) // Let it pass if the Select accepts it or just use it
            }
        }
    }

    const handleSelectMDLItem = (mdlItem: MDLItem) => {
        if (activeIndex !== null) {
            selectMDLItemAtIndex(activeIndex, mdlItem)
            setSelectorOpen(false)
            setActiveIndex(null)
        }
    }

    const mutation = useMutation({
        mutationFn: async (values: FormValues) => {
            if (isEdit && item) {
                return projectV2Service.updateProjectItem(item.id, values.items[0])
            } else {
                return projectV2Service.createProjectItemsBulk(projectId, values.items)
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-v2-items", projectId] })
            toast.success(isEdit ? "Item updated successfully" : "Items added successfully")
            onOpenChange(false)
        },
        onError: (error) => {
            toast.error("Failed to save items")
            console.error(error)
        }
    })

    const onSubmit = (values: FormValues) => {
        mutation.mutate(values)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn(
                "overflow-hidden flex flex-col max-h-[90vh]",
                isEdit ? "max-w-[760px] p-0 gap-0" : "max-w-[95vw] lg:max-w-[1200px]"
            )}>
                <DialogHeader className={cn(isEdit && "p-6 pb-4 border-b bg-neutral-50/50")}>
                    {isEdit ? (
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                                <Package className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold text-neutral-900">
                                    Edit Item Project
                                </DialogTitle>
                                <DialogDescription className="text-xs text-neutral-500 mt-0.5">
                                    {item?.item ? `Mengubah rincian item: ${item.item}` : "Perbarui detail dan spesifikasi teknis item."}
                                </DialogDescription>
                            </div>
                        </div>
                    ) : (
                        <>
                            <DialogTitle>Add Project Items</DialogTitle>
                            <DialogDescription>
                                Add one or more items to this project. Each row is one item.
                            </DialogDescription>
                        </>
                    )}
                </DialogHeader>
                
                <Form {...(form as any)}>
                    <form onSubmit={form.handleSubmit(onSubmit as any, (errors) => console.error("Validation Errors:", errors))} className="flex flex-col gap-0 overflow-hidden">
                        {isEdit ? (
                            <div className="flex flex-col flex-1 overflow-hidden">
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[calc(90vh-140px)]">
                                    {/* Section 1: Informasi Item & Penempatan */}
                                    <div className="space-y-4 rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
                                        <div className="flex items-center gap-2 text-xs font-bold text-neutral-800 uppercase tracking-wider">
                                            <Package className="h-4 w-4 text-blue-600" />
                                            <span>Informasi Item & Penempatan</span>
                                        </div>

                                        <div className="space-y-3">
                                            <FormField
                                                control={form.control as any}
                                                name="items.0.item"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <div className="flex items-center justify-between">
                                                            <FormLabel className="text-xs font-semibold text-neutral-700">
                                                                Nama Item <span className="text-red-500">*</span>
                                                            </FormLabel>
                                                            <span className="text-[11px] text-muted-foreground">Ketik manual atau cari di katalog</span>
                                                        </div>
                                                        <FormControl>
                                                            <ItemNameComboboxField
                                                                value={field.value}
                                                                onChange={field.onChange}
                                                                className="h-9 text-xs"
                                                                onSelectMDLItem={(mdlItem) => selectMDLItemAtIndex(0, mdlItem)}
                                                                onOpenMasterData={() => {
                                                                    setActiveIndex(0)
                                                                    setSelectorOpen(true)
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <FormField
                                                    control={form.control as any}
                                                    name="items.0.lantai"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs font-semibold text-neutral-700">Lantai</FormLabel>
                                                            <FormControl>
                                                                <LantaiMultiSelectField
                                                                    value={field.value}
                                                                    onChange={field.onChange}
                                                                    idPrefix="edit-floor"
                                                                    className="h-9 text-xs"
                                                                    placeholder="Pilih Lantai..."
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control as any}
                                                    name="items.0.ruang"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs font-semibold text-neutral-700">Ruangan</FormLabel>
                                                            <FormControl>
                                                                <RuangComboboxField
                                                                    value={field.value}
                                                                    onChange={field.onChange}
                                                                    lokasiOptions={lokasiOptions}
                                                                    className="h-9 text-xs"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control as any}
                                                    name="items.0.custom"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs font-semibold text-neutral-700">Tipe Item</FormLabel>
                                                            <Select 
                                                                onValueChange={(val) => field.onChange(val === "1")} 
                                                                value={field.value ? "1" : "0"}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger className="h-9 text-xs bg-white">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="0" className="text-xs">Standar (Katalog)</SelectItem>
                                                                    <SelectItem value="1" className="text-xs">Custom (Pesanan Khusus)</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2: Dimensi & Kuantitas */}
                                    <div className="space-y-4 rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
                                        <div className="flex items-center gap-2 text-xs font-bold text-neutral-800 uppercase tracking-wider">
                                            <Boxes className="h-4 w-4 text-blue-600" />
                                            <span>Dimensi & Kuantitas</span>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                <FormField
                                                    control={form.control as any}
                                                    name="items.0.panjang"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs font-semibold text-neutral-700">Panjang (P)</FormLabel>
                                                            <FormControl>
                                                                <Input 
                                                                    type="number" 
                                                                    step="any"
                                                                    placeholder="0" 
                                                                    className="h-9 text-xs bg-white" 
                                                                    {...field} 
                                                                    value={field.value ?? ''} 
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control as any}
                                                    name="items.0.lebar"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs font-semibold text-neutral-700">Lebar (L)</FormLabel>
                                                            <FormControl>
                                                                <Input 
                                                                    type="number" 
                                                                    step="any"
                                                                    placeholder="0" 
                                                                    className="h-9 text-xs bg-white" 
                                                                    {...field} 
                                                                    value={field.value ?? ''} 
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control as any}
                                                    name="items.0.tinggi"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs font-semibold text-neutral-700">Tinggi (T)</FormLabel>
                                                            <FormControl>
                                                                <Input 
                                                                    type="number" 
                                                                    step="any"
                                                                    placeholder="0" 
                                                                    className="h-9 text-xs bg-white" 
                                                                    {...field} 
                                                                    value={field.value ?? ''} 
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control as any}
                                                    name="items.0.volume"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs font-semibold text-neutral-700">Volume (Vol)</FormLabel>
                                                            <FormControl>
                                                                <Input 
                                                                    type="number" 
                                                                    step="any"
                                                                    placeholder="Otomatis" 
                                                                    className="h-9 text-xs bg-white font-medium text-blue-700" 
                                                                    {...field} 
                                                                    value={field.value ?? ''} 
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                                <FormField
                                                    control={form.control as any}
                                                    name="items.0.satuan"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs font-semibold text-neutral-700">Satuan Ukuran</FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value || "UNIT"}>
                                                                <FormControl>
                                                                    <SelectTrigger className="h-9 text-xs bg-white">
                                                                        <SelectValue placeholder="Pilih Satuan" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="M1" className="text-xs">M1 (Meter Lari)</SelectItem>
                                                                    <SelectItem value="M2 (pxl)" className="text-xs">M2 (pxl) - Luas P x L</SelectItem>
                                                                    <SelectItem value="M2 (pxt)" className="text-xs">M2 (pxt) - Luas P x T</SelectItem>
                                                                    <SelectItem value="UNIT" className="text-xs">UNIT</SelectItem>
                                                                    <SelectItem value="SET" className="text-xs">SET</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control as any}
                                                    name="items.0.jumlah"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs font-semibold text-neutral-700">Jumlah (Qty)</FormLabel>
                                                            <FormControl>
                                                                <Input 
                                                                    type="number" 
                                                                    min={0} 
                                                                    step="any"
                                                                    placeholder="1" 
                                                                    className="h-9 text-xs bg-white" 
                                                                    {...field} 
                                                                    value={field.value ?? ''} 
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 3: Spesifikasi & Catatan */}
                                    <div className="space-y-4 rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
                                        <div className="flex items-center gap-2 text-xs font-bold text-neutral-800 uppercase tracking-wider">
                                            <FileText className="h-4 w-4 text-blue-600" />
                                            <span>Spesifikasi & Catatan Tambahan</span>
                                        </div>

                                        <div className="space-y-3">
                                            <FormField
                                                control={form.control as any}
                                                name="items.0.keterangan"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-semibold text-neutral-700">
                                                            Keterangan / Spesifikasi Material
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Textarea 
                                                                rows={3}
                                                                placeholder="Spesifikasi teknis, finishing, material pembentuk, warna, dll..." 
                                                                className="text-xs bg-white resize-y min-h-[70px]" 
                                                                {...field} 
                                                                value={field.value ?? ''} 
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control as any}
                                                name="items.0.catatan"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-semibold text-neutral-700">
                                                            Catatan
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Textarea 
                                                                rows={2}
                                                                placeholder="Catatan tambahan untuk tim produksi, marketing, atau instruksi pengerjaan..." 
                                                                className="text-xs bg-white resize-y min-h-[60px]" 
                                                                {...field} 
                                                                value={field.value ?? ''} 
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter className="p-4 px-6 border-t bg-neutral-50/50 flex items-center justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                        Batal
                                    </Button>
                                    <Button type="submit" disabled={mutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Simpan Perubahan
                                    </Button>
                                </DialogFooter>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto pb-4">
                                    <div className="min-w-[1300px] space-y-2">
                                        <div className="grid grid-cols-[1.2fr_0.5fr_0.9fr_0.4fr_0.4fr_0.4fr_0.5fr_0.6fr_0.4fr_1.1fr_0.6fr_1.1fr_40px] gap-0.5 px-1 text-xs font-medium text-muted-foreground uppercase">
                                            <div>Item Name</div>
                                            <div>Lantai</div>
                                            <div>Ruang</div>
                                            <div className="text-center">P</div>
                                            <div className="text-center">L</div>
                                            <div className="text-center">T</div>
                                            <div className="text-center">Vol</div>
                                            <div>Satuan</div>
                                            <div className="text-center">Qty</div>
                                            <div>Keterangan</div>
                                            <div>Tipe</div>
                                            <div>Catatan</div>
                                            <div></div>
                                        </div>
                                        
                                        <div className="space-y-2 max-h-[400px] overflow-y-auto px-1">
                                            {fields.map((field, index) => (
                                                <div key={field.id} className="grid grid-cols-[1.2fr_0.5fr_0.9fr_0.4fr_0.4fr_0.4fr_0.5fr_0.6fr_0.4fr_1.1fr_0.6fr_1.1fr_40px] gap-0.5 items-start">
                                                    <FormField
                                                        control={form.control as any}
                                                        name={`items.${index}.item`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <ItemNameComboboxField
                                                                        value={field.value}
                                                                        onChange={field.onChange}
                                                                        onSelectMDLItem={(mdlItem) => selectMDLItemAtIndex(index, mdlItem)}
                                                                        onOpenMasterData={() => {
                                                                            setActiveIndex(index)
                                                                            setSelectorOpen(true)
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control as any}
                                                        name={`items.${index}.lantai`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <LantaiMultiSelectField
                                                                        value={field.value}
                                                                        onChange={field.onChange}
                                                                        idPrefix={`table-floor-${index}`}
                                                                        placeholder="L"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control as any}
                                                        name={`items.${index}.ruang`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <RuangComboboxField
                                                                        value={field.value}
                                                                        onChange={field.onChange}
                                                                        lokasiOptions={lokasiOptions}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control as any}
                                                        name={`items.${index}.panjang`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input type="number" placeholder="P" className="h-8 text-xs text-center px-1" {...field} value={field.value ?? ''} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control as any}
                                                        name={`items.${index}.lebar`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input type="number" placeholder="L" className="h-8 text-xs text-center px-1" {...field} value={field.value ?? ''} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control as any}
                                                        name={`items.${index}.tinggi`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input type="number" placeholder="T" className="h-8 text-xs text-center px-1" {...field} value={field.value ?? ''} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control as any}
                                                        name={`items.${index}.volume`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input type="number" placeholder="Vol" className="h-8 text-xs text-center px-1" {...field} value={field.value ?? ''} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control as any}
                                                        name={`items.${index}.satuan`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <Select onValueChange={field.onChange} value={field.value || "UNIT"}>
                                                                    <FormControl>
                                                                        <SelectTrigger className="h-8 text-xs">
                                                                            <SelectValue placeholder="Unit" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="M1" className="text-xs">M1</SelectItem>
                                                                        <SelectItem value="M2 (pxl)" className="text-xs">M2 (pxl)</SelectItem>
                                                                        <SelectItem value="M2 (pxt)" className="text-xs">M2 (pxt)</SelectItem>
                                                                        <SelectItem value="UNIT" className="text-xs">UNIT</SelectItem>
                                                                        <SelectItem value="SET" className="text-xs">SET</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control as any}
                                                        name={`items.${index}.jumlah`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input type="number" min={0} placeholder="Qty" className="h-8 text-xs text-center px-1" {...field} value={field.value ?? ''} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control as any}
                                                        name={`items.${index}.keterangan`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input placeholder="Keterangan" className="h-8 text-xs" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control as any}
                                                        name={`items.${index}.custom`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <Select onValueChange={(val) => field.onChange(val === "1")} value={field.value ? "1" : "0"}>
                                                                    <FormControl>
                                                                        <SelectTrigger className="h-8 text-[10px] px-2">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="0" className="text-[10px]">Standar</SelectItem>
                                                                        <SelectItem value="1" className="text-[10px]">Custom</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control as any}
                                                        name={`items.${index}.catatan`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input placeholder="Catatan" className="h-8 text-xs" {...field} value={field.value ?? ''} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    {fields.length > 1 ? (
                                                        <Button 
                                                            type="button" 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => remove(index)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    ) : <div />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-fit"
                                    onClick={() => append({
                                        mdl_item_id: null,
                                        item: "",
                                        lantai: "",
                                        ruang: "",
                                        keterangan: "",
                                        volume: null,
                                        panjang: null,
                                        lebar: null,
                                        tinggi: null,
                                        satuan: "UNIT",
                                        jumlah: 1,
                                        custom: false,
                                        catatan: "",
                                    })}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Row
                                </Button>

                                <DialogFooter className="mt-4">
                                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={mutation.isPending}>
                                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save All Items
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </form>
                </Form>
            </DialogContent>

            <MDLItemSelectorDialog 
                open={selectorOpen}
                onOpenChange={setSelectorOpen}
                onSelect={handleSelectMDLItem}
            />
        </Dialog>
    )
}
