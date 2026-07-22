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

// --- MOCK DATA ---

const statusData = [
  { name: 'Selesai', value: 13, color: '#10b981', percentage: '22.4%' },
  { name: 'On Progress', value: 22, color: '#3b82f6', percentage: '37.9%' },
  { name: 'Deadline Dekat', value: 8, color: '#f59e0b', percentage: '13.8%' },
  { name: 'Overdue', value: 19, color: '#ef4444', percentage: '32.8%' },
]

const progressData = [
  { name: 'Progress', value: 36, color: '#2563eb' },
  { name: 'Remaining', value: 64, color: '#f1f5f9' },
]

const spkData = [
  { name: "Jan '26", value: 2.1 },
  { name: "Feb '26", value: 2.8 },
  { name: "Mar '26", value: 3.5 },
  { name: "Apr '26", value: 4.2 },
  { name: "May '26", value: 3.1 },
  { name: "Jun '26", value: 3.8 },
  { name: "Jul '26", value: 2.6 },
]

const deadlineData = [
  { name: 'Overdue', value: 19, color: '#ef4444', percentage: '32.8%' },
  { name: 'Deadline Dekat (≤ 7 hari)', value: 8, color: '#f59e0b', percentage: '13.8%' },
  { name: 'Aman (> 7 hari)', value: 31, color: '#3b82f6', percentage: '53.4%' },
]

const overdueProjects = [
  { id: 1, name: "LEMARI PIRING KOTOR RWI PA...", deadline: "Jul 9, 2026", days: "23 hari" },
  { id: 2, name: "CHARGER STATION RUANG TUN...", deadline: "Jul 23, 2026", days: "9 hari" },
  { id: 3, name: "FURNITURE LOBBY LT 1", deadline: "Aug 21, 2026", days: "-20 hari" },
  { id: 4, name: "BUSA RANJANG PERIKSA K...", deadline: "May 25, 2026", days: "-47 hari" },
  { id: 5, name: "ADDENDUM FURNITURE IG...", deadline: "Apr 13, 2026", days: "-89 hari" },
]

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

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="p-6 bg-slate-50/50 min-h-screen space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Ringkasan kinerja proyek secara real-time</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select defaultValue="all-clients">
            <SelectTrigger className="w-[140px] bg-white h-9">
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-clients">All Clients</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all-months">
            <SelectTrigger className="w-[140px] bg-white h-9">
              <SelectValue placeholder="All Months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-months">All Months</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="bg-white h-9 px-3 flex items-center gap-2 font-normal">
            <CalendarDays className="h-4 w-4 text-slate-500" />
            <span className="text-sm">Jun 1 - Jul 2, 2026</span>
            <ChevronDown className="h-4 w-4 text-slate-500 ml-1" />
          </Button>
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
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text absolute */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold text-slate-900 leading-none">58</span>
                  <span className="text-[10px] text-slate-500 mt-1">Total Proyek</span>
                </div>
              </div>
              <div className="flex-1 pl-2">
                <div className="space-y-3">
                  {statusData.map((item, i) => (
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
                    {progressData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end pointer-events-none pb-2">
                <span className="text-4xl font-bold text-slate-900 leading-none">36%</span>
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
                <div className="text-xl font-bold text-slate-900 mb-1">Rp 8.75 M</div>
                <div className="text-[10px] text-slate-500">Total Tagihan</div>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-emerald-100 p-1.5 rounded text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 tracking-wider">NOMINAL TERBAYARKAN</span>
                </div>
                <div className="text-xl font-bold text-slate-900 mb-1">Rp 4.25 M</div>
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
                <div className="text-2xl font-bold text-slate-900">Rp 4.50 M</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-amber-700">51.4%</div>
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
                <LineChart data={spkData} margin={{ top: 15, right: 15, left: 0, bottom: 0 }}>
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
                    tickFormatter={(val) => `${val} M`}
                    domain={[0, 5]}
                    ticks={[0, 1, 2, 3, 4, 5]}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`Rp ${value} M`, 'Nominal']}
                  />
                  <Line 
                    type="linear" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                    label={{ position: 'top', fill: '#3b82f6', fontSize: 10, fontWeight: 600, formatter: (val: any) => `${val} M`, dy: -10 }}
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
                  <span className="text-lg font-bold text-slate-900 leading-none">22.1 M</span>
                  <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-medium">
                    <ArrowUp className="w-3 h-3" />
                    12.4% <span className="text-emerald-600/70 ml-1 font-normal">dari periode lalu</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 5: Deadline & Overdue */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-800 tracking-wider">DEADLINE & OVERDUE</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-[280px]">
            <div className="flex flex-row items-center flex-1 py-4">
              <div className="h-32 w-32 relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deadlineData}
                      innerRadius={35}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {deadlineData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 pl-4 space-y-3">
                {deadlineData.map((item, i) => (
                  <div key={i} className="flex items-center text-xs">
                    <div className="w-2.5 h-2.5 rounded-full mr-2 shrink-0" style={{ backgroundColor: item.color }}></div>
                    <span className="text-slate-600 flex-1 leading-tight">{item.name}</span>
                    <span className="font-bold text-slate-900 mx-2 shrink-0">{item.value}</span>
                    <span className="text-slate-400 text-[10px] shrink-0">({item.percentage})</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-auto bg-red-50/50 border border-red-100 rounded-lg p-3 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700/80 leading-relaxed">
                <span className="font-semibold text-red-700">27 proyek (46.6%)</span> memiliki deadline dalam 7 hari ke depan atau sudah melewati deadline.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 6: Top 5 Proyek Overdue */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-800 tracking-wider">TOP 5 PROYEK OVERDUE (PALING LAMA)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full text-xs">
              <div className="grid grid-cols-[30px_1fr_90px_80px] gap-2 px-6 py-3 border-b border-slate-100 text-[10px] font-semibold text-slate-500 tracking-wider uppercase">
                <div>#</div>
                <div>PROYEK</div>
                <div>DEADLINE</div>
                <div className="text-right">TERLAMBAT</div>
              </div>
              <div className="flex flex-col">
                {overdueProjects.map((project, i) => (
                  <div key={project.id} className="grid grid-cols-[30px_1fr_90px_80px] gap-2 px-6 py-3.5 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors items-center">
                    <div className="text-slate-500">{project.id}</div>
                    <div className="font-medium text-slate-700 truncate" title={project.name}>{project.name}</div>
                    <div className="text-slate-500">{project.deadline}</div>
                    <div className="text-right font-medium text-red-500">{project.days}</div>
                  </div>
                ))}
              </div>
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
            Sebagian besar proyek (37.9%) masih dalam tahap On Progress. 19 proyek (32.8%) sudah melewati deadline, mohon segera ditindaklanjuti.
          </p>
        </div>
      </div>

    </div>
  )
}
