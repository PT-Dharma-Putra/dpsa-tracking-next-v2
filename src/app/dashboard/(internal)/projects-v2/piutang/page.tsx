"use client"

import { ProjectsV2Table } from "../_components/projects-v2-table"

export default function PiutangPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight pt-4">Keuangan - Piutang</h1>
                <p className="text-sm text-muted-foreground">
                    Manajemen penagihan dan piutang proyek.
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
                <ProjectsV2Table showSPD={false} showPiutang={true} onlyShowDetail={true} />
            </div>
        </div>
    )
}
