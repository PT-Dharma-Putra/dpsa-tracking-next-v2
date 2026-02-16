"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useQuery } from "@tanstack/react-query"
import { InternalDashboardService, ActivityItem } from "@/features/dashboard/services/internal-dashboard-service"
import { Activity } from "lucide-react"

export function RecentActivity() {
    const { data, isLoading } = useQuery({
        queryKey: ['dashboard-overview'],
        queryFn: InternalDashboardService.getOverview,
        refetchInterval: 30000
    })

    const activities: ActivityItem[] = data?.recent_activity || []

    // Loading skeleton
    if (isLoading) {
        return (
            <Card className="flex-1 flex flex-col border-0 shadow-none">
                <CardHeader className="pb-2 pt-3 px-3">
                    <CardTitle className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="h-3 w-3" />
                        Recent Activity
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                    <div className="px-3 pb-3 space-y-3 pt-1">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="pl-3 border-l border-neutral-200 ml-1 animate-pulse">
                                <div className="h-2.5 w-3/4 bg-neutral-100 rounded mb-1" />
                                <div className="h-2 w-16 bg-neutral-100 rounded" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="flex-1 flex flex-col border-0 shadow-none">
            <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="h-3 w-3" />
                    Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                <ScrollArea className="flex-1 px-3 pb-3">
                    <div className="space-y-3 pt-1">
                        {activities.length === 0 ? (
                            <div className="py-6 text-center text-neutral-400">
                                <p className="text-xs">No recent activity</p>
                            </div>
                        ) : (
                            activities.map((activity) => (
                                <div key={activity.id} className="relative pl-3 pb-1 border-l last:border-0 border-neutral-200 ml-1">
                                    <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-orange-200 ring-2 ring-white" />
                                    <div className="flex flex-col gap-0.5">
                                        <p className="text-[11px] text-neutral-800 leading-tight">
                                            <span className="font-semibold">{activity.user}</span> {activity.action}{" "}
                                            <span className="font-medium text-neutral-900">"{activity.target}"</span>
                                        </p>
                                        <p className="text-[10px] text-neutral-400">{activity.time}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
