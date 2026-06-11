"use client"

import { KategoriTable } from "./_components/kategori-table"

export default function KategoriMDLPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight pt-4">Master Data Kategori MDL</h1>
                <p className="text-sm text-muted-foreground">
                    Kelola kategori MDL untuk inventori dan monitoring.
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
                <KategoriTable />
            </div>
        </div>
    )
}
