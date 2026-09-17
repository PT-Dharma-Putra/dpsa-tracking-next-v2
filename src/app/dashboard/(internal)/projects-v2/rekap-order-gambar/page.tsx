'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isPast } from 'date-fns';
import {
  Search,
  RefreshCw,
  Eye,
  Check,
  Calendar,
  User as UserIcon,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Image as ImageIcon,
  Layers,
  MessageSquare,
  Building,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/hooks/use-auth';
import {
  orderGambarService,
  OrderGambarItem,
  OrderGambarListParams,
} from '@/features/projects/services/order-gambar-service';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export default function RekapOrderGambarPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Filter & Pagination state
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [prioritasFilter, setPrioritasFilter] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const perPage = 15;

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Query Params
  const queryParams: OrderGambarListParams = {
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    prioritas: prioritasFilter !== 'all' ? prioritasFilter : undefined,
  };

  // Queries
  const {
    data: listData,
    isLoading: isLoadingList,
    isFetching: isFetchingList,
    refetch: refetchList,
  } = useQuery({
    queryKey: ['order-gambar-kerja', queryParams],
    queryFn: () => orderGambarService.getOrderGambarList(queryParams),
  });

  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['order-gambar-kerja-stats'],
    queryFn: () => orderGambarService.getOrderGambarStats(),
  });

  const handleRefresh = () => {
    refetchList();
    refetchStats();
  };

  // Modal States
  const [selectedOrder, setSelectedOrder] = React.useState<OrderGambarItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);

  // Terima Order State
  const [orderToAccept, setOrderToAccept] = React.useState<OrderGambarItem | null>(null);
  const [isAcceptAlertOpen, setIsAcceptAlertOpen] = React.useState(false);

  // Update Status Modal State
  const [orderToUpdate, setOrderToUpdate] = React.useState<OrderGambarItem | null>(null);
  const [updateStatusVal, setUpdateStatusVal] = React.useState('Selesai');
  const [catatanPenerimaVal, setCatatanPenerimaVal] = React.useState('');
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = React.useState(false);

  // Mutations
  const terimaMutation = useMutation({
    mutationFn: (id: number) => orderGambarService.terimaOrder(id),
    onSuccess: () => {
      toast.success('Order berhasil diterima dan berstatus Diproses');
      queryClient.invalidateQueries({ queryKey: ['order-gambar-kerja'] });
      queryClient.invalidateQueries({ queryKey: ['order-gambar-kerja-stats'] });
      setIsAcceptAlertOpen(false);
      setOrderToAccept(null);
    },
    onError: () => {
      toast.error('Gagal menerima order');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (payload: { id: number; status: string; catatan_penerima?: string }) =>
      orderGambarService.updateOrderStatus(payload.id, {
        status: payload.status,
        catatan_penerima: payload.catatan_penerima,
      }),
    onSuccess: () => {
      toast.success('Status order berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['order-gambar-kerja'] });
      queryClient.invalidateQueries({ queryKey: ['order-gambar-kerja-stats'] });
      setIsUpdateDialogOpen(false);
      setOrderToUpdate(null);
      setCatatanPenerimaVal('');
    },
    onError: () => {
      toast.error('Gagal memperbarui status order');
    },
  });

  const handleOpenDetail = (order: OrderGambarItem) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleOpenAccept = (order: OrderGambarItem) => {
    setOrderToAccept(order);
    setIsAcceptAlertOpen(true);
  };

  const handleOpenUpdate = (order: OrderGambarItem) => {
    setOrderToUpdate(order);
    setUpdateStatusVal(order.status === 'Pending' ? 'Diproses' : 'Selesai');
    setCatatanPenerimaVal(order.catatan_penerima || '');
    setIsUpdateDialogOpen(true);
  };

  const handleConfirmAccept = () => {
    if (!orderToAccept) return;
    terimaMutation.mutate(orderToAccept.id);
  };

  const handleConfirmUpdate = () => {
    if (!orderToUpdate) return;
    updateStatusMutation.mutate({
      id: orderToUpdate.id,
      status: updateStatusVal,
      catatan_penerima: catatanPenerimaVal.trim() || undefined,
    });
  };

  const getJenisOrderLabel = (val?: string | null) => {
    switch (val) {
      case '1':
        return 'Desain Interior';
      case '2':
        return 'Desain Furnitur';
      case '3':
      default:
        return 'Gambar Kerja';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return (
          <span className='inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200'>
            <Clock className='h-3 w-3' />
            Pending
          </span>
        );
      case 'Diproses':
        return (
          <span className='inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200'>
            <RefreshCw className='h-3 w-3' />
            Diproses
          </span>
        );
      case 'Selesai':
        return (
          <span className='inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200'>
            <CheckCircle2 className='h-3 w-3' />
            Selesai
          </span>
        );
      case 'Ditolak':
        return (
          <span className='inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200'>
            <AlertTriangle className='h-3 w-3' />
            Ditolak
          </span>
        );
      default:
        return (
          <span className='text-[11px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700'>
            {status}
          </span>
        );
    }
  };

  const orders = listData?.data || [];
  const totalPages = listData?.last_page || 1;

  return (
    <div className='space-y-6 pb-12'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-b border-neutral-200 pb-4'>
        <div>
          <div className='flex items-center gap-2.5'>
            <div className='h-9 w-9 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold'>
              <Layers className='h-5 w-5' />
            </div>
            <div>
              <h1 className='text-2xl font-bold tracking-tight text-neutral-900'>
                Rekap Order Gambar
              </h1>
              <p className='text-xs text-muted-foreground'>
                Daftar antrean dan rekapitulasi permintaan order gambar kerja dari PPIC ke Studio
              </p>
            </div>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={handleRefresh}
            disabled={isFetchingList}
            className='h-8 text-xs gap-1.5'
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isFetchingList && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3'>
        <Card className='shadow-xs border-neutral-200'>
          <CardHeader className='p-3.5 pb-1 flex flex-row items-center justify-between'>
            <span className='text-xs font-semibold text-neutral-600'>Total Order</span>
            <Layers className='h-4 w-4 text-neutral-400' />
          </CardHeader>
          <CardContent className='p-3.5 pt-0'>
            <div className='text-2xl font-black text-neutral-900'>
              {statsData?.total ?? 0}
            </div>
            <p className='text-[10px] text-muted-foreground mt-0.5'>Semua permintaan gambar</p>
          </CardContent>
        </Card>

        <Card className='shadow-xs border-amber-200 bg-amber-50/20'>
          <CardHeader className='p-3.5 pb-1 flex flex-row items-center justify-between'>
            <span className='text-xs font-semibold text-amber-800'>Antrean Pending</span>
            <Clock className='h-4 w-4 text-amber-500' />
          </CardHeader>
          <CardContent className='p-3.5 pt-0'>
            <div className='text-2xl font-black text-amber-700'>
              {statsData?.pending ?? 0}
            </div>
            <p className='text-[10px] text-amber-600/80 mt-0.5'>Menunggu diterima studio</p>
          </CardContent>
        </Card>

        <Card className='shadow-xs border-blue-200 bg-blue-50/20'>
          <CardHeader className='p-3.5 pb-1 flex flex-row items-center justify-between'>
            <span className='text-xs font-semibold text-blue-800'>Sedang Diproses</span>
            <RefreshCw className='h-4 w-4 text-blue-500' />
          </CardHeader>
          <CardContent className='p-3.5 pt-0'>
            <div className='text-2xl font-black text-blue-700'>
              {statsData?.diproses ?? 0}
            </div>
            <p className='text-[10px] text-blue-600/80 mt-0.5'>Dikerjakan oleh drafter</p>
          </CardContent>
        </Card>

        <Card className='shadow-xs border-red-200 bg-red-50/20'>
          <CardHeader className='p-3.5 pb-1 flex flex-row items-center justify-between'>
            <span className='text-xs font-semibold text-red-800'>Prioritas Mendesak</span>
            <AlertTriangle className='h-4 w-4 text-red-500' />
          </CardHeader>
          <CardContent className='p-3.5 pt-0'>
            <div className='text-2xl font-black text-red-700'>
              {statsData?.mendesak ?? 0}
            </div>
            <p className='text-[10px] text-red-600/80 mt-0.5'>Perlu diprioritaskan segera</p>
          </CardContent>
        </Card>

        <Card className='shadow-xs border-emerald-200 bg-emerald-50/20 col-span-2 sm:col-span-1'>
          <CardHeader className='p-3.5 pb-1 flex flex-row items-center justify-between'>
            <span className='text-xs font-semibold text-emerald-800'>Selesai</span>
            <CheckCircle2 className='h-4 w-4 text-emerald-500' />
          </CardHeader>
          <CardContent className='p-3.5 pt-0'>
            <div className='text-2xl font-black text-emerald-700'>
              {statsData?.selesai ?? 0}
            </div>
            <p className='text-[10px] text-emerald-600/80 mt-0.5'>Gambar rampung dikerjakan</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Toolbar */}
      <Card className='shadow-xs border-neutral-200'>
        <CardContent className='p-3.5'>
          <div className='flex flex-col md:flex-row md:items-center justify-between gap-3'>
            {/* Search */}
            <div className='relative flex-1 min-w-[240px] max-w-md'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400' />
              <Input
                placeholder='Cari nomor order, proyek, SPK, atau klien...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='pl-8 h-9 text-xs'
              />
            </div>

            {/* Filters */}
            <div className='flex flex-wrap items-center gap-2'>
              {/* Status Filter */}
              <div className='flex items-center gap-1.5'>
                <span className='text-xs text-neutral-500 font-medium'>Status:</span>
                <Select
                  value={statusFilter}
                  onValueChange={(val) => {
                    setStatusFilter(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className='h-8 text-xs w-[125px]'>
                    <SelectValue placeholder='Semua Status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Semua Status</SelectItem>
                    <SelectItem value='Pending'>Pending</SelectItem>
                    <SelectItem value='Diproses'>Diproses</SelectItem>
                    <SelectItem value='Selesai'>Selesai</SelectItem>
                    <SelectItem value='Ditolak'>Ditolak</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Prioritas Filter */}
              <div className='flex items-center gap-1.5'>
                <span className='text-xs text-neutral-500 font-medium'>Prioritas:</span>
                <Select
                  value={prioritasFilter}
                  onValueChange={(val) => {
                    setPrioritasFilter(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className='h-8 text-xs w-[125px]'>
                    <SelectValue placeholder='Semua' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Semua Prioritas</SelectItem>
                    <SelectItem value='2'>Mendesak</SelectItem>
                    <SelectItem value='1'>Biasa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Data */}
      <Card className='shadow-xs border-neutral-200 overflow-hidden'>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader className='bg-neutral-50'>
              <TableRow>
                <TableHead className='whitespace-nowrap text-xs font-bold text-neutral-700'>No Order</TableHead>
                <TableHead className='whitespace-nowrap text-xs font-bold text-neutral-700'>Tgl Order</TableHead>
                <TableHead className='whitespace-nowrap text-xs font-bold text-neutral-700'>Jenis</TableHead>
                <TableHead className='whitespace-nowrap text-xs font-bold text-neutral-700'>Metode</TableHead>
                <TableHead className='min-w-[220px] text-xs font-bold text-neutral-700'>Detail Pekerjaan</TableHead>
                <TableHead className='whitespace-nowrap text-xs font-bold text-neutral-700'>Prioritas</TableHead>
                <TableHead className='whitespace-nowrap text-xs font-bold text-neutral-700'>Target Selesai</TableHead>
                <TableHead className='whitespace-nowrap text-xs font-bold text-neutral-700'>Pengirim</TableHead>
                <TableHead className='whitespace-nowrap text-xs font-bold text-neutral-700'>Penerima</TableHead>
                <TableHead className='whitespace-nowrap text-xs font-bold text-neutral-700'>Status</TableHead>
                <TableHead className='min-w-[200px] text-xs font-bold text-neutral-700'>Proyek & Klien</TableHead>
                <TableHead className='w-[110px] text-xs font-bold text-neutral-700 text-right pr-4'>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingList ? (
                <TableRow>
                  <TableCell colSpan={11} className='h-32 text-center text-xs text-neutral-500'>
                    <div className='flex items-center justify-center gap-2'>
                      <RefreshCw className='h-4 w-4 animate-spin text-orange-600' />
                      Memuat data order gambar kerja...
                    </div>
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className='h-32 text-center text-xs text-neutral-500'>
                    Tidak ada data order gambar kerja yang sesuai filter.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const isOverdue =
                    order.target_selesai &&
                    order.status !== 'Selesai' &&
                    isPast(new Date(order.target_selesai));

                  return (
                    <TableRow key={order.id} className='hover:bg-neutral-50/60'>
                      {/* 1. No Order */}
                      <TableCell className='font-mono font-bold text-neutral-800 text-xs align-top py-3 whitespace-nowrap'>
                        {order.no_order || `ORD-#${order.id}`}
                      </TableCell>

                      {/* 2. Jenis */}
                      <TableCell className='text-xs align-top py-3 whitespace-nowrap'>
                        <span className='font-semibold text-neutral-700'>
                          {getJenisOrderLabel(order.jenis_order)}
                        </span>
                      </TableCell>

                      {/* 3. Metode */}
                      <TableCell className='text-xs align-top py-3 whitespace-nowrap'>
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block',
                            order.pakai_gambar === 0
                              ? 'bg-neutral-100 text-neutral-600 border-neutral-200'
                              : 'bg-orange-50 text-orange-700 border-orange-200'
                          )}
                        >
                          {order.pakai_gambar === 0 ? 'Tanpa Gambar' : 'Pakai Gambar'}
                        </span>
                      </TableCell>

                      {/* 4. Detail Pekerjaan */}
                      <TableCell className='text-xs align-top py-3 min-w-[220px] max-w-[320px]'>
                        <p
                          className='line-clamp-2 text-neutral-700 text-xs leading-snug'
                          title={order.detail_pekerjaan || undefined}
                        >
                          {order.detail_pekerjaan || <span className='text-neutral-400 italic'>-</span>}
                        </p>
                      </TableCell>

                      {/* 5. Prioritas */}
                      <TableCell className='text-xs align-top py-3 whitespace-nowrap'>
                        {order.prioritas === '2' ? (
                          <span className='text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 inline-block'>
                            Mendesak
                          </span>
                        ) : (
                          <span className='text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 inline-block'>
                            Biasa
                          </span>
                        )}
                      </TableCell>

                      {/* 6. Target Selesai */}
                      <TableCell className='text-xs align-top py-3 whitespace-nowrap'>
                        {order.target_selesai ? (
                          <div className='flex items-center gap-1.5'>
                            <span
                              className={cn(
                                'text-xs font-semibold',
                                isOverdue ? 'text-red-600 font-bold' : 'text-neutral-800'
                              )}
                            >
                              {format(new Date(order.target_selesai), 'dd MMM yyyy')}
                            </span>
                            {isOverdue && (
                              <span className='text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200'>
                                Overdue
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className='text-neutral-400 text-xs'>-</span>
                        )}
                      </TableCell>

                      {/* 7. Pengirim */}
                      <TableCell className='text-xs align-top py-3 whitespace-nowrap'>
                        <span className='font-medium text-neutral-800'>
                          {order.user?.name || '-'}
                        </span>
                      </TableCell>

                      {/* 8. Penerima */}
                      <TableCell className='text-xs align-top py-3 whitespace-nowrap'>
                        {order.penerima ? (
                          <span className='font-semibold text-neutral-800'>
                            {order.penerima.name}
                          </span>
                        ) : (
                          <span className='text-neutral-400 italic text-xs'>Belum diambil</span>
                        )}
                      </TableCell>

                      {/* 9. Status */}
                      <TableCell className='align-top py-3 whitespace-nowrap'>
                        {getStatusBadge(order.status)}
                      </TableCell>

                      {/* 10. Proyek & Klien */}
                      <TableCell className='text-xs align-top py-3 min-w-[200px] max-w-[280px]'>
                        <div className='flex flex-col gap-0.5'>
                          {order.project ? (
                            <Link
                              href={`/dashboard/projects-v2/perencanaan/${order.project.id}/detail`}
                              className='font-bold text-neutral-900 hover:text-orange-600 hover:underline flex items-center gap-1'
                            >
                              <span className='truncate max-w-[220px]'>{order.project.nama_projek}</span>
                              <ExternalLink className='h-3 w-3 text-neutral-400 shrink-0' />
                            </Link>
                          ) : (
                            <span className='font-bold text-neutral-500'>-</span>
                          )}
                          <div className='flex items-center gap-2 text-[10px] text-neutral-500'>
                            {order.project?.client?.nama && (
                              <span className='flex items-center gap-0.5 text-neutral-600'>
                                <Building className='h-2.5 w-2.5' />
                                {order.project.client.nama}
                              </span>
                            )}
                            {order.project?.no_spk && <span>SPK: {order.project.no_spk}</span>}
                          </div>
                        </div>
                      </TableCell>

                      {/* 11. Aksi */}
                      <TableCell className='text-right align-top py-3 pr-4 whitespace-nowrap'>
                        <div className='flex items-center justify-end gap-1'>
                          {/* Tombol Lihat Detail */}
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-7 w-7 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                            title='Lihat Detail'
                            onClick={() => handleOpenDetail(order)}
                          >
                            <Eye className='h-3.5 w-3.5' />
                          </Button>

                          {/* Tombol Terima Order (khusus jika status masih Pending) */}
                          {order.status === 'Pending' && (
                            <Button
                              variant='default'
                              size='sm'
                              className='h-7 px-2 text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1'
                              title='Terima Order'
                              onClick={() => handleOpenAccept(order)}
                            >
                              <Check className='h-3 w-3' />
                              Terima
                            </Button>
                          )}

                          {/* Tombol Update Status (jika sudah diproses atau perlu diupdate) */}
                          {order.status !== 'Pending' && (
                            <Button
                              variant='outline'
                              size='sm'
                              className='h-7 px-2 text-[10px] border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-bold gap-1'
                              title='Update Status'
                              onClick={() => handleOpenUpdate(order)}
                            >
                              <MessageSquare className='h-3 w-3' />
                              Status
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className='p-3 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-600 bg-neutral-50/40'>
          <div>
            Menampilkan baris {(listData?.from ?? 0)} sampai {(listData?.to ?? 0)} dari total {(listData?.total ?? 0)} order
          </div>
          <div className='flex items-center gap-1.5'>
            <Button
              variant='outline'
              size='sm'
              className='h-7 w-7 p-0'
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className='h-3.5 w-3.5' />
            </Button>
            <span className='px-2 font-bold'>
              {page} / {totalPages}
            </span>
            <Button
              variant='outline'
              size='sm'
              className='h-7 w-7 p-0'
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className='h-3.5 w-3.5' />
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal Detail Order */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className='max-w-xl max-h-[85vh] overflow-y-auto'>
          <DialogHeader>
            <div className='flex items-center justify-between'>
              <DialogTitle className='text-base font-bold flex items-center gap-2'>
                <ImageIcon className='h-5 w-5 text-orange-500' />
                Detail Order Gambar Kerja
              </DialogTitle>
              {selectedOrder && getStatusBadge(selectedOrder.status)}
            </div>
            <DialogDescription className='text-xs'>
              Informasi lengkap permintaan order gambar kerja dari PPIC ke Studio.
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className='space-y-4 py-2 text-xs'>
              {/* Header Box: Nomor Order, Proyek & Prioritas */}
              <div className='p-3 rounded-lg bg-neutral-50 border border-neutral-200 space-y-2'>
                <div className='flex items-center justify-between'>
                  <div className='space-y-0.5'>
                    <span className='text-[10px] text-neutral-500 uppercase tracking-wider font-semibold'>
                      Nomor Order
                    </span>
                    <p className='font-mono font-bold text-sm text-neutral-900'>
                      {selectedOrder.no_order || `ORD-#${selectedOrder.id}`}
                    </p>
                  </div>
                  <div>
                    {selectedOrder.prioritas === '2' ? (
                      <span className='text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200'>
                        Prioritas: Mendesak
                      </span>
                    ) : (
                      <span className='text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200'>
                        Prioritas: Biasa
                      </span>
                    )}
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-2 pt-2 border-t border-neutral-200/80'>
                  <div>
                    <span className='text-[10px] text-neutral-500'>Proyek:</span>
                    <p className='font-bold text-neutral-800'>{selectedOrder.project?.nama_projek || '-'}</p>
                  </div>
                  <div>
                    <span className='text-[10px] text-neutral-500'>No. SPK:</span>
                    <p className='font-bold text-neutral-800'>{selectedOrder.project?.no_spk || '-'}</p>
                  </div>
                  <div>
                    <span className='text-[10px] text-neutral-500'>Klien:</span>
                    <p className='font-semibold text-neutral-700'>{selectedOrder.project?.client?.nama || '-'}</p>
                  </div>
                  <div>
                    <span className='text-[10px] text-neutral-500'>Metode Order:</span>
                    <p className='font-semibold text-neutral-700'>
                      {selectedOrder.pakai_gambar === 0 ? 'Tanpa Gambar' : 'Pakai Gambar'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detail Permintaan */}
              <div className='space-y-1'>
                <Label className='text-xs font-bold text-neutral-700'>Detail Permintaan:</Label>
                <div className='p-3 rounded-md bg-neutral-50 border border-neutral-200 text-neutral-800 whitespace-pre-wrap leading-relaxed min-h-[60px]'>
                  {selectedOrder.detail_pekerjaan || <span className='text-neutral-400 italic'>Tidak ada detail permintaan.</span>}
                </div>
              </div>

              {/* Catatan dari PPIC */}
              <div className='space-y-1'>
                <Label className='text-xs font-bold text-neutral-700'>Catatan dari PPIC (Pengirim):</Label>
                <div className='p-2.5 rounded-md bg-neutral-50 border border-neutral-200 text-neutral-800 whitespace-pre-wrap min-h-[40px]'>
                  {selectedOrder.catatan_pengirim || <span className='text-neutral-400 italic'>Tidak ada catatan dari PPIC.</span>}
                </div>
              </div>

              {/* Box Penerima & Catatan Studio */}
              <div className='p-3 rounded-lg bg-blue-50/40 border border-blue-100 space-y-2'>
                <div className='grid grid-cols-2 gap-2'>
                  <div>
                    <span className='text-[10px] text-blue-700 font-semibold'>Drafter / Penerima Studio:</span>
                    <p className='font-bold text-neutral-800'>
                      {selectedOrder.penerima?.name || <span className='text-neutral-400 italic font-normal'>Belum ada penerima</span>}
                    </p>
                  </div>
                  <div>
                    <span className='text-[10px] text-blue-700 font-semibold'>Tanggal Diterima:</span>
                    <p className='font-bold text-neutral-800'>
                      {selectedOrder.tanggal_diterima
                        ? format(new Date(selectedOrder.tanggal_diterima), 'dd MMMM yyyy, HH:mm')
                        : '-'}
                    </p>
                  </div>
                </div>

                <div className='pt-2 border-t border-blue-100'>
                  <span className='text-[10px] text-blue-700 font-semibold'>Catatan dari Studio / Penerima:</span>
                  <div className='mt-1 p-2 rounded bg-white border border-blue-100 text-neutral-800 whitespace-pre-wrap min-h-[35px]'>
                    {selectedOrder.catatan_penerima || <span className='text-neutral-400 italic'>Belum ada catatan dari Studio.</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className='pt-2'>
            <Button variant='outline' size='sm' onClick={() => setIsDetailOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog: Terima Order */}
      <AlertDialog open={isAcceptAlertOpen} onOpenChange={setIsAcceptAlertOpen}>
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <CheckCircle2 className='h-5 w-5 text-blue-600' />
              Terima Order Gambar Kerja
            </AlertDialogTitle>
            <AlertDialogDescription className='text-xs'>
              Apakah Anda yakin ingin menerima order{' '}
              <strong>{orderToAccept?.no_order || `#${orderToAccept?.id}`}</strong> untuk proyek{' '}
              <strong>{orderToAccept?.project?.nama_projek}</strong>?
              <br />
              Nama Anda akan dicatat sebagai penerima dan status akan berubah menjadi <strong>Diproses</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={terimaMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className='bg-blue-600 hover:bg-blue-700 text-white font-bold'
              onClick={handleConfirmAccept}
              disabled={terimaMutation.isPending}
            >
              {terimaMutation.isPending && <RefreshCw className='h-3.5 w-3.5 animate-spin mr-1.5' />}
              Ya, Terima Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Dialog: Update Status / Selesai */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-base font-bold flex items-center gap-2'>
              <MessageSquare className='h-5 w-5 text-orange-500' />
              Update Status Order
            </DialogTitle>
            <DialogDescription className='text-xs'>
              Perbarui status pekerjaan dan berikan catatan hasil atau kendala pengerjaan gambar.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-3 py-2 text-xs'>
            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold text-neutral-700'>Status Order</Label>
              <Select value={updateStatusVal} onValueChange={setUpdateStatusVal}>
                <SelectTrigger className='h-8 text-xs'>
                  <SelectValue placeholder='Pilih Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Diproses'>Diproses</SelectItem>
                  <SelectItem value='Selesai'>Selesai</SelectItem>
                  <SelectItem value='Ditolak'>Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold text-neutral-700'>Catatan dari Penerima / Studio</Label>
              <Textarea
                rows={3}
                placeholder='Tuliskan catatan hasil gambar, kendala, atau revisi...'
                value={catatanPenerimaVal}
                onChange={(e) => setCatatanPenerimaVal(e.target.value)}
                className='text-xs resize-none'
              />
            </div>
          </div>

          <DialogFooter className='pt-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsUpdateDialogOpen(false)}
              disabled={updateStatusMutation.isPending}
            >
              Batal
            </Button>
            <Button
              className='bg-orange-600 hover:bg-orange-700 text-white font-bold'
              size='sm'
              onClick={handleConfirmUpdate}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending && (
                <RefreshCw className='h-3.5 w-3.5 animate-spin mr-1.5' />
              )}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
