"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ProjectService } from "../../services/project-service"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Calendar, DollarSign, LayoutDashboard, AlertCircle, CheckCircle2, Search } from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

interface OverviewTabProps {
    projectId: number
}

export function OverviewTab({ projectId }: OverviewTabProps) {
    const [searchQuery, setSearchQuery] = useState("")

    const { data: overview, isLoading } = useQuery({
        queryKey: ['project-overview', projectId],
        queryFn: () => ProjectService.getOverview(projectId),
    });

    if (isLoading) {
        return <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-orange-600" /></div>;
    }

    if (!overview) {
        return <div className="text-center py-10 text-neutral-500">Failed to load overview data.</div>;
    }

    const { project, stats = {}, matrix = [], activity_stream = [] } = overview;

    const filteredMatrix = matrix?.filter((item: any) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const name = (item.name || "").toLowerCase();
        const ruang = (item.ruang || item.room || "").toLowerCase();
        const lantai = (item.lantai || item.floor || "").toLowerCase();
        return name.includes(q) || ruang.includes(q) || lantai.includes(q);
    });

    return (
        <div className="space-y-6">

            {/* 1. Activity Ticker (Running Text) */}
            {/* <div className="bg-neutral-900 text-white rounded-md p-2 flex items-center overflow-hidden">
                <div className="px-3 text-xs font-bold bg-orange-600 rounded mr-3 shrink-0 uppercase tracking-wider">Live Updates</div>
                <div className="flex-1 overflow-hidden relative h-6">
                    <div className="animate-marquee whitespace-nowrap absolute top-0.5 flex gap-8">
                        {activity_stream?.length === 0 ? (
                            <span className="text-sm text-neutral-400">No recent activity.</span>
                        ) : (
                            activity_stream?.map((log: string, i: number) => (
                                <span key={i} className="text-sm font-mono text-neutral-300 inline-flex items-center">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                                    {log}
                                </span>
                            ))
                        )}
                    </div>
                </div>
            </div> */}

            {/* 2. Project Health Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatsCard
                    title="Overall Progress"
                    value={`${stats.overall_progress ?? 0}%`}
                    icon={<LayoutDashboard className="h-4 w-4 text-blue-500" />}
                    desc={`The last progres: ${stats.last_progress_label || 'Draft'}`}
                />
                <StatsCard
                    title="SPK Value"
                    value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(stats.total_spk_value ?? 0)}
                    icon={<DollarSign className="h-4 w-4 text-green-500" />}
                    desc="Total SPK Value"
                />
                {(() => {
                    const days = stats.deadline_days;
                    let deadlineValue = "Belum diatur";
                    let deadlineColor = "text-neutral-900";

                    if (days !== null && days !== undefined) {
                        if (days < 0) {
                            deadlineValue = `Lewat ${Math.abs(days)} Hari`;
                            deadlineColor = "text-red-600";
                        } else {
                            deadlineValue = `Tersisa ${days} Hari`;
                            deadlineColor = days < 8 ? "text-orange-600" : "text-neutral-900";
                        }
                    }

                    return (
                        <StatsCard
                            title="Deadline"
                            value={deadlineValue}
                            valueClassName={deadlineColor}
                            icon={<Calendar className="h-4 w-4 text-orange-500" />}
                            desc={days !== null && project.deadline 
                                ? `Based on Schedule: ${format(new Date(project.deadline), 'd MMMM yyyy', { locale: idLocale })}` 
                                : "No Deadline Set"}
                        />
                    );
                })()}
            </div>

            {/* 3. Item Progress Matrix */}
            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle className="text-lg">Item Progres Matrix</CardTitle>
                        <CardDescription>Detailed breakdown of each item's status across all phases.</CardDescription>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
                        <Input
                            type="search"
                            placeholder="Cari item, ruang, lantai..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-white border-neutral-200 focus:ring-orange-500 text-sm h-9"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40px] text-center">No.</TableHead>
                                <TableHead className="w-[22%]">Nama Item</TableHead>
                                <TableHead className="w-[12%]">Lantai</TableHead>
                                <TableHead className="w-[13%]">Ruang</TableHead>
                                <TableHead className="w-[7%] text-center">QTY</TableHead>
                                <TableHead className="w-[22%]">Progres Produksi</TableHead>
                                <TableHead className="w-[10%] text-center">Terkirim</TableHead>
                                <TableHead className="w-[10%] text-center">Tersetting</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredMatrix?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8 text-neutral-500">
                                        Tidak ada item yang sesuai dengan pencarian "{searchQuery}".
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredMatrix?.map((item: any, index: number) => {
                                    // Calculate combined progress
                                    // If design is not needed or finished, show production progress
                                    const designProgress = item.design?.progress || 0;
                                    const productionProgress = item.production?.progress || 0;
                                    
                                    // Simple logic: if design is finished or not needed, show production. 
                                    // Otherwise show design.
                                    const workProgress = (!item.design?.needed || designProgress === 100) 
                                        ? Math.max(designProgress, productionProgress) 
                                        : designProgress;
                                    
                                    const shippedQty = item.shipped_qty ?? item.delivery?.shipped_qty ?? 0;
                                    const tersettingQty = item.tersetting_qty ?? item.install?.tersetting_qty ?? 0;
                                    const totalQty = item.qty ?? item.delivery?.qty ?? 1;

                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-center font-medium text-neutral-500">
                                                {index + 1}
                                            </TableCell>

                                            <TableCell className="font-medium text-neutral-900">
                                                {item.name}
                                                {item.design?.needed && <Badge variant="outline" className="ml-2 text-[10px]">Customize</Badge>}
                                            </TableCell>

                                            <TableCell className="font-medium text-neutral-600">
                                                {item.lantai || item.floor || "-"}
                                            </TableCell>

                                            <TableCell className="font-medium text-neutral-600">
                                                {item.ruang || item.room || "-"}
                                            </TableCell>

                                            <TableCell className="text-center font-medium text-neutral-800">
                                                {totalQty}
                                            </TableCell>

                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-neutral-700">
                                                            {workProgress === 100 ? "Selesai" : (designProgress < 100 && item.design?.needed ? "Design Phase" : "Production")}
                                                        </span>
                                                        <span className="text-neutral-500">{workProgress}%</span>
                                                    </div>
                                                    <Progress value={workProgress} className="h-2 bg-neutral-100" indicatorClassName="bg-blue-600" />
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-center whitespace-nowrap">
                                                <span className="text-xs font-semibold text-neutral-800">
                                                    {shippedQty} / {totalQty}
                                                </span>
                                            </TableCell>

                                            <TableCell className="text-center whitespace-nowrap">
                                                <span className="text-xs font-semibold text-neutral-800">
                                                    {tersettingQty} / {totalQty}
                                                </span>
                                            </TableCell>

                                            <TableCell className="text-right">
                                                {item.design?.progress === 100 ? (
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Ready</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-neutral-500">In Progress</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

function StatsCard({ title, value, icon, desc, valueClassName }: any) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium text-neutral-500">{title}</p>
                    {icon}
                </div>
                <div className={`text-2xl font-bold ${valueClassName || ''}`}>{value}</div>
                <p className="text-xs text-neutral-400 mt-1">{desc}</p>
            </CardContent>
        </Card>
    )
}
