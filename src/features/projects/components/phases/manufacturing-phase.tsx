"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, AlertCircle, Play, Package, Loader, Calendar, Wrench } from "lucide-react"
import Link from "next/link"

interface ManufacturingPhaseProps {
    project: any
}

export function ManufacturingPhase({ project }: ManufacturingPhaseProps) {
    // HARDCODED STATUS FOR DEMO
    const productionStatus = [
        { id: 1, name: "Cutting", status: "completed", progress: 100, operator: "Budi", time: "2h 30m" },
        { id: 2, name: "Lamination", status: "completed", progress: 100, operator: "Asep", time: "4h 15m" },
        { id: 3, name: "Edging", status: "in_progress", progress: 65, operator: "Ujang", time: "Running..." },
        { id: 4, name: "CNC / Drilling", status: "pending", progress: 0, operator: "-", time: "-" },
        { id: 5, name: "Assembly", status: "pending", progress: 0, operator: "-", time: "-" },
        { id: 6, name: "Finishing", status: "pending", progress: 0, operator: "-", time: "-" },
        { id: 7, name: "QC", status: "pending", progress: 0, operator: "-", time: "-" },
    ];

    return (
        <div className="space-y-6">
            {/* Header / Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-emerald-50 border-emerald-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-800">Production Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-emerald-600" />
                            <span className="text-2xl font-bold text-emerald-700">In Progress</span>
                        </div>
                        <p className="text-xs text-emerald-600 mt-1">On Schedule</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Total Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-slate-400" />
                            <span className="text-2xl font-bold text-slate-700">{project.items?.length || 12}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Items in Production</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Estimated Completion</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-slate-400" />
                            <span className="text-2xl font-bold text-slate-700">24 Feb 2026</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">5 Days Remaining</p>
                    </CardContent>
                </Card>
            </div>

            {/* Workflow Timeline (Hardcoded) */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Manufacturing Workflow</CardTitle>
                            <CardDescription>Real-time progress of production stages</CardDescription>
                        </div>
                        <Link href={`/dashboard/tracking/${project.id}/production`}>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                <Wrench className="w-4 h-4 mr-2" />
                                Go to Production Floor
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="relative space-y-0">
                        {productionStatus.map((stage, index) => (
                            <div key={stage.id} className="flex gap-4 pb-8 last:pb-0 relative">
                                {/* Connector Line */}
                                {index !== productionStatus.length - 1 && (
                                    <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-slate-100" />
                                )}

                                {/* Icon / Status */}
                                <div className={`relative z-10 flex cursor-default h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 ${getStatusColor(stage.status)}`}>
                                    {getStatusIcon(stage.status)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 pt-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="font-semibold text-lg text-slate-800">{stage.name}</h4>
                                        <Badge variant={stage.status === 'completed' ? 'default' : (stage.status === 'in_progress' ? 'secondary' : 'outline')}>
                                            {stage.status === 'in_progress' ? 'Running' : stage.status}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <div>
                                            <span className="block text-slate-400 text-xs">Progress</span>
                                            <span className="font-medium text-slate-700">{stage.progress}%</span>
                                        </div>
                                        <div>
                                            <span className="block text-slate-400 text-xs">Operator</span>
                                            <span className="font-medium text-slate-700">{stage.operator}</span>
                                        </div>
                                        <div className="col-span-2 md:col-span-2">
                                            <span className="block text-slate-400 text-xs">Duration/Time</span>
                                            <span className="font-medium text-slate-700">{stage.time}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function getStatusColor(status: string) {
    switch (status) {
        case 'completed': return 'bg-emerald-100 border-emerald-500 text-emerald-600';
        case 'in_progress': return 'bg-blue-100 border-blue-500 text-blue-600';
        default: return 'bg-slate-50 border-slate-200 text-slate-300';
    }
}

function getStatusIcon(status: string) {
    switch (status) {
        case 'completed': return <CheckCircle2 className="w-6 h-6" />;
        case 'in_progress': return <Play className="w-5 h-5 animate-pulse" />;
        default: return <Clock className="w-5 h-5" />;
    }
}
