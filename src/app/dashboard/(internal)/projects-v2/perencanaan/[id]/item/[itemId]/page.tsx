'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Loader2,
  Plus,
  FileText,
  Calendar,
  Activity,
  CheckCircle2,
  Eye,
  Upload,
  Package,
  Truck,
  Settings as SettingsIcon,
  ArrowUpRight,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  projectV2Service,
  TahapPengiriman,
  BarangJadiMasuk,
  BarangJadiKeluar,
  SuratJalan,
  SetrimKembali,
  Setting,
} from '@/features/projects/services/project-v2-service';

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const itemId = parseInt(params.itemId as string);
  const projectId = parseInt(params.id as string);

  const [isTahapDialogOpen, setIsTahapDialogOpen] = React.useState(false);
  const [newTahapNama, setNewTahapNama] = React.useState('');

  const [isKeluarDialogOpen, setIsKeluarDialogOpen] = React.useState(false);
  const [isSjDialogOpen, setIsSjDialogOpen] = React.useState(false);
  const [isSkDialogOpen, setIsSkDialogOpen] = React.useState(false);
  const [isSettingDialogOpen, setIsSettingDialogOpen] = React.useState(false);

  const [formData, setFormData] = React.useState({
    id: null as number | null,
    tahap_pengiriman_id: '',
    tanggal: format(new Date(), 'yyyy-MM-dd'),
    jumlah: 0,
    file: null as File | null,
    tanggal_mulai: format(new Date(), 'yyyy-MM-dd'),
    tanggal_selesai: '',
    koor_setting: '',
  });

  // Data Queries
  const { data: item, isLoading: isLoadingItem } = useQuery({
    queryKey: ['project-item-detail', itemId],
    queryFn: () => projectV2Service.getItemDetail(itemId),
  });

  const { data: stages } = useQuery({
    queryKey: ['tahap-pengiriman', projectId],
    queryFn: () => projectV2Service.getTahapPengiriman(projectId),
  });

  // Mutations
  const addTahapMutation = useMutation({
    mutationFn: (nama: string) =>
      projectV2Service.createTahapPengiriman(nama, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tahap-pengiriman', projectId],
      });
      toast.success('Tahap pengiriman added');
      setNewTahapNama('');
      setIsTahapDialogOpen(false);
    },
  });

  const storeKeluarMutation = useMutation({
    mutationFn: (payload: any) =>
      projectV2Service.storeBarangJadiKeluar(itemId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-item-detail', itemId],
      });
      toast.success('Barang keluar recorded');
      setIsKeluarDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Gagal mencatat barang keluar'
      );
    },
  });

  const storeSjMutation = useMutation({
    mutationFn: (payload: FormData) =>
      projectV2Service.storeSuratJalan(itemId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-item-detail', itemId],
      });
      toast.success('Surat jalan recorded');
      setIsSjDialogOpen(false);
    },
  });

  const storeSkMutation = useMutation({
    mutationFn: (payload: FormData) =>
      projectV2Service.storeSetrimKembali(itemId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-item-detail', itemId],
      });
      toast.success('Setrim kembali recorded');
      setIsSkDialogOpen(false);
    },
  });

  const storeSettingMutation = useMutation({
    mutationFn: (payload: any) =>
      formData.id
        ? projectV2Service.updateSetting(formData.id, payload)
        : projectV2Service.storeSetting(itemId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-item-detail', itemId],
      });
      toast.success(formData.id ? 'Setting updated' : 'Setting recorded');
      setIsSettingDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal menyimpan setting');
    },
  });

  const updateKeluarMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) =>
      projectV2Service.updateBarangJadiKeluar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-item-detail', itemId],
      });
      toast.success('Barang keluar updated');
      setIsKeluarDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Gagal mengupdate barang keluar'
      );
    },
  });

  const deleteKeluarMutation = useMutation({
    mutationFn: (id: number) => projectV2Service.deleteBarangJadiKeluar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-item-detail', itemId],
      });
      toast.success('Barang keluar deleted');
    },
  });

  const updateSjMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FormData }) =>
      projectV2Service.updateSuratJalan(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-item-detail', itemId],
      });
      toast.success('Surat jalan updated');
      setIsSjDialogOpen(false);
    },
  });

  const deleteSjMutation = useMutation({
    mutationFn: (id: number) => projectV2Service.deleteSuratJalan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-item-detail', itemId],
      });
      toast.success('Surat jalan deleted');
    },
  });

  const updateSkMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FormData }) =>
      projectV2Service.updateSetrimKembali(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-item-detail', itemId],
      });
      toast.success('Setrim kembali updated');
      setIsSkDialogOpen(false);
    },
  });

  const deleteSkMutation = useMutation({
    mutationFn: (id: number) => projectV2Service.deleteSetrimKembali(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-item-detail', itemId],
      });
      toast.success('Setrim kembali deleted');
    },
  });

  const deleteSettingMutation = useMutation({
    mutationFn: (id: number) => projectV2Service.deleteSetting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-item-detail', itemId],
      });
      toast.success('Setting deleted');
    },
  });

  const resetForm = () => {
    setFormData({
      id: null,
      tahap_pengiriman_id: '',
      tanggal: format(new Date(), 'yyyy-MM-dd'),
      jumlah: 0,
      file: null,
      tanggal_mulai: format(new Date(), 'yyyy-MM-dd'),
      tanggal_selesai: '',
      koor_setting: '',
    });
  };

  if (isLoadingItem) {
    return (
      <div className='flex h-[400px] items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-neutral-400' />
      </div>
    );
  }

  if (!item)
    return (
      <div className='p-8 text-center text-muted-foreground'>
        Item not found.
      </div>
    );

  const totalMasuk =
    item.barang_jadi_masuk?.reduce(
      (sum: number, bj: BarangJadiMasuk) => sum + Number(bj.jumlah || 0),
      0
    ) || 0;
  const totalKeluar =
    item.barang_jadi_keluar?.reduce(
      (sum: number, bj: BarangJadiKeluar) => sum + Number(bj.jumlah || 0),
      0
    ) || 0;
  const totalSetting =
    item.setting?.reduce(
      (sum: number, s: Setting) => sum + Number(s.jumlah || 0),
      0
    ) || 0;
  const belumTersetting = totalKeluar - totalSetting;

  return (
    <div className='flex flex-col gap-6 p-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' onClick={() => router.back()}>
            <ArrowLeft className='h-5 w-5' />
          </Button>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>
              Detail Item: {item.item}
            </h1>
            <p className='text-sm text-muted-foreground'>
              Tracking Shipment & Setting
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsTahapDialogOpen(true)}
          variant='outline'
          className='border-blue-200 text-blue-600 hover:bg-blue-50'
        >
          <Plus className='mr-2 h-4 w-4' />
          Tambah Tahap Pengiriman
        </Button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-xs font-bold uppercase text-neutral-500'>
              Total Masuk Lengkap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-600'>
              {totalMasuk} / {Number(item.jumlah || 0)}
            </div>
            <p className='text-[10px] text-muted-foreground'>
              Status dari Gudang
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-xs font-bold uppercase text-neutral-500'>
              Total Keluar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-orange-600'>
              {totalKeluar}
            </div>
            <p className='text-[10px] text-muted-foreground'>
              Total Barang Keluar
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-xs font-bold uppercase text-neutral-500'>
              Barang Keluar Belum Tersetting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600'>
              {belumTersetting}
            </div>
            <p className='text-[10px] text-muted-foreground'>
              Selisih Keluar & Setting
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-xs font-bold uppercase text-neutral-500'>
              Status Setting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-emerald-600'>
              {totalSetting}
            </div>
            <p className='text-[10px] text-muted-foreground'>
              Barang Ter-setting
            </p>
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 gap-6'>
        <Card className='border-none shadow-sm bg-white'>
          <CardHeader className='border-b'>
            <CardTitle className='flex items-center justify-between'>
              <span className='flex items-center gap-2'>
                <Truck className='h-5 w-5 text-blue-500' />
                Monitoring Pengiriman & Setting
              </span>
              <div className='flex gap-2'>
                <Button
                  size='sm'
                  onClick={() => {
                    resetForm();
                    setIsKeluarDialogOpen(true);
                  }}
                  className='bg-orange-600 hover:bg-orange-700'
                >
                  Barang Keluar
                </Button>
                <Button
                  size='sm'
                  onClick={() => {
                    resetForm();
                    setIsSjDialogOpen(true);
                  }}
                  className='bg-blue-600 hover:bg-blue-700'
                >
                  Surat Jalan
                </Button>
                <Button
                  size='sm'
                  onClick={() => {
                    resetForm();
                    setIsSkDialogOpen(true);
                  }}
                  className='bg-purple-600 hover:bg-purple-700'
                >
                  Setrim Kembali
                </Button>
                <Button
                  size='sm'
                  onClick={() => {
                    resetForm();
                    setIsSettingDialogOpen(true);
                  }}
                  className='bg-emerald-600 hover:bg-emerald-700'
                >
                  Setting
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className='p-0'>
            <Table>
              <TableHeader>
                <TableRow className='bg-neutral-50'>
                  <TableHead>Tahap Pengiriman</TableHead>
                  <TableHead>Barang Keluar</TableHead>
                  <TableHead>Surat Jalan</TableHead>
                  <TableHead>Setrim Kembali</TableHead>
                  <TableHead>Monitoring Setting</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stages?.map((stage: TahapPengiriman) => {
                  const keluar = item.barang_jadi_keluar?.filter(
                    (k: BarangJadiKeluar) => k.tahap_pengiriman_id == stage.id
                  );
                  const sj = item.surat_jalan?.filter(
                    (s: SuratJalan) => s.tahap_pengiriman_id == stage.id
                  );
                  const sk = item.setrim_kembali?.filter(
                    (s: SetrimKembali) => s.tahap_pengiriman_id == stage.id
                  );
                  const set = item.setting?.filter(
                    (s: Setting) => s.tahap_pengiriman_id == stage.id
                  );

                  return (
                    <TableRow key={stage.id}>
                      <TableCell className='font-bold'>{stage.nama}</TableCell>
                      <TableCell>
                        {keluar?.map((k: BarangJadiKeluar, i: number) => (
                          <div
                            key={i}
                            className='mb-1 p-2 rounded bg-orange-50 border border-orange-100 group relative'
                          >
                            <div className='flex justify-between items-start'>
                              <div>
                                <p className='text-xs font-bold text-orange-700'>
                                  Jumlah: {k.jumlah}
                                </p>
                                <p className='text-[10px] text-orange-600'>
                                  {format(new Date(k.tanggal), 'dd MMM yyyy')}
                                </p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant='ghost'
                                    size='icon'
                                    className='h-6 w-6 opacity-0 group-hover:opacity-100'
                                  >
                                    <MoreHorizontal className='h-3 w-3' />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setFormData({
                                        ...formData,
                                        id: k.id,
                                        tahap_pengiriman_id:
                                          k.tahap_pengiriman_id.toString(),
                                        tanggal: k.tanggal,
                                        jumlah: k.jumlah,
                                      });
                                      setIsKeluarDialogOpen(true);
                                    }}
                                  >
                                    <Pencil className='mr-2 h-3 w-3' /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className='text-red-600'
                                    onClick={() => {
                                      if (confirm('Hapus data ini?'))
                                        deleteKeluarMutation.mutate(k.id);
                                    }}
                                  >
                                    <Trash2 className='mr-2 h-3 w-3' /> Hapus
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </TableCell>
                      <TableCell>
                        {sj?.map((s: SuratJalan, i: number) => (
                          <div
                            key={i}
                            className='mb-1 p-2 rounded bg-blue-50 border border-blue-100 group'
                          >
                            <div className='flex items-center justify-between'>
                              <div>
                                <p className='text-[10px] text-blue-600'>
                                  {format(new Date(s.tanggal), 'dd MMM yyyy')}
                                </p>
                              </div>
                              <div className='flex items-center'>
                                {s.file && (
                                  <Button
                                    size='icon'
                                    variant='ghost'
                                    className='h-6 w-6'
                                    asChild
                                  >
                                    <a
                                      href={`${(
                                        process.env.NEXT_PUBLIC_API_URL ||
                                        'http://localhost:8000'
                                      ).replace('/api', '')}/storage/${s.file}`}
                                      target='_blank'
                                    >
                                      <Eye className='h-3 w-3' />
                                    </a>
                                  </Button>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant='ghost'
                                      size='icon'
                                      className='h-6 w-6 opacity-0 group-hover:opacity-100'
                                    >
                                      <MoreHorizontal className='h-3 w-3' />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setFormData({
                                          ...formData,
                                          id: s.id,
                                          tahap_pengiriman_id:
                                            s.tahap_pengiriman_id.toString(),
                                          tanggal: s.tanggal,
                                        });
                                        setIsSjDialogOpen(true);
                                      }}
                                    >
                                      <Pencil className='mr-2 h-3 w-3' /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className='text-red-600'
                                      onClick={() => {
                                        if (confirm('Hapus data ini?'))
                                          deleteSjMutation.mutate(s.id);
                                      }}
                                    >
                                      <Trash2 className='mr-2 h-3 w-3' /> Hapus
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        ))}
                      </TableCell>
                      <TableCell>
                        {sk?.map((s: SetrimKembali, i: number) => (
                          <div
                            key={i}
                            className='mb-1 p-2 rounded bg-purple-50 border border-purple-100 group'
                          >
                            <div className='flex items-center justify-between'>
                              <div>
                                <p className='text-[10px] text-purple-600'>
                                  {format(new Date(s.tanggal), 'dd MMM yyyy')}
                                </p>
                              </div>
                              <div className='flex items-center'>
                                {s.file && (
                                  <Button
                                    size='icon'
                                    variant='ghost'
                                    className='h-6 w-6'
                                    asChild
                                  >
                                    <a
                                      href={`${(
                                        process.env.NEXT_PUBLIC_API_URL ||
                                        'http://localhost:8000'
                                      ).replace('/api', '')}/storage/${s.file}`}
                                      target='_blank'
                                    >
                                      <Eye className='h-3 w-3' />
                                    </a>
                                  </Button>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant='ghost'
                                      size='icon'
                                      className='h-6 w-6 opacity-0 group-hover:opacity-100'
                                    >
                                      <MoreHorizontal className='h-3 w-3' />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setFormData({
                                          ...formData,
                                          id: s.id,
                                          tahap_pengiriman_id:
                                            s.tahap_pengiriman_id.toString(),
                                          tanggal: s.tanggal,
                                        });
                                        setIsSkDialogOpen(true);
                                      }}
                                    >
                                      <Pencil className='mr-2 h-3 w-3' /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className='text-red-600'
                                      onClick={() => {
                                        if (confirm('Hapus data ini?'))
                                          deleteSkMutation.mutate(s.id);
                                      }}
                                    >
                                      <Trash2 className='mr-2 h-3 w-3' /> Hapus
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        ))}
                      </TableCell>
                      <TableCell>
                        {set?.map((s: Setting, i: number) => (
                          <div
                            key={i}
                            className='mb-1 p-2 rounded bg-emerald-50 border border-emerald-100 group'
                          >
                            <div className='flex justify-between items-start'>
                              <div>
                                <p className='text-xs font-bold text-emerald-700'>
                                  Jumlah: {s.jumlah}
                                </p>
                                <Badge
                                  variant='outline'
                                  className='text-[9px] h-4'
                                >
                                  {s.koor_setting || 'No Koor'}
                                </Badge>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant='ghost'
                                    size='icon'
                                    className='h-6 w-6 opacity-0 group-hover:opacity-100'
                                  >
                                    <MoreHorizontal className='h-3 w-3' />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setFormData({
                                        ...formData,
                                        id: s.id,
                                        tahap_pengiriman_id:
                                          s.tahap_pengiriman_id.toString(),
                                        tanggal_mulai: s.tanggal_mulai,
                                        tanggal_selesai:
                                          s.tanggal_selesai || '',
                                        jumlah: s.jumlah,
                                        koor_setting: s.koor_setting || '',
                                      });
                                      setIsSettingDialogOpen(true);
                                    }}
                                  >
                                    <Pencil className='mr-2 h-3 w-3' /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className='text-red-600'
                                    onClick={() => {
                                      if (confirm('Hapus data ini?'))
                                        deleteSettingMutation.mutate(s.id);
                                    }}
                                  >
                                    <Trash2 className='mr-2 h-3 w-3' /> Hapus
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <p className='text-[9px] text-emerald-600 mt-1'>
                              Start:{' '}
                              {format(new Date(s.tanggal_mulai), 'dd/MM/yy')}
                            </p>
                            {s.tanggal_selesai && (
                              <p className='text-[9px] text-emerald-600'>
                                End:{' '}
                                {format(
                                  new Date(s.tanggal_selesai),
                                  'dd/MM/yy'
                                )}
                              </p>
                            )}
                          </div>
                        ))}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <AlertDialog open={isTahapDialogOpen} onOpenChange={setIsTahapDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tambah Tahap Pengiriman</AlertDialogTitle>
            <AlertDialogDescription>
              Masukkan nama tahap pengiriman (contoh: Tahap 1, Kirim Awal, dsb)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='py-4'>
            <Label>Nama Tahap</Label>
            <Input
              value={newTahapNama}
              onChange={(e) => setNewTahapNama(e.target.value)}
              placeholder='Contoh: Tahap 1'
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsTahapDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <Button onClick={() => addTahapMutation.mutate(newTahapNama)}>
              Tambah
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Barang Jadi Keluar Dialog */}
      <AlertDialog
        open={isKeluarDialogOpen}
        onOpenChange={setIsKeluarDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Catat Barang Jadi Keluar</AlertDialogTitle>
          </AlertDialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='space-y-2'>
              <Label>Tahap Pengiriman</Label>
              <Select
                value={formData.tahap_pengiriman_id}
                onValueChange={(val) =>
                  setFormData({ ...formData, tahap_pengiriman_id: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Pilih Tahap' />
                </SelectTrigger>
                <SelectContent>
                  {stages?.map((s: TahapPengiriman) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Tanggal</Label>
                <Input
                  type='date'
                  value={formData.tanggal}
                  onChange={(e) =>
                    setFormData({ ...formData, tanggal: e.target.value })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label>Jumlah</Label>
                <Input
                  type='number'
                  value={formData.jumlah === 0 ? '' : formData.jumlah || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      jumlah: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsKeluarDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </AlertDialogCancel>
            <Button
              onClick={() =>
                formData.id
                  ? updateKeluarMutation.mutate({
                      id: formData.id,
                      payload: {
                        tahap_pengiriman_id: formData.tahap_pengiriman_id,
                        tanggal: formData.tanggal,
                        jumlah: formData.jumlah,
                      },
                    })
                  : storeKeluarMutation.mutate({
                      tahap_pengiriman_id: formData.tahap_pengiriman_id,
                      tanggal: formData.tanggal,
                      jumlah: formData.jumlah,
                    })
              }
            >
              Simpan
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Surat Jalan Dialog */}
      <AlertDialog open={isSjDialogOpen} onOpenChange={setIsSjDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Upload Surat Jalan</AlertDialogTitle>
          </AlertDialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='space-y-2'>
              <Label>Tahap Pengiriman</Label>
              <Select
                value={formData.tahap_pengiriman_id}
                onValueChange={(val) =>
                  setFormData({ ...formData, tahap_pengiriman_id: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Pilih Tahap' />
                </SelectTrigger>
                <SelectContent>
                  {stages?.map((s: TahapPengiriman) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Tanggal</Label>
              <Input
                type='date'
                value={formData.tanggal}
                onChange={(e) =>
                  setFormData({ ...formData, tanggal: e.target.value })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>File Surat Jalan</Label>
              <Input
                type='file'
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    file: e.target.files?.[0] || null,
                  })
                }
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsSjDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </AlertDialogCancel>
            <Button
              onClick={() => {
                const fd = new FormData();
                fd.append('tahap_pengiriman_id', formData.tahap_pengiriman_id);
                fd.append('tanggal', formData.tanggal);
                if (formData.file) fd.append('file', formData.file);

                if (formData.id) {
                  updateSjMutation.mutate({ id: formData.id, payload: fd });
                } else {
                  storeSjMutation.mutate(fd);
                }
              }}
            >
              {formData.id ? 'Update' : 'Simpan'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Setrim Kembali Dialog */}
      <AlertDialog open={isSkDialogOpen} onOpenChange={setIsSkDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Upload Setrim Kembali</AlertDialogTitle>
          </AlertDialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='space-y-2'>
              <Label>Tahap Pengiriman</Label>
              <Select
                value={formData.tahap_pengiriman_id}
                onValueChange={(val) =>
                  setFormData({ ...formData, tahap_pengiriman_id: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Pilih Tahap' />
                </SelectTrigger>
                <SelectContent>
                  {stages?.map((s: TahapPengiriman) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Tanggal</Label>
              <Input
                type='date'
                value={formData.tanggal}
                onChange={(e) =>
                  setFormData({ ...formData, tanggal: e.target.value })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>File Setrim</Label>
              <Input
                type='file'
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    file: e.target.files?.[0] || null,
                  })
                }
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsSkDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </AlertDialogCancel>
            <Button
              onClick={() => {
                const fd = new FormData();
                fd.append('tahap_pengiriman_id', formData.tahap_pengiriman_id);
                fd.append('tanggal', formData.tanggal);
                if (formData.file) fd.append('file', formData.file);

                if (formData.id) {
                  updateSkMutation.mutate({ id: formData.id, payload: fd });
                } else {
                  storeSkMutation.mutate(fd);
                }
              }}
            >
              {formData.id ? 'Update' : 'Simpan'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Setting Dialog */}
      <AlertDialog
        open={isSettingDialogOpen}
        onOpenChange={setIsSettingDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Record Monitoring Setting</AlertDialogTitle>
          </AlertDialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='space-y-2'>
              <Label>Tahap Pengiriman</Label>
              <Select
                value={formData.tahap_pengiriman_id}
                onValueChange={(val) =>
                  setFormData({ ...formData, tahap_pengiriman_id: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Pilih Tahap' />
                </SelectTrigger>
                <SelectContent>
                  {stages?.map((s: TahapPengiriman) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Tanggal Mulai</Label>
                <Input
                  type='date'
                  value={formData.tanggal_mulai}
                  onChange={(e) =>
                    setFormData({ ...formData, tanggal_mulai: e.target.value })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label>Tanggal Selesai</Label>
                <Input
                  type='date'
                  value={formData.tanggal_selesai}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tanggal_selesai: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Jumlah</Label>
                <Input
                  type='number'
                  value={formData.jumlah === 0 ? '' : formData.jumlah || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      jumlah: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label>Koordinator Setting</Label>
                <Input
                  value={formData.koor_setting}
                  onChange={(e) =>
                    setFormData({ ...formData, koor_setting: e.target.value })
                  }
                  placeholder='Nama Koordinator'
                />
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsSettingDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </AlertDialogCancel>
            <Button
              onClick={() =>
                storeSettingMutation.mutate({
                  tahap_pengiriman_id: formData.tahap_pengiriman_id,
                  tanggal_mulai: formData.tanggal_mulai,
                  tanggal_selesai: formData.tanggal_selesai || null,
                  jumlah: formData.jumlah,
                  koor_setting: formData.koor_setting,
                })
              }
            >
              {formData.id ? 'Update' : 'Simpan'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
