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
  AlertCircle,
  BarChart3,
  Activity
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
import { projectV2Service, ProjectItemV2 } from '@/features/projects/services/project-v2-service';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

export default function ProjectMonitoringDetailPage() {
  const params = useParams();
  const id = parseInt(params.id as string);
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState('');

  // View Produksi State
  const [isProduksiViewOpen, setIsProduksiViewOpen] = React.useState(false);
  const [produksiViewItem, setProduksiViewItem] = React.useState<ProjectItemV2 | null>(null);
  const [isSupplierViewOpen, setIsSupplierViewOpen] = React.useState(false);
  const [supplierViewItem, setSupplierViewItem] = React.useState<ProjectItemV2 | null>(null);

  const openProduksiView = (item: ProjectItemV2) => {
    if (item.produksi?.is_supplier) {
      setSupplierViewItem(item);
      setIsSupplierViewOpen(true);
    } else {
      setProduksiViewItem(item);
      setIsProduksiViewOpen(true);
    }
  };

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
        percent: progres?.pengiriman || 0,
        date: progres?.tanggal_update_pengiriman,
        icon: Truck,
        color: 'rose',
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
                    const totalMasuk = item.barang_jadi_masuk?.reduce((s, b) => s + Number(b.jumlah || 0), 0) || 0;
                    const gudangProgress = item.jumlah > 0 ? (totalMasuk / item.jumlah) * 100 : 0;
                    const totalKeluar = item.barang_jadi_keluar?.reduce((s, bjk) => s + Number(bjk.jumlah || 0), 0) || 0;
                    
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
                          <div 
                            className="flex items-center gap-2 min-w-[120px] cursor-pointer group hover:bg-blue-50 p-1.5 -ml-1.5 rounded-md transition-colors" 
                            onClick={() => openProduksiView(item as any)}
                          >
                            <span className="text-xs font-bold text-neutral-700 w-8 text-right group-hover:text-blue-700 transition-colors">{Math.round(item.produksi?.is_supplier ? Number(item.barang_supplier?.persen) || 0 : Number(item.produksi?.persen) || 0)}%</span>
                            <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden group-hover:bg-blue-100 transition-colors">
                              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${item.produksi?.is_supplier ? Number(item.barang_supplier?.persen) || 0 : Number(item.produksi?.persen) || 0}%` }} />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-indigo-700">{Math.round(gudangProgress)}%</span>
                            <div className="flex-1 min-w-[80px] h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                                style={{ width: `${gudangProgress}%` }} 
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {project.tanggal_selesai || totalKeluar >= item.jumlah ? (
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

      {/* View Produksi Progress Dialog */}
      <AlertDialog open={isProduksiViewOpen} onOpenChange={setIsProduksiViewOpen}>
        <AlertDialogContent className='max-w-2xl'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <BarChart3 className='h-5 w-5 text-orange-500' />
              Detail Progress Produksi
            </AlertDialogTitle>
            <AlertDialogDescription>
              Melihat progress produksi untuk item: <strong>{produksiViewItem?.item}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className='py-4 space-y-6'>
            {/* Summary Progress */}
            <div className='grid grid-cols-3 gap-4'>
              <div className='space-y-1 text-center p-3 bg-neutral-50 rounded-xl border border-neutral-100 flex flex-col justify-center'>
                <span className='text-[10px] font-bold text-neutral-500 uppercase tracking-wider'>Jumlah Order</span>
                <div className='text-2xl font-black text-neutral-800'>
                  {produksiViewItem?.jumlah || 0}
                </div>
              </div>
              <div className='space-y-1 text-center p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex flex-col justify-center'>
                <span className='text-[10px] font-bold text-indigo-800 uppercase tracking-wider'>Menggunakan Stok</span>
                <div className='text-2xl font-black text-indigo-600'>
                  {produksiViewItem?.produksi?.menggunakan_stok || 0}
                </div>
              </div>
              <div className='space-y-1 text-center p-3 bg-orange-50 rounded-xl border border-orange-100 flex flex-col justify-center'>
                <span className='text-[10px] font-bold text-orange-800 uppercase tracking-wider'>Total Progress</span>
                <div className='flex items-baseline justify-center gap-1'>
                  <span className='text-2xl font-black text-orange-600'>{Math.round(produksiViewItem?.produksi?.persen || 0)}</span>
                  <span className='text-sm font-bold text-orange-400'>%</span>
                </div>
              </div>
            </div>
            <Progress value={produksiViewItem?.produksi?.persen || 0} className='h-2 bg-orange-200/50 w-full' />

            <div className='grid grid-cols-2 gap-x-8 gap-y-6'>
              {/* Mesin Section */}
              <div className='space-y-3'>
                <h4 className='font-bold text-xs text-neutral-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2'>
                  <Activity className='h-3 w-3' />
                  Tahapan Mesin
                </h4>
                <div className='space-y-3'>
                  {[
                    { label: 'Cold Press', value: produksiViewItem?.produksi?.cold_press, key: 'cold_press' },
                    { label: 'Running Saw', value: produksiViewItem?.produksi?.running_saw, key: 'running_saw' },
                    { label: 'Edging', value: produksiViewItem?.produksi?.edging, key: 'edging' },
                    { label: 'CNC', value: produksiViewItem?.produksi?.cnc, key: 'cnc' },
                  ].map((field) => {
                    const isSkipped = (produksiViewItem?.produksi as any)?.skipped_fields?.includes(field.key);
                    return (
                      <div key={field.key} className='flex items-center justify-between'>
                        <span className='text-xs text-neutral-600'>{field.label}</span>
                        <div className='flex items-center gap-2'>
                          {isSkipped ? (
                            <Badge variant='secondary' className='text-[9px] bg-neutral-100 text-neutral-400 border-none'>SKIPPED</Badge>
                          ) : (
                            <span className='text-sm font-bold text-neutral-900'>{field.value || 0} <span className='text-[10px] text-neutral-400 font-normal'>/ {produksiViewItem?.jumlah}</span></span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Manual Section */}
              <div className='space-y-3'>
                <h4 className='font-bold text-xs text-neutral-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2'>
                  <UserIcon className='h-3 w-3' />
                  Tahapan Manual
                </h4>
                <div className='space-y-3'>
                  {[
                    { label: 'Tukang Kayu', value: produksiViewItem?.produksi?.tukang_kayu, key: 'tukang_kayu' },
                    { label: 'Tukang Jok', value: produksiViewItem?.produksi?.tukang_jok, key: 'tukang_jok' },
                    { label: 'Rakit', value: produksiViewItem?.produksi?.rakit, key: 'rakit' },
                    { label: 'Finishing', value: produksiViewItem?.produksi?.finishing, key: 'finishing' },
                  ].map((field) => {
                    const isSkipped = (produksiViewItem?.produksi as any)?.skipped_fields?.includes(field.key);
                    return (
                      <div key={field.key} className='flex items-center justify-between'>
                        <span className='text-xs text-neutral-600'>{field.label}</span>
                        <div className='flex items-center gap-2'>
                          {isSkipped ? (
                            <Badge variant='secondary' className='text-[9px] bg-neutral-100 text-neutral-400 border-none'>SKIPPED</Badge>
                          ) : (
                            <span className='text-sm font-bold text-neutral-900'>{field.value || 0} <span className='text-[10px] text-neutral-400 font-normal'>/ {produksiViewItem?.jumlah}</span></span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <AlertDialogFooter className='border-t pt-4'>
            <AlertDialogCancel className='bg-neutral-100 hover:bg-neutral-200 border-none'>Tutup</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Barang Supplier Progress Dialog */}
      <AlertDialog
        open={isSupplierViewOpen}
        onOpenChange={setIsSupplierViewOpen}
      >
        <AlertDialogContent className='max-w-xl'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2 text-lg sm:text-xl font-bold tracking-tight text-neutral-800'>
              <Truck className='h-6 w-6 text-blue-500' />
              Detail Progress Supplier
            </AlertDialogTitle>
            <AlertDialogDescription className='text-sm text-neutral-500 mt-1'>
              Melihat progress supplier untuk item: <strong>{supplierViewItem?.item}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className='py-4 space-y-6'>
            {/* Jumlah Order & Persen */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2 text-center p-4 bg-neutral-50 rounded-xl border border-neutral-100'>
                <span className='text-xs font-bold text-neutral-500 uppercase tracking-wider'>Jumlah Order</span>
                <div className='text-3xl font-black text-neutral-800'>
                  {supplierViewItem?.barang_supplier?.jumlah_order || supplierViewItem?.jumlah || 0}
                </div>
              </div>
              <div className='space-y-2 text-center p-4 bg-blue-50 rounded-xl border border-blue-100'>
                <span className='text-xs font-bold text-blue-800 uppercase tracking-wider'>Total Progress</span>
                <div className='flex items-baseline justify-center gap-1'>
                  <span className='text-3xl font-black text-blue-600'>
                    {typeof supplierViewItem?.barang_supplier?.persen === 'number'
                      ? supplierViewItem.barang_supplier.persen.toFixed(0)
                      : (Number(supplierViewItem?.barang_supplier?.persen) || 0).toFixed(0)}
                  </span>
                  <span className='text-xl font-bold text-blue-400'>%</span>
                </div>
              </div>
            </div>

            {/* Fields */}
            <div className='space-y-3'>
              <h4 className='font-bold text-xs text-neutral-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2'>
                <Truck className='h-3 w-3' />
                Tahapan Supplier
              </h4>
              <div className='grid grid-cols-2 sm:grid-cols-2 gap-x-8 gap-y-4'>
                {(
                  [
                    { key: 'barang_dipesan', label: 'Barang Dipesan' },
                    { key: 'barang_tersedia', label: 'Barang Tersedia' },
                    { key: 'rakit', label: 'Rakit' },
                    { key: 'packing', label: 'Packing' },
                    { key: 'terkirim', label: 'Terkirim' },
                  ] as const
                ).map(({ key, label }) => {
                  const isSkipped = (supplierViewItem?.barang_supplier as any)?.skipped_fields?.includes(key);
                  const val = supplierViewItem?.barang_supplier?.[key as keyof typeof supplierViewItem.barang_supplier];
                  const order = supplierViewItem?.barang_supplier?.jumlah_order || supplierViewItem?.jumlah || 0;
                  return (
                    <div key={key} className='flex items-center justify-between'>
                      <span className='text-xs text-neutral-600'>{label}</span>
                      <div className='flex items-center gap-2'>
                        {isSkipped ? (
                          <Badge variant='secondary' className='text-[9px] bg-neutral-100 text-neutral-400 border-none'>SKIPPED</Badge>
                        ) : (
                          <span className='text-sm font-bold text-neutral-900'>{Number(val) || 0} <span className='text-[10px] text-neutral-400 font-normal'>/ {order}</span></span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <AlertDialogFooter className='border-t pt-4'>
            <AlertDialogCancel className='bg-neutral-100 hover:bg-neutral-200 border-none'>Tutup</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
