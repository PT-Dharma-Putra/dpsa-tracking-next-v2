'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Pencil,
  Trash2,
  Loader2,
  ArrowLeft,
  FileText,
  Activity,
  ListChecks,
  CheckCircle2,
  Eye,
  Image as ImageIcon,
  Upload,
  ArrowUpRight,
  Building2,
  ChevronDown,
  Package,
  ClipboardCheck,
  Info,
  Calendar,
  User,
  MoreHorizontal,
  FileDown,
  Truck,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

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
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

import {
  projectV2Service,
  ProjectItemV2,
} from '@/features/projects/services/project-v2-service';
import { Badge } from '@/components/ui/badge';

export default function PerencanaanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = parseInt(params.id as string);

  // Data Queries
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ['projects-v2', projectId],
    queryFn: () => projectV2Service.getProject(projectId),
  });

  const { data: items, isLoading: isLoadingItems } = useQuery({
    queryKey: ['project-v2-items', projectId],
    queryFn: () => projectV2Service.getProjectItems(projectId),
  });

  const { data: divisions } = useQuery({
    queryKey: ['divisions'],
    queryFn: () => projectV2Service.getDivisions(),
  });

  const { data: pics } = useQuery({
    queryKey: ['pics'],
    queryFn: () => projectV2Service.getPics(),
  });

  // Gambar Kerja State
  const [isGkDialogOpen, setIsGkDialogOpen] = React.useState(false);
  const [gkItem, setGkItem] = React.useState<ProjectItemV2 | null>(null);
  const [gkFile, setGkFile] = React.useState<File | null>(null);
  const [gkStart, setGkStart] = React.useState<string>('');
  const [gkEnd, setGkEnd] = React.useState<string>('');

  const uploadGkMutation = useMutation({
    mutationFn: (payload: {
      file?: File;
      tanggal_mulai?: string;
      tanggal_selesai?: string;
    }) => projectV2Service.uploadGambarKerja(gkItem!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-v2-items', projectId],
      });
      toast.success('Gambar Kerja updated');
      setIsGkDialogOpen(false);
      setGkFile(null);
    },
    onError: () => {
      toast.error('Failed to update Gambar Kerja');
    },
  });

  const handleGkUpload = () => {
    if (!gkItem) return;
    uploadGkMutation.mutate({
      file: gkFile || undefined,
      tanggal_mulai: gkStart || undefined,
      tanggal_selesai: gkEnd || undefined,
    });
  };

  const openGkUpload = (item: ProjectItemV2) => {
    setGkItem(item);
    setGkStart(item.gambar_kerja?.tanggal_mulai || '');
    setGkEnd(item.gambar_kerja?.tanggal_selesai || '');
    setGkFile(null);
    setIsGkDialogOpen(true);
  };

  // Dokubah State
  const [isDokubahDialogOpen, setIsDokubahDialogOpen] = React.useState(false);
  const [dokubahItem, setDokubahItem] = React.useState<ProjectItemV2 | null>(
    null
  );
  const [dokubahFile, setDokubahFile] = React.useState<File | null>(null);
  const [dokubahStart, setDokubahStart] = React.useState<string>('');
  const [dokubahEnd, setDokubahEnd] = React.useState<string>('');

  const uploadDokubahMutation = useMutation({
    mutationFn: (payload: {
      file?: File;
      tanggal_mulai?: string;
      tanggal_selesai?: string;
    }) => projectV2Service.uploadDokubah(dokubahItem!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-v2-items', projectId],
      });
      toast.success('Dokubah updated');
      setIsDokubahDialogOpen(false);
      setDokubahFile(null);
    },
    onError: () => {
      toast.error('Failed to update Dokubah');
    },
  });

  const handleDokubahUpload = () => {
    if (!dokubahItem) return;
    uploadDokubahMutation.mutate({
      file: dokubahFile || undefined,
      tanggal_mulai: dokubahStart || undefined,
      tanggal_selesai: dokubahEnd || undefined,
    });
  };

  const openDokubahUpload = (item: ProjectItemV2) => {
    setDokubahItem(item);
    setDokubahStart(item.dokubah?.tanggal_mulai || '');
    setDokubahEnd(item.dokubah?.tanggal_selesai || '');
    setDokubahFile(null);
    setIsDokubahDialogOpen(true);
  };

  // Stok Material State
  const [isStokDialogOpen, setIsStokDialogOpen] = React.useState(false);
  const [stokItem, setStokItem] = React.useState<ProjectItemV2 | null>(null);
  const [stokMenerima, setStokMenerima] = React.useState<string>('');
  const [stokKeluar, setStokKeluar] = React.useState<string>('');
  const [stokPicId, setStokPicId] = React.useState<string>('');
  const [stokStatus, setStokStatus] = React.useState<string>('');

  const updateStokMutation = useMutation({
    mutationFn: (payload: {
      tanggal_menerima_dokubah?: string;
      tanggal_keluar?: string;
      pic_id?: number;
      ketersediaan_stok?: string;
    }) => projectV2Service.updateBahanBaku(stokItem!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-v2-items', projectId],
      });
      toast.success('Stok Material updated');
      setIsStokDialogOpen(false);
    },
    onError: () => {
      toast.error('Failed to update Stok Material');
    },
  });

  const handleStokUpdate = () => {
    if (!stokItem) return;
    updateStokMutation.mutate({
      tanggal_menerima_dokubah: stokMenerima || undefined,
      tanggal_keluar: stokKeluar || undefined,
      pic_id: stokPicId ? parseInt(stokPicId) : undefined,
      ketersediaan_stok: stokStatus || undefined,
    });
  };

  const openStokDialog = (item: ProjectItemV2) => {
    setStokItem(item);
    setStokMenerima(item.bahan_baku?.tanggal_menerima_dokubah || '');
    setStokKeluar(item.bahan_baku?.tanggal_keluar || '');
    setStokPicId(item.bahan_baku?.pic_id?.toString() || '');
    setStokStatus(item.bahan_baku?.ketersediaan_stok || '');
    setIsStokDialogOpen(true);
  };

  // Barang Jadi Masuk State
  const [isBjDialogOpen, setIsBjDialogOpen] = React.useState(false);
  const [bjItem, setBjItem] = React.useState<ProjectItemV2 | null>(null);
  const [bjTanggal, setBjTanggal] = React.useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [bjJumlah, setBjJumlah] = React.useState<number>(0);

  const updateBjMutation = useMutation({
    mutationFn: (payload: { tanggal: string; jumlah: number }) =>
      projectV2Service.updateBarangJadiMasuk(bjItem!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-v2-items', projectId],
      });
      toast.success('Barang Masuk recorded');
      setIsBjDialogOpen(false);
      setBjJumlah(0);
    },
    onError: () => {
      toast.error('Failed to record Barang Masuk');
    },
  });

  const handleBjUpdate = () => {
    if (!bjItem) return;

    const currentTotal =
      bjItem.barang_jadi_masuk?.reduce((sum, bj) => sum + bj.jumlah, 0) || 0;
    if (currentTotal + bjJumlah > bjItem.jumlah) {
      toast.error(
        `Total barang (${
          currentTotal + bjJumlah
        }) tidak boleh melebihi jumlah order (${bjItem.jumlah})`
      );
      return;
    }

    updateBjMutation.mutate({
      tanggal: bjTanggal,
      jumlah: bjJumlah,
    });
  };

  const openBjDialog = (item: ProjectItemV2) => {
    setBjItem(item);
    setBjJumlah(0);
    setIsBjDialogOpen(true);
  };

  // Order Gambar Kerja State
  const [isOrderGkDialogOpen, setIsOrderGkDialogOpen] = React.useState(false);
  const [orderGkFile, setOrderGkFile] = React.useState<File | null>(null);
  const [orderGkTarget, setOrderGkTarget] = React.useState<string>('');

  const uploadOrderGkMutation = useMutation({
    mutationFn: (payload: { file: File; target_selesai: string }) =>
      projectV2Service.uploadOrderGambarKerja(projectId, payload.file, payload.target_selesai),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-v2', projectId] });
      toast.success('Order Gambar Kerja uploaded');
      setIsOrderGkDialogOpen(false);
      setOrderGkFile(null);
      setOrderGkTarget('');
    },
    onError: () => {
      toast.error('Failed to upload Order Gambar Kerja');
    },
  });

  const handleOrderGkUpload = () => {
    if (!orderGkFile || !orderGkTarget) return;
    uploadOrderGkMutation.mutate({
      file: orderGkFile,
      target_selesai: orderGkTarget,
    });
  };

  const [editingDivisiItemId, setEditingDivisiItemId] = React.useState<
    number | null
  >(null);

  const updateItemDivisiMutation = useMutation({
    mutationFn: ({ itemId, divisiId }: { itemId: number; divisiId: number }) =>
      projectV2Service.updateProjectItem(itemId, { divisi_id: divisiId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-v2-items', projectId],
      });
      toast.success('Division assigned successfully');
      setEditingDivisiItemId(null);
    },
    onError: () => {
      toast.error('Failed to assign division');
    },
  });

  const [isSphCollapsed, setIsSphCollapsed] = React.useState(true);
  const [isDivisiCollapsed, setIsDivisiCollapsed] = React.useState(true);
  const [isGkCollapsed, setIsGkCollapsed] = React.useState(true);
  const [isDokubahCollapsed, setIsDokubahCollapsed] = React.useState(true);
  const [isStokCollapsed, setIsStokCollapsed] = React.useState(true);
  const [isBjCollapsed, setIsBjCollapsed] = React.useState(true);
  const [isProduksiCollapsed, setIsProduksiCollapsed] = React.useState(true);
  const [isShipCollapsed, setIsShipCollapsed] = React.useState(true);

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

  // Summary Calculations
  const totalItems = items?.length || 0;
  const poDivisiCount = items?.filter(i => i.divisi_id).length || 0;
  const gambarKerjaCount = items?.filter(i => i.gambar_kerja?.file || i.mdl_item?.link_gambar_kerja).length || 0;
  const dokubahCount = items?.filter(i => i.dokubah?.file).length || 0;
  const stokTersediaCount = items?.filter(i => i.bahan_baku?.ketersediaan_stok === 'Tersedia').length || 0;
  const perintahProduksiCount = items?.filter(i => i.divisi_id && (i.gambar_kerja?.file || i.mdl_item?.link_gambar_kerja)).length || 0;
  
  const totalQtyOrder = items?.reduce((sum, i) => sum + i.jumlah, 0) || 0;
  const totalQtyMasuk = items?.reduce((sum, i) => sum + (i.barang_jadi_masuk?.reduce((s, bj) => s + bj.jumlah, 0) || 0), 0) || 0;
  const orderGk = project?.order_gambar_kerja?.[0];

  const flowSteps = [
    {
      id: 1,
      title: 'Upload SPD',
      isCompleted: !!project.designs?.[0]?.spd_file,
      isActive: project.need_design !== 0,
      icon: FileText,
      bgColor: 'bg-orange-500',
      lightBg: 'bg-orange-50',
      borderColor: 'border-orange-200',
      color: 'text-orange-600',
    },
    {
      id: 2,
      title: 'ACC Design',
      isCompleted: project.designs?.[0]?.acc_design?.status === 'Approved',
      isActive: project.need_design !== 0 && !!project.designs?.[0]?.spd_file,
      icon: CheckCircle2,
      bgColor: 'bg-emerald-500',
      lightBg: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      color: 'text-emerald-600',
    },
    {
      id: 3,
      title: 'Upload SPH',
      isCompleted: !!project.sph?.file,
      isActive: project.need_design === 0 || project.designs?.[0]?.acc_design?.status === 'Approved',
      icon: FileText,
      bgColor: 'bg-blue-500',
      lightBg: 'bg-blue-50',
      borderColor: 'border-blue-200',
      color: 'text-blue-600',
    },
    {
      id: 4,
      title: 'Upload SPK',
      isCompleted: !!project.spk?.file,
      isActive: !!project.sph?.file,
      icon: ClipboardCheck,
      bgColor: 'bg-purple-500',
      lightBg: 'bg-purple-50',
      borderColor: 'border-purple-200',
      color: 'text-purple-600',
    },
    {
      id: 5,
      title: 'Planning',
      isCompleted: totalItems > 0 && poDivisiCount === totalItems,
      isActive: !!project.spk?.file,
      icon: ListChecks,
      bgColor: 'bg-blue-500',
      lightBg: 'bg-blue-50',
      borderColor: 'border-blue-200',
      color: 'text-blue-600',
    },
  ];

  return (
    <div className='flex flex-col gap-6 p-6 max-w-[1600px] mx-auto w-full'>
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
              <p className='text-xs text-muted-foreground italic'>Perencanaan Detail (PPIC View)</p>
            </div>
            <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
              {project.client?.name && (
                <span className='flex items-center gap-1 text-xs text-neutral-600'>
                  <Building2 className='h-3 w-3 text-neutral-400' />
                  {project.client.name}
                </span>
              )}
              {project.sph?.nomor_sph && (
                <span className='flex items-center gap-1 text-xs text-neutral-600'>
                  <FileText className='h-3 w-3 text-neutral-400' />
                  SPH: {project.sph.nomor_sph}
                </span>
              )}
              {(project.spk_number || project.spk?.nomor_spk) && (
                <span className='flex items-center gap-1 text-xs text-neutral-600'>
                  <ClipboardCheck className='h-3 w-3 text-neutral-400' />
                  SPK: {project.spk_number || project.spk?.nomor_spk}
                </span>
              )}
              {project.deadline && (
                <span className='flex items-center gap-1 text-xs text-neutral-600'>
                  <Calendar className='h-3 w-3 text-neutral-400' />
                  {format(new Date(project.deadline), 'MMM d, yyyy')}
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

      {/* Summary Cards Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8 gap-4 w-full'>
        {/* 1. SPH & SPK */}
        <Card className={`relative border shadow-sm transition-all duration-300 ${!!project.spk?.file ? 'border-purple-200 bg-white ring-1 ring-purple-100' : 'border-neutral-200 bg-white'}`}>
          {project.sph?.file && project.spk?.file && (
            <div className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm z-10 animate-in zoom-in duration-300">
              <CheckCircle2 className="h-3 w-3 text-white" />
            </div>
          )}
          <CardHeader className='pb-2 flex flex-row items-center justify-between gap-3'>
            <button className='flex items-center gap-3 flex-1 text-left' onClick={() => setIsSphCollapsed(!isSphCollapsed)}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${!!project.spk?.file ? 'bg-purple-100 text-purple-600' : 'bg-neutral-100 text-neutral-500'}`}>1</div>
              <div className='flex-1'>
                <CardTitle className='text-sm text-neutral-800'>SPH & SPK</CardTitle>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wider'>Documents</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${isSphCollapsed ? '-rotate-90' : ''}`} />
            </button>
          </CardHeader>
          {!isSphCollapsed && (
            <CardContent className='pt-0 space-y-2'>
               <div className='flex flex-col gap-1.5'>
                  <div className='flex items-center justify-between text-[10px]'>
                    <span className='text-muted-foreground'>Nomor SPH:</span>
                    <span className={`font-bold ${project.sph?.nomor_sph ? 'text-emerald-600' : 'text-red-500'}`}>{project.sph?.nomor_sph ? project.sph?.nomor_sph : '-'}</span>
                  </div>
                  <div className='flex items-center justify-between text-[10px]'>
                    <span className='text-muted-foreground'>Nomor SPK:</span>
                    <span className={`font-bold ${project.spk?.nomor_spk ? 'text-emerald-600' : 'text-red-500'}`}>{project.spk?.nomor_spk ? project.spk?.nomor_spk : '-'}</span>
                  </div>
               </div>
            </CardContent>
          )}
        </Card>

        {/* 2. PO Divisi */}
        <Card className={`relative border shadow-sm transition-all duration-300 ${poDivisiCount === totalItems && totalItems > 0 ? 'border-emerald-200 bg-white ring-1 ring-emerald-100' : 'border-neutral-200 bg-white'}`}>
          {poDivisiCount === totalItems && totalItems > 0 && (
            <div className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm z-10 animate-in zoom-in duration-300">
              <CheckCircle2 className="h-3 w-3 text-white" />
            </div>
          )}
          <CardHeader className='pb-2 flex flex-row items-center justify-between gap-3'>
            <button className='flex items-center gap-3 flex-1 text-left' onClick={() => setIsDivisiCollapsed(!isDivisiCollapsed)}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${poDivisiCount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-neutral-100 text-neutral-500'}`}>2</div>
              <div className='flex-1'>
                <CardTitle className='text-sm text-neutral-800'>PO Divisi</CardTitle>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wider'>Production Team</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${isDivisiCollapsed ? '-rotate-90' : ''}`} />
            </button>
          </CardHeader>
          {!isDivisiCollapsed && (
            <CardContent className='pt-0'>
               <div className='space-y-1.5'>
                  <div className='h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden'>
                    <div className='h-full bg-emerald-500 transition-all duration-500' style={{ width: `${totalItems ? (poDivisiCount / totalItems) * 100 : 0}%` }} />
                  </div>
                  <p className='text-[10px] font-bold text-neutral-700'>{poDivisiCount} / {totalItems} Items Assigned</p>
               </div>
            </CardContent>
          )}
        </Card>

        {/* 3. Order Gambar Kerja */}
        <Card className={`relative border shadow-sm transition-all duration-300 ${gambarKerjaCount === totalItems && totalItems > 0 ? 'border-orange-200 bg-white ring-1 ring-orange-100' : 'border-neutral-200 bg-white'}`}>
          {gambarKerjaCount === totalItems && totalItems > 0 && (
            <div className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm z-10 animate-in zoom-in duration-300">
              <CheckCircle2 className="h-3 w-3 text-white" />
            </div>
          )}
          <CardHeader className='pb-2 flex flex-row items-center justify-between gap-3'>
            <button className='flex items-center gap-3 flex-1 text-left' onClick={() => setIsGkCollapsed(!isGkCollapsed)}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${gambarKerjaCount > 0 ? 'bg-orange-100 text-orange-600' : 'bg-neutral-100 text-neutral-500'}`}>3</div>
              <div className='flex-1'>
                <CardTitle className='text-sm text-neutral-800'>Gambar Kerja</CardTitle>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wider'>Technical Drawing</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${isGkCollapsed ? '-rotate-90' : ''}`} />
            </button>
          </CardHeader>
          {!isGkCollapsed && (
            <CardContent className='pt-0'>
                  <div className='h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden'>
                    <div className='h-full bg-orange-500 transition-all duration-500' style={{ width: `${totalItems ? (gambarKerjaCount / totalItems) * 100 : 0}%` }} />
                  </div>
                  <div className='flex justify-between items-center mt-1'>
                    <p className='text-[10px] font-bold text-neutral-700'>{gambarKerjaCount} / {totalItems} Drawings Uploaded</p>
                    <p className='text-[10px] font-bold text-orange-600'>{Math.round(totalItems ? (gambarKerjaCount / totalItems) * 100 : 0)}%</p>
                  </div>
                  
                  <div className='pt-2 space-y-2 border-t border-neutral-100 mt-2'>
                    {project.order_gambar_kerja && project.order_gambar_kerja.length > 0 ? (
                      <div className='space-y-1.5 max-h-[80px] overflow-y-auto pr-1'>
                        {project.order_gambar_kerja.map((order, idx) => (
                          <div key={idx} className='flex items-center justify-between text-[9px] bg-neutral-50 p-1.5 rounded border border-neutral-100'>
                            <div className='flex flex-col gap-0.5'>
                              <span className='font-bold text-neutral-700'>Target: {format(new Date(order.target_selesai!), 'dd MMM')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className='text-[9px] text-muted-foreground italic text-center py-1'>No orders yet</p>
                    )}
                    
                    {orderGk?.file && (
                      <div className='p-2 rounded bg-orange-50 border border-orange-100 flex items-center justify-between mb-2'>
                        <div className='flex items-center gap-2 overflow-hidden text-left'>
                          <div className='h-6 w-6 rounded bg-white border border-orange-100 flex items-center justify-center text-orange-600 shrink-0'>
                            <FileText className='h-3 w-3' />
                          </div>
                          <div className='flex flex-col min-w-0'>
                            <span className='text-[9px] font-bold text-orange-900 leading-none'>Order Drawing</span>
                            <span className='text-[8px] text-orange-600 truncate'>{orderGk.file.split('/').pop()}</span>
                          </div>
                        </div>
                        <Button variant='ghost' size='icon' className='h-7 w-7 text-orange-600 hover:bg-orange-100 bg-white border border-orange-100 shadow-sm' asChild>
                          <a href={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('/api', '')}/storage/${orderGk.file}`} target='_blank' rel='noopener noreferrer'>
                            <FileDown className='h-3.5 w-3.5' />
                          </a>
                        </Button>
                      </div>
                    )}

                    <Button 
                      variant='outline' 
                      size='sm' 
                      className='h-7 w-full text-[10px] border-orange-200 text-orange-600 hover:bg-orange-50 gap-1.5 bg-orange-50/30 font-bold'
                      onClick={() => setIsOrderGkDialogOpen(true)}
                    >
                      <Upload className='h-3 w-3' />
                      Order Gambar
                    </Button>
                  </div>
               </CardContent>
          )}
        </Card>

        {/* 4. Dokubah */}
        <Card className={`border shadow-sm transition-all duration-300 ${dokubahCount > 0 ? 'border-blue-200 bg-white ring-1 ring-blue-100' : 'border-neutral-200 bg-white'}`}>
          <CardHeader className='pb-2 flex flex-row items-center justify-between gap-3'>
            <button className='flex items-center gap-3 flex-1 text-left' onClick={() => setIsDokubahCollapsed(!isDokubahCollapsed)}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${dokubahCount > 0 ? 'bg-blue-100 text-blue-600' : 'bg-neutral-100 text-neutral-500'}`}>4</div>
              <div className='flex-1'>
                <CardTitle className='text-sm text-neutral-800'>Dokubah</CardTitle>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wider'>Changes Document</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${isDokubahCollapsed ? '-rotate-90' : ''}`} />
            </button>
          </CardHeader>
          {!isDokubahCollapsed && (
            <CardContent className='pt-0'>
               <p className='text-[10px] font-bold text-neutral-700'>{dokubahCount} Items with Dokubah</p>
            </CardContent>
          )}
        </Card>

        {/* 5. Stok Material */}
        <Card className={`border shadow-sm transition-all duration-300 ${stokTersediaCount === totalItems && totalItems > 0 ? 'border-emerald-200 bg-white ring-1 ring-emerald-100' : 'border-neutral-200 bg-white'}`}>
          <CardHeader className='pb-2 flex flex-row items-center justify-between gap-3'>
            <button className='flex items-center gap-3 flex-1 text-left' onClick={() => setIsStokCollapsed(!isStokCollapsed)}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${stokTersediaCount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-neutral-100 text-neutral-500'}`}>5</div>
              <div className='flex-1'>
                <CardTitle className='text-sm text-neutral-800'>Stok Material</CardTitle>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wider'>Availability</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${isStokCollapsed ? '-rotate-90' : ''}`} />
            </button>
          </CardHeader>
          {!isStokCollapsed && (
            <CardContent className='pt-0'>
               <div className='space-y-1.5'>
                  <div className='h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden'>
                    <div className='h-full bg-emerald-500 transition-all duration-500' style={{ width: `${totalItems ? (stokTersediaCount / totalItems) * 100 : 0}%` }} />
                  </div>
                  <p className='text-[10px] font-bold text-neutral-700'>{stokTersediaCount} / {totalItems} Items Ready</p>
               </div>
            </CardContent>
          )}
        </Card>

        {/* 6. Perintah Produksi */}
        <Card className={`border shadow-sm transition-all duration-300 ${perintahProduksiCount === totalItems && totalItems > 0 ? 'border-blue-200 bg-white ring-1 ring-blue-100' : 'border-neutral-200 bg-white'}`}>
          <CardHeader className='pb-2 flex flex-row items-center justify-between gap-3'>
            <button className='flex items-center gap-3 flex-1 text-left' onClick={() => setIsProduksiCollapsed(!isProduksiCollapsed)}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${perintahProduksiCount > 0 ? 'bg-blue-100 text-blue-600' : 'bg-neutral-100 text-neutral-500'}`}>6</div>
              <div className='flex-1'>
                <CardTitle className='text-sm text-neutral-800'>Perintah Produksi</CardTitle>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wider'>Production Orders</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${isProduksiCollapsed ? '-rotate-90' : ''}`} />
            </button>
          </CardHeader>
          {!isProduksiCollapsed && (
            <CardContent className='pt-0'>
               <div className='space-y-1.5'>
                  <div className='h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden'>
                    <div className='h-full bg-blue-600 transition-all duration-500' style={{ width: `${totalItems ? (perintahProduksiCount / totalItems) * 100 : 0}%` }} />
                  </div>
                  <p className='text-[10px] font-bold text-neutral-700'>{perintahProduksiCount} / {totalItems} Ready for Production</p>
               </div>
            </CardContent>
          )}
        </Card>

        {/* 7. Barang Masuk */}
        <Card className={`border shadow-sm transition-all duration-300 ${totalQtyMasuk >= totalQtyOrder && totalQtyOrder > 0 ? 'border-blue-200 bg-white ring-1 ring-blue-100' : 'border-neutral-200 bg-white'}`}>
          <CardHeader className='pb-2 flex flex-row items-center justify-between gap-3'>
            <button className='flex items-center gap-3 flex-1 text-left' onClick={() => setIsBjCollapsed(!isBjCollapsed)}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${totalQtyMasuk > 0 ? 'bg-blue-100 text-blue-600' : 'bg-neutral-100 text-neutral-500'}`}>7</div>
              <div className='flex-1'>
                <CardTitle className='text-sm text-neutral-800'>Barang Masuk</CardTitle>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wider'>Finished Goods</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${isBjCollapsed ? '-rotate-90' : ''}`} />
            </button>
          </CardHeader>
          {!isBjCollapsed && (
            <CardContent className='pt-0'>
               <div className='space-y-1.5'>
                  <div className='h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden'>
                    <div className='h-full bg-blue-600 transition-all duration-500' style={{ width: `${totalQtyOrder ? (totalQtyMasuk / totalQtyOrder) * 100 : 0}%` }} />
                  </div>
                  <p className='text-[10px] font-bold text-neutral-700'>{totalQtyMasuk} / {totalQtyOrder} Total Quantity</p>
               </div>
            </CardContent>
          )}
        </Card>

        {/* 8. Pengiriman */}
        <Card className='border border-neutral-200 shadow-sm bg-white'>
          <CardHeader className='pb-2 flex flex-row items-center justify-between gap-3'>
            <button className='flex items-center gap-3 flex-1 text-left' onClick={() => setIsShipCollapsed(!isShipCollapsed)}>
              <div className='h-8 w-8 rounded-full flex items-center justify-center font-bold bg-neutral-100 text-neutral-500'>8</div>
              <div className='flex-1'>
                <CardTitle className='text-sm text-neutral-800'>Pengiriman</CardTitle>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wider'>Logistics</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${isShipCollapsed ? '-rotate-90' : ''}`} />
            </button>
          </CardHeader>
          {!isShipCollapsed && (
            <CardContent className='pt-0'>
               <Button variant='ghost' size='sm' className='h-7 w-full text-[10px] bg-neutral-50 hover:bg-neutral-100 flex items-center justify-center gap-1.5' asChild>
                  <Link href={`/dashboard/projects-v2/jadwal-pengiriman?project_id=${projectId}`}>
                    <Truck className='h-3 w-3' />
                    View Schedule
                  </Link>
               </Button>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Items Table Section */}
      <div className='space-y-4 pt-4 border-t'>
        <div className='flex justify-between items-center'>
          <h2 className='text-lg font-bold flex items-center gap-2 text-neutral-800'>
            <ListChecks className='h-5 w-5 text-neutral-400' />
            Project Items List
            <Badge variant='outline' className='ml-2 bg-neutral-50 text-neutral-600 border-neutral-200'>{totalItems} Items</Badge>
          </h2>
        </div>

        <div className='rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm'>
          <Table>
            <TableHeader className='bg-neutral-50/80'>
              <TableRow className='hover:bg-transparent'>
                <TableHead className='w-[40px] text-[10px] uppercase font-bold text-neutral-500'>#</TableHead>
                <TableHead className='text-[10px] uppercase font-bold text-neutral-500'>Floor/Room</TableHead>
                <TableHead className='text-[10px] uppercase font-bold text-neutral-500'>Item Name</TableHead>
                <TableHead className='text-[10px] uppercase font-bold text-neutral-500'>Vol/Dim</TableHead>
                <TableHead className='text-[10px] uppercase font-bold text-neutral-500'>Qty</TableHead>
                <TableHead className='text-[10px] uppercase font-bold text-neutral-500'>PO Divisi</TableHead>
                <TableHead className='text-[10px] uppercase font-bold text-neutral-500'>Gk MDL</TableHead>
                <TableHead className='text-[10px] uppercase font-bold text-neutral-500'>Drawing</TableHead>
                <TableHead className='text-[10px] uppercase font-bold text-neutral-500'>Dokubah</TableHead>
                <TableHead className='text-[10px] uppercase font-bold text-neutral-500'>Stock</TableHead>
                <TableHead className='text-[10px] uppercase font-bold text-neutral-500'>Masuk</TableHead>
                <TableHead className='w-[100px] text-right text-[10px] uppercase font-bold text-neutral-500 pr-4'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingItems ? (
                <TableRow>
                  <TableCell
                    colSpan={12}
                    className='h-32 text-center text-muted-foreground'
                  >
                    <Loader2 className='h-6 w-6 animate-spin mx-auto' />
                  </TableCell>
                </TableRow>
              ) : items?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={12}
                    className='h-32 text-center text-muted-foreground'
                  >
                    No items recorded for this project.
                  </TableCell>
                </TableRow>
              ) : (
                items?.map((item, index) => (
                  <TableRow
                    key={item.id}
                    className='hover:bg-neutral-50/50 transition-colors group'
                  >
                    <TableCell className='text-[10px] text-muted-foreground font-medium'>
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-col gap-0.5'>
                        <span className='text-xs font-bold text-neutral-800'>{item.lantai || '-'}</span>
                        <span className='text-[9px] text-muted-foreground truncate max-w-[120px]'>{item.ruang || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-col gap-0.5'>
                        <span className='text-xs font-bold text-neutral-900 group-hover:text-blue-600 transition-colors'>{item.item}</span>
                        {item.keterangan && <span className='text-[9px] text-muted-foreground truncate max-w-[150px]'>{item.keterangan}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-col gap-0.5'>
                        <span className='text-xs font-bold text-blue-600'>{item.volume || '-'}</span>
                        <span className='text-[9px] text-muted-foreground'>
                          {item.panjang || '-'}x{item.lebar || '-'}x{item.tinggi || '-'} {item.satuan}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className='font-bold text-sm text-neutral-800'>{item.jumlah}</TableCell>
                    <TableCell>
                      {item.divisi && editingDivisiItemId !== item.id ? (
                        <div className='flex items-center gap-2'>
                          <Badge
                            variant='outline'
                            className='bg-emerald-50 text-emerald-700 border-emerald-100 font-bold text-[9px] px-1.5 h-5 cursor-pointer hover:bg-emerald-100 transition-colors'
                            onClick={() => setEditingDivisiItemId(item.id)}
                          >
                            {item.divisi.nama}
                          </Badge>
                        </div>
                      ) : (
                        <div className='flex items-center gap-1'>
                          <Select
                            defaultValue={item.divisi_id?.toString()}
                            onValueChange={(val) =>
                              updateItemDivisiMutation.mutate({
                                itemId: item.id,
                                divisiId: parseInt(val),
                              })
                            }
                          >
                            <SelectTrigger className='h-6 text-[9px] w-[80px] bg-white border-neutral-200'>
                              <SelectValue placeholder='Pilih' />
                            </SelectTrigger>
                            <SelectContent>
                              {divisions?.map((d) => (
                                <SelectItem key={d.id} value={d.id.toString()} className='text-[10px]'>
                                  {d.nama}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {editingDivisiItemId === item.id && (
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-5 w-5 text-neutral-400'
                              onClick={() => setEditingDivisiItemId(null)}
                            >
                              <Trash2 className='h-3 w-3' />
                            </Button>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.mdl_item?.link_gambar_kerja ? (
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-6 w-6 text-blue-600 hover:bg-blue-50'
                          asChild
                        >
                          <a
                            href={item.mdl_item.link_gambar_kerja}
                            target='_blank'
                            rel='noopener noreferrer'
                          >
                            <Eye className='h-3.5 w-3.5' />
                          </a>
                        </Button>
                      ) : (
                        <span className='text-[10px] text-muted-foreground italic'>-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.gambar_kerja?.file ? (
                        <div className='flex items-center gap-1'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-6 w-6 text-blue-600 hover:bg-blue-50'
                            asChild
                          >
                            <a
                              href={`${(
                                process.env.NEXT_PUBLIC_API_URL ||
                                'http://localhost:8000'
                              ).replace('/api', '')}/storage/${
                                item.gambar_kerja.file
                              }`}
                              target='_blank'
                              rel='noopener noreferrer'
                            >
                              <Eye className='h-3.5 w-3.5' />
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <div className='flex items-center gap-2'>
                          <span className='text-[10px] text-muted-foreground italic'>-</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.dokubah?.file ? (
                        <div className='flex items-center gap-1'>
                          <div className='h-5 w-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm border border-blue-100'>
                            <CheckCircle2 className='h-3 w-3' />
                          </div>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-6 w-6 text-blue-600 hover:bg-blue-50'
                            asChild
                          >
                            <a
                              href={`${(
                                process.env.NEXT_PUBLIC_API_URL ||
                                'http://localhost:8000'
                              ).replace('/api', '')}/storage/${
                                item.dokubah.file
                              }`}
                              target='_blank'
                              rel='noopener noreferrer'
                            >
                              <Eye className='h-3.5 w-3.5' />
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant='outline'
                          size='sm'
                          className='h-6 text-[9px] border-blue-200 text-blue-600 hover:bg-blue-50 px-1.5'
                          onClick={() => openDokubahUpload(item)}
                        >
                          <Upload className='h-2.5 w-2.5 mr-1' />
                          Doc
                        </Button>
                      )}
                    </TableCell>

                    <TableCell>
                      <div
                        className='cursor-pointer p-1 rounded transition-colors flex flex-col gap-0.5'
                        onClick={() => openStokDialog(item)}
                      >
                        {item.bahan_baku ? (
                          <Badge
                            variant='outline'
                            className={`font-bold text-[9px] h-5 px-1.5 ${
                              item.bahan_baku.ketersediaan_stok === 'Tersedia'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                                : item.bahan_baku.ketersediaan_stok ===
                                  'Belum Tersedia'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {item.bahan_baku.ketersediaan_stok}
                          </Badge>
                        ) : (
                          <span className='text-[9px] text-muted-foreground italic hover:text-blue-600 transition-colors'>
                            Set Stok
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className='cursor-pointer p-1 rounded transition-colors flex flex-col gap-0.5'
                        onClick={() => openBjDialog(item)}
                      >
                        {item.barang_jadi_masuk &&
                        item.barang_jadi_masuk.length > 0 ? (
                          <Badge className='bg-blue-600 text-white border-none font-bold text-[10px] h-5 px-1.5 shadow-sm'>
                            {item.barang_jadi_masuk.reduce(
                              (sum, bj) => sum + Number(bj.jumlah),
                              0
                            )}{' '}
                            / {item.jumlah}
                          </Badge>
                        ) : (
                          <span className='text-[9px] text-muted-foreground italic hover:text-blue-600 transition-colors'>
                            Record
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className='text-right pr-4'>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-7 text-[10px] hover:bg-neutral-100 text-neutral-600 hover:text-blue-600 transition-all font-semibold'
                        asChild
                      >
                        <Link
                          href={`/dashboard/projects-v2/perencanaan/${projectId}/item/${item.id}`}
                        >
                          Ship
                          <ArrowUpRight className='ml-1 h-3 w-3' />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Gambar Kerja Upload Dialog */}
      <AlertDialog open={isGkDialogOpen} onOpenChange={setIsGkDialogOpen}>
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <ImageIcon className='h-5 w-5 text-orange-500' />
              Upload Gambar Kerja
            </AlertDialogTitle>
            <AlertDialogDescription>
              Upload technical drawing for item: <strong>{gkItem?.item}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='gk-file'>File Gambar (PDF/JPG/PNG)</Label>
              <Input
                id='gk-file'
                type='file'
                onChange={(e) => setGkFile(e.target.files?.[0] || null)}
                className='text-xs'
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='gk-start'>Mulai</Label>
                <Input
                  id='gk-start'
                  type='date'
                  value={gkStart}
                  onChange={(e) => setGkStart(e.target.value)}
                  className='text-xs'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='gk-end'>Selesai</Label>
                <Input
                  id='gk-end'
                  type='date'
                  value={gkEnd}
                  onChange={(e) => setGkEnd(e.target.value)}
                  className='text-xs'
                />
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsGkDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <Button
              className='bg-orange-600 hover:bg-orange-700'
              onClick={handleGkUpload}
              disabled={uploadGkMutation.isPending}
            >
              {uploadGkMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <CheckCircle2 className='mr-2 h-4 w-4' />
              )}
              Save Gambar Kerja
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dokubah Upload Dialog */}
      <AlertDialog
        open={isDokubahDialogOpen}
        onOpenChange={setIsDokubahDialogOpen}
      >
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <FileText className='h-5 w-5 text-blue-500' />
              Upload Dokubah
            </AlertDialogTitle>
            <AlertDialogDescription>
              Upload dokubah untuk item: <strong>{dokubahItem?.item}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='dokubah-file'>File (PDF/JPG/PNG/XLS)</Label>
              <Input
                id='dokubah-file'
                type='file'
                onChange={(e) => setDokubahFile(e.target.files?.[0] || null)}
                className='text-xs'
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='dokubah-start'>Mulai</Label>
                <Input
                  id='dokubah-start'
                  type='date'
                  value={dokubahStart}
                  onChange={(e) => setDokubahStart(e.target.value)}
                  className='text-xs'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='dokubah-end'>Selesai</Label>
                <Input
                  id='dokubah-end'
                  type='date'
                  value={dokubahEnd}
                  onChange={(e) => setDokubahEnd(e.target.value)}
                  className='text-xs'
                />
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDokubahDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <Button
              className='bg-blue-600 hover:bg-blue-700'
              onClick={handleDokubahUpload}
              disabled={uploadDokubahMutation.isPending}
            >
              {uploadDokubahMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <CheckCircle2 className='mr-2 h-4 w-4' />
              )}
              Save Dokubah
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stok Material Dialog */}
      <AlertDialog open={isStokDialogOpen} onOpenChange={setIsStokDialogOpen}>
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <Activity className='h-5 w-5 text-emerald-500' />
              Update Stok Material
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ketersediaan stok untuk item: <strong>{stokItem?.item}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='space-y-2'>
              <Label>Ketersediaan Stok</Label>
              <Select value={stokStatus} onValueChange={setStokStatus}>
                <SelectTrigger>
                  <SelectValue placeholder='Pilih Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Tersedia'>Tersedia</SelectItem>
                  <SelectItem value='Belum Tersedia'>Belum Tersedia</SelectItem>
                  <SelectItem value='Mutasi'>Mutasi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Tgl Menerima Dokubah</Label>
                <Input
                  type='date'
                  value={stokMenerima}
                  onChange={(e) => setStokMenerima(e.target.value)}
                  className='text-xs'
                />
              </div>
              <div className='space-y-2'>
                <Label>Tgl Keluar</Label>
                <Input
                  type='date'
                  value={stokKeluar}
                  onChange={(e) => setStokKeluar(e.target.value)}
                  className='text-xs'
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label>PIC</Label>
              <Select value={stokPicId} onValueChange={setStokPicId}>
                <SelectTrigger>
                  <SelectValue placeholder='Pilih PIC' />
                </SelectTrigger>
                <SelectContent>
                  {pics?.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.nama} ({p.jabatan})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsStokDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <Button
              className='bg-emerald-600 hover:bg-emerald-700'
              onClick={handleStokUpdate}
              disabled={updateStokMutation.isPending}
            >
              {updateStokMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <CheckCircle2 className='mr-2 h-4 w-4' />
              )}
              Update Stok
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Barang Jadi Masuk Dialog */}
      <AlertDialog open={isBjDialogOpen} onOpenChange={setIsBjDialogOpen}>
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <ListChecks className='h-5 w-5 text-blue-500' />
              Record Barang Masuk Lengkap
            </AlertDialogTitle>
            <AlertDialogDescription>
              Catat barang yang sudah masuk lengkap untuk item:{' '}
              <strong>{bjItem?.item}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='grid gap-4 py-4'>
            {bjItem?.barang_jadi_masuk &&
              bjItem.barang_jadi_masuk.length > 0 && (
                <div className='bg-neutral-50 rounded-lg p-3 border border-neutral-100 mb-2'>
                  <Label className='text-[10px] uppercase text-neutral-500 font-bold mb-2 block'>
                    Riwayat Masuk Sebelumnya
                  </Label>
                  <div className='space-y-2'>
                    {bjItem.barang_jadi_masuk.map((record, i) => (
                      <div
                        key={i}
                        className='flex justify-between text-xs border-b border-neutral-100 last:border-0 pb-1 last:pb-0'
                      >
                        <span className='text-neutral-600'>
                          {format(new Date(record.tanggal), 'dd MMM yyyy')}
                        </span>
                        <span className='font-bold text-blue-600'>
                          +{record.jumlah}
                        </span>
                      </div>
                    ))}
                    <div className='flex justify-between text-xs pt-1 font-bold border-t border-neutral-200'>
                      <span>Total Saat Ini</span>
                      <span className='text-neutral-900'>
                        {bjItem.barang_jadi_masuk.reduce(
                          (sum, r) => sum + r.jumlah,
                          0
                        )}{' '}
                        / {bjItem.jumlah}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            <div className='space-y-2'>
              <Label>Tanggal Masuk</Label>
              <Input
                type='date'
                value={bjTanggal}
                onChange={(e) => setBjTanggal(e.target.value)}
                className='text-xs'
              />
            </div>
            <div className='space-y-2'>
              <Label>Jumlah Barang Baru</Label>
              <div className='flex items-center gap-4'>
                <Input
                  type='number'
                  value={bjJumlah === 0 ? '' : bjJumlah}
                  onChange={(e) => setBjJumlah(parseInt(e.target.value) || 0)}
                  className='font-bold'
                  max={
                    bjItem
                      ? bjItem.jumlah -
                        (bjItem.barang_jadi_masuk?.reduce(
                          (sum, bj) => sum + bj.jumlah,
                          0
                        ) || 0)
                      : undefined
                  }
                />
                <span className='text-sm text-muted-foreground whitespace-nowrap'>
                  Sisa:{' '}
                  {(bjItem?.jumlah || 0) -
                    (bjItem?.barang_jadi_masuk?.reduce(
                      (sum, bj) => sum + bj.jumlah,
                      0
                    ) || 0)}
                </span>
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsBjDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <Button
              className='bg-blue-600 hover:bg-blue-700'
              onClick={handleBjUpdate}
              disabled={
                updateBjMutation.isPending ||
                bjJumlah < 1 ||
                bjJumlah >
                  (bjItem?.jumlah || 0) -
                    (bjItem?.barang_jadi_masuk?.reduce(
                      (sum, bj) => sum + bj.jumlah,
                      0
                    ) || 0)
              }
            >
              {updateBjMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <CheckCircle2 className='mr-2 h-4 w-4' />
              )}
              Record Barang
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Order Gambar Kerja Dialog */}
      <AlertDialog open={isOrderGkDialogOpen} onOpenChange={setIsOrderGkDialogOpen}>
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <ImageIcon className='h-5 w-5 text-orange-500' />
              Order Gambar Kerja
            </AlertDialogTitle>
            <AlertDialogDescription>
              Upload file brief desain dan tentukan target penyelesaian untuk project ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='space-y-2'>
              <Label>File Brief / Lampiran</Label>
              <Input
                type='file'
                onChange={(e) => setOrderGkFile(e.target.files?.[0] || null)}
                className='text-xs'
              />
              <p className='text-[10px] text-muted-foreground'>Format: PDF, JPG, PNG, DOC, XLS (Max 10MB)</p>
            </div>
            <div className='space-y-2'>
              <Label>Target Selesai</Label>
              <Input
                type='date'
                value={orderGkTarget}
                onChange={(e) => setOrderGkTarget(e.target.value)}
                className='text-xs'
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsOrderGkDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <Button
              className='bg-orange-600 hover:bg-orange-700'
              onClick={handleOrderGkUpload}
              disabled={uploadOrderGkMutation.isPending || !orderGkFile || !orderGkTarget}
            >
              {uploadOrderGkMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Upload className='mr-2 h-4 w-4' />
              )}
              Submit Order
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
