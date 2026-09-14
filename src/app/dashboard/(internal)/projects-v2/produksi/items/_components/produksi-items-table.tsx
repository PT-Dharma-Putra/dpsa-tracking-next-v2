'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  X,
  Package,
  Layers,
  Calendar,
  Building2,
  FileText,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  projectV2Service,
  ProduksiGlobalItem,
  Divisi,
} from '@/features/projects/services/project-v2-service';

export function ProduksiItemsTable() {
  const [searchInput, setSearchInput] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [selectedDivisi, setSelectedDivisi] = React.useState<string>('all');
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(25);

  // Debounce search input (300ms) for instant/automatic search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1); // Reset page on new search
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput]);

  // Fetch Divisi list for filter
  const { data: divisiList } = useQuery<Divisi[]>({
    queryKey: ['divisi-list'],
    queryFn: () => projectV2Service.getDivisions(),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch Global Produksi Items
  const {
    data: itemsResponse,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['produksi-global-items', page, perPage, debouncedSearch, selectedDivisi],
    queryFn: () =>
      projectV2Service.getAllProduksiItems({
        page,
        per_page: perPage,
        search: debouncedSearch || undefined,
        divisi_id: selectedDivisi !== 'all' ? selectedDivisi : undefined,
      }),
  });

  const items = itemsResponse?.data || [];
  const meta = itemsResponse?.meta || {
    current_page: 1,
    last_page: 1,
    per_page: 25,
    total: 0,
    total_qty: 0,
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setPage(1);
  };

  const handleDivisiChange = (val: string) => {
    setSelectedDivisi(val);
    setPage(1);
  };

  const formatDeadline = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      const parsed = new Date(dateStr);
      if (!isValid(parsed)) return dateStr;
      return format(parsed, 'dd MMM yyyy', { locale: idLocale });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className='space-y-4'>
      {/* Stat Cards: Total Items & Total Qty */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
        {/* Card 1: Total Item */}
        <Card className='border border-neutral-200 bg-white shadow-sm'>
          <CardContent className='p-4 flex items-center justify-between'>
            <div className='space-y-1'>
              <p className='text-xs font-medium text-neutral-500 uppercase tracking-wider'>
                Total Jenis Item
              </p>
              <div className='flex items-baseline gap-2'>
                <span className='text-2xl font-bold text-neutral-800'>
                  {meta.total.toLocaleString('id-ID')}
                </span>
                <span className='text-xs text-neutral-500'>Item</span>
              </div>
              {debouncedSearch && (
                <p className='text-[11px] text-amber-600 font-medium'>
                  Hasil pencarian: &quot;{debouncedSearch}&quot;
                </p>
              )}
            </div>
            <div className='h-11 w-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center'>
              <Package className='h-5 w-5' />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Qty */}
        <Card className='border border-neutral-200 bg-white shadow-sm'>
          <CardContent className='p-4 flex items-center justify-between'>
            <div className='space-y-1'>
              <p className='text-xs font-medium text-neutral-500 uppercase tracking-wider'>
                Total Kuantitas (Jumlah)
              </p>
              <div className='flex items-baseline gap-2'>
                <span className='text-2xl font-bold text-neutral-800'>
                  {meta.total_qty.toLocaleString('id-ID')}
                </span>
                <span className='text-xs text-neutral-500'>Unit</span>
              </div>
              <p className='text-[11px] text-neutral-400'>
                Akumulasi seluruh kuantitas item
              </p>
            </div>
            <div className='h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center'>
              <Layers className='h-5 w-5' />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Quick Filter Info */}
        <Card className='border border-neutral-200 bg-white shadow-sm sm:col-span-2 lg:col-span-1'>
          <CardContent className='p-4 flex items-center justify-between'>
            <div className='space-y-1'>
              <p className='text-xs font-medium text-neutral-500 uppercase tracking-wider'>
                Halaman Aktif
              </p>
              <div className='flex items-baseline gap-2'>
                <span className='text-2xl font-bold text-neutral-800'>
                  {meta.current_page}
                </span>
                <span className='text-xs text-neutral-500'>
                  dari {meta.last_page || 1} halaman
                </span>
              </div>
              <p className='text-[11px] text-neutral-400'>
                {perPage} item per halaman
              </p>
            </div>
            <div className='h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center'>
              <FileText className='h-5 w-5' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className='bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3'>
        <div className='flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3'>
          {/* Automatic Instant Search Input */}
          <div className='relative flex-1 max-w-md'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400' />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder='Ketik untuk mencari nama item otomatis...'
              className='pl-9 pr-9 h-10 bg-neutral-50/70 border-neutral-200 focus:bg-white transition-all text-sm'
            />
            {searchInput && (
              <button
                type='button'
                onClick={handleClearSearch}
                className='absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1'
                title='Hapus pencarian'
              >
                <X className='h-4 w-4' />
              </button>
            )}
          </div>

          {/* Divisi Filter */}
          <div className='w-full sm:w-[200px]'>
            <Select value={selectedDivisi} onValueChange={handleDivisiChange}>
              <SelectTrigger className='h-10 border-neutral-200 bg-neutral-50/70 text-sm'>
                <div className='flex items-center gap-2 truncate'>
                  <Filter className='h-3.5 w-3.5 text-neutral-400 shrink-0' />
                  <SelectValue placeholder='Semua Divisi' />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Semua Divisi</SelectItem>
                {divisiList?.map((d) => (
                  <SelectItem key={d.id} value={d.id.toString()}>
                    {d.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Refresh & Per Page */}
        <div className='flex items-center justify-between sm:justify-end gap-2'>
          <div className='flex items-center gap-1.5 text-xs text-neutral-500'>
            <span>Tampilkan:</span>
            <Select
              value={perPage.toString()}
              onValueChange={(val) => {
                setPerPage(Number(val));
                setPage(1);
              }}
            >
              <SelectTrigger className='h-9 w-[75px] border-neutral-200 text-xs'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='10'>10</SelectItem>
                <SelectItem value='25'>25</SelectItem>
                <SelectItem value='50'>50</SelectItem>
                <SelectItem value='100'>100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant='outline'
            size='icon'
            className='h-9 w-9 shrink-0 border-neutral-200 hover:bg-neutral-100'
            onClick={() => refetch()}
            disabled={isFetching}
            title='Muat Ulang Data'
          >
            <RotateCcw
              className={`h-4 w-4 text-neutral-600 ${
                isFetching ? 'animate-spin' : ''
              }`}
            />
          </Button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className='bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden'>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader className='bg-neutral-50/80 border-b border-neutral-200'>
              <TableRow className='hover:bg-transparent'>
                <TableHead className='w-[60px] text-xs font-semibold text-neutral-600 text-center'>
                  No
                </TableHead>
                <TableHead className='min-w-[220px] text-xs font-semibold text-neutral-700'>
                  Nama Item
                </TableHead>
                <TableHead className='min-w-[90px] text-xs font-semibold text-neutral-600 text-center'>
                  Lantai
                </TableHead>
                <TableHead className='min-w-[150px] text-xs font-semibold text-neutral-600'>
                  Ruang
                </TableHead>
                <TableHead className='min-w-[80px] text-xs font-semibold text-neutral-600 text-right'>
                  Panjang
                </TableHead>
                <TableHead className='min-w-[80px] text-xs font-semibold text-neutral-600 text-right'>
                  Lebar
                </TableHead>
                <TableHead className='min-w-[80px] text-xs font-semibold text-neutral-600 text-right'>
                  Tinggi
                </TableHead>
                <TableHead className='min-w-[90px] text-xs font-semibold text-neutral-700 text-center bg-orange-50/40'>
                  Jumlah
                </TableHead>
                <TableHead className='min-w-[110px] text-xs font-semibold text-neutral-600'>
                  Divisi
                </TableHead>
                <TableHead className='min-w-[160px] text-xs font-semibold text-neutral-600'>
                  Client
                </TableHead>
                <TableHead className='min-w-[180px] text-xs font-semibold text-neutral-600'>
                  Nomor SPK
                </TableHead>
                <TableHead className='min-w-[120px] text-xs font-semibold text-neutral-600'>
                  Deadline
                </TableHead>
                <TableHead className='min-w-[160px] text-xs font-semibold text-neutral-700 text-center'>
                  Progress Produksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} className='animate-pulse border-b border-neutral-100'>
                    {Array.from({ length: 13 }).map((_, j) => (
                      <TableCell key={j} className='py-3.5'>
                        <div className='h-4 bg-neutral-200/70 rounded w-full max-w-[100px]'></div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={13}
                    className='h-60 text-center text-neutral-500'
                  >
                    <div className='flex flex-col items-center justify-center space-y-2'>
                      <div className='h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400'>
                        <Package className='h-6 w-6' />
                      </div>
                      <p className='font-medium text-neutral-700'>
                        Tidak ada data item ditemukan
                      </p>
                      <p className='text-xs text-neutral-400 max-w-sm'>
                        {debouncedSearch
                          ? `Tidak ada item yang cocok dengan kata kunci "${debouncedSearch}". Coba gunakan kata kunci lain.`
                          : 'Belum ada data project item pada sistem.'}
                      </p>
                      {debouncedSearch && (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={handleClearSearch}
                          className='mt-2 text-xs'
                        >
                          Reset Pencarian
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item: ProduksiGlobalItem, index: number) => {
                  const rowNumber = (meta.current_page - 1) * meta.per_page + index + 1;
                  const progress = Number(item.progress_produksi) || 0;

                  return (
                    <TableRow
                      key={item.id}
                      className='hover:bg-neutral-50/70 transition-colors border-b border-neutral-100 text-xs'
                    >
                      {/* No */}
                      <TableCell className='text-center text-neutral-400 font-mono'>
                        {rowNumber}
                      </TableCell>

                      {/* Nama Item */}
                      <TableCell className='font-medium text-neutral-900'>
                        <div className='flex flex-col'>
                          <span className='font-semibold text-neutral-900 line-clamp-2'>
                            {item.item || '-'}
                          </span>
                          {item.project_name && (
                            <span className='text-[10px] text-neutral-400 line-clamp-1 mt-0.5'>
                              Proyek: {item.project_name}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Lantai */}
                      <TableCell className='text-center'>
                        {item.lantai && item.lantai !== '-' ? (
                          <Badge
                            variant='outline'
                            className='font-normal text-neutral-700 bg-neutral-50 px-2 py-0.5'
                          >
                            {item.lantai}
                          </Badge>
                        ) : (
                          <span className='text-neutral-400'>-</span>
                        )}
                      </TableCell>

                      {/* Ruang */}
                      <TableCell className='text-neutral-700'>
                        <span className='line-clamp-2'>{item.ruang || '-'}</span>
                      </TableCell>

                      {/* Panjang */}
                      <TableCell className='text-right font-mono text-neutral-700'>
                        {item.panjang !== null && item.panjang !== undefined
                          ? item.panjang
                          : '-'}
                      </TableCell>

                      {/* Lebar */}
                      <TableCell className='text-right font-mono text-neutral-700'>
                        {item.lebar !== null && item.lebar !== undefined
                          ? item.lebar
                          : '-'}
                      </TableCell>

                      {/* Tinggi */}
                      <TableCell className='text-right font-mono text-neutral-700'>
                        {item.tinggi !== null && item.tinggi !== undefined
                          ? item.tinggi
                          : '-'}
                      </TableCell>

                      {/* Jumlah (Qty) */}
                      <TableCell className='text-center bg-orange-50/20'>
                        <Badge className='bg-orange-100 text-orange-800 hover:bg-orange-100 font-semibold px-2 py-0.5 border border-orange-200/60'>
                          {item.jumlah} {item.satuan || 'Unit'}
                        </Badge>
                      </TableCell>

                      {/* Divisi */}
                      <TableCell>
                        {item.divisi && item.divisi !== '-' ? (
                          <Badge
                            variant='secondary'
                            className='font-medium text-neutral-800 bg-neutral-100 border border-neutral-200'
                          >
                            {item.divisi}
                          </Badge>
                        ) : (
                          <span className='text-neutral-400'>-</span>
                        )}
                      </TableCell>

                      {/* Client */}
                      <TableCell className='text-neutral-800 font-medium'>
                        <div className='flex items-center gap-1.5'>
                          <Building2 className='h-3.5 w-3.5 text-neutral-400 shrink-0' />
                          <span className='line-clamp-1'>{item.client || '-'}</span>
                        </div>
                      </TableCell>

                      {/* Nomor SPK */}
                      <TableCell className='text-neutral-700 font-mono text-[11px]'>
                        <span className='line-clamp-1'>{item.nomor_spk || '-'}</span>
                      </TableCell>

                      {/* Deadline */}
                      <TableCell className='text-neutral-700 whitespace-nowrap'>
                        {item.deadline ? (
                          <div className='flex items-center gap-1.5'>
                            <Calendar className='h-3.5 w-3.5 text-neutral-400 shrink-0' />
                            <span>{formatDeadline(item.deadline)}</span>
                          </div>
                        ) : (
                          <span className='text-neutral-400'>-</span>
                        )}
                      </TableCell>

                      {/* Progress Produksi */}
                      <TableCell>
                        <div className='space-y-1.5 w-[140px] mx-auto'>
                          <div className='flex items-center justify-between text-[11px] font-medium'>
                            <span
                              className={
                                progress >= 100
                                  ? 'text-emerald-700 font-semibold'
                                  : progress > 0
                                  ? 'text-blue-700'
                                  : 'text-neutral-400'
                              }
                            >
                              {progress}%
                            </span>
                            <span className='text-[10px] text-neutral-400'>
                              {progress >= 100
                                ? 'Selesai'
                                : progress > 0
                                ? 'Proses'
                                : 'Belum'}
                            </span>
                          </div>
                          <Progress
                            value={progress}
                            className={`h-2 ${
                              progress >= 100
                                ? '[&>div]:bg-emerald-600'
                                : progress > 0
                                ? '[&>div]:bg-blue-600'
                                : '[&>div]:bg-neutral-300'
                            }`}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Bar */}
        <div className='flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-neutral-200 bg-neutral-50/50 text-xs text-neutral-600'>
          <div>
            Menampilkan{' '}
            <span className='font-semibold text-neutral-800'>
              {items.length > 0 ? (meta.current_page - 1) * meta.per_page + 1 : 0}
            </span>{' '}
            -{' '}
            <span className='font-semibold text-neutral-800'>
              {Math.min(meta.current_page * meta.per_page, meta.total)}
            </span>{' '}
            dari{' '}
            <span className='font-semibold text-neutral-800'>
              {meta.total.toLocaleString('id-ID')}
            </span>{' '}
            item
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={meta.current_page <= 1 || isLoading}
              className='h-8 px-3 text-xs border-neutral-200'
            >
              <ChevronLeft className='h-3.5 w-3.5 mr-1' />
              Sebelumnya
            </Button>

            <span className='px-2 font-medium text-neutral-700'>
              Hal {meta.current_page} / {meta.last_page || 1}
            </span>

            <Button
              variant='outline'
              size='sm'
              onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
              disabled={meta.current_page >= meta.last_page || isLoading}
              className='h-8 px-3 text-xs border-neutral-200'
            >
              Selanjutnya
              <ChevronRight className='h-3.5 w-3.5 ml-1' />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
