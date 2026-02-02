"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { addDays, format, isSameDay, isWithinInterval, startOfDay } from "date-fns"
import { DateRange } from "react-day-picker"
import { useQuery } from "@tanstack/react-query"
import { ProjectService } from "@/features/projects/services/project-service"
import { Loader2 } from "lucide-react"

export function DashboardCalendar() {
    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(),
        to: addDays(new Date(), 7),
    })

    // Fetch Real Projects
    const { data: projectsData, isLoading } = useQuery({
        queryKey: ['projects', 'calendar'],
        queryFn: () => ProjectService.getProjects(),
    })

    // Normalize data structure (handle potential pagination wrapper)
    const projects = Array.isArray(projectsData?.data) ? projectsData.data : (Array.isArray(projectsData) ? projectsData : [])

    // Map projects to deadline format
    const deadlines = projects.map((p: any) => {
        // Use due_date or fallback to created_at + 14 days logic
        const targetDate = p.due_date ? new Date(p.due_date) : (p.start_date ? addDays(new Date(p.start_date), 14) : new Date())

        // Calculate theoretical progress based on status
        let progress = 0;
        switch (p.status) {
            case 'completed': progress = 100; break;
            case 'delivery': progress = 90; break;
            case 'quality_check': progress = 75; break;
            case 'in_progress': progress = 50; break;
            case 'pending': progress = 25; break;
            case 'negotiation': progress = 10; break;
            default: progress = 0;
        }

        return {
            id: p.id,
            date: targetDate,
            title: p.name,
            status: p.status === 'pending' ? 'Pending' : (p.status === 'negotiation' ? 'Urgent' : 'In Progress'), // Simplified mapping
            progress: progress,
            client: p.client?.name
        }
    })

    const selectedDeadlines = date?.from
        ? deadlines.filter((d: any) => {
            const target = startOfDay(d.date)
            const start = startOfDay(date.from!)
            const end = date.to ? startOfDay(date.to) : start

            return isWithinInterval(target, { start, end })
        })
        : []

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center text-orange-600 gap-2 p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs font-medium">Loading schedule...</span>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col md:flex-row gap-0 bg-white">
            {/* Calendar Section */}
            <div className="p-3 border-b md:border-b-0 md:border-r border-neutral-100 flex flex-col items-center justify-center shrink-0">
                <Calendar
                    mode="range"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border-0 p-0"
                    classNames={{
                        day_selected: "bg-orange-600 text-white hover:bg-orange-600 hover:text-white focus:bg-orange-600 focus:text-white",
                        day_today: "bg-neutral-100 text-neutral-900",
                    }}
                    modifiers={{
                        hasEvent: (date) => deadlines.some((d: any) => isSameDay(d.date, date))
                    }}
                    modifiersStyles={{
                        hasEvent: {
                            fontWeight: "bold",
                            textDecoration: "underline",
                            color: "#ea580c"
                        }
                    }}
                />
            </div>

            {/* Details Section */}
            <div className="flex-1 flex flex-col min-w-0 p-3">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-neutral-800">Project Schedule</h3>
                        <Badge variant="outline" className="text-[10px] font-normal text-neutral-500 border-neutral-200">
                            {date?.from ? (
                                date.to ? (
                                    `${format(date.from, "LLL dd")} - ${format(date.to, "LLL dd")}`
                                ) : (
                                    format(date.from, "PPP")
                                )
                            ) : (
                                "Select dates"
                            )}
                        </Badge>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                    {selectedDeadlines.length > 0 ? (
                        selectedDeadlines.map((item: any, i: number) => (
                            <div key={i} className="group flex items-center justify-between p-2 rounded-lg border border-neutral-100 bg-neutral-50/50 hover:bg-white hover:border-orange-200 hover:shadow-sm transition-all">
                                <div className="min-w-0 flex-1 mr-3">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <p className="font-semibold text-xs text-neutral-900 truncate">{item.title}</p>
                                        <Badge variant={item.status === "Urgent" ? "destructive" : "secondary"} className="text-[10px] px-1 h-4 rounded-sm">
                                            {item.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                                        <span>Due: {format(item.date, "dd MMM")}</span>
                                        <span className="text-neutral-300">•</span>
                                        <span>{item.client}</span>
                                        <div className="h-1 w-12 bg-neutral-200 rounded-full overflow-hidden ml-auto">
                                            <div
                                                className={`h-full ${item.status === 'Urgent' ? 'bg-red-500' : 'bg-orange-500'}`}
                                                style={{ width: `${item.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-neutral-400 text-center py-4">
                            <p className="text-xs">No deadlines in range</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
