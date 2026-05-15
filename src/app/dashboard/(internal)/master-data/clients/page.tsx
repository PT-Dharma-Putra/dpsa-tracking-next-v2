"use client"

import { ClientTable } from "./_components/client-table"

export default function ClientsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight pt-4">Master Data Client</h1>
                <p className="text-sm text-muted-foreground">
                    Kelola data client untuk monitoring project dan penagihan.
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
                <ClientTable />
            </div>
        </div>
    )
}
