'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface MonthlyPerformanceItem {
  month: number;
  month_name: string;
  total_project: number;
  on_time: number;
  late: number;
  no_submit: number;
  percentage: number;
}

interface MonthlyPerformanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: MonthlyPerformanceItem[];
  year?: string;
}

export function MonthlyPerformanceDialog({
  open,
  onOpenChange,
  data = [],
  year = 'all',
}: MonthlyPerformanceDialogProps) {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const currentYear = new Date().getFullYear();
  const displayYear = year && year !== 'all' ? year : currentYear;

  // Format short month name for chart
  const chartData = (data || []).map((item) => ({
    ...item,
    short_month: item.month_name ? item.month_name.substring(0, 3) : `Bln ${item.month}`,
  }));

  // Calculate totals for footer
  const totalProjects = chartData.reduce((acc, curr) => acc + curr.total_project, 0);
  const totalOnTime = chartData.reduce((acc, curr) => acc + curr.on_time, 0);
  const totalLate = chartData.reduce((acc, curr) => acc + curr.late, 0);
  const totalNoSubmit = chartData.reduce((acc, curr) => acc + curr.no_submit, 0);
  const evaluatedCount = totalOnTime + totalLate;
  const overallPercentage = evaluatedCount > 0 ? Math.round((totalOnTime / evaluatedCount) * 1000) / 10 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-lg font-bold text-slate-800'>
            Tren Ketepatan Waktu Engineer — Tahun {displayYear}
          </DialogTitle>
          <DialogDescription className='text-xs text-slate-500'>
            Statistik ketepatan waktu penyelesaian gambar kerja terhadap target selesai, dikelompokkan berdasarkan bulan SPK masuk.
          </DialogDescription>
        </DialogHeader>

        {/* Chart Section */}
        <div className='mt-2 rounded-xl border border-slate-100 bg-slate-50/50 p-4'>
          <h4 className='text-xs font-semibold text-slate-700 mb-3'>
            Grafik Kinerja Bulanan ({displayYear})
          </h4>
          <div className='h-64 w-full'>
            {isMounted && chartData.length > 0 ? (
              <ResponsiveContainer width='100%' height='100%'>
                <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='#e2e8f0' />
                  <XAxis
                    dataKey='short_month'
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId='left'
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId='right'
                    orientation='right'
                    domain={[0, 100]}
                    unit='%'
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const row = payload[0].payload as MonthlyPerformanceItem & { short_month: string };
                        return (
                          <div className='rounded-lg border border-slate-200 bg-white p-2.5 shadow-md text-xs'>
                            <p className='font-bold text-slate-800 mb-1.5'>{row.month_name} {displayYear}</p>
                            <div className='space-y-1'>
                              <div className='flex items-center justify-between gap-4 text-emerald-600'>
                                <span>Tepat Waktu:</span>
                                <span className='font-bold'>{row.on_time}</span>
                              </div>
                              <div className='flex items-center justify-between gap-4 text-rose-600'>
                                <span>Terlambat:</span>
                                <span className='font-bold'>{row.late}</span>
                              </div>
                              <div className='flex items-center justify-between gap-4 text-slate-500'>
                                <span>Belum Submit:</span>
                                <span className='font-bold'>{row.no_submit}</span>
                              </div>
                              <div className='flex items-center justify-between gap-4 text-slate-700 border-t border-slate-100 pt-1'>
                                <span>Total Projek:</span>
                                <span className='font-bold'>{row.total_project}</span>
                              </div>
                              <div className='flex items-center justify-between gap-4 text-blue-600 border-t border-slate-100 pt-1 font-semibold'>
                                <span>% Tepat Waktu:</span>
                                <span className='font-bold'>{row.percentage}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign='top'
                    height={30}
                    wrapperStyle={{ fontSize: '11px', paddingTop: '0px' }}
                  />
                  <Bar
                    yAxisId='left'
                    dataKey='on_time'
                    name='Tepat Waktu'
                    fill='#10b981'
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                  <Bar
                    yAxisId='left'
                    dataKey='late'
                    name='Terlambat'
                    fill='#f43f5e'
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                  <Line
                    yAxisId='right'
                    type='monotone'
                    dataKey='percentage'
                    name='% Tepat Waktu'
                    stroke='#3b82f6'
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#3b82f6' }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className='flex h-full items-center justify-center text-xs text-slate-400'>
                Tidak ada data tren untuk ditampilkan
              </div>
            )}
          </div>
        </div>

        {/* Breakdown Table */}
        <div className='mt-2 rounded-xl border border-slate-200 overflow-hidden'>
          <Table>
            <TableHeader className='bg-slate-50'>
              <TableRow>
                <TableHead className='text-xs font-bold text-slate-700'>Bulan</TableHead>
                <TableHead className='text-xs font-bold text-slate-700 text-center'>Total Projek</TableHead>
                <TableHead className='text-xs font-bold text-emerald-700 text-center'>Tepat Waktu</TableHead>
                <TableHead className='text-xs font-bold text-rose-700 text-center'>Terlambat</TableHead>
                <TableHead className='text-xs font-bold text-slate-500 text-center'>Belum Submit</TableHead>
                <TableHead className='text-xs font-bold text-blue-700 text-center'>% Tepat Waktu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chartData.map((row) => {
                const isEvaluated = row.on_time + row.late > 0;
                return (
                  <TableRow key={row.month} className='hover:bg-slate-50/60'>
                    <TableCell className='text-xs font-medium text-slate-800 py-2'>
                      {row.month_name}
                    </TableCell>
                    <TableCell className='text-xs text-center text-slate-600 py-2'>
                      {row.total_project}
                    </TableCell>
                    <TableCell className='text-xs text-center font-semibold text-emerald-600 py-2'>
                      {row.on_time}
                    </TableCell>
                    <TableCell className='text-xs text-center font-semibold text-rose-600 py-2'>
                      {row.late}
                    </TableCell>
                    <TableCell className='text-xs text-center text-slate-400 py-2'>
                      {row.no_submit}
                    </TableCell>
                    <TableCell className='text-xs text-center py-2'>
                      {isEvaluated ? (
                        <Badge
                          variant='outline'
                          className={
                            row.percentage >= 80
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold'
                              : row.percentage >= 60
                              ? 'border-amber-200 bg-amber-50 text-amber-700 font-semibold'
                              : 'border-rose-200 bg-rose-50 text-rose-700 font-semibold'
                          }
                        >
                          {row.percentage}%
                        </Badge>
                      ) : (
                        <span className='text-slate-400'>-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableRow className='bg-slate-100/70 font-bold border-t-2 border-slate-200'>
              <TableCell className='text-xs text-slate-800 py-2.5'>Total / Rata-rata</TableCell>
              <TableCell className='text-xs text-center text-slate-800 py-2.5'>{totalProjects}</TableCell>
              <TableCell className='text-xs text-center text-emerald-700 py-2.5'>{totalOnTime}</TableCell>
              <TableCell className='text-xs text-center text-rose-700 py-2.5'>{totalLate}</TableCell>
              <TableCell className='text-xs text-center text-slate-500 py-2.5'>{totalNoSubmit}</TableCell>
              <TableCell className='text-xs text-center py-2.5'>
                {evaluatedCount > 0 ? (
                  <Badge
                    variant='outline'
                    className={
                      overallPercentage >= 80
                        ? 'border-emerald-300 bg-emerald-100 text-emerald-800 font-bold'
                        : overallPercentage >= 60
                        ? 'border-amber-300 bg-amber-100 text-amber-800 font-bold'
                        : 'border-rose-300 bg-rose-100 text-rose-800 font-bold'
                    }
                  >
                    {overallPercentage}%
                  </Badge>
                ) : (
                  <span className='text-slate-400'>-</span>
                )}
              </TableCell>
            </TableRow>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
