"use client"

import { useQuery } from "@tanstack/react-query"
import { ProjectService } from "@/features/projects/services/project-service"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Loader2, AlertCircle, Clock, ChevronRight } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"

export function IncomingOrdersWidget() {
    const router = useRouter()

    // Fetch Pending Projects
    const { data: projects, isLoading } = useQuery({
        queryKey: ['projects', 'status-pending'],
        queryFn: () => ProjectService.getProjects({ status: 'Pending' }),
    });

    // API returns { data: [...], meta: ... } usually
    const pendingProjects = Array.isArray(projects?.data) ? projects.data : (Array.isArray(projects) ? projects : []);

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center text-orange-600 gap-2 p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs font-medium">Loading orders...</span>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            <div className="px-4 py-3 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/30">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-neutral-800 leading-none">Incoming Orders</h3>
                        <p className="text-[10px] text-neutral-500 mt-0.5">
                            {pendingProjects.length} Request{pendingProjects.length !== 1 ? 's' : ''} Pending
                        </p>
                    </div>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs hover:bg-neutral-100" asChild>
                    <Link href="/dashboard/projects?status=Pending">
                        View All <ChevronRight className="h-3 w-3 ml-1" />
                    </Link>
                </Button>
            </div>

            <div className="flex-1 overflow-auto">
                {pendingProjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-neutral-400">
                        <div className="h-10 w-10 rounded-full bg-neutral-50 flex items-center justify-center mb-2">
                            <AlertCircle className="h-5 w-5 text-neutral-300" />
                        </div>
                        <p className="text-xs font-medium">No pending orders</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="bg-neutral-50/50 sticky top-0 z-10 transition-shadow shadow-sm">
                            <TableRow className="border-b border-neutral-100 hover:bg-transparent">
                                <TableHead className="w-[120px] h-8 text-xs font-semibold pl-4">Date</TableHead>
                                <TableHead className="h-8 text-xs font-semibold">Client / Project</TableHead>
                                <TableHead className="h-8 text-xs font-semibold w-[100px]">Status</TableHead>
                                <TableHead className="h-8 text-xs font-semibold text-right pr-4 w-[100px]">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingProjects.map((project: any) => {
                                const createdDate = project.created_at ? new Date(project.created_at) : null;
                                const isValidDate = createdDate && !isNaN(createdDate.getTime());

                                return (
                                    <TableRow key={project.id} className="group border-b border-neutral-50 hover:bg-orange-50/30 transition-colors">
                                        <TableCell className="py-2 pl-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium text-neutral-700">
                                                    {isValidDate ? createdDate.toLocaleDateString() : "-"}
                                                </span>
                                                <span className="text-[10px] text-neutral-400">
                                                    {isValidDate ? formatDistanceToNow(createdDate, { addSuffix: true }) : ""}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-2">
                                            <div className="flex flex-col max-w-[200px] lg:max-w-[300px]">
                                                <span className="text-xs font-bold text-neutral-900 truncate">
                                                    {project.name}
                                                </span>
                                                <span className="text-[10px] text-neutral-500 truncate flex items-center gap-1">
                                                    {project.client?.name || "Unknown"}
                                                    {project.client?.company_name && <span className="text-neutral-300">•</span>}
                                                    {project.client?.company_name}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-2">
                                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-[10px] px-1.5 py-0 h-5 font-medium shadow-none">
                                                {project.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right py-2 pr-4">
                                            <Button
                                                size="sm"
                                                variant="default"
                                                className="bg-white hover:bg-orange-50 text-orange-600 border border-orange-200 shadow-sm h-7 text-[10px] px-2"
                                                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                                            >
                                                Process
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    )
}
