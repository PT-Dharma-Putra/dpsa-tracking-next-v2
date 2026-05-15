"use client"

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle2, 
  ClipboardList, 
  Clock, 
  FileText, 
  LayoutDashboard, 
  Package, 
  Settings, 
  Truck, 
  User as UserIcon,
  Search,
  ChevronDown,
  Info,
  TrendingUp,
  Box,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { projectV2Service } from '@/features/projects/services/project-v2-service';
import { cn } from '@/lib/utils';

export default function ProjectMonitoringDetailPage() {
  const params = useParams();
  const id = parseInt(params.id as string);
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState('');

  const { data: project, isLoading: isProjectLoading } = useQuery({
    queryKey: ['project-v2', id],
    queryFn: () => projectV2Service.getProject(id),
  });

  const { data: items = [], isLoading: isItemsLoading } = useQuery({
    queryKey: ['project-v2-items', id],
    queryFn: () => projectV2Service.getProjectItems(id),
  });

  const filteredItems = items.filter(item => 
    item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.lantai?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ruang?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isProjectLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) return null;

  const progres = project.progres_kerja;
  const totalQtyOrder = items.reduce((sum, i) => sum + i.jumlah, 0) || 0;
  const totalQtyKeluar = items.reduce((sum, i) => sum + (i.barang_jadi_keluar?.reduce((s, bjk) => s + bjk.jumlah, 0) || 0), 0) || 0;

    const percentKeluar = totalQtyOrder > 0 ? (totalQtyKeluar / totalQtyOrder) * 100 : 0;
  
    const progressStages = [
      { 
        label: 'PO Divisi', 
        percent: progres?.po_divisi || 0, 
        date: progres?.tanggal_update_po_divisi, 
        icon: ClipboardList, 
        color: 'blue' 
      },
      { 
        label: 'Gambar Kerja', 
        percent: progres?.gambar_kerja || 0, 
        date: progres?.tanggal_update_gambar_kerja, 
        icon: FileText, 
        color: 'orange' 
      },
      { 
        label: 'Dokubah', 
        percent: progres?.dokubah || 0, 
        date: progres?.tanggal_update_dokubah, 
        icon: Settings, 
        color: 'purple' 
      },
      { 
        label: 'Stok Material', 
        percent: progres?.stok_material || 0, 
        date: progres?.tanggal_update_stok_material, 
        icon: Box, 
        color: 'emerald' 
      },
      { 
        label: 'Produksi', 
        percent: progres?.produksi || 0, 
        date: progres?.tanggal_update_produksi, 
        icon: TrendingUp, 
        color: 'cyan' 
      },
      { 
        label: 'Gudang Barang Jadi', 
        percent: progres?.gudang_barang_jadi || 0, 
        date: progres?.tanggal_update_gudang_barang_jadi, 
        icon: Package, 
        color: 'indigo' 
      },
      { 
        label: 'Pengiriman', 
        percent: percentKeluar, 
        date: progres?.tanggal_update_pengiriman, 
        icon: Truck, 
        color: 'rose',
        nominal: `${totalQtyKeluar} / ${totalQtyOrder}`
      }
    ];

  const getColorClass = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-500';
      case 'orange': return 'bg-orange-500';
      case 'purple': return 'bg-purple-500';
      case 'emerald': return 'bg-emerald-500';
      case 'cyan': return 'bg-cyan-500';
      case 'indigo': return 'bg-indigo-500';
      case 'rose': return 'bg-rose-500';
      default: return 'bg-neutral-500';
    }
  };

  const getLightColorClass = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'orange': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'purple': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'emerald': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'cyan': return 'bg-cyan-50 text-cyan-700 border-cyan-100';
      case 'indigo': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'rose': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-neutral-50 text-neutral-700 border-neutral-100';
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-[1600px] mx-auto px-4 sm:px-6">
      {/* Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="rounded-full hover:bg-neutral-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">{project.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <UserIcon className="h-3 w-3 mr-1.5" />
                {project.client?.name || 'No Client'}
              </Badge>
              <Badge variant="outline" className="bg-neutral-50 text-neutral-600 border-neutral-200">
                <Clock className="h-3 w-3 mr-1.5" />
                Deadline: {project.deadline ? format(new Date(project.deadline), 'MMM dd, yyyy') : '-'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge className={cn(
            "px-3 py-1.5 text-xs font-bold rounded-full",
            project.prioritas === 'Urgent' ? "bg-red-500 text-white" : "bg-blue-500 text-white"
          )}>
            {project.prioritas || 'Normal'}
          </Badge>
          <div className="text-right">
             <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">SPK Number</p>
             <p className="text-sm font-mono font-bold text-neutral-900">{project.spk_number || project.spk?.nomor_spk || '-'}</p>
          </div>
        </div>
      </div>

      <Separator className="bg-neutral-100" />

      {/* Hero Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Overall Progress Card */}
        <Card className="lg:col-span-1 border-none shadow-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <LayoutDashboard size={120} />
          </div>
          <CardHeader className="relative z-10">
            <CardTitle className="text-lg font-medium opacity-90">Overall Project Progress</CardTitle>
            <CardDescription className="text-blue-100">Across all production stages</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 pt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black tracking-tighter">{Math.round(progres?.total || 0)}%</span>
            </div>
            <div className="mt-8 space-y-2">
              <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-1000 ease-out" 
                  style={{ width: `${progres?.total || 0}%` }} 
                />
              </div>
              <p className="text-[10px] text-blue-100 font-medium">Updated just now</p>
            </div>
          </CardContent>
        </Card>

        {/* Small Progress Cards Grid */}
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
          {progressStages.map((stage, idx) => (
            <Card key={idx} className="border-neutral-200 shadow-sm hover:shadow-md transition-all duration-200 group">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-start justify-between">
                  <div className={cn(
                    "p-2 rounded-xl border",
                    getLightColorClass(stage.color)
                  )}>
                    <stage.icon className="h-5 w-5" />
                  </div>
                  <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full",
                    getLightColorClass(stage.color)
                  )}>
                    {Math.round(stage.percent)}%
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-xs font-bold text-neutral-700 truncate">{stage.label}</h3>
                  {stage.nominal && (
                    <p className="text-[10px] font-black text-rose-600 mt-0.5">{stage.nominal} Items</p>
                  )}
                  <div className="mt-2 h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all duration-700", getColorClass(stage.color))} 
                      style={{ width: `${stage.percent}%` }} 
                    />
                  </div>
                  {stage.date && (
                    <p className="mt-2 text-[9px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {format(new Date(stage.date), 'MMM d, HH:mm')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Items Section */}
      <Card className="border-neutral-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-neutral-50/50 border-b border-neutral-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Project Items</CardTitle>
              <CardDescription>Individual item progress and status</CardDescription>
            </div>
            <div className="relative w-full md:w-[300px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter items..."
                className="pl-8 bg-white border-neutral-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-neutral-50">
                <TableRow>
                  <TableHead className="w-[50px] font-bold">#</TableHead>
                  <TableHead className="font-bold">Item Name</TableHead>
                  <TableHead className="font-bold">Lantai / Ruang</TableHead>
                  <TableHead className="font-bold">Qty</TableHead>
                  <TableHead className="font-bold">Divisi</TableHead>
                  <TableHead className="font-bold">Progres Produksi</TableHead>
                  <TableHead className="font-bold">Progres Gudang</TableHead>
                  <TableHead className="font-bold text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isItemsLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      Loading items...
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      No items found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item, idx) => {
                    const totalMasuk = item.barang_jadi_masuk?.reduce((s, b) => s + b.jumlah, 0) || 0;
                    const totalPacking = item.barang_jadi_terpacking?.reduce((s, b) => s + b.jumlah, 0) || 0;
                    const gudangProgress = item.jumlah > 0 ? ((totalMasuk + totalPacking) / (2 * item.jumlah)) * 100 : 0;
                    
                    return (
                      <TableRow key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                        <TableCell className="text-xs text-muted-foreground font-medium">{idx + 1}</TableCell>
                        <TableCell className="font-bold text-neutral-800 text-xs">{item.item}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-medium text-neutral-700">{item.lantai || '-'}</span>
                            <span className="text-[10px] text-muted-foreground">{item.ruang || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-bold text-[10px] bg-neutral-100">
                            {item.jumlah} {item.satuan || 'Pcs'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.divisi?.nama ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold">
                              {item.divisi.nama}
                            </Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-[80px] h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-cyan-500 rounded-full transition-all duration-500" 
                                style={{ width: `${item.produksi?.persen || 0}%` }} 
                              />
                            </div>
                            <span className="text-[10px] font-black text-cyan-700">{Math.round(item.produksi?.persen || 0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-[80px] h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                                style={{ width: `${gudangProgress}%` }} 
                              />
                            </div>
                            <span className="text-[10px] font-black text-indigo-700">{Math.round(gudangProgress)}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.produksi?.persen === 100 && totalMasuk >= item.jumlah && totalPacking >= item.jumlah ? (
                            <Badge className="bg-emerald-500 text-white border-none text-[10px] font-black uppercase tracking-widest px-2 py-1">
                              Completed
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-neutral-500 border-none text-[10px] font-bold uppercase tracking-widest px-2 py-1">
                              Processing
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
