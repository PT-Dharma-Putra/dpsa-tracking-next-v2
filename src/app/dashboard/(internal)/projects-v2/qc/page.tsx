"use client"

import { ProjectsV2Table } from "../_components/projects-v2-table"

export default function QCPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight pt-4">Quality Control (QC)</h1>
                <p className="text-sm text-muted-foreground">
                    Project quality control and tracking dashboard.
                </p>
            </div>

            <ProjectsV2Table showSPD={false} showQC={true} onlyShowDetail={true} />
        </div>
    )
}
