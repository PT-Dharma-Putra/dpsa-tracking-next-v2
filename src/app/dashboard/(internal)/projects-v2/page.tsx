"use client"

import { ProjectsV2Table } from "./_components/projects-v2-table"

export default function ProjectsV2Page() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight pt-4">Projects V2</h1>
                <p className="text-sm text-muted-foreground">
                    Manage projects directly using the simplified Projects V2 table.
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
                <ProjectsV2Table />
            </div>
        </div>
    )
}
