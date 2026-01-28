"use client"

import { useQuery } from "@tanstack/react-query"
import { ProjectService } from "../../services/project-service"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Calendar, DollarSign, LayoutDashboard, AlertCircle, CheckCircle2 } from "lucide-react"

interface OverviewTabProps {
    projectId: number
}

export function OverviewTab({ projectId }: OverviewTabProps) {
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

    return (
        <div className="space-y-6">

            {/* 1. Activity Ticker (Running Text) */}
            <div className="bg-neutral-900 text-white rounded-md p-2 flex items-center overflow-hidden">
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
                        {/* Duplicate for seamless loop if needed, simplified here */}
                    </div>
                </div>
            </div>

            {/* 2. Project Health Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatsCard
                    title="Overall Progress"
                    value={`${stats.overall_progress ?? 0}%`}
                    icon={<LayoutDashboard className="h-4 w-4 text-blue-500" />}
                    desc="Weighted based on Design"
                />
                <StatsCard
                    title="Estimated Value"
                    value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(stats.total_sph_value ?? 0)}
                    icon={<DollarSign className="h-4 w-4 text-green-500" />}
                    desc="Total SPH Value"
                />
                <StatsCard
                    title="Deadline"
                    value={`${stats.deadline_days ?? 0} Days Left`}
                    icon={<Calendar className="h-4 w-4 text-orange-500" />}
                    desc="Based on Schedule"
                />
            </div>

            {/* 3. Item Progress Matrix */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Item Progress Matrix</CardTitle>
                    <CardDescription>Detailed breakdown of each item's status across all phases.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[30%]">Item Name</TableHead>
                                <TableHead className="w-[20%]">Design Phase</TableHead>
                                <TableHead className="w-[20%]">Production</TableHead>
                                <TableHead className="w-[20%]">Installation</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {matrix?.map((item: any) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium text-neutral-900">
                                        {item.name}
                                        {item.design.needed && <Badge variant="outline" className="ml-2 text-[10px]">Customize</Badge>}
                                    </TableCell>

                                    {/* Design Column */}
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span className={item.design.needed ? "text-neutral-700" : "text-neutral-300"}>
                                                    {item.design.needed ? item.design.status.replace('_', ' ') : "N/A"}
                                                </span>
                                                <span className="text-neutral-500">{item.design.progress}%</span>
                                            </div>
                                            <Progress value={item.design.progress} className="h-1.5 bg-neutral-100" indicatorClassName="bg-blue-600" />
                                        </div>
                                    </TableCell>

                                    {/* Production Column (Future) */}
                                    <TableCell>
                                        <div className="space-y-1 opacity-50">
                                            <div className="flex justify-between text-xs text-neutral-400">
                                                <span>Pending</span>
                                                <span>0%</span>
                                            </div>
                                            <Progress value={0} className="h-1.5" />
                                        </div>
                                    </TableCell>

                                    {/* Install Column (Future) */}
                                    <TableCell>
                                        <div className="space-y-1 opacity-50">
                                            <div className="flex justify-between text-xs text-neutral-400">
                                                <span>Pending</span>
                                                <span>0%</span>
                                            </div>
                                            <Progress value={0} className="h-1.5" />
                                        </div>
                                    </TableCell>

                                    <TableCell className="text-right">
                                        {item.design.progress === 100 ? (
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Ready</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-neutral-500">In Progress</Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

function StatsCard({ title, value, icon, desc }: any) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium text-neutral-500">{title}</p>
                    {icon}
                </div>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-neutral-400 mt-1">{desc}</p>
            </CardContent>
        </Card>
    )
}
