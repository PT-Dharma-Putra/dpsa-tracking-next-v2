'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  Calendar,
  FileText,
  Upload,
  Plus,
  Trash2,
  Image as ImageIcon,
  Video,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Layers,
  MapPin,
  Eye,
  X,
  Loader2,
  Sliders,
  Send,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

import {
  projectV2Service,
  ProjectItemV2,
  SiteReadiness,
} from '@/features/projects/services/project-v2-service';
import { useAuthStore } from '@/lib/auth-store';
import { cn } from '@/lib/utils';

export default function ProjectKesiapanLokasiPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const projectId = parseInt(params.id as string);

  // 1. Fetch Project Data
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ['projects-v2', projectId],
    queryFn: () => projectV2Service.getProject(projectId),
  });

  // 2. Fetch Project Items for Room suggestions
  const { data: projectItems } = useQuery({
    queryKey: ['project-v2-items', projectId],
    queryFn: () => projectV2Service.getProjectItems(projectId),
  });

  // 3. Fetch Site Readiness logs from Backend
  const {
    data: readinessResponse,
    isLoading: isLoadingReadiness,
  } = useQuery({
    queryKey: ['site-readiness', projectId],
    queryFn: () => projectV2Service.getSiteReadiness(projectId),
  });

  const logs: SiteReadiness[] = readinessResponse?.data || [];
  const currentPercentage = readinessResponse?.readiness_percentage ?? project?.readiness_percentage ?? 0;

  // Extract unique room names from project items
  const existingRooms = React.useMemo(() => {
    if (!projectItems || !Array.isArray(projectItems)) return [];
    const rooms = projectItems
      .map((item: ProjectItemV2) => item.ruang?.trim())
      .filter((r): r is string => !!r && r.length > 0);
    return Array.from(new Set(rooms));
  }, [projectItems]);

  // Form state
  const [inputPercentage, setInputPercentage] = React.useState<number>(currentPercentage);
  const [selectedRuang, setSelectedRuang] = React.useState<string>('');
  const [customRuang, setCustomRuang] = React.useState<string>('');
  const [isCustomRuang, setIsCustomRuang] = React.useState<boolean>(false);
  const [keterangan, setKeterangan] = React.useState<string>('');

  // Sync initial input percentage when readiness data loads
  React.useEffect(() => {
    if (readinessResponse?.readiness_percentage !== undefined) {
      setInputPercentage(readinessResponse.readiness_percentage);
    }
  }, [readinessResponse?.readiness_percentage]);

  // Media upload state
  const [selectedPhotos, setSelectedPhotos] = React.useState<Array<{ file: File; preview: string; name: string }>>([]);
  const [selectedVideos, setSelectedVideos] = React.useState<Array<{ file: File; preview: string; name: string; size: number }>>([]);

  // Lightbox preview modal state
  const [lightboxImage, setLightboxImage] = React.useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = React.useState<string>('');

  // Delete Log Dialog
  const [logToDelete, setLogToDelete] = React.useState<number | null>(null);

  // Form Section Ref for smooth scroll
  const formRef = React.useRef<HTMLDivElement>(null);

  // Mutation: Create Site Readiness
  const createMutation = useMutation({
    mutationFn: (payload: {
      persentase: number;
      ruang: string;
      keterangan: string;
      photos?: File[];
      videos?: File[];
    }) => projectV2Service.createSiteReadiness(projectId, payload),
    onSuccess: () => {
      toast.success('Kesiapan lokasi berhasil disimpan');
      queryClient.invalidateQueries({ queryKey: ['site-readiness', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects-v2', projectId] });

      // Reset form
      setKeterangan('');
      setSelectedPhotos([]);
      setSelectedVideos([]);
      if (isCustomRuang) setCustomRuang('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan kesiapan lokasi');
    },
  });

  // Mutation: Delete Site Readiness
  const deleteMutation = useMutation({
    mutationFn: (logId: number) => projectV2Service.deleteSiteReadiness(logId),
    onSuccess: () => {
      toast.success('Riwayat kesiapan lokasi berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['site-readiness', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects-v2', projectId] });
      setLogToDelete(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Gagal menghapus riwayat');
    },
  });

  // Handle Photo selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPhotos: Array<{ file: File; preview: string; name: string }> = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`File "${file.name}" bukan format gambar yang valid`);
        return;
      }
      const preview = URL.createObjectURL(file);
      newPhotos.push({ file, preview, name: file.name });
    });

    setSelectedPhotos((prev) => [...prev, ...newPhotos]);
    e.target.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    setSelectedPhotos((prev) => {
      const target = prev[index];
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Handle Video selection
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newVideos: Array<{ file: File; preview: string; name: string; size: number }> = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('video/')) {
        toast.error(`File "${file.name}" bukan format video yang valid`);
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.warning(`Ukuran video "${file.name}" lebih dari 100MB.`);
      }
      const preview = URL.createObjectURL(file);
      newVideos.push({ file, preview, name: file.name, size: file.size });
    });

    setSelectedVideos((prev) => [...prev, ...newVideos]);
    e.target.value = '';
  };

  const handleRemoveVideo = (index: number) => {
    setSelectedVideos((prev) => {
      const target = prev[index];
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Submit New Readiness Log
  const handleSubmitLog = (e: React.FormEvent) => {
    e.preventDefault();

    const finalRuang = isCustomRuang ? customRuang.trim() : (selectedRuang === 'custom' ? customRuang.trim() : selectedRuang.trim());

    if (!finalRuang) {
      toast.error('Silakan tentukan nama ruang / area kesiapan');
      return;
    }

    if (!keterangan.trim()) {
      toast.error('Silakan isi catatan / keterangan kondisi kesiapan lapangan');
      return;
    }

    createMutation.mutate({
      persentase: inputPercentage,
      ruang: finalRuang,
      keterangan: keterangan.trim(),
      photos: selectedPhotos.map((p) => p.file),
      videos: selectedVideos.map((v) => v.file),
    });
  };

  // Confirm Delete
  const handleConfirmDeleteLog = () => {
    if (logToDelete !== null) {
      deleteMutation.mutate(logToDelete);
    }
  };

  // Get status metadata based on percentage
  const getReadinessStatusInfo = (pct: number) => {
    if (pct === 100) {
      return {
        label: 'Lokasi Siap 100% (Ready for Delivery)',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-300 ring-emerald-500/20',
        badgeBg: 'bg-emerald-600',
        progressBar: 'bg-emerald-500',
        icon: CheckCircle2,
      };
    }
    if (pct >= 75) {
      return {
        label: 'Sebagian Besar Siap (Final Finishing)',
        color: 'text-blue-700 bg-blue-50 border-blue-300 ring-blue-500/20',
        badgeBg: 'bg-blue-600',
        progressBar: 'bg-blue-500',
        icon: Sparkles,
      };
    }
    if (pct >= 40) {
      return {
        label: 'Dalam Pengerjaan Konstruksi / MEP',
        color: 'text-amber-700 bg-amber-50 border-amber-300 ring-amber-500/20',
        badgeBg: 'bg-amber-600',
        progressBar: 'bg-amber-500',
        icon: Clock,
      };
    }
    return {
      label: 'Tahap Awal / Belum Siap',
      color: 'text-rose-700 bg-rose-50 border-rose-300 ring-rose-500/20',
      badgeBg: 'bg-rose-600',
      progressBar: 'bg-rose-500',
      icon: AlertTriangle,
    };
  };

  const statusInfo = getReadinessStatusInfo(currentPercentage);
  const StatusIcon = statusInfo.icon;

  if (isLoadingProject || isLoadingReadiness) {
    return (
      <div className='flex h-[400px] items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-neutral-400' />
      </div>
    );
  }

  if (!project) {
    return (
      <div className='p-8 text-center text-muted-foreground'>
        Project tidak ditemukan.
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-6 p-6 max-w-[1600px] mx-auto w-full'>
      {/* Top Header & Breadcrumb */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className='flex items-start gap-4'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => router.push('/dashboard/projects-v2/marketing')}
            className='rounded-full hover:bg-neutral-100 mt-0.5'
          >
            <ArrowLeft className='h-5 w-5' />
          </Button>
          <div className='space-y-1'>
            <div className='flex items-center gap-2'>
              <h1 className='text-2xl font-bold tracking-tight text-neutral-900'>
                {project.name}
              </h1>
              <Badge variant='outline' className='text-xs font-semibold px-2 py-0.5 border-neutral-300 text-neutral-700'>
                Kesiapan Lokasi
              </Badge>
            </div>
            <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600'>
              {project.client?.name && (
                <span className='flex items-center gap-1.5'>
                  <Building2 className='h-3.5 w-3.5 text-neutral-400' />
                  <span className='font-medium text-neutral-800'>{project.client.name}</span>
                </span>
              )}
              {(project.spk_number || project.spk?.nomor_spk) && (
                <span className='flex items-center gap-1.5'>
                  <FileText className='h-3.5 w-3.5 text-neutral-400' />
                  <span>{project.spk_number || project.spk?.nomor_spk}</span>
                </span>
              )}
              {project.deadline && (
                <span className='flex items-center gap-1.5'>
                  <Calendar className='h-3.5 w-3.5 text-neutral-400' />
                  <span>Deadline: {format(new Date(project.deadline), 'dd MMM yyyy', { locale: idLocale })}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Tabs Navigation */}
        <div className='flex items-center gap-2 self-start sm:self-auto bg-neutral-100 p-1 rounded-xl border border-neutral-200'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => router.push(`/dashboard/projects-v2/marketing/${projectId}/items`)}
            className='text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-white rounded-lg h-8'
          >
            <Layers className='h-3.5 w-3.5 mr-1.5 text-neutral-500' />
            Workflow & Items
          </Button>
          <Button
            variant='default'
            size='sm'
            className='text-xs font-semibold bg-white text-neutral-900 shadow-sm rounded-lg h-8 hover:bg-white hover:text-neutral-900'
          >
            <MapPin className='h-3.5 w-3.5 mr-1.5 text-orange-600' />
            Kesiapan Lokasi
          </Button>
        </div>
      </div>

      {/* Overview Banner Card */}
      <Card className='border border-neutral-200 shadow-sm bg-gradient-to-br from-white via-neutral-50/50 to-neutral-100/30 overflow-hidden'>
        <CardContent className='p-6'>
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-center'>
            {/* Left Column: Big Percentage Status */}
            <div className='lg:col-span-4 flex flex-col gap-3'>
              <div className='flex items-center justify-between'>
                <span className='text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5'>
                  <MapPin className='h-4 w-4 text-orange-600' />
                  Status Kesiapan Lokasi
                </span>
                <span className='text-3xl font-extrabold tracking-tight text-neutral-900'>
                  {currentPercentage}%
                </span>
              </div>

              {/* Visual Progress Bar */}
              <div className='w-full bg-neutral-200 h-3.5 rounded-full overflow-hidden p-0.5 border border-neutral-300 shadow-inner'>
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700 ease-out',
                    statusInfo.progressBar
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, currentPercentage))}%` }}
                />
              </div>

              <div className='flex items-center gap-2 mt-1'>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border shadow-xs',
                    statusInfo.color
                  )}
                >
                  <StatusIcon className='h-3.5 w-3.5' />
                  {statusInfo.label}
                </span>
              </div>
            </div>

            {/* Middle Column: Stats info */}
            <div className='lg:col-span-5 grid grid-cols-2 gap-4 border-y lg:border-y-0 lg:border-x border-neutral-200 py-4 lg:py-0 lg:px-6'>
              <div className='space-y-1'>
                <p className='text-[11px] font-medium text-neutral-500 uppercase tracking-wider'>
                  Total Riwayat Update
                </p>
                <p className='text-2xl font-bold text-neutral-900'>
                  {logs.length} <span className='text-xs font-normal text-neutral-500'>catatan</span>
                </p>
                <p className='text-[11px] text-neutral-500'>
                  Setiap pembaruan tersimpan rapi di database
                </p>
              </div>

              <div className='space-y-1'>
                <p className='text-[11px] font-medium text-neutral-500 uppercase tracking-wider'>
                  Pembaruan Terakhir
                </p>
                {logs.length > 0 ? (
                  <>
                    <p className='text-xs font-semibold text-neutral-900 truncate'>
                      {format(new Date(logs[0].created_at), 'dd MMM yyyy, HH:mm', { locale: idLocale })}
                    </p>
                    <p className='text-[11px] text-neutral-500 truncate'>
                      Oleh: <span className='font-medium text-neutral-700'>{logs[0].user?.name || 'Marketing'}</span>
                    </p>
                  </>
                ) : (
                  <p className='text-xs text-neutral-400 italic'>Belum ada data</p>
                )}
              </div>
            </div>

            {/* Right Column: CTA */}
            <div className='lg:col-span-3 flex flex-col justify-center items-start lg:items-end gap-2'>
              <Button
                onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className='bg-orange-600 hover:bg-orange-700 text-white font-medium shadow-sm w-full lg:w-auto'
              >
                <Plus className='h-4 w-4 mr-1.5' />
                Tambah Update Kesiapan
              </Button>
              <p className='text-[11px] text-neutral-500 text-left lg:text-right'>
                Marketing dapat mengupdate persentase, ruang, foto & video kapan saja.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid: Form Input (Left) & Log History (Right) */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
        {/* LEFT COLUMN: Input Form */}
        <div className='lg:col-span-5 flex flex-col gap-6' ref={formRef}>
          <Card className='border border-neutral-200 shadow-sm sticky top-6'>
            <CardHeader className='pb-4 border-b border-neutral-100 bg-neutral-50/50 rounded-t-xl'>
              <div className='flex items-center justify-between'>
                <div className='space-y-1'>
                  <CardTitle className='text-lg font-bold text-neutral-900 flex items-center gap-2'>
                    <Sliders className='h-5 w-5 text-orange-600' />
                    Input Kesiapan Lokasi
                  </CardTitle>
                  <CardDescription className='text-xs'>
                    Isi persentase kesiapan terkini beserta bukti dokumentasi lapangan.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <form onSubmit={handleSubmitLog}>
              <CardContent className='p-5 space-y-5'>
                {/* 1. Persentase Kesiapan Slider + Number Input */}
                <div className='space-y-2.5 p-4 rounded-xl bg-orange-50/50 border border-orange-100'>
                  <div className='flex items-center justify-between'>
                    <Label htmlFor='pct-input' className='text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5'>
                      <span>Persentase Kesiapan Terkini</span>
                      <span className='text-rose-500'>*</span>
                    </Label>
                    <div className='flex items-center gap-1.5'>
                      <Input
                        id='pct-input'
                        type='number'
                        min={0}
                        max={100}
                        value={inputPercentage}
                        onChange={(e) => {
                          const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                          setInputPercentage(val);
                        }}
                        className='w-16 h-8 text-center font-bold text-sm bg-white border-orange-300'
                      />
                      <span className='text-sm font-bold text-neutral-700'>%</span>
                    </div>
                  </div>

                  {/* Slider Component */}
                  <Slider
                    value={[inputPercentage]}
                    onValueChange={(vals) => setInputPercentage(vals[0])}
                    max={100}
                    step={1}
                    className='py-2 cursor-pointer'
                  />

                  <div className='flex justify-between text-[10px] text-neutral-500 font-medium'>
                    <span>0% (Mulai)</span>
                    <span>50% (MEP / Finishing)</span>
                    <span>100% (Siap Kirim)</span>
                  </div>
                </div>

                {/* 2. Ruang / Area Input */}
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Label className='text-xs font-semibold text-neutral-800 flex items-center gap-1.5'>
                      <MapPin className='h-3.5 w-3.5 text-neutral-500' />
                      <span>Ruang / Area Lokasi</span>
                      <span className='text-rose-500'>*</span>
                    </Label>
                    <button
                      type='button'
                      onClick={() => setIsCustomRuang(!isCustomRuang)}
                      className='text-[11px] text-orange-600 hover:text-orange-700 hover:underline font-medium'
                    >
                      {isCustomRuang ? 'Pilih dari Ruang Proyek' : '+ Tulis Ruang Manual'}
                    </button>
                  </div>

                  {isCustomRuang || existingRooms.length === 0 ? (
                    <Input
                      placeholder='Contoh: Ruang Direksi Lt. 2, Area Lobby, Loading Dock...'
                      value={customRuang}
                      onChange={(e) => setCustomRuang(e.target.value)}
                      className='text-xs'
                    />
                  ) : (
                    <Select
                      value={selectedRuang}
                      onValueChange={(val) => {
                        if (val === 'custom') {
                          setIsCustomRuang(true);
                        } else {
                          setSelectedRuang(val);
                        }
                      }}
                    >
                      <SelectTrigger className='text-xs'>
                        <SelectValue placeholder='Pilih ruang dari item proyek...' />
                      </SelectTrigger>
                      <SelectContent>
                        {existingRooms.map((room) => (
                          <SelectItem key={room} value={room} className='text-xs'>
                            {room}
                          </SelectItem>
                        ))}
                        <SelectItem value='custom' className='text-xs font-semibold text-orange-600'>
                          + Tulis Ruang Lain (Manual)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <p className='text-[11px] text-neutral-500'>
                    Tentukan ruang/area spesifik yang diupdate atau area proyek secara umum.
                  </p>
                </div>

                {/* 3. Keterangan / Catatan Kondisi Lapangan */}
                <div className='space-y-2'>
                  <Label htmlFor='keterangan' className='text-xs font-semibold text-neutral-800 flex items-center gap-1.5'>
                    <FileText className='h-3.5 w-3.5 text-neutral-500' />
                    <span>Catatan & Keterangan Lapangan</span>
                    <span className='text-rose-500'>*</span>
                  </Label>
                  <Textarea
                    id='keterangan'
                    rows={4}
                    placeholder='Jelaskan kondisi fisik lokasi saat ini, kendala di lapangan, atau catatan khusus sebelum pengiriman barang...'
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    className='text-xs resize-none'
                  />
                </div>

                {/* 4. Upload Foto */}
                <div className='space-y-2.5'>
                  <div className='flex items-center justify-between'>
                    <Label className='text-xs font-semibold text-neutral-800 flex items-center gap-1.5'>
                      <ImageIcon className='h-3.5 w-3.5 text-neutral-500' />
                      <span>Dokumentasi Foto Lapangan</span>
                    </Label>
                    <span className='text-[11px] text-neutral-500 font-medium'>
                      {selectedPhotos.length} foto dipilih
                    </span>
                  </div>

                  {/* Foto Input Selector */}
                  <label className='flex flex-col items-center justify-center p-4 border-2 border-dashed border-neutral-200 hover:border-orange-400 rounded-xl cursor-pointer bg-neutral-50/50 hover:bg-orange-50/30 transition-all'>
                    <div className='flex flex-col items-center text-center gap-1'>
                      <Upload className='h-5 w-5 text-neutral-400' />
                      <span className='text-xs font-medium text-neutral-700'>
                        Klik untuk upload foto (Bisa multiple)
                      </span>
                      <span className='text-[10px] text-neutral-400'>
                        Format: JPG, PNG, WEBP (Maks 20MB/foto)
                      </span>
                    </div>
                    <input
                      type='file'
                      multiple
                      accept='image/*'
                      onChange={handlePhotoSelect}
                      className='hidden'
                    />
                  </label>

                  {/* Thumbnail Previews */}
                  {selectedPhotos.length > 0 && (
                    <div className='grid grid-cols-3 gap-2 pt-1'>
                      {selectedPhotos.map((photo, idx) => (
                        <div
                          key={idx}
                          className='relative group aspect-square rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100'
                        >
                          <img
                            src={photo.preview}
                            alt={photo.name}
                            className='w-full h-full object-cover'
                          />
                          <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5'>
                            <button
                              type='button'
                              onClick={() => {
                                setLightboxImage(photo.preview);
                                setLightboxTitle(photo.name);
                              }}
                              className='p-1 rounded-full bg-white/80 hover:bg-white text-neutral-800'
                              title='Preview'
                            >
                              <Eye className='h-3.5 w-3.5' />
                            </button>
                            <button
                              type='button'
                              onClick={() => handleRemovePhoto(idx)}
                              className='p-1 rounded-full bg-rose-500/80 hover:bg-rose-600 text-white'
                              title='Hapus'
                            >
                              <X className='h-3.5 w-3.5' />
                            </button>
                          </div>
                          <span className='absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white px-1 py-0.5 truncate text-center'>
                            {photo.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. Upload Video */}
                <div className='space-y-2.5'>
                  <div className='flex items-center justify-between'>
                    <Label className='text-xs font-semibold text-neutral-800 flex items-center gap-1.5'>
                      <Video className='h-3.5 w-3.5 text-neutral-500' />
                      <span>Dokumentasi Video (Opsional)</span>
                    </Label>
                    <span className='text-[11px] text-neutral-500 font-medium'>
                      {selectedVideos.length} video dipilih
                    </span>
                  </div>

                  {/* Video Input Selector */}
                  <label className='flex flex-col items-center justify-center p-4 border-2 border-dashed border-neutral-200 hover:border-orange-400 rounded-xl cursor-pointer bg-neutral-50/50 hover:bg-orange-50/30 transition-all'>
                    <div className='flex flex-col items-center text-center gap-1'>
                      <Video className='h-5 w-5 text-neutral-400' />
                      <span className='text-xs font-medium text-neutral-700'>
                        Klik untuk upload video
                      </span>
                      <span className='text-[10px] text-neutral-400'>
                        Format: MP4, MOV, WEBM (Maks 100MB/video)
                      </span>
                    </div>
                    <input
                      type='file'
                      multiple
                      accept='video/*'
                      onChange={handleVideoSelect}
                      className='hidden'
                    />
                  </label>

                  {/* Video Previews */}
                  {selectedVideos.length > 0 && (
                    <div className='space-y-2 pt-1'>
                      {selectedVideos.map((video, idx) => (
                        <div
                          key={idx}
                          className='flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 bg-neutral-50'
                        >
                          <div className='flex items-center gap-2.5 truncate'>
                            <div className='h-8 w-8 rounded bg-orange-100 text-orange-600 flex items-center justify-center shrink-0'>
                              <Video className='h-4 w-4' />
                            </div>
                            <div className='truncate'>
                              <p className='text-xs font-medium text-neutral-800 truncate'>
                                {video.name}
                              </p>
                              <p className='text-[10px] text-neutral-500'>
                                {(video.size / (1024 * 1024)).toFixed(1)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            type='button'
                            onClick={() => handleRemoveVideo(idx)}
                            className='text-neutral-400 hover:text-rose-600 p-1 rounded transition-colors'
                          >
                            <Trash2 className='h-4 w-4' />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className='p-5 pt-0 border-t border-neutral-100 bg-neutral-50/30 rounded-b-xl flex gap-2'>
                <Button
                  type='submit'
                  disabled={createMutation.isPending}
                  className='w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs h-9 shadow-sm'
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                      Menyimpan ke Server...
                    </>
                  ) : (
                    <>
                      <Send className='h-3.5 w-3.5 mr-2' />
                      Simpan Kesiapan Lokasi
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* RIGHT COLUMN: History / Log Timeline */}
        <div className='lg:col-span-7 flex flex-col gap-4'>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <h2 className='text-lg font-bold text-neutral-900 flex items-center gap-2'>
                <Clock className='h-5 w-5 text-neutral-600' />
                Riwayat Kesiapan Lokasi
              </h2>
              <p className='text-xs text-neutral-500'>
                Kronologis pemantauan dan dokumentasi progres lapangan proyek.
              </p>
            </div>
            <Badge variant='outline' className='text-xs font-semibold px-2.5 py-1 bg-white border-neutral-300'>
              {logs.length} Update Tercatat
            </Badge>
          </div>

          {/* Timeline List */}
          {logs.length === 0 ? (
            <Card className='border border-dashed border-neutral-300 p-12 text-center bg-neutral-50/50'>
              <div className='flex flex-col items-center justify-center gap-3'>
                <div className='h-12 w-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center'>
                  <MapPin className='h-6 w-6' />
                </div>
                <div>
                  <h3 className='text-sm font-bold text-neutral-800'>Belum Ada Riwayat Kesiapan</h3>
                  <p className='text-xs text-neutral-500 mt-1 max-w-sm'>
                    Gunakan form di sebelah kiri untuk menambahkan pembaruan status kesiapan lokasi pertama kali.
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <div className='space-y-4'>
              {logs.map((log, index) => {
                const logStatus = getReadinessStatusInfo(log.persentase);

                return (
                  <Card
                    key={log.id}
                    className='border border-neutral-200 shadow-sm hover:shadow-md transition-all overflow-hidden bg-white'
                  >
                    {/* Header Card */}
                    <CardHeader className='p-4 pb-3 border-b border-neutral-100 bg-neutral-50/40'>
                      <div className='flex items-start justify-between gap-3'>
                        <div className='flex items-center gap-3'>
                          {/* Percentage Badge */}
                          <div
                            className={cn(
                              'h-10 w-12 rounded-xl flex flex-col items-center justify-center font-extrabold text-white text-sm shadow-xs shrink-0',
                              logStatus.badgeBg
                            )}
                          >
                            <span>{log.persentase}%</span>
                          </div>

                          <div>
                            <div className='flex items-center gap-2 flex-wrap'>
                              <h3 className='text-sm font-bold text-neutral-900 flex items-center gap-1.5'>
                                <MapPin className='h-3.5 w-3.5 text-orange-600 shrink-0' />
                                {log.ruang}
                              </h3>
                              {index === 0 && (
                                <span className='text-[10px] font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full'>
                                  Terkini
                                </span>
                              )}
                            </div>
                            <div className='flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5'>
                              <span>{format(new Date(log.created_at), 'EEEE, dd MMMM yyyy - HH:mm', { locale: idLocale })}</span>
                              <span>•</span>
                              <span>Oleh: <strong className='text-neutral-700'>{log.user?.name || 'Marketing'}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Action Delete */}
                        <Button
                          variant='ghost'
                          size='icon'
                          disabled={deleteMutation.isPending}
                          onClick={() => setLogToDelete(log.id)}
                          className='h-7 w-7 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg shrink-0'
                          title='Hapus log'
                        >
                          <Trash2 className='h-3.5 w-3.5' />
                        </Button>
                      </div>
                    </CardHeader>

                    {/* Content */}
                    <CardContent className='p-4 space-y-4'>
                      {/* Description */}
                      <p className='text-xs leading-relaxed text-neutral-800 whitespace-pre-line'>
                        {log.keterangan}
                      </p>

                      {/* Media (Photos & Videos) */}
                      {log.media && log.media.length > 0 && (
                        <div className='space-y-3 pt-2 border-t border-neutral-100'>
                          {/* Photos */}
                          {log.media.filter((m) => m.file_type === 'image').length > 0 && (
                            <div className='space-y-1.5'>
                              <p className='text-[11px] font-semibold text-neutral-500 flex items-center gap-1.5'>
                                <ImageIcon className='h-3.5 w-3.5' />
                                Foto Lapangan:
                              </p>
                              <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5'>
                                {log.media
                                  .filter((m) => m.file_type === 'image')
                                  .map((img) => (
                                    <div
                                      key={img.id}
                                      onClick={() => {
                                        setLightboxImage(img.url);
                                        setLightboxTitle(img.file_name || 'Foto Lapangan');
                                      }}
                                      className='group relative aspect-video sm:aspect-square rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100 cursor-pointer shadow-xs hover:border-orange-400 transition-all'
                                    >
                                      <img
                                        src={img.url}
                                        alt={img.file_name || 'Foto'}
                                        className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                                      />
                                      <div className='absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                                        <Eye className='h-5 w-5 text-white' />
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Videos */}
                          {log.media.filter((m) => m.file_type === 'video').length > 0 && (
                            <div className='space-y-1.5'>
                              <p className='text-[11px] font-semibold text-neutral-500 flex items-center gap-1.5'>
                                <Video className='h-3.5 w-3.5' />
                                Video Dokumentasi:
                              </p>
                              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                                {log.media
                                  .filter((m) => m.file_type === 'video')
                                  .map((vid) => (
                                    <div
                                      key={vid.id}
                                      className='rounded-lg overflow-hidden border border-neutral-200 bg-black aspect-video'
                                    >
                                      <video
                                        src={vid.url}
                                        controls
                                        playsInline
                                        className='w-full h-full object-contain'
                                      />
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal for Fullsize Photo Preview */}
      <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className='max-w-4xl p-2 bg-neutral-950 border-neutral-800 text-white'>
          <DialogHeader className='px-4 pt-2 pb-0'>
            <DialogTitle className='text-sm font-medium text-neutral-300 truncate'>
              {lightboxTitle || 'Foto Kesiapan Lokasi'}
            </DialogTitle>
          </DialogHeader>
          <div className='relative w-full flex items-center justify-center p-2 max-h-[80vh] overflow-hidden'>
            {lightboxImage && (
              <img
                src={lightboxImage}
                alt={lightboxTitle || 'Preview'}
                className='max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl'
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={logToDelete !== null} onOpenChange={() => setLogToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Catatan Kesiapan Lokasi?</AlertDialogTitle>
            <AlertDialogDescription>
              Catatan dan bukti dokumentasi yang dihapus dari server tidak dapat dikembalikan lagi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={handleConfirmDeleteLog}
              className='bg-rose-600 hover:bg-rose-700 text-white'
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  Menghapus...
                </>
              ) : (
                'Ya, Hapus'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
