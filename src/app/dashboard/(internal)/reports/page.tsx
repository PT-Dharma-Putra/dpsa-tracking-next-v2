"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import {
  FileText,
  CheckCircle2,
  CircleDollarSign,
  AlertTriangle,
  Lightbulb,
  CalendarDays,
  ChevronDown,
  Check,
  ChevronsUpDown,
  Loader2
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts"
import { useQuery, useInfiniteQuery } from "@tanstack/react-query"
import { getReportsData } from "@/features/dashboard/services/dashboard-reports-service"
import { ClientService } from "@/features/clients/services/client-service"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CatatanKeterlambatanDialog } from "@/app/dashboard/(internal)/projects-v2/_components/catatan-keterlambatan-dialog"

// Custom Label for Center of Donut Chart
const renderCustomizedLabel = ({ cx, cy, value, text1, text2 }: any) => {
  return (
    <g>
      <text x={cx} y={cy - 5} textAnchor="middle" dominantBaseline="central" className="font-bold text-3xl fill-slate-900">
        {text1}
      </text>
      <text x={cx} y={cy + 15} textAnchor="middle" dominantBaseline="central" className="text-xs fill-slate-500">
        {text2}
      </text>
    </g>
  );
};

export default function ReportsDashboard() {
  const [mounted, setMounted] = useState(false)
  const [selectedClient, setSelectedClient] = useState<string>("all-clients")
  const [selectedClientName, setSelectedClientName] = useState<string>("All Clients")
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false)
  const [clientSearch, setClientSearch] = useState("")
  const [debouncedClientSearch, setDebouncedClientSearch] = useState("")
  const [selectedMonth, setSelectedMonth] = useState<string>("all-months")
  const [selectedOverdueProject, setSelectedOverdueProject] = useState<any | null>(null)
  const [isCatatanDialogOpen, setIsCatatanDialogOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedClientSearch(clientSearch), 400)
    return () => clearTimeout(timer)
  }, [clientSearch])

  const {
    data: clientsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingClients,
  } = useInfiniteQuery({
    queryKey: ['clients-reports-list', debouncedClientSearch],
    queryFn: ({ pageParam = 1 }) =>
      ClientService.getClients({
        page: pageParam,
        search: debouncedClientSearch,
      }),
    getNextPageParam: (lastPage: any) => {
      const current_page = lastPage.meta?.current_page
      const last_page = lastPage.meta?.last_page
      return current_page < last_page ? current_page + 1 : undefined
    },
    initialPageParam: 1,
  })

  const clientsRaw = clientsData?.pages.flatMap((page) => page.data) || []
  const clients = Array.from(
    new Map(clientsRaw.map((c: any) => [c.id, c])).values()
  )

  const observerRef = React.useRef<IntersectionObserver | null>(null)
  const loadMoreRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return
      if (observerRef.current) observerRef.current.disconnect()

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage()
        }
      })

      if (node) observerRef.current.observe(node)
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  )

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-reports', selectedClient, selectedMonth],
    queryFn: () => getReportsData({
      client_id: selectedClient !== "all-clients" ? selectedClient : undefined,
      month: selectedMonth !== "all-months" ? selectedMonth : undefined,
    })
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  if (isLoading) {
    return (
      <div className="p-6 bg-slate-50/50 min-h-screen space-y-6">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  const {
    statusData = [],
    progressData = [],
    piutang = { total_spk: 0, total_tagihan: 0, total_terbayar: 0, sisa_piutang: 0, persentase_sisa: 0 },
    spkData = [],
    totalSpkPeriode = 0,
    deadlineData = [],
    overdueProjects = [],
    totalActive = 0,
    totalDeadline = 0
  } = data || {}

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val)
  }

  // Format to M (Milyar) or Jt (Juta) for charts
  const formatShortValue = (val: number) => {
    if (!val || isNaN(val) || val === 0) return '0'
    if (val >= 1000000000) {
      const formatted = (val / 1000000000).toFixed(2).replace(/\.0+$/, '').replace(/(\.\d)0$/, '$1')
      return `${formatted} M`
    }
    if (val >= 1000000) {
      const formatted = (val / 1000000).toFixed(2).replace(/\.0+$/, '').replace(/(\.\d)0$/, '$1')
      return `${formatted} Jt`
    }
    return `${val}`
  }

  // Format array for recharts nominal SPK (keeping value as raw numeric IDR so Y-axis scaling is mathematically exact)
  const formattedSpkData = spkData.map((item: any) => ({
    name: item.name,
    raw_value: Number(item.raw_value || 0),
    value: Number(item.raw_value || 0),
  }))

  const overduesCount = deadlineData.find((d: any) => d.name === 'Overdue')?.value || 0
  const dlDekatCount = deadlineData.find((d: any) => d.name.includes('Deadline Dekat'))?.value || 0
  const totalWarning = overduesCount + dlDekatCount
  const warningPct = totalDeadline > 0 ? ((totalWarning / totalDeadline) * 100).toFixed(1) : 0


  return (
    <div className="p-6 bg-slate-50/50 min-h-screen space-y-6">

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Ringkasan kinerja proyek secara real-time</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={clientPopoverOpen}
                className="w-[220px] justify-between bg-white h-9 text-sm font-normal"
              >
                <span className="truncate">
                  {selectedClient === "all-clients"
                    ? "All Clients"
                    : clients.find((c: any) => c.id.toString() === selectedClient)?.name || selectedClientName}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[260px] p-0" align="end">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Cari client..."
                  value={clientSearch}
                  onValueChange={setClientSearch}
                />
                <CommandList>
                  <CommandEmpty>
                    {isLoadingClients ? "Memuat client..." : "Client tidak ditemukan."}
                  </CommandEmpty>
                  <CommandGroup>
                    {(!clientSearch || "all clients".includes(clientSearch.toLowerCase())) && (
                      <CommandItem
                        value="all-clients"
                        onSelect={() => {
                          setSelectedClient("all-clients")
                          setSelectedClientName("All Clients")
                          setClientPopoverOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedClient === "all-clients" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        All Clients
                      </CommandItem>
                    )}
                    {clients.map((c: any) => (
                      <CommandItem
                        key={c.id}
                        value={c.id.toString()}
                        onSelect={() => {
                          setSelectedClient(c.id.toString())
                          setSelectedClientName(c.name)
                          setClientPopoverOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedClient === c.id.toString() ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="truncate">{c.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {hasNextPage && (
                    <div ref={loadMoreRef} className="py-3 flex justify-center items-center">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-xs text-muted-foreground">Memuat lainnya...</span>
                    </div>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px] bg-white h-9">
              <SelectValue placeholder="All Months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-months">All Months</SelectItem>
              <SelectItem value="1">January</SelectItem>
              <SelectItem value="2">February</SelectItem>
              <SelectItem value="3">March</SelectItem>
              <SelectItem value="4">April</SelectItem>
              <SelectItem value="5">May</SelectItem>
              <SelectItem value="6">June</SelectItem>
              <SelectItem value="7">July</SelectItem>
              <SelectItem value="8">August</SelectItem>
              <SelectItem value="9">September</SelectItem>
              <SelectItem value="10">October</SelectItem>
              <SelectItem value="11">November</SelectItem>
              <SelectItem value="12">December</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ROW 1: STATUS PROYEK | TOP 10 PROYEK OVERDUE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Card 1: Status Proyek */}
        <Card className="shadow-sm border-slate-200 flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-800 tracking-wider">STATUS PROYEK</CardTitle>
          </CardHeader>
          <CardContent className="@container flex-1 flex flex-col justify-between">
            <div className="flex flex-col @[340px]:flex-row items-center justify-between gap-4 @[340px]:gap-5 my-auto">
              <div className="h-40 w-40 sm:h-44 sm:w-44 shrink-0 relative mx-auto @[340px]:mx-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      innerRadius="58%"
                      outerRadius="85%"
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text absolute */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl sm:text-3xl font-bold text-slate-900 leading-none">{totalActive}</span>
                  <span className="text-[10px] text-slate-500 mt-1">Total Proyek</span>
                </div>
              </div>
              <div className="w-full flex-1 min-w-0">
                <div className="space-y-2.5">
                  {statusData.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                        <span className="text-slate-600 truncate" title={item.name}>{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-bold text-slate-900">{item.value}</span>
                        <span className="text-slate-400 text-[10px]">({item.percentage})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-4">Beberapa proyek dapat masuk dalam lebih dari satu kategori.</p>
          </CardContent>
        </Card>

        {/* Card 2: Top 10 Proyek Overdue */}
        <Card className="shadow-sm border-slate-200 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-slate-800 tracking-wider">
              TOP 10 PROYEK OVERDUE (PALING LAMA)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full h-[280px] overflow-auto">
              <table className="w-full text-xs text-left">
                <thead className="sticky top-0 z-10 bg-slate-50 text-[10px] font-semibold text-slate-500 tracking-wider uppercase border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4 w-8 text-center bg-slate-50">#</th>
                    <th className="py-3 px-4 min-w-[140px] bg-slate-50">Proyek</th>
                    <th className="py-3 px-4 min-w-[120px] bg-slate-50">Client</th>
                    <th className="py-3 px-4 min-w-[110px] bg-slate-50">No SPK</th>
                    <th className="py-3 px-4 min-w-[95px] bg-slate-50">SPK Masuk</th>
                    <th className="py-3 px-4 min-w-[95px] bg-slate-50">Deadline</th>
                    <th className="py-3 px-4 min-w-[85px] text-right bg-slate-50">Terlambat</th>
                    <th className="py-3 px-4 min-w-[160px] bg-slate-50">Catatan Keterlambatan</th>
                    <th className="py-3 px-4 min-w-[130px] bg-slate-50">Team</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {overdueProjects.length > 0 ? (
                    overdueProjects.map((project: any) => (
                      <tr key={project.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 text-center text-slate-400 font-medium">{project.id}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-800" title={project.name}>{project.name}</td>
                        <td className="py-3.5 px-4 text-slate-600">{project.client}</td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">{project.no_spk}</td>
                        <td className="py-3.5 px-4 text-slate-600">{project.spk_masuk}</td>
                        <td className="py-3.5 px-4 text-slate-600">{project.deadline}</td>
                        <td className="py-3.5 px-4 text-right font-semibold text-red-500">{project.days}</td>
                        <td className="py-3.5 px-4">
                          {project.catatan_keterlambatan ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOverdueProject({
                                  id: project.project_id || project.id,
                                  name: project.name,
                                  client: project.client && project.client !== '-' ? { name: project.client } : undefined,
                                  catatan_keterlambatans: project.catatan_keterlambatans || [],
                                })
                                setIsCatatanDialogOpen(true)
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100 transition-all max-w-[180px] truncate cursor-pointer shadow-xs"
                              title={project.catatan_keterlambatan}
                            >
                              <FileText className="h-3 w-3 shrink-0 text-amber-600" />
                              <span className="truncate">{project.catatan_keterlambatan}</span>
                              {project.catatan_keterlambatan_count > 1 && (
                                <Badge className="ml-0.5 px-1 py-0 text-[10px] h-4 bg-amber-200 text-amber-900 border-none font-semibold">
                                  {project.catatan_keterlambatan_count}
                                </Badge>
                              )}
                            </button>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {project.team_list && project.team_list.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {project.team_list.map((t: string, idx: number) => (
                                <span key={idx} className="inline-block bg-blue-50 text-blue-700 text-[10px] font-medium px-1.5 py-0.5 rounded border border-blue-200">
                                  {t}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">{project.team || '-'}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-slate-500 text-sm">Tidak ada proyek overdue</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ROW 2: SPK PER BULAN | KEUANGAN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Card 3: Nominal SPK Per Bulan */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-0">
            <CardTitle className="text-xs font-semibold text-slate-800 tracking-wider">NOMINAL SPK PER BULAN</CardTitle>
            <CardDescription className="text-[10px] text-slate-400 mt-1">(Rp)</CardDescription>
          </CardHeader>
          <CardContent className="pt-2 flex flex-col h-[280px]">
            <div className="flex-1 w-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedSpkData} margin={{ top: 15, right: 15, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickFormatter={(val) => formatShortValue(Number(val))}
                    domain={[0, 'auto']}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`Rp ${formatShortValue(Number(value))}`, 'Nominal']}
                  />
                  <Line
                    type="linear"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                    label={{
                      position: 'top',
                      fill: '#3b82f6',
                      fontSize: 10,
                      fontWeight: 600,
                      formatter: (val: any) => Number(val) > 0 ? formatShortValue(Number(val)) : '',
                      dy: -10
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Keuangan */}
        <Card className="shadow-sm border-slate-200 lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-xs font-semibold text-slate-800 tracking-wider">KEUANGAN</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3.5">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="bg-indigo-100 p-1.5 rounded text-indigo-600">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 tracking-wider">TOTAL NOMINAL SPK</span>
                </div>
                <div className="text-lg font-bold text-slate-900 mb-0.5">{formatShortValue(piutang.total_spk ?? totalSpkPeriode)}</div>
                <div className="text-[10px] text-slate-500">Total SPK</div>
              </div>
              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3.5">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="bg-blue-100 p-1.5 rounded text-blue-600">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 tracking-wider">TAGIHAN LUNCUR</span>
                </div>
                <div className="text-lg font-bold text-slate-900 mb-0.5">{formatShortValue(piutang.total_tagihan)}</div>
                <div className="text-[10px] text-slate-500">Total Tagihan</div>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3.5">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="bg-emerald-100 p-1.5 rounded text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 tracking-wider">NOMINAL TERBAYARKAN</span>
                </div>
                <div className="text-lg font-bold text-slate-900 mb-0.5">{formatShortValue(piutang.total_terbayar)}</div>
                <div className="text-[10px] text-slate-500">Total Terbayar</div>
              </div>
            </div>
            <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-amber-100 p-1.5 rounded-full text-amber-600">
                    <CircleDollarSign className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 tracking-wider">SISA PIUTANG</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{formatShortValue(piutang.sisa_piutang)}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-amber-700">{piutang.persentase_sisa}%</div>
                <div className="text-[10px] text-slate-500">dari total tagihan</div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ROW 3: INSIGHT UTAMA */}
      {/* <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 flex items-start gap-4 shadow-sm">
        <div className="bg-white p-2.5 rounded-full shadow-sm shrink-0 border border-indigo-50">
          <Lightbulb className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h3 className="font-bold text-indigo-950 mb-1">Insight Utama</h3>
          <p className="text-sm text-indigo-900/80 leading-relaxed">
            {overduesCount > 0 
              ? `Sebagian besar proyek masih berjalan. Terdapat ${overduesCount} proyek sudah melewati deadline, mohon segera ditindaklanjuti.` 
              : 'Semua proyek berjalan sesuai timeline dan belum ada proyek yang melewati deadline.'}
          </p>
        </div>
      </div> */}

      <CatatanKeterlambatanDialog
        open={isCatatanDialogOpen}
        onOpenChange={setIsCatatanDialogOpen}
        project={selectedOverdueProject}
        isViewOnlyAllDashboard={true}
      />

    </div>
  )
}
