"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { isSameDay } from "date-fns"
import { useQuery } from "@tanstack/react-query"
import { ProjectService } from "@/features/projects/services/project-service"
import { Loader2, CalendarDays } from "lucide-react"

export function DashboardCalendar() {
    const [date, setDate] = useState<Date | undefined>(new Date())

    // Fetch projects (TODO: add date range filter when backend supports it)
    const { data: projectsData, isLoading } = useQuery({
        queryKey: ['projects', 'calendar'],
        queryFn: () => ProjectService.getProjects(),
    })

    const projects = Array.isArray(projectsData?.data) ? projectsData.data : (Array.isArray(projectsData) ? projectsData : [])

    // Map projects to deadline dates
    const deadlineDates = projects.map((p: any) => {
        if (p.due_date) return new Date(p.due_date)
        if (p.start_date) {
            const d = new Date(p.start_date)
            d.setDate(d.getDate() + 14)
            return d
        }
        return null
    }).filter(Boolean) as Date[]

    // Count deadlines for selected date
    const selectedDateCount = date
        ? deadlineDates.filter(d => isSameDay(d, date)).length
        : 0

    if (isLoading) {
        return (
            <div className="h-[280px] flex items-center justify-center text-orange-600 gap-2 p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs font-medium">Loading schedule...</span>
            </div>
        )
    }

    return (
        <div className="flex flex-col bg-white">
            {/* Header */}
            <div className="px-3 pt-3 pb-1 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-orange-600" />
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Schedule</h3>
                {selectedDateCount > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 h-4 bg-orange-50 text-orange-600 border-orange-100">
                        {selectedDateCount} deadline{selectedDateCount > 1 ? 's' : ''}
                    </Badge>
                )}
            </div>
            {/* Calendar - Compact, single-date select */}
            <div className="flex items-center justify-center pb-2 px-2">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border-0 p-0"
                    classNames={{
                        day_selected: "bg-orange-600 text-white hover:bg-orange-600 hover:text-white focus:bg-orange-600 focus:text-white",
                        day_today: "bg-neutral-100 text-neutral-900",
                    }}
                    modifiers={{
                        hasEvent: (date) => deadlineDates.some(d => isSameDay(d, date))
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
        </div>
    )
}
