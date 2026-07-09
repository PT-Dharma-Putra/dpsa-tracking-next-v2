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
  Building2,
  Info,
  ChevronDown,
  Package,
  FileDown,
  X,
  Truck,
  Search,
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
  BarangSupplier,
} from '@/features/projects/services/project-v2-service';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function PurchasingDetailPage() {
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

  // Search State
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isGrouped, setIsGrouped] = React.useState(false);

  const filteredItems = React.useMemo(() => {
    if (!items) return [];
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.item.toLowerCase().includes(query) ||
        (item.ruang && item.ruang.toLowerCase().includes(query)) ||
        (item.lantai && item.lantai.toLowerCase().includes(query)) ||
        (item.keterangan && item.keterangan.toLowerCase().includes(query))
    );
  }, [items, searchQuery]);

  const displayItems = React.useMemo(() => {
    if (!isGrouped) return filteredItems;
    
    const grouped = new Map<string, ProjectItemV2 & { groupedItems?: { id: number, jumlah: number }[] }>();
    
    filteredItems.forEach(item => {
      const key = item.item.toLowerCase();
      if (grouped.has(key)) {
        const existing = grouped.get(key)!;
        existing.jumlah += item.jumlah;
        
        const existingVol = Number(existing.volume || 0);
        const itemVol = Number(item.volume || 0);
        if (!isNaN(existingVol) && !isNaN(itemVol)) {
          existing.volume = Number((existingVol + itemVol).toFixed(3));
        }

        if (existing.produksi && item.produksi) {
          const fields = [
            'menggunakan_stok', 'cold_press', 'running_saw', 'edging', 'cnc',
            'tukang_kayu', 'tukang_jok', 'finishing', 'rakit', 'quality_control', 'packing'
          ];
          fields.forEach(f => {
            if (typeof (item.produksi as any)[f] === 'number') {
              (existing.produksi as any)[f] = ((existing.produksi as any)[f] || 0) + (item.produksi as any)[f];
            }
          });
        } else if (!existing.produksi && item.produksi) {
          existing.produksi = { ...item.produksi };
        }

        if (existing.groupedItems) {
          existing.groupedItems.push({ id: item.id, jumlah: item.jumlah });
        }
      } else {
        const newItem = { ...item, groupedItems: [{ id: item.id, jumlah: item.jumlah }] };
        if (newItem.produksi) newItem.produksi = { ...newItem.produksi };
        grouped.set(key, newItem);
      }
    });
    
    return Array.from(grouped.values());
  }, [filteredItems, isGrouped]);

  // Produksi State
  const [isProduksiDialogOpen, setIsProduksiDialogOpen] = React.useState(false);
  const [produksiItem, setProduksiItem] = React.useState<ProjectItemV2 | null>(
    null
  );
  const [produksiData, setProduksiData] = React.useState<Partial<Produksi>>({});
  const [skippedFields, setSkippedFields] = React.useState<Record<string, boolean>>({});
  const [isOrderCollapsed, setIsOrderCollapsed] = React.useState(false);
  const [isProgressCollapsed, setIsProgressCollapsed] = React.useState(false);
  
  // QC View State
  const [isQcViewOpen, setIsQcViewOpen] = React.useState(false);
  const [qcViewItem, setQcViewItem] = React.useState<ProjectItemV2 | null>(null);

  const openQcView = (item: ProjectItemV2) => {
    setQcViewItem(item);
    setIsQcViewOpen(true);
  };

  // Barang Jadi Masuk State
  const [isBjDialogOpen, setIsBjDialogOpen] = React.useState(false);
  const [bjItem, setBjItem] = React.useState<ProjectItemV2 | null>(null);
  const [bjTanggal, setBjTanggal] = React.useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [bjJumlah, setBjJumlah] = React.useState<number>(0);
  const [bjFile, setBjFile] = React.useState<File | null>(null);

  const updateBjMutation = useMutation({
    mutationFn: (payload: { tanggal: string; jumlah: number; file?: File | null }) =>
      projectV2Service.updateBarangJadiMasuk(bjItem!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-v2-items', projectId],
      });
      queryClient.invalidateQueries({ queryKey: ['projects-v2', projectId] });
      toast.success('Barang Masuk recorded');
      setIsBjDialogOpen(false);
      setBjJumlah(0);
      setBjFile(null);
    },
    onError: () => {
      toast.error('Failed to record Barang Masuk');
    },
  });

  const handleBjUpdate = () => {
    if (!bjItem) return;

    const currentTotal =
      bjItem.barang_jadi_masuk?.reduce((sum, bj) => sum + bj.jumlah, 0) || 0;
    if (currentTotal + bjJumlah > bjItem.jumlah) {
      toast.error(
        `Total barang (${
          currentTotal + bjJumlah
        }) tidak boleh melebihi jumlah order (${bjItem.jumlah})`
      );
      return;
    }

    updateBjMutation.mutate({
      tanggal: bjTanggal,
      jumlah: bjJumlah,
      file: bjFile,
    });
  };

  const openBjDialog = (item: ProjectItemV2) => {
    setBjItem(item);
    setBjJumlah(0);
    setBjFile(null);
    setIsBjDialogOpen(true);
  };

  // Packing View State (View Only)
  const [isPackingViewOpen, setIsPackingViewOpen] = React.useState(false);
  const [packingViewItem, setPackingViewItem] = React.useState<ProjectItemV2 | null>(null);

  const openPackingView = (item: ProjectItemV2) => {
    setPackingViewItem(item);
    setIsPackingViewOpen(true);
  };

  const toggleSkipField = (field: string) => {
    setSkippedFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const updateProduksiMutation = useMutation({
    mutationFn: async (payload: { items: { id: number, data: Partial<Produksi> }[] }) => {
      await Promise.all(payload.items.map(item => projectV2Service.updateProduksi(item.id, item.data)));
    },
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
    
    const isGroup = !!(produksiItem as any).groupedItems && (produksiItem as any).groupedItems.length > 1;
    const groupedItems = isGroup 
      ? (produksiItem as any).groupedItems as { id: number, jumlah: number }[] 
      : [{ id: produksiItem.id, jumlah: produksiItem.jumlah }];
    
    const fieldsToDistribute = [
      'menggunakan_stok', 'cold_press', 'running_saw', 'edging', 'cnc',
      'tukang_kayu', 'tukang_jok', 'finishing', 'rakit', 'quality_control', 'packing'
    ];

    const updates = groupedItems.map(gItem => {
      const itemData = { ...produksiData, jumlah_order: gItem.jumlah, skipped_fields: skippedList };
      return { id: gItem.id, data: itemData, capacity: gItem.jumlah };
    });

    fieldsToDistribute.forEach(field => {
      let remaining = (produksiData as any)[field] || 0;
      updates.forEach(update => {
        const allocate = Math.min(remaining, update.capacity);
        (update.data as any)[field] = allocate;
        remaining -= allocate;
      });
    });

    updateProduksiMutation.mutate({ items: updates.map(u => ({ id: u.id, data: u.data })) });
  };

  // Supplier Confirm State
  const [isSupplierConfirmOpen, setIsSupplierConfirmOpen] = React.useState(false);
  const [supplierConfirmItem, setSupplierConfirmItem] = React.useState<ProjectItemV2 | null>(null);

  const markAsSupplierMutation = useMutation({
    mutationFn: (itemId: number) => projectV2Service.markAsSupplier(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-v2-items', projectId] });
      setIsSupplierConfirmOpen(false);
      setIsProduksiDialogOpen(false);
      if (supplierConfirmItem) openBarangSupplierDialog(supplierConfirmItem);
    },
    onError: () => {
      toast.error('Gagal menandai sebagai barang supplier');
    },
  });

  // Barang Supplier State
  const [isBarangSupplierDialogOpen, setIsBarangSupplierDialogOpen] = React.useState(false);
  const [barangSupplierItem, setBarangSupplierItem] = React.useState<ProjectItemV2 | null>(null);
  const [barangSupplierData, setBarangSupplierData] = React.useState<Partial<BarangSupplier>>({});
  const [bsSkippedFields, setBsSkippedFields] = React.useState<Record<string, boolean>>({});

  const toggleBsSkipField = (field: string) => {
    setBsSkippedFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const updateBarangSupplierMutation = useMutation({
    mutationFn: (payload: Partial<BarangSupplier>) =>
      projectV2Service.updateBarangSupplier(barangSupplierItem!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-v2-items', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects-v2', projectId] });
      toast.success('Barang Supplier updated');
      setIsBarangSupplierDialogOpen(false);
    },
    onError: () => {
      toast.error('Failed to update Barang Supplier');
    },
  });

  const cancelBarangSupplierMutation = useMutation({
    mutationFn: (itemId: number) => projectV2Service.cancelBarangSupplier(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-v2-items', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects-v2', projectId] });
      toast.success('Berhasil membatalkan sebagai barang supplier');
      setIsBarangSupplierDialogOpen(false);
    },
    onError: () => {
      toast.error('Gagal membatalkan sebagai barang supplier');
    },
  });

  const openBarangSupplierDialog = (item: ProjectItemV2) => {
    setBarangSupplierItem(item);
    setBarangSupplierData(
      item.barang_supplier || {
        jumlah_order: item.jumlah,
        barang_dipesan: 0,
        barang_tersedia: 0,
        rakit: 0,
        packing: 0,
        terkirim: 0,
        persen: 0,
      }
    );
    const saved = item.barang_supplier?.skipped_fields ?? [];
    setBsSkippedFields(
      saved.reduce<Record<string, boolean>>((acc, f) => { acc[f] = true; return acc; }, {})
    );
    setIsProduksiDialogOpen(false);
    setIsBarangSupplierDialogOpen(true);
  };

  const handleBarangSupplierUpdate = () => {
    if (!barangSupplierItem) return;
    const skippedList = Object.keys(bsSkippedFields).filter((k) => bsSkippedFields[k]);
    updateBarangSupplierMutation.mutate({ ...barangSupplierData, skipped_fields: skippedList });
  };

  const openProduksiDialog = (item: ProjectItemV2) => {
    if (item.produksi?.is_supplier) {
      openBarangSupplierDialog(item);
      return;
    }
    setProduksiItem(item);
    setProduksiData(
      item.produksi || {
        jumlah_order: item.jumlah,
        menggunakan_stok: 0,
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
    const stok = Number(produksiData.menggunakan_stok) || 0;
    const persenStok = (stok / order) * 100;

    // Hitung persen: field yang dilewati tidak ikut kalkulasi
    const persenProduksi =
      activeFields.length === 0
        ? 0
        : (totalSum * 100) / (activeFields.length * order);

    const calculatedPersen = Math.min(
      Number((persenProduksi + persenStok).toFixed(2)),
      100
    );

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
    produksiData.menggunakan_stok,
    skippedFields,
  ]);

  React.useEffect(() => {
    if (!isBarangSupplierDialogOpen) return;

    const allFields = ['barang_dipesan', 'barang_tersedia', 'rakit', 'packing', 'terkirim'] as const;
    const activeFields = allFields.filter((f) => !bsSkippedFields[f]);
    const order = Number(barangSupplierData.jumlah_order) || 1;
    const totalSum = activeFields.reduce((sum, f) => sum + Number(barangSupplierData[f] || 0), 0);
    const calculated = activeFields.length === 0
      ? 0
      : Math.min(Number(((totalSum * 100) / (activeFields.length * order)).toFixed(2)), 100);

    setBarangSupplierData((prev) => {
      if (prev.persen === calculated) return prev;
      return { ...prev, persen: calculated };
    });
  }, [
    isBarangSupplierDialogOpen,
    barangSupplierData.barang_dipesan,
    barangSupplierData.barang_tersedia,
    barangSupplierData.rakit,
    barangSupplierData.packing,
    barangSupplierData.terkirim,
    barangSupplierData.jumlah_order,
    bsSkippedFields,
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

  const flowSteps = [
    {
      id: 1,
      title: 'Order Produksi',
      description: 'Production Order',
      isCompleted: !!(project.order_produksi && project.order_produksi.length > 0),
      isActive: true,
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-500',
      lightBg: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
    {
      id: 2,
      title: 'Progress Produksi',
      description: 'Production Progress',
      isCompleted: (project.progres_produksi ?? 0) >= 100,
      isActive: !!(project.order_produksi && project.order_produksi.length > 0),
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500',
      lightBg: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
  ];

  const latestOrderProduksi = project.order_produksi && project.order_produksi.length > 0 
    ? project.order_produksi[project.order_produksi.length - 1] 
    : null;

  return (
    <div className='flex flex-col gap-6 p-6 max-w-[1600px] mx-auto w-full'>
      <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
        <div className='flex items-start gap-4 shrink-0'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => router.back()}
            className='rounded-full hover:bg-neutral-100 mt-0.5'
          >
            <ArrowLeft className='h-5 w-5' />
          </Button>
          <div className='space-y-1.5'>
            <div>
              <h1 className='text-2xl font-bold tracking-tight text-neutral-900'>
                {project.name}
              </h1>
              <p className='text-xs text-muted-foreground'>Produksi View - Project Items Management</p>
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

        {/* Stepper Progress */}
        <div className='ml-auto overflow-x-auto hide-scrollbar shrink-0'>
          <div className='flex items-center gap-1 min-w-max'>
            {flowSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={step.id}>
                  <div
                    className={`flex items-center gap-1.5 transition-all duration-300 ${
                      step.isActive ? 'opacity-100' : 'opacity-40 grayscale'
                    }`}
                  >
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center border shadow-sm transition-all duration-500 shrink-0 ${
                        step.isCompleted
                          ? step.bgColor + ' border-transparent text-white'
                          : step.isActive
                          ? step.lightBg +
                            ' ' +
                            step.borderColor +
                            ' ' +
                            step.color
                          : 'bg-neutral-100 border-neutral-200 text-neutral-400'
                      }`}
                    >
                      {step.isCompleted ? (
                        <CheckCircle2 className='h-3 w-3' />
                      ) : (
                        <Icon className='h-3 w-3' />
                      )}
                    </div>
                    <div className='flex flex-col leading-none'>
                      <span
                        className={`text-[10px] font-bold whitespace-nowrap ${
                          step.isCompleted || step.isActive
                            ? 'text-neutral-800'
                            : 'text-neutral-400'
                        }`}
                      >
                        {step.title}
                      </span>
                    </div>
                  </div>
                  {index < flowSteps.length - 1 && (
                    <div className='w-6 h-[2px] rounded-full bg-neutral-200 overflow-hidden relative mx-0.5 shrink-0'>
                      <div
                        className={`absolute top-0 left-0 h-full w-full transition-transform duration-700 origin-left ${
                          step.isCompleted
                            ? step.bgColor + ' scale-x-100'
                            : 'scale-x-0'
                        }`}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Document Section at Top */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 w-full'>
        {/* 1. ORDER PRODUKSI SECTION */}
        <Card
          className={`relative border shadow-sm transition-all duration-300 ${
            flowSteps[0].isActive
              ? flowSteps[0].isCompleted
                ? 'border-orange-200 bg-white ring-1 ring-orange-100'
                : 'border-orange-300 bg-white ring-2 ring-orange-500 ring-offset-2'
              : 'border-neutral-200 bg-neutral-50/80 opacity-60 grayscale-[0.5]'
          }`}
        >
          {latestOrderProduksi && (
            <div className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm z-10 animate-in zoom-in duration-300">
              <CheckCircle2 className="h-3 w-3 text-white" />
            </div>
          )}
          <CardHeader className='pb-3 flex flex-row items-center justify-between gap-3'>
            <button
              className='flex items-center gap-3 flex-1 text-left'
              onClick={() => setIsOrderCollapsed((v) => !v)}
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${
                  flowSteps[0].isActive
                    ? 'bg-orange-100 text-orange-600'
                    : 'bg-neutral-200 text-neutral-500'
                }`}
              >
                1
              </div>
              <div className='flex-1'>
                <CardTitle className='text-base text-neutral-800'>
                  Order Produksi
                </CardTitle>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wider'>
                  Production Order
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-neutral-400 transition-transform duration-200 mr-1 ${
                  isOrderCollapsed ? '-rotate-90' : ''
                }`}
              />
            </button>
          </CardHeader>
          {!isOrderCollapsed && (
            <CardContent className="space-y-2">
              {latestOrderProduksi ? (
                <div className='p-3 rounded-xl bg-orange-50/80 border border-orange-100 flex items-center justify-between shadow-sm'>
                  <div className='flex items-center gap-3'>
                    <div className='h-8 w-8 rounded-lg bg-white shadow-sm border border-orange-100 flex items-center justify-center text-orange-600'>
                      <FileText className='h-4 w-4' />
                    </div>
                    <div>
                      <p className='text-xs font-bold text-orange-900'>
                        Order Produksi
                      </p>
                      <p className='text-[10px] text-orange-600/80'>
                        Target:{" "}
                        {latestOrderProduksi.target_selesai
                          ? format(new Date(latestOrderProduksi.target_selesai), 'MMM d, yyyy')
                          : '-'}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8 text-orange-600 hover:bg-orange-200 bg-white shadow-sm border border-orange-100'
                      asChild
                    >
                      <a
                        href={`${(
                          process.env.NEXT_PUBLIC_API_URL ||
                          'http://localhost:8000'
                        ).replace('/api', '')}/storage/${latestOrderProduksi.file}`}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        <FileDown className='h-4 w-4' />
                      </a>
                    </Button>
                  </div>
                </div>
              ) : !project.dokubah?.file_rekap_dokubah && (
                <p className='text-xs text-muted-foreground italic'>
                  Belum ada Order Produksi.
                </p>
              )}

              {project.dokubah?.file_rekap_dokubah && (
                <div className='p-3 rounded-xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-between shadow-sm'>
                  <div className='flex items-center gap-3'>
                    <div className='h-8 w-8 rounded-lg bg-white shadow-sm border border-indigo-100 flex items-center justify-center text-indigo-600'>
                      <FileText className='h-4 w-4' />
                    </div>
                    <div>
                      <p className='text-xs font-bold text-indigo-900'>
                        Rekap Dokubah
                      </p>
                      <p className='text-[10px] text-indigo-600/80 truncate max-w-[200px]' title={project.dokubah.file_rekap_dokubah.split('/').pop()}>
                        {project.dokubah.file_rekap_dokubah.split('/').pop()}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8 text-indigo-600 hover:bg-indigo-100 bg-white shadow-sm border border-indigo-100'
                      asChild
                    >
                      <a
                        href={project.dokubah.file_rekap_dokubah.startsWith('http') ? project.dokubah.file_rekap_dokubah : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('/api', '')}/storage/${project.dokubah.file_rekap_dokubah}`}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        <Eye className='h-4 w-4' />
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* 2. PROGRESS PRODUKSI SECTION */}
        <Card
          className={`relative border shadow-sm transition-all duration-300 ${
            (project.progres_produksi || 0) >= 100
              ? 'border-emerald-200 bg-white ring-1 ring-emerald-100'
              : 'border-blue-200 bg-white ring-1 ring-blue-100'
          }`}
        >
          {(project.progres_produksi || 0) >= 100 && (
            <div className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm z-10 animate-in zoom-in duration-300">
              <CheckCircle2 className="h-3 w-3 text-white" />
            </div>
          )}
          <CardHeader className='pb-3 flex flex-row items-center justify-between gap-3'>
            <button
              className='flex items-center gap-3 flex-1 text-left'
              onClick={() => setIsProgressCollapsed((v) => !v)}
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center font-bold bg-blue-100 text-blue-600`}
              >
                2
              </div>
              <div className='flex-1'>
                <CardTitle className='text-base text-neutral-800'>
                  Progress Produksi
                </CardTitle>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wider'>
                  Production Progress
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-neutral-400 transition-transform duration-200 mr-1 ${
                  isProgressCollapsed ? '-rotate-90' : ''
                }`}
              />
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
      </div>

      {/* Items Table Section */}
      <div className='space-y-4 pt-4 border-t'>
        <div className='flex justify-between items-center'>
          <h2 className='text-xl font-bold flex items-center gap-2'>
            <ListChecks className='h-5 w-5 text-neutral-400' />
            Project Items
          </h2>
          <div className='flex items-center gap-2'>
            <Button
              variant={isGrouped ? 'default' : 'outline'}
              onClick={() => setIsGrouped(!isGrouped)}
              className='shadow-sm'
            >
              <Package className='w-4 h-4 mr-2' />
              Kelompokkan Item
            </Button>
            <div className='relative w-64'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500' />
              <Input
                placeholder='Cari item, ruang, atau lantai...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-9 bg-white shadow-sm'
              />
            </div>
          </div>
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
                <TableHead>Dimensions</TableHead>
                <TableHead>Vol</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Satuan</TableHead>
                <TableHead>PO Divisi</TableHead>
                <TableHead>Persentase Produksi</TableHead>
                <TableHead>Barang Jadi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingItems ? (
                <TableRow>
                  <TableCell
                    colSpan={12}
                    className='h-32 text-center text-muted-foreground'
                  >
                    <Loader2 className='h-6 w-6 animate-spin mx-auto' />
                  </TableCell>
                </TableRow>
              ) : displayItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={12}
                    className='h-32 text-center text-muted-foreground'
                  >
                    No items found.
                  </TableCell>
                </TableRow>
              ) : (
                displayItems.map((item, index) => (
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
                    <TableCell className='text-xs text-muted-foreground'>
                      {item.panjang || '-'}x{item.lebar || '-'}x
                      {item.tinggi || '-'}
                    </TableCell>

                    <TableCell className='font-bold text-blue-600 text-xs'>
                      {item.volume || '-'}
                    </TableCell>
                    <TableCell className='font-bold'>{item.jumlah}</TableCell>
                    <TableCell className='text-[10px] text-muted-foreground'>
                      {item.satuan}
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
                          indicatorClassName='bg-blue-600'
                        />
                      </div>
                    </TableCell>

                    <TableCell>
                      {isGrouped ? (
                        <span className='text-[10px] text-muted-foreground italic text-center block w-full'>
                          -
                        </span>
                      ) : (
                        <div
                          className='cursor-pointer p-1 rounded transition-colors flex flex-col gap-0.5'
                          onClick={() => openBjDialog(item)}
                        >
                          {item.barang_jadi_masuk &&
                          item.barang_jadi_masuk.length > 0 ? (
                            <Badge className='bg-blue-600 text-white border-none font-bold text-[10px] h-5 px-1.5 shadow-sm w-fit'>
                              {item.barang_jadi_masuk.reduce(
                                (sum, bj) => sum + Number(bj.jumlah),
                                0
                              )}{' '}
                              / {item.jumlah}
                            </Badge>
                          ) : (
                            <span className='text-[9px] text-muted-foreground italic hover:text-blue-600 transition-colors'>
                              Record
                            </span>
                          )}
                        </div>
                      )}
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
        <AlertDialogContent className="mb-4 flex h-[90dvh] sm:h-[calc(70vh-2rem)] w-[95vw] sm:min-w-[calc(70vw-2rem)] sm:max-w-[calc(70vw-2rem)] flex-col justify-between gap-0 p-0">
          {/* Header */}
          <div className="bg-white border-b px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0 shadow-sm z-10">
            <div>
              <AlertDialogTitle className="flex items-center gap-2 text-lg sm:text-2xl font-bold tracking-tight text-neutral-800">
                <BarChart3 className="h-6 w-6 text-orange-500" />
                Update Progress Produksi
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-neutral-500 mt-1">
                Input jumlah item yang telah selesai di setiap tahapan untuk:{' '}
                <strong>{produksiItem?.item}</strong>
              </AlertDialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsProduksiDialogOpen(false)}
              className="rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 shrink-0 h-10 w-10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            {/* Jumlah Order - Top Center */}
            <div className="flex justify-center">
              <div className="w-1/2 sm:w-1/3 space-y-2 text-center">
                <Label className="text-sm font-bold">Jumlah Order</Label>
                <Input
                  type="number"
                  value={produksiData.jumlah_order || 0}
                  onChange={(e) =>
                    setProduksiData({
                      ...produksiData,
                      jumlah_order: parseInt(e.target.value),
                    })
                  }
                  disabled
                  className="bg-neutral-50 font-bold text-center text-lg h-12"
                />
              </div>
            </div>

            {/* Mesin Section */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-neutral-500 uppercase tracking-wider border-b pb-2">
                Mesin
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-2">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <Label>Cold Press</Label>
                    <Button
                      type="button"
                      variant={skippedFields.cold_press ? 'default' : 'outline'}
                      size="sm"
                      className={`h-6 px-2 text-xs ${skippedFields.cold_press ? 'bg-neutral-500 hover:bg-neutral-600' : 'text-neutral-500'}`}
                      onClick={() => toggleSkipField('cold_press')}
                    >
                      {skippedFields.cold_press ? 'Batalkan' : 'Lewati Proses'}
                    </Button>
                  </div>
                  <Input
                    type="number"
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
                <div className="space-y-2">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <Label>Running Saw</Label>
                    <Button
                      type="button"
                      variant={skippedFields.running_saw ? 'default' : 'outline'}
                      size="sm"
                      className={`h-6 px-2 text-xs ${skippedFields.running_saw ? 'bg-neutral-500 hover:bg-neutral-600' : 'text-neutral-500'}`}
                      onClick={() => toggleSkipField('running_saw')}
                    >
                      {skippedFields.running_saw ? 'Batalkan' : 'Lewati Proses'}
                    </Button>
                  </div>
                  <Input
                    type="number"
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
                <div className="space-y-2">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <Label>Edging</Label>
                    <Button
                      type="button"
                      variant={skippedFields.edging ? 'default' : 'outline'}
                      size="sm"
                      className={`h-6 px-2 text-xs ${skippedFields.edging ? 'bg-neutral-500 hover:bg-neutral-600' : 'text-neutral-500'}`}
                      onClick={() => toggleSkipField('edging')}
                    >
                      {skippedFields.edging ? 'Batalkan' : 'Lewati Proses'}
                    </Button>
                  </div>
                  <Input
                    type="number"
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
                <div className="space-y-2">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <Label>CNC</Label>
                    <Button
                      type="button"
                      variant={skippedFields.cnc ? 'default' : 'outline'}
                      size="sm"
                      className={`h-6 px-2 text-xs ${skippedFields.cnc ? 'bg-neutral-500 hover:bg-neutral-600' : 'text-neutral-500'}`}
                      onClick={() => toggleSkipField('cnc')}
                    >
                      {skippedFields.cnc ? 'Batalkan' : 'Lewati Proses'}
                    </Button>
                  </div>
                  <Input
                    type="number"
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
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-neutral-500 uppercase tracking-wider border-b pb-2">
                Manual
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-2">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <Label>Tukang Kayu</Label>
                    <Button
                      type="button"
                      variant={skippedFields.tukang_kayu ? 'default' : 'outline'}
                      size="sm"
                      className={`h-6 px-2 text-xs ${skippedFields.tukang_kayu ? 'bg-neutral-500 hover:bg-neutral-600' : 'text-neutral-500'}`}
                      onClick={() => toggleSkipField('tukang_kayu')}
                    >
                      {skippedFields.tukang_kayu ? 'Batalkan' : 'Lewati Proses'}
                    </Button>
                  </div>
                  <Input
                    type="number"
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
                <div className="space-y-2">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <Label>Tukang Jok</Label>
                    <Button
                      type="button"
                      variant={skippedFields.tukang_jok ? 'default' : 'outline'}
                      size="sm"
                      className={`h-6 px-2 text-xs ${skippedFields.tukang_jok ? 'bg-neutral-500 hover:bg-neutral-600' : 'text-neutral-500'}`}
                      onClick={() => toggleSkipField('tukang_jok')}
                    >
                      {skippedFields.tukang_jok ? 'Batalkan' : 'Lewati Proses'}
                    </Button>
                  </div>
                  <Input
                    type="number"
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
                <div className="space-y-2">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <Label>Rakit</Label>
                    <Button
                      type="button"
                      variant={skippedFields.rakit ? 'default' : 'outline'}
                      size="sm"
                      className={`h-6 px-2 text-xs ${skippedFields.rakit ? 'bg-neutral-500 hover:bg-neutral-600' : 'text-neutral-500'}`}
                      onClick={() => toggleSkipField('rakit')}
                    >
                      {skippedFields.rakit ? 'Batalkan' : 'Lewati Proses'}
                    </Button>
                  </div>
                  <Input
                    type="number"
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
                <div className="space-y-2">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <Label>Finishing</Label>
                    <Button
                      type="button"
                      variant={skippedFields.finishing ? 'default' : 'outline'}
                      size="sm"
                      className={`h-6 px-2 text-xs ${skippedFields.finishing ? 'bg-neutral-500 hover:bg-neutral-600' : 'text-neutral-500'}`}
                      onClick={() => toggleSkipField('finishing')}
                    >
                      {skippedFields.finishing ? 'Batalkan' : 'Lewati Proses'}
                    </Button>
                  </div>
                  <Input
                    type="number"
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

            {/* Menggunakan Stok & Persen Section */}
            <div className="pt-4 border-t flex flex-col sm:flex-row justify-center gap-4 sm:gap-8">
              <div className="space-y-2 w-full sm:w-[200px] text-center">
                <Label className="text-sm font-bold">Menggunakan Stok</Label>
                <Input
                  type="number"
                  min={0}
                  max={produksiData.jumlah_order}
                  value={produksiData.menggunakan_stok === 0 ? '' : produksiData.menggunakan_stok || ''}
                  onChange={(e) =>
                    setProduksiData({
                      ...produksiData,
                      menggunakan_stok: Math.min(Math.max(parseInt(e.target.value) || 0, 0), produksiData.jumlah_order ?? 0),
                    })
                  }
                  className="font-bold text-center text-lg h-12"
                />
              </div>
              <div className="space-y-2 w-full sm:w-[200px] text-center">
                <Label className="text-sm font-bold">Persen (%)</Label>
                <Input
                  type="text"
                  value={
                    typeof produksiData.persen === 'number'
                      ? produksiData.persen.toFixed(2)
                      : (Number(produksiData.persen) || 0).toFixed(2)
                  }
                  disabled
                  className="bg-orange-50 font-bold text-orange-700 text-center text-lg h-12 disabled:opacity-100"
                />
              </div>
            </div>
          </div>
          
          <div className="bg-white border-t px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 shrink-0 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] z-10">
            <Button
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50 rounded-full px-5 text-sm"
              onClick={() => {
                if (produksiItem) {
                  setSupplierConfirmItem(produksiItem);
                  setIsSupplierConfirmOpen(true);
                }
              }}
            >
              <Truck className="w-4 h-4 mr-2" />
              Tandai sebagai barang supplier
            </Button>
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
              <AlertDialogCancel
                onClick={() => setIsProduksiDialogOpen(false)}
                className="px-6 rounded-full font-medium"
              >
                Cancel
              </AlertDialogCancel>
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-6"
                onClick={handleProduksiUpdate}
                disabled={updateProduksiMutation.isPending}
              >
                {updateProduksiMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Update Progress
              </Button>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Supplier Confirmation Dialog */}
      <AlertDialog open={isSupplierConfirmOpen} onOpenChange={setIsSupplierConfirmOpen}>
        <AlertDialogContent className='max-w-sm'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <Truck className='h-5 w-5 text-blue-500' />
              Konfirmasi Barang Supplier
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah benar <strong>{supplierConfirmItem?.item}</strong> adalah barang supplier?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsSupplierConfirmOpen(false)}>
              Tidak
            </AlertDialogCancel>
            <Button
              className='bg-blue-600 hover:bg-blue-700 text-white'
              onClick={() => supplierConfirmItem && markAsSupplierMutation.mutate(supplierConfirmItem.id)}
              disabled={markAsSupplierMutation.isPending}
            >
              {markAsSupplierMutation.isPending && <Loader2 className='w-4 h-4 mr-2 animate-spin' />}
              Ya
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Barang Supplier Dialog */}
      <AlertDialog open={isBarangSupplierDialogOpen} onOpenChange={setIsBarangSupplierDialogOpen}>
        <AlertDialogContent className='mb-4 flex h-[90dvh] sm:h-[calc(70vh-2rem)] w-[95vw] sm:min-w-[calc(60vw-2rem)] sm:max-w-[calc(60vw-2rem)] flex-col justify-between gap-0 p-0'>
          {/* Header */}
          <div className='bg-white border-b px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0 shadow-sm z-10'>
            <div>
              <AlertDialogTitle className='flex items-center gap-2 text-lg sm:text-2xl font-bold tracking-tight text-neutral-800'>
                <Truck className='h-6 w-6 text-blue-500' />
                Barang Supplier
              </AlertDialogTitle>
              <AlertDialogDescription className='text-sm text-neutral-500 mt-1'>
                Input progress untuk: <strong>{barangSupplierItem?.item}</strong>
              </AlertDialogDescription>
            </div>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setIsBarangSupplierDialogOpen(false)}
              className='rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 shrink-0 h-10 w-10'
            >
              <X className='w-5 h-5' />
            </Button>
          </div>

          {/* Body */}
          <div className='flex-1 overflow-y-auto p-6 md:p-8 space-y-6'>
            {/* Jumlah Order */}
            <div className='flex justify-center'>
              <div className='w-1/2 sm:w-1/3 space-y-2 text-center'>
                <Label className='text-sm font-bold'>Jumlah Order</Label>
                <Input
                  type='number'
                  value={barangSupplierData.jumlah_order || 0}
                  disabled
                  className='bg-neutral-50 font-bold text-center text-lg h-12'
                />
              </div>
            </div>

            {/* Fields */}
            <div className='space-y-3'>
              <h4 className='font-semibold text-sm text-neutral-500 uppercase tracking-wider border-b pb-2'>
                Progress Supplier
              </h4>
              <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                {(
                  [
                    { key: 'barang_dipesan', label: 'Barang Dipesan' },
                    { key: 'barang_tersedia', label: 'Barang Tersedia' },
                    { key: 'rakit', label: 'Rakit' },
                    { key: 'packing', label: 'Packing' },
                    { key: 'terkirim', label: 'Terkirim' },
                  ] as const
                ).map(({ key, label }) => (
                  <div key={key} className='space-y-2'>
                    <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
                      <Label>{label}</Label>
                      <Button
                        type='button'
                        variant={bsSkippedFields[key] ? 'default' : 'outline'}
                        size='sm'
                        className={`h-6 px-2 text-xs ${bsSkippedFields[key] ? 'bg-neutral-500 hover:bg-neutral-600' : 'text-neutral-500'}`}
                        onClick={() => toggleBsSkipField(key)}
                      >
                        {bsSkippedFields[key] ? 'Batalkan' : 'Lewati Proses'}
                      </Button>
                    </div>
                    <Input
                      type='number'
                      min={0}
                      max={barangSupplierData.jumlah_order}
                      disabled={bsSkippedFields[key]}
                      value={bsSkippedFields[key] ? '-' : barangSupplierData[key] === 0 ? '' : barangSupplierData[key] || ''}
                      onChange={(e) =>
                        setBarangSupplierData((p) => ({
                          ...p,
                          [key]: Math.min(Math.max(parseInt(e.target.value) || 0, 0), p.jumlah_order ?? 0),
                        }))
                      }
                      className={bsSkippedFields[key] ? 'bg-neutral-100 text-neutral-400 disabled:opacity-100' : ''}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Persen */}
            <div className='pt-4 border-t flex justify-center'>
              <div className='space-y-2 w-full sm:w-[200px] text-center'>
                <Label className='text-sm font-bold'>Persen (%)</Label>
                <Input
                  type='text'
                  value={
                    typeof barangSupplierData.persen === 'number'
                      ? barangSupplierData.persen.toFixed(2)
                      : (Number(barangSupplierData.persen) || 0).toFixed(2)
                  }
                  disabled
                  className='bg-blue-50 font-bold text-blue-700 text-center text-lg h-12 disabled:opacity-100'
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className='bg-white border-t px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-4 shrink-0 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] z-10'>
            <Button
              variant='destructive'
              className='rounded-full px-4 sm:px-6 font-medium text-xs sm:text-sm'
              onClick={() => barangSupplierItem && cancelBarangSupplierMutation.mutate(barangSupplierItem.id)}
              disabled={cancelBarangSupplierMutation.isPending}
            >
              {cancelBarangSupplierMutation.isPending ? (
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
              ) : null}
              Batalkan sebagai barang supplier
            </Button>
            <div className='flex items-center gap-4'>
              <Button variant='outline' className='rounded-full px-6 font-medium' onClick={() => setIsBarangSupplierDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className='bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6'
                onClick={handleBarangSupplierUpdate}
                disabled={updateBarangSupplierMutation.isPending}
              >
                {updateBarangSupplierMutation.isPending ? (
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                ) : (
                  <CheckCircle2 className='w-4 h-4 mr-2' />
                )}
                Simpan
              </Button>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* QC Detail Dialog (View Only) */}
      <AlertDialog open={isQcViewOpen} onOpenChange={setIsQcViewOpen}>
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <ListChecks className='h-5 w-5 text-emerald-500' />
              Detail QC Check
            </AlertDialogTitle>
            <AlertDialogDescription>
              Hasil pengecekan kualitas untuk: <strong>{qcViewItem?.item}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className='py-4 space-y-5'>
            {/* Detail Cards/Numbers */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='bg-neutral-50 p-3 rounded-lg border border-neutral-100'>
                <span className='text-[10px] uppercase text-neutral-400 font-bold block'>Jumlah Checked</span>
                <span className='text-lg font-bold text-neutral-800'>{qcViewItem?.qc_cek?.qty || 0} / {qcViewItem?.jumlah || 0} Unit</span>
              </div>
              <div className='bg-neutral-50 p-3 rounded-lg border border-neutral-100'>
                <span className='text-[10px] uppercase text-neutral-400 font-bold block'>Status</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                  qcViewItem?.qc_cek?.status === 'Pass' ? 'bg-emerald-100 text-emerald-700' :
                  qcViewItem?.qc_cek?.status === 'Repair' ? 'bg-amber-100 text-amber-700' :
                  qcViewItem?.qc_cek?.status === 'Defect' ? 'bg-red-100 text-red-700' :
                  'bg-neutral-100 text-neutral-700'
                }`}>
                  {qcViewItem?.qc_cek?.status || '-'}
                </span>
              </div>
            </div>

            <div className='grid grid-cols-3 gap-3 text-center'>
              <div className='bg-amber-50/50 p-3 rounded-lg border border-amber-100'>
                <span className='text-[10px] uppercase text-amber-600 font-bold block'>Repair</span>
                <span className='text-lg font-black text-amber-700'>{qcViewItem?.qc_cek?.repair || 0}</span>
              </div>
              <div className='bg-emerald-50/50 p-3 rounded-lg border border-emerald-100'>
                <span className='text-[10px] uppercase text-emerald-600 font-bold block'>Pass</span>
                <span className='text-lg font-black text-emerald-700'>{qcViewItem?.qc_cek?.pass || 0}</span>
              </div>
              <div className='bg-red-50/50 p-3 rounded-lg border border-red-100'>
                <span className='text-[10px] uppercase text-red-600 font-bold block'>Afkir</span>
                <span className='text-lg font-black text-red-700'>{qcViewItem?.qc_cek?.afkir || 0}</span>
              </div>
            </div>

            {/* Pass Rate Progress Bar */}
            {(() => {
              const qty = qcViewItem?.qc_cek?.qty || 1;
              const pass = qcViewItem?.qc_cek?.pass || 0;
              const persen = Math.min(Math.round((pass / qty) * 100), 100);
              return (
                <div className='bg-neutral-50 rounded-xl p-3 space-y-2 border border-neutral-100'>
                  <div className='flex items-center justify-between'>
                    <span className='text-xs font-semibold text-neutral-500'>Pass Rate</span>
                    <span className={`text-sm font-bold ${
                      persen >= 100 ? 'text-emerald-600' : persen >= 80 ? 'text-amber-600' : 'text-red-600'
                    }`}>{persen}%</span>
                  </div>
                  <div className='h-2 bg-neutral-200 rounded-full overflow-hidden'>
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        persen >= 100 ? 'bg-emerald-500' : persen >= 80 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${persen}%` }}
                    />
                  </div>
                </div>
              );
            })()}

            {qcViewItem?.qc_cek?.file && (
              <div className='space-y-1.5'>
                <span className='text-[10px] uppercase text-neutral-400 font-bold block'>File QC</span>
                <a 
                  href={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('/api', '')}/storage/${qcViewItem.qc_cek.file}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Eye className="h-3 w-3" /> Lihat Berkas / Foto QC
                </a>
              </div>
            )}
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel className='bg-neutral-100 hover:bg-neutral-200 border-none' onClick={() => setIsQcViewOpen(false)}>
              Tutup
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Barang Jadi Masuk Dialog */}
      <AlertDialog open={isBjDialogOpen} onOpenChange={setIsBjDialogOpen}>
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <ListChecks className='h-5 w-5 text-blue-500' />
              Record Barang Masuk Lengkap
            </AlertDialogTitle>
            <AlertDialogDescription>
              Catat barang yang sudah masuk lengkap untuk item:{' '}
              <strong>{bjItem?.item}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='grid gap-4 py-4'>
            {bjItem?.barang_jadi_masuk &&
              bjItem.barang_jadi_masuk.length > 0 && (
                <div className='bg-neutral-50 rounded-lg p-3 border border-neutral-100 mb-2'>
                  <Label className='text-[10px] uppercase text-neutral-500 font-bold mb-2 block'>
                    Riwayat Masuk Sebelumnya
                  </Label>
                  <div className='space-y-2'>
                    {bjItem.barang_jadi_masuk.map((record, i) => (
                      <div
                        key={i}
                        className='flex justify-between items-center text-xs border-b border-neutral-100 last:border-0 pb-1 last:pb-0'
                      >
                        <span className='text-neutral-600'>
                          {format(new Date(record.tanggal), 'dd MMM yyyy')}
                        </span>
                        <div className='flex items-center gap-2'>
                          {record.file_setrim && (
                            <a
                              href={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('/api', '')}/storage/${record.file_setrim}`}
                              target='_blank'
                              rel='noreferrer'
                              className='text-[10px] text-blue-600 hover:underline flex items-center gap-0.5'
                            >
                              <Eye className='h-3 w-3' /> File Setrim
                            </a>
                          )}
                          <span className='font-bold text-blue-600'>
                            +{record.jumlah}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className='flex justify-between text-xs pt-1 font-bold border-t border-neutral-200'>
                      <span>Total Saat Ini</span>
                      <span className='text-neutral-900'>
                        {bjItem.barang_jadi_masuk.reduce(
                          (sum, r) => sum + r.jumlah,
                          0
                        )}{' '}
                        / {bjItem.jumlah}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            <div className='space-y-2'>
              <Label>Tanggal Masuk</Label>
              <Input
                type='date'
                value={bjTanggal}
                onChange={(e) => setBjTanggal(e.target.value)}
                className='text-xs'
              />
            </div>
            <div className='space-y-2'>
              <Label>Jumlah Barang Baru</Label>
              <div className='flex items-center gap-4'>
                <Input
                  type='number'
                  value={bjJumlah === 0 ? '' : bjJumlah}
                  onChange={(e) => setBjJumlah(parseInt(e.target.value) || 0)}
                  className='font-bold'
                  max={
                    bjItem
                      ? bjItem.jumlah -
                        (bjItem.barang_jadi_masuk?.reduce(
                          (sum, bj) => sum + bj.jumlah,
                          0
                        ) || 0)
                      : undefined
                  }
                />
                <span className='text-sm text-muted-foreground whitespace-nowrap'>
                  Sisa:{' '}
                  {(bjItem?.jumlah || 0) -
                    (bjItem?.barang_jadi_masuk?.reduce(
                      (sum, bj) => sum + bj.jumlah,
                      0
                    ) || 0)}
                </span>
              </div>
            </div>
            <div className='space-y-2'>
              <Label>File Setrim Barang Jadi</Label>
              <Input
                type='file'
                onChange={(e) => setBjFile(e.target.files?.[0] || null)}
                className='text-xs'
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsBjDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <Button
              className='bg-blue-600 hover:bg-blue-700 text-white'
              onClick={handleBjUpdate}
              disabled={
                updateBjMutation.isPending ||
                bjJumlah < 1 ||
                bjJumlah >
                  (bjItem?.jumlah || 0) -
                    (bjItem?.barang_jadi_masuk?.reduce(
                      (sum, bj) => sum + bj.jumlah,
                      0
                    ) || 0)
              }
            >
              {updateBjMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <CheckCircle2 className='mr-2 h-4 w-4' />
              )}
              Record Barang
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Packing Detail Dialog (View Only) */}
      <AlertDialog open={isPackingViewOpen} onOpenChange={setIsPackingViewOpen}>
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <Package className='h-5 w-5 text-orange-500' />
              Detail Packing
            </AlertDialogTitle>
            <AlertDialogDescription>
              Riwayat packing untuk item: <strong>{packingViewItem?.item}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className='py-4 space-y-4'>
            {packingViewItem?.barang_jadi_terpacking &&
            packingViewItem.barang_jadi_terpacking.length > 0 ? (
              <div className='bg-neutral-50 rounded-lg p-3 border border-neutral-100'>
                <Label className='text-[10px] uppercase text-neutral-500 font-bold mb-2 block'>
                  Riwayat Packing
                </Label>
                <div className='space-y-2'>
                  {packingViewItem.barang_jadi_terpacking.map((record, i) => (
                    <div
                      key={i}
                      className='flex justify-between text-xs border-b border-neutral-100 last:border-0 pb-1 last:pb-0'
                    >
                      <span className='text-neutral-600'>
                        {format(new Date(record.tanggal), 'dd MMM yyyy')}
                      </span>
                      <span className='font-bold text-orange-600'>
                        +{record.jumlah}
                      </span>
                    </div>
                  ))}
                  <div className='flex justify-between text-xs pt-1 font-bold border-t border-neutral-200'>
                    <span>Total Packed</span>
                    <span className='text-neutral-900'>
                      {packingViewItem.barang_jadi_terpacking.reduce(
                        (sum, r) => sum + r.jumlah,
                        0
                      )}{' '}
                      / {packingViewItem.jumlah}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className='text-xs text-neutral-500 italic text-center py-4'>
                Belum ada riwayat packing untuk item ini.
              </p>
            )}
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel className='bg-neutral-100 hover:bg-neutral-200 border-none' onClick={() => setIsPackingViewOpen(false)}>
              Tutup
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
