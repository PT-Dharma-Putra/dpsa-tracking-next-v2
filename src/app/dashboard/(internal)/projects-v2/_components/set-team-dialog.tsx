'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, Check, Users } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  projectV2Service,
  ProjectV2,
} from '@/features/projects/services/project-v2-service';

interface SetTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectV2 | null;
}

export function SetTeamDialog({
  open,
  onOpenChange,
  project,
}: SetTeamDialogProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);

  // Fetch divisions list
  const { data: divisions = [], isLoading: isLoadingDivisions } = useQuery({
    queryKey: ['divisions'],
    queryFn: () => projectV2Service.getDivisions(),
    enabled: open,
  });

  // Fetch project team detail on open
  const { data: teamData, isLoading: isLoadingTeam } = useQuery({
    queryKey: ['project-team', project?.id],
    queryFn: () =>
      project ? projectV2Service.getProjectTeam(project.id) : null,
    enabled: open && !!project?.id,
  });

  // Initialize selectedIds when teamData or project changes
  React.useEffect(() => {
    if (!open) return;

    let divisiIdStr =
      teamData?.divisi_id || project?.project_team?.divisi_id || '';
    if (divisiIdStr) {
      const ids = divisiIdStr
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((id) => !isNaN(id));
      setSelectedIds(ids);
    } else {
      setSelectedIds([]);
    }
  }, [open, teamData, project]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!project?.id) return;
      const formattedDivisiId = selectedIds.sort((a, b) => a - b).join(',');
      return await projectV2Service.updateProjectTeam(
        project.id,
        formattedDivisiId
      );
    },
    onSuccess: () => {
      toast.success('Team/Divisi berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['projects-v2'] });
      queryClient.invalidateQueries({
        queryKey: ['project-team', project?.id],
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Gagal memperbarui Team/Divisi'
      );
    },
  });

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === divisions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(divisions.map((d) => d.id));
    }
  };

  const filteredDivisions = divisions.filter(
    (d) =>
      d.nama.toLowerCase().includes(search.toLowerCase()) ||
      (d.nama_panjang &&
        d.nama_panjang.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px] max-h-[90vh] flex flex-col'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-xl font-bold'>
            <Users className='h-5 w-5 text-blue-600' />
            Set Team/Divisi
          </DialogTitle>
          <DialogDescription>
            Pilih divisi yang ditugaskan untuk mengerjakan project{' '}
            <span className='font-semibold text-foreground'>
              {project?.name || '-'}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className='py-3 space-y-3 flex-1 overflow-hidden flex flex-col'>
          {/* Search bar & Select All */}
          <div className='flex items-center gap-2'>
            <div className='relative flex-1'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Cari divisi...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='pl-8 h-9 text-sm'
              />
            </div>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={handleSelectAll}
              className='h-9 text-xs'
            >
              {selectedIds.length === divisions.length
                ? 'Batal Semua'
                : 'Pilih Semua'}
            </Button>
          </div>

          {/* Selected badges counter */}
          <div className='flex items-center justify-between text-xs text-muted-foreground px-1'>
            <span>Terpilih:</span>
            <Badge variant='secondary' className='font-mono'>
              {selectedIds.length} divisi
            </Badge>
          </div>

          {/* Divisi List */}
          {isLoadingDivisions || isLoadingTeam ? (
            <div className='h-48 flex items-center justify-center text-muted-foreground gap-2'>
              <Loader2 className='h-5 w-5 animate-spin' />
              <span>Memuat data divisi...</span>
            </div>
          ) : filteredDivisions.length === 0 ? (
            <div className='h-48 flex items-center justify-center text-muted-foreground text-sm'>
              Tidak ada divisi ditemukan.
            </div>
          ) : (
            <ScrollArea className='h-[280px] rounded-md border p-3'>
              <div className='space-y-2.5'>
                {filteredDivisions.map((divisi) => {
                  const isChecked = selectedIds.includes(divisi.id);
                  return (
                    <div
                      key={divisi.id}
                      onClick={() => toggleSelect(divisi.id)}
                      className={`flex items-start space-x-3 p-2.5 rounded-lg border transition-all cursor-pointer ${
                        isChecked
                          ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
                          : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Checkbox
                        id={`divisi-${divisi.id}`}
                        checked={isChecked}
                        onCheckedChange={() => toggleSelect(divisi.id)}
                        className='mt-0.5'
                      />
                      <div className='grid gap-0.5 leading-none flex-1'>
                        <Label
                          htmlFor={`divisi-${divisi.id}`}
                          className='font-semibold text-sm cursor-pointer'
                        >
                          {divisi.nama}
                        </Label>
                        {divisi.nama_panjang && (
                          <p className='text-xs text-muted-foreground'>
                            {divisi.nama_panjang}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className='gap-2 sm:gap-0'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={saveMutation.isPending}
          >
            Batal
          </Button>
          <Button
            type='button'
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className='bg-blue-600 hover:bg-blue-700 text-white'
          >
            {saveMutation.isPending && (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            )}
            Simpan Team/Divisi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
