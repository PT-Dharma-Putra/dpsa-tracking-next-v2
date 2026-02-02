"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useQuery } from "@tanstack/react-query"
import { InternalDashboardService } from "@/features/dashboard/services/internal-dashboard-service"

export function RecentActivity() {
    // Real data fetch
    const { data } = useQuery({
        queryKey: ['dashboard-overview'],
        queryFn: InternalDashboardService.getOverview,
        refetchInterval: 30000
    })

    const activities = data?.recent_activity || []

    return (
        <Card className="flex-1 flex flex-col border-0 shadow-none">
            <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                <ScrollArea className="flex-1 px-3 pb-3">
                    <div className="space-y-3 pt-1">
                        {activities.map((activity: any) => (
                            <div key={activity.id} className="relative pl-3 pb-1 border-l last:border-0 border-neutral-200 ml-1">
                                <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-neutral-200 ring-2 ring-white" />
                                <div className="flex flex-col gap-0.5">
                                    <p className="text-[11px] text-neutral-800 leading-tight">
                                        <span className="font-semibold">{activity.user}</span> {activity.action}{" "}
                                        <span className="font-medium text-neutral-900">"{activity.target}"</span>
                                    </p>
                                    <p className="text-[10px] text-neutral-400">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
