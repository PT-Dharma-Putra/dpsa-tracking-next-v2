'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Search,
  ExternalLink,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Filter,
  X,
  Pencil,
  Eye,
  FileCheck,
  ArrowUpDown,
  Building2,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import {
  bastService,
  ProjectBastRow,
  BastListParams,
} from '@/features/projects/services/bast-service';
import { projectV2Service } from '@/features/projects/services/project-v2-service';

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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

const formatRupiah = (val: number | string | null | undefined) => {
  if (val === null || val === undefined || val === '') return '-';
  const num =
    typeof val === 'number'
      ? val
      : parseFloat(val.toString().replace(/[^0-9.-]+/g, ''));
  if (isNaN(num)) return '-';
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(num));
};

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(
      dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T')
    );
    if (isNaN(d.getTime())) return '-';
    return format(d, 'dd MMM yyyy');
  } catch {
    return '-';
  }
};

export default function MarketingBastPage() {
  const queryClient = useQueryClient();

  // Filters State
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [marketingFilter, setMarketingFilter] = React.useState('all');
  const [statusBastFilter, setStatusBastFilter] = React.useState('all');
  const [pengirimanFilter, setPengirimanFilter] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);
  const [sortBy, setSortBy] = React.useState<'spk_masuk' | 'nominal' | 'pengiriman'>('spk_masuk');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc');

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Query Params
  const queryParams: BastListParams = {
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    marketing_id: marketingFilter !== 'all' ? marketingFilter : undefined,
    status_bast: statusBastFilter !== 'all' ? statusBastFilter : undefined,
    pengiriman: pengirimanFilter !== 'all' ? pengirimanFilter : undefined,
    sort: sortBy,
    direction: sortDir,
  };

  // Queries
  const {
    data: listData,
    isLoading: isLoadingList,
    isFetching: isFetchingList,
    refetch: refetchList,
  } = useQuery({
    queryKey: ['bast-rekap', queryParams],
    queryFn: () => bastService.getBastRekap(queryParams),
  });

  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['bast-stats', marketingFilter],
    queryFn: () =>
      bastService.getBastStats(
        marketingFilter !== 'all' ? { marketing_id: marketingFilter } : undefined
      ),
  });

  const { data: marketings = [] } = useQuery({
    queryKey: ['marketings-list'],
    queryFn: () => projectV2Service.getMarketings(),
  });

  const handleRefresh = () => {
    refetchList();
    refetchStats();
  };

  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setMarketingFilter('all');
    setStatusBastFilter('all');
    setPengirimanFilter('all');
    setSortBy('spk_masuk');
    setSortDir('desc');
    setPage(1);
  };

  // Modal State for Upload / Edit BAST
  const [isBastModalOpen, setIsBastModalOpen] = React.useState(false);
  const [selectedProject, setSelectedProject] = React.useState<ProjectBastRow | null>(null);
  const [bastNoSurat, setBastNoSurat] = React.useState('');
  const [bastDate, setBastDate] = React.useState('');
  const [bastFile, setBastFile] = React.useState<File | null>(null);

  const openUploadModal = (project: ProjectBastRow) => {
    setSelectedProject(project);
    const existingBast = project.basts && project.basts.length > 0 ? project.basts[0] : null;
    if (existingBast) {
      setBastNoSurat(existingBast.no_surat || '');
      setBastDate(existingBast.date || '');
    } else {
      setBastNoSurat('');
      setBastDate(format(new Date(), 'yyyy-MM-dd'));
    }
    setBastFile(null);
    setIsBastModalOpen(true);
  };

  const uploadBastMutation = useMutation({
    mutationFn: (payload: { no_surat: string; date: string; file?: File | null }) => {
      if (!selectedProject) throw new Error('No project selected');
      return bastService.uploadBast(selectedProject.id, payload);
    },
    onSuccess: () => {
      toast.success('BAST berhasil disimpan');
      queryClient.invalidateQueries({ queryKey: ['bast-rekap'] });
      queryClient.invalidateQueries({ queryKey: ['bast-stats'] });
      setIsBastModalOpen(false);
      setSelectedProject(null);
      setBastNoSurat('');
      setBastDate('');
      setBastFile(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menyimpan BAST');
    },
  });

  const handleSaveBast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    const hasExistingBast = selectedProject.basts && selectedProject.basts.length > 0;
    if (!bastNoSurat.trim() || !bastDate) {
      toast.error('Harap lengkapi Nomor Surat dan Tanggal BAST');
      return;
    }

    if (!hasExistingBast && !bastFile) {
      toast.error('Harap pilih file dokumen BAST (PDF)');
      return;
    }

    if (bastFile) {
      const isPdf =
        bastFile.type === 'application/pdf' ||
        bastFile.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        toast.error('File BAST harus berformat PDF (.pdf)');
        return;
      }
    }

    uploadBastMutation.mutate({
      no_surat: bastNoSurat,
      date: bastDate,
      file: bastFile,
    });
  };

  const handleSortToggle = (col: 'spk_masuk' | 'nominal' | 'pengiriman') => {
    if (sortBy === col) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
    setPage(1);
  };

  const projects = listData?.data || [];
  const totalItems = listData?.total || 0;
  const totalPages = listData?.last_page || 1;

  return (
    <div className='space-y-6 pb-12'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2'>
            <FileCheck className='h-7 w-7 text-orange-600' />
            Rekap BAST Marketing
          </h1>
          <p className='text-sm text-neutral-500 mt-1'>
            Monitoring Berita Acara Serah Terima (BAST) untuk seluruh proyek yang memiliki SPK.
          </p>
        </div>

        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={handleRefresh}
            disabled={isFetchingList}
            className='h-9 text-xs'
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1.5 ${isFetchingList ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3'>
        {/* 1. Total SPK */}
        <Card className='border-neutral-200 shadow-sm'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-medium text-neutral-500'>Total Proyek SPK</span>
              <div className='h-8 w-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700'>
                <FileText className='h-4 w-4' />
              </div>
            </div>
            <div className='mt-2 text-2xl font-bold text-neutral-900'>
              {statsData?.total_spk ?? 0}
            </div>
            <div className='text-[11px] text-neutral-400 mt-0.5'>Semua SPK aktif</div>
          </CardContent>
        </Card>

        {/* 2. Wajib BAST (>= 50 Jt) */}
        <Card className='border-neutral-200 shadow-sm'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-medium text-blue-600'>Wajib BAST (≥ 50 Jt)</span>
              <div className='h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600'>
                <ShieldCheck className='h-4 w-4' />
              </div>
            </div>
            <div className='mt-2 text-2xl font-bold text-neutral-900'>
              {statsData?.wajib_bast ?? 0}
            </div>
            <div className='text-[11px] text-blue-600/70 mt-0.5'>Nominal ≥ Rp 50.000.000</div>
          </CardContent>
        </Card>

        {/* 3. BAST Terupload */}
        <Card className='border-neutral-200 shadow-sm'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-medium text-emerald-600'>BAST Terupload</span>
              <div className='h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600'>
                <CheckCircle2 className='h-4 w-4' />
              </div>
            </div>
            <div className='mt-2 text-2xl font-bold text-emerald-600'>
              {statsData?.bast_uploaded ?? 0}
            </div>
            <div className='text-[11px] text-emerald-600/70 mt-0.5'>Dokumen lengkap</div>
          </CardContent>
        </Card>

        {/* 4. BAST Pending */}
        <Card className='border-neutral-200 shadow-sm'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-medium text-amber-600'>BAST Belum Ada</span>
              <div className='h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600'>
                <Clock className='h-4 w-4' />
              </div>
            </div>
            <div className='mt-2 text-2xl font-bold text-amber-600'>
              {statsData?.bast_pending ?? 0}
            </div>
            <div className='text-[11px] text-amber-600/70 mt-0.5'>Perlu diunggah (≥ 50 Jt)</div>
          </CardContent>
        </Card>

        {/* 5. Tanpa BAST (< 50 Jt) */}
        <Card className='border-neutral-200 shadow-sm'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-medium text-neutral-500'>Tanpa BAST (&lt; 50 Jt)</span>
              <div className='h-8 w-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600'>
                <AlertCircle className='h-4 w-4' />
              </div>
            </div>
            <div className='mt-2 text-2xl font-bold text-neutral-800'>
              {statsData?.tanpa_bast ?? 0}
            </div>
            <div className='text-[11px] text-neutral-400 mt-0.5'>Tidak wajib BAST</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className='border-neutral-200 shadow-sm'>
        <CardContent className='p-4 space-y-3'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'>
            {/* Search Input */}
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400' />
              <Input
                placeholder='Cari No SPK, Nama Proyek, BAST...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='pl-9 text-xs h-9'
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className='absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600'
                >
                  <X className='h-3.5 w-3.5' />
                </button>
              )}
            </div>

            {/* Filter Marketing */}
            <Select
              value={marketingFilter}
              onValueChange={(val) => {
                setMarketingFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className='text-xs h-9'>
                <SelectValue placeholder='Filter Marketing' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Semua Marketing</SelectItem>
                {marketings.map((m: any) => (
                  <SelectItem key={m.id} value={m.id.toString()}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filter Status BAST */}
            <Select
              value={statusBastFilter}
              onValueChange={(val) => {
                setStatusBastFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className='text-xs h-9'>
                <SelectValue placeholder='Filter Status BAST' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Semua Status BAST</SelectItem>
                <SelectItem value='uploaded'>Sudah Ada BAST</SelectItem>
                <SelectItem value='pending'>Wajib BAST (Belum Upload)</SelectItem>
                <SelectItem value='tanpa_bast'>Tanpa BAST (&lt; 50 Jt)</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter Progres Pengiriman */}
            <Select
              value={pengirimanFilter}
              onValueChange={(val) => {
                setPengirimanFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className='text-xs h-9'>
                <SelectValue placeholder='Progres Pengiriman' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Semua Pengiriman</SelectItem>
                <SelectItem value='completed'>Selesai (100%)</SelectItem>
                <SelectItem value='in_progress'>Sedang Dikirim (1–99%)</SelectItem>
                <SelectItem value='not_started'>Belum Dikirim (0%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(search || marketingFilter !== 'all' || statusBastFilter !== 'all' || pengirimanFilter !== 'all') && (
            <div className='flex items-center justify-between pt-1 border-t border-neutral-100 text-xs text-neutral-500'>
              <span>Menampilkan filter aktif</span>
              <button
                onClick={handleResetFilters}
                className='text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1'
              >
                <X className='h-3 w-3' /> Reset Filter
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className='border-neutral-200 shadow-sm overflow-hidden'>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader className='bg-neutral-50'>
              <TableRow className='text-neutral-700 text-xs font-semibold'>
                {/* 0. NO */}
                <TableHead className='w-[60px] text-xs font-bold text-neutral-700 text-center'>
                  NO
                </TableHead>

                {/* 1. MKT */}
                <TableHead className='w-[100px] text-xs font-bold text-neutral-700'>
                  MKT
                </TableHead>

                {/* 2. NO SPK */}
                <TableHead className='min-w-[200px] text-xs font-bold text-neutral-700'>
                  NO SPK
                </TableHead>

                {/* 3. SPK MASUK */}
                <TableHead
                  className='w-[130px] text-xs font-bold text-neutral-700 cursor-pointer hover:bg-neutral-100'
                  onClick={() => handleSortToggle('spk_masuk')}
                >
                  <div className='flex items-center gap-1'>
                    SPK MASUK
                    <ArrowUpDown className='h-3 w-3 text-neutral-400' />
                  </div>
                </TableHead>

                {/* 4. NOMINAL SPK */}
                <TableHead
                  className='w-[160px] text-xs font-bold text-neutral-700 text-right cursor-pointer hover:bg-neutral-100'
                  onClick={() => handleSortToggle('nominal')}
                >
                  <div className='flex items-center justify-end gap-1'>
                    NOMINAL SPK
                    <ArrowUpDown className='h-3 w-3 text-neutral-400' />
                  </div>
                </TableHead>

                {/* 5. PROGRES PENGIRIMAN */}
                <TableHead
                  className='w-[160px] text-xs font-bold text-neutral-700 cursor-pointer hover:bg-neutral-100'
                  onClick={() => handleSortToggle('pengiriman')}
                >
                  <div className='flex items-center gap-1'>
                    PROGRES PENGIRIMAN
                    <ArrowUpDown className='h-3 w-3 text-neutral-400' />
                  </div>
                </TableHead>

                {/* 6. FILE BAST */}
                <TableHead className='min-w-[240px] text-xs font-bold text-neutral-700'>
                  FILE BAST
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoadingList ? (
                <TableRow>
                  <TableCell colSpan={7} className='h-48 text-center'>
                    <div className='flex flex-col items-center justify-center gap-2 text-neutral-500'>
                      <Loader2 className='h-6 w-6 animate-spin text-orange-500' />
                      <span className='text-xs'>Memuat data BAST...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className='h-48 text-center'>
                    <div className='flex flex-col items-center justify-center gap-2 text-neutral-400'>
                      <FileText className='h-8 w-8 text-neutral-300' />
                      <span className='text-sm font-medium text-neutral-600'>
                        Tidak ada data proyek SPK
                      </span>
                      <span className='text-xs text-neutral-400'>
                        Coba sesuaikan kata kunci pencarian atau filter Anda
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project, index) => {
                  const rowNumber = (page - 1) * perPage + index + 1;
                  const spkNominal = project.spk?.nominal ? Number(project.spk.nominal) : 0;
                  const isBelow50Juta = spkNominal > 0 && spkNominal < 50000000;
                  const pengirimanPersen = Math.round(Number(project.progres_kerja?.pengiriman || 0));
                  const latestBast =
                    project.basts && project.basts.length > 0 ? project.basts[0] : null;

                  return (
                    <TableRow key={project.id} className='hover:bg-neutral-50/70 text-xs'>
                      {/* 0. NO */}
                      <TableCell className='text-center font-medium text-neutral-500 align-top py-3.5'>
                        {rowNumber}
                      </TableCell>

                      {/* 1. MKT */}
                      <TableCell className='font-semibold text-neutral-800 align-top py-3.5'>
                        <span className='inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200'>
                          {project.marketing?.name || '-'}
                        </span>
                      </TableCell>

                      {/* 2. NO SPK */}
                      <TableCell className='align-top py-3.5 space-y-1'>
                        <Link
                          href={`/dashboard/projects-v2/marketing/${project.id}/items`}
                          className='font-bold text-neutral-900 hover:text-orange-600 transition-colors inline-flex items-center gap-1 group'
                          title='Buka detail item proyek'
                        >
                          <span>{project.spk?.nomor_spk || '-'}</span>
                          <ExternalLink className='h-3 w-3 text-neutral-400 group-hover:text-orange-600' />
                        </Link>
                        <div className='text-[11px] text-neutral-500 line-clamp-1' title={project.name}>
                          {project.name}
                        </div>
                        {project.client?.name && (
                          <div className='text-[10px] text-neutral-400 flex items-center gap-1'>
                            <Building2 className='h-2.5 w-2.5' />
                            {project.client.name}
                          </div>
                        )}
                      </TableCell>

                      {/* 3. SPK MASUK */}
                      <TableCell className='align-top py-3.5 text-neutral-700 whitespace-nowrap font-medium'>
                        {formatDate(project.spk?.tanggal_masuk || project.spk?.created_at)}
                      </TableCell>

                      {/* 4. NOMINAL SPK */}
                      <TableCell className='align-top py-3.5 text-right font-semibold text-neutral-900 whitespace-nowrap'>
                        <div>{formatRupiah(project.spk?.nominal)}</div>
                        {isBelow50Juta && (
                          <span className='text-[10px] text-neutral-400 font-normal'>
                            &lt; 50 Jt
                          </span>
                        )}
                      </TableCell>

                      {/* 5. PROGRES PENGIRIMAN */}
                      <TableCell className='align-top py-3.5 space-y-1.5'>
                        <div className='flex items-center justify-between text-[11px] font-medium'>
                          <span
                            className={
                              pengirimanPersen >= 100
                                ? 'text-emerald-700 font-bold'
                                : pengirimanPersen > 0
                                ? 'text-blue-700 font-semibold'
                                : 'text-neutral-500'
                            }
                          >
                            {pengirimanPersen}%
                          </span>
                          <span className='text-[10px] text-neutral-400'>
                            {pengirimanPersen >= 100
                              ? 'Terkirim Lengkap'
                              : pengirimanPersen > 0
                              ? 'Sebagian'
                              : 'Belum Kirim'}
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className='w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden'>
                          <div
                            className={`h-full rounded-full transition-all ${
                              pengirimanPersen >= 100
                                ? 'bg-emerald-500'
                                : pengirimanPersen > 0
                                ? 'bg-blue-500'
                                : 'bg-neutral-300'
                            }`}
                            style={{ width: `${Math.min(pengirimanPersen, 100)}%` }}
                          />
                        </div>
                      </TableCell>

                      {/* 6. FILE BAST */}
                      <TableCell className='align-top py-3.5'>
                        {isBelow50Juta ? (
                          // Case: Nominal SPK < 50 Juta
                          <div className='space-y-1.5'>
                            <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200'>
                              Tanpa BAST (&lt; 50 Jt)
                            </span>
                            {latestBast ? (
                              <div className='flex items-center gap-2 pt-0.5'>
                                <a
                                  href={latestBast.file_url}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='inline-flex items-center gap-1 text-[11px] text-orange-600 hover:text-orange-700 font-medium hover:underline'
                                >
                                  <FileText className='h-3 w-3' />
                                  <span>Lihat File BAST</span>
                                  <ExternalLink className='h-2.5 w-2.5' />
                                </a>
                              </div>
                            ) : null}
                          </div>
                        ) : latestBast ? (
                          // Case: Nominal >= 50 Juta & Sudah ada BAST
                          <div className='space-y-1'>
                            <div className='flex items-center gap-2'>
                              <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200'>
                                <CheckCircle2 className='h-3 w-3' />
                                BAST Selesai
                              </span>
                              <Button
                                size='sm'
                                variant='ghost'
                                onClick={() => openUploadModal(project)}
                                className='h-6 px-1.5 text-[10px] text-neutral-500 hover:text-neutral-800'
                                title='Edit / Ganti BAST'
                              >
                                <Pencil className='h-3 w-3 mr-1' />
                                Edit
                              </Button>
                            </div>
                            <div className='text-[11px] font-semibold text-neutral-800 truncate max-w-[220px]' title={latestBast.no_surat}>
                              {latestBast.no_surat}
                            </div>
                            <div className='flex items-center gap-2 text-[10px] text-neutral-400'>
                              <span>{formatDate(latestBast.date)}</span>
                              <span>•</span>
                              <a
                                href={latestBast.file_url}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-orange-600 hover:text-orange-700 font-semibold inline-flex items-center gap-0.5 hover:underline'
                              >
                                <FileText className='h-3 w-3' />
                                PDF
                                <ExternalLink className='h-2.5 w-2.5' />
                              </a>
                            </div>
                          </div>
                        ) : (
                          // Case: Nominal >= 50 Juta & Belum ada BAST
                          <div className='space-y-2'>
                            <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200'>
                              <Clock className='h-3 w-3' />
                              Belum Upload
                            </span>
                            <div>
                              <Button
                                size='sm'
                                onClick={() => openUploadModal(project)}
                                className='h-7 text-xs bg-orange-600 hover:bg-orange-700 text-white shadow-sm'
                              >
                                <Upload className='h-3 w-3 mr-1.5' />
                                Upload BAST
                              </Button>
                            </div>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {totalItems > 0 && (
          <div className='flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-neutral-200 bg-neutral-50 text-xs text-neutral-600'>
            <div className='flex items-center gap-2'>
              <span>Menampilkan baris per halaman:</span>
              <Select
                value={perPage.toString()}
                onValueChange={(val) => {
                  setPerPage(Number(val));
                  setPage(1);
                }}
              >
                <SelectTrigger className='h-8 w-16 text-xs bg-white'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='10'>10</SelectItem>
                  <SelectItem value='15'>15</SelectItem>
                  <SelectItem value='25'>25</SelectItem>
                  <SelectItem value='50'>50</SelectItem>
                </SelectContent>
              </Select>
              <span className='text-neutral-400'>
                Total {totalItems} proyek
              </span>
            </div>

            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1 || isLoadingList}
                className='h-8 text-xs bg-white'
              >
                Sebelumnya
              </Button>
              <span className='text-xs font-medium text-neutral-700 px-2'>
                Halaman {page} dari {totalPages}
              </span>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages || isLoadingList}
                className='h-8 text-xs bg-white'
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal Upload / Edit BAST */}
      <Dialog open={isBastModalOpen} onOpenChange={setIsBastModalOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-base font-bold'>
              <FileCheck className='h-5 w-5 text-orange-600' />
              {selectedProject?.basts && selectedProject.basts.length > 0
                ? 'Edit Dokumen BAST'
                : 'Upload Dokumen BAST'}
            </DialogTitle>
            <DialogDescription className='text-xs'>
              Proyek: <strong>{selectedProject?.name}</strong>
              <br />
              No. SPK: <strong>{selectedProject?.spk?.nomor_spk || '-'}</strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveBast} className='space-y-4 py-2 text-xs'>
            {/* Nomor Surat */}
            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold text-neutral-700'>
                Nomor Surat BAST <span className='text-red-500'>*</span>
              </Label>
              <Input
                placeholder='Contoh: 001/DPSA/BAST/X/2026'
                value={bastNoSurat}
                onChange={(e) => setBastNoSurat(e.target.value)}
                className='text-xs h-9'
                required
              />
            </div>

            {/* Tanggal BAST */}
            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold text-neutral-700'>
                Tanggal BAST <span className='text-red-500'>*</span>
              </Label>
              <Input
                type='date'
                value={bastDate}
                onChange={(e) => setBastDate(e.target.value)}
                className='text-xs h-9'
                required
              />
            </div>

            {/* File BAST */}
            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold text-neutral-700'>
                File Dokumen BAST (PDF){' '}
                {selectedProject?.basts && selectedProject.basts.length > 0 && (
                  <span className='text-neutral-400 font-normal'>(Opsional jika tidak ganti)</span>
                )}
                {!selectedProject?.basts || selectedProject.basts.length === 0 ? (
                  <span className='text-red-500'>*</span>
                ) : null}
              </Label>
              <div className='relative group border-2 border-dashed border-neutral-300 rounded-lg p-4 hover:bg-orange-50/50 hover:border-orange-500 transition-colors flex flex-col items-center justify-center text-center'>
                <input
                  type='file'
                  accept='.pdf,application/pdf'
                  className='absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10'
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (file) {
                      const isPdf =
                        file.type === 'application/pdf' ||
                        file.name.toLowerCase().endsWith('.pdf');
                      if (!isPdf) {
                        toast.error('File BAST harus berformat PDF (.pdf)');
                        e.target.value = '';
                        setBastFile(null);
                        return;
                      }
                      setBastFile(file);
                    } else {
                      setBastFile(null);
                    }
                  }}
                />
                <Upload className='h-6 w-6 text-neutral-400 group-hover:text-orange-500 transition-colors mb-1.5' />
                {bastFile ? (
                  <div className='space-y-0.5'>
                    <p className='text-xs font-semibold text-neutral-900 truncate max-w-[260px]'>
                      {bastFile.name}
                    </p>
                    <p className='text-[10px] text-neutral-500'>
                      {(bastFile.size / 1024 / 1024).toFixed(2)} MB (PDF)
                    </p>
                  </div>
                ) : selectedProject?.basts && selectedProject.basts.length > 0 ? (
                  <div className='space-y-0.5'>
                    <p className='text-xs font-semibold text-emerald-600'>
                      File BAST sudah tersimpan
                    </p>
                    <p className='text-[10px] text-neutral-500'>
                      Klik atau drag file PDF baru untuk mengganti
                    </p>
                  </div>
                ) : (
                  <div className='space-y-0.5'>
                    <p className='text-xs font-medium text-neutral-700'>
                      Klik atau drag file PDF ke area ini
                    </p>
                    <p className='text-[10px] text-neutral-400'>
                      Hanya file format PDF (.pdf) maks 15MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className='pt-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => setIsBastModalOpen(false)}
                className='text-xs'
              >
                Batal
              </Button>
              <Button
                type='submit'
                size='sm'
                disabled={uploadBastMutation.isPending}
                className='text-xs bg-orange-600 hover:bg-orange-700 text-white'
              >
                {uploadBastMutation.isPending && (
                  <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' />
                )}
                Simpan BAST
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
