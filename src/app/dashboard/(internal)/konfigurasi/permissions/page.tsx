'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/features/admin/api/admin-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Key, Plus, Pencil, Trash2, Search, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function PermissionsManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    guard_name: 'web',
    menu_id: 'none',
    action: '',
  });

  // Fetch Permissions
  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['admin-permissions', search],
    queryFn: () => adminService.getPermissions({ search }),
  });

  // Fetch Menus for dropdown
  const { data: menus = [] } = useQuery({
    queryKey: ['admin-menus-flat'],
    queryFn: () => adminService.getMenus({ flat: true }),
    enabled: isDialogOpen,
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => adminService.createPermission(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['access-matrix'] });
      toast.success('Permission berhasil ditambahkan');
      handleCloseDialog();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menambahkan permission');
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      adminService.updatePermission(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['access-matrix'] });
      toast.success('Permission berhasil diperbarui');
      handleCloseDialog();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal memperbarui permission');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminService.deletePermission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['access-matrix'] });
      toast.success('Permission berhasil dihapus');
      setIsDeleteDialogOpen(false);
      setSelectedPermission(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menghapus permission');
    },
  });

  const handleOpenCreate = () => {
    setSelectedPermission(null);
    setFormData({
      name: '',
      guard_name: 'web',
      menu_id: 'none',
      action: '',
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setSelectedPermission(item);
    setFormData({
      name: item.name,
      guard_name: item.guard_name || 'web',
      menu_id: item.menu_id ? String(item.menu_id) : 'none',
      action: item.action || '',
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedPermission(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Nama permission wajib diisi');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      guard_name: formData.guard_name,
      menu_id: formData.menu_id === 'none' ? null : parseInt(formData.menu_id, 10),
      action: formData.action.trim() || undefined,
    };

    if (selectedPermission) {
      updateMutation.mutate({ id: selectedPermission.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedPermission) {
      deleteMutation.mutate(selectedPermission.id);
    }
  };

  return (
    <div className='p-6 space-y-6 max-w-7xl mx-auto'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight flex items-center gap-2'>
            <Key className='w-6 h-6 text-orange-600' /> Manajemen Permission Sistem
          </h1>
          <p className='text-muted-foreground text-sm'>
            Kelola seluruh permission (hak akses spesifik & kustom) yang terdaftar dalam sistem.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className='bg-orange-600 hover:bg-orange-700 text-white shrink-0'
        >
          <Plus className='w-4 h-4 mr-2' /> Tambah Permission
        </Button>
      </div>

      {/* Filter & Search */}
      <div className='flex items-center gap-4 bg-white p-4 border rounded-lg shadow-xs'>
        <div className='relative flex-1 max-w-md'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
          <Input
            placeholder='Cari nama permission, guard, atau action...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-9'
          />
        </div>
      </div>

      {/* Permission Table */}
      <div className='border rounded-lg bg-white overflow-hidden shadow-xs'>
        <Table>
          <TableHeader className='bg-neutral-50'>
            <TableRow>
              <TableHead className='w-[60px]'>#</TableHead>
              <TableHead>Nama Permission</TableHead>
              <TableHead>Guard Name</TableHead>
              <TableHead>Menu Terkait</TableHead>
              <TableHead>Action</TableHead>
              <TableHead className='text-right'>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className='h-32 text-center'>
                  <div className='flex justify-center items-center gap-2 text-muted-foreground'>
                    <Loader2 className='animate-spin text-orange-600 w-5 h-5' />
                    <span>Memuat daftar permission...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : permissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='h-24 text-center text-muted-foreground'>
                  Tidak ada permission ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              permissions.map((perm: any, index: number) => (
                <TableRow key={perm.id}>
                  <TableCell className='font-medium text-neutral-400'>
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <span className='font-semibold text-neutral-900 font-mono text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200'>
                      {perm.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant='outline' className='text-xs bg-slate-50 text-slate-700'>
                      {perm.guard_name || 'web'}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-slate-600 text-xs'>
                    {perm.menu ? perm.menu.name : <span className='text-slate-400 italic'>Sistem / General</span>}
                  </TableCell>
                  <TableCell className='text-slate-600 text-xs font-mono'>
                    {perm.action || '-'}
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex items-center justify-end gap-2'>
                      <Button
                        size='icon'
                        variant='ghost'
                        onClick={() => handleOpenEdit(perm)}
                        className='h-8 w-8 text-slate-600 hover:text-orange-600'
                      >
                        <Pencil className='w-4 h-4' />
                      </Button>
                      <Button
                        size='icon'
                        variant='ghost'
                        onClick={() => {
                          setSelectedPermission(perm);
                          setIsDeleteDialogOpen(true);
                        }}
                        className='h-8 w-8 text-slate-600 hover:text-red-600'
                      >
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='sm:max-w-[500px]'>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                <Key className='w-5 h-5 text-orange-600' />
                {selectedPermission ? 'Edit Permission' : 'Tambah Permission Baru'}
              </DialogTitle>
            </DialogHeader>

            <div className='grid gap-4 py-4'>
              <div className='grid gap-2'>
                <Label htmlFor='name'>Nama Permission *</Label>
                <Input
                  id='name'
                  placeholder='Contoh: update deadline, view confidential'
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <p className='text-[11px] text-muted-foreground'>
                  Gunakan format lowercase jelas, contoh: <code className='bg-slate-100 px-1 rounded'>update deadline</code>
                </p>
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='guard_name'>Guard Name</Label>
                <Select
                  value={formData.guard_name}
                  onValueChange={(val) => setFormData({ ...formData, guard_name: val })}
                >
                  <SelectTrigger id='guard_name'>
                    <SelectValue placeholder='Pilih Guard' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='web'>web (Default)</SelectItem>
                    <SelectItem value='api'>api</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='menu_id'>Menu Terkait (Opsional)</Label>
                <Select
                  value={formData.menu_id}
                  onValueChange={(val) => setFormData({ ...formData, menu_id: val })}
                >
                  <SelectTrigger id='menu_id'>
                    <SelectValue placeholder='Tanpa Menu (Sistem / General)' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='none'>Tanpa Menu (Sistem / General)</SelectItem>
                    {menus.map((m: any) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.name} ({m.url || 'No URL'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='action'>Action (Opsional)</Label>
                <Input
                  id='action'
                  placeholder='Contoh: update, read, update_deadline'
                  value={formData.action}
                  onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type='button' variant='outline' onClick={handleCloseDialog}>
                Batal
              </Button>
              <Button
                type='submit'
                className='bg-orange-600 hover:bg-orange-700 text-white'
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                )}
                {selectedPermission ? 'Simpan Perubahan' : 'Tambah Permission'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Permission</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus permission{' '}
              <strong className='font-mono text-neutral-900'>
                {selectedPermission?.name}
              </strong>
              ? Tindakan ini akan mencabut akses tersebut dari seluruh role & user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedPermission(null)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className='bg-red-600 hover:bg-red-700 text-white'
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
              )}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
