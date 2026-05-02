"use client"

import { DivisiTable } from "./_components/divisi-table"

export default function DivisiPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight pt-4">Master Data Divisi</h1>
                <p className="text-sm text-muted-foreground">
                    Kelola data divisi untuk pembagian pekerjaan pada project items.
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
                <DivisiTable />
            </div>
        </div>
    )
}
