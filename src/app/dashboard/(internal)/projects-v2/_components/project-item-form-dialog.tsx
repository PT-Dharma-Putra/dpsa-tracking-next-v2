"use client"

import * as React from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Trash2 } from "lucide-react"

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
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { toast } from "sonner"
import { projectV2Service, ProjectItemV2, MDLItem } from "@/features/projects/services/project-v2-service"
import { cn } from "@/lib/utils"
import { MDLItemSelectorDialog } from "./mdl-item-selector-dialog"

const itemSchema = z.object({
    id: z.number().optional(), // For edit mode
    item: z.string().min(1, "Item Name is required"),
    mdl_item_id: z.number().nullable().default(null),
    lantai: z.string().default(""),
    ruang: z.string().default(""),
    keterangan: z.string().default(""),
    volume: z.preprocess((val) => (val === "" || val === null ? null : Number(val)), z.number().nullable()),
    panjang: z.preprocess((val) => (val === "" || val === null ? null : Number(val)), z.number().nullable()),
    lebar: z.preprocess((val) => (val === "" || val === null ? null : Number(val)), z.number().nullable()),
    tinggi: z.preprocess((val) => (val === "" || val === null ? null : Number(val)), z.number().nullable()),
    satuan: z.string().default("UNIT"),
    jumlah: z.preprocess((val) => (val === "" || val === null ? 1 : Number(val)), z.number().min(1, "Quantity must be at least 1")),
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
                    id: item.id,
                    mdl_item_id: item.mdl_item_id,
                    item: item.item,
                    lantai: item.lantai || "",
                    ruang: item.ruang || "",
                    keterangan: item.keterangan || "",
                    volume: item.volume,
                    panjang: item.panjang,
                    lebar: item.lebar,
                    tinggi: item.tinggi,
                    satuan: item.satuan || "UNIT",
                    jumlah: item.jumlah,
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
                }])
            }
        }
    }, [open, item, replace])

    const [selectorOpen, setSelectorOpen] = React.useState(false)
    const [activeIndex, setActiveIndex] = React.useState<number | null>(null)

    const handleSelectMDLItem = (mdlItem: MDLItem) => {
        if (activeIndex !== null) {
            form.setValue(`items.${activeIndex}.mdl_item_id` as any, mdlItem.id)
            form.setValue(`items.${activeIndex}.item` as any, mdlItem.nama_barang)
            form.setValue(`items.${activeIndex}.ruang` as any, mdlItem.lokasi_ruangan || "")
            form.setValue(`items.${activeIndex}.keterangan` as any, mdlItem.spesifikasi_dan_material || "")
            form.setValue(`items.${activeIndex}.panjang` as any, mdlItem.dimensi_panjang ?? null)
            form.setValue(`items.${activeIndex}.lebar` as any, mdlItem.dimensi_lebar ?? null)
            form.setValue(`items.${activeIndex}.tinggi` as any, mdlItem.dimensi_tinggi ?? null)
            form.setValue(`items.${activeIndex}.volume` as any, mdlItem.volume ?? null)
            if (mdlItem.kode_satuan_beli) {
                // Determine if kode_satuan_beli matches the allowed enum values: 'M1', 'M2', 'UNIT', 'SET'
                const normalizedSatuan = mdlItem.kode_satuan_beli.toUpperCase();
                if (['M1', 'M2', 'UNIT', 'SET'].includes(normalizedSatuan)) {
                    form.setValue(`items.${activeIndex}.satuan` as any, normalizedSatuan)
                } else if (normalizedSatuan === 'PCS') {
                    form.setValue(`items.${activeIndex}.satuan` as any, 'UNIT')
                } else {
                    form.setValue(`items.${activeIndex}.satuan` as any, normalizedSatuan) // Let it pass if the Select accepts it or just use it
                }
            }
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
            <DialogContent className="max-w-[95vw] lg:max-w-[1200px] overflow-hidden flex flex-col max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Item" : "Add Project Items"}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? "Update item details." : "Add one or more items to this project. Each row is one item."}
                    </DialogDescription>
                </DialogHeader>
                
                <Form {...(form as any)}>
                    <form onSubmit={form.handleSubmit(onSubmit as any)} className="flex flex-col gap-4 overflow-hidden">
                        <div className="overflow-x-auto pb-4">
                            <div className="min-w-[1200px] space-y-2">
                                <div className="grid grid-cols-[1.2fr_0.5fr_0.9fr_1.1fr_0.4fr_0.4fr_0.4fr_0.5fr_0.6fr_0.4fr_40px] gap-0.5 px-1 text-xs font-medium text-muted-foreground uppercase">
                                    <div>Item Name</div>
                                    <div>Lantai</div>
                                    <div>Ruang</div>
                                    <div>Keterangan</div>
                                    <div className="text-center">P</div>
                                    <div className="text-center">L</div>
                                    <div className="text-center">T</div>
                                    <div className="text-center">Vol</div>
                                    <div>Satuan</div>
                                    <div className="text-center">Qty</div>
                                    <div></div>
                                </div>
                                
                                <div className="space-y-2 max-h-[400px] overflow-y-auto px-1">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="grid grid-cols-[1.2fr_0.5fr_0.9fr_1.1fr_0.4fr_0.4fr_0.4fr_0.5fr_0.6fr_0.4fr_40px] gap-0.5 items-start">
                                            <FormField
                                                control={form.control as any}
                                                name={`items.${index}.item`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                className="h-8 w-full text-xs justify-start font-normal px-2 truncate bg-white"
                                                                onClick={() => {
                                                                    setActiveIndex(index)
                                                                    setSelectorOpen(true)
                                                                }}
                                                            >
                                                                {field.value || <span className="text-muted-foreground">Select item...</span>}
                                                            </Button>
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
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <FormControl>
                                                                    <Button
                                                                        variant="outline"
                                                                        role="combobox"
                                                                        className={cn(
                                                                            "h-8 w-full text-xs justify-between font-normal px-2 bg-white",
                                                                            !field.value && "text-muted-foreground"
                                                                        )}
                                                                    >
                                                                        <div className="flex gap-1 flex-wrap truncate max-w-[90%]">
                                                                            {field.value ? (
                                                                                field.value.split(", ").map((val: string) => (
                                                                                    <Badge variant="secondary" key={val} className="text-[10px] h-5 px-1 font-normal">
                                                                                        {val.replace("Lantai ", "L")}
                                                                                    </Badge>
                                                                                ))
                                                                            ) : (
                                                                                "L"
                                                                            )}
                                                                        </div>
                                                                        <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                                                                    </Button>
                                                                </FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-[200px] p-2" align="start">
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center justify-between pb-2 border-b">
                                                                        <span className="text-xs font-semibold">Pilih Lantai</span>
                                                                        <Button 
                                                                            variant="ghost" 
                                                                            size="sm" 
                                                                            className="h-6 px-2 text-[10px]"
                                                                            onClick={() => field.onChange("")}
                                                                        >
                                                                            Reset
                                                                        </Button>
                                                                    </div>
                                                                    <div className="max-h-[200px] overflow-y-auto space-y-1 py-1">
                                                                        {Array.from({ length: 10 }, (_, i) => {
                                                                            const floorValue = `Lantai ${i + 1}`;
                                                                            const isSelected = field.value?.split(", ").includes(floorValue);
                                                                            return (
                                                                                <div 
                                                                                    key={floorValue} 
                                                                                    className="flex items-center space-x-2 p-1 hover:bg-neutral-100 rounded-md cursor-pointer"
                                                                                    onClick={() => {
                                                                                        const currentValues = field.value ? field.value.split(", ") : [];
                                                                                        let newValues;
                                                                                        if (isSelected) {
                                                                                            newValues = currentValues.filter((v: string) => v !== floorValue);
                                                                                        } else {
                                                                                            newValues = [...currentValues, floorValue].sort();
                                                                                        }
                                                                                        field.onChange(newValues.join(", "));
                                                                                    }}
                                                                                >
                                                                                    <Checkbox 
                                                                                        id={`floor-${index}-${i}`} 
                                                                                        checked={isSelected}
                                                                                        onCheckedChange={() => {}} // handled by div onClick
                                                                                    />
                                                                                    <label
                                                                                        htmlFor={`floor-${index}-${i}`}
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
                                                            <Textarea 
                                                                placeholder="Ruang" 
                                                                className="min-h-[32px] h-[32px] text-xs resize-none px-2 py-1" 
                                                                {...field} 
                                                            />
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
                                                name={`items.${index}.panjang`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input type="number" placeholder="P" className="h-8 text-xs text-center px-1" {...field} value={field.value === null || field.value === 0 ? '' : field.value} />
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
                                                            <Input type="number" placeholder="L" className="h-8 text-xs text-center px-1" {...field} value={field.value === null || field.value === 0 ? '' : field.value} />
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
                                                            <Input type="number" placeholder="T" className="h-8 text-xs text-center px-1" {...field} value={field.value === null || field.value === 0 ? '' : field.value} />
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
                                                            <Input type="number" placeholder="Vol" className="h-8 text-xs text-center px-1" {...field} value={field.value === null || field.value === 0 ? '' : field.value} />
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
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="h-8 text-xs">
                                                                    <SelectValue placeholder="Unit" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="M1" className="text-xs">M1</SelectItem>
                                                                <SelectItem value="M2" className="text-xs">M2</SelectItem>
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
                                                            <Input type="number" placeholder="Qty" className="h-8 text-xs text-center px-1" {...field} value={field.value === null || field.value === 0 ? '' : field.value} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            {!isEdit && fields.length > 1 ? (
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

                        {!isEdit && (
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
                                })}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Row
                            </Button>
                        )}

                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEdit ? "Update Item" : "Save All Items"}
                            </Button>
                        </DialogFooter>
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
