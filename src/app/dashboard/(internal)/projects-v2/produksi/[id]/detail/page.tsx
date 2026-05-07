'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  ArrowLeft,
  FileText,
  ListChecks,
  CheckCircle2,
  Eye,
  BarChart3,
} from 'lucide-react';
import { format } from 'date-fns';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

import {
  projectV2Service,
  ProjectItemV2,
  Produksi,
} from '@/features/projects/services/project-v2-service';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function ProduksiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = parseInt(params.id as string);

  // Data Queries
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ['projects-v2', projectId],
    queryFn: () => projectV2Service.getProject(projectId),
  });

  const { data: items, isLoading: isLoadingItems } = useQuery({
    queryKey: ['project-v2-items', projectId],
    queryFn: () => projectV2Service.getProjectItems(projectId),
  });

  // Produksi State
  const [isProduksiDialogOpen, setIsProduksiDialogOpen] = React.useState(false);
  const [produksiItem, setProduksiItem] = React.useState<ProjectItemV2 | null>(
    null
  );
  const [produksiData, setProduksiData] = React.useState<Partial<Produksi>>({});

  const updateProduksiMutation = useMutation({
    mutationFn: (payload: Partial<Produksi>) =>
      projectV2Service.updateProduksi(produksiItem!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-v2-items', projectId],
      });
      queryClient.invalidateQueries({ queryKey: ['projects-v2', projectId] });
      toast.success('Produksi updated');
      setIsProduksiDialogOpen(false);
    },
    onError: () => {
      toast.error('Failed to update Produksi');
    },
  });

  const handleProduksiUpdate = () => {
    if (!produksiItem) return;
    updateProduksiMutation.mutate(produksiData);
  };

  const openProduksiDialog = (item: ProjectItemV2) => {
    setProduksiItem(item);
    setProduksiData(
      item.produksi || {
        jumlah_order: item.jumlah,
        cold_press: 0,
        running_saw: 0,
        edging: 0,
        cnc: 0,
        tukang_kayu: 0,
        tukang_jok: 0,
        finishing: 0,
        rakit: 0,
        quality_control: 0,
        packing: 0,
        persen: 0,
      }
    );
    setIsProduksiDialogOpen(true);
  };

  React.useEffect(() => {
    if (!isProduksiDialogOpen) return;

    const fields = [
      'cold_press',
      'running_saw',
      'edging',
      'cnc',
      'tukang_kayu',
      'tukang_jok',
      'finishing',
      'rakit',
      'quality_control',
      'packing',
    ] as const;

    const totalSum = fields.reduce((sum, field) => {
      return sum + Number(produksiData[field] || 0);
    }, 0);

    const order = Number(produksiData.jumlah_order) || 1;

    // Hitung persen
    const calculatedPersen = Number(((totalSum * 10) / order).toFixed(2));

    // Hindari re-render tidak perlu
    setProduksiData((prev) => {
      if (prev.persen === calculatedPersen) return prev;

      return {
        ...prev,
        persen: calculatedPersen,
      };
    });
  }, [
    isProduksiDialogOpen,
    produksiData.cold_press,
    produksiData.running_saw,
    produksiData.edging,
    produksiData.cnc,
    produksiData.tukang_kayu,
    produksiData.tukang_jok,
    produksiData.finishing,
    produksiData.rakit,
    produksiData.quality_control,
    produksiData.packing,
    produksiData.jumlah_order,
  ]);

  if (isLoadingProject) {
    return (
      <div className='flex h-[400px] items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-neutral-400' />
      </div>
    );
  }

  if (!project) {
    return (
      <div className='p-8 text-center text-muted-foreground'>
        Project not found.
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-6 p-6'>
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' onClick={() => router.back()}>
          <ArrowLeft className='h-5 w-5' />
        </Button>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Produksi Detail</h1>
          <p className='text-sm text-muted-foreground'>
            Produksi View - Project Items Management
          </p>
        </div>
      </div>

      {/* Project Info Card */}
      <Card className='border-none shadow-sm bg-gradient-to-br from-white to-neutral-50/50'>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-neutral-500'>
            <FileText className='h-4 w-4 text-orange-500' />
            Project Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6'>
            <div className='space-y-1'>
              <Label className='text-[10px] text-muted-foreground uppercase'>
                Project Name
              </Label>
              <p className='font-bold text-neutral-900'>{project.name}</p>
            </div>
            <div className='space-y-1'>
              <Label className='text-[10px] text-muted-foreground uppercase'>
                Client
              </Label>
              <p className='font-semibold text-neutral-800'>
                {project.client?.name || '-'}
              </p>
            </div>
            <div className='space-y-1'>
              <Label className='text-[10px] text-muted-foreground uppercase'>
                SPK Number
              </Label>
              <p className='text-neutral-700'>
                {project.spk_number || project.spk?.nomor_spk || '-'}
              </p>
            </div>
            <div className='space-y-1'>
              <Label className='text-[10px] text-muted-foreground uppercase'>
                Deadline
              </Label>
              <p className='font-bold text-orange-600'>
                {project.deadline
                  ? format(new Date(project.deadline), 'MMM d, yyyy')
                  : '-'}
              </p>
            </div>
            <div className='space-y-1'>
              <Label className='text-[10px] text-muted-foreground uppercase'>
                Persentase per SPK
              </Label>
              <div className='flex items-center gap-3'>
                <div className='flex-1 max-w-[100px]'>
                  <Progress
                    value={project.progres_produksi || 0}
                    className='h-2 bg-neutral-100'
                  />
                </div>
                <span className='text-sm font-bold text-neutral-900'>
                  {Number(project.progres_produksi || 0).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Table Section */}
      <div className='space-y-4 pt-4 border-t'>
        <div className='flex justify-between items-center'>
          <h2 className='text-xl font-bold flex items-center gap-2'>
            <ListChecks className='h-5 w-5 text-neutral-400' />
            Project Items
          </h2>
        </div>

        <div className='rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm'>
          <Table>
            <TableHeader className='bg-neutral-50/80'>
              <TableRow>
                <TableHead className='w-[50px]'>#</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Desc</TableHead>
                <TableHead>Vol</TableHead>
                <TableHead>Dimensions</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Gambar Kerja</TableHead>
                <TableHead>PO Divisi</TableHead>
                <TableHead>Stok Material</TableHead>
                <TableHead>Persentase Produksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingItems ? (
                <TableRow>
                  <TableCell
                    colSpan={14}
                    className='h-32 text-center text-muted-foreground'
                  >
                    <Loader2 className='h-6 w-6 animate-spin mx-auto' />
                  </TableCell>
                </TableRow>
              ) : items?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={14}
                    className='h-32 text-center text-muted-foreground'
                  >
                    No items recorded for this project.
                  </TableCell>
                </TableRow>
              ) : (
                items?.map((item, index) => (
                  <TableRow
                    key={item.id}
                    className='hover:bg-neutral-50/50 transition-colors'
                  >
                    <TableCell className='text-muted-foreground font-medium'>
                      {index + 1}
                    </TableCell>
                    <TableCell className='text-xs font-medium'>
                      {item.lantai || '-'}
                    </TableCell>
                    <TableCell className='text-xs max-w-[120px] truncate'>
                      {item.ruang || '-'}
                    </TableCell>
                    <TableCell className='font-bold text-neutral-800'>
                      {item.item}
                    </TableCell>
                    <TableCell className='max-w-[150px] truncate text-xs text-muted-foreground'>
                      {item.keterangan || '-'}
                    </TableCell>
                    <TableCell className='font-bold text-blue-600 text-xs'>
                      {item.volume || '-'}
                    </TableCell>
                    <TableCell className='text-[10px] text-muted-foreground'>
                      {item.panjang || '-'}x{item.lebar || '-'}x
                      {item.tinggi || '-'} {item.satuan}
                    </TableCell>
                    <TableCell className='font-bold'>{item.jumlah}</TableCell>
                    <TableCell>
                      {item.gambar_kerja?.file ? (
                        <div className='flex items-center gap-2'>
                          <div className='h-6 w-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center'>
                            <CheckCircle2 className='h-3.5 w-3.5' />
                          </div>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-6 w-6 text-blue-600'
                            asChild
                          >
                            <a
                              href={`${(
                                process.env.NEXT_PUBLIC_API_URL ||
                                'http://localhost:8000'
                              ).replace('/api', '')}/storage/${
                                item.gambar_kerja.file
                              }`}
                              target='_blank'
                              rel='noopener noreferrer'
                            >
                              <Eye className='h-3.5 w-3.5' />
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <span className='text-[10px] text-muted-foreground italic'>
                          -
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.divisi ? (
                        <Badge
                          variant='outline'
                          className='bg-purple-50 text-purple-700 border-purple-200 font-bold'
                        >
                          {item.divisi.nama}
                        </Badge>
                      ) : (
                        <span className='text-[10px] text-muted-foreground italic'>
                          -
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.bahan_baku ? (
                        <div className='space-y-1 p-1'>
                          <Badge
                            variant='outline'
                            className={`font-bold ${
                              item.bahan_baku.ketersediaan_stok === 'Tersedia'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : item.bahan_baku.ketersediaan_stok ===
                                  'Belum Tersedia'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {item.bahan_baku.ketersediaan_stok}
                          </Badge>
                          {item.bahan_baku.pic && (
                            <p className='text-[9px] text-muted-foreground'>
                              PIC: {item.bahan_baku.pic.nama}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className='text-[10px] text-muted-foreground italic'>
                          -
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div
                        className='cursor-pointer hover:bg-neutral-100 p-2 rounded-lg transition-colors group'
                        onClick={() => openProduksiDialog(item)}
                      >
                        <div className='flex items-center justify-between mb-1'>
                          <span className='text-[10px] font-bold text-neutral-600'>
                            {Math.round(item.produksi?.persen || 0)}%
                          </span>
                          <BarChart3 className='h-3 w-3 text-neutral-300 group-hover:text-orange-500' />
                        </div>
                        <Progress
                          value={item.produksi?.persen || 0}
                          className='h-1.5 bg-neutral-100'
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Produksi Update Dialog */}
      <AlertDialog
        open={isProduksiDialogOpen}
        onOpenChange={setIsProduksiDialogOpen}
      >
        <AlertDialogContent className='max-w-2xl'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <BarChart3 className='h-5 w-5 text-orange-500' />
              Update Progress Produksi
            </AlertDialogTitle>
            <AlertDialogDescription>
              Input jumlah item yang telah selesai di setiap tahapan untuk:{' '}
              <strong>{produksiItem?.item}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='py-4 space-y-6'>
            {/* Jumlah Order - Top Center */}
            <div className='flex justify-center'>
              <div className='w-1/2 space-y-2 text-center'>
                <Label className='text-sm font-bold'>Jumlah Order</Label>
                <Input
                  type='number'
                  value={produksiData.jumlah_order || 0}
                  onChange={(e) =>
                    setProduksiData({
                      ...produksiData,
                      jumlah_order: parseInt(e.target.value),
                    })
                  }
                  disabled
                  className='bg-neutral-50 font-bold text-center text-lg h-12'
                />
              </div>
            </div>

            {/* Mesin Section */}
            <div className='space-y-3'>
              <h4 className='font-semibold text-sm text-neutral-500 uppercase tracking-wider border-b pb-2'>
                Mesin
              </h4>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>Cold Press</Label>
                  <Input
                    type='number'
                    value={
                      produksiData.cold_press === 0
                        ? ''
                        : produksiData.cold_press || ''
                    }
                    onChange={(e) =>
                      setProduksiData({
                        ...produksiData,
                        cold_press: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Running Saw</Label>
                  <Input
                    type='number'
                    value={
                      produksiData.running_saw === 0
                        ? ''
                        : produksiData.running_saw || ''
                    }
                    onChange={(e) =>
                      setProduksiData({
                        ...produksiData,
                        running_saw: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Edging</Label>
                  <Input
                    type='number'
                    value={
                      produksiData.edging === 0 ? '' : produksiData.edging || ''
                    }
                    onChange={(e) =>
                      setProduksiData({
                        ...produksiData,
                        edging: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label>CNC</Label>
                  <Input
                    type='number'
                    value={produksiData.cnc === 0 ? '' : produksiData.cnc || ''}
                    onChange={(e) =>
                      setProduksiData({
                        ...produksiData,
                        cnc: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Manual Section */}
            <div className='space-y-3'>
              <h4 className='font-semibold text-sm text-neutral-500 uppercase tracking-wider border-b pb-2'>
                Manual
              </h4>
              <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                <div className='space-y-2'>
                  <Label>Tukang Kayu</Label>
                  <Input
                    type='number'
                    value={
                      produksiData.tukang_kayu === 0
                        ? ''
                        : produksiData.tukang_kayu || ''
                    }
                    onChange={(e) =>
                      setProduksiData({
                        ...produksiData,
                        tukang_kayu: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Tukang Jok</Label>
                  <Input
                    type='number'
                    value={
                      produksiData.tukang_jok === 0
                        ? ''
                        : produksiData.tukang_jok || ''
                    }
                    onChange={(e) =>
                      setProduksiData({
                        ...produksiData,
                        tukang_jok: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Finishing</Label>
                  <Input
                    type='number'
                    value={
                      produksiData.finishing === 0
                        ? ''
                        : produksiData.finishing || ''
                    }
                    onChange={(e) =>
                      setProduksiData({
                        ...produksiData,
                        finishing: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Rakit</Label>
                  <Input
                    type='number'
                    value={
                      produksiData.rakit === 0 ? '' : produksiData.rakit || ''
                    }
                    onChange={(e) =>
                      setProduksiData({
                        ...produksiData,
                        rakit: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Quality Control</Label>
                  <Input
                    type='number'
                    value={
                      produksiData.quality_control === 0
                        ? ''
                        : produksiData.quality_control || ''
                    }
                    onChange={(e) =>
                      setProduksiData({
                        ...produksiData,
                        quality_control: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Packing</Label>
                  <Input
                    type='number'
                    value={
                      produksiData.packing === 0
                        ? ''
                        : produksiData.packing || ''
                    }
                    onChange={(e) =>
                      setProduksiData({
                        ...produksiData,
                        packing: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Persen Section */}
            <div className='pt-2 border-t'>
              <div className='space-y-2 max-w-[200px] mx-auto text-center'>
                <Label className='text-sm font-bold'>Persen (%)</Label>
                <Input
                  type='text'
                  value={
                    typeof produksiData.persen === 'number'
                      ? produksiData.persen.toFixed(2)
                      : (Number(produksiData.persen) || 0).toFixed(2)
                  }
                  disabled
                  className='bg-orange-50 font-bold text-orange-700 text-center text-lg h-12 disabled:opacity-100'
                />
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsProduksiDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <Button
              className='bg-orange-600 hover:bg-orange-700'
              onClick={handleProduksiUpdate}
              disabled={updateProduksiMutation.isPending}
            >
              {updateProduksiMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <CheckCircle2 className='mr-2 h-4 w-4' />
              )}
              Update Progress
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
