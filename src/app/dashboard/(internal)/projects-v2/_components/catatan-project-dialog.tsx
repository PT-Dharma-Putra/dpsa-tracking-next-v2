'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, FileText, Send, Trash2 } from 'lucide-react';
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
import { toast } from 'sonner';
import {
  projectV2Service,
  ProjectV2,
} from '@/features/projects/services/project-v2-service';

interface CatatanProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectV2 | null;
  canEdit?: boolean;
}

export function CatatanProjectDialog({
  open,
  onOpenChange,
  project,
  canEdit = true,
}: CatatanProjectDialogProps) {
  const queryClient = useQueryClient();
  const [catatan, setCatatan] = React.useState('');

  React.useEffect(() => {
    if (open && project) {
      setCatatan(project.catatan || '');
    }
  }, [open, project]);

  const mutation = useMutation({
    mutationFn: async (catatanText: string | null) => {
      if (!project) return;
      return projectV2Service.updateCatatan(project.id, catatanText);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-v2'] });
      toast.success('Catatan proyek berhasil disimpan');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Gagal menyimpan catatan proyek'
      );
      console.error(error);
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(catatan.trim() || null);
  };

  const handleDelete = () => {
    mutation.mutate(null);
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[520px] flex flex-col rounded-xl p-0 overflow-hidden'>
        {/* Header */}
        <DialogHeader className='p-6 pb-4 border-b border-neutral-100'>
          <div className='flex items-center gap-3'>
            <div className='p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200'>
              <FileText className='h-5 w-5' />
            </div>
            <div>
              <DialogTitle className='text-lg font-bold text-neutral-900'>
                Catatan Proyek
              </DialogTitle>
              <DialogDescription className='text-neutral-500 text-xs mt-0.5'>
                Project:{' '}
                <strong className='text-neutral-700 font-semibold'>
                  {project.name}
                </strong>
                {project.client?.name && ` • Client: ${project.client.name}`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className='p-6 space-y-4'>
          {canEdit ? (
            <form id='catatan-form' onSubmit={handleSave} className='space-y-3'>
              <div className='flex items-center justify-between'>
                <label className='text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5'>
                  <FileText className='h-3.5 w-3.5 text-amber-600' />
                  Isi Catatan
                </label>
                {project.catatan && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={handleDelete}
                    disabled={mutation.isPending}
                    className='h-6 px-2 text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50'
                  >
                    <Trash2 className='h-3 w-3 mr-1' />
                    Hapus Catatan
                  </Button>
                )}
              </div>
              <Textarea
                rows={4}
                placeholder='Tuliskan catatan proyek di sini...'
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className='resize-none rounded-xl text-xs border-neutral-200 focus:border-amber-500 focus:ring-amber-500'
              />
              <p className='text-[11px] text-muted-foreground italic'>
                Catatan ini akan tersimpan pada detail proyek.
              </p>
            </form>
          ) : (
            <div className='space-y-2'>
              <h4 className='text-xs font-bold uppercase tracking-wider text-neutral-500'>
                Catatan
              </h4>
              {project.catatan ? (
                <div className='p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 text-xs text-neutral-800 whitespace-pre-wrap leading-relaxed'>
                  {project.catatan}
                </div>
              ) : (
                <p className='text-xs text-muted-foreground italic'>
                  Belum ada catatan untuk proyek ini.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className='p-4 pt-3 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            className='rounded-lg text-xs h-8'
          >
            Batal
          </Button>

          {canEdit && (
            <Button
              type='submit'
              form='catatan-form'
              disabled={mutation.isPending}
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
                  <span>Simpan Catatan</span>
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
