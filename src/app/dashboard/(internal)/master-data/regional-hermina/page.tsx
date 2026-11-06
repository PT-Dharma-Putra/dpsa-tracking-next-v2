"use client"

import { RegionalHerminaTable } from "./_components/regional-hermina-table"

export default function RegionalHerminaPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight pt-4">Master Data Regional Hermina</h1>
                <p className="text-sm text-muted-foreground">
                    Kelola data regional Hermina, angka romawi, dan direktur terkait.
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
                <RegionalHerminaTable />
            </div>
        </div>
    )
}
