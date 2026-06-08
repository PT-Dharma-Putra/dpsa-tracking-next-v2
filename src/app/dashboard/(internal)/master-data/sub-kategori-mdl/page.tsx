"use client"

import { SubKategoriTable } from "./_components/sub-kategori-table"

export default function SubKategoriMDLPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight pt-4">Master Data Sub Kategori MDL</h1>
                <p className="text-sm text-muted-foreground">
                    Kelola sub kategori MDL untuk inventori dan katalog.
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
                <SubKategoriTable />
            </div>
        </div>
    )
}
