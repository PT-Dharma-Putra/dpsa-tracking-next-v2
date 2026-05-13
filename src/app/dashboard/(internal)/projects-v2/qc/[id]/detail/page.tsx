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
  Upload,
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
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function QCDetailPage() {
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
  const [skippedFields, setSkippedFields] = React.useState<Record<string, boolean>>({});

  // QC Cek State
  const [isQcDialogOpen, setIsQcDialogOpen] = React.useState(false);
  const [qcItem, setQcItem] = React.useState<ProjectItemV2 | null>(null);
  const [qcData, setQcData] = React.useState<{ qty: number; status: string; file: File | null }>({
    qty: 0,
    status: 'Pending',
    file: null,
  });

  const updateQcMutation = useMutation({
    mutationFn: (payload: { qty: number; status: string; file: File | null }) =>
      projectV2Service.updateQcCek(qcItem!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-v2-items', projectId],
      });
      toast.success('QC Check updated');
      setIsQcDialogOpen(false);
    },
    onError: () => {
      toast.error('Failed to update QC Check');
    },
  });

  const handleQcUpdate = () => {
    if (!qcItem) return;
    updateQcMutation.mutate(qcData);
  };

  const openQcDialog = (item: ProjectItemV2) => {
    setQcItem(item);
    setQcData({
      qty: item.qc_cek?.qty || item.jumlah,
      status: item.qc_cek?.status || 'Pass',
      file: null,
    });
    setIsQcDialogOpen(true);
  };

  const toggleSkipField = (field: string) => {
    setSkippedFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

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
    const skippedList = Object.keys(skippedFields).filter((k) => skippedFields[k]);
    updateProduksiMutation.mutate({ ...produksiData, skipped_fields: skippedList });
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
    if (produksiItem?.id !== item.id) {
      const saved = item.produksi?.skipped_fields ?? [];
      setSkippedFields(
        saved.reduce<Record<string, boolean>>((acc, field) => {
          acc[field] = true;
          return acc;
        }, {})
      );
    }
    setIsProduksiDialogOpen(true);
  };

  React.useEffect(() => {
    if (!isProduksiDialogOpen) return;

    const allFields = [
      'cold_press',
      'running_saw',
      'edging',
      'cnc',
      'tukang_kayu',
      'tukang_jok',
      'rakit',
      'finishing',
    ] as const;

    const activeFields = allFields.filter((f) => !skippedFields[f]);

    const totalSum = activeFields.reduce((sum, field) => {
      return sum + Number(produksiData[field] || 0);
    }, 0);

    const order = Number(produksiData.jumlah_order) || 1;

    // Hitung persen: field yang dilewati tidak ikut kalkulasi
    const calculatedPersen =
      activeFields.length === 0
        ? 0
        : Number(((totalSum * 100) / (activeFields.length * order)).toFixed(2));

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
    produksiData.rakit,
    produksiData.finishing,
    produksiData.jumlah_order,
    skippedFields,
  ]);

  const qcPassPercentage = React.useMemo(() => {
    if (!items || items.length === 0) return 0;
    const totalQty = items.reduce((sum, item) => sum + item.jumlah, 0);
    const totalPassed = items.reduce((sum, item) => {
      if (item.qc_cek?.status === 'Pass') {
        return sum + (item.qc_cek.qty || 0);
      }
      return sum;
    }, 0);
    return totalQty > 0 ? (totalPassed / totalQty) * 100 : 0;
  }, [items]);

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
          <h1 className='text-2xl font-bold tracking-tight'>Quality Control (QC) Detail</h1>
          <p className='text-sm text-muted-foreground'>
            QC View - Project Items Management
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
                Target Produksi
              </Label>
              <div className='flex items-center gap-2'>
                {project.order_produksi && project.order_produksi.length > 0 ? (
                  <>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-6 w-6 text-blue-600 hover:bg-blue-50'
                      asChild
                    >
                      <a
                        href={`${(
                          process.env.NEXT_PUBLIC_API_URL ||
                          'http://localhost:8000'
                        ).replace('/api', '')}/storage/${
                          project.order_produksi[project.order_produksi.length - 1]
                            .file
                        }`}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        <Eye className='h-3.5 w-3.5' />
                      </a>
                    </Button>
                    <p className='font-bold text-blue-600'>
                      {format(
                        new Date(
                          project.order_produksi[
                            project.order_produksi.length - 1
                          ].target_selesai!
                        ),
                        'MMM d, yyyy'
                      )}
                    </p>
                  </>
                ) : (
                  <p className='font-bold text-blue-600'>-</p>
                )}
              </div>
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
            <div className='space-y-1'>
              <Label className='text-[10px] text-muted-foreground uppercase'>
                Persentase QC Pass
              </Label>
              <div className='flex items-center gap-3'>
                <div className='flex-1 max-w-[100px]'>
                  <Progress
                    value={qcPassPercentage}
                    className='h-2 bg-neutral-100 [&>div]:bg-emerald-500'
                  />
                </div>
                <span className='text-sm font-bold text-emerald-600'>
                  {qcPassPercentage.toFixed(2)}%
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
                <TableHead>GK MDL</TableHead>
                <TableHead>Gambar Kerja</TableHead>
                <TableHead>PO Divisi</TableHead>
                <TableHead>Stok Material</TableHead>
                <TableHead>Persentase Produksi</TableHead>
                <TableHead>QC Cek</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingItems ? (
                <TableRow>
                  <TableCell
                    colSpan={13}
                    className='h-32 text-center text-muted-foreground'
                  >
                    <Loader2 className='h-6 w-6 animate-spin mx-auto' />
                  </TableCell>
                </TableRow>
              ) : items?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={13}
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
                      {item.mdl_item?.link_gambar_kerja ? (
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
                              item.mdl_item.link_gambar_kerja
                            }`}
                            target='_blank'
                            rel='noopener noreferrer'
                          >
                            <Eye className='h-3.5 w-3.5' />
                          </a>
                        </Button>
                      ) : (
                        <span className='text-[10px] text-muted-foreground italic'>
                          -
                        </span>
                      )}
                    </TableCell>
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
                    <TableCell>
                      <div 
                        className='cursor-pointer hover:bg-neutral-100 p-2 rounded-lg transition-colors group flex items-center gap-2'
                        onClick={() => openQcDialog(item)}
                      >
                        {item.qc_cek ? (
                          <>
                            <Badge variant="outline" className={cn(
                              "font-bold",
                              item.qc_cek.status === 'Pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                              item.qc_cek.status === 'Repair' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-red-50 text-red-700 border-red-200'
                            )}>
                              {item.qc_cek.status}
                            </Badge>
                            <span className="text-[10px] font-bold text-neutral-600">{item.qc_cek.qty} Unit</span>
                            {item.qc_cek.file && (
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-600" asChild onClick={(e) => e.stopPropagation()}>
                                <a 
                                  href={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('/api', '')}/storage/${item.qc_cek.file}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </a>
                              </Button>
                            )}
                          </>
                        ) : (
                          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 px-2">
                            <Upload className="h-3 w-3" />
                            Input QC
                          </Button>
                        )}
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
              Update Progress QC
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
                  <div className='flex items-center justify-between'>
                    <Label>Cold Press</Label>
                    <Button
                      type='button'
                      variant={skippedFields.cold_press ? 'default' : 'outline'}
                      size='sm'
                      className={`h-6 px-2 text-xs ${skippedFields.cold_press ? 'bg-neutral-500 hover:bg-neutral-600' : 'text-neutral-500'}`}
                      onClick={() => toggleSkipField('cold_press')}
                    >
                      {skippedFields.cold_press ? 'Batalkan' : 'Lewati Proses'}
                    </Button>
                  </div>
                  <Input
                    type='number'
                    min={0}
                    max={produksiData.jumlah_order}
                    disabled={skippedFields.cold_press}
                    value={skippedFields.cold_press ? '-' : produksiData.cold_press === 0 ? '' : produksiData.cold_press || ''}
                    onChange={(e) =>
                      setProduksiData({
                        ...produksiData,
                        cold_press: Math.min(Math.max(parseInt(e.target.value) || 0, 0), produksiData.jumlah_order ?? 0),
                      })
                    }
                    className={skippedFields.cold_press ? 'bg-neutral-100 text-neutral-400 disabled:opacity-100' : ''}
                  />
                </div>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Label>Running Saw</Label>
                    <Button
                      type='button'
                      variant={skippedFields.running_saw ? 'default' : 'outline'}
                      size='sm'
                      className={`h-6 px-2 text-xs ${skippedFields.running_saw ? 'bg-neutral-500 hover:bg-neutral-600' : 'text-neutral-500'}`}
                      onClick={() => toggleSkipField('running_saw')}
                    >
                      {skippedFields.running_saw ? 'Batalkan' : 'Lewati Proses'}
                    </Button>
                  </div>
                  <Input
                    type='number'
                    min={0}
                    max={produksiData.jumlah_order}
                    disabled={skippedFields.running_saw}
                    value={skippedFields.running_saw ? '-' : produksiData.running_saw === 0 ? '' : produksiData.running_saw || ''}
                    onChange={(e) =>
                      setProduksiData({
                        ...produksiData,
                        running_saw: Math.min(Math.max(parseInt(e.target.value) || 0, 0), produksiData.jumlah_order ?? 0),
                      })
                    }
                    className={skippedFields.running_saw ? 'bg-neutral-100 text-neutral-400 disabled:opacity-100' : ''}
                  />
                </div>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Label>Edging</Label>
                    <Button
                      type='button'
                      variant={skippedFields.edging ? 'default' : 'outline'}
                      size='sm'
                      className={`h-6 px-2 text-xs ${skippedFields.edging ? 'bg-neutral-500 hover:bg-neutral-600' : 'text-neutral-500'}`}
                      onClick={() => toggleSkipField('edging')}
                    >
                      {skippedFields.edging ? 'Batalkan' : 'Lewati Proses'}
                    </Button>
                  </div>
                  <Input
                    type='number'
                    min={0}
                    max={produksiData.jumlah_order}
                    disabled={skippedFields.edging}
                    value={skippedFields.edging ? '-' : produksiData.edging === 0 ? '' : produksiData.edging || ''}
                    onChange={(e) =>
                      setProduksiData({
                        ...produksiData,
                        edging: Math.min(Math.max(parseInt(e.target.value) || 0, 0), produksiData.jumlah_order ?? 0),
                      })
                    }
                    className={skippedFields.edging ? 'bg-neutral-100 text-neutral-400 disabled:opacity-100' : ''}
                  />
                </div>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Label>CNC</Label>
                    <Button
                      type='button'
                      variant={skippedFields.cnc ? 'default' : 'outline'}
                      size='sm'
                      className={`h-6 px-2 text-xs ${skippedFields.cnc ? 'bg-neutral-500 hover:bg-neutral-600' : 'text-neutral-500'}`}
                      onClick={() => toggleSkipField('cnc')}
                    >
                      {skippedFields.cnc ? 'Batalkan' : 'Lewati Proses'}
                    </Button>
                  </div>
                  <Input
                    type='number'
                    min={0}
                    max={produksiData.jumlah_order}
                    disabled={skippedFields.cnc}
                    value={skippedFields.cnc ? '-' : produksiData.cnc === 0 ? '' : produksiData.cnc || ''}
                    onChange={(e) =>
                      setProduksiData({
                        ...produksiData,
                        cnc: Math.min(Math.max(parseInt(e.target.value) || 0, 0), produksiData.jumlah_order ?? 0),
                      })
                    }
                    className={skippedFields.cnc ? 'bg-neutral-100 text-neutral-400 disabled:opacity-100' : ''}
                  />
                </div>
              </div>
            </div>

            {/* Manual Section */}
            <div className='space-y-3'>
              <h4 className='font-semibold text-sm text-neutral-500 uppercase tracking-wider border-b pb-2'>
                Manual
              </h4>
              <div className='grid grid-cols-2 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Label>Tukang Kayu</Label>
                    <Button
                      type='button'
                      variant={skippedFields.tukang_kayu ? 'default' : 'outline'}
                      size='sm'
                      className={`h-6 px-2 text-xs ${skippedFields.tukang_kayu ? 'bg-neutral-500 hover:bg-neutral-600' : 'text-neutral-500'}`}
                      onClick={() => toggleSkipField('tukang_kayu')}
                    >
                      {skippedFields.tukang_kayu ? 'Batalkan' : 'Lewati Proses'}
                    </Button>
                  </div>
                  <Input
                    type='number'
                    min={0}
                    max={produksiData.jumlah_order}
                    disabled={skippedFields.tukang_kayu}
                    value={skippedFields.tukang_kayu ? '-' : produksiData.tukang_kayu === 0 ? '' : produksiData.tukang_kayu || ''}
                    onChange={(e) =>
                      setProduksiData({
                        ...produksiData,
                        tukang_kayu: Math.min(Math.max(parseInt(e.target.value) || 0, 0), produksiData.jumlah_order ?? 0),
                      })
                    }
                    className={skippedFields.tukang_kayu ? 'bg-neutral-100 text-neutral-400 disabled:opacity-100' : ''}
                  />
                </div>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Label>Tukang Jok</Label>
                    <Button
                      type='button'
                      variant={skippedFields.tukang_jok ? 'default' : 'outline'}
                      size='sm'
                      className={`h-6 px-2 text-xs ${skippedFields.tukang_jok ? 'bg-neutral-500 hover:bg-neutral-600' : 'text-neutral-500'}`}
                      onClick={() => toggleSkipField('tukang_jok')}
                    >
                      {skippedFields.tukang_jok ? 'Batalkan' : 'Lewati Proses'}
                    </Button>
                  </div>
                  <Input
                    type='number'
                    min={0}
                    max={produksiData.jumlah_order}
                    disabled={skippedFields.tukang_jok}
                    value={skippedFields.tukang_jok ? '-' : produksiData.tukang_jok === 0 ? '' : produksiData.tukang_jok || ''}
                    onChange={(e) =>
                      setProduksiData({
                        ...produksiData,
                        tukang_jok: Math.min(Math.max(parseInt(e.target.value) || 0, 0), produksiData.jumlah_order ?? 0),
                      })
                    }
                    className={skippedFields.tukang_jok ? 'bg-neutral-100 text-neutral-400 disabled:opacity-100' : ''}
                  />
                </div>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Label>Rakit</Label>
                    <Button
                      type='button'
                      variant={skippedFields.rakit ? 'default' : 'outline'}
                      size='sm'
                      className={`h-6 px-2 text-xs ${skippedFields.rakit ? 'bg-neutral-500 hover:bg-neutral-600' : 'text-neutral-500'}`}
                      onClick={() => toggleSkipField('rakit')}
                    >
                      {skippedFields.rakit ? 'Batalkan' : 'Lewati Proses'}
                    </Button>
                  </div>
                  <Input
                    type='number'
                    min={0}
                    max={produksiData.jumlah_order}
                    disabled={skippedFields.rakit}
                    value={skippedFields.rakit ? '-' : produksiData.rakit === 0 ? '' : produksiData.rakit || ''}
                    onChange={(e) =>
                      setProduksiData({
                        ...produksiData,
                        rakit: Math.min(Math.max(parseInt(e.target.value) || 0, 0), produksiData.jumlah_order ?? 0),
                      })
                    }
                    className={skippedFields.rakit ? 'bg-neutral-100 text-neutral-400 disabled:opacity-100' : ''}
                  />
                </div>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Label>Finishing</Label>
                    <Button
                      type='button'
                      variant={skippedFields.finishing ? 'default' : 'outline'}
                      size='sm'
                      className={`h-6 px-2 text-xs ${skippedFields.finishing ? 'bg-neutral-500 hover:bg-neutral-600' : 'text-neutral-500'}`}
                      onClick={() => toggleSkipField('finishing')}
                    >
                      {skippedFields.finishing ? 'Batalkan' : 'Lewati Proses'}
                    </Button>
                  </div>
                  <Input
                    type='number'
                    min={0}
                    max={produksiData.jumlah_order}
                    disabled={skippedFields.finishing}
                    value={skippedFields.finishing ? '-' : produksiData.finishing === 0 ? '' : produksiData.finishing || ''}
                    onChange={(e) =>
                      setProduksiData({
                        ...produksiData,
                        finishing: Math.min(Math.max(parseInt(e.target.value) || 0, 0), produksiData.jumlah_order ?? 0),
                      })
                    }
                    className={skippedFields.finishing ? 'bg-neutral-100 text-neutral-400 disabled:opacity-100' : ''}
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

      {/* QC Cek Update Dialog */}
      <AlertDialog
        open={isQcDialogOpen}
        onOpenChange={setIsQcDialogOpen}
      >
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <ListChecks className='h-5 w-5 text-emerald-500' />
              Input QC Check
            </AlertDialogTitle>
            <AlertDialogDescription>
              Input hasil pengecekan kualitas untuk: <strong>{qcItem?.item}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='py-4 space-y-4'>
            <div className='space-y-2'>
              <Label>Jumlah Passed (Unit)</Label>
              <Input
                type='number'
                min={0}
                max={qcItem?.jumlah}
                value={qcData.qty}
                onChange={(e) =>
                  setQcData({
                    ...qcData,
                    qty: Math.min(Math.max(parseInt(e.target.value) || 0, 0), qcItem?.jumlah || 0),
                  })
                }
              />
              <p className='text-[10px] text-muted-foreground italic'>* Maksimal sesuai Qty Order: {qcItem?.jumlah}</p>
            </div>

            <div className='space-y-3'>
              <Label>Status QC</Label>
              <div className='flex items-center gap-2 bg-neutral-100 p-1.5 rounded-xl w-fit'>
                <Button
                  type='button'
                  variant={qcData.status === 'Repair' ? 'default' : 'ghost'}
                  size='sm'
                  className={cn(
                    'h-9 px-6 text-xs font-bold transition-all rounded-lg',
                    qcData.status === 'Repair' 
                      ? 'bg-amber-500 text-white shadow-md hover:bg-amber-600' 
                      : 'text-neutral-500 hover:bg-white hover:text-neutral-700'
                  )}
                  onClick={() => setQcData({ ...qcData, status: 'Repair' })}
                >
                  Repair
                </Button>
                <Button
                  type='button'
                  variant={qcData.status === 'Pass' ? 'default' : 'ghost'}
                  size='sm'
                  className={cn(
                    'h-9 px-6 text-xs font-bold transition-all rounded-lg',
                    qcData.status === 'Pass' 
                      ? 'bg-emerald-500 text-white shadow-md hover:bg-emerald-600' 
                      : 'text-neutral-500 hover:bg-white hover:text-neutral-700'
                  )}
                  onClick={() => setQcData({ ...qcData, status: 'Pass' })}
                >
                  Pass
                </Button>
                <Button
                  type='button'
                  variant={qcData.status === 'Defect' ? 'default' : 'ghost'}
                  size='sm'
                  className={cn(
                    'h-9 px-6 text-xs font-bold transition-all rounded-lg',
                    qcData.status === 'Defect' 
                      ? 'bg-red-500 text-white shadow-md hover:bg-red-600' 
                      : 'text-neutral-500 hover:bg-white hover:text-neutral-700'
                  )}
                  onClick={() => setQcData({ ...qcData, status: 'Defect' })}
                >
                  Defect
                </Button>
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Upload Berkas/Foto QC</Label>
              <Input
                type='file'
                onChange={(e) =>
                  setQcData({
                    ...qcData,
                    file: e.target.files?.[0] || null,
                  })
                }
              />
              {qcItem?.qc_cek?.file && (
                <p className='text-[10px] text-blue-600'>
                  File saat ini: <a href={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('/api', '')}/storage/${qcItem.qc_cek.file}`} target="_blank" rel="noreferrer" className="underline">Lihat File</a>
                </p>
              )}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsQcDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <Button
              className='bg-emerald-600 hover:bg-emerald-700'
              onClick={handleQcUpdate}
              disabled={updateQcMutation.isPending}
            >
              {updateQcMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <CheckCircle2 className='mr-2 h-4 w-4' />
              )}
              Simpan QC
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
