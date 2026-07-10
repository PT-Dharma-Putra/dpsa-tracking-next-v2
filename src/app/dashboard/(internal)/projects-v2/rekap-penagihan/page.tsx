'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  penagihanService,
  Penagihan,
  CreatePenagihanPayload,
} from '@/features/projects/services/penagihan-service';
import { projectV2Service } from '@/features/projects/services/project-v2-service';
const formatRupiah = (value: string | number) => {
  if (value === null || value === undefined || value === '') return '';

  if (typeof value === 'number') {
    const rounded = Math.round(value);
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(rounded);
  }

  if (/^-?\d+(\.\d+)?$/.test(value)) {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      const rounded = Math.round(num);
      return 'Rp ' + new Intl.NumberFormat('id-ID').format(rounded);
    }
  }

  const numberString = value.toString().replace(/[^,\d]/g, '');
  const split = numberString.split(',');
  const sisa = split[0].length % 3;
  let rupiah = split[0].substr(0, sisa);
  const ribuan = split[0].substr(sisa).match(/\d{3}/gi);

  if (ribuan) {
    const separator = sisa ? '.' : '';
    rupiah += separator + ribuan.join('.');
  }

  rupiah = split[1] !== undefined ? rupiah + ',' + split[1] : rupiah;
  return 'Rp ' + rupiah;
};

const parseRawNumber = (value: string) => {
  return value.replace(/[^0-9]/g, '');
};

const parseDatabaseNominal = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;
  const str = value.toString().trim();
  if (/^-?\d+(\.\d+)?$/.test(str)) {
    return parseFloat(str) || 0;
  }
  const cleanStr = str
    .replace(/Rp\s?/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.');
  return parseFloat(cleanStr) || 0;
};
import { format, differenceInDays, startOfDay } from 'date-fns';
import {
  Receipt,
  Download,
  Loader2,
  Pencil,
  Trash2,
  CheckCircle2,
  X,
  Search,
  ArrowUpDown,
} from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const storageBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('/api', '');

