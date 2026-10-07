"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday,
} from "date-fns"
import { id as idLocale } from "date-fns/locale"
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Truck,
    Building2,
    PackageCheck,
    PackageX,
    Clock,
    Search,
    FileText,
    CheckCircle2,
    AlertCircle,
    X,
    Layers,
    CalendarDays,
    Check,
    Loader2,
    CheckCircle,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    projectV2Service,
    CalendarDeliverySchedule,
    CalendarDeliveryItem,
    CalendarDeliveryDay,
    CalendarDeliveryClient,
} from "@/features/projects/services/project-v2-service"

export default function JadwalPengirimanPage() {
    const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date())
    const [selectedDate, setSelectedDate] = React.useState<Date>(new Date())
    const [selectedProjectForItems, setSelectedProjectForItems] = React.useState<CalendarDeliverySchedule | null>(null)

    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth() + 1

    const { data: calendarResponse, isLoading } = useQuery({
        queryKey: ["jadwal-pengiriman-calendar", year, month],
        queryFn: () => projectV2Service.getCalendarSchedules({ year, month }),
    })

    const handlePrevMonth = () => {
        setCurrentMonth(prev => subMonths(prev, 1))
    }

    const handleNextMonth = () => {
        setCurrentMonth(prev => addMonths(prev, 1))
    }

    const handleToday = () => {
        const today = new Date()
        setCurrentMonth(today)
        setSelectedDate(today)
    }

    // Days grid for the calendar
    const calendarDays = React.useMemo(() => {
        const monthStart = startOfMonth(currentMonth)
        const monthEnd = endOfMonth(monthStart)
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday first
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
        return eachDayOfInterval({ start: startDate, end: endDate })
    }, [currentMonth])

    // Delivery map by Y-m-d
    const deliveryMap = React.useMemo(() => {
        const map = new Map<string, CalendarDeliveryDay>()
        if (calendarResponse?.data) {
            calendarResponse.data.forEach((item: CalendarDeliveryDay) => {
                map.set(item.date, item)
            })
        }
        return map
    }, [calendarResponse])

    // Overall month statistics
    const monthStats = React.useMemo(() => {
        if (!calendarResponse?.data) {
            return { totalSchedules: 0, totalClients: 0, totalItems: 0, totalTerkirim: 0 }
        }
        let totalSchedules = 0
        const clientSet = new Set<string>()
        let totalItems = 0
        let totalTerkirim = 0

        calendarResponse.data.forEach((day: CalendarDeliveryDay) => {
            totalSchedules += day.schedules.length
            day.clients.forEach((c: CalendarDeliveryClient) => clientSet.add(c.name))
            day.schedules.forEach((s: CalendarDeliverySchedule) => {
                totalItems += s.summary.total_items
                totalTerkirim += s.summary.items_lengkap
            })
        })

        return {
            totalSchedules,
            totalClients: clientSet.size,
            totalItems,
            totalTerkirim,
        }
    }, [calendarResponse])

    // Selected date schedules
    const selectedDateStr = format(selectedDate, "yyyy-MM-dd")
    const selectedDayData = deliveryMap.get(selectedDateStr)

    const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]

    return (
        <div className="space-y-6 p-4 md:p-6 max-w-[1600px] mx-auto">
            {/* Page Header & Summary */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2.5">
                        <CalendarIcon className="h-6 w-6 text-orange-600" />
                        Kalender Jadwal Pengiriman
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Pantau jadwal pengiriman per klien, proyek, dan rincian realisasi item yang sudah terkirim.
                    </p>
                </div>

                {/* Quick Monthly Stats Pills */}
                <div className="flex flex-wrap items-center gap-2.5 text-xs">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200/80 text-orange-800">
                        <Truck className="h-3.5 w-3.5 text-orange-600" />
                        <span className="font-semibold">{monthStats.totalSchedules} Pengiriman</span>
                        <span className="text-orange-600/70">Bulan Ini</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200/80 text-blue-800">
                        <Building2 className="h-3.5 w-3.5 text-blue-600" />
                        <span className="font-semibold">{monthStats.totalClients} Klien</span>
                        <span className="text-blue-600/70">Terjadwal</span>
                    </div>
                </div>
            </div>

            {/* Split View: Calendar (Left) & Date Schedules (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* CALENDAR COLUMN */}
                <Card className="lg:col-span-8 shadow-sm border-neutral-200">
                    <CardHeader className="py-4 px-5 border-b bg-neutral-50/60 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-neutral-900 capitalize">
                                {format(currentMonth, "MMMM yyyy", { locale: idLocale })}
                            </span>
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-orange-500" />}
                        </div>

                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2.5 text-xs"
                                onClick={handleToday}
                            >
                                Bulan Ini
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={handlePrevMonth}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={handleNextMonth}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="p-3 md:p-5">
                        {/* Day Name Headers */}
                        <div className="grid grid-cols-7 gap-1.5 mb-2 text-center text-xs font-semibold text-neutral-500">
                            {dayNames.map((d, i) => (
                                <div
                                    key={d}
                                    className={cn(
                                        "py-1.5 rounded-md",
                                        i >= 5 ? "text-red-500 bg-red-50/40" : "text-neutral-600"
                                    )}
                                >
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1.5 md:gap-2">
                            {calendarDays.map((day) => {
                                const dayStr = format(day, "yyyy-MM-dd")
                                const dayDelivery = deliveryMap.get(dayStr)
                                const isCurrentMonth = isSameMonth(day, currentMonth)
                                const isSelected = isSameDay(day, selectedDate)
                                const isCurrentDay = isToday(day)
                                const hasDeliveries = dayDelivery && dayDelivery.schedules.length > 0

                                return (
                                    <div
                                        key={dayStr}
                                        onClick={() => setSelectedDate(day)}
                                        className={cn(
                                            "min-h-[90px] md:min-h-[105px] p-1.5 md:p-2 rounded-lg border transition-all cursor-pointer flex flex-col justify-between text-left select-none relative group",
                                            !isCurrentMonth && "bg-neutral-50/60 opacity-40 text-neutral-400 border-neutral-100",
                                            isCurrentMonth && !hasDeliveries && "bg-white hover:bg-neutral-50 border-neutral-200",
                                            isCurrentMonth && hasDeliveries && "bg-orange-50/20 border-orange-200 hover:border-orange-300 hover:bg-orange-50/30",
                                            isSelected && "ring-2 ring-orange-500 border-orange-500 shadow-sm z-10",
                                            isCurrentDay && !isSelected && "border-blue-400 bg-blue-50/10"
                                        )}
                                    >
                                        {/* Date header in cell */}
                                        <div className="flex items-center justify-between mb-1">
                                            <span
                                                className={cn(
                                                    "text-xs md:text-sm font-semibold rounded-full h-6 w-6 flex items-center justify-center",
                                                    isCurrentDay
                                                        ? "bg-blue-600 text-white shadow-xs"
                                                        : isSelected
                                                        ? "bg-orange-600 text-white shadow-xs"
                                                        : "text-neutral-800"
                                                )}
                                            >
                                                {format(day, "d")}
                                            </span>

                                            {hasDeliveries && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[10px] h-4.5 px-1.5 font-bold bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100 shrink-0"
                                                >
                                                    {dayDelivery.schedules.length}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Client Badges in cell */}
                                        <div className="space-y-1 overflow-hidden my-auto">
                                            {hasDeliveries && (
                                                <>
                                                    {dayDelivery.clients.slice(0, 2).map((client: CalendarDeliveryClient) => (
                                                        <div
                                                            key={client.id}
                                                            title={`${client.name} (${client.project_count} Proyek)`}
                                                            className="truncate text-[10px] md:text-[11px] font-medium px-1.5 py-0.5 rounded bg-white/90 border border-orange-200 text-orange-950 shadow-2xs flex items-center gap-1"
                                                        >
                                                            <Building2 className="h-2.5 w-2.5 text-orange-500 shrink-0" />
                                                            <span className="truncate">{client.name}</span>
                                                            {client.project_count > 1 && (
                                                                <span className="text-[9px] text-orange-600 font-bold shrink-0">
                                                                    ({client.project_count})
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}

                                                    {dayDelivery.clients.length > 2 && (
                                                        <div className="text-[9px] text-orange-700 font-semibold px-1">
                                                            +{dayDelivery.clients.length - 2} klien lainnya
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {/* Bottom subtle indicator if deliveries exist */}
                                        {hasDeliveries && (
                                            <div className="flex items-center justify-between gap-1 text-[9px] text-neutral-500 pt-0.5 border-t border-orange-100/60">
                                                <div className="flex items-center gap-1 truncate">
                                                    <Truck className="h-2.5 w-2.5 text-orange-500 shrink-0" />
                                                    <span className="truncate">
                                                        {dayDelivery.schedules.reduce((acc: number, s: CalendarDeliverySchedule) => acc + s.summary.total_items, 0)} item
                                                    </span>
                                                </div>
                                                {(() => {
                                                    const divisions = Array.from(
                                                        new Set(dayDelivery.schedules.map((s) => s.divisi_nama).filter(Boolean))
                                                    ) as string[]
                                                    if (divisions.length === 0) return null
                                                    return (
                                                        <span
                                                            className="text-[8.5px] font-semibold text-blue-700 bg-blue-50 px-1 rounded truncate max-w-[65px] border border-blue-200/60"
                                                            title={`Divisi: ${divisions.join(", ")}`}
                                                        >
                                                            {divisions.join(", ")}
                                                        </span>
                                                    )
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* SCHEDULES OF SELECTED DATE (RIGHT COLUMN) */}
                <div className="lg:col-span-4 space-y-4">
                    <Card className="shadow-sm border-neutral-200 sticky top-4">
                        <CardHeader className="py-4 px-5 border-b bg-neutral-50/60">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <span className="text-xs uppercase tracking-wider font-semibold text-neutral-500">
                                        Jadwal Tanggal
                                    </span>
                                    <CardTitle className="text-base font-bold text-neutral-900 capitalize">
                                        {format(selectedDate, "EEEE, d MMMM yyyy", { locale: idLocale })}
                                    </CardTitle>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "text-xs px-2 py-0.5 font-semibold",
                                        selectedDayData && selectedDayData.schedules.length > 0
                                            ? "bg-orange-50 text-orange-700 border-orange-200"
                                            : "bg-neutral-100 text-neutral-600 border-neutral-200"
                                    )}
                                >
                                    {selectedDayData ? selectedDayData.schedules.length : 0} Proyek
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="p-4 space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto">
                            {!selectedDayData || selectedDayData.schedules.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed rounded-lg bg-neutral-50/50">
                                    <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
                                        <CalendarDays className="h-5 w-5 text-neutral-400" />
                                    </div>
                                    <p className="text-sm font-semibold text-neutral-700">Tidak ada pengiriman</p>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
                                        Pilih tanggal dengan penanda oranye pada kalender untuk melihat daftar proyek pengiriman.
                                    </p>
                                </div>
                            ) : (
                                selectedDayData.schedules.map((schedule: CalendarDeliverySchedule) => (
                                    <Card
                                        key={schedule.id}
                                        className="border-neutral-200 bg-white hover:border-orange-300 transition-all shadow-2xs hover:shadow-sm overflow-hidden"
                                    >
                                        <div className="p-4 space-y-3">
                                            {/* Client and stage/divisi badge */}
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-700 min-w-0">
                                                    <Building2 className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                                                    <span className="truncate">{schedule.client_name}</span>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                                                    {schedule.divisi_nama && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[10px] h-4.5 px-1.5 font-bold bg-blue-50 text-blue-700 border-blue-200"
                                                        >
                                                            {schedule.divisi_nama}
                                                        </Badge>
                                                    )}
                                                    {schedule.keterangan && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-[10px] h-4.5 px-1.5 font-medium bg-neutral-100 text-neutral-700"
                                                        >
                                                            {schedule.keterangan}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Project Title */}
                                            <div>
                                                <h4 className="font-bold text-sm text-neutral-900 leading-snug">
                                                    {schedule.project_name}
                                                </h4>
                                                {schedule.nomor_spk && (
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        No. SPK: <span className="font-medium text-neutral-700">{schedule.nomor_spk}</span>
                                                    </p>
                                                )}
                                            </div>

                                            {/* Realization Progress */}
                                            <div className="space-y-1.5 pt-1 border-t border-neutral-100">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-muted-foreground">Realisasi Pengiriman:</span>
                                                    <span className="font-bold text-neutral-800 tabular-nums">
                                                        {schedule.summary.percent_terkirim}%
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={schedule.summary.percent_terkirim}
                                                    className="h-1.5 bg-neutral-100"
                                                />
                                                <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-0.5">
                                                    <span>
                                                        <strong className="text-emerald-600">{schedule.summary.items_lengkap}</strong> Lengkap
                                                    </span>
                                                    <span>
                                                        <strong className="text-amber-600">{schedule.summary.items_sebagian}</strong> Sebagian
                                                    </span>
                                                    <span>
                                                        <strong className="text-rose-600">{schedule.summary.items_belum}</strong> Belum
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-xs h-8 border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800 gap-1.5 font-medium mt-1"
                                                onClick={() => setSelectedProjectForItems(schedule)}
                                            >
                                                <PackageCheck className="h-3.5 w-3.5" />
                                                Lihat Rincian Item ({schedule.summary.total_items})
                                            </Button>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* PROJECT ITEMS MODAL DIALOG */}
            {selectedProjectForItems && (
                <ProjectItemsDialog
                    schedule={selectedProjectForItems}
                    open={!!selectedProjectForItems}
                    onOpenChange={(open) => {
                        if (!open) setSelectedProjectForItems(null)
                    }}
                />
            )}
        </div>
    )
}

interface ProjectItemsDialogProps {
    schedule: CalendarDeliverySchedule
    open: boolean
    onOpenChange: (open: boolean) => void
}

function ProjectItemsDialog({ schedule, open, onOpenChange }: ProjectItemsDialogProps) {
    const [searchQuery, setSearchQuery] = React.useState("")
    const [statusFilter, setStatusFilter] = React.useState<"all" | "lengkap" | "sebagian" | "belum">("all")

    // Filter items
    const filteredItems = React.useMemo(() => {
        return schedule.items.filter((item) => {
            const matchesStatus =
                statusFilter === "all" ? true : item.status === statusFilter

            const q = searchQuery.toLowerCase().trim()
            const matchesSearch =
                !q ||
                item.item.toLowerCase().includes(q) ||
                (item.ruang && item.ruang.toLowerCase().includes(q)) ||
                (item.lantai && item.lantai.toLowerCase().includes(q)) ||
                (Boolean(item.po_divisi || item.divisi_nama) &&
                    (item.po_divisi || item.divisi_nama)!.toLowerCase().includes(q))

            return matchesStatus && matchesSearch
        })
    }, [schedule.items, statusFilter, searchQuery])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[1050px] max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-4 border-b">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <DialogTitle className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                                <PackageCheck className="h-5 w-5 text-orange-600" />
                                Rincian Item Pengiriman
                            </DialogTitle>
                            <DialogDescription className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
                                <span className="font-semibold text-neutral-800">{schedule.project_name}</span>
                                <span className="text-neutral-300">•</span>
                                <span className="text-neutral-600">{schedule.client_name}</span>
                                {schedule.nomor_spk && (
                                    <>
                                        <span className="text-neutral-300">•</span>
                                        <span>No. SPK: {schedule.nomor_spk}</span>
                                    </>
                                )}
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                            {schedule.divisi_nama && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-bold">
                                    Divisi: {schedule.divisi_nama}
                                </Badge>
                            )}
                            {schedule.keterangan && (
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                    {schedule.keterangan}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Summary Stat Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-4">
                        <div className="p-2.5 rounded-lg border bg-neutral-50/60">
                            <span className="text-[11px] text-muted-foreground block">Total Item</span>
                            <span className="text-base font-bold text-neutral-900">{schedule.summary.total_items} Item</span>
                        </div>
                        <div className="p-2.5 rounded-lg border bg-emerald-50/50 border-emerald-200/60">
                            <span className="text-[11px] text-emerald-700 font-medium block">Selesai Terkirim</span>
                            <span className="text-base font-bold text-emerald-700">{schedule.summary.items_lengkap} Item</span>
                        </div>
                        <div className="p-2.5 rounded-lg border bg-amber-50/50 border-amber-200/60">
                            <span className="text-[11px] text-amber-700 font-medium block">Terkirim Sebagian</span>
                            <span className="text-base font-bold text-amber-700">{schedule.summary.items_sebagian} Item</span>
                        </div>
                        <div className="p-2.5 rounded-lg border bg-rose-50/50 border-rose-200/60">
                            <span className="text-[11px] text-rose-700 font-medium block">Belum Terkirim</span>
                            <span className="text-base font-bold text-rose-700">{schedule.summary.items_belum} Item</span>
                        </div>
                    </div>
                </DialogHeader>

                {/* Filter and Search Bar */}
                <div className="p-4 border-b bg-neutral-50/40 flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="relative w-full md:w-72">
                        <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <Input
                            placeholder="Cari item, PO divisi, ruang, atau lantai..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-8 text-xs bg-white"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>

                    {/* Filter Status Tabs */}
                    <div className="flex items-center gap-1 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                        <Button
                            variant={statusFilter === "all" ? "default" : "outline"}
                            size="sm"
                            className={cn("h-7 text-xs px-2.5", statusFilter === "all" && "bg-neutral-800 text-white")}
                            onClick={() => setStatusFilter("all")}
                        >
                            Semua ({schedule.items.length})
                        </Button>
                        <Button
                            variant={statusFilter === "belum" ? "default" : "outline"}
                            size="sm"
                            className={cn(
                                "h-7 text-xs px-2.5",
                                statusFilter === "belum" && "bg-rose-600 hover:bg-rose-700 text-white"
                            )}
                            onClick={() => setStatusFilter("belum")}
                        >
                            Belum ({schedule.summary.items_belum})
                        </Button>
                        <Button
                            variant={statusFilter === "sebagian" ? "default" : "outline"}
                            size="sm"
                            className={cn(
                                "h-7 text-xs px-2.5",
                                statusFilter === "sebagian" && "bg-amber-600 hover:bg-amber-700 text-white"
                            )}
                            onClick={() => setStatusFilter("sebagian")}
                        >
                            Sebagian ({schedule.summary.items_sebagian})
                        </Button>
                        <Button
                            variant={statusFilter === "lengkap" ? "default" : "outline"}
                            size="sm"
                            className={cn(
                                "h-7 text-xs px-2.5",
                                statusFilter === "lengkap" && "bg-emerald-600 hover:bg-emerald-700 text-white"
                            )}
                            onClick={() => setStatusFilter("lengkap")}
                        >
                            Lengkap ({schedule.summary.items_lengkap})
                        </Button>
                    </div>
                </div>

                {/* Table Content */}
                <div className="flex-1 overflow-y-auto p-4 max-h-[50vh]">
                    {filteredItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                            <Layers className="h-8 w-8 text-neutral-300 mb-2" />
                            <p className="text-sm font-semibold text-neutral-600">Tidak ada item yang sesuai</p>
                            <p className="text-xs">Coba sesuaikan kata kunci pencarian atau filter status.</p>
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader className="bg-neutral-50/80">
                                    <TableRow>
                                        <TableHead className="w-12 text-center text-xs">No</TableHead>
                                        <TableHead className="text-xs">Nama Item</TableHead>
                                        <TableHead className="text-xs">PO Divisi</TableHead>
                                        <TableHead className="text-xs">Ruang / Lantai</TableHead>
                                        <TableHead className="text-xs min-w-[130px]">Progress Produksi</TableHead>
                                        <TableHead className="text-right text-xs">Qty SPK</TableHead>
                                        <TableHead className="text-right text-xs">Terkirim</TableHead>
                                        <TableHead className="text-right text-xs">Sisa</TableHead>
                                        <TableHead className="text-center text-xs w-32">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredItems.map((item, idx) => (
                                        <TableRow key={item.id} className="hover:bg-neutral-50/60">
                                            <TableCell className="text-center text-xs text-neutral-500 font-medium">
                                                {idx + 1}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-semibold text-xs text-neutral-900 block">
                                                    {item.item}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {item.po_divisi || item.divisi_nama ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-purple-50 text-purple-700 border-purple-200 text-[11px] font-semibold whitespace-nowrap"
                                                    >
                                                        {item.po_divisi || item.divisi_nama}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs text-neutral-600">
                                                {[item.ruang, item.lantai ? `Lt. ${item.lantai}` : null]
                                                    .filter(Boolean)
                                                    .join(" • ") || "-"}
                                            </TableCell>
                                            <TableCell>
                                                {(() => {
                                                    const progress = Number(item.progress_produksi) || 0
                                                    return (
                                                        <div className="space-y-1 w-[120px]">
                                                            <div className="flex items-center justify-between text-[11px] font-medium">
                                                                <span
                                                                    className={
                                                                        progress >= 100
                                                                            ? "text-emerald-700 font-semibold"
                                                                            : progress > 0
                                                                            ? "text-blue-700"
                                                                            : "text-neutral-400"
                                                                    }
                                                                >
                                                                    {progress}%
                                                                </span>
                                                                <span className="text-[10px] text-neutral-400">
                                                                    {progress >= 100
                                                                        ? "Selesai"
                                                                        : progress > 0
                                                                        ? "Proses"
                                                                        : "Belum"}
                                                                </span>
                                                            </div>
                                                            <Progress
                                                                value={progress}
                                                                className={cn(
                                                                    "h-1.5",
                                                                    progress >= 100
                                                                        ? "[&>div]:bg-emerald-600"
                                                                        : progress > 0
                                                                        ? "[&>div]:bg-blue-600"
                                                                        : "[&>div]:bg-neutral-300"
                                                                )}
                                                            />
                                                        </div>
                                                    )
                                                })()}
                                            </TableCell>
                                            <TableCell className="text-right text-xs font-semibold tabular-nums">
                                                {item.jumlah} {item.satuan || ""}
                                            </TableCell>
                                            <TableCell className="text-right text-xs font-bold tabular-nums text-neutral-900">
                                                {item.qty_terkirim} {item.satuan || ""}
                                            </TableCell>
                                            <TableCell className="text-right text-xs font-bold tabular-nums text-neutral-700">
                                                {item.sisa > 0 ? (
                                                    <span className="text-rose-600">{item.sisa}</span>
                                                ) : (
                                                    <span className="text-neutral-400">0</span>
                                                )}{" "}
                                                {item.satuan || ""}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {item.status === "lengkap" && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold gap-1 h-5"
                                                    >
                                                        <CheckCircle className="h-3 w-3 text-emerald-600" />
                                                        Lengkap
                                                    </Badge>
                                                )}
                                                {item.status === "sebagian" && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-semibold gap-1 h-5"
                                                    >
                                                        <Clock className="h-3 w-3 text-amber-600" />
                                                        Sebagian
                                                    </Badge>
                                                )}
                                                {item.status === "belum" && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-semibold gap-1 h-5"
                                                    >
                                                        <PackageX className="h-3 w-3 text-rose-600" />
                                                        Belum
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-4 border-t bg-neutral-50/40 sm:justify-end">
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
