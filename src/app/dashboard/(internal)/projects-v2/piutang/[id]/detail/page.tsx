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
} from 'lucide-react';
import { format } from 'date-fns';

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

const STATUS_OPTIONS = ['Belum Bayar', 'Sebagian Dibayar', 'Lunas'] as const;

const statusBadgeClass = (status: string) => {
    if (status === 'Lunas') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'Sebagian Dibayar') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-red-50 text-red-700 border-red-200';
};

const emptyForm = {
    termin_id: 0,
    persentase: 0,
    nominal_penagihan: '',
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

    // Form state
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingId, setEditingId] = React.useState<number | null>(null);
    const [form, setForm] = React.useState(emptyForm);
    const [fileInput, setFileInput] = React.useState<File | null>(null);
    const fileRef = React.useRef<HTMLInputElement>(null);

    // Delete state
    const [deleteTarget, setDeleteTarget] = React.useState<Penagihan | null>(null);

    // Termin management
    const [isTerminOpen, setIsTerminOpen] = React.useState(false);
    const [newTerminName, setNewTerminName] = React.useState('');
    const [editingTermin, setEditingTermin] = React.useState<{ id: number; nama: string } | null>(null);
    const [deleteTerminTarget, setDeleteTerminTarget] = React.useState<{ id: number; nama: string } | null>(null);

    // Mutations
    const createMutation = useMutation({
        mutationFn: (payload: CreatePenagihanPayload) => penagihanService.createPenagihan(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['penagihan', projectId] });
            toast.success('Penagihan berhasil ditambahkan');
            closeForm();
        },
        onError: () => toast.error('Gagal menambahkan penagihan'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Partial<CreatePenagihanPayload> }) =>
            penagihanService.updatePenagihan(id, payload),
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

    const openCreate = () => {
        setEditingId(null);
        setForm(emptyForm);
        setFileInput(null);
        setIsFormOpen(true);
    };

    const openEdit = (p: Penagihan) => {
        setEditingId(p.id);
        setForm({
            termin_id: p.termin_id,
            persentase: p.persentase,
            nominal_penagihan: p.nominal_penagihan ? formatRupiah(p.nominal_penagihan) : '',
            tanggal_kirim: p.tanggal_kirim || '',
            tanggal_invoice: p.tanggal_invoice || '',
            jatuh_tempo: p.jatuh_tempo || '',
            status: p.status,
            tanggal_dibayar: p.tanggal_dibayar || '',
            nominal_dibayar: Number(p.nominal_dibayar) || 0,
            file: undefined,
        });
        setFileInput(null);
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingId(null);
        setForm(emptyForm);
        setFileInput(null);
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
            nominal_penagihan: parseRawNumber(form.nominal_penagihan) || undefined,
            status: form.status,
            tanggal_kirim: form.tanggal_kirim || undefined,
            tanggal_invoice: form.tanggal_invoice || undefined,
            jatuh_tempo: form.jatuh_tempo || undefined,
            tanggal_dibayar: form.tanggal_dibayar || undefined,
            nominal_dibayar: form.status === 'Sebagian Dibayar' ? form.nominal_dibayar : undefined,
            file: fileInput || undefined,
        };

        if (editingId !== null) {
            updateMutation.mutate({ id: editingId, payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const isSaving = createMutation.isPending || updateMutation.isPending;

    const storageBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('/api', '');

    if (isLoadingProject) {
        return (
            <div className='flex h-[400px] items-center justify-center'>
                <Loader2 className='h-8 w-8 animate-spin text-neutral-400' />
            </div>
        );
    }

    if (!project) {
        return (
            <div className='p-8 text-center text-muted-foreground'>Project not found.</div>
        );
    }

    return (
        <div className='flex flex-col gap-6 p-6'>
            {/* Header */}
            <div className='flex items-center gap-4'>
                <Button variant='ghost' size='icon' onClick={() => router.back()}>
                    <ArrowLeft className='h-5 w-5' />
                </Button>
                <div>
                    <h1 className='text-2xl font-bold tracking-tight'>Piutang - Penagihan</h1>
                    <p className='text-sm text-muted-foreground'>
                        Manajemen penagihan untuk proyek ini
                    </p>
                </div>
            </div>

            {/* Project Info */}
            <Card className='border-none shadow-sm bg-gradient-to-br from-white to-neutral-50/50'>
                <CardHeader className='pb-3'>
                    <CardTitle className='flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-neutral-500'>
                        <FileText className='h-4 w-4 text-blue-500' />
                        Informasi Proyek
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6'>
                        <div className='space-y-1'>
                            <Label className='text-[10px] text-muted-foreground uppercase'>Nama Proyek</Label>
                            <p className='font-bold text-neutral-900'>{project.name}</p>
                        </div>
                        <div className='space-y-1'>
                            <Label className='text-[10px] text-muted-foreground uppercase'>Client</Label>
                            <p className='font-semibold text-neutral-800'>{project.client?.name || '-'}</p>
                        </div>
                        <div className='space-y-1'>
                            <Label className='text-[10px] text-muted-foreground uppercase'>Nomor SPK</Label>
                            <p className='text-neutral-700'>{project.spk_number || project.spk?.nomor_spk || '-'}</p>
                        </div>
                        <div className='space-y-1'>
                            <Label className='text-[10px] text-muted-foreground uppercase'>Tanggal SPK turun</Label>
                            <p className='font-bold text-blue-600'>
                                {project.spk?.created_at ? format(new Date(project.spk.created_at), 'MMM d, yyyy') : '-'}
                            </p>
                        </div>
                        <div className='space-y-1'>
                            <Label className='text-[10px] text-muted-foreground uppercase'>Progres Produksi</Label>
                            <p className='font-bold text-emerald-600'>
                                {project.progres_produksi || 0}%
                            </p>
                        </div>
                        <div className='space-y-1'>
                            <Label className='text-[10px] text-muted-foreground uppercase'>Total Penagihan</Label>
                            <p className='font-bold text-amber-600'>
                                {penagihanList.reduce((sum, p) => sum + Number(p.persentase || 0), 0)}%
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

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
                                <TableHead className='w-[50px]'>#</TableHead>
                                <TableHead>Termin</TableHead>
                                <TableHead>Persentase</TableHead>
                                <TableHead>Nominal</TableHead>
                                <TableHead>Tanggal Kirim</TableHead>
                                <TableHead>Tanggal Invoice</TableHead>
                                <TableHead>Jatuh Tempo</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Tanggal Dibayar</TableHead>
                                <TableHead>File</TableHead>
                                <TableHead className='text-right'>Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingPenagihan ? (
                                <TableRow>
                                    <TableCell colSpan={11} className='h-32 text-center'>
                                        <Loader2 className='h-6 w-6 animate-spin mx-auto text-neutral-400' />
                                    </TableCell>
                                </TableRow>
                            ) : penagihanList.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={11} className='h-32 text-center text-muted-foreground'>
                                        Belum ada data penagihan.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                penagihanList.map((item, index) => (
                                    <TableRow key={item.id} className='hover:bg-neutral-50/50 transition-colors'>
                                        <TableCell className='text-muted-foreground font-medium'>{index + 1}</TableCell>
                                        <TableCell className='font-semibold'>{item.termin?.nama || '-'}</TableCell>
                                        <TableCell className='font-bold text-blue-600'>{item.persentase}%</TableCell>
                                        <TableCell className='font-semibold text-emerald-700'>
                                            {item.nominal_penagihan ? formatRupiah(item.nominal_penagihan) : '-'}
                                        </TableCell>
                                        <TableCell className='text-sm'>
                                            {item.tanggal_kirim ? format(new Date(item.tanggal_kirim), 'dd MMM yyyy') : '-'}
                                        </TableCell>
                                        <TableCell className='text-sm'>
                                            {item.tanggal_invoice ? format(new Date(item.tanggal_invoice), 'dd MMM yyyy') : '-'}
                                        </TableCell>
                                        <TableCell className='text-sm'>
                                            {item.jatuh_tempo ? format(new Date(item.jatuh_tempo), 'dd MMM yyyy') : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant='outline' className={statusBadgeClass(item.status)}>
                                                {item.status}
                                            </Badge>
                                            {item.status === 'Sebagian Dibayar' && item.nominal_dibayar && (
                                                <div className="text-[10px] text-neutral-500 mt-1">
                                                    Rp {Number(item.nominal_dibayar).toLocaleString('id-ID')}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className='text-sm'>
                                            {item.tanggal_dibayar ? format(new Date(item.tanggal_dibayar), 'dd MMM yyyy') : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {item.file ? (
                                                <Button variant='ghost' size='icon' className='h-7 w-7 text-blue-600' asChild>
                                                    <a
                                                        href={`${storageBase}/storage/${item.file}`}
                                                        target='_blank'
                                                        rel='noopener noreferrer'
                                                    >
                                                        <Download className='h-3.5 w-3.5' />
                                                    </a>
                                                </Button>
                                            ) : (
                                                <span className='text-[10px] text-muted-foreground italic'>-</span>
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
            <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) closeForm(); }}>
                <DialogContent className='max-w-lg'>
                    <DialogHeader>
                        <DialogTitle>
                            {editingId !== null ? 'Edit Penagihan' : 'Tambah Penagihan'}
                        </DialogTitle>
                        <DialogDescription>
                            Isi detail penagihan untuk proyek ini.
                        </DialogDescription>
                    </DialogHeader>

                    <div className='space-y-4 py-2'>
                        {/* Termin */}
                        <div className='space-y-2'>
                            <Label>Termin <span className='text-red-500'>*</span></Label>
                            {isLoadingTermin ? (
                                <div className="h-9 w-full bg-neutral-100 animate-pulse rounded-md" />
                            ) : (
                                <Tabs
                                    value={form.termin_id ? form.termin_id.toString() : ''}
                                    onValueChange={(v) => setForm((prev) => ({ ...prev, termin_id: parseInt(v) }))}
                                    className="w-full"
                                >
                                    <TabsList className="w-full flex-wrap h-auto p-1 bg-neutral-100/50">
                                        {terminList.map((t) => (
                                            <TabsTrigger 
                                                key={t.id} 
                                                value={t.id.toString()}
                                                className="flex-1 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                                            >
                                                {t.nama}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </Tabs>
                            )}
                        </div>

                        {/* Persentase */}
                        <div className='space-y-2'>
                            <Label>Persentase (%)</Label>
                            <Input
                                type='number'
                                min={0}
                                max={100}
                                value={form.persentase || 0}
                                onChange={(e) => setForm((prev) => ({ ...prev, persentase: parseFloat(e.target.value) || 0 }))}
                            />
                        </div>

                        {/* Nominal */}
                        <div className='space-y-2'>
                            <Label>Nominal</Label>
                            <Input
                                type='text'
                                placeholder='Rp 0'
                                value={form.nominal_penagihan || ''}
                                onChange={(e) => setForm((prev) => ({ ...prev, nominal_penagihan: formatRupiah(e.target.value) }))}
                            />
                        </div>

                        <div className='grid grid-cols-3 gap-4'>
                            {/* Tanggal Kirim */}
                            <div className='space-y-2'>
                                <Label>Tanggal Kirim</Label>
                                <Input
                                    type='date'
                                    value={form.tanggal_kirim || ''}
                                    onChange={(e) => setForm((prev) => ({ ...prev, tanggal_kirim: e.target.value }))}
                                />
                            </div>

                            {/* Tanggal Invoice */}
                            <div className='space-y-2'>
                                <Label>Tanggal Invoice</Label>
                                <Input
                                    type='date'
                                    value={form.tanggal_invoice || ''}
                                    onChange={(e) => setForm((prev) => ({ ...prev, tanggal_invoice: e.target.value }))}
                                />
                            </div>

                            {/* Jatuh Tempo */}
                            <div className='space-y-2'>
                                <Label>Jatuh Tempo</Label>
                                <Input
                                    type='date'
                                    value={form.jatuh_tempo || ''}
                                    onChange={(e) => setForm((prev) => ({ ...prev, jatuh_tempo: e.target.value }))}
                                />
                            </div>
                        </div>

                        {/* Status */}
                        <div className='space-y-2'>
                            <Label>Status <span className='text-red-500'>*</span></Label>
                            <Tabs
                                value={form.status}
                                onValueChange={(v) => setForm((prev) => ({ ...prev, status: v as any }))}
                                className="w-full"
                            >
                                <TabsList className="grid w-full grid-cols-3 p-1 bg-neutral-100/50">
                                    {STATUS_OPTIONS.map((status) => (
                                        <TabsTrigger 
                                            key={status} 
                                            value={status}
                                            className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600"
                                        >
                                            {status}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>
                        </div>

                        {/* Nominal Dibayar (Conditional) */}
                        {form.status === 'Sebagian Dibayar' && (
                            <div className='space-y-2 animate-in fade-in slide-in-from-top-1 duration-200'>
                                <Label>Nominal Dibayar (Rp) <span className='text-red-500'>*</span></Label>
                                <Input
                                    type='number'
                                    placeholder='Masukkan nominal yang sudah dibayar'
                                    value={form.nominal_dibayar || 0}
                                    onChange={(e) => setForm((prev) => ({ ...prev, nominal_dibayar: parseFloat(e.target.value) || 0 }))}
                                />
                            </div>
                        )}

                        {/* Tanggal Dibayar */}
                        <div className='space-y-2'>
                            <Label>Tanggal Dibayar</Label>
                            <Input
                                type='date'
                                value={form.tanggal_dibayar || ''}
                                onChange={(e) => setForm((prev) => ({ ...prev, tanggal_dibayar: e.target.value }))}
                            />
                        </div>

                        {/* File */}
                        <div className='space-y-2'>
                            <Label>File Dokumen</Label>
                            <div className='flex items-center gap-2'>
                                <Input
                                    type='file'
                                    ref={fileRef}
                                    className='hidden'
                                    onChange={(e) => setFileInput(e.target.files?.[0] || null)}
                                    accept='.pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx'
                                />
                                <Button
                                    type='button'
                                    variant='outline'
                                    size='sm'
                                    onClick={() => fileRef.current?.click()}
                                >
                                    Pilih File
                                </Button>
                                {fileInput && (
                                    <div className='flex items-center gap-1 text-sm text-neutral-600'>
                                        <span className='truncate max-w-[200px]'>{fileInput.name}</span>
                                        <Button
                                            type='button'
                                            variant='ghost'
                                            size='icon'
                                            className='h-5 w-5 text-neutral-400 hover:text-red-500'
                                            onClick={() => { setFileInput(null); if (fileRef.current) fileRef.current.value = ''; }}
                                        >
                                            <X className='h-3 w-3' />
                                        </Button>
                                    </div>
                                )}
                                {!fileInput && editingId !== null && (
                                    <span className='text-xs text-muted-foreground italic'>Kosongkan jika tidak ingin mengganti file</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant='outline' onClick={closeForm} disabled={isSaving}>Batal</Button>
                        <Button className='bg-blue-600 hover:bg-blue-700' onClick={handleSubmit} disabled={isSaving}>
                            {isSaving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                            {editingId !== null ? 'Simpan Perubahan' : 'Tambah'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Penagihan Confirm */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Penagihan</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus penagihan termin{' '}
                            <strong>{deleteTarget?.termin?.nama}</strong>? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            className='bg-red-600 hover:bg-red-700'
                            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                        >
                            {deleteMutation.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