export default function RekapPenagihanPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = React.useState('');
  const [sortInvoiceDirection, setSortInvoiceDirection] = React.useState<'asc' | 'desc'>('asc');
  const [filterMonth, setFilterMonth] = React.useState<string>('all');
  const [filterYear, setFilterYear] = React.useState<string>('all');
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Penagihan | null>(null);

  const [isEditingSpkNominal, setIsEditingSpkNominal] = React.useState(false);
  const [spkNominalInput, setSpkNominalInput] = React.useState('');

  const [form, setForm] = React.useState<Partial<CreatePenagihanPayload>>({
    termin_id: undefined,
    nomor_invoice: '',
    deskripsi: '',
    persentase: 0,
    nominal_penagihan: '',
    take_out: '',
    tanggal_kirim: '',
    tanggal_invoice: '',
    jatuh_tempo: '',
    status: 'Belum Bayar',
    tanggal_dibayar: '',
    nominal_dibayar: 0,
  });

  const { data: penagihanList = [], isLoading: isLoadingPenagihan } = useQuery({
    queryKey: ['penagihan-all'],
    queryFn: () => penagihanService.getAllPenagihan(),
  });

  const { data: terminList = [], isLoading: isLoadingTermin } = useQuery({
    queryKey: ['termin-all'],
    queryFn: () => penagihanService.getTermin(),
  });

  const updatePenagihanMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CreatePenagihanPayload> }) =>
      penagihanService.updatePenagihan(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['penagihan-all'] });
      toast.success('Penagihan berhasil diperbarui');
      closeForm();
    },
    onError: () => toast.error('Gagal memperbarui penagihan'),
  });

  const deletePenagihanMutation = useMutation({
    mutationFn: (id: number) => penagihanService.deletePenagihan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['penagihan-all'] });
      toast.success('Penagihan berhasil dihapus');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Gagal menghapus penagihan'),
  });

  const editingPenagihan = penagihanList.find(p => p.id === editingId);

  const updateSpkNominalMutation = useMutation({
    mutationFn: ({
      nominal,
      nomor_spk,
    }: {
      nominal: string;
      nomor_spk: string;
    }) => {
       if (!editingPenagihan?.project_id) throw new Error('No project');
       return projectV2Service.updateSpkMeta(editingPenagihan.project_id, { nomor_spk, grand_total: nominal })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['penagihan-all'] });
      toast.success('Nominal SPK berhasil diperbarui');
      setIsEditingSpkNominal(false);
      setSpkNominalInput('');
    },
    onError: () => toast.error('Gagal memperbarui nominal SPK'),
  });

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm({
      termin_id: undefined,
      nomor_invoice: '',
      deskripsi: '',
      persentase: 0,
      nominal_penagihan: '',
      take_out: '',
      tanggal_kirim: '',
      tanggal_invoice: '',
      jatuh_tempo: '',
      status: 'Belum Bayar',
      tanggal_dibayar: '',
      nominal_dibayar: 0,
    });
  };

  const openEdit = (p: Penagihan) => {
    setEditingId(p.id);
    setForm({
      project_id: p.project_id,
      termin_id: p.termin_id,
      nomor_invoice: p.nomor_invoice || '',
      deskripsi: p.deskripsi || '',
      persentase: p.persentase,
      nominal_penagihan: p.nominal_penagihan ? formatRupiah(p.nominal_penagihan) : '',
      take_out: p.take_out ? formatRupiah(p.take_out) : '',
      tanggal_kirim: p.tanggal_kirim || '',
      tanggal_invoice: p.tanggal_invoice || '',
      jatuh_tempo: p.jatuh_tempo || '',
      status: p.status,
      tanggal_dibayar: p.tanggal_dibayar || '',
      nominal_dibayar: p.nominal_dibayar ? Number(p.nominal_dibayar) : 0,
    });
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (!form.termin_id) {
      toast.error('Pilih termin terlebih dahulu');
      return;
    }
    const payload: Partial<CreatePenagihanPayload> = {
      ...form,
      nominal_penagihan: parseRawNumber(form.nominal_penagihan as string) || undefined,
      take_out: parseRawNumber(form.take_out as string) || undefined,
    };

    if (editingId) {
      updatePenagihanMutation.mutate({ id: editingId, payload });
    }
  };

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case 'Lunas':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Sebagian Dibayar':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Belum Bayar':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-neutral-100 text-neutral-600 border-neutral-200';
    }
  };

  // Filter based on search
  const filteredPenagihans = penagihanList
    .filter((p) => {
      const searchLower = search.toLowerCase();
      const projectName = (p.project?.name || '').toLowerCase();
      const clientName = (p.project?.client?.name || '').toLowerCase();
      const spk = (p.project?.spk?.nomor_spk || '').toLowerCase();
      const invoice = (p.nomor_invoice || '').toLowerCase();
      const deskripsi = (p.deskripsi || '').toLowerCase();
      
      const matchesSearch = projectName.includes(searchLower) || clientName.includes(searchLower) || spk.includes(searchLower) || invoice.includes(searchLower) || deskripsi.includes(searchLower);

      let matchesMonth = true;
      let matchesYear = true;

      if (filterMonth !== 'all' || filterYear !== 'all') {
        const invDateStr = p.tanggal_invoice;
        if (!invDateStr) {
          matchesMonth = filterMonth === 'all';
          matchesYear = filterYear === 'all';
        } else {
          const invDate = new Date(invDateStr);
          if (filterMonth !== 'all') {
            matchesMonth = (invDate.getMonth() + 1).toString() === filterMonth;
          }
          if (filterYear !== 'all') {
            matchesYear = invDate.getFullYear().toString() === filterYear;
          }
        }
      }

      return matchesSearch && matchesMonth && matchesYear;
    })
    .sort((a, b) => {
      const getNum = (inv: string | null | undefined) => {
        if (!inv) return Number.MAX_SAFE_INTEGER;
        const match = inv.match(/^(\d+)/);
        return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
      };
      const diff = getNum(a.nomor_invoice) - getNum(b.nomor_invoice);
      return sortInvoiceDirection === 'asc' ? diff : -diff;
    });

  return (
    <div className='p-6 max-w-[1600px] mx-auto space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight text-neutral-900'>
            Rekap Penagihan
          </h1>
          <p className='text-sm text-neutral-500'>
            Daftar seluruh penagihan dari semua proyek
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-[140px] bg-white">
              <SelectValue placeholder="Semua Bulan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Bulan</SelectItem>
              <SelectItem value="1">Januari</SelectItem>
              <SelectItem value="2">Februari</SelectItem>
              <SelectItem value="3">Maret</SelectItem>
              <SelectItem value="4">April</SelectItem>
              <SelectItem value="5">Mei</SelectItem>
              <SelectItem value="6">Juni</SelectItem>
              <SelectItem value="7">Juli</SelectItem>
              <SelectItem value="8">Agustus</SelectItem>
              <SelectItem value="9">September</SelectItem>
              <SelectItem value="10">Oktober</SelectItem>
              <SelectItem value="11">November</SelectItem>
              <SelectItem value="12">Desember</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-[120px] bg-white">
              <SelectValue placeholder="Semua Tahun" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tahun</SelectItem>
              {[0, 1, 2, 3].map((offset) => {
                const year = new Date().getFullYear() - offset;
                return (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <div className='relative w-64'>
            <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500' />
            <Input
              placeholder='Cari penagihan...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-9 bg-white'
            />
          </div>
        </div>
      </div>

      <div className='rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm'>
        <div className='overflow-x-auto max-w-full'>
          <Table>
            <TableHeader className='bg-neutral-50/80'>
              <TableRow>
                <TableHead className='w-[50px]'>No</TableHead>
                <TableHead 
                  className='cursor-pointer hover:bg-neutral-200/50 transition-colors'
                  onClick={() => setSortInvoiceDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                >
                  <div className='flex items-center gap-2'>
                    NO INVOICE
                    <ArrowUpDown className='h-3 w-3 text-neutral-400' />
                  </div>
                </TableHead>
                <TableHead>TGL INVOICE</TableHead>
                <TableHead>CLIENT</TableHead>
                <TableHead>TERMIN</TableHead>
                <TableHead>DESKRIPSI</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>PERSENTASE</TableHead>
                <TableHead>NOMINAL</TableHead>
                <TableHead>NO SPK</TableHead>
                {/* <TableHead>TAKE OUT</TableHead> */}
                <TableHead>JATUH TEMPO</TableHead>
                <TableHead>TGL DIBAYAR</TableHead>
                <TableHead>UMUR PENAGIHAN</TableHead>
                <TableHead>FILE</TableHead>
                <TableHead className='text-right'>AKSI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingPenagihan ? (
                <TableRow>
                  <TableCell colSpan={12} className='h-32 text-center'>
                    <Loader2 className='h-6 w-6 animate-spin mx-auto text-neutral-400' />
                  </TableCell>
                </TableRow>
              ) : filteredPenagihans.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={12}
                    className='h-32 text-center text-muted-foreground'
                  >
                    Belum ada data penagihan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPenagihans.map((item, index) => (
                  <TableRow
                    key={item.id}
                    className='hover:bg-neutral-50/50 transition-colors'
                  >
                    <TableCell className='text-muted-foreground font-medium'>
                      {index + 1}
                    </TableCell>
                    <TableCell className='text-sm font-medium text-neutral-700 whitespace-nowrap'>
                      {item.nomor_invoice || '-'}
                    </TableCell>
                    <TableCell className='text-sm font-medium text-neutral-700 whitespace-nowrap'>
                      {item.tanggal_invoice
                        ? format(new Date(item.tanggal_invoice), 'dd MMM yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell className='text-sm font-medium text-neutral-700 whitespace-nowrap'>
                      {item.project?.client?.name || '-'}
                    </TableCell>
                    <TableCell className='font-semibold'>
                      {item.termin?.nama || '-'}
                    </TableCell>
                    <TableCell className='text-sm text-neutral-600 max-w-[200px] truncate'>
                      {item.deskripsi || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant='outline'
                        className={statusBadgeClass(item.status)}
                      >
                        {item.status}
                      </Badge>
                      {item.status === 'Sebagian Dibayar' &&
                        item.nominal_dibayar && (
                          <div className='text-[10px] text-neutral-500 mt-1'>
                            Rp{' '}
                            {Number(item.nominal_dibayar).toLocaleString(
                              'id-ID'
                            )}
                          </div>
                        )}
                    </TableCell>
                    <TableCell className='font-bold text-blue-600'>
                      {item.persentase}%
                    </TableCell>
                    <TableCell className='font-semibold text-emerald-700'>
                      {item.nominal_penagihan
                        ? formatRupiah(item.nominal_penagihan)
                        : '-'}
                    </TableCell>
                    <TableCell className='text-sm font-medium text-neutral-700 whitespace-nowrap max-w-[100px] truncate'>
                      {item.project?.spk?.nomor_spk || '-'}
                    </TableCell>
                    {/* <TableCell className='font-semibold text-amber-700'>
                      {item.take_out ? formatRupiah(item.take_out) : '-'}
                    </TableCell> */}
                    <TableCell className='text-sm'>
                      {item.jatuh_tempo
                        ? format(new Date(item.jatuh_tempo), 'dd MMM yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell className='text-sm'>
                      {item.tanggal_dibayar
                        ? format(new Date(item.tanggal_dibayar), 'dd MMM yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell className='text-sm'>
                      {item.tanggal_invoice && item.status !== 'Lunas' ? (
                        (() => {
                          const diff = differenceInDays(
                            startOfDay(new Date()),
                            startOfDay(new Date(item.tanggal_invoice))
                          );
                          return (
                            <Badge
                              variant='outline'
                              className='font-bold bg-neutral-50 text-neutral-700 border-neutral-200 whitespace-nowrap'
                            >
                              {diff} Hari
                            </Badge>
                          );
                        })()
                      ) : (
                        <span className='text-muted-foreground italic text-xs'>
                          -
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.file ? (
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-7 w-7 text-blue-600'
                          asChild
                        >
                          <a
                            href={`${storageBase}/storage/${item.file}`}
                            target='_blank'
                            rel='noopener noreferrer'
                          >
                            <Download className='h-3.5 w-3.5' />
                          </a>
                        </Button>
                      ) : (
                        <span className='text-[10px] text-muted-foreground italic'>
                          -
                        </span>
                      )}
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex justify-end gap-1'>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-neutral-500 hover:text-blue-600'
                          onClick={() => openEdit(item)}
                        >
                          <Pencil className='h-3.5 w-3.5' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-neutral-500 hover:text-red-600'
                          onClick={() => setDeleteTarget(item)}
                        >
                          <Trash2 className='h-3.5 w-3.5' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Form Dialog */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) closeForm();
        }}
      >
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>Edit Penagihan</DialogTitle>
            <DialogDescription>
              Perbarui status penagihan
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-2 max-h-[70vh] overflow-y-auto px-1'>
            {/* Termin */}
            <div className='space-y-2'>
              <Label>
                Termin <span className='text-red-500'>*</span>
              </Label>
              {isLoadingTermin ? (
                <div className='h-9 w-full bg-neutral-100 animate-pulse rounded-md' />
              ) : (
                <Tabs
                  value={form.termin_id ? form.termin_id.toString() : ''}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, termin_id: parseInt(v) }))
                  }
                  className='w-full'
                >
                  <TabsList className='w-full flex-wrap h-auto p-1 bg-neutral-100/50'>
                    {terminList.map((t) => (
                      <TabsTrigger
                        key={t.id}
                        value={t.id.toString()}
                        className='flex-1 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm'
                      >
                        {t.nama}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              )}
            </div>

            {/* No Invoice */}
            <div className='space-y-2'>
              <Label htmlFor='nomor_invoice'>No Invoice</Label>
              <Input
                id='nomor_invoice'
                type='text'
                placeholder='Masukkan nomor invoice...'
                value={form.nomor_invoice || ''}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    nomor_invoice: e.target.value,
                  }))
                }
              />
            </div>

            {/* Deskripsi */}
            <div className='space-y-2'>
              <Label htmlFor='deskripsi'>Deskripsi</Label>
              <Input
                id='deskripsi'
                type='text'
                placeholder='Masukkan deskripsi penagihan...'
                value={form.deskripsi || ''}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, deskripsi: e.target.value }))
                }
              />
            </div>

            {/* Nominal SPK */}
            <div className='space-y-2'>
              <Label htmlFor='nominal_spk'>Nominal SPK</Label>
              {editingPenagihan?.project?.spk?.nominal ? (
                <Input
                  id='nominal_spk'
                  type='text'
                  readOnly
                  disabled
                  value={formatRupiah(editingPenagihan.project.spk.nominal)}
                  className='bg-neutral-50 text-neutral-500 cursor-not-allowed'
                />
              ) : !editingPenagihan?.project?.spk ? (
                <Input
                  id='nominal_spk'
                  type='text'
                  readOnly
                  disabled
                  value=''
                  placeholder='Belum ada data SPK'
                  className='bg-neutral-50 text-neutral-500 cursor-not-allowed'
                />
              ) : isEditingSpkNominal ? (
                <div className='flex gap-2'>
                  <Input
                    id='nominal_spk'
                    type='text'
                    autoFocus
                    placeholder='Masukkan nominal SPK...'
                    value={spkNominalInput}
                    onChange={(e) =>
                      setSpkNominalInput(formatRupiah(e.target.value))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setIsEditingSpkNominal(false);
                        setSpkNominalInput('');
                      }
                    }}
                  />
                  <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    disabled={updateSpkNominalMutation.isPending}
                    onClick={() => {
                      const raw = parseRawNumber(spkNominalInput);
                      if (!raw) {
                        toast.error('Masukkan nominal yang valid');
                        return;
                      }
                      updateSpkNominalMutation.mutate({
                        nominal: raw,
                        nomor_spk: editingPenagihan?.project?.spk?.nomor_spk || '',
                      });
                    }}
                  >
                    {updateSpkNominalMutation.isPending ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      <CheckCircle2 className='h-4 w-4 text-emerald-600' />
                    )}
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    onClick={() => {
                      setIsEditingSpkNominal(false);
                      setSpkNominalInput('');
                    }}
                  >
                    <X className='h-4 w-4' />
                  </Button>
                </div>
              ) : (
                <div className='flex gap-2'>
                  <Input
                    id='nominal_spk'
                    type='text'
                    readOnly
                    disabled
                    value=''
                    placeholder='Belum ada nominal SPK'
                    className='bg-neutral-50 text-neutral-500 cursor-not-allowed'
                  />
                  <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    onClick={() => {
                      setSpkNominalInput('');
                      setIsEditingSpkNominal(true);
                    }}
                  >
                    <Pencil className='h-4 w-4' />
                  </Button>
                </div>
              )}
            </div>

            <div className='grid grid-cols-3 gap-4'>
              {/* Persentase */}
              <div className='space-y-2'>
                <Label>Persentase (%)</Label>
                <Input
                  type='number'
                  min={0}
                  max={100}
                  value={form.persentase || ''}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const pct = Math.min(parseFloat(e.target.value) || 0, 100);
                    const spkNominal = editingPenagihan?.project?.spk?.nominal
                      ? parseDatabaseNominal(editingPenagihan.project.spk.nominal)
                      : 0;
                    const calculated = (pct / 100) * spkNominal;
                    const rawTakeOut = parseRawNumber(form.take_out || '');
                    const takeOutVal = parseFloat(rawTakeOut) || 0;
                    const finalNominal = Math.max(calculated - takeOutVal, 0);
                    setForm((prev) => ({
                      ...prev,
                      persentase: pct,
                      nominal_penagihan:
                        finalNominal > 0 ? formatRupiah(finalNominal) : '',
                    }));
                  }}
                />
              </div>

              {/* Nominal */}
              <div className='space-y-2'>
                <Label>Nominal Tagihan</Label>
                <Input
                  type='text'
                  placeholder='Rp 0'
                  value={form.nominal_penagihan || ''}
                  onChange={(e) => {
                    const formatted = formatRupiah(e.target.value);
                    const rawNominal = parseRawNumber(e.target.value);
                    const nominalVal = parseFloat(rawNominal) || 0;

                    const rawTakeOut = parseRawNumber(form.take_out || '');
                    const takeOutVal = parseFloat(rawTakeOut) || 0;

                    const spkNominal = editingPenagihan?.project?.spk?.nominal
                      ? parseDatabaseNominal(editingPenagihan.project.spk.nominal)
                      : 0;
                    const pct =
                      spkNominal > 0
                        ? Math.round(
                            ((nominalVal + takeOutVal) / spkNominal) * 100 * 100
                          ) / 100
                        : 0;
                    setForm((prev) => ({
                      ...prev,
                      nominal_penagihan: formatted,
                      persentase: pct,
                    }));
                  }}
                />
              </div>

              {/* Take Out */}
              <div className='space-y-2'>
                <Label>Take Out</Label>
                <Input
                  type='text'
                  placeholder='Rp 0'
                  value={form.take_out || ''}
                  onChange={(e) => {
                    const formatted = formatRupiah(e.target.value);
                    const rawTakeOut = parseRawNumber(e.target.value);
                    const takeOutVal = parseFloat(rawTakeOut) || 0;

                    const spkNominal = editingPenagihan?.project?.spk?.nominal
                      ? parseDatabaseNominal(editingPenagihan.project.spk.nominal)
                      : 0;
                    const baseNominal = ((form.persentase || 0) / 100) * spkNominal;
                    const finalNominal = Math.max(baseNominal - takeOutVal, 0);
                    setForm((prev) => ({
                      ...prev,
                      take_out: formatted,
                      nominal_penagihan:
                        finalNominal > 0 ? formatRupiah(finalNominal) : '',
                    }));
                  }}
                />
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Tanggal Invoice</Label>
                <Input
                  type='date'
                  value={
                    form.tanggal_invoice
                      ? format(new Date(form.tanggal_invoice), 'yyyy-MM-dd')
                      : ''
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    const due = val
                      ? new Date(
                          new Date(val).getTime() + 30 * 24 * 60 * 60 * 1000
                        )
                          .toISOString()
                          .slice(0, 10)
                      : '';
                    setForm((prev) => ({
                      ...prev,
                      tanggal_invoice: val,
                      jatuh_tempo: due,
                    }));
                  }}
                />
              </div>
              <div className='space-y-2'>
                <Label>Jatuh Tempo</Label>
                <Input
                  type='date'
                  value={
                    form.jatuh_tempo
                      ? format(new Date(form.jatuh_tempo), 'yyyy-MM-dd')
                      : ''
                  }
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      jatuh_tempo: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label>File Scan / Bukti (Opsional)</Label>
              <Input
                type='file'
                accept='.pdf,.jpg,.jpeg,.png,.doc,.docx'
                className='cursor-pointer text-xs'
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setForm((prev) => ({ ...prev, file }));
                  }
                }}
              />
            </div>

            <div className='space-y-2 pt-2 border-t border-neutral-100'>
              <Label className='font-bold'>Status Pembayaran</Label>
              <Select
                value={form.status}
                onValueChange={(
                  v: 'Belum Bayar' | 'Sebagian Dibayar' | 'Lunas'
                ) => setForm((prev) => ({ ...prev, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Pilih Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Belum Bayar'>Belum Bayar</SelectItem>
                  <SelectItem value='Sebagian Dibayar'>
                    Sebagian Dibayar
                  </SelectItem>
                  <SelectItem value='Lunas'>Lunas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.status !== 'Belum Bayar' && (
              <div className='grid grid-cols-2 gap-4 bg-blue-50/50 p-3 rounded-lg border border-blue-100'>
                <div className='space-y-2'>
                  <Label>Tanggal Dibayar</Label>
                  <Input
                    type='date'
                    value={
                      form.tanggal_dibayar
                        ? format(new Date(form.tanggal_dibayar), 'yyyy-MM-dd')
                        : ''
                    }
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        tanggal_dibayar: e.target.value,
                      }))
                    }
                  />
                </div>
                {form.status === 'Sebagian Dibayar' && (
                  <div className='space-y-2'>
                    <Label>Nominal Dibayar</Label>
                    <Input
                      type='text'
                      placeholder='Rp 0'
                      value={
                        form.nominal_dibayar
                          ? formatRupiah(form.nominal_dibayar.toString())
                          : ''
                      }
                      onChange={(e) => {
                        const raw = parseRawNumber(e.target.value);
                        setForm((prev) => ({
                          ...prev,
                          nominal_dibayar: parseFloat(raw) || 0,
                        }));
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className='pt-4'>
            <Button variant='outline' onClick={closeForm}>
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={updatePenagihanMutation.isPending}
              className='bg-blue-600 hover:bg-blue-700'
            >
              {updatePenagihanMutation.isPending && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Penagihan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus penagihan{' '}
              <span className='font-bold text-neutral-800'>
                {deleteTarget?.termin?.nama} - {deleteTarget?.nomor_invoice}
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className='bg-red-600 hover:bg-red-700 focus:ring-red-600'
              onClick={() => {
                if (deleteTarget) {
                  deletePenagihanMutation.mutate(deleteTarget.id);
                }
              }}
              disabled={deletePenagihanMutation.isPending}
            >
              {deletePenagihanMutation.isPending ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                'Hapus'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
