'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  ArrowLeft,
  FileText,
  Plus,
  Pencil,
  Trash2,
  Download,
  Receipt,
  X,
  CheckCircle2,
  Building2,
  Info,
  ChevronDown,
  Eye,
  Truck,
} from 'lucide-react';
import { format, differenceInDays, startOfDay } from 'date-fns';
import { Progress } from '@/components/ui/progress';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

import { projectV2Service } from '@/features/projects/services/project-v2-service';
import {
  penagihanService,
  Penagihan,
  CreatePenagihanPayload,
} from '@/features/projects/services/penagihan-service';
import { PengirimanService } from '@/features/pengiriman/services/pengiriman-service';

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

const STATUS_OPTIONS = ['Belum Bayar', 'Sebagian Dibayar', 'Lunas'] as const;

const statusBadgeClass = (status: string) => {
  if (status === 'Lunas')
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'Sebagian Dibayar')
    return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-red-50 text-red-700 border-red-200';
};

const emptyForm = {
  termin_id: 0,
  persentase: 0,
  nomor_invoice: '',
  deskripsi: '',
  nominal_penagihan: '',
  take_out: '',
  tanggal_kirim: '',
  tanggal_invoice: '',
  jatuh_tempo: '',
  status: 'Belum Bayar' as 'Belum Bayar' | 'Sebagian Dibayar' | 'Lunas',
  tanggal_dibayar: '',
  nominal_dibayar: 0,
  file: undefined as File | undefined,
};

