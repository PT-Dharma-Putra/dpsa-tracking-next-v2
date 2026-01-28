"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"

export function RecentActivity() {
    // Mock data for now
    const activities = [
        {
            id: 1,
            user: "Agus Santoso",
            action: "created a new project",
            target: "Project Alpha Renovation",
            time: "2 mins ago",
            initials: "AS"
        },
        {
            id: 2,
            user: "System",
            action: "completed import",
            target: "MDL_Feb_2026.xlsx",
            time: "1 hour ago",
            initials: "SY"
        },
        {
            id: 3,
            user: "Budi Gunawan",
            action: "updated status to",
            target: "In Progress",
            time: "3 hours ago",
            initials: "BG"
        },
        {
            id: 4,
            user: "Siti Aminah",
            action: "commented on",
            target: "Material Request #123",
            time: "Yesterday",
            initials: "SA"
        },
        {
            id: 5,
            user: "Agus Santoso",
            action: "uploaded document",
            target: "ContractDraft.pdf",
            time: "Yesterday",
            initials: "AS"
        }
    ]

    return (
        <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[250px] px-4 pb-4">
                    <div className="space-y-4 pt-2">
                        {activities.map((activity) => (
                            <div key={activity.id} className="relative pl-4 pb-2 border-l last:border-0 border-neutral-200 ml-1">
                                <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-neutral-200 ring-4 ring-white" />
                                <div className="flex flex-col gap-0.5">
                                    <p className="text-xs text-neutral-800">
                                        <span className="font-semibold">{activity.user}</span> {activity.action}{" "}
                                        <span className="font-medium text-neutral-900">"{activity.target}"</span>
                                    </p>
                                    <p className="text-[10px] text-neutral-500">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
