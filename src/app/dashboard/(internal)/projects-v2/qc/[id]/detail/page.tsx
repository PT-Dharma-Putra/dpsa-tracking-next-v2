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
  Activity,
  User,
  Building2,
  Info,
  ChevronDown,
  FileDown,
  X,
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
  const [isOrderCollapsed, setIsOrderCollapsed] = React.useState(false);
  const [isProgressCollapsed, setIsProgressCollapsed] = React.useState(false);

  // Produksi View State
  const [isProduksiViewOpen, setIsProduksiViewOpen] = React.useState(false);
  const [produksiViewItem, setProduksiViewItem] = React.useState<ProjectItemV2 | null>(null);

  const openProduksiView = (item: ProjectItemV2) => {
    setProduksiViewItem(item);
    setIsProduksiViewOpen(true);
  };

  // QC Cek State
  const [isQcDialogOpen, setIsQcDialogOpen] = React.useState(false);
  const [qcItem, setQcItem] = React.useState<ProjectItemV2 | null>(null);
  const [qcData, setQcData] = React.useState<{ qty: number; repair: number; pass: number; afkir: number; status: string; file: File | null }>({
    qty: 0,
    repair: 0,
    pass: 0,
    afkir: 0,
    status: 'Pass',
    file: null,
  });

  const updateQcMutation = useMutation({
    mutationFn: (payload: { qty: number; repair: number; pass: number; afkir: number; status: string; file: File | null }) =>
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
    // Status otomatis: Pass jika pass > 0 & repair = 0 & afkir = 0, Repair jika ada repair, Defect jika ada afkir
    const autoStatus = qcData.afkir > 0 ? 'Defect' : qcData.repair > 0 ? 'Repair' : 'Pass';
    updateQcMutation.mutate({ ...qcData, status: autoStatus });
  };

  const openQcDialog = (item: ProjectItemV2) => {
    setQcItem(item);
    setQcData({
      qty: item.qc_cek?.qty || item.jumlah,
      repair: item.qc_cek?.repair || 0,
      pass: item.qc_cek?.pass || 0,
      afkir: item.qc_cek?.afkir || 0,
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

  const latestOrderProduksi = project.order_produksi && project.order_produksi.length > 0
    ? project.order_produksi[project.order_produksi.length - 1]
    : null;

  const flowSteps = [
    {
      id: 1, title: 'Order Produksi', isCompleted: !!latestOrderProduksi,
      isActive: true, icon: FileText, color: 'text-orange-600',
      bgColor: 'bg-orange-500', lightBg: 'bg-orange-50', borderColor: 'border-orange-200',
    },
    {
      id: 2, title: 'Progress Produksi', isCompleted: (project.progres_produksi ?? 0) >= 100,
      isActive: !!latestOrderProduksi, icon: BarChart3, color: 'text-blue-600',
      bgColor: 'bg-blue-500', lightBg: 'bg-blue-50', borderColor: 'border-blue-200',
    },
    {
      id: 3, title: 'QC Pass', isCompleted: qcPassPercentage >= 100,
      isActive: (project.progres_produksi ?? 0) > 0, icon: ListChecks, color: 'text-emerald-600',
      bgColor: 'bg-emerald-500', lightBg: 'bg-emerald-50', borderColor: 'border-emerald-200',
    },
  ];

  return (
    <div className='flex flex-col gap-6 p-6 max-w-[1600px] mx-auto w-full'>
      <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
        <div className='flex items-start gap-4 shrink-0'>
          <Button variant='ghost' size='icon' onClick={() => router.back()} className='rounded-full hover:bg-neutral-100 mt-0.5'>
            <ArrowLeft className='h-5 w-5' />
          </Button>
          <div className='space-y-1.5'>
            <div>
              <h1 className='text-2xl font-bold tracking-tight text-neutral-900'>{project.name}</h1>
              <p className='text-xs text-muted-foreground'>QC View - Project Items Management</p>
            </div>
            <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
              {project.client?.name && (
                <span className='flex items-center gap-1 text-xs text-neutral-600'>
                  <Building2 className='h-3 w-3 text-neutral-400' />
                  {project.client.name}
                </span>
              )}
              {(project.spk_number || project.spk?.nomor_spk) && (
                <span className='flex items-center gap-1 text-xs text-neutral-600'>
                  <FileText className='h-3 w-3 text-neutral-400' />
                  {project.spk_number || project.spk?.nomor_spk}
                </span>
              )}
              {project.deadline && (
                <span className='flex items-center gap-1 text-xs text-neutral-600'>
                  <Info className='h-3 w-3 text-neutral-400' />
                  Deadline: {format(new Date(project.deadline), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Stepper */}
        <div className='ml-auto overflow-x-auto hide-scrollbar shrink-0'>
          <div className='flex items-center gap-1 min-w-max'>
            {flowSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={step.id}>
                  <div className={`flex items-center gap-1.5 transition-all duration-300 ${step.isActive ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center border shadow-sm transition-all duration-500 shrink-0 ${
                      step.isCompleted ? step.bgColor + ' border-transparent text-white'
                      : step.isActive ? step.lightBg + ' ' + step.borderColor + ' ' + step.color
                      : 'bg-neutral-100 border-neutral-200 text-neutral-400'
                    }`}>
                      {step.isCompleted ? <CheckCircle2 className='h-3 w-3' /> : <Icon className='h-3 w-3' />}
                    </div>
                    <span className={`text-[10px] font-bold whitespace-nowrap ${step.isCompleted || step.isActive ? 'text-neutral-800' : 'text-neutral-400'}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < flowSteps.length - 1 && (
                    <div className='w-6 h-[2px] rounded-full bg-neutral-200 overflow-hidden relative mx-0.5 shrink-0'>
                      <div className={`absolute top-0 left-0 h-full w-full transition-transform duration-700 origin-left ${step.isCompleted ? step.bgColor + ' scale-x-100' : 'scale-x-0'}`} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cards Section */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 w-full'>
        {/* Order Produksi Card */}
        <Card className={`relative border shadow-sm transition-all duration-300 ${
          latestOrderProduksi ? 'border-orange-200 bg-white ring-1 ring-orange-100' : 'border-orange-300 bg-white ring-2 ring-orange-500 ring-offset-2'
        }`}>
          {latestOrderProduksi && (
            <div className='absolute -top-1.5 -right-1.5 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm z-10 animate-in zoom-in duration-300'>
              <CheckCircle2 className='h-3 w-3 text-white' />
            </div>
          )}
          <CardHeader className='pb-3 flex flex-row items-center justify-between gap-3'>
            <button className='flex items-center gap-3 flex-1 text-left' onClick={() => setIsOrderCollapsed(v => !v)}>
              <div className='h-8 w-8 rounded-full flex items-center justify-center font-bold bg-orange-100 text-orange-600'>1</div>
              <div className='flex-1'>
                <CardTitle className='text-base text-neutral-800'>Order Produksi</CardTitle>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wider'>Production Order</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform duration-200 mr-1 ${isOrderCollapsed ? '-rotate-90' : ''}`} />
            </button>
          </CardHeader>
          {!isOrderCollapsed && (
            <CardContent>
              {latestOrderProduksi ? (
                <div className='p-3 rounded-xl bg-orange-50/80 border border-orange-100 flex items-center justify-between shadow-sm'>
                  <div className='flex items-center gap-3'>
                    <div className='h-8 w-8 rounded-lg bg-white shadow-sm border border-orange-100 flex items-center justify-center text-orange-600'>
                      <FileText className='h-4 w-4' />
                    </div>
                    <div>
                      <p className='text-xs font-bold text-orange-900'>Order Produksi</p>
                      <p className='text-[10px] text-orange-600/80'>Target: {latestOrderProduksi.target_selesai ? format(new Date(latestOrderProduksi.target_selesai), 'MMM d, yyyy') : '-'}</p>
                    </div>
                  </div>
                  <Button variant='ghost' size='icon' className='h-8 w-8 text-orange-600 hover:bg-orange-200 bg-white shadow-sm border border-orange-100' asChild>
                    <a href={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('/api', '')}/storage/${latestOrderProduksi.file}`} target='_blank' rel='noopener noreferrer'>
                      <FileDown className='h-4 w-4' />
                    </a>
                  </Button>
                </div>
              ) : (
                <p className='text-xs text-muted-foreground italic'>Belum ada Order Produksi.</p>
              )}
            </CardContent>
          )}
        </Card>

        {/* Progress Produksi Card */}
        <Card className={`relative border shadow-sm transition-all duration-300 ${
          (project.progres_produksi || 0) >= 100 ? 'border-emerald-200 bg-white ring-1 ring-emerald-100' : 'border-blue-200 bg-white ring-1 ring-blue-100'
        }`}>
          {(project.progres_produksi || 0) >= 100 && (
            <div className='absolute -top-1.5 -right-1.5 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm z-10 animate-in zoom-in duration-300'>
              <CheckCircle2 className='h-3 w-3 text-white' />
            </div>
          )}
          <CardHeader className='pb-3 flex flex-row items-center justify-between gap-3'>
            <button className='flex items-center gap-3 flex-1 text-left' onClick={() => setIsProgressCollapsed(v => !v)}>
              <div className='h-8 w-8 rounded-full flex items-center justify-center font-bold bg-blue-100 text-blue-600'>2</div>
              <div className='flex-1'>
                <CardTitle className='text-base text-neutral-800'>Progress Produksi</CardTitle>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wider'>Production Progress</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform duration-200 mr-1 ${isProgressCollapsed ? '-rotate-90' : ''}`} />
            </button>
          </CardHeader>
          {!isProgressCollapsed && (
            <CardContent className='pt-0'>
              <div className='h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden mt-4'>
                <div className='h-full bg-blue-600 transition-all duration-500' style={{ width: `${project.progres_produksi || 0}%` }} />
              </div>
              <div className='flex justify-between items-center mt-1'>
                <p className='text-[10px] font-bold text-neutral-700'>Persentase per SPK</p>
                <p className='text-[10px] font-bold text-blue-600'>{Number(project.progres_produksi || 0).toFixed(2)}%</p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* QC Pass Card */}
        <Card className={`relative border shadow-sm transition-all duration-300 ${
          qcPassPercentage >= 100 ? 'border-emerald-200 bg-white ring-1 ring-emerald-100' : 'border-neutral-200 bg-white'
        }`}>
          {qcPassPercentage >= 100 && (
            <div className='absolute -top-1.5 -right-1.5 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm z-10 animate-in zoom-in duration-300'>
              <CheckCircle2 className='h-3 w-3 text-white' />
            </div>
          )}
          <CardHeader className='pb-3 flex flex-row items-center gap-3'>
            <div className='h-8 w-8 rounded-full flex items-center justify-center font-bold bg-emerald-100 text-emerald-600'>3</div>
            <div className='flex-1'>
              <CardTitle className='text-base text-neutral-800'>QC Pass Rate</CardTitle>
              <p className='text-[10px] text-muted-foreground uppercase tracking-wider'>Quality Control</p>
            </div>
          </CardHeader>
          <CardContent className='pt-0'>
            <div className='h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden mt-4'>
              <div className='h-full bg-emerald-500 transition-all duration-500' style={{ width: `${qcPassPercentage}%` }} />
            </div>
            <div className='flex justify-between items-center mt-1'>
              <p className='text-[10px] font-bold text-neutral-700'>Persentase QC Pass</p>
              <p className='text-[10px] font-bold text-emerald-600'>{qcPassPercentage.toFixed(2)}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

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
                <TableHead>Kode Barang</TableHead>
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
                <TableHead>Persentase Produksi</TableHead>
                <TableHead>QC Cek</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingItems ? (
                <TableRow>
                  <TableCell colSpan={14} className='h-32 text-center text-muted-foreground'>
                    <Loader2 className='h-6 w-6 animate-spin mx-auto' />
                  </TableCell>
                </TableRow>
              ) : items?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} className='h-32 text-center text-muted-foreground'>
                    No items recorded for this project.
                  </TableCell>
                </TableRow>
              ) : (
                items?.map((item, index) => (
                  <TableRow key={item.id} className='hover:bg-neutral-50/50 transition-colors'>
                    <TableCell className='text-muted-foreground font-medium'>{index + 1}</TableCell>
                    <TableCell className='text-xs font-mono text-neutral-600'>{item.mdl_item?.kode_barang || '-'}</TableCell>
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
                            href={`${
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
                              href={`${
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
                      <div
                        className='flex flex-col gap-1 w-16 cursor-pointer hover:opacity-80 transition-opacity'
                        onClick={() => openProduksiView(item)}
                      >
                        <div className='h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden'>
                          <div
                            className='h-full bg-blue-500 transition-all duration-500'
                            style={{ width: `${item.produksi?.persen || 0}%` }}
                          />
                        </div>
                        <span className='text-[10px] font-bold text-neutral-700'>{item.produksi?.persen || 0}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div 
                        className='cursor-pointer hover:bg-neutral-100 p-2 rounded-lg transition-colors group flex items-center gap-2'
                        onClick={() => openQcDialog(item)}
                      >
                        {item.qc_cek ? (
                          <>
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

      {/* View Produksi Progress Dialog (View-Only) */}
      <AlertDialog open={isProduksiViewOpen} onOpenChange={setIsProduksiViewOpen}>
        <AlertDialogContent className='max-w-2xl'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <BarChart3 className='h-5 w-5 text-orange-500' />
              Detail Progress Produksi
            </AlertDialogTitle>
            <AlertDialogDescription>
              Melihat progress produksi untuk item: <strong>{produksiViewItem?.item}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className='py-4 space-y-6'>
            {/* Summary Progress */}
            <div className='flex flex-col items-center gap-2 p-4 bg-orange-50 rounded-xl border border-orange-100'>
              <span className='text-xs font-bold text-orange-800 uppercase tracking-wider'>Total Progress</span>
              <div className='flex items-baseline gap-1'>
                <span className='text-4xl font-black text-orange-600'>{Math.round(produksiViewItem?.produksi?.persen || 0)}</span>
                <span className='text-xl font-bold text-orange-400'>%</span>
              </div>
              <Progress value={produksiViewItem?.produksi?.persen || 0} className='h-2 bg-orange-200/50 w-full max-w-md' />
            </div>

            <div className='grid grid-cols-2 gap-x-8 gap-y-6'>
              {/* Mesin Section */}
              <div className='space-y-3'>
                <h4 className='font-bold text-xs text-neutral-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2'>
                  <Activity className='h-3 w-3' />
                  Tahapan Mesin
                </h4>
                <div className='space-y-3'>
                  {[
                    { label: 'Cold Press', value: produksiViewItem?.produksi?.cold_press, key: 'cold_press' },
                    { label: 'Running Saw', value: produksiViewItem?.produksi?.running_saw, key: 'running_saw' },
                    { label: 'Edging', value: produksiViewItem?.produksi?.edging, key: 'edging' },
                    { label: 'CNC', value: produksiViewItem?.produksi?.cnc, key: 'cnc' },
                  ].map((field) => {
                    const isSkipped = produksiViewItem?.produksi?.skipped_fields?.includes(field.key);
                    return (
                      <div key={field.key} className='flex items-center justify-between'>
                        <span className='text-xs text-neutral-600'>{field.label}</span>
                        <div className='flex items-center gap-2'>
                          {isSkipped ? (
                            <Badge variant='secondary' className='text-[9px] bg-neutral-100 text-neutral-400 border-none'>SKIPPED</Badge>
                          ) : (
                            <span className='text-sm font-bold text-neutral-900'>{field.value || 0} <span className='text-[10px] text-neutral-400 font-normal'>/ {produksiViewItem?.jumlah}</span></span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Manual Section */}
              <div className='space-y-3'>
                <h4 className='font-bold text-xs text-neutral-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2'>
                  <User className='h-3 w-3' />
                  Tahapan Manual
                </h4>
                <div className='space-y-3'>
                  {[
                    { label: 'Tukang Kayu', value: produksiViewItem?.produksi?.tukang_kayu, key: 'tukang_kayu' },
                    { label: 'Tukang Jok', value: produksiViewItem?.produksi?.tukang_jok, key: 'tukang_jok' },
                    { label: 'Rakit', value: produksiViewItem?.produksi?.rakit, key: 'rakit' },
                    { label: 'Finishing', value: produksiViewItem?.produksi?.finishing, key: 'finishing' },
                  ].map((field) => {
                    const isSkipped = produksiViewItem?.produksi?.skipped_fields?.includes(field.key);
                    return (
                      <div key={field.key} className='flex items-center justify-between'>
                        <span className='text-xs text-neutral-600'>{field.label}</span>
                        <div className='flex items-center gap-2'>
                          {isSkipped ? (
                            <Badge variant='secondary' className='text-[9px] bg-neutral-100 text-neutral-400 border-none'>SKIPPED</Badge>
                          ) : (
                            <span className='text-sm font-bold text-neutral-900'>{field.value || 0} <span className='text-[10px] text-neutral-400 font-normal'>/ {produksiViewItem?.jumlah}</span></span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <AlertDialogFooter className='border-t pt-4'>
            <AlertDialogCancel className='bg-neutral-100 hover:bg-neutral-200 border-none'>Tutup</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QC Cek Update Dialog */}
      <AlertDialog
        open={isQcDialogOpen}
        onOpenChange={setIsQcDialogOpen}
      >
        <AlertDialogContent className='max-w-lg'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <ListChecks className='h-5 w-5 text-emerald-500' />
              Input QC Check
            </AlertDialogTitle>
            <AlertDialogDescription>
              Input hasil pengecekan kualitas untuk: <strong>{qcItem?.item}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='py-4 space-y-5'>

            {/* Jumlah Item */}
            <div className='space-y-2'>
              <Label className='text-sm font-bold'>Jumlah Item</Label>
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

            {/* Repair / Pass / Afkir */}
            <div className='grid grid-cols-3 gap-3'>
              <div className='space-y-2'>
                <Label className='text-sm font-semibold text-amber-600'>Repair</Label>
                <Input
                  type='number'
                  min={0}
                  max={qcData.qty}
                  value={qcData.repair === 0 ? '' : qcData.repair}
                  placeholder='0'
                  className='border-amber-200 focus:ring-amber-300'
                  onChange={(e) =>
                    setQcData({
                      ...qcData,
                      repair: Math.min(Math.max(parseInt(e.target.value) || 0, 0), qcData.qty),
                    })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label className='text-sm font-semibold text-emerald-600'>Pass</Label>
                <Input
                  type='number'
                  min={0}
                  max={qcData.qty}
                  value={qcData.pass === 0 ? '' : qcData.pass}
                  placeholder='0'
                  className='border-emerald-200 focus:ring-emerald-300'
                  onChange={(e) =>
                    setQcData({
                      ...qcData,
                      pass: Math.min(Math.max(parseInt(e.target.value) || 0, 0), qcData.qty),
                    })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label className='text-sm font-semibold text-red-600'>Afkir</Label>
                <Input
                  type='number'
                  min={0}
                  max={qcData.qty}
                  value={qcData.afkir === 0 ? '' : qcData.afkir}
                  placeholder='0'
                  className='border-red-200 focus:ring-red-300'
                  onChange={(e) =>
                    setQcData({
                      ...qcData,
                      afkir: Math.min(Math.max(parseInt(e.target.value) || 0, 0), qcData.qty),
                    })
                  }
                />
              </div>
            </div>

            {/* Persen & Status Otomatis */}
            {(() => {
              const total = qcData.qty || 1;
              const persen = Math.min(Math.round((qcData.pass / total) * 100), 100);
              const autoStatus = qcData.afkir > 0 ? 'Defect' : qcData.repair > 0 ? 'Repair' : 'Pass';
              return (
                <div className='bg-neutral-50 rounded-xl p-3 space-y-2 border border-neutral-100'>
                  <div className='flex items-center justify-between'>
                    <span className='text-xs font-semibold text-neutral-500'>Pass Rate</span>
                    <span className={cn(
                      'text-sm font-bold',
                      persen >= 100 ? 'text-emerald-600' : persen >= 80 ? 'text-amber-600' : 'text-red-600'
                    )}>{persen}%</span>
                  </div>
                  <div className='h-2 bg-neutral-200 rounded-full overflow-hidden'>
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        persen >= 100 ? 'bg-emerald-500' : persen >= 80 ? 'bg-amber-500' : 'bg-red-500'
                      )}
                      style={{ width: `${persen}%` }}
                    />
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-[10px] text-muted-foreground'>Status otomatis</span>
                    <span className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full',
                      autoStatus === 'Pass' ? 'bg-emerald-100 text-emerald-700' :
                      autoStatus === 'Repair' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    )}>{autoStatus}</span>
                  </div>
                </div>
              );
            })()}

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
