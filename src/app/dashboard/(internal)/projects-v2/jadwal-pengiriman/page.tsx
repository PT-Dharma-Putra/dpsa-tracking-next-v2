"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { Truck, Calendar, ChevronRight, MapPin, Info } from "lucide-react"
import { projectV2Service } from "@/features/projects/services/project-v2-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export default function JadwalPengirimanPage() {
    const { data: dates, isLoading: isLoadingDates } = useQuery({
        queryKey: ["tanggal-pengiriman"],
        queryFn: () => projectV2Service.getTanggalPengiriman(),
    })

    const { data: schedules, isLoading: isLoadingSchedules } = useQuery({
        queryKey: ["jadwal-pengiriman"],
        queryFn: () => projectV2Service.getJadwalPengiriman(),
    })

    if (isLoadingDates || isLoadingSchedules) {
        return (
            <div className="space-y-6 p-6">
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-64 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        )
    }

    // Group schedules by tanggal_pengiriman_id
    const groupedSchedules = dates?.map(date => {
        const dateSchedules = schedules?.filter(s => s.tanggal_pengiriman_id === date.id) || []
        return {
            ...date,
            schedules: dateSchedules
        }
    }).filter(d => d.schedules.length > 0)

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Master Jadwal Pengiriman</h1>
                <p className="text-sm text-muted-foreground">
                    Daftar pengiriman project yang telah dijadwalkan.
                </p>
            </div>

            {groupedSchedules?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed rounded-xl bg-neutral-50/50 text-neutral-400">
                    <Calendar className="h-12 w-12 mb-4 opacity-20" />
                    <p className="font-medium">Belum ada jadwal pengiriman</p>
                    <p className="text-sm">Jadwalkan pengiriman dari tabel Project V2</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {groupedSchedules?.map((dateGroup) => (
                        <Card key={dateGroup.id} className="overflow-hidden border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="bg-neutral-50/80 border-b py-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-orange-500" />
                                        <span className="font-bold text-neutral-800">
                                            {format(new Date(dateGroup.tanggal), "EEEE, d MMM yyyy")}
                                        </span>
                                    </div>
                                    <Badge variant="outline" className="bg-white">
                                        {dateGroup.schedules.length} Project
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-neutral-100">
                                    {dateGroup.schedules.map((schedule) => (
                                        <div key={schedule.id} className="p-4 hover:bg-neutral-50/50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-semibold text-sm text-neutral-900 flex items-center gap-1.5">
                                                    <Truck className="h-3.5 w-3.5 text-neutral-400" />
                                                    {schedule.project?.name}
                                                </h3>
                                                <ChevronRight className="h-4 w-4 text-neutral-300" />
                                            </div>
                                            
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                                                    <MapPin className="h-3 w-3" />
                                                    {schedule.project?.client?.name || "No Client"}
                                                </div>
                                                {schedule.keterangan && (
                                                    <div className="flex items-start gap-1.5 text-xs text-neutral-400 italic bg-neutral-50 p-1.5 rounded">
                                                        <Info className="h-3 w-3 mt-0.5 shrink-0" />
                                                        {schedule.keterangan}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
