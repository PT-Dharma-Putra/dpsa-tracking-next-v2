"use client"

import { Card, CardContent } from "@/components/ui/card"
import { MDLStats as MDLStatsType } from "../types"
import { FileSpreadsheet, Layers, Boxes } from "lucide-react"

interface MDLStatsProps {
    stats?: MDLStatsType;
}

export function MDLStats({ stats }: MDLStatsProps) {
    if (!stats) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
                <CardContent className="flex items-center p-6 gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                        <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                        <h3 className="text-2xl font-bold">{stats.totalItems.toLocaleString()}</h3>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="flex items-center p-6 gap-4">
                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Categories</p>
                        <h3 className="text-2xl font-bold">{stats.totalCategories}</h3>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="flex items-center p-6 gap-4">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                        <Boxes className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Categories Breakdown</p>
                        <p className="text-xs text-muted-foreground">
                            {Object.keys(stats.categoryCounts).length > 3
                                ? `${Object.keys(stats.categoryCounts).slice(0, 3).join(', ')}...`
                                : Object.keys(stats.categoryCounts).join(', ')
                            }
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