export default function PiutangDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = parseInt(params.id as string);

  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ['projects-v2', projectId],
    queryFn: () => projectV2Service.getProject(projectId),
  });

  const { data: penagihanList = [], isLoading: isLoadingPenagihan } = useQuery({
    queryKey: ['penagihan', projectId],
    queryFn: () => penagihanService.getPenagihanByProject(projectId),
  });

  const { data: terminList = [], isLoading: isLoadingTermin } = useQuery({
    queryKey: ['termin'],
    queryFn: () => penagihanService.getTermin(),
  });

  const spkId = project?.spk?.id;

  const { data: pengirimanPerSpkData } = useQuery({
    queryKey: ['pengiriman-per-spk', spkId],
    queryFn: () =>
      PengirimanService.getPengiriman({ spk_id: spkId, per_page: 100 }),
    enabled: !!spkId,
  });

  // Form state
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [form, setForm] = React.useState(emptyForm);
  const [fileInput, setFileInput] = React.useState<File | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = React.useState<Penagihan | null>(
    null
  );

  // Termin management
  const [isTerminOpen, setIsTerminOpen] = React.useState(false);
  const [newTerminName, setNewTerminName] = React.useState('');

  // SPK Nominal inline edit
  const [isEditingSpkNominal, setIsEditingSpkNominal] = React.useState(false);
  const [spkNominalInput, setSpkNominalInput] = React.useState('');

  // Collapsing states
  const [isBilledCollapsed, setIsBilledCollapsed] = React.useState(false);
  const [isPaymentCollapsed, setIsPaymentCollapsed] = React.useState(false);
  const [isShipCollapsed, setIsShipCollapsed] = React.useState(false);
  const [editingTermin, setEditingTermin] = React.useState<{
    id: number;
    nama: string;
  } | null>(null);
  const [deleteTerminTarget, setDeleteTerminTarget] = React.useState<{
    id: number;
    nama: string;
  } | null>(null);

  const usedTerminIds = React.useMemo(() => {
    return penagihanList
      .filter((p) => editingId === null || p.id !== editingId)
      .map((p) => p.termin_id);
  }, [penagihanList, editingId]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreatePenagihanPayload) =>
      penagihanService.createPenagihan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['penagihan', projectId] });
      toast.success('Penagihan berhasil ditambahkan');
      closeForm();
    },
    onError: () => toast.error('Gagal menambahkan penagihan'),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<CreatePenagihanPayload>;
    }) => penagihanService.updatePenagihan(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['penagihan', projectId] });
      toast.success('Penagihan berhasil diperbarui');
      closeForm();
    },
    onError: () => toast.error('Gagal memperbarui penagihan'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => penagihanService.deletePenagihan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['penagihan', projectId] });
      toast.success('Penagihan berhasil dihapus');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Gagal menghapus penagihan'),
  });

  const createTerminMutation = useMutation({
    mutationFn: (nama: string) => penagihanService.createTermin(nama),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['termin'] });
      toast.success('Termin berhasil ditambahkan');
      setNewTerminName('');
    },
    onError: () => toast.error('Gagal menambahkan termin'),
  });

  const updateTerminMutation = useMutation({
    mutationFn: ({ id, nama }: { id: number; nama: string }) =>
      penagihanService.updateTermin(id, nama),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['termin'] });
      toast.success('Termin berhasil diperbarui');
      setEditingTermin(null);
    },
    onError: () => toast.error('Gagal memperbarui termin'),
  });

  const deleteTerminMutation = useMutation({
    mutationFn: (id: number) => penagihanService.deleteTermin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['termin'] });
      toast.success('Termin berhasil dihapus');
      setDeleteTerminTarget(null);
    },
    onError: () => toast.error('Gagal menghapus termin'),
  });

  const updateSpkNominalMutation = useMutation({
    mutationFn: ({
      nominal,
      nomor_spk,
    }: {
      nominal: string;
      nomor_spk: string;
    }) =>
      projectV2Service.updateSpkMeta(projectId, { nomor_spk, grand_total: nominal }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-v2', projectId] });
      toast.success('Nominal SPK berhasil diperbarui');
      setIsEditingSpkNominal(false);
      setSpkNominalInput('');
    },
    onError: () => toast.error('Gagal memperbarui nominal SPK'),
  });

  const openCreate = () => {
    setEditingId(null);
    const currentUsedIds = penagihanList.map((p) => p.termin_id);
    const nextAvailableTermin = terminList.find((t) => !currentUsedIds.includes(t.id));
    setForm({
      ...emptyForm,
      termin_id: nextAvailableTermin ? nextAvailableTermin.id : (terminList[0]?.id || 0),
    });
    setFileInput(null);
    setFileError(null);
    setIsFormOpen(true);
  };

  const openEdit = (p: Penagihan) => {
    setEditingId(p.id);
    setForm({
      termin_id: p.termin_id,
      persentase: p.persentase,
      nomor_invoice: p.nomor_invoice || '',
      deskripsi: p.deskripsi || '',
      nominal_penagihan: p.nominal_penagihan
        ? formatRupiah(p.nominal_penagihan)
        : '',
      take_out: p.take_out ? formatRupiah(p.take_out) : '',
      tanggal_kirim: p.tanggal_kirim || '',
      tanggal_invoice: p.tanggal_invoice || '',
      jatuh_tempo: p.jatuh_tempo || '',
      status: p.status,
      tanggal_dibayar: p.tanggal_dibayar || '',
      nominal_dibayar: Number(p.nominal_dibayar) || 0,
      file: undefined,
    });
    setFileInput(null);
    setFileError(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setFileInput(null);
    setFileError(null);
    setIsEditingSpkNominal(false);
    setSpkNominalInput('');
  };

  const handleSubmit = () => {
    if (!form.termin_id || form.termin_id === 0) {
      toast.error('Pilih termin terlebih dahulu');
      return;
    }

    const payload: CreatePenagihanPayload = {
      project_id: projectId,
      termin_id: form.termin_id,
      persentase: form.persentase,
      nomor_invoice: form.nomor_invoice || undefined,
      deskripsi: form.deskripsi || undefined,
      nominal_penagihan: parseRawNumber(form.nominal_penagihan) || undefined,
      take_out: parseRawNumber(form.take_out) || undefined,
      status: form.status,
      tanggal_kirim: form.tanggal_kirim || undefined,
      tanggal_invoice: form.tanggal_invoice || undefined,
      jatuh_tempo: form.jatuh_tempo || undefined,
      tanggal_dibayar: form.tanggal_dibayar || undefined,
      nominal_dibayar:
        form.status === 'Sebagian Dibayar' ? form.nominal_dibayar : undefined,
      file: fileInput || undefined,
    };

    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const storageBase = (
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  ).replace('/api', '');

  if (isLoadingProject) {
    return (
      <div className='flex h-[400px] items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-neutral-400' />
      </div>
    );
  }

  if (!project) {
    return (
      <div className='p-8 text-center text-muted-foreground'>
        Project not found.
      </div>
    );
  }

  const spkNominal = project?.spk?.nominal
    ? parseDatabaseNominal(project.spk.nominal)
    : 0;

  // Calculate actual billed amount
  const totalBilledAmount = penagihanList.reduce((sum, p) => {
    const nominalVal = p.nominal_penagihan
      ? parseDatabaseNominal(p.nominal_penagihan)
      : (Number(p.persentase || 0) / 100) * spkNominal;
    return sum + nominalVal;
  }, 0);

  // Calculate actual paid amount
  const totalPaidAmount = penagihanList.reduce((sum, p) => {
    const nominalVal = p.nominal_penagihan
      ? parseDatabaseNominal(p.nominal_penagihan)
      : (Number(p.persentase || 0) / 100) * spkNominal;
    if (p.status === 'Lunas') {
      return sum + nominalVal;
    } else if (p.status === 'Sebagian Dibayar') {
      const paidVal = p.nominal_dibayar
        ? parseDatabaseNominal(p.nominal_dibayar)
        : 0;
      return sum + paidVal;
    }
    return sum;
  }, 0);

  const totalBilledPercent = penagihanList.reduce(
    (sum, p) => sum + Number(p.persentase || 0),
    0
  );
  const totalPaidPercent =
    spkNominal > 0 ? (totalPaidAmount / spkNominal) * 100 : 0;

  const flowSteps = [
    {
      id: 1,
      title: 'Progress Penagihan',
      description: 'Billed Progress',
      isCompleted: totalBilledPercent >= 100,
      isActive: true,
      icon: Receipt,
      color: 'text-orange-600',
      bgColor: 'bg-orange-500',
      lightBg: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
    {
      id: 2,
      title: 'Progress Pembayaran',
      description: 'Payment Progress',
      isCompleted: totalPaidPercent >= 100 && totalBilledPercent > 0,
      isActive: totalBilledPercent > 0,
      icon: CheckCircle2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500',
      lightBg: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
  ];

  return (
    <div className='flex flex-col gap-6 p-6 max-w-[1600px] mx-auto w-full'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
        <div className='flex items-start gap-4 shrink-0'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => router.back()}
            className='rounded-full hover:bg-neutral-100 mt-0.5'
          >
            <ArrowLeft className='h-5 w-5' />
          </Button>
          <div className='space-y-1.5'>
            <div>
              <h1 className='text-2xl font-bold tracking-tight text-neutral-900'>
                {project.name}
              </h1>
              <p className='text-xs text-muted-foreground'>
                Piutang & Penagihan View
              </p>
            </div>
            <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
              {project.client?.name && (
                <span className='flex items-center gap-1 text-xs text-neutral-600'>
                  <Building2 className='h-3 w-3 text-neutral-400' />
                  {project.client.name}
                </span>
              )}
              {(project.spk_number || project.spk?.nomor_spk) && (
                <span className='flex items-center gap-1 text-xs text-neutral-600'>
                  <FileText className='h-3 w-3 text-neutral-400' />
                  {project.spk_number || project.spk?.nomor_spk}
                </span>
              )}
              {project.spk?.nominal && (
                <span className='flex items-center gap-1 text-xs text-neutral-600 font-bold'>
                  <Receipt className='h-3 w-3 text-neutral-400' />
                  Nominal SPK: {formatRupiah(project.spk.nominal)}
                </span>
              )}
              {project.spk?.created_at && (
                <span className='flex items-center gap-1 text-xs text-neutral-600'>
                  <Info className='h-3 w-3 text-neutral-400' />
                  SPK Date:{' '}
                  {format(new Date(project.spk.created_at), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stepper Progress */}
        <div className='ml-auto overflow-x-auto hide-scrollbar shrink-0'>
          <div className='flex items-center gap-1 min-w-max'>
            {flowSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={step.id}>
                  <div
                    className={`flex items-center gap-1.5 transition-all duration-300 ${
                      step.isActive ? 'opacity-100' : 'opacity-40 grayscale'
                    }`}
                  >
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center border shadow-sm transition-all duration-500 shrink-0 ${
                        step.isCompleted
                          ? step.bgColor + ' border-transparent text-white'
                          : step.isActive
                          ? step.lightBg +
                            ' ' +
                            step.borderColor +
                            ' ' +
                            step.color
                          : 'bg-neutral-100 border-neutral-200 text-neutral-400'
                      }`}
                    >
                      {step.isCompleted ? (
                        <CheckCircle2 className='h-3 w-3' />
                      ) : (
                        <Icon className='h-3 w-3' />
                      )}
                    </div>
                    <div className='flex flex-col leading-none'>
                      <span
                        className={`text-[10px] font-bold whitespace-nowrap ${
                          step.isCompleted || step.isActive
                            ? 'text-neutral-800'
                            : 'text-neutral-400'
                        }`}
                      >
                        {step.title}
                      </span>
                    </div>
                  </div>
                  {index < flowSteps.length - 1 && (
                    <div className='w-6 h-[2px] rounded-full bg-neutral-200 overflow-hidden relative mx-0.5 shrink-0'>
                      <div
                        className={`absolute top-0 left-0 h-full w-full transition-transform duration-700 origin-left ${
                          step.isCompleted
                            ? step.bgColor + ' scale-x-100'
                            : 'scale-x-0'
                        }`}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Document Section at Top */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 w-full'>
        {/* Card Pengiriman */}
        <Card className='border border-neutral-200 shadow-sm bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md'>
          <CardHeader className='pb-2 flex flex-row items-center justify-between gap-3 min-w-0'>
            <button
              className='flex items-center gap-3 flex-1 text-left min-w-0'
              onClick={() => setIsShipCollapsed(!isShipCollapsed)}
            >
              <div className='h-8 w-8 rounded-full flex items-center justify-center bg-violet-100 text-violet-600 shrink-0'>
                <Truck className='h-4 w-4' />
              </div>
              <div className='flex-1 min-w-0'>
                <CardTitle className='text-sm text-neutral-800 font-bold truncate'>
                  Pengiriman
                </CardTitle>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wider font-semibold truncate'>
                  Logistics
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
                  isShipCollapsed ? '-rotate-90' : ''
                }`}
              />
            </button>
          </CardHeader>
          {!isShipCollapsed && (
            <CardContent className='pt-0'>
              <div className='border-t border-neutral-100 pt-2.5 space-y-3'>
                {/* Progress Bar Pengiriman */}
                <div className='space-y-1.5'>
                  <div className='flex justify-between items-center'>
                    <p className='text-[10px] font-bold text-neutral-500 uppercase tracking-wider'>
                      Progres Pengiriman
                    </p>
                    <p className='text-[10px] font-bold text-violet-600'>
                      {Math.round(project.progres_kerja?.pengiriman || 0)}%
                    </p>
                  </div>
                  <div className='h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden'>
                    <div
                      className='h-full bg-violet-600 transition-all duration-500'
                      style={{
                        width: `${Math.min(
                          Math.round(project.progres_kerja?.pengiriman || 0),
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* List pengiriman per SPK */}
                {pengirimanPerSpkData &&
                pengirimanPerSpkData.data.length > 0 ? (
                  <div className='space-y-1.5 pt-1 border-t border-neutral-100 max-h-[180px] overflow-y-auto pr-1'>
                    {[...pengirimanPerSpkData.data]
                      .sort(
                        (a, b) =>
                          new Date(a.tanggal).getTime() -
                          new Date(b.tanggal).getTime()
                      )
                      .map((p) => {
                        const totalKeluar =
                          p.details?.reduce(
                            (s, d) => s + Number(d.jumlah_keluar),
                            0
                          ) ?? 0;
                        const totalTersetting =
                          p.details?.reduce(
                            (s, d) => s + Number(d.jumlah_tersetting),
                            0
                          ) ?? 0;
                        return (
                          <div
                            key={p.id}
                            className='p-2 rounded-md bg-violet-50/60 border border-violet-100 space-y-1'
                          >
                            <div className='flex items-center justify-between gap-1'>
                              <span className='text-[10px] font-bold text-violet-800 truncate'>
                                {format(new Date(p.tanggal), 'dd MMM yyyy')}
                              </span>
                            </div>
                            <div className='flex items-center gap-2 text-[9px] text-neutral-600 font-medium'>
                              {p.supir && (
                                <span className='truncate'>
                                  Supir: {p.supir}
                                </span>
                              )}
                            </div>
                            <div className='flex items-center gap-2 flex-wrap'>
                              {totalKeluar > 0 && (
                                <span className='text-[9px] font-bold bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded'>
                                  Keluar: {totalKeluar}
                                </span>
                              )}
                              {p.surat_jalan && (
                                <a
                                  href={`${storageBase}/storage/${p.surat_jalan}`}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='inline-flex items-center justify-between p-1.5 px-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-700 transition-colors'
                                >
                                  <span className='flex items-center gap-1.5'>
                                    <Download className='h-3.5 w-3.5 text-blue-500' />{' '}
                                    Lihat SJ
                                  </span>
                                </a>
                              )}
                              {p.setrim && (
                                <a
                                  href={`${storageBase}/storage/${p.setrim}`}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='inline-flex items-center justify-between p-1.5 px-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-700 transition-colors'
                                >
                                  <span className='flex items-center gap-1.5'>
                                    <Download className='h-3.5 w-3.5 text-blue-500' />{' '}
                                    Lihat Setrim
                                  </span>
                                </a>
                              )}
                              {totalTersetting > 0 && (
                                <span className='text-[9px] font-bold bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded'>
                                  Setting: {totalTersetting}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className='text-[10px] text-muted-foreground text-center py-2'>
                    Belum ada data pengiriman.
                  </p>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* 1. BILLED PROGRESS SECTION */}
        <Card
          className={`relative border shadow-sm transition-all duration-300 ${
            flowSteps[0].isActive
              ? flowSteps[0].isCompleted
                ? 'border-orange-200 bg-white ring-1 ring-orange-100'
                : 'border-orange-300 bg-white ring-2 ring-orange-500 ring-offset-2'
              : 'border-neutral-200 bg-neutral-50/80 opacity-60 grayscale-[0.5]'
          }`}
        >
          {flowSteps[0].isCompleted && (
            <div className='absolute -top-1.5 -right-1.5 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm z-10 animate-in zoom-in duration-300'>
              <CheckCircle2 className='h-3 w-3 text-white' />
            </div>
          )}
          <CardHeader className='pb-3 flex flex-row items-center justify-between gap-3'>
            <button
              className='flex items-center gap-3 flex-1 text-left'
              onClick={() => setIsBilledCollapsed((v) => !v)}
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${
                  flowSteps[0].isActive
                    ? 'bg-orange-100 text-orange-600'
                    : 'bg-neutral-200 text-neutral-500'
                }`}
              >
                1
              </div>
              <div className='flex-1'>
                <CardTitle className='text-base text-neutral-800'>
                  Progress Penagihan
                </CardTitle>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wider'>
                  Billed Progress
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-neutral-400 transition-transform duration-200 mr-1 ${
                  isBilledCollapsed ? '-rotate-90' : ''
                }`}
              />
            </button>
          </CardHeader>
          {!isBilledCollapsed && (
            <CardContent>
              <div className='h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden mt-2'>
                <div
                  className='h-full bg-orange-500 transition-all duration-500'
                  style={{ width: `${Math.min(totalBilledPercent, 100)}%` }}
                />
              </div>
              <div className='flex justify-between items-center mt-1 mb-3'>
                <p className='text-[10px] font-bold text-neutral-700'>
                  Persentase Ditagih
                </p>
                <p className='text-[10px] font-bold text-orange-600'>
                  {Number(totalBilledPercent).toFixed(2)}%
                </p>
              </div>

              <div className='pt-2 space-y-2 border-t border-neutral-100 mt-2'>
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-2'>
                  {project.spk?.spk_signed_file || project.spk?.file ? (
                    <a
                      href={`${storageBase}/storage/${
                        project.spk.spk_signed_file || project.spk.file
                      }`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center justify-between p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-700 transition-colors'
                    >
                      <span className='flex items-center gap-1.5'>
                        <Download className='h-3.5 w-3.5 text-blue-500' /> File
                        SPK
                      </span>
                    </a>
                  ) : null}
                  {project.sph?.file || project.sphs?.[0]?.file ? (
                    <a
                      href={`${storageBase}/storage/${
                        project.sph?.file || project.sphs?.[0]?.file
                      }`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center justify-between p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-700 transition-colors'
                    >
                      <span className='flex items-center gap-1.5'>
                        <Download className='h-3.5 w-3.5 text-blue-500' /> File
                        SPH
                      </span>
                    </a>
                  ) : null}
                  {project.basts?.[0]?.file_url || project.basts?.[0]?.file_path ? (
                    <a
                      href={
                        project.basts[0].file_url ||
                        `${storageBase}/storage/${project.basts[0].file_path}`
                      }
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center justify-between p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-700 transition-colors'
                    >
                      <span className='flex items-center gap-1.5'>
                        <Download className='h-3.5 w-3.5 text-teal-600' /> File
                        BAST
                      </span>
                    </a>
                  ) : null}
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* 2. PAYMENT PROGRESS SECTION */}
        <Card
          className={`relative border shadow-sm transition-all duration-300 ${
            totalPaidPercent >= 100
              ? 'border-emerald-200 bg-white ring-1 ring-emerald-100'
              : 'border-blue-200 bg-white ring-1 ring-blue-100'
          }`}
        >
          {totalPaidPercent >= 100 && (
            <div className='absolute -top-1.5 -right-1.5 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm z-10 animate-in zoom-in duration-300'>
              <CheckCircle2 className='h-3 w-3 text-white' />
            </div>
          )}
          <CardHeader className='pb-3 flex flex-row items-center justify-between gap-3'>
            <button
              className='flex items-center gap-3 flex-1 text-left'
              onClick={() => setIsPaymentCollapsed((v) => !v)}
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center font-bold bg-blue-100 text-blue-600`}
              >
                2
              </div>
              <div className='flex-1'>
                <CardTitle className='text-base text-neutral-800'>
                  Progress Pembayaran
                </CardTitle>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wider'>
                  Payment Progress
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-neutral-400 transition-transform duration-200 mr-1 ${
                  isPaymentCollapsed ? '-rotate-90' : ''
                }`}
              />
            </button>
          </CardHeader>
          {!isPaymentCollapsed && (
            <CardContent className='pt-0'>
              <div className='h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden mt-4'>
                <div
                  className='h-full bg-blue-600 transition-all duration-500'
                  style={{ width: `${Math.min(totalPaidPercent, 100)}%` }}
                />
              </div>
              <div className='flex justify-between items-center mt-1'>
                <p className='text-[10px] font-bold text-neutral-700'>
                  Persentase Dibayar
                </p>
                <p className='text-[10px] font-bold text-blue-600'>
                  {Number(totalPaidPercent).toFixed(2)}%
                </p>
              </div>

              <div className='pt-2 space-y-1 border-t border-neutral-100 mt-3 text-xs'>
                <div className='flex justify-between'>
                  <span className='text-neutral-500'>Total Ditagih:</span>
                  <span className='font-semibold text-neutral-800'>
                    {formatRupiah(totalBilledAmount)}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-neutral-500'>Total Dibayar:</span>
                  <span className='font-bold text-emerald-600'>
                    {formatRupiah(totalPaidAmount)}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-neutral-500'>Sisa Piutang:</span>
                  <span className='font-bold text-red-600'>
                    {formatRupiah(
                      Math.max(totalBilledAmount - totalPaidAmount, 0)
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Penagihan Table */}
      <div className='space-y-4 pt-4 border-t'>
        <div className='flex justify-between items-center'>
          <h2 className='text-xl font-bold flex items-center gap-2'>
            <Receipt className='h-5 w-5 text-neutral-400' />
            Daftar Penagihan
          </h2>
          <div className='flex gap-2'>
            <Button
              size='sm'
              className='bg-blue-600 hover:bg-blue-700'
              onClick={openCreate}
            >
              <Plus className='mr-2 h-4 w-4' />
              Tambah Penagihan
            </Button>
          </div>
        </div>

        <div className='rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm'>
          <Table>
            <TableHeader className='bg-neutral-50/80'>
              <TableRow>
                <TableHead className='w-[50px]'>No</TableHead>
                <TableHead>No Invoice</TableHead>
                <TableHead>Tgl Invoice</TableHead>
                <TableHead>Termin</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Persentase</TableHead>
                <TableHead>Nominal</TableHead>
                <TableHead>Take Out</TableHead>
                <TableHead>Jatuh Tempo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tgl Dibayar</TableHead>
                <TableHead>Umur Penagihan</TableHead>
                <TableHead>File</TableHead>
                <TableHead className='text-right'>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingPenagihan ? (
                <TableRow>
                  <TableCell colSpan={14} className='h-32 text-center'>
                    <Loader2 className='h-6 w-6 animate-spin mx-auto text-neutral-400' />
                  </TableCell>
                </TableRow>
              ) : penagihanList.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={14}
                    className='h-32 text-center text-muted-foreground'
                  >
                    Belum ada data penagihan.
                  </TableCell>
                </TableRow>
              ) : (
                penagihanList.map((item, index) => (
                  <TableRow
                    key={item.id}
                    className='hover:bg-neutral-50/50 transition-colors'
                  >
                    <TableCell className='text-muted-foreground font-medium'>
                      {index + 1}
                    </TableCell>
                    <TableCell className='text-sm font-medium text-neutral-700'>
                      {item.nomor_invoice || '-'}
                    </TableCell>
                    <TableCell className='text-sm'>
                      {item.tanggal_invoice
                        ? format(new Date(item.tanggal_invoice), 'dd MMM yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell className='font-semibold'>
                      {item.termin?.nama || '-'}
                    </TableCell>
                    <TableCell className='text-sm text-neutral-600 max-w-[200px] truncate'>
                      {item.deskripsi || '-'}
                    </TableCell>
                    <TableCell className='font-bold text-blue-600'>
                      {item.persentase}%
                    </TableCell>
                    <TableCell className='font-semibold text-emerald-700'>
                      {item.nominal_penagihan
                        ? formatRupiah(item.nominal_penagihan)
                        : '-'}
                    </TableCell>
                    <TableCell className='font-semibold text-amber-700'>
                      {item.take_out ? formatRupiah(item.take_out) : '-'}
                    </TableCell>
                    <TableCell className='text-sm'>
                      {item.jatuh_tempo
                        ? format(new Date(item.jatuh_tempo), 'dd MMM yyyy')
                        : '-'}
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
                    <TableCell className='text-sm'>
                      {item.tanggal_dibayar
                        ? format(new Date(item.tanggal_dibayar), 'dd MMM yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell className='text-sm'>
                      {item.tanggal_invoice ? (
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
        <DialogContent className='max-w-lg w-[95vw] sm:w-full max-h-[92vh] overflow-y-auto p-0 gap-0 border border-neutral-100 rounded-xl shadow-lg'>
          {/* Header */}
          <div className='flex items-center gap-3 p-5 border-b border-neutral-100 bg-neutral-50/60 sticky top-0 z-10 backdrop-blur-sm'>
            <div className='h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-sm'>
              <Receipt className='h-4.5 w-4.5' />
            </div>
            <div>
              <DialogTitle className='text-base font-bold text-neutral-900'>
                {editingId !== null ? 'Edit Detail Penagihan' : 'Tambah Penagihan Baru'}
              </DialogTitle>
              <DialogDescription className='text-xs text-neutral-500 mt-0.5'>
                Kelola informasi termin, invoice, dan berkas pembayaran.
              </DialogDescription>
            </div>
          </div>

          <div className='p-5 space-y-4 py-4 pr-5'>
            {/* 1. Termin Selection */}
            <div className='space-y-2.5 p-3.5 rounded-xl border border-neutral-200/80 bg-white shadow-sm'>
              <Label className='text-xs font-bold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5'>
                <CheckCircle2 className='h-3.5 w-3.5 text-blue-500' />
                Pilih Termin Penagihan <span className='text-red-500'>*</span>
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
                  <TabsList className='w-full flex-wrap h-auto p-1 bg-neutral-100/60 border border-neutral-200/50 rounded-lg gap-0.5'>
                    {terminList.map((t) => (
                      <TabsTrigger
                        key={t.id}
                        value={t.id.toString()}
                        disabled={usedTerminIds.includes(t.id)}
                        className='flex-1 py-1.5 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all'
                      >
                        {t.nama}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              )}
            </div>

            {/* 2. Informasi Invoice */}
            <div className='space-y-3.5 p-3.5 rounded-xl border border-neutral-200/80 bg-white shadow-sm'>
              <h4 className='text-xs font-bold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5'>
                <FileText className='h-3.5 w-3.5 text-neutral-500' />
                Informasi Invoice
              </h4>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3.5'>
                {/* No Invoice */}
                <div className='space-y-1.5'>
                  <Label htmlFor='nomor_invoice' className='text-xs font-semibold text-neutral-700'>No Invoice</Label>
                  <Input
                    id='nomor_invoice'
                    type='text'
                    placeholder='Masukkan nomor invoice...'
                    value={form.nomor_invoice || ''}
                    className='h-9 text-xs border-neutral-200 focus-visible:ring-blue-500'
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        nomor_invoice: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* Deskripsi */}
                <div className='space-y-1.5'>
                  <Label htmlFor='deskripsi' className='text-xs font-semibold text-neutral-700'>Deskripsi</Label>
                  <Input
                    id='deskripsi'
                    type='text'
                    placeholder='Masukkan deskripsi...'
                    value={form.deskripsi || ''}
                    className='h-9 text-xs border-neutral-200 focus-visible:ring-blue-500'
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, deskripsi: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* 3. Kalkulasi Nilai SPK */}
            <div className='space-y-3.5 p-3.5 rounded-xl border border-neutral-200/80 bg-neutral-50/50 shadow-sm'>
              <h4 className='text-xs font-bold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5'>
                <Receipt className='h-3.5 w-3.5 text-emerald-600' />
                Kalkulasi Tagihan
              </h4>

              {/* SPK Info bar */}
              <div className='space-y-1.5'>
                <Label htmlFor='nominal_spk' className='text-xs font-semibold text-neutral-700'>Nominal Utama SPK</Label>
                {project?.spk?.nominal ? (
                  <Input
                    id='nominal_spk'
                    type='text'
                    readOnly
                    disabled
                    value={formatRupiah(project.spk.nominal)}
                    className='h-9 text-xs bg-neutral-100/80 text-neutral-600 border-neutral-200 cursor-not-allowed font-semibold'
                  />
                ) : !project?.spk ? (
                  <Input
                    id='nominal_spk'
                    type='text'
                    readOnly
                    disabled
                    value=''
                    placeholder='Belum ada data SPK'
                    className='h-9 text-xs bg-neutral-100/80 text-neutral-400 border-neutral-200 cursor-not-allowed'
                  />
                ) : isEditingSpkNominal ? (
                  <div className='flex gap-1.5'>
                    <Input
                      id='nominal_spk'
                      type='text'
                      autoFocus
                      placeholder='Masukkan nominal SPK...'
                      value={spkNominalInput}
                      className='h-9 text-xs border-neutral-200 focus-visible:ring-blue-500 flex-1'
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
                      className='h-9 w-9 shrink-0 border-neutral-200'
                      disabled={updateSpkNominalMutation.isPending}
                      onClick={() => {
                        const raw = parseRawNumber(spkNominalInput);
                        if (!raw) {
                          toast.error('Masukkan nominal yang valid');
                          return;
                        }
                        updateSpkNominalMutation.mutate({
                          nominal: raw,
                          nomor_spk: project?.spk?.nomor_spk || '',
                        });
                      }}
                    >
                      {updateSpkNominalMutation.isPending ? (
                        <Loader2 className='h-3.5 w-3.5 animate-spin' />
                      ) : (
                        <CheckCircle2 className='h-3.5 w-3.5 text-emerald-600' />
                      )}
                    </Button>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='h-9 w-9 shrink-0'
                      onClick={() => {
                        setIsEditingSpkNominal(false);
                        setSpkNominalInput('');
                      }}
                    >
                      <X className='h-3.5 w-3.5 text-neutral-500' />
                    </Button>
                  </div>
                ) : (
                  <div className='flex gap-1.5'>
                    <Input
                      id='nominal_spk'
                      type='text'
                      readOnly
                      disabled
                      value=''
                      placeholder='Belum ada nominal SPK'
                      className='h-9 text-xs bg-neutral-100/80 text-neutral-400 border-neutral-200 cursor-not-allowed flex-1'
                    />
                    <Button
                      type='button'
                      variant='outline'
                      size='icon'
                      className='h-9 w-9 border-neutral-200 bg-white hover:bg-neutral-50 shadow-sm shrink-0'
                      onClick={() => {
                        setSpkNominalInput('');
                        setIsEditingSpkNominal(true);
                      }}
                    >
                      <Pencil className='h-3.5 w-3.5 text-neutral-600' />
                    </Button>
                  </div>
                )}
              </div>

              {/* Tagihan breakdown grid */}
              <div className='grid grid-cols-3 gap-3 pt-1'>
                {/* Persentase */}
                <div className='space-y-1.5'>
                  <Label className='text-xs font-semibold text-neutral-700'>Persentase (%)</Label>
                  <Input
                    type='number'
                    min={0}
                    max={100}
                    value={form.persentase || ''}
                    className='h-9 text-xs border-neutral-200 focus-visible:ring-blue-500 font-medium'
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const pct = Math.min(parseFloat(e.target.value) || 0, 100);
                      const spkNominal = project?.spk?.nominal
                        ? parseDatabaseNominal(project.spk.nominal)
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
                <div className='space-y-1.5'>
                  <Label className='text-xs font-semibold text-neutral-700'>Nominal Tagihan</Label>
                  <Input
                    type='text'
                    placeholder='Rp 0'
                    value={form.nominal_penagihan || ''}
                    className='h-9 text-xs border-neutral-200 focus-visible:ring-blue-500 font-semibold text-emerald-700'
                    onChange={(e) => {
                      const formatted = formatRupiah(e.target.value);
                      const rawNominal = parseRawNumber(e.target.value);
                      const nominalVal = parseFloat(rawNominal) || 0;

                      const rawTakeOut = parseRawNumber(form.take_out || '');
                      const takeOutVal = parseFloat(rawTakeOut) || 0;

                      const spkNominal = project?.spk?.nominal
                        ? parseDatabaseNominal(project.spk.nominal)
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
                <div className='space-y-1.5'>
                  <Label className='text-xs font-semibold text-neutral-700'>Take Out</Label>
                  <Input
                    type='text'
                    placeholder='Rp 0'
                    value={form.take_out || ''}
                    className='h-9 text-xs border-neutral-200 focus-visible:ring-blue-500 font-semibold text-amber-700'
                    onChange={(e) => {
                      const formatted = formatRupiah(e.target.value);
                      const rawTakeOut = parseRawNumber(e.target.value);
                      const takeOutVal = parseFloat(rawTakeOut) || 0;

                      const spkNominal = project?.spk?.nominal
                        ? parseDatabaseNominal(project.spk.nominal)
                        : 0;
                      const baseNominal = (form.persentase / 100) * spkNominal;
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
            </div>

            {/* 4. Penjadwalan & Status */}
            <div className='space-y-3.5 p-3.5 rounded-xl border border-neutral-200/80 bg-white shadow-sm'>
              <h4 className='text-xs font-bold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5'>
                <Info className='h-3.5 w-3.5 text-neutral-500' />
                Jadwal & Status Pembayaran
              </h4>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3.5'>
                {/* Tanggal Invoice */}
                <div className='space-y-1.5'>
                  <Label className='text-xs font-semibold text-neutral-700'>Tanggal Invoice</Label>
                  <Input
                    type='date'
                    value={form.tanggal_invoice || ''}
                    className='h-9 text-xs border-neutral-200 focus-visible:ring-blue-500'
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

                {/* Jatuh Tempo */}
                <div className='space-y-1.5'>
                  <Label className='text-xs font-semibold text-neutral-700'>Jatuh Tempo</Label>
                  <Input
                    type='date'
                    value={form.jatuh_tempo || ''}
                    className='h-9 text-xs border-neutral-200 focus-visible:ring-blue-500'
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        jatuh_tempo: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {/* Status */}
              <div className='space-y-1.5 pt-1'>
                <Label className='text-xs font-semibold text-neutral-700 flex items-center gap-1'>
                  Status Pembayaran <span className='text-red-500'>*</span>
                </Label>
                <Tabs
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, status: v as any }))
                  }
                  className='w-full'
                >
                  <TabsList className='grid w-full grid-cols-3 p-1 bg-neutral-100/60 border border-neutral-200/50 rounded-lg gap-0.5'>
                    {STATUS_OPTIONS.map((status) => {
                      let activeStyle = 'data-[state=active]:text-blue-600 data-[state=active]:bg-white';
                      if (status === 'Lunas') {
                        activeStyle = 'data-[state=active]:text-emerald-700 data-[state=active]:bg-emerald-50 data-[state=active]:border-emerald-200';
                      } else if (status === 'Sebagian Dibayar') {
                        activeStyle = 'data-[state=active]:text-amber-700 data-[state=active]:bg-amber-50 data-[state=active]:border-amber-200';
                      } else if (status === 'Belum Bayar') {
                        activeStyle = 'data-[state=active]:text-red-700 data-[state=active]:bg-red-50 data-[state=active]:border-red-200';
                      }
                      return (
                        <TabsTrigger
                          key={status}
                          value={status}
                          className={`py-1.5 text-xs font-medium border border-transparent rounded-md transition-all ${activeStyle}`}
                        >
                          {status}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </Tabs>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3.5'>
                {/* Nominal Dibayar (Conditional) */}
                {form.status === 'Sebagian Dibayar' && (
                  <div className='space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200'>
                    <Label className='text-xs font-semibold text-neutral-700'>
                      Nominal Dibayar (Rp) <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      type='number'
                      placeholder='Masukkan nominal...'
                      value={form.nominal_dibayar || 0}
                      className='h-9 text-xs border-neutral-200 focus-visible:ring-blue-500 font-semibold'
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          nominal_dibayar: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                )}

                {/* Tanggal Dibayar */}
                <div className='space-y-1.5 flex-1'>
                  <Label className='text-xs font-semibold text-neutral-700'>Tanggal Dibayar</Label>
                  <Input
                    type='date'
                    value={form.tanggal_dibayar || ''}
                    className='h-9 text-xs border-neutral-200 focus-visible:ring-blue-500'
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        tanggal_dibayar: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* 5. File Upload Area */}
            <div className='space-y-3 p-3.5 rounded-xl border border-neutral-200/80 bg-white shadow-sm'>
              <h4 className='text-xs font-bold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5'>
                <Download className='h-3.5 w-3.5 text-blue-500' />
                Dokumen Pendukung
              </h4>

              <div className='flex flex-col gap-2'>
                <div 
                  onClick={() => fileRef.current?.click()}
                  className='border-2 border-dashed border-neutral-200 hover:border-blue-500 hover:bg-blue-50/10 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all group'
                >
                  <div className='h-8 w-8 rounded-full bg-neutral-50 group-hover:bg-blue-50 group-hover:text-blue-600 text-neutral-500 flex items-center justify-center transition-colors shadow-sm'>
                    <Plus className='h-4 w-4' />
                  </div>
                  <span className='text-xs font-semibold text-neutral-700 group-hover:text-blue-600 transition-colors'>
                    {fileInput ? 'Ganti File Dokumen' : 'Pilih File Dokumen'}
                  </span>
                  <span className='text-[10px] text-neutral-400'>
                    Maksimal 10 MB (Format: PDF, JPG, JPEG, PNG)
                  </span>
                </div>

                <div className='flex items-center gap-2'>
                  <Input
                    type='file'
                    ref={fileRef}
                    className='hidden'
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setFileError(null);
                      if (file) {
                        const extension = file.name.split('.').pop()?.toLowerCase();
                        const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
                        if (!extension || !allowedExtensions.includes(extension)) {
                          setFileError('Format file tidak didukung. Pilih file PDF, JPG, JPEG, atau PNG.');
                          if (fileRef.current) fileRef.current.value = '';
                          setFileInput(null);
                          return;
                        }
                        if (file.size > 10 * 1024 * 1024) {
                          setFileError('Ukuran file melebihi batas maksimal 10 MB.');
                          if (fileRef.current) fileRef.current.value = '';
                          setFileInput(null);
                          return;
                        }
                      }
                      setFileInput(file);
                    }}
                    accept='.pdf,.jpg,.jpeg,.png'
                  />
                  {fileInput && (
                    <div className='flex items-center gap-2.5 p-2 px-3 rounded-lg bg-neutral-50 border border-neutral-200/80 text-xs text-neutral-600 w-full animate-in fade-in slide-in-from-bottom-1 duration-200'>
                      <FileText className='h-4 w-4 text-blue-500 shrink-0' />
                      <span className='truncate flex-1 font-medium'>
                        {fileInput.name}
                      </span>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='h-6 w-6 text-neutral-400 hover:text-red-500 hover:bg-neutral-100 rounded-md shrink-0'
                        onClick={(e) => {
                          e.stopPropagation();
                          setFileInput(null);
                          setFileError(null);
                          if (fileRef.current) fileRef.current.value = '';
                        }}
                      >
                        <X className='h-3.5 w-3.5' />
                      </Button>
                    </div>
                  )}
                  {!fileInput && editingId !== null && (
                    <span className='text-[10px] text-muted-foreground italic pl-1'>
                      Kosongkan jika tidak ingin mengganti file
                    </span>
                  )}
                </div>
                {fileError && (
                  <p className='text-xs font-semibold text-red-500 animate-in fade-in duration-200 pl-1'>
                    {fileError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className='flex items-center justify-end gap-2.5 p-4 border-t border-neutral-100 bg-neutral-50/60 sticky bottom-0 z-10 backdrop-blur-sm'>
            <Button 
              variant='outline' 
              onClick={closeForm} 
              disabled={isSaving}
              className='h-9 text-xs border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
            >
              Batal
            </Button>
            <Button
              className='bg-blue-600 hover:bg-blue-700 text-white h-9 text-xs px-4 shadow-sm font-semibold'
              onClick={handleSubmit}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' />}
              {editingId !== null ? 'Simpan Perubahan' : 'Tambah Penagihan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Penagihan Confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Penagihan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus penagihan termin{' '}
              <strong>{deleteTarget?.termin?.nama}</strong>? Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className='bg-red-600 hover:bg-red-700'
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
            >
              {deleteMutation.isPending && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
