'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  Upload,
  Plus,
  Trash2,
  Image as ImageIcon,
  Video,
  Clock,
  Eye,
  X,
  Loader2,
  Building2,
  FileText,
  Calendar,
  History,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { cn } from '@/lib/utils';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  projectV2Service,
  ProduksiDocumentation,
} from '@/features/projects/services/project-v2-service';

interface ProduksiDocumentationDialogProps {
  projectId: number | null;
  isOpen: boolean;
  onClose: () => void;
  projectName?: string;
  clientName?: string;
  spkNumber?: string;
  deadline?: string | null;
  currentProgres?: number;
  isViewOnly?: boolean;
}

export function ProduksiDocumentationDialog({
  projectId,
  isOpen,
  onClose,
  projectName,
  clientName,
  spkNumber,
  deadline,
  currentProgres = 0,
  isViewOnly = false,
}: ProduksiDocumentationDialogProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState<'upload' | 'history'>(
    isViewOnly ? 'history' : 'upload'
  );

  // Form states
  const [persentase, setPersentase] = React.useState<number>(
    currentProgres >= 80 ? 80 : 50
  );
  const [keterangan, setKeterangan] = React.useState<string>('');
  const [selectedPhotos, setSelectedPhotos] = React.useState<
    Array<{ file: File; preview: string; name: string }>
  >([]);
  const [selectedVideos, setSelectedVideos] = React.useState<
    Array<{ file: File; preview: string; name: string; size: number }>
  >([]);

  // Lightbox preview modal state
  const [lightboxImage, setLightboxImage] = React.useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = React.useState<string>('');

  // Delete Log Dialog state
  const [docToDelete, setDocToDelete] = React.useState<number | null>(null);

  // Sync initial state when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      if (isViewOnly) {
        setActiveTab('history');
      } else {
        setActiveTab('upload');
      }
      setPersentase(currentProgres >= 80 ? 80 : 50);
    }
  }, [isOpen, isViewOnly, currentProgres]);

  // Fetch documentation logs from Backend
  const { data: docResponse, isLoading: isLoadingDocs } = useQuery({
    queryKey: ['produksi-documentation', projectId],
    queryFn: () =>
      projectId ? projectV2Service.getProduksiDocumentation(projectId) : null,
    enabled: isOpen && !!projectId,
  });

  const logs: ProduksiDocumentation[] = docResponse?.data || [];

  // Mutation: Create Documentation Log
  const createMutation = useMutation({
    mutationFn: (payload: {
      persentase: number;
      keterangan?: string;
      photos?: File[];
      videos?: File[];
    }) => {
      if (!projectId) throw new Error('Project ID required');
      return projectV2Service.createProduksiDocumentation(projectId, payload);
    },
    onSuccess: () => {
      toast.success('Foto progres produksi berhasil diunggah');
      queryClient.invalidateQueries({
        queryKey: ['produksi-documentation', projectId],
      });
      queryClient.invalidateQueries({ queryKey: ['projects-v2'] });

      // Clean up preview URLs
      selectedPhotos.forEach((p) => URL.revokeObjectURL(p.preview));
      selectedVideos.forEach((v) => URL.revokeObjectURL(v.preview));

      // Reset form
      setKeterangan('');
      setSelectedPhotos([]);
      setSelectedVideos([]);

      // Switch to history tab to show the uploaded photos
      setActiveTab('history');
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || 'Gagal mengunggah dokumentasi progres'
      );
    },
  });

  // Mutation: Delete Documentation Log
  const deleteMutation = useMutation({
    mutationFn: (id: number) => projectV2Service.deleteProduksiDocumentation(id),
    onSuccess: () => {
      toast.success('Dokumentasi progres produksi berhasil dihapus');
      queryClient.invalidateQueries({
        queryKey: ['produksi-documentation', projectId],
      });
      setDocToDelete(null);
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || 'Gagal menghapus dokumentasi'
      );
    },
  });

  // Handle Photo selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newPhotos = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));
    setSelectedPhotos((prev) => [...prev, ...newPhotos]);
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setSelectedPhotos((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Handle Video selection
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newVideos = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
    }));
    setSelectedVideos((prev) => [...prev, ...newVideos]);
    e.target.value = '';
  };

  const removeVideo = (index: number) => {
    setSelectedVideos((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    if (selectedPhotos.length === 0 && selectedVideos.length === 0) {
      toast.error('Harap pilih minimal 1 foto atau video');
      return;
    }

    createMutation.mutate({
      persentase: Math.min(Math.max(persentase, 0), 100),
      keterangan: keterangan.trim() || undefined,
      photos: selectedPhotos.map((p) => p.file),
      videos: selectedVideos.map((v) => v.file),
    });
  };

  const handleClose = () => {
    selectedPhotos.forEach((p) => URL.revokeObjectURL(p.preview));
    selectedVideos.forEach((v) => URL.revokeObjectURL(v.preview));
    setSelectedPhotos([]);
    setSelectedVideos([]);
    setKeterangan('');
    setActiveTab('upload');
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className='max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden'>
          {/* Header */}
          <DialogHeader className='p-5 sm:p-6 pb-4 border-b border-neutral-100 bg-neutral-50/70'>
            <div className='flex items-start justify-between gap-4'>
              <div className='space-y-1.5'>
                <div className='flex items-center gap-2'>
                  <div className='p-2 rounded-lg bg-orange-100 text-orange-700'>
                    <Camera className='h-5 w-5' />
                  </div>
                  <div>
                    <DialogTitle className='text-lg font-bold text-neutral-900'>
                      {isViewOnly
                        ? 'Riwayat Foto Dokumentasi Produksi'
                        : 'Foto Progres Produksi'}
                    </DialogTitle>
                    <DialogDescription className='text-xs text-neutral-500 font-medium'>
                      {projectName || 'Detail Project'}
                    </DialogDescription>
                  </div>
                </div>

                <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500 pt-1'>
                  {clientName && (
                    <span className='flex items-center gap-1'>
                      <Building2 className='h-3.5 w-3.5 text-neutral-400' />
                      <strong className='text-neutral-700 font-medium'>
                        {clientName}
                      </strong>
                    </span>
                  )}
                  {spkNumber && (
                    <span className='flex items-center gap-1'>
                      <FileText className='h-3.5 w-3.5 text-neutral-400' />
                      <span>{spkNumber}</span>
                    </span>
                  )}
                  {deadline && (
                    <span className='flex items-center gap-1'>
                      <Calendar className='h-3.5 w-3.5 text-neutral-400' />
                      <span>
                        Deadline:{' '}
                        {format(new Date(deadline), 'dd MMM yyyy', {
                          locale: idLocale,
                        })}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              <div className='flex flex-col items-end gap-1 shrink-0'>
                <span className='text-[10px] uppercase font-bold text-neutral-400 tracking-wider'>
                  Progres Saat Ini
                </span>
                <Badge
                  variant='outline'
                  className='text-xs font-bold px-2.5 py-1 bg-orange-50 text-orange-700 border-orange-200'
                >
                  {Math.round(currentProgres)}%
                </Badge>
              </div>
            </div>

            {/* Navigation Tabs */}
            {!isViewOnly ? (
              <div className='pt-3'>
                <Tabs
                  value={activeTab}
                  onValueChange={(val) => setActiveTab(val as 'upload' | 'history')}
                  className='w-full'
                >
                  <TabsList className='grid grid-cols-2 w-full max-w-xs h-9 bg-neutral-200/60 p-0.5'>
                    <TabsTrigger
                      value='upload'
                      className='text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-xs'
                    >
                      <Plus className='h-3.5 w-3.5 mr-1.5' />
                      Upload Baru
                    </TabsTrigger>
                    <TabsTrigger
                      value='history'
                      className='text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-xs'
                    >
                      <History className='h-3.5 w-3.5 mr-1.5' />
                      Riwayat ({logs.length})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            ) : (
              <div className='pt-3 flex items-center justify-between'>
                <div className='inline-flex items-center gap-1.5 text-xs font-bold text-orange-800 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-lg'>
                  <History className='h-3.5 w-3.5 text-orange-600' />
                  <span>Riwayat Dokumentasi Progres ({logs.length})</span>
                </div>
              </div>
            )}
          </DialogHeader>

          {/* Body Content */}
          <div className='flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar'>
            {activeTab === 'upload' ? (
              /* TAB 1: FORM UPLOAD */
              <form onSubmit={handleSubmit} className='space-y-5'>
                {/* 1. Persentase Progres (Pilihan 50% atau 80%) */}
                <div className='bg-orange-50/50 rounded-xl p-4 border border-orange-100/80 space-y-3'>
                  <div className='flex items-center justify-between'>
                    <Label className='text-xs font-bold uppercase tracking-wider text-orange-900'>
                      Persentase Progres Produksi Saat Ini
                    </Label>
                    <Badge
                      variant='outline'
                      className='text-xs font-extrabold px-2.5 py-0.5 bg-orange-100/90 text-orange-700 border-orange-300'
                    >
                      Dipilih: {persentase}%
                    </Badge>
                  </div>

                  <div className='grid grid-cols-2 gap-3'>
                    <button
                      type='button'
                      onClick={() => setPersentase(50)}
                      className={cn(
                        'flex flex-col items-center justify-center p-3.5 rounded-xl border-2 transition-all duration-200 cursor-pointer relative overflow-hidden group',
                        persentase === 50
                          ? 'bg-orange-600 text-white border-orange-600 shadow-md ring-2 ring-orange-300 ring-offset-1'
                          : 'bg-white text-neutral-700 border-orange-100 hover:border-orange-300 hover:bg-orange-50/50'
                      )}
                    >
                      {persentase === 50 && (
                        <div className='absolute top-2 right-2 animate-in zoom-in duration-200'>
                          <CheckCircle2 className='h-4 w-4 text-white' />
                        </div>
                      )}
                      <span
                        className={cn(
                          'text-2xl font-black tracking-tight transition-colors',
                          persentase === 50 ? 'text-white' : 'text-orange-600 group-hover:text-orange-700'
                        )}
                      >
                        50%
                      </span>
                      <span
                        className={cn(
                          'text-xs font-semibold mt-0.5 transition-colors',
                          persentase === 50 ? 'text-orange-100' : 'text-neutral-500'
                        )}
                      >
                        Tahap Sample 50%
                      </span>
                    </button>

                    <button
                      type='button'
                      onClick={() => setPersentase(80)}
                      className={cn(
                        'flex flex-col items-center justify-center p-3.5 rounded-xl border-2 transition-all duration-200 cursor-pointer relative overflow-hidden group',
                        persentase === 80
                          ? 'bg-orange-600 text-white border-orange-600 shadow-md ring-2 ring-orange-300 ring-offset-1'
                          : 'bg-white text-neutral-700 border-orange-100 hover:border-orange-300 hover:bg-orange-50/50'
                      )}
                    >
                      {persentase === 80 && (
                        <div className='absolute top-2 right-2 animate-in zoom-in duration-200'>
                          <CheckCircle2 className='h-4 w-4 text-white' />
                        </div>
                      )}
                      <span
                        className={cn(
                          'text-2xl font-black tracking-tight transition-colors',
                          persentase === 80 ? 'text-white' : 'text-orange-600 group-hover:text-orange-700'
                        )}
                      >
                        80%
                      </span>
                      <span
                        className={cn(
                          'text-xs font-semibold mt-0.5 transition-colors',
                          persentase === 80 ? 'text-orange-100' : 'text-neutral-500'
                        )}
                      >
                        Tahap Sample 80%
                      </span>
                    </button>
                  </div>

                  <p className='text-[11px] text-orange-700/80 italic'>
                    * Silakan pilih salah satu tahapan progres (50% atau 80%) saat dokumentasi foto sample diunggah.
                  </p>
                </div>

                {/* 2. Catatan / Keterangan */}
                <div className='space-y-1.5'>
                  <Label className='text-xs font-semibold text-neutral-700'>
                    Keterangan / Catatan Progres
                  </Label>
                  <Textarea
                    placeholder='Contoh: Perakitan modul lemari 80%, proses instalasi hardware dan edging berjalan lancar...'
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    rows={2}
                    className='text-xs bg-white resize-none'
                  />
                </div>

                {/* 3. Upload Foto */}
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Label className='text-xs font-semibold text-neutral-700 flex items-center gap-1.5'>
                      <ImageIcon className='h-4 w-4 text-orange-500' />
                      Foto Progres ({selectedPhotos.length} dipilih)
                    </Label>
                    <label
                      htmlFor='photo-upload-input'
                      className='inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 cursor-pointer hover:underline'
                    >
                      <Plus className='h-3.5 w-3.5' />
                      Tambah Foto
                    </label>
                    <input
                      id='photo-upload-input'
                      type='file'
                      multiple
                      accept='image/*'
                      onChange={handlePhotoSelect}
                      className='hidden'
                    />
                  </div>

                  {selectedPhotos.length === 0 ? (
                    <label
                      htmlFor='photo-upload-input'
                      className='flex flex-col items-center justify-center p-6 border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50/50 hover:bg-neutral-50 transition-colors cursor-pointer group'
                    >
                      <div className='p-2.5 rounded-full bg-orange-100 text-orange-600 group-hover:scale-110 transition-transform mb-2'>
                        <Upload className='h-5 w-5' />
                      </div>
                      <span className='text-xs font-semibold text-neutral-700'>
                        Klik untuk memilih atau drag foto
                      </span>
                      <span className='text-[10px] text-neutral-400 mt-0.5'>
                        Mendukung format JPG, PNG, WEBP (Maks 20MB / foto)
                      </span>
                    </label>
                  ) : (
                    <div className='grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1 border rounded-lg bg-neutral-50/50'>
                      {selectedPhotos.map((photo, index) => (
                        <div
                          key={index}
                          className='relative group rounded-lg overflow-hidden border border-neutral-200 bg-white aspect-square shadow-xs'
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.preview}
                            alt={photo.name}
                            className='w-full h-full object-cover'
                          />
                          <button
                            type='button'
                            onClick={() => removePhoto(index)}
                            className='absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-rose-600 transition-colors shadow-xs'
                            title='Hapus foto'
                          >
                            <X className='h-3 w-3' />
                          </button>
                          <div className='absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-1 px-1.5'>
                            <p className='text-[9px] text-white truncate font-medium'>
                              {photo.name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Upload Video */}
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Label className='text-xs font-semibold text-neutral-700 flex items-center gap-1.5'>
                      <Video className='h-4 w-4 text-blue-500' />
                      Video Progres ({selectedVideos.length} dipilih)
                    </Label>
                    <label
                      htmlFor='video-upload-input'
                      className='inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer hover:underline'
                    >
                      <Plus className='h-3.5 w-3.5' />
                      Tambah Video
                    </label>
                    <input
                      id='video-upload-input'
                      type='file'
                      multiple
                      accept='video/mp4,video/quicktime,video/webm,video/x-msvideo,video/x-matroska'
                      onChange={handleVideoSelect}
                      className='hidden'
                    />
                  </div>

                  {selectedVideos.length === 0 ? (
                    <label
                      htmlFor='video-upload-input'
                      className='flex flex-col items-center justify-center p-4 border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50/50 hover:bg-neutral-50 transition-colors cursor-pointer group'
                    >
                      <div className='p-2 rounded-full bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform mb-1.5'>
                        <Video className='h-4 w-4' />
                      </div>
                      <span className='text-xs font-medium text-neutral-600'>
                        Opsional: Pilih video progres singkat
                      </span>
                      <span className='text-[10px] text-neutral-400'>
                        Maks 100MB / video (.mp4, .mov, .webm)
                      </span>
                    </label>
                  ) : (
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 border rounded-lg bg-neutral-50/50'>
                      {selectedVideos.map((video, index) => (
                        <div
                          key={index}
                          className='flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 bg-white gap-2'
                        >
                          <div className='flex items-center gap-2 overflow-hidden'>
                            <div className='p-1.5 rounded-md bg-blue-50 text-blue-600 shrink-0'>
                              <Video className='h-4 w-4' />
                            </div>
                            <div className='truncate'>
                              <p className='text-xs font-medium text-neutral-800 truncate'>
                                {video.name}
                              </p>
                              <p className='text-[10px] text-neutral-400'>
                                {(video.size / (1024 * 1024)).toFixed(1)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            type='button'
                            onClick={() => removeVideo(index)}
                            className='p-1 rounded-full text-neutral-400 hover:text-rose-600 hover:bg-neutral-100 shrink-0'
                          >
                            <X className='h-4 w-4' />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Buttons inside Tab 1 */}
                <div className='flex items-center justify-end gap-3 pt-3 border-t'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={handleClose}
                    className='rounded-full px-5 text-xs'
                  >
                    Batal
                  </Button>
                  <Button
                    type='submit'
                    disabled={
                      createMutation.isPending ||
                      (selectedPhotos.length === 0 && selectedVideos.length === 0)
                    }
                    className='rounded-full px-6 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-xs'
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className='h-4 w-4 mr-1.5 animate-spin' />
                        Mengunggah...
                      </>
                    ) : (
                      <>
                        <Upload className='h-4 w-4 mr-1.5' />
                        Simpan Dokumentasi
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              /* TAB 2: RIWAYAT & GALERI DOKUMENTASI */
              <div className='space-y-4'>
                {isLoadingDocs ? (
                  <div className='flex flex-col items-center justify-center py-12 text-neutral-400'>
                    <Loader2 className='h-8 w-8 animate-spin mb-2' />
                    <p className='text-xs'>Memuat riwayat dokumentasi...</p>
                  </div>
                ) : logs.length === 0 ? (
                  <div className='text-center py-12 border-2 border-dashed rounded-xl bg-neutral-50/50'>
                    <Camera className='h-10 w-10 text-neutral-300 mx-auto mb-2' />
                    <h5 className='text-sm font-semibold text-neutral-700'>
                      Belum Ada Dokumentasi
                    </h5>
                    <p className='text-xs text-neutral-400 mt-0.5 max-w-sm mx-auto'>
                      {isViewOnly
                        ? 'Belum ada foto dokumentasi progres produksi yang diunggah untuk project ini.'
                        : 'Belum ada foto atau video progres yang diunggah untuk project ini.'}
                    </p>
                    {!isViewOnly && (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setActiveTab('upload')}
                        className='mt-3 text-xs text-orange-600 border-orange-200'
                      >
                        <Plus className='h-3.5 w-3.5 mr-1' />
                        Upload Sekarang
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {logs.map((log) => {
                      const images = log.media.filter(
                        (m) => m.file_type === 'image'
                      );
                      const videos = log.media.filter(
                        (m) => m.file_type === 'video'
                      );

                      return (
                        <Card
                          key={log.id}
                          className='border border-neutral-200/80 shadow-xs overflow-hidden'
                        >
                          <div className='p-4 bg-neutral-50/80 border-b flex flex-wrap items-center justify-between gap-2'>
                            <div className='flex items-center gap-2.5'>
                              <Badge className='bg-orange-600 text-white font-extrabold text-xs px-2.5 py-0.5'>
                                {log.persentase}% Progres
                              </Badge>
                              <div className='text-xs text-neutral-500 flex items-center gap-1.5'>
                                <Clock className='h-3.5 w-3.5 text-neutral-400' />
                                <span>
                                  {format(
                                    new Date(log.created_at),
                                    'dd MMM yyyy, HH:mm',
                                    { locale: idLocale }
                                  )}
                                </span>
                                {log.user && (
                                  <>
                                    <span>•</span>
                                    <span className='font-semibold text-neutral-700'>
                                      {log.user.name}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {!isViewOnly && (
                              <Button
                                variant='ghost'
                                size='icon'
                                onClick={() => setDocToDelete(log.id)}
                                className='h-7 w-7 text-neutral-400 hover:text-rose-600 hover:bg-neutral-100 rounded-full'
                                title='Hapus dokumentasi ini'
                              >
                                <Trash2 className='h-3.5 w-3.5' />
                              </Button>
                            )}
                          </div>

                          <CardContent className='p-4 space-y-3'>
                            {log.keterangan && (
                              <p className='text-xs text-neutral-700 bg-white p-2.5 rounded-lg border border-neutral-100'>
                                {log.keterangan}
                              </p>
                            )}

                            {/* Foto Gallery */}
                            {images.length > 0 && (
                              <div className='space-y-1.5'>
                                <span className='text-[10px] font-bold text-neutral-400 uppercase tracking-wider block'>
                                  Foto ({images.length})
                                </span>
                                <div className='grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2'>
                                  {images.map((img) => (
                                    <div
                                      key={img.id}
                                      onClick={() => {
                                        setLightboxImage(img.url);
                                        setLightboxTitle(
                                          img.file_name ||
                                            `Dokumentasi ${log.persentase}%`
                                        );
                                      }}
                                      className='group relative rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100 aspect-square cursor-pointer shadow-xs hover:border-orange-300 transition-all'
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={img.url}
                                        alt={img.file_name || 'Dokumentasi'}
                                        className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-200'
                                        loading='lazy'
                                      />
                                      <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white'>
                                        <Eye className='h-4 w-4 drop-shadow' />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Video Gallery */}
                            {videos.length > 0 && (
                              <div className='space-y-1.5 pt-1'>
                                <span className='text-[10px] font-bold text-neutral-400 uppercase tracking-wider block'>
                                  Video ({videos.length})
                                </span>
                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                                  {videos.map((vid) => (
                                    <div
                                      key={vid.id}
                                      className='rounded-lg overflow-hidden border border-neutral-200 bg-black aspect-video'
                                    >
                                      <video
                                        src={vid.url}
                                        controls
                                        preload='metadata'
                                        className='w-full h-full object-contain'
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox Image Preview Modal */}
      <Dialog
        open={!!lightboxImage}
        onOpenChange={() => setLightboxImage(null)}
      >
        <DialogContent className='max-w-4xl p-2 bg-black/95 border-none shadow-2xl overflow-hidden'>
          <DialogHeader className='sr-only'>
            <DialogTitle>
              {lightboxTitle || 'Preview Foto Dokumentasi'}
            </DialogTitle>
            <DialogDescription>
              Preview foto dokumentasi progres produksi
            </DialogDescription>
          </DialogHeader>
          <div className='relative flex flex-col items-center justify-center max-h-[85vh]'>
            <div className='absolute top-2 right-2 z-10'>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setLightboxImage(null)}
                className='h-8 w-8 rounded-full bg-black/50 text-white hover:bg-white/20'
              >
                <X className='h-4 w-4' />
              </Button>
            </div>
            {lightboxImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={lightboxImage}
                alt={lightboxTitle}
                className='max-h-[80vh] w-auto max-w-full object-contain rounded-md'
              />
            )}
            {lightboxTitle && (
              <p className='text-xs text-neutral-300 font-medium mt-2 px-4 truncate max-w-full text-center'>
                {lightboxTitle}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={docToDelete !== null}
        onOpenChange={(open) => !open && setDocToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Dokumentasi Progres?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus catatan beserta seluruh file foto dan
              video dari server secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (docToDelete) deleteMutation.mutate(docToDelete);
              }}
              disabled={deleteMutation.isPending}
              className='bg-rose-600 hover:bg-rose-700 text-white'
            >
              {deleteMutation.isPending ? (
                <Loader2 className='h-4 w-4 mr-1.5 animate-spin' />
              ) : null}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
