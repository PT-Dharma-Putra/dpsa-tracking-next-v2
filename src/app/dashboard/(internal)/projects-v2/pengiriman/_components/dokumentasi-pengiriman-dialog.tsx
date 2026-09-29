'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  Upload,
  Trash2,
  Eye,
  X,
  Clock,
  Truck,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Loader2,
  FileText,
  ExternalLink,
  Save,
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
  PengirimanService,
  Pengiriman,
  PengirimanDokumentasi,
} from '@/features/pengiriman/services/pengiriman-service';

interface SelectedFilePreview {
  file: File;
  previewUrl: string;
}

interface DokumentasiPengirimanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pengiriman: Pengiriman | null;
  onSuccess?: () => void;
}

export function DokumentasiPengirimanDialog({
  open,
  onOpenChange,
  pengiriman,
  onSuccess,
}: DokumentasiPengirimanDialogProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState<'loading' | 'unloading'>('loading');

  // Local state for shipment to reflect updates immediately
  const [currentPengiriman, setCurrentPengiriman] = React.useState<Pengiriman | null>(pengiriman);

  // Tanggal unloading form state
  const [tanggalUnloadingInput, setTanggalUnloadingInput] = React.useState<string>('');

  // Upload states for loading category
  const [loadingFiles, setLoadingFiles] = React.useState<SelectedFilePreview[]>([]);
  const [loadingKeterangan, setLoadingKeterangan] = React.useState<string>('');

  // Upload states for unloading category
  const [unloadingFiles, setUnloadingFiles] = React.useState<SelectedFilePreview[]>([]);
  const [unloadingKeterangan, setUnloadingKeterangan] = React.useState<string>('');

  // Lightbox preview modal state
  const [previewMedia, setPreviewMedia] = React.useState<PengirimanDokumentasi | null>(null);

  // Delete dialog state
  const [docToDelete, setDocToDelete] = React.useState<PengirimanDokumentasi | null>(null);

  // Helper to convert date string to YYYY-MM-DDTHH:mm
  const formatToDateTimeLocal = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Sync state when dialog opens or pengiriman prop changes
  React.useEffect(() => {
    if (open && pengiriman) {
      setCurrentPengiriman(pengiriman);
      setTanggalUnloadingInput(formatToDateTimeLocal(pengiriman.tanggal_unloading));
      setLoadingFiles([]);
      setLoadingKeterangan('');
      setUnloadingFiles([]);
      setUnloadingKeterangan('');
    }
  }, [open, pengiriman]);

  // Clean up object URLs on unmount or file change
  React.useEffect(() => {
    return () => {
      loadingFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
      unloadingFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    };
  }, [loadingFiles, unloadingFiles]);

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '');

  const getMediaUrl = (doc: PengirimanDokumentasi) => {
    if (doc.url && (doc.url.startsWith('http://') || doc.url.startsWith('https://'))) {
      return doc.url;
    }
    const cleanPath = doc.file_path.startsWith('/') ? doc.file_path.slice(1) : doc.file_path;
    return `${baseUrl}/storage/${cleanPath}`;
  };

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({
      kategori,
      photos,
      keterangan,
      tanggal_unloading,
    }: {
      kategori: 'loading' | 'unloading';
      photos: File[];
      keterangan?: string;
      tanggal_unloading?: string;
    }) => {
      if (!currentPengiriman?.id) throw new Error('Pengiriman tidak ditemukan');
      return await PengirimanService.uploadDokumentasi(currentPengiriman.id, {
        kategori,
        photos,
        keterangan,
        tanggal_unloading,
      });
    },
    onSuccess: (data, variables) => {
      toast.success(
        `Foto dokumentasi ${variables.kategori === 'loading' ? 'Loading' : 'Unloading'} berhasil diunggah`
      );

      // Invalidate queries so tables and cards refresh
      queryClient.invalidateQueries({ queryKey: ['pengiriman-per-spk'] });
      queryClient.invalidateQueries({ queryKey: ['pengiriman'] });

      if (data.pengiriman) {
        setCurrentPengiriman(data.pengiriman);
        if (data.pengiriman.tanggal_unloading) {
          setTanggalUnloadingInput(formatToDateTimeLocal(data.pengiriman.tanggal_unloading));
        }
      }

      // Clear input and files
      if (variables.kategori === 'loading') {
        loadingFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
        setLoadingFiles([]);
        setLoadingKeterangan('');
      } else {
        unloadingFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
        setUnloadingFiles([]);
        setUnloadingKeterangan('');
      }

      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Gagal mengunggah dokumentasi');
    },
  });

  // Update tanggal unloading mutation
  const updateTanggalMutation = useMutation({
    mutationFn: async (dateStr: string | null) => {
      if (!currentPengiriman?.id) throw new Error('Pengiriman tidak ditemukan');
      const formatted = dateStr ? dateStr.replace('T', ' ') + ':00' : null;
      return await PengirimanService.updateTanggalUnloading(currentPengiriman.id, formatted);
    },
    onSuccess: (data) => {
      toast.success('Tanggal & jam unloading berhasil disimpan');
      queryClient.invalidateQueries({ queryKey: ['pengiriman-per-spk'] });
      queryClient.invalidateQueries({ queryKey: ['pengiriman'] });
      if (data.pengiriman) {
        setCurrentPengiriman(data.pengiriman);
      }
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan waktu unloading');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (mediaId: number) => {
      return await PengirimanService.deleteDokumentasi(mediaId);
    },
    onSuccess: (data) => {
      toast.success('Foto dokumentasi berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['pengiriman-per-spk'] });
      queryClient.invalidateQueries({ queryKey: ['pengiriman'] });
      if (data.pengiriman) {
        setCurrentPengiriman(data.pengiriman);
      }
      setDocToDelete(null);
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Gagal menghapus foto dokumentasi');
    },
  });

  // Handle file selection
  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    kategori: 'loading' | 'unloading'
  ) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);

    const validFiles: SelectedFilePreview[] = [];
    filesArray.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`File ${file.name} bukan format gambar yang valid`);
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`Ukuran file ${file.name} melebihi batas 20MB`);
        return;
      }
      validFiles.push({
        file,
        previewUrl: URL.createObjectURL(file),
      });
    });

    if (kategori === 'loading') {
      setLoadingFiles((prev) => [...prev, ...validFiles]);
    } else {
      setUnloadingFiles((prev) => [...prev, ...validFiles]);
    }

    // Reset input value so the same file can be selected again if needed
    e.target.value = '';
  };

  const removeSelectedFile = (index: number, kategori: 'loading' | 'unloading') => {
    if (kategori === 'loading') {
      setLoadingFiles((prev) => {
        const item = prev[index];
        if (item) URL.revokeObjectURL(item.previewUrl);
        return prev.filter((_, i) => i !== index);
      });
    } else {
      setUnloadingFiles((prev) => {
        const item = prev[index];
        if (item) URL.revokeObjectURL(item.previewUrl);
        return prev.filter((_, i) => i !== index);
      });
    }
  };

  const handleUploadLoading = () => {
    if (loadingFiles.length === 0) {
      toast.error('Pilih minimal satu foto dokumentasi loading');
      return;
    }
    uploadMutation.mutate({
      kategori: 'loading',
      photos: loadingFiles.map((f) => f.file),
      keterangan: loadingKeterangan.trim() || undefined,
    });
  };

  const handleUploadUnloading = () => {
    if (unloadingFiles.length === 0) {
      toast.error('Pilih minimal satu foto dokumentasi unloading');
      return;
    }
    uploadMutation.mutate({
      kategori: 'unloading',
      photos: unloadingFiles.map((f) => f.file),
      keterangan: unloadingKeterangan.trim() || undefined,
      tanggal_unloading: tanggalUnloadingInput
        ? tanggalUnloadingInput.replace('T', ' ') + ':00'
        : undefined,
    });
  };

  const allDocs = currentPengiriman?.dokumentasi ?? [];
  const loadingDocs = allDocs.filter((d) => d.kategori === 'loading');
  const unloadingDocs = allDocs.filter((d) => d.kategori === 'unloading');

  if (!currentPengiriman) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden'>
          {/* Header */}
          <DialogHeader className='p-5 pb-3 border-b bg-neutral-50/80'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <DialogTitle className='text-base font-bold text-neutral-800 flex items-center gap-2'>
                  <div className='p-1.5 rounded-md bg-purple-100 text-purple-700'>
                    <Camera className='h-4 w-4' />
                  </div>
                  Dokumentasi Foto Pengiriman
                </DialogTitle>
                <DialogDescription className='text-xs text-neutral-500 mt-0.5'>
                  Kelola foto dokumentasi saat Loading (Muat) dan Unloading (Bongkar/Sampai).
                </DialogDescription>
              </div>

              {/* Status Badge */}
              <div className='text-right'>
                {currentPengiriman.tanggal_unloading ? (
                  <Badge
                    variant='outline'
                    className='bg-emerald-50 border-emerald-200 text-emerald-700 text-[10px] font-semibold gap-1 py-1'
                  >
                    <CheckCircle2 className='h-3 w-3 text-emerald-600' />
                    Tiba:{' '}
                    {format(new Date(currentPengiriman.tanggal_unloading), 'dd MMM yyyy HH:mm', {
                      locale: idLocale,
                    })}
                  </Badge>
                ) : (
                  <Badge
                    variant='outline'
                    className='bg-amber-50 border-amber-200 text-amber-700 text-[10px] font-semibold gap-1 py-1'
                  >
                    <Clock className='h-3 w-3 text-amber-600' />
                    Dalam Pengiriman (Belum Tiba)
                  </Badge>
                )}
              </div>
            </div>

            {/* Shipment Metadata Bar */}
            <div className='mt-3 flex items-center gap-2 flex-wrap text-xs bg-white px-3 py-2 rounded-lg border border-neutral-200/80 text-neutral-600 shadow-2xs'>
              <div className='flex items-center gap-1.5 font-medium'>
                <Calendar className='h-3.5 w-3.5 text-neutral-400' />
                <span>Kirim:</span>
                <span className='font-semibold text-neutral-800'>
                  {format(new Date(currentPengiriman.tanggal), 'dd MMMM yyyy', {
                    locale: idLocale,
                  })}
                </span>
              </div>
              <span className='text-neutral-300'>•</span>
              {currentPengiriman.supir && (
                <>
                  <div className='flex items-center gap-1.5 font-medium'>
                    <Truck className='h-3.5 w-3.5 text-neutral-400' />
                    <span>Supir:</span>
                    <span className='font-semibold text-neutral-800'>{currentPengiriman.supir}</span>
                  </div>
                  <span className='text-neutral-300'>•</span>
                </>
              )}
              {currentPengiriman.no_kendaraan && (
                <>
                  <div className='flex items-center gap-1 font-medium'>
                    <span>Plat:</span>
                    <span className='font-semibold text-neutral-800 uppercase'>
                      {currentPengiriman.no_kendaraan}
                    </span>
                  </div>
                  <span className='text-neutral-300'>•</span>
                </>
              )}
              {currentPengiriman.surat_jalan && (
                <div className='flex items-center gap-1 font-medium'>
                  <span>No. SJ:</span>
                  <span className='font-semibold text-neutral-800 truncate max-w-[150px]'>
                    {currentPengiriman.surat_jalan.split('/').pop()}
                  </span>
                </div>
              )}
            </div>
          </DialogHeader>

          {/* Main Tabs Container */}
          <div className='flex-1 overflow-y-auto p-5'>
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as 'loading' | 'unloading')}
              className='w-full space-y-4'
            >
              <TabsList className='grid grid-cols-2 w-full max-w-md mx-auto h-9 bg-neutral-100 p-1'>
                <TabsTrigger
                  value='loading'
                  className='text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-xs flex items-center gap-1.5'
                >
                  <Upload className='h-3.5 w-3.5' />
                  Loading (Muat Barang)
                  <Badge
                    variant='secondary'
                    className={`ml-1 text-[10px] px-1.5 py-0 h-4 ${
                      loadingDocs.length > 0 ? 'bg-purple-100 text-purple-700 font-bold' : ''
                    }`}
                  >
                    {loadingDocs.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value='unloading'
                  className='text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-xs flex items-center gap-1.5'
                >
                  <CheckCircle2 className='h-3.5 w-3.5' />
                  Unloading (Tiba & Bongkar)
                  <Badge
                    variant='secondary'
                    className={`ml-1 text-[10px] px-1.5 py-0 h-4 ${
                      unloadingDocs.length > 0 ? 'bg-emerald-100 text-emerald-700 font-bold' : ''
                    }`}
                  >
                    {unloadingDocs.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              {/* ============================================================== */}
              {/* TAB 1: LOADING */}
              {/* ============================================================== */}
              <TabsContent value='loading' className='space-y-5 mt-2'>
                {/* Upload Form Box */}
                <Card className='border border-purple-100 bg-purple-50/20'>
                  <CardContent className='p-4 space-y-3.5'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <div className='h-2 w-2 rounded-full bg-purple-600' />
                        <h4 className='text-xs font-bold text-neutral-800 uppercase tracking-wider'>
                          Upload Foto Loading Baru
                        </h4>
                      </div>
                      <span className='text-[10px] text-neutral-500'>
                        Maksimal 20MB per gambar (JPG, PNG, WebP)
                      </span>
                    </div>

                    {/* File Picker Zone */}
                    <div className='border-2 border-dashed border-purple-200 hover:border-purple-400 bg-white rounded-lg p-4 text-center transition-colors cursor-pointer relative'>
                      <input
                        type='file'
                        multiple
                        accept='image/*'
                        onChange={(e) => handleFileSelect(e, 'loading')}
                        className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                        disabled={uploadMutation.isPending}
                      />
                      <div className='flex flex-col items-center justify-center gap-1.5 text-neutral-500'>
                        <div className='p-2 rounded-full bg-purple-100/70 text-purple-600'>
                          <Camera className='h-5 w-5' />
                        </div>
                        <p className='text-xs font-semibold text-neutral-700'>
                          Klik atau drag & drop foto loading muatan di sini
                        </p>
                        <p className='text-[10px] text-neutral-400'>
                          Bisa pilih lebih dari satu foto sekaligus
                        </p>
                      </div>
                    </div>

                    {/* Preview of newly selected files */}
                    {loadingFiles.length > 0 && (
                      <div className='space-y-2'>
                        <p className='text-[11px] font-semibold text-neutral-600'>
                          {loadingFiles.length} foto siap diunggah:
                        </p>
                        <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2'>
                          {loadingFiles.map((fileObj, idx) => (
                            <div
                              key={idx}
                              className='relative group aspect-square rounded-md overflow-hidden border border-purple-200 bg-neutral-100'
                            >
                              <img
                                src={fileObj.previewUrl}
                                alt={`Preview ${idx + 1}`}
                                className='w-full h-full object-cover'
                              />
                              <button
                                type='button'
                                onClick={() => removeSelectedFile(idx, 'loading')}
                                className='absolute top-1 right-1 p-1 bg-red-600/80 hover:bg-red-600 text-white rounded-full transition-opacity opacity-90'
                                title='Hapus foto ini'
                              >
                                <X className='h-3 w-3' />
                              </button>
                              <span className='absolute bottom-0 inset-x-0 bg-black/50 text-[9px] text-white px-1 truncate'>
                                {fileObj.file.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Keterangan & Submit */}
                    <div className='grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 items-end'>
                      <div className='sm:col-span-3 space-y-1'>
                        <Label className='text-[11px] text-neutral-600'>
                          Keterangan / Catatan Muat (Opsional)
                        </Label>
                        <Input
                          placeholder='Contoh: Muatan lengkap 12 koli, diikat rapi dan terpal terpasang'
                          value={loadingKeterangan}
                          onChange={(e) => setLoadingKeterangan(e.target.value)}
                          className='h-8 text-xs bg-white'
                          disabled={uploadMutation.isPending}
                        />
                      </div>
                      <div className='sm:col-span-1'>
                        <Button
                          type='button'
                          size='sm'
                          onClick={handleUploadLoading}
                          disabled={loadingFiles.length === 0 || uploadMutation.isPending}
                          className='w-full h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold gap-1.5 shadow-xs'
                        >
                          {uploadMutation.isPending && uploadMutation.variables?.kategori === 'loading' ? (
                            <>
                              <Loader2 className='h-3.5 w-3.5 animate-spin' />
                              Mengunggah...
                            </>
                          ) : (
                            <>
                              <Upload className='h-3.5 w-3.5' />
                              Unggah ({loadingFiles.length})
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Gallery of Uploaded Loading Photos */}
                <div className='space-y-2.5'>
                  <div className='flex items-center justify-between'>
                    <h4 className='text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5'>
                      <FileText className='h-3.5 w-3.5 text-neutral-400' />
                      Foto Terunggah ({loadingDocs.length})
                    </h4>
                  </div>

                  {loadingDocs.length === 0 ? (
                    <div className='p-8 rounded-lg border border-dashed border-neutral-200 bg-neutral-50/50 text-center'>
                      <Camera className='h-8 w-8 text-neutral-300 mx-auto mb-1.5' />
                      <p className='text-xs font-semibold text-neutral-600'>
                        Belum ada foto dokumentasi saat muat (loading)
                      </p>
                      <p className='text-[10px] text-neutral-400 mt-0.5'>
                        Silakan unggah foto muatan barang di atas sebelum armada berangkat.
                      </p>
                    </div>
                  ) : (
                    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'>
                      {loadingDocs.map((doc) => {
                        const mediaUrl = getMediaUrl(doc);
                        return (
                          <div
                            key={doc.id}
                            className='group relative rounded-lg border border-neutral-200 bg-white overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col'
                          >
                            <div className='relative aspect-4/3 w-full bg-neutral-100 overflow-hidden'>
                              <img
                                src={mediaUrl}
                                alt={doc.file_name || 'Loading Photo'}
                                className='w-full h-full object-cover transition-transform duration-300 group-hover:scale-105'
                                loading='lazy'
                              />
                              {/* Hover Action Overlay */}
                              <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2'>
                                <button
                                  type='button'
                                  onClick={() => setPreviewMedia(doc)}
                                  className='p-1.5 rounded-full bg-white/90 hover:bg-white text-neutral-800 shadow-sm transition-transform hover:scale-110'
                                  title='Lihat Foto Penuh'
                                >
                                  <Eye className='h-4 w-4' />
                                </button>
                                <button
                                  type='button'
                                  onClick={() => setDocToDelete(doc)}
                                  className='p-1.5 rounded-full bg-red-600/90 hover:bg-red-600 text-white shadow-sm transition-transform hover:scale-110'
                                  title='Hapus Foto'
                                >
                                  <Trash2 className='h-4 w-4' />
                                </button>
                              </div>
                            </div>

                            {/* Caption info */}
                            <div className='p-2 text-[10px] flex-1 flex flex-col justify-between bg-white'>
                              {doc.keterangan ? (
                                <p className='text-neutral-700 font-medium line-clamp-2 leading-snug'>
                                  {doc.keterangan}
                                </p>
                              ) : (
                                <p className='text-neutral-400 italic'>Tanpa keterangan</p>
                              )}
                              <div className='mt-1.5 pt-1 border-t border-neutral-100 flex items-center justify-between text-[9px] text-neutral-400'>
                                <span>
                                  {doc.created_at
                                    ? format(new Date(doc.created_at), 'dd/MM/yy HH:mm')
                                    : '-'}
                                </span>
                                {doc.user?.name && (
                                  <span className='truncate max-w-[80px]' title={doc.user.name}>
                                    {doc.user.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ============================================================== */}
              {/* TAB 2: UNLOADING */}
              {/* ============================================================== */}
              <TabsContent value='unloading' className='space-y-5 mt-2'>
                {/* Tanggal & Jam Sampai / Unloading Card */}
                <Card className='border border-emerald-200 bg-emerald-50/30'>
                  <CardContent className='p-4 space-y-2'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <div className='p-1 rounded-md bg-emerald-100 text-emerald-700'>
                          <Clock className='h-3.5 w-3.5' />
                        </div>
                        <h4 className='text-xs font-bold text-neutral-800'>
                          Waktu Kedatangan / Unloading
                        </h4>
                      </div>
                      {currentPengiriman.tanggal_unloading && (
                        <span className='text-[10px] font-semibold text-emerald-700 flex items-center gap-1'>
                          <CheckCircle2 className='h-3 w-3' />
                          Tersimpan: {format(new Date(currentPengiriman.tanggal_unloading), 'dd MMM yyyy HH:mm', { locale: idLocale })}
                        </span>
                      )}
                    </div>
                    <p className='text-[11px] text-neutral-500'>
                      Tentukan tanggal dan jam saat armada tiba di lokasi proyek / gudang tujuan untuk pembongkaran.
                    </p>

                    <div className='flex items-center gap-2 pt-1 max-w-md'>
                      <div className='relative flex-1'>
                        <Input
                          type='datetime-local'
                          value={tanggalUnloadingInput}
                          onChange={(e) => setTanggalUnloadingInput(e.target.value)}
                          className='h-8 text-xs bg-white border-emerald-200 focus-visible:ring-emerald-400'
                          disabled={updateTanggalMutation.isPending}
                        />
                      </div>
                      <Button
                        type='button'
                        size='sm'
                        onClick={() => updateTanggalMutation.mutate(tanggalUnloadingInput || null)}
                        disabled={updateTanggalMutation.isPending}
                        className='h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1 px-3 shadow-2xs'
                      >
                        {updateTanggalMutation.isPending ? (
                          <>
                            <Loader2 className='h-3 w-3 animate-spin' />
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <Save className='h-3 w-3' />
                            Simpan Waktu
                          </>
                        )}
                      </Button>
                      {currentPengiriman.tanggal_unloading && (
                        <Button
                          type='button'
                          size='sm'
                          variant='ghost'
                          onClick={() => {
                            setTanggalUnloadingInput('');
                            updateTanggalMutation.mutate(null);
                          }}
                          disabled={updateTanggalMutation.isPending}
                          className='h-8 text-[10px] text-neutral-400 hover:text-red-600 px-2'
                          title='Kosongkan waktu kedatangan'
                        >
                          Reset
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Upload Form Box */}
                <Card className='border border-emerald-100 bg-emerald-50/10'>
                  <CardContent className='p-4 space-y-3.5'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <div className='h-2 w-2 rounded-full bg-emerald-600' />
                        <h4 className='text-xs font-bold text-neutral-800 uppercase tracking-wider'>
                          Upload Foto Unloading Baru
                        </h4>
                      </div>
                      <span className='text-[10px] text-neutral-500'>
                        Maksimal 20MB per gambar (JPG, PNG, WebP)
                      </span>
                    </div>

                    {/* File Picker Zone */}
                    <div className='border-2 border-dashed border-emerald-200 hover:border-emerald-400 bg-white rounded-lg p-4 text-center transition-colors cursor-pointer relative'>
                      <input
                        type='file'
                        multiple
                        accept='image/*'
                        onChange={(e) => handleFileSelect(e, 'unloading')}
                        className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                        disabled={uploadMutation.isPending}
                      />
                      <div className='flex flex-col items-center justify-center gap-1.5 text-neutral-500'>
                        <div className='p-2 rounded-full bg-emerald-100/70 text-emerald-600'>
                          <Camera className='h-5 w-5' />
                        </div>
                        <p className='text-xs font-semibold text-neutral-700'>
                          Klik atau drag & drop foto pembongkaran muatan di sini
                        </p>
                        <p className='text-[10px] text-neutral-400'>
                          Bisa pilih beberapa foto sekaligus
                        </p>
                      </div>
                    </div>

                    {/* Preview of newly selected files */}
                    {unloadingFiles.length > 0 && (
                      <div className='space-y-2'>
                        <p className='text-[11px] font-semibold text-neutral-600'>
                          {unloadingFiles.length} foto siap diunggah:
                        </p>
                        <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2'>
                          {unloadingFiles.map((fileObj, idx) => (
                            <div
                              key={idx}
                              className='relative group aspect-square rounded-md overflow-hidden border border-emerald-200 bg-neutral-100'
                            >
                              <img
                                src={fileObj.previewUrl}
                                alt={`Preview ${idx + 1}`}
                                className='w-full h-full object-cover'
                              />
                              <button
                                type='button'
                                onClick={() => removeSelectedFile(idx, 'unloading')}
                                className='absolute top-1 right-1 p-1 bg-red-600/80 hover:bg-red-600 text-white rounded-full transition-opacity opacity-90'
                                title='Hapus foto ini'
                              >
                                <X className='h-3 w-3' />
                              </button>
                              <span className='absolute bottom-0 inset-x-0 bg-black/50 text-[9px] text-white px-1 truncate'>
                                {fileObj.file.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Keterangan & Submit */}
                    <div className='grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 items-end'>
                      <div className='sm:col-span-3 space-y-1'>
                        <Label className='text-[11px] text-neutral-600'>
                          Keterangan / Catatan Bongkar (Opsional)
                        </Label>
                        <Input
                          placeholder='Contoh: Barang diturunkan di lantai 2 dalam kondisi aman dan utuh'
                          value={unloadingKeterangan}
                          onChange={(e) => setUnloadingKeterangan(e.target.value)}
                          className='h-8 text-xs bg-white'
                          disabled={uploadMutation.isPending}
                        />
                      </div>
                      <div className='sm:col-span-1'>
                        <Button
                          type='button'
                          size='sm'
                          onClick={handleUploadUnloading}
                          disabled={unloadingFiles.length === 0 || uploadMutation.isPending}
                          className='w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow-xs'
                        >
                          {uploadMutation.isPending && uploadMutation.variables?.kategori === 'unloading' ? (
                            <>
                              <Loader2 className='h-3.5 w-3.5 animate-spin' />
                              Mengunggah...
                            </>
                          ) : (
                            <>
                              <Upload className='h-3.5 w-3.5' />
                              Unggah ({unloadingFiles.length})
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Gallery of Uploaded Unloading Photos */}
                <div className='space-y-2.5'>
                  <div className='flex items-center justify-between'>
                    <h4 className='text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5'>
                      <FileText className='h-3.5 w-3.5 text-neutral-400' />
                      Foto Terunggah ({unloadingDocs.length})
                    </h4>
                  </div>

                  {unloadingDocs.length === 0 ? (
                    <div className='p-8 rounded-lg border border-dashed border-neutral-200 bg-neutral-50/50 text-center'>
                      <Camera className='h-8 w-8 text-neutral-300 mx-auto mb-1.5' />
                      <p className='text-xs font-semibold text-neutral-600'>
                        Belum ada foto dokumentasi saat tiba & bongkar (unloading)
                      </p>
                      <p className='text-[10px] text-neutral-400 mt-0.5'>
                        Unggah foto kondisi barang saat tiba atau saat serah terima di lokasi.
                      </p>
                    </div>
                  ) : (
                    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'>
                      {unloadingDocs.map((doc) => {
                        const mediaUrl = getMediaUrl(doc);
                        return (
                          <div
                            key={doc.id}
                            className='group relative rounded-lg border border-neutral-200 bg-white overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col'
                          >
                            <div className='relative aspect-4/3 w-full bg-neutral-100 overflow-hidden'>
                              <img
                                src={mediaUrl}
                                alt={doc.file_name || 'Unloading Photo'}
                                className='w-full h-full object-cover transition-transform duration-300 group-hover:scale-105'
                                loading='lazy'
                              />
                              {/* Hover Action Overlay */}
                              <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2'>
                                <button
                                  type='button'
                                  onClick={() => setPreviewMedia(doc)}
                                  className='p-1.5 rounded-full bg-white/90 hover:bg-white text-neutral-800 shadow-sm transition-transform hover:scale-110'
                                  title='Lihat Foto Penuh'
                                >
                                  <Eye className='h-4 w-4' />
                                </button>
                                <button
                                  type='button'
                                  onClick={() => setDocToDelete(doc)}
                                  className='p-1.5 rounded-full bg-red-600/90 hover:bg-red-600 text-white shadow-sm transition-transform hover:scale-110'
                                  title='Hapus Foto'
                                >
                                  <Trash2 className='h-4 w-4' />
                                </button>
                              </div>
                            </div>

                            {/* Caption info */}
                            <div className='p-2 text-[10px] flex-1 flex flex-col justify-between bg-white'>
                              {doc.keterangan ? (
                                <p className='text-neutral-700 font-medium line-clamp-2 leading-snug'>
                                  {doc.keterangan}
                                </p>
                              ) : (
                                <p className='text-neutral-400 italic'>Tanpa keterangan</p>
                              )}
                              <div className='mt-1.5 pt-1 border-t border-neutral-100 flex items-center justify-between text-[9px] text-neutral-400'>
                                <span>
                                  {doc.created_at
                                    ? format(new Date(doc.created_at), 'dd/MM/yy HH:mm')
                                    : '-'}
                                </span>
                                {doc.user?.name && (
                                  <span className='truncate max-w-[80px]' title={doc.user.name}>
                                    {doc.user.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox / Zoom Dialog */}
      {previewMedia && (
        <Dialog open={!!previewMedia} onOpenChange={() => setPreviewMedia(null)}>
          <DialogContent className='max-w-4xl p-2 bg-black/95 border-none text-white overflow-hidden flex flex-col items-center justify-center'>
            <DialogHeader className='sr-only'>
              <DialogTitle>
                {previewMedia.file_name || 'Pratinjau Foto Dokumentasi'}
              </DialogTitle>
              <DialogDescription>
                Pratinjau foto dokumentasi pengiriman {previewMedia.kategori}
              </DialogDescription>
            </DialogHeader>
            <div className='w-full flex items-center justify-between p-2 text-xs'>
              <div className='flex items-center gap-2'>
                <Badge
                  className={
                    previewMedia.kategori === 'loading'
                      ? 'bg-purple-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }
                >
                  {previewMedia.kategori === 'loading' ? 'Loading' : 'Unloading'}
                </Badge>
                <span className='text-neutral-300 font-medium truncate max-w-md'>
                  {previewMedia.file_name || 'Foto Dokumentasi'}
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <a
                  href={getMediaUrl(previewMedia)}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='p-1.5 rounded-full hover:bg-white/10 text-neutral-300 hover:text-white transition-colors'
                  title='Buka di tab baru'
                >
                  <ExternalLink className='h-4 w-4' />
                </a>
                <button
                  type='button'
                  onClick={() => setPreviewMedia(null)}
                  className='p-1.5 rounded-full hover:bg-white/10 text-neutral-300 hover:text-white transition-colors'
                >
                  <X className='h-4 w-4' />
                </button>
              </div>
            </div>

            <div className='max-h-[75vh] w-full flex items-center justify-center overflow-auto p-1'>
              <img
                src={getMediaUrl(previewMedia)}
                alt={previewMedia.file_name || 'Preview'}
                className='max-h-[70vh] max-w-full object-contain rounded-md shadow-2xl'
              />
            </div>

            {previewMedia.keterangan && (
              <div className='w-full text-center py-2 px-4 bg-black/60 backdrop-blur-xs rounded-b-md'>
                <p className='text-xs text-neutral-200 font-normal leading-relaxed'>
                  {previewMedia.keterangan}
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!docToDelete} onOpenChange={() => setDocToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-base font-bold text-neutral-800'>
              Hapus Foto Dokumentasi?
            </AlertDialogTitle>
            <AlertDialogDescription className='text-xs text-neutral-500'>
              Foto ini akan dihapus secara permanen dari server dan tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending} className='text-xs'>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (docToDelete?.id) {
                  deleteMutation.mutate(docToDelete.id);
                }
              }}
              disabled={deleteMutation.isPending}
              className='text-xs bg-red-600 hover:bg-red-700 text-white'
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className='h-3 w-3 animate-spin mr-1' />
                  Menghapus...
                </>
              ) : (
                'Ya, Hapus'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
