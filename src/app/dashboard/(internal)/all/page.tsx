"use client"

import { ProjectsV2Table } from "../projects-v2/_components/projects-v2-table"

export default function AllProjectsPage() {
    return (
        <div className="space-y-6 w-full max-w-full overflow-hidden">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight pt-4">Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                    Manage and track all projects in one place.
                </p>
            </div>

            <ProjectsV2Table showAllDashboard={true} />
        </div>
    )
}
