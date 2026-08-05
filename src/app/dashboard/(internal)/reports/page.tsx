"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  CheckCircle2, 
  CircleDollarSign, 
  AlertTriangle, 
  Lightbulb, 
  CalendarDays, 
  ArrowUp,
  ChevronDown
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
import { useQuery } from "@tanstack/react-query"
import { getReportsData } from "@/features/dashboard/services/dashboard-reports-service"
import { ClientService } from "@/features/clients/services/client-service"
import { Skeleton } from "@/components/ui/skeleton"

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
  const [selectedMonth, setSelectedMonth] = useState<string>("all-months")

  const { data: clientsData } = useQuery({
    queryKey: ['clients-reports-list'],
    queryFn: () => ClientService.getClients({ page: 1 })
  })

  const clients = clientsData?.data || []

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
    piutang = { total_tagihan: 0, total_terbayar: 0, sisa_piutang: 0, persentase_sisa: 0 },
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
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-[160px] bg-white h-9">
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-clients">All Clients</SelectItem>
              {clients.map((c: any) => (
                <SelectItem key={c.id} value={c.id.toString()}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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

      {/* ROW 1: STATUS PROYEK | PROGRES KESELURUHAN | PIUTANG */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Status Proyek */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-800 tracking-wider">STATUS PROYEK</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-row items-center justify-between">
              <div className="h-48 w-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      innerRadius={55}
                      outerRadius={80}
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
                  <span className="text-3xl font-bold text-slate-900 leading-none">{totalActive}</span>
                  <span className="text-[10px] text-slate-500 mt-1">Total Proyek</span>
                </div>
              </div>
              <div className="flex-1 pl-2">
                <div className="space-y-3">
                  {statusData.map((item: any, i: number) => (
                    <div key={i} className="flex items-center text-xs">
                      <div className="w-2.5 h-2.5 rounded-full mr-2 shrink-0" style={{ backgroundColor: item.color }}></div>
                      <span className="text-slate-600 flex-1">{item.name}</span>
                      <span className="font-bold text-slate-900 mx-2">{item.value}</span>
                      <span className="text-slate-400 text-[10px]">({item.percentage})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-4">Beberapa proyek dapat masuk dalam lebih dari satu kategori.</p>
          </CardContent>
        </Card>

        {/* Card 2: Progres Keseluruhan */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-0">
            <CardTitle className="text-xs font-semibold text-slate-800 tracking-wider">PROGRES KESELURUHAN</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-6">
            <div className="h-32 w-full relative -mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={progressData}
                    cx="50%"
                    cy="100%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    {progressData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end pointer-events-none pb-2">
                <span className="text-4xl font-bold text-slate-900 leading-none">{progressData[0]?.value || 0}%</span>
                <span className="text-xs text-slate-500 mt-1">Rata-rata Progres</span>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-1 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-md text-xs font-medium">
              <ArrowUp className="w-3 h-3" />
              6% dari periode lalu
            </div>
            <div className="mt-auto pt-6 w-full text-left">
              <p className="text-[10px] text-slate-400">Total progres kerja seluruh proyek aktif</p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Piutang */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-xs font-semibold text-slate-800 tracking-wider">PIUTANG</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-blue-100 p-1.5 rounded text-blue-600">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 tracking-wider">TAGIHAN LUNCUR</span>
                </div>
                <div className="text-xl font-bold text-slate-900 mb-1">{formatShortValue(piutang.total_tagihan)}</div>
                <div className="text-[10px] text-slate-500">Total Tagihan</div>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-emerald-100 p-1.5 rounded text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 tracking-wider">NOMINAL TERBAYARKAN</span>
                </div>
                <div className="text-xl font-bold text-slate-900 mb-1">{formatShortValue(piutang.total_terbayar)}</div>
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

      {/* ROW 2: SPK PER BULAN | DEADLINE & OVERDUE | TOP 5 OVERDUE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 4: Nominal SPK Per Bulan */}
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
            <div className="mt-4 bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-center gap-3">
              <div className="bg-blue-100/50 p-2 rounded text-blue-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 mb-0.5">Total Nominal SPK (Periode)</div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-slate-900 leading-none">{formatShortValue(totalSpkPeriode)}</span>
                  {/* Badge placeholder for period diff. Optional depending on API capability */}
                  {/* <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-medium">
                    <ArrowUp className="w-3 h-3" />
                    12.4% <span className="text-emerald-600/70 ml-1 font-normal">dari periode lalu</span>
                  </div> */}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 6: Top 10 Proyek Overdue */}
        <Card className="shadow-sm border-slate-200 md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-slate-800 tracking-wider">
              TOP 10 PROYEK OVERDUE (PALING LAMA)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/50 text-[10px] font-semibold text-slate-500 tracking-wider uppercase border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4 w-8 text-center">#</th>
                    <th className="py-3 px-4 min-w-[140px]">Proyek</th>
                    <th className="py-3 px-4 min-w-[120px]">Client</th>
                    <th className="py-3 px-4 min-w-[110px]">No SPK</th>
                    <th className="py-3 px-4 min-w-[95px]">SPK Masuk</th>
                    <th className="py-3 px-4 min-w-[95px]">Deadline</th>
                    <th className="py-3 px-4 min-w-[85px] text-right">Terlambat</th>
                    <th className="py-3 px-4 min-w-[130px]">Team</th>
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
                      <td colSpan={8} className="text-center py-8 text-slate-500 text-sm">Tidak ada proyek overdue</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ROW 3: INSIGHT UTAMA */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 flex items-start gap-4 shadow-sm">
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
      </div>

    </div>
  )
}
