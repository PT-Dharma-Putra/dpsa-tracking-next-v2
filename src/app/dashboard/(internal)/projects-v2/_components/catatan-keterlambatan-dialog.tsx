'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  Clock,
  User,
  AlertCircle,
  FileText,
  Send,
  MessageSquare,
  Info,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  projectV2Service,
  ProjectV2,
  CatatanKeterlambatan,
} from '@/features/projects/services/project-v2-service';
import { useAuth } from '@/hooks/use-auth';

interface CatatanKeterlambatanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectV2 | null;
  canEdit?: boolean;
  isViewOnlyAllDashboard?: boolean;
}

export function CatatanKeterlambatanDialog({
  open,
  onOpenChange,
  project,
  canEdit: canEditProp,
  isViewOnlyAllDashboard = false,
}: CatatanKeterlambatanDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [newCatatan, setNewCatatan] = React.useState('');

  const userRole = (user?.role || '').toLowerCase();
  const userRoles = Array.isArray(user?.roles)
    ? user.roles.map((r: any) =>
        (typeof r === 'string' ? r : r.name).toLowerCase()
      )
    : [];

  const isMarketingOrPpic =
    userRole === 'marketing' ||
    userRole === 'ppic' ||
    userRole === 'super-admin' ||
    userRole === 'admin' ||
    userRoles.includes('marketing') ||
    userRoles.includes('ppic') ||
    userRoles.includes('super-admin');

  const canEdit =
    canEditProp !== undefined
      ? canEditProp && !isViewOnlyAllDashboard
      : isMarketingOrPpic && !isViewOnlyAllDashboard;

  // Fetch all delay notes for this project
  const {
    data: notes = [],
    isLoading,
    refetch,
  } = useQuery<CatatanKeterlambatan[]>({
    queryKey: ['project-catatan-keterlambatan', project?.id],
    queryFn: async () => {
      if (!project?.id) return [];
      return projectV2Service.getCatatanKeterlambatan(project.id);
    },
    enabled: open && !!project?.id,
    initialData: () => {
      if (project?.catatan_keterlambatans && project.catatan_keterlambatans.length > 0) {
        return project.catatan_keterlambatans;
      }
      if (project?.catatan_keterlambatan) {
        return [project.catatan_keterlambatan];
      }
      return [];
    },
  });

  React.useEffect(() => {
    if (!open) {
      setNewCatatan('');
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: async (catatanText: string) => {
      if (!project) return;
      return projectV2Service.addCatatanKeterlambatan(
        project.id,
        catatanText.trim()
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-catatan-keterlambatan', project?.id],
      });
      queryClient.invalidateQueries({ queryKey: ['projects-v2'] });
      toast.success('Catatan keterlambatan berhasil ditambahkan');
      setNewCatatan('');
      refetch();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          'Gagal menambahkan catatan keterlambatan'
      );
      console.error(error);
    },
  });

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatatan.trim()) {
      toast.error('Isi catatan tidak boleh kosong');
      return;
    }
    mutation.mutate(newCatatan);
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[580px] max-h-[85vh] flex flex-col rounded-xl p-0 overflow-hidden'>
        {/* Header */}
        <DialogHeader className='p-6 pb-4 border-b border-neutral-100'>
          <div className='flex items-center gap-3'>
            <div className='p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200'>
              <FileText className='h-5 w-5' />
            </div>
            <div>
              <DialogTitle className='text-lg font-bold text-neutral-900 flex items-center gap-2'>
                Catatan Keterlambatan
                {notes.length > 0 && (
                  <Badge variant='secondary' className='text-xs font-semibold bg-amber-100 text-amber-800 border-amber-200'>
                    {notes.length} Catatan
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className='text-neutral-500 text-xs mt-0.5'>
                Project: <strong className='text-neutral-700 font-semibold'>{project.name}</strong>
                {project.client?.name && ` • Client: ${project.client.name}`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className='flex-1 overflow-y-auto p-6 space-y-5'>
          {/* Riwayat Catatan */}
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <h4 className='text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5'>
                <MessageSquare className='h-3.5 w-3.5 text-neutral-400' />
                Riwayat Catatan
              </h4>
              <span className='text-[11px] text-muted-foreground italic'>
                Catatan tidak dapat diedit atau dihapus
              </span>
            </div>

            {isLoading && notes.length === 0 ? (
              <div className='flex items-center justify-center p-8 text-neutral-400'>
                <Loader2 className='h-5 w-5 animate-spin mr-2' />
                <span className='text-xs'>Memuat catatan...</span>
              </div>
            ) : notes.length === 0 ? (
              <div className='p-6 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 text-center'>
                <Info className='h-8 w-8 text-neutral-300 mx-auto mb-2' />
                <p className='text-xs text-neutral-500 font-medium'>
                  Belum ada catatan keterlambatan untuk project ini.
                </p>
                {canEdit && (
                  <p className='text-[11px] text-neutral-400 mt-1'>
                    Gunakan form di bawah untuk menambahkan catatan keterlambatan pertama.
                  </p>
                )}
              </div>
            ) : (
              <div className='space-y-3'>
                {notes.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className='p-3.5 rounded-xl border border-neutral-200 bg-white shadow-xs hover:border-amber-200 transition-colors space-y-2'
                  >
                    {/* Note header: User & Time */}
                    <div className='flex items-center justify-between text-xs text-muted-foreground border-b border-neutral-100 pb-2'>
                      <div className='flex items-center gap-1.5 font-medium text-neutral-800'>
                        <User className='h-3.5 w-3.5 text-amber-600' />
                        <span>{item.user?.name || 'User'}</span>
                      </div>
                      <div className='flex items-center gap-1 text-[11px] text-neutral-500'>
                        <Clock className='h-3 w-3 text-neutral-400' />
                        <span>
                          {item.created_at
                            ? format(new Date(item.created_at), 'dd MMM yyyy, HH:mm', {
                                locale: idLocale,
                              }) + ' WIB'
                            : '-'}
                        </span>
                      </div>
                    </div>

                    {/* Note body */}
                    <div className='text-xs text-neutral-700 whitespace-pre-wrap leading-relaxed pt-0.5'>
                      {item.catatan}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Tambah Catatan Baru */}
          {canEdit ? (
            <form onSubmit={handleAddNote} className='space-y-2.5 pt-2 border-t border-neutral-100'>
              <div className='flex items-center justify-between'>
                <label className='text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5'>
                  <Send className='h-3.5 w-3.5 text-amber-600' />
                  Tambah Catatan Baru
                </label>
                <span className='text-[11px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200'>
                  Marketing / PPIC
                </span>
              </div>
              <Textarea
                rows={3}
                placeholder='Tuliskan catatan atau kendala keterlambatan baru di sini...'
                value={newCatatan}
                onChange={(e) => setNewCatatan(e.target.value)}
                className='resize-none rounded-xl text-xs border-neutral-200 focus:border-amber-500 focus:ring-amber-500'
              />
              <div className='flex items-center justify-between'>
                <p className='text-[11px] text-muted-foreground italic'>
                  Catatan yang telah dikirim tidak dapat diubah atau dihapus kembali.
                </p>
                <Button
                  type='submit'
                  disabled={mutation.isPending || !newCatatan.trim()}
                  className='bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 px-3 rounded-lg shadow-sm gap-1.5'
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className='h-3.5 w-3.5 animate-spin' />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Send className='h-3.5 w-3.5' />
                      <span>Kirim Catatan</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className='pt-2 border-t border-neutral-100'>
              {isViewOnlyAllDashboard ? (
                <div className='flex items-start gap-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-600'>
                  <Info className='h-4 w-4 text-neutral-500 shrink-0 mt-0.5' />
                  <div>
                    <strong className='font-semibold text-neutral-800'>Halaman View Only</strong>
                    <p className='text-[11px] text-neutral-500 mt-0.5'>
                      Halaman Dashboard All hanya bersifat pemantauan. Penambahan catatan keterlambatan dapat dilakukan melalui halaman kerja masing-masing (Marketing / PPIC).
                    </p>
                  </div>
                </div>
              ) : (
                <div className='flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800'>
                  <AlertCircle className='h-4 w-4 text-amber-600 shrink-0' />
                  <span>
                    Hanya tim Marketing atau PPIC yang dapat menambahkan catatan keterlambatan baru.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className='p-4 pt-3 border-t border-neutral-100 bg-neutral-50/50'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            className='rounded-lg text-xs h-8'
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
