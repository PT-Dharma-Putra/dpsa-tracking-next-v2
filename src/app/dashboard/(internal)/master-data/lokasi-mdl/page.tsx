"use client"

import { LokasiTable } from "./_components/lokasi-table"

export default function LokasiMDLPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight pt-4">Master Data Lokasi MDL</h1>
                <p className="text-sm text-muted-foreground">
                    Kelola lokasi MDL untuk penempatan barang dan inventori.
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
                <LokasiTable />
            </div>
        </div>
    )
}
