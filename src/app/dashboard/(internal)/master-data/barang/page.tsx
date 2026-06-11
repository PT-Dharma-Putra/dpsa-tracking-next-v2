"use client"

import { BarangTable } from "./_components/barang-table"

export default function BarangPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight pt-4">Master Data Barang</h1>
                <p className="text-sm text-muted-foreground">
                    Kelola data barang termasuk spesifikasi, dimensi, harga, dan garansi.
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
                <BarangTable />
            </div>
        </div>
    )
}
