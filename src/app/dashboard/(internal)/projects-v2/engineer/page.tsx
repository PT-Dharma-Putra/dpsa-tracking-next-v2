"use client"

import { ProjectsV2Table } from "../_components/projects-v2-table"

export default function EngineerPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight pt-4">Project V2 | Engineer</h1>
                <p className="text-sm text-muted-foreground">
                    View project tracking list with design specifications (SPD).
                </p>
            </div>

            <ProjectsV2Table showSPD={true} onlyShowDetail={true} showEngineer={true} />
        </div>
    )
}
