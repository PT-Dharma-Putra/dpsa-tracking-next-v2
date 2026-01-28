"use client"

import { MDLStats } from "@/features/mdl/components/mdl-stats"
import { MDLTable } from "@/features/mdl/components/mdl-table"
import { MDLFormModal } from "@/features/mdl/components/mdl-form-modal"

import { MDLItem } from "@/features/mdl/types"
import { useState } from "react"
import { FileSpreadsheet, Plus, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function MDLPage() {
    const [stats, setStats] = useState<any>(null)
    const [formOpen, setFormOpen] = useState(false)
    const [editItem, setEditItem] = useState<MDLItem | null>(null)

    const handleEdit = (item: MDLItem) => {
        setEditItem(item)
        setFormOpen(true)
    }

    const handleCreate = () => {
        setEditItem(null)
        setFormOpen(true)
    }

    const handleSuccess = () => {
        // We can trigger a refetch here if needed, but for now the query invalidation should happen
        // Ideally we pass a refetch trigger or use query client invalidation
        // But since the table uses its own query, we might need to utilize queryClient in the form component or pass a callback
        // For simplicity, let's assume the table will refetch if we change its key or via react-query window focus
        // Better yet: passing a refresh key prop to table?
        // Or actually, `window.location.reload()` is blunt.
        // Let's rely on React Query's built-in refetch if we invalidate the key 'mdl-items'
        // For now let's just close modal
        window.location.reload() // Quick fix to refresh data for now
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                        <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Master Data List (MDL)</h1>
                        <p className="text-muted-foreground">Manage material prices and specifications.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/mdl/import">
                        <Button variant="outline">
                            <Upload className="w-4 h-4 mr-2" />
                            Import Excel
                        </Button>
                    </Link>
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreate}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Item
                    </Button>
                </div>
            </div>

            {/* Stats will be populated by data from the table query or separate stats query */}
            {/* For now, placeholder stats */}
            <MDLStats stats={stats || {
                totalItems: 0,
                totalCategories: 0,
                categoryCounts: {}
            }} />

            <MDLTable
                onEdit={handleEdit}
                onStatsUpdate={setStats}
            />


            <MDLFormModal
                open={formOpen}
                onOpenChange={setFormOpen}
                item={editItem}
                onSuccess={handleSuccess}
            />
        </div>
    )
}
