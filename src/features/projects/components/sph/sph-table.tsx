"use client"

import { useState } from "react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { GripVertical, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface SPHItem {
    id: string;
    description: string;
    spec: string;
    qty: number;
    unit: string;
    price: number;
    image: string | null;
}

interface SPHTableProps {
    items: SPHItem[];
    onUpdate: (items: SPHItem[]) => void;
}

export function SPHTable({ items, onUpdate }: SPHTableProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((i) => i.id === active.id)
            const newIndex = items.findIndex((i) => i.id === over.id)
            onUpdate(arrayMove(items, oldIndex, newIndex))
        }
    }

    const removeItem = (id: string) => {
        onUpdate(items.filter(i => i.id !== id))
    }

    const updateItem = (id: string, field: keyof SPHItem, value: any) => {
        onUpdate(items.map(i => i.id === id ? { ...i, [field]: value } : i))
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
                <Table>
                    <TableHeader className="bg-neutral-100">
                        <TableRow>
                            <TableHead className="w-[40px]"></TableHead>
                            <TableHead className="w-[60px]">No</TableHead>
                            <TableHead className="w-[300px]">Item Description</TableHead>
                            <TableHead>Specification</TableHead>
                            <TableHead className="w-[80px]">Qty</TableHead>
                            <TableHead className="w-[80px]">Unit</TableHead>
                            <TableHead className="w-[150px] text-right">Unit Price</TableHead>
                            <TableHead className="w-[150px] text-right">Total</TableHead>
                            <TableHead className="w-[40px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center text-neutral-400">
                                    No items added. Start by adding from MDL or create custom.
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item, index) => (
                                <SortableRow key={item.id} item={item} index={index} onRemove={removeItem} onUpdate={updateItem} />
                            ))
                        )}
                    </TableBody>
                </Table>
            </SortableContext>
        </DndContext>
    )
}

function SortableRow({ item, index, onRemove, onUpdate }: { item: SPHItem, index: number, onRemove: (id: string) => void, onUpdate: (id: string, field: keyof SPHItem, value: any) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    const total = item.qty * item.price

    return (
        <TableRow ref={setNodeRef} style={style} className="group bg-white hover:bg-neutral-50">
            <TableCell>
                <button {...attributes} {...listeners} className="cursor-grab hover:text-orange-600 text-neutral-400">
                    <GripVertical className="h-4 w-4" />
                </button>
            </TableCell>
            <TableCell className="font-mono text-neutral-500 text-xs">{index + 1}</TableCell>
            <TableCell>
                <div className="flex gap-3 items-center">
                    {item.image && (
                        <div className="h-10 w-10 bg-neutral-100 rounded border border-neutral-200 shrink-0 overflow-hidden">
                            <img src={item.image} alt="" className="h-full w-full object-cover" />
                        </div>
                    )}
                    <Input
                        value={item.description}
                        onChange={(e) => onUpdate(item.id, 'description', e.target.value)}
                        className="h-8 border-transparent hover:border-neutral-200 focus:border-orange-500 bg-transparent font-medium"
                    />
                </div>
            </TableCell>
            <TableCell>
                <Input
                    value={item.spec}
                    onChange={(e) => onUpdate(item.id, 'spec', e.target.value)}
                    className="h-8 border-transparent hover:border-neutral-200 bg-transparent text-sm text-neutral-500"
                    placeholder="Specification..."
                />
            </TableCell>
            <TableCell>
                <Input
                    type="number"
                    value={item.qty}
                    onChange={(e) => onUpdate(item.id, 'qty', Number(e.target.value))}
                    className="h-8 border-neutral-200 text-center"
                />
            </TableCell>
            <TableCell>
                <Input
                    value={item.unit}
                    onChange={(e) => onUpdate(item.id, 'unit', e.target.value)}
                    className="h-8 border-transparent hover:border-neutral-200 bg-transparent text-center text-xs uppercase text-neutral-500"
                />
            </TableCell>
            <TableCell className="text-right">
                <Input
                    type="number"
                    value={item.price}
                    onChange={(e) => onUpdate(item.id, 'price', Number(e.target.value))}
                    className="h-8 border-transparent hover:border-neutral-200 bg-transparent text-right font-mono"
                />
            </TableCell>
            <TableCell className="text-right font-bold text-neutral-900 font-mono">
                {new Intl.NumberFormat('id-ID').format(total)}
            </TableCell>
            <TableCell>
                <Button variant="ghost" size="sm" onClick={() => onRemove(item.id)} className="h-8 w-8 p-0 text-neutral-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </TableCell>
        </TableRow>
    )
}
