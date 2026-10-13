'use client';

import * as React from 'react';
import { format, differenceInDays, startOfDay } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  Truck,
  Calendar,
  Building2,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  Layers,
  MapPin,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

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
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  projectV2Service,
  ProjectV2,
  JadwalPengiriman,
} from '@/features/projects/services/project-v2-service';

interface JadwalPengirimanViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectV2 | null;
}

export function JadwalPengirimanViewDialog({
  open,
  onOpenChange,
  project,
}: JadwalPengirimanViewDialogProps) {
  // Extract schedules directly from project prop
  const localSchedules: JadwalPengiriman[] = React.useMemo(() => {
    if (!project?.jadwal_pengiriman) return [];
    const raw = Array.isArray(project.jadwal_pengiriman)
      ? project.jadwal_pengiriman
      : [project.jadwal_pengiriman];

    return [...raw].sort((a, b) => {
      const dateA = a.tanggal || a.tanggal_pengiriman?.tanggal || '';
      const dateB = b.tanggal || b.tanggal_pengiriman?.tanggal || '';
      return dateA.localeCompare(dateB);
    });
  }, [project]);

  // Fallback query if project.jadwal_pengiriman is not loaded
  const { data: remoteSchedules = [], isLoading: isLoadingRemote } = useQuery({
    queryKey: ['jadwal-pengiriman', project?.id],
    queryFn: () =>
      project?.id
        ? projectV2Service.getJadwalPengiriman({ project_id: project.id })
        : Promise.resolve([]),
    enabled: open && !!project?.id && localSchedules.length === 0,
  });

  const schedules = localSchedules.length > 0 ? localSchedules : remoteSchedules;

  const spkNumber =
    project?.spk_number ||
    project?.spk?.nomor_spk ||
    (project?.spk as any)?.spk_number ||
    null;

  const firstDate = schedules[0]?.tanggal || schedules[0]?.tanggal_pengiriman?.tanggal;
  const lastDate =
    schedules[schedules.length - 1]?.tanggal ||
    schedules[schedules.length - 1]?.tanggal_pengiriman?.tanggal;

  const formatDateSafe = (dateStr?: string | null, pattern = 'EEEE, d MMMM yyyy') => {
    if (!dateStr) return '-';
    try {
      const cleanStr = String(dateStr).slice(0, 10);
      const parts = cleanStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) {
          return format(d, pattern, { locale: idLocale });
        }
      }
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? '-' : format(d, pattern, { locale: idLocale });
    } catch {
      return '-';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[620px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden'>
        {/* Header */}
        <DialogHeader className='p-5 pb-4 border-b border-neutral-100 bg-neutral-50/70'>
          <div className='flex items-start gap-3'>
            <div className='h-10 w-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 shadow-xs'>
              <Truck className='h-5 w-5' />
            </div>
            <div className='min-w-0 flex-1 space-y-1'>
              <DialogTitle className='text-base sm:text-lg font-bold text-neutral-900 leading-tight'>
                Rincian Jadwal Pengiriman
              </DialogTitle>
              <DialogDescription className='text-xs text-neutral-500 line-clamp-1'>
                Daftar tahapan pengiriman untuk proyek{' '}
                <strong className='text-neutral-800 font-semibold'>{project?.name}</strong>
              </DialogDescription>

              {/* Meta Tags */}
              <div className='flex items-center gap-2.5 flex-wrap pt-1 text-[11px] text-neutral-600'>
                {project?.client?.name && (
                  <span className='inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-neutral-200'>
                    <Building2 className='h-3 w-3 text-neutral-400' />
                    <span className='font-medium text-neutral-800 truncate max-w-[180px]'>
                      {project.client.name}
                    </span>
                  </span>
                )}
                {spkNumber && (
                  <span className='inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-neutral-200'>
                    <FileText className='h-3 w-3 text-neutral-400' />
                    <span className='font-mono font-medium text-neutral-800'>{spkNumber}</span>
                  </span>
                )}
                {project?.deadline && (
                  <span className='inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-neutral-200'>
                    <Calendar className='h-3 w-3 text-neutral-400' />
                    <span>Deadline: {formatDateSafe(project.deadline, 'dd MMM yyyy')}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className='flex-1 overflow-y-auto p-5 space-y-4'>
          {/* Summary Box */}
          <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
            <div className='p-3 rounded-xl bg-orange-50/60 border border-orange-200/70 text-center space-y-0.5'>
              <span className='text-[10px] font-bold uppercase tracking-wider text-orange-700'>
                Total Tahap
              </span>
              <p className='text-xl font-black text-orange-900'>
                {schedules.length}{' '}
                <span className='text-xs font-semibold text-orange-600'>Tahap</span>
              </p>
            </div>

            <div className='p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-center space-y-0.5'>
              <span className='text-[10px] font-bold uppercase tracking-wider text-neutral-500'>
                Tahap Pertama
              </span>
              <p className='text-xs sm:text-sm font-bold text-neutral-800 truncate'>
                {firstDate ? formatDateSafe(firstDate, 'dd MMM yyyy') : '-'}
              </p>
            </div>

            <div className='p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-center space-y-0.5 col-span-2 sm:col-span-1'>
              <span className='text-[10px] font-bold uppercase tracking-wider text-neutral-500'>
                Tahap Terakhir
              </span>
              <p className='text-xs sm:text-sm font-bold text-neutral-800 truncate'>
                {lastDate ? formatDateSafe(lastDate, 'dd MMM yyyy') : '-'}
              </p>
            </div>
          </div>

          {/* Schedule List */}
          <div className='space-y-2.5'>
            <div className='flex items-center justify-between pb-1'>
              <span className='text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5'>
                <CalendarDays className='h-3.5 w-3.5 text-orange-600' />
                Urutan Jadwal Pengiriman
              </span>
              <span className='text-[11px] text-muted-foreground'>
                {schedules.length} jadwal terdaftar
              </span>
            </div>

            {schedules.length === 0 ? (
              <div className='py-8 text-center text-xs text-muted-foreground italic border border-dashed rounded-xl'>
                Belum ada jadwal pengiriman untuk proyek ini.
              </div>
            ) : (
              <div className='space-y-2.5'>
                {schedules.map((s, idx) => {
                  const scheduleDate = s.tanggal || s.tanggal_pengiriman?.tanggal;
                  const diff =
                    scheduleDate && project?.deadline
                      ? differenceInDays(
                          startOfDay(new Date(project.deadline)),
                          startOfDay(new Date(scheduleDate))
                        )
                      : null;

                  const divisiNama = s.divisi?.nama;

                  return (
                    <div
                      key={s.id || idx}
                      className='p-3.5 rounded-xl border border-neutral-200 bg-white hover:border-orange-300 hover:shadow-xs transition-all space-y-2'
                    >
                      <div className='flex items-center justify-between gap-2 flex-wrap'>
                        <div className='flex items-center gap-2'>
                          <Badge
                            variant='outline'
                            className='text-[11px] font-bold bg-orange-50 text-orange-700 border-orange-200 px-2 h-5'
                          >
                            Tahap {idx + 1}
                          </Badge>
                          {divisiNama && (
                            <Badge
                              variant='secondary'
                              className='text-[10px] font-semibold bg-purple-50 text-purple-700 border-purple-200 border px-1.5 h-5'
                            >
                              {divisiNama}
                            </Badge>
                          )}
                        </div>

                        {diff !== null && (
                          <Badge
                            variant='secondary'
                            className={cn(
                              'text-[10px] h-5 px-2 font-medium',
                              diff < 0
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : diff === 0
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            )}
                          >
                            {diff < 0 ? (
                              <>
                                <AlertTriangle className='h-3 w-3 mr-1 inline' />
                                Lewat {Math.abs(diff)} hari
                              </>
                            ) : diff === 0 ? (
                              <>
                                <Clock className='h-3 w-3 mr-1 inline' />
                                Tepat Deadline
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className='h-3 w-3 mr-1 inline' />
                                {diff} hari sebelum deadline
                              </>
                            )}
                          </Badge>
                        )}
                      </div>

                      <div className='flex items-start justify-between gap-3 pt-0.5'>
                        <div className='space-y-1 min-w-0 flex-1'>
                          <div className='flex items-center gap-1.5 text-xs sm:text-sm font-bold text-neutral-900'>
                            <Calendar className='h-3.5 w-3.5 text-orange-500 shrink-0' />
                            <span>{formatDateSafe(scheduleDate)}</span>
                          </div>

                          {s.keterangan ? (
                            <p className='text-xs text-neutral-600 bg-neutral-50 p-2 rounded-lg border border-neutral-100 break-words'>
                              {s.keterangan}
                            </p>
                          ) : (
                            <p className='text-[11px] text-neutral-400 italic'>
                              Tidak ada catatan pengiriman
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className='p-4 border-t border-neutral-100 bg-neutral-50/50'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => onOpenChange(false)}
            className='bg-white'
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
