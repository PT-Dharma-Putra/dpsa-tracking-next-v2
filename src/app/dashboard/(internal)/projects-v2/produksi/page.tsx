"use client"

import Link from "next/link"
import { Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProjectsV2Table } from "../_components/projects-v2-table"

export default function ProduksiPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Produksi</h1>
                    <p className="text-sm text-muted-foreground">
                        Project production and tracking dashboard.
                    </p>
                </div>
                <Link href="/dashboard/projects-v2/produksi/items">
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2 text-xs h-9 shadow-sm">
                        <Package className="h-4 w-4" />
                        Lihat Semua Item Produksi
                    </Button>
                </Link>
            </div>

            <ProjectsV2Table showSPD={false} showProduksi={true} onlyShowDetail={true} />
        </div>
    )
}
