'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Clock,
  Image as ImageIcon,
  Video,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Eye,
  Loader2,
  Building2,
  FileText,
  Calendar,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  projectV2Service,
  SiteReadiness,
} from '@/features/projects/services/project-v2-service';
import { cn } from '@/lib/utils';

interface SiteReadinessViewDialogProps {
  projectId: number | null;
  isOpen: boolean;
  onClose: () => void;
  projectName?: string;
  clientName?: string;
  spkNumber?: string;
  deadline?: string | null;
}

export function SiteReadinessViewDialog({
  projectId,
  isOpen,
  onClose,
  projectName,
  clientName,
  spkNumber,
  deadline,
}: SiteReadinessViewDialogProps) {
  // Lightbox preview modal state
  const [lightboxImage, setLightboxImage] = React.useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = React.useState<string>('');

  // Fetch Site Readiness logs from Backend
  const {
    data: readinessResponse,
    isLoading,
  } = useQuery({
    queryKey: ['site-readiness', projectId],
    queryFn: () => (projectId ? projectV2Service.getSiteReadiness(projectId) : null),
    enabled: isOpen && !!projectId,
  });

  const logs: SiteReadiness[] = readinessResponse?.data || [];
  const currentPercentage = readinessResponse?.readiness_percentage ?? 0;

  // Status info metadata
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className='max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden'>
          {/* Header */}
          <DialogHeader className='p-6 pb-4 border-b border-neutral-100 bg-neutral-50/70'>
            <div className='flex items-start justify-between gap-4'>
              <div className='space-y-1.5'>
                <div className='flex items-center gap-2'>
                  <DialogTitle className='text-lg font-bold text-neutral-900'>
                    {projectName || 'Kesiapan Lokasi'}
                  </DialogTitle>
                  <Badge variant='outline' className='text-[10px] font-semibold bg-white text-orange-700 border-orange-200'>
                    View Only
                  </Badge>
                </div>
                <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500'>
                  {clientName && (
                    <span className='flex items-center gap-1'>
                      <Building2 className='h-3.5 w-3.5 text-neutral-400' />
                      <strong className='text-neutral-700 font-medium'>{clientName}</strong>
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
                      <span>Deadline: {format(new Date(deadline), 'dd MMM yyyy', { locale: idLocale })}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Body content */}
          <div className='flex-1 overflow-y-auto p-6 space-y-6'>
            {/* Overview Gauge Card */}
            <Card className='border border-neutral-200 bg-gradient-to-br from-white via-neutral-50 to-neutral-100/40 shadow-xs'>
              <CardContent className='p-4 sm:p-5'>
                <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
                  {/* Gauge */}
                  <div className='flex-1 w-full space-y-2.5'>
                    <div className='flex items-center justify-between'>
                      <span className='text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5'>
                        <MapPin className='h-4 w-4 text-orange-600' />
                        Status Kesiapan Lokasi Terkini
                      </span>
                      <span className='text-2xl font-extrabold text-neutral-900'>
                        {currentPercentage}%
                      </span>
                    </div>

                    <div className='w-full bg-neutral-200 h-3 rounded-full overflow-hidden p-0.5 border border-neutral-300 shadow-inner'>
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500 ease-out',
                          statusInfo.progressBar
                        )}
                        style={{ width: `${Math.min(100, Math.max(0, currentPercentage))}%` }}
                      />
                    </div>

                    <div className='flex items-center gap-2'>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-lg border shadow-xs',
                          statusInfo.color
                        )}
                      >
                        <StatusIcon className='h-3.5 w-3.5' />
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Summary Info */}
                  <div className='sm:border-l sm:border-neutral-200 sm:pl-5 sm:text-right text-xs text-neutral-500 space-y-1 shrink-0'>
                    <p className='font-semibold text-neutral-800'>
                      Total {logs.length} Pembaruan
                    </p>
                    {logs.length > 0 && (
                      <p className='text-[11px]'>
                        Terakhir: {format(new Date(logs[0].created_at), 'dd MMM yyyy, HH:mm', { locale: idLocale })}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Riwayat Timeline */}
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <h3 className='text-sm font-bold text-neutral-900 flex items-center gap-2'>
                  <Clock className='h-4 w-4 text-neutral-600' />
                  Riwayat & Catatan Lapangan
                </h3>
                <span className='text-xs text-neutral-500 font-medium'>
                  {logs.length} Catatan
                </span>
              </div>

              {isLoading ? (
                <div className='flex h-40 items-center justify-center'>
                  <Loader2 className='h-6 w-6 animate-spin text-neutral-400' />
                </div>
              ) : logs.length === 0 ? (
                <div className='border border-dashed border-neutral-300 rounded-xl p-8 text-center bg-neutral-50/50 space-y-2'>
                  <div className='h-10 w-10 mx-auto rounded-full bg-orange-100 text-orange-600 flex items-center justify-center'>
                    <MapPin className='h-5 w-5' />
                  </div>
                  <p className='text-xs font-semibold text-neutral-800'>
                    Belum Ada Riwayat Kesiapan Lokasi
                  </p>
                  <p className='text-[11px] text-neutral-500 max-w-sm mx-auto'>
                    Tim Marketing belum menambahkan catatan kesiapan lokasi untuk proyek ini.
                  </p>
                </div>
              ) : (
                <div className='space-y-3'>
                  {logs.map((log, index) => {
                    const logStatus = getReadinessStatusInfo(log.persentase);

                    return (
                      <Card
                        key={log.id}
                        className='border border-neutral-200 shadow-xs hover:shadow-sm transition-all overflow-hidden bg-white'
                      >
                        {/* Header */}
                        <CardHeader className='p-3.5 pb-2.5 border-b border-neutral-100 bg-neutral-50/40'>
                          <div className='flex items-start justify-between gap-3'>
                            <div className='flex items-center gap-3'>
                              <div
                                className={cn(
                                  'h-8 w-11 rounded-lg flex items-center justify-center font-extrabold text-white text-xs shadow-xs shrink-0',
                                  logStatus.badgeBg
                                )}
                              >
                                {log.persentase}%
                              </div>

                              <div>
                                <div className='flex items-center gap-2 flex-wrap'>
                                  <h4 className='text-xs font-bold text-neutral-900 flex items-center gap-1'>
                                    <MapPin className='h-3 w-3 text-orange-600 shrink-0' />
                                    {log.ruang || 'Umum'}
                                  </h4>
                                  {index === 0 && (
                                    <span className='text-[9px] font-bold bg-orange-100 text-orange-800 px-1.5 py-0.2 rounded-full'>
                                      Terkini
                                    </span>
                                  )}
                                </div>
                                <p className='text-[10px] text-neutral-500 mt-0.5'>
                                  {format(new Date(log.created_at), 'EEEE, dd MMM yyyy - HH:mm', { locale: idLocale })}
                                  {' • '}Oleh: <strong className='text-neutral-700'>{log.user?.name || 'Marketing'}</strong>
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardHeader>

                        {/* Content */}
                        <CardContent className='p-3.5 space-y-3'>
                          <p className='text-xs leading-relaxed text-neutral-800 whitespace-pre-line'>
                            {log.keterangan}
                          </p>

                          {/* Media */}
                          {log.media && log.media.length > 0 && (
                            <div className='space-y-2.5 pt-2 border-t border-neutral-100'>
                              {/* Photos */}
                              {log.media.filter((m) => m.file_type === 'image').length > 0 && (
                                <div className='space-y-1.5'>
                                  <p className='text-[10px] font-semibold text-neutral-500 flex items-center gap-1'>
                                    <ImageIcon className='h-3 w-3' />
                                    Foto Lapangan:
                                  </p>
                                  <div className='grid grid-cols-3 sm:grid-cols-4 gap-2'>
                                    {log.media
                                      .filter((m) => m.file_type === 'image')
                                      .map((img) => (
                                        <div
                                          key={img.id}
                                          onClick={() => {
                                            setLightboxImage(img.url);
                                            setLightboxTitle(img.file_name || 'Foto Lapangan');
                                          }}
                                          className='group relative aspect-square rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100 cursor-pointer hover:border-orange-400 transition-all'
                                        >
                                          <img
                                            src={img.url}
                                            alt={img.file_name || 'Foto'}
                                            className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                                          />
                                          <div className='absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                                            <Eye className='h-4 w-4 text-white' />
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}

                              {/* Videos */}
                              {log.media.filter((m) => m.file_type === 'video').length > 0 && (
                                <div className='space-y-1.5'>
                                  <p className='text-[10px] font-semibold text-neutral-500 flex items-center gap-1'>
                                    <Video className='h-3 w-3' />
                                    Video Dokumentasi:
                                  </p>
                                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
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

          {/* Footer */}
          <DialogFooter className='p-4 border-t border-neutral-100 bg-neutral-50/50'>
            <Button variant='outline' size='sm' onClick={onClose} className='text-xs'>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox Modal for Photo Preview */}
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
    </>
  );
}
