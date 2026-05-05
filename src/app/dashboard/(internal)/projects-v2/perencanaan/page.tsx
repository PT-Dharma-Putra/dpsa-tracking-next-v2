"use client"

import { ProjectsV2Table } from "../_components/projects-v2-table"

export default function PerencanaanPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight pt-4">Perencanaan</h1>
                <p className="text-sm text-muted-foreground">
                    Project planning and tracking dashboard.
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
                <ProjectsV2Table showSPD={false} showPerencanaan={true} onlyShowDetail={true} />
            </div>
        </div>
    )
}
