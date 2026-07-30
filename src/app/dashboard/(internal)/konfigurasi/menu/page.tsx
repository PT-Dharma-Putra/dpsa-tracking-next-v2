'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/features/admin/api/admin-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  List,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Check,
  Folder,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

const AVAILABLE_ACTION_OPTIONS = [
  'create',
  'read',
  'update',
  'delete',
  'sort',
  'export',
  'import',
];

export default function MenuManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    parent_id: 'none',
    url: '',
    icon: 'List',
    order: 1,
    is_active: true,
    available_actions: ['create', 'read', 'update', 'delete'],
  });

  // Fetch All Hierarchical Menus
  const { data: menus = [], isLoading } = useQuery({
    queryKey: ['admin-menus', search],
    queryFn: () => adminService.getMenus({ search }),
  });

  // Fetch Parent Menus for Dropdown
  const { data: parentMenus = [] } = useQuery({
    queryKey: ['admin-parent-menus'],
    queryFn: adminService.getParentMenus,
    enabled: isDialogOpen,
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => adminService.createMenu(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menus'] });
      queryClient.invalidateQueries({ queryKey: ['admin-parent-menus'] });
      queryClient.invalidateQueries({ queryKey: ['access-matrix'] });
      queryClient.invalidateQueries({ queryKey: ['user-sidebar-menus'] });
      toast.success('Menu baru berhasil ditambahkan');
      closeDialog();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal membuat menu');
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      adminService.updateMenu(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menus'] });
      queryClient.invalidateQueries({ queryKey: ['admin-parent-menus'] });
      queryClient.invalidateQueries({ queryKey: ['access-matrix'] });
      queryClient.invalidateQueries({ queryKey: ['user-sidebar-menus'] });
      toast.success('Menu berhasil diperbarui');
      closeDialog();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal memperbarui menu');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminService.deleteMenu(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menus'] });
      queryClient.invalidateQueries({ queryKey: ['admin-parent-menus'] });
      queryClient.invalidateQueries({ queryKey: ['access-matrix'] });
      queryClient.invalidateQueries({ queryKey: ['user-sidebar-menus'] });
      toast.success('Menu berhasil dihapus');
      setIsDeleteDialogOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menghapus menu');
    },
  });

  const openCreateDialog = (parentId?: number) => {
    setSelectedMenu(null);
    setFormData({
      name: '',
      parent_id: parentId ? parentId.toString() : 'none',
      url: '',
      icon: 'List',
      order: 1,
      is_active: true,
      available_actions: ['create', 'read', 'update', 'delete'],
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (menu: any) => {
    setSelectedMenu(menu);
    setFormData({
      name: menu.name,
      parent_id: menu.parent_id ? menu.parent_id.toString() : 'none',
      url: menu.url || '',
      icon: menu.icon || 'List',
      order: menu.order || 1,
      is_active: menu.is_active ?? true,
      available_actions: menu.available_actions || ['read'],
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedMenu(null);
  };

  const handleSubmit = () => {
    const payload = {
      ...formData,
      parent_id:
        formData.parent_id === 'none' ? null : Number(formData.parent_id),
      order: Number(formData.order),
    };

    if (selectedMenu) {
      updateMutation.mutate({ id: selectedMenu.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const toggleActionOption = (actionName: string) => {
    setFormData((prev) => {
      const current = prev.available_actions;
      if (current.includes(actionName)) {
        // Prevent removing 'read'
        if (actionName === 'read') return prev;
        return {
          ...prev,
          available_actions: current.filter((a) => a !== actionName),
        };
      } else {
        return { ...prev, available_actions: [...current, actionName] };
      }
    });
  };

  return (
    <div className='p-6 space-y-6 max-w-7xl mx-auto'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight flex items-center gap-2'>
            <List className='w-6 h-6 text-orange-600' /> Manajemen Menu Sistem
          </h1>
          <p className='text-muted-foreground text-sm'>
            Kelola struktur menu, hirarki parent-child, dan daftar aksi
            (permission) untuk setiap modulnya.
          </p>
        </div>
        <Button
          onClick={() => openCreateDialog()}
          className='bg-orange-600 hover:bg-orange-700 text-white'
        >
          <Plus className='w-4 h-4 mr-2' /> Tambah Menu
        </Button>
      </div>

      <div className='flex items-center justify-between gap-4 bg-white p-4 rounded-lg border shadow-xs'>
        <div className='relative w-full sm:w-80'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400' />
          <Input
            placeholder='Cari nama menu...'
            className='pl-9'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className='border rounded-lg bg-white overflow-hidden shadow-xs'>
        <Table>
          <TableHeader className='bg-neutral-50'>
            <TableRow>
              <TableHead className='w-[60px]'>#</TableHead>
              <TableHead>Nama Menu</TableHead>
              <TableHead>URL Target / Route</TableHead>
              <TableHead>Urutan</TableHead>
              <TableHead>Action Permissions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='text-right'>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className='h-32 text-center'>
                  <div className='flex justify-center items-center gap-2 text-muted-foreground'>
                    <Loader2 className='animate-spin text-orange-600 w-5 h-5' />
                    <span>Memuat data menu...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : menus.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className='h-24 text-center text-muted-foreground'
                >
                  Tidak ada data menu.
                </TableCell>
              </TableRow>
            ) : (
              menus.map((parent: any, pIndex: number) => (
                <React.Fragment key={parent.id}>
                  {/* Parent Row */}
                  <TableRow className='bg-neutral-50/80 font-medium'>
                    <TableCell className='text-neutral-400 font-medium'>
                      {pIndex + 1}
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2 font-bold text-neutral-900'>
                        <Folder className='w-4 h-4 text-orange-600' />
                        <span>{parent.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className='text-xs font-mono text-neutral-600'>
                      {parent.url || '#'}
                    </TableCell>
                    <TableCell>
                      <Badge variant='secondary'>{parent.order}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-wrap gap-1'>
                        {(parent.available_actions || []).map((act: string) => (
                          <Badge
                            key={act}
                            variant='outline'
                            className='text-[10px] uppercase bg-white'
                          >
                            {act}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          parent.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {parent.is_active ? 'Aktif' : 'Non-Aktif'}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex items-center justify-end gap-1'>
                        <Button
                          size='xs'
                          variant='ghost'
                          title='Tambah Submenu'
                          onClick={() => openCreateDialog(parent.id)}
                        >
                          <Plus className='w-3.5 h-3.5 text-blue-600' />
                        </Button>
                        <Button
                          size='xs'
                          variant='ghost'
                          title='Edit'
                          onClick={() => openEditDialog(parent)}
                        >
                          <Pencil className='w-3.5 h-3.5 text-amber-600' />
                        </Button>
                        <Button
                          size='xs'
                          variant='ghost'
                          title='Hapus'
                          onClick={() => {
                            setSelectedMenu(parent);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className='w-3.5 h-3.5 text-red-600' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Children Submenu Rows */}
                  {(parent.children || []).map((child: any) => (
                    <TableRow key={child.id} className='hover:bg-neutral-50/50'>
                      <TableCell></TableCell>
                      <TableCell className='pl-8'>
                        <div className='flex items-center gap-2 text-neutral-700'>
                          <FileText className='w-3.5 h-3.5 text-neutral-400' />
                          <span>{child.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className='text-xs font-mono text-neutral-500'>
                        {child.url}
                      </TableCell>
                      <TableCell>
                        <span className='text-xs text-neutral-500'>
                          {child.order}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className='flex flex-wrap gap-1'>
                          {(child.available_actions || []).map(
                            (act: string) => (
                              <Badge
                                key={act}
                                variant='outline'
                                className='text-[10px] capitalize bg-slate-50'
                              >
                                {act}
                              </Badge>
                            )
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            child.is_active
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }
                          variant='outline'
                        >
                          {child.is_active ? 'Aktif' : 'Non-Aktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex items-center justify-end gap-1'>
                          <Button
                            size='xs'
                            variant='ghost'
                            title='Edit'
                            onClick={() => openEditDialog(child)}
                          >
                            <Pencil className='w-3.5 h-3.5 text-amber-600' />
                          </Button>
                          <Button
                            size='xs'
                            variant='ghost'
                            title='Hapus'
                            onClick={() => {
                              setSelectedMenu(child);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className='w-3.5 h-3.5 text-red-600' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Menu Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>
              {selectedMenu ? 'Edit Menu' : 'Tambah Menu Baru'}
            </DialogTitle>
          </DialogHeader>
          <div className='grid gap-4 py-2'>
            <div className='grid gap-2'>
              <Label htmlFor='name'>Nama Menu</Label>
              <Input
                id='name'
                placeholder='Contoh: Manajemen User'
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='grid gap-2'>
                <Label>Parent Menu</Label>
                <Select
                  value={formData.parent_id}
                  onValueChange={(val) =>
                    setFormData({ ...formData, parent_id: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Pilih Parent' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='none'>
                      Tanpa Parent (Top Level)
                    </SelectItem>
                    {parentMenus
                      .filter((p: any) => p.id !== selectedMenu?.id)
                      .map((p: any) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='order'>Urutan (Order)</Label>
                <Input
                  id='order'
                  type='number'
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({ ...formData, order: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='url'>URL Target / Route</Label>
              <Input
                id='url'
                placeholder='Contoh: /dashboard/admin/users'
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
              />
            </div>
            <div className='grid gap-2'>
              <Label>Available Actions (Permission)</Label>
              <div className='grid grid-cols-3 gap-2 border p-3 rounded-md bg-neutral-50/50'>
                {AVAILABLE_ACTION_OPTIONS.map((action) => {
                  const isChecked = formData.available_actions.includes(action);
                  return (
                    <div
                      key={action}
                      onClick={() => toggleActionOption(action)}
                      className='flex items-center space-x-2 cursor-pointer'
                    >
                      <Checkbox checked={isChecked} />
                      <span className='text-xs font-medium capitalize'>
                        {action}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className='flex items-center justify-between border-t pt-3'>
              <Label htmlFor='is_active' className='cursor-pointer'>
                Status Aktif
              </Label>
              <Switch
                id='is_active'
                checked={formData.is_active}
                onCheckedChange={(val) =>
                  setFormData({ ...formData, is_active: val })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={closeDialog}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className='bg-orange-600 hover:bg-orange-700 text-white'
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className='w-4 h-4 animate-spin mr-2' />
              )}
              {selectedMenu ? 'Simpan Perubahan' : 'Tambah Menu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Menu Ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus menu{' '}
              <strong>{selectedMenu?.name}</strong> beserta seluruh sub-menu dan
              permission yang terkait dengannya.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Batal
            </AlertDialogCancel>
            <Button
              variant='destructive'
              disabled={deleteMutation.isPending}
              onClick={() =>
                selectedMenu && deleteMutation.mutate(selectedMenu.id)
              }
            >
              {deleteMutation.isPending ? (
                <Loader2 className='w-4 h-4 animate-spin mr-2' />
              ) : null}
              Ya, Hapus
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
