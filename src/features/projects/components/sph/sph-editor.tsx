"use client"

"use client"

import { useState, useEffect } from "react"
import { SPHTable } from "./sph-table"
import { SPHSummary } from "./sph-summary"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface Item {
    id: string;
    description: string;
    spec: string;
    qty: number;
    unit: string;
    price: number;
    image: string | null;
}

import { useParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ProjectService } from "@/features/projects/services/project-service"
import { toast } from "sonner"

export function SPHEditor() {
    const params = useParams()
    const projectId = Number(params.id)
    const queryClient = useQueryClient()

    // Query Items
    const { data: fetchedItems = [], isLoading } = useQuery({
        queryKey: ['sph-items', projectId],
        queryFn: async () => {
            const res = await ProjectService.getSPHItems(projectId)
            // Map backend response to frontend Item structure
            return (res.data || []).map((i: any) => ({
                id: String(i.id),
                description: i.name,
                spec: i.description || '-',
                qty: Number(i.qty),
                unit: i.unit,
                price: Number(i.unit_price),
                image: null // TODO: handle images later
            }))
        }
    })

    // Local state for editing (synced with fetched data initially)
    const [items, setItems] = useState<Item[]>([])

    // Sync when fetched
    useEffect(() => {
        if (fetchedItems.length > 0) {
            setItems(fetchedItems)
        }
    }, [fetchedItems])

    // Save Mutation
    const saveMutation = useMutation({
        mutationFn: async (currentItems: Item[]) => {
            return await ProjectService.saveSPHItems(projectId, currentItems)
        },
        onSuccess: () => {
            toast.success("Draft saved successfully")
            queryClient.invalidateQueries({ queryKey: ['sph-items', projectId] })
        },
        onError: (err) => {
            toast.error("Failed to save draft")
            console.error(err)
        }
    })

    const total = items.reduce((acc, item) => acc + (item.price * item.qty), 0)

    const handleSave = () => {
        saveMutation.mutate(items)
    }

    const handleAddItem = () => {
        const newItem: Item = {
            id: 'temp-' + Math.random().toString(36).substr(2, 9),
            description: 'New Item',
            spec: '-',
            qty: 1,
            unit: 'ls',
            price: 0,
            image: null
        }
        setItems([...items, newItem])
    }

    if (isLoading && items.length === 0) {
        return <div className="p-8 text-center text-neutral-400">Loading items...</div>
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT COLUMN: EDITOR */}
            <div className="lg:col-span-9 space-y-6">
                <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                        <h3 className="font-bold text-neutral-700 text-sm uppercase tracking-wide">Bill of Quantities</h3>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={handleAddItem}>
                                <Plus className="h-4 w-4 mr-2" />
                                Custom Item
                            </Button>
                            <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                                <Plus className="h-4 w-4 mr-2" />
                                Add from MDL
                            </Button>
                        </div>
                    </div>

                    <SPHTable items={items} onUpdate={setItems} />

                    <div className="p-4 bg-neutral-50/50 border-t border-neutral-100 text-center">
                        <p className="text-xs text-neutral-400">Drag items to reorder. Click text to edit.</p>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: SUMMARY */}
            <div className="lg:col-span-3">
                <SPHSummary
                    total={total}
                    onSave={() => alert('Saved!')}
                    onGenerate={() => alert('Generate PDF')}
                />
            </div>
        </div>
    )
}
