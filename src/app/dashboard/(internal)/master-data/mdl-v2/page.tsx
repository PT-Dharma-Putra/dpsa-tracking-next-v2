"use client"

import { MdlTable } from "./_components/mdl-table"

export default function MdlV2Page() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight pt-4">Master Data MDL V2</h1>
                <p className="text-sm text-muted-foreground">
                    Kelola data MDL V2 dengan relasi kategori, sub kategori, lokasi, dan barang.
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
                <MdlTable />
            </div>
        </div>
    )
}
