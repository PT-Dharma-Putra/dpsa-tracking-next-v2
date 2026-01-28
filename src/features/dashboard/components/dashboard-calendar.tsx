"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { addDays, format, isSameDay, isWithinInterval, startOfDay } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { DateRange } from "react-day-picker"

// Mock data for project deadlines
const deadlines = [
    {
        date: new Date(), // Today
        title: "Project Alpha Renovation",
        status: "Urgent",
        progress: 90
    },
    {
        date: addDays(new Date(), 2),
        title: "Project Beta Interior",
        status: "In Progress",
        progress: 45
    },
    {
        date: addDays(new Date(), 5),
        title: "Office Tower C Maintenance",
        status: "Pending",
        progress: 0
    },
    {
        date: addDays(new Date(), 10),
        title: "Warehouse Logistics Upgrade",
        status: "In Progress",
        progress: 20
    }
]

export function DashboardCalendar() {
    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(),
        to: addDays(new Date(), 7),
    })

    const selectedDeadlines = date?.from
        ? deadlines.filter(d => {
            const target = startOfDay(d.date)
            const start = startOfDay(date.from!)
            const end = date.to ? startOfDay(date.to) : start

            return isWithinInterval(target, { start, end })
        })
        : []

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium">Project Calendar</CardTitle>
                <CardDescription className="text-xs">Select a date range to view deadlines.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-4 flex-1 p-4 pt-0">
                <div className="flex justify-center bg-white rounded-lg border border-neutral-100 p-2">
                    <Calendar
                        mode="range"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md"
                        modifiers={{
                            hasEvent: (date) => deadlines.some(d => isSameDay(d.date, date))
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

                <div className="flex-1 space-y-3 overflow-hidden flex flex-col">
                    <h3 className="text-xs font-semibold text-muted-foreground border-b pb-2 uppercase tracking-wider">
                        {date?.from ? (
                            date.to ? (
                                `${format(date.from, "LLL dd")} - ${format(date.to, "LLL dd, yyyy")}`
                            ) : (
                                format(date.from, "PPP")
                            )
                        ) : (
                            "Pick a date range"
                        )}
                    </h3>

                    <div className="flex-1 overflow-auto pr-2 space-y-3">
                        {selectedDeadlines.length > 0 ? (
                            selectedDeadlines.map((item, i) => (
                                <div key={i} className="bg-white p-3 rounded-lg border border-neutral-200 shadow-sm space-y-2 hover:border-orange-200 transition-colors">
                                    <div className="flex justify-between items-start gap-2">
                                        <p className="font-semibold text-sm text-neutral-900 leading-tight">{item.title}</p>
                                        <Badge variant={item.status === "Urgent" ? "destructive" : "secondary"} className="text-[10px] px-1.5 h-5">
                                            {item.status}
                                        </Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] text-muted-foreground">
                                            <span>DueDate: {format(item.date, "dd MMM")}</span>
                                            <span>{item.progress}%</span>
                                        </div>
                                        <div className="h-1 w-full bg-neutral-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${item.status === 'Urgent' ? 'bg-red-500' : 'bg-orange-500'}`}
                                                style={{ width: `${item.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-neutral-50/50 rounded-lg border border-dashed text-xs p-4 text-center">
                                <p>No deadlines found in this range.</p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
