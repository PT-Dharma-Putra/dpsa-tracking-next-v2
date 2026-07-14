'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Pencil,
  Trash2,
  Loader2,
  ArrowLeft,
  FileText,
  Activity,
  ListChecks,
  CheckCircle2,
  Eye,
  Image as ImageIcon,
  Upload,
  ArrowUpRight,
  Building2,
  ChevronDown,
  Package,
  ClipboardCheck,
  Info,
  Calendar,
  User,
  MoreHorizontal,
  FileDown,
  Truck,
  BarChart3,
  History,
  Search,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, Plus, ClipboardList } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

import {
  projectV2Service,
  ProjectItemV2,
} from '@/features/projects/services/project-v2-service';
import { PengirimanService } from '@/features/pengiriman/services/pengiriman-service';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';

export default function PerencanaanDetailPage() {
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

  const { data: divisions } = useQuery({
    queryKey: ['divisions'],
    queryFn: () => projectV2Service.getDivisions(),
  });

  const { data: pics } = useQuery({
    queryKey: ['pics'],
    queryFn: () => projectV2Service.getPics(),
  });

  const spkId = project?.spk?.id;

  const { data: pengirimanPerSpkData } = useQuery({
    queryKey: ['pengiriman-per-spk', spkId],
    queryFn: () =>
      PengirimanService.getPengiriman({ spk_id: spkId, per_page: 100 }),
    enabled: !!spkId,
  });

  // Items Search State
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Bulk PO Divisi State
  const [selectedItemIds, setSelectedItemIds] = React.useState<number[]>([]);
  const [openDivisiPopover, setOpenDivisiPopover] = React.useState<number | null>(null);

  // Gambar Kerja State
  const [isGkDialogOpen, setIsGkDialogOpen] = React.useState(false);
  const [gkItem, setGkItem] = React.useState<ProjectItemV2 | null>(null);
  const [gkFile, setGkFile] = React.useState<File | null>(null);
  const [gkStart, setGkStart] = React.useState<string>('');
  const [gkEnd, setGkEnd] = React.useState<string>('');

  const uploadGkMutation = useMutation({
    mutationFn: (payload: {
      file?: File;
      tanggal_mulai?: string;
      tanggal_selesai?: string;
    }) => projectV2Service.uploadGambarKerja(gkItem!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-v2-items', projectId],
      });
      toast.success('Gambar Kerja updated');
      setIsGkDialogOpen(false);
      setGkFile(null);
    },
    onError: () => {
      toast.error('Failed to update Gambar Kerja');
    },
  });

  const handleGkUpload = () => {
    if (!gkItem) return;
    uploadGkMutation.mutate({
      file: gkFile || undefined,
      tanggal_mulai: gkStart || undefined,
      tanggal_selesai: gkEnd || undefined,
    });
  };

  const openGkUpload = (item: ProjectItemV2) => {
    setGkItem(item);
    setGkStart(item.gambar_kerja?.tanggal_mulai || '');
    setGkEnd(item.gambar_kerja?.tanggal_selesai || '');
    setGkFile(null);
    setIsGkDialogOpen(true);
  };

  // Dokubah State
  const [isDokubahDialogOpen, setIsDokubahDialogOpen] = React.useState(false);
  const [dokubahFile, setDokubahFile] = React.useState<File | string | null>(null);
  const [dokubahRekapFile, setDokubahRekapFile] = React.useState<File | string | null>(null);
  const [dokubahStart, setDokubahStart] = React.useState<string>('');
  const [dokubahEnd, setDokubahEnd] = React.useState<string>('');

  const uploadDokubahMutation = useMutation({
    mutationFn: (payload: {
      file?: File | string;
      file_rekap_dokubah?: File | string;
      tanggal_mulai?: string;
      tanggal_selesai?: string;
    }) => projectV2Service.uploadDokubah(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['projects-v2', projectId],
      });
      toast.success('Dokubah updated');
      setIsDokubahDialogOpen(false);
      setDokubahFile(null);
      setDokubahRekapFile(null);
    },
    onError: () => {
      toast.error('Failed to update Dokubah');
    },
  });

  const handleDokubahUpload = () => {
    uploadDokubahMutation.mutate({
      file: dokubahFile || undefined,
      file_rekap_dokubah: dokubahRekapFile || undefined,
      tanggal_mulai: dokubahStart || undefined,
      tanggal_selesai: dokubahEnd || undefined,
    });
  };

  const openDokubahUpload = () => {
    setDokubahStart(project?.dokubah?.tanggal_mulai || '');
    setDokubahEnd(project?.dokubah?.tanggal_selesai || '');
    setDokubahFile(project?.dokubah?.file || null);
    setDokubahRekapFile(project?.dokubah?.file_rekap_dokubah || null);
    setIsDokubahDialogOpen(true);
  };

  // Stok Material State
  const [isStokDialogOpen, setIsStokDialogOpen] = React.useState(false);
  const [stokItem, setStokItem] = React.useState<ProjectItemV2 | null>(null);
  const [stokMenerima, setStokMenerima] = React.useState<string>('');
  const [stokKeluar, setStokKeluar] = React.useState<string>('');
  const [stokPicId, setStokPicId] = React.useState<string>('');
  const [stokStatus, setStokStatus] = React.useState<string>('');
  const [stokDeskripsiBelumLengkap, setStokDeskripsiBelumLengkap] = React.useState<string>('');
  const [stokPicOpen, setStokPicOpen] = React.useState(false);
  const [isManualPic, setIsManualPic] = React.useState(false);
  const [newPicName, setNewPicName] = React.useState('');
  const [newPicJabatan, setNewPicJabatan] = React.useState('');

  const updateStokMutation = useMutation({
    mutationFn: (payload: {
      ketersediaan_stok?: string;
      tanggal_menerima_dokubah?: string;
      tanggal_keluar?: string;
      pic_id?: number;
      new_pic_name?: string;
      new_pic_jabatan?: string;
      deskripsi_belum_lengkap?: string;
    }) => projectV2Service.updateBahanBaku(stokItem!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-v2-items', projectId],
      });
      toast.success('Stok Material updated');
      setIsStokDialogOpen(false);
    },
    onError: () => {
      toast.error('Failed to update Stok Material');
    },
  });

  const handleStokUpdate = () => {
    if (!stokItem) return;
    updateStokMutation.mutate({
      ketersediaan_stok: stokStatus || undefined,
      tanggal_menerima_dokubah: stokMenerima || undefined,
      tanggal_keluar: stokKeluar || undefined,
      pic_id: isManualPic ? undefined : (stokPicId ? parseInt(stokPicId) : undefined),
      new_pic_name: isManualPic ? newPicName : undefined,
      new_pic_jabatan: isManualPic ? newPicJabatan : undefined,
      deskripsi_belum_lengkap: stokStatus === 'Belum Lengkap' ? stokDeskripsiBelumLengkap : '',
    });
  };

  const openStokDialog = (item: ProjectItemV2) => {
    setStokItem(item);
    setStokStatus(item.bahan_baku?.ketersediaan_stok || '');
    setStokMenerima(item.bahan_baku?.tanggal_menerima_dokubah || '');
    setStokKeluar(item.bahan_baku?.tanggal_keluar || '');
    setStokPicId(item.bahan_baku?.pic_id?.toString() || '');
    setStokDeskripsiBelumLengkap(item.bahan_baku?.deskripsi_belum_lengkap || '');
    setIsManualPic(false);
    setNewPicName('');
    setNewPicJabatan('');
    setIsStokDialogOpen(true);
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

  // Barang Jadi Terpacking State
  const [isPackingDialogOpen, setIsPackingDialogOpen] = React.useState(false);
  const [packingItem, setPackingItem] = React.useState<ProjectItemV2 | null>(null);
  const [packingTanggal, setPackingTanggal] = React.useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [packingJumlah, setPackingJumlah] = React.useState<number>(0);

  const updatePackingMutation = useMutation({
    mutationFn: (payload: { tanggal: string; jumlah: number }) =>
      projectV2Service.updateBarangJadiTerpacking(packingItem!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-v2-items', projectId],
      });
      toast.success('Packing recorded');
      setIsPackingDialogOpen(false);
      setPackingJumlah(0);
    },
    onError: () => {
      toast.error('Failed to record Packing');
    },
  });

  const handlePackingUpdate = () => {
    if (!packingItem) return;

    const currentTotal =
      packingItem.barang_jadi_terpacking?.reduce((sum, p) => sum + p.jumlah, 0) || 0;
    if (currentTotal + packingJumlah > packingItem.jumlah) {
      toast.error(
        `Total packing (${
          currentTotal + packingJumlah
        }) tidak boleh melebihi jumlah order (${packingItem.jumlah})`
      );
      return;
    }

    updatePackingMutation.mutate({
      tanggal: packingTanggal,
      jumlah: packingJumlah,
    });
  };

  const openPackingDialog = (item: ProjectItemV2) => {
    setPackingItem(item);
    setPackingJumlah(0);
    setIsPackingDialogOpen(true);
  };

  // Order Gambar Kerja State
  const [isOrderGkDialogOpen, setIsOrderGkDialogOpen] = React.useState(false);
  const [orderGkFile, setOrderGkFile] = React.useState<File | null>(null);
  const [orderGkTarget, setOrderGkTarget] = React.useState<string>('');
  const [pakaiGambar, setPakaiGambar] = React.useState<boolean>(true);

  const uploadOrderGkMutation = useMutation({
    mutationFn: (payload: { file: File | null; target_selesai: string | null; pakai_gambar: number }) =>
      projectV2Service.uploadOrderGambarKerja(projectId, payload.file, payload.target_selesai, payload.pakai_gambar),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-v2', projectId] });
      toast.success('Order Gambar Kerja uploaded');
      setIsOrderGkDialogOpen(false);
      setOrderGkFile(null);
      setOrderGkTarget('');
      setPakaiGambar(true);
    },
    onError: () => {
      toast.error('Failed to upload Order Gambar Kerja');
    },
  });

  const handleOrderGkUpload = () => {
    if (pakaiGambar && (!orderGkFile || !orderGkTarget)) return;
    uploadOrderGkMutation.mutate({
      file: pakaiGambar ? orderGkFile : null,
      target_selesai: pakaiGambar ? orderGkTarget : null,
      pakai_gambar: pakaiGambar ? 1 : 0,
    });
  };

  // Order Produksi State
  const [isOrderProduksiDialogOpen, setIsOrderProduksiDialogOpen] = React.useState(false);
  const [orderProduksiFile, setOrderProduksiFile] = React.useState<File | null>(null);
  const [orderProduksiTarget, setOrderProduksiTarget] = React.useState<string>('');

  const uploadOrderProduksiMutation = useMutation({
    mutationFn: (payload: { file: File; target_selesai: string }) =>
      projectV2Service.uploadOrderProduksi(projectId, payload.file, payload.target_selesai),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-v2', projectId] });
      toast.success('Order Produksi submitted successfully');
      setIsOrderProduksiDialogOpen(false);
      setOrderProduksiFile(null);
      setOrderProduksiTarget('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit order');
    },
  });

  const handleOrderProduksiUpload = () => {
    if (!orderProduksiFile || !orderProduksiTarget) {
      toast.error('Please select a file and target date');
      return;
    }
    uploadOrderProduksiMutation.mutate({
      file: orderProduksiFile,
      target_selesai: orderProduksiTarget,
    });
  };

  const [editingDivisiItemId, setEditingDivisiItemId] = React.useState<
    number | null
  >(null);

  const updateItemDivisiMutation = useMutation({
    mutationFn: ({ itemId, divisiId }: { itemId: number; divisiId: number }) =>
      projectV2Service.updateProjectItem(itemId, { divisi_id: divisiId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-v2-items', projectId],
      });
      toast.success('Division assigned successfully');
      setEditingDivisiItemId(null);
    },
    onError: () => {
      toast.error('Failed to assign division');
    },
  });

  const bulkUpdateItemDivisiMutation = useMutation({
    mutationFn: async (divisiId: number) => {
      const promises = selectedItemIds.map(itemId => 
        projectV2Service.updateProjectItem(itemId, { divisi_id: divisiId })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-v2-items', projectId],
      });
      toast.success('PO Divisi massal berhasil diupdate');
      setSelectedItemIds([]);
    },
    onError: () => {
      toast.error('Gagal mengupdate PO Divisi massal');
    },
  });

  const bulkUpdateStokMutation = useMutation({
    mutationFn: async (payload: {
      ketersediaan_stok?: string;
      tanggal_menerima_dokubah?: string;
      tanggal_keluar?: string;
      pic_id?: number;
      new_pic_name?: string;
      new_pic_jabatan?: string;
      deskripsi_belum_lengkap?: string;
    }) => {
      const promises = selectedItemIds.map(itemId => 
        projectV2Service.updateBahanBaku(itemId, payload)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-v2-items', projectId],
      });
      toast.success('Stok Material massal berhasil diupdate');
      setSelectedItemIds([]);
    },
    onError: () => {
      toast.error('Gagal mengupdate Stok Material massal');
    },
  });

  const [isBulkStokDialogOpen, setIsBulkStokDialogOpen] = React.useState(false);

  const handleBulkStokUpdate = () => {
    bulkUpdateStokMutation.mutate({
      ketersediaan_stok: stokStatus || undefined,
      tanggal_menerima_dokubah: stokMenerima || undefined,
      tanggal_keluar: stokKeluar || undefined,
      pic_id: isManualPic ? undefined : (stokPicId ? parseInt(stokPicId) : undefined),
      new_pic_name: isManualPic ? newPicName : undefined,
      new_pic_jabatan: isManualPic ? newPicJabatan : undefined,
      deskripsi_belum_lengkap: stokStatus === 'Belum Lengkap' ? stokDeskripsiBelumLengkap : '',
    }, {
      onSuccess: () => {
        setIsBulkStokDialogOpen(false);
      }
    });
  };

  const openBulkStokDialog = () => {
    setStokStatus('');
    setStokMenerima('');
    setStokKeluar('');
    setStokPicId('');
    setStokDeskripsiBelumLengkap('');
    setIsManualPic(false);
    setNewPicName('');
    setNewPicJabatan('');
    setIsBulkStokDialogOpen(true);
  };

  const [isSphCollapsed, setIsSphCollapsed] = React.useState(true);
  const [isDivisiCollapsed, setIsDivisiCollapsed] = React.useState(true);
  const [isGkCollapsed, setIsGkCollapsed] = React.useState(true);
  const [isDokubahCollapsed, setIsDokubahCollapsed] = React.useState(true);
  const [isStokCollapsed, setIsStokCollapsed] = React.useState(true);
  const [isBjCollapsed, setIsBjCollapsed] = React.useState(true);
  const [isProduksiCollapsed, setIsProduksiCollapsed] = React.useState(true);
  const [isShipCollapsed, setIsShipCollapsed] = React.useState(true);
  const [isKeluarCollapsed, setIsKeluarCollapsed] = React.useState(true);
  const [isBelumSettingCollapsed, setIsBelumSettingCollapsed] = React.useState(true);
  const [isSettingCollapsed, setIsSettingCollapsed] = React.useState(true);

  // View Produksi State
  const [isProduksiViewOpen, setIsProduksiViewOpen] = React.useState(false);
  const [produksiViewItem, setProduksiViewItem] = React.useState<ProjectItemV2 | null>(null);
  const [isSupplierViewOpen, setIsSupplierViewOpen] = React.useState(false);
  const [supplierViewItem, setSupplierViewItem] = React.useState<ProjectItemV2 | null>(null);

  // Edit Dimensi State
  const [isDimDialogOpen, setIsDimDialogOpen] = React.useState(false);
  const [dimItem, setDimItem] = React.useState<ProjectItemV2 | null>(null);
  const [dimData, setDimData] = React.useState({
    volume: 0,
    panjang: 0,
    lebar: 0,
    tinggi: 0,
    satuan: '',
    jumlah: 0,
  });

  // Auto-calculate Volume based on Satuan
  React.useEffect(() => {
    const { satuan, panjang, lebar, tinggi, jumlah } = dimData;
    let newVolume = dimData.volume;

    if (satuan === 'M1') {
      newVolume = jumlah;
    } else if (satuan === 'M2 (pxl)') {
      newVolume = panjang * lebar;
    } else if (satuan === 'M2 (pxt)') {
      newVolume = panjang * tinggi;
    } else if (satuan === 'UNIT' || satuan === 'SET') {
      newVolume = jumlah;
    }

    if (newVolume !== dimData.volume) {
      setDimData((prev) => ({ ...prev, volume: newVolume }));
    }
  }, [dimData.satuan, dimData.panjang, dimData.lebar, dimData.tinggi, dimData.jumlah]);

  // History State
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
  const [historyItem, setHistoryItem] = React.useState<ProjectItemV2 | null>(null);
  const { data: itemHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['item-history', historyItem?.id],
    queryFn: () => projectV2Service.getItemHistory(historyItem!.id),
    enabled: !!historyItem,
  });

  const filteredHistory = React.useMemo(() => {
    return itemHistory?.filter((h: any) => h.old_value !== null && h.old_value !== undefined && h.old_value !== 'null') || [];
  }, [itemHistory]);

  const updateDimMutation = useMutation({
    mutationFn: (payload: any) => projectV2Service.updateProjectItem(dimItem!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-v2-items', projectId] });
      toast.success('Dimensions updated successfully');
      setIsDimDialogOpen(false);
    },
    onError: () => {
      toast.error('Failed to update dimensions');
    },
  });

  const handleDimUpdate = () => {
    if (!dimItem) return;
    updateDimMutation.mutate(dimData);
  };

  const openDimDialog = (item: ProjectItemV2) => {
    setDimItem(item);
    setDimData({
      volume: item.volume || 0,
      panjang: item.panjang || 0,
      lebar: item.lebar || 0,
      tinggi: item.tinggi || 0,
      satuan: item.satuan || '',
      jumlah: item.jumlah,
    });
    setIsDimDialogOpen(true);
  };

  const openHistory = (item: ProjectItemV2) => {
    setHistoryItem(item);
    setIsHistoryOpen(true);
  };

  const openProduksiView = (item: ProjectItemV2) => {
    if (item.produksi?.is_supplier) {
      setSupplierViewItem(item);
      setIsSupplierViewOpen(true);
    } else {
      setProduksiViewItem(item);
      setIsProduksiViewOpen(true);
    }
  };

  const filteredItems = React.useMemo(() => {
    if (!items) return [];
    return [...items]
      .filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.item?.toLowerCase().includes(q) ||
          (item.lantai ?? '').toLowerCase().includes(q) ||
          (item.ruang ?? '').toLowerCase().includes(q) ||
          (item.keterangan ?? '').toLowerCase().includes(q) ||
          (item.material_utama ?? '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const lantaiA = a.lantai ?? '';
        const lantaiB = b.lantai ?? '';
        const lantaiCmp = lantaiA.localeCompare(lantaiB, undefined, { numeric: true, sensitivity: 'base' });
        if (lantaiCmp !== 0) return lantaiCmp;
        const ruangA = a.ruang ?? '';
        const ruangB = b.ruang ?? '';
        return ruangA.localeCompare(ruangB, undefined, { numeric: true, sensitivity: 'base' });
      });
  }, [items, searchQuery]);

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

  // Summary Calculations
  const totalItems = items?.length || 0;
  const poDivisiCount = items?.filter(i => i.divisi_id).length || 0;
  const gambarKerjaCount = items?.filter(i => i.gambar_kerja?.file || i.mdl_item?.link_gambar_kerja).length || 0;
  const dokubahCount = (project.dokubah?.file || project.dokubah?.file_rekap_dokubah) ? 1 : 0;
  const stokLengkapCount = items?.filter(i => i.bahan_baku?.ketersediaan_stok === 'Tersedia' || i.bahan_baku?.ketersediaan_stok === 'Lengkap').length || 0;
  const stokBelumLengkapCount = totalItems - stokLengkapCount;
  const stokLengkapPercentage = totalItems ? Math.round((stokLengkapCount / totalItems) * 100) : 0;
  const stokBelumLengkapPercentage = totalItems ? Math.round((stokBelumLengkapCount / totalItems) * 100) : 0;
  const isStokTerisi = totalItems > 0 && (items?.every(i => !!i.bahan_baku?.ketersediaan_stok) || false);
  const perintahProduksiCount = items?.filter(i => i.divisi_id && (i.gambar_kerja?.file || i.mdl_item?.link_gambar_kerja)).length || 0;
  
  const totalQtyOrder = items?.reduce((sum, i) => sum + i.jumlah, 0) || 0;
  const totalQtyMasuk = items?.reduce((sum, i) => sum + (i.barang_jadi_masuk?.reduce((s, bj) => s + bj.jumlah, 0) || 0), 0) || 0;
  const totalQtyPacking = items?.reduce((sum, i) => sum + (i.barang_jadi_terpacking?.reduce((s, p) => s + p.jumlah, 0) || 0), 0) || 0;
  const totalQtyKeluar =
    pengirimanPerSpkData?.data.reduce(
      (sum, p) =>
        sum +
        (p.details?.reduce((s, d) => s + Number(d.jumlah_keluar), 0) ?? 0),
      0
    ) ?? 0;
  const totalQtySetting =
    pengirimanPerSpkData?.data.reduce(
      (sum, p) =>
        sum +
        (p.details?.reduce((s, d) => s + Number(d.jumlah_tersetting), 0) ?? 0),
      0
    ) ?? 0;
  const totalQtyBelumSetting = totalQtyKeluar - totalQtySetting;
  const orderGk = project?.order_gambar_kerja?.[0];
  const isGkCompleted = (totalItems > 0 && gambarKerjaCount === totalItems) || orderGk?.pakai_gambar === 0;
  const gkProgress = isGkCompleted ? 100 : (totalItems ? (gambarKerjaCount / totalItems) * 100 : 0);

  const flowSteps = [
    {
      id: 1,
      title: 'Upload SPD',
      isCompleted: !!project.designs?.[0]?.spd_file,
      isActive: project.need_design !== 0,
      icon: FileText,
      bgColor: 'bg-orange-500',
      lightBg: 'bg-orange-50',
      borderColor: 'border-orange-200',
      color: 'text-orange-600',
    },
    {
      id: 2,
      title: 'ACC Design',
      isCompleted: project.designs?.[0]?.acc_design?.status === 'Approved',
      isActive: project.need_design !== 0 && !!project.designs?.[0]?.spd_file,
      icon: CheckCircle2,
      bgColor: 'bg-emerald-500',
      lightBg: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      color: 'text-emerald-600',
    },
    {
      id: 3,
      title: 'Upload SPH',
      isCompleted: !!project.sph?.file,
      isActive: project.need_design === 0 || project.designs?.[0]?.acc_design?.status === 'Approved',
      icon: FileText,
      bgColor: 'bg-blue-500',
      lightBg: 'bg-blue-50',
      borderColor: 'border-blue-200',
      color: 'text-blue-600',
    },
    {
      id: 4,
      title: 'Upload SPK',
      isCompleted: !!project.spk?.file || !!project.spk?.spk_signed_file,
      isActive: !!project.sph?.file,
      icon: ClipboardCheck,
      bgColor: 'bg-purple-500',
      lightBg: 'bg-purple-50',
      borderColor: 'border-purple-200',
      color: 'text-purple-600',
    },
    {
      id: 5,
      title: 'Planning',
      isCompleted: totalItems > 0 && poDivisiCount === totalItems,
      isActive: !!project.spk?.file || !!project.spk?.spk_signed_file,
      icon: ListChecks,
      bgColor: 'bg-blue-500',
      lightBg: 'bg-blue-50',
      borderColor: 'border-blue-200',
      color: 'text-blue-600',
    },
  ];



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
              <p className='text-xs text-muted-foreground italic'>Perencanaan Detail (PPIC View)</p>
            </div>
            <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
              {project.client?.name && (
                <span className='flex items-center gap-1 text-xs text-neutral-600'>
                  <Building2 className='h-3 w-3 text-neutral-400' />
                  {project.client.name}
                </span>
              )}
              {project.sph?.nomor_sph && (
                <span className='flex items-center gap-1 text-xs text-neutral-600'>
                  <FileText className='h-3 w-3 text-neutral-400' />
                  SPH: {project.sph.nomor_sph}
                </span>
              )}
              {(project.spk_number || project.spk?.nomor_spk) && (
                <span className='flex items-center gap-1 text-xs text-neutral-600'>
                  <ClipboardCheck className='h-3 w-3 text-neutral-400' />
                  SPK: {project.spk_number || project.spk?.nomor_spk}
                </span>
              )}
              {project.deadline && (
                <span className='flex items-center gap-1 text-xs text-neutral-600'>
                  <Calendar className='h-3 w-3 text-neutral-400' />
                  {format(new Date(project.deadline), 'MMM d, yyyy')}
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

      {/* Summary Cards Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 w-full'>
        {/* 1. SPH & SPK */}
        <Card className={`relative border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${(!!project.spk?.file || !!project.spk?.spk_signed_file) ? 'border-purple-200 bg-white ring-1 ring-purple-100' : 'border-neutral-200 bg-white'}`}>
          {project.sph?.file && (project.spk?.file || project.spk?.spk_signed_file) && (
            <div className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm z-10 animate-in zoom-in duration-300">
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            </div>
          )}
          <CardHeader className='pb-2 flex flex-row items-center justify-between gap-3 min-w-0'>
            <button className='flex items-center gap-3 flex-1 text-left min-w-0' onClick={() => setIsSphCollapsed(!isSphCollapsed)}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold shrink-0 ${(!!project.spk?.file || !!project.spk?.spk_signed_file) ? 'bg-purple-100 text-purple-600' : 'bg-neutral-100 text-neutral-500'}`}>1</div>
              <div className='flex-1 min-w-0'>
                <CardTitle className='text-sm text-neutral-800 font-bold truncate'>SPH & SPK</CardTitle>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wider font-semibold truncate'>Documents</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-neutral-400 shrink-0 transition-transform duration-200 ${isSphCollapsed ? '-rotate-90' : ''}`} />
            </button>
          </CardHeader>
          {!isSphCollapsed && (
            <CardContent className='pt-0 space-y-2.5'>
               <div className='grid grid-cols-2 gap-2 border-t border-neutral-100 pt-2.5'>
                  {/* SPH Block */}
                  <div className='flex items-center justify-between bg-neutral-50/50 p-1.5 rounded border border-neutral-100 min-w-0'>
                    <div className='flex flex-col gap-0.5 min-w-0 flex-1 mr-1'>
                      <span className='text-[9px] text-neutral-400 font-bold uppercase tracking-wider leading-none'>Nomor SPH</span>
                      <span className={`text-[10px] font-extrabold truncate ${project.sph?.nomor_sph ? 'text-emerald-600' : 'text-red-500'}`} title={project.sph?.nomor_sph || undefined}>
                        {project.sph?.nomor_sph || '-'}
                      </span>
                    </div>
                    {(() => {
                      const sphFile = project.sph?.file;
                      if (!sphFile) return null;
                      return (
                        <Button variant='ghost' size='icon' className='h-6 w-6 text-blue-600 hover:bg-blue-100 shrink-0' asChild title="Lihat SPH">
                          <a 
                            href={sphFile.startsWith('http') ? sphFile : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('/api', '')}/storage/${sphFile}`} 
                            target='_blank' 
                            rel='noopener noreferrer'
                          >
                            <Eye className='h-3.5 w-3.5' />
                          </a>
                        </Button>
                      );
                    })()}
                  </div>

                  {/* SPK Block */}
                  <div className='flex items-center justify-between bg-neutral-50/50 p-1.5 rounded border border-neutral-100 min-w-0'>
                    <div className='flex flex-col gap-0.5 min-w-0 flex-1 mr-1'>
                      <span className='text-[9px] text-neutral-400 font-bold uppercase tracking-wider leading-none'>Nomor SPK</span>
                      <span className={`text-[10px] font-extrabold truncate ${project.spk?.nomor_spk ? 'text-emerald-600' : 'text-red-500'}`} title={project.spk?.nomor_spk || undefined}>
                        {project.spk?.nomor_spk || '-'}
                      </span>
                    </div>
                    {(() => {
                      const spkFile = project.spk?.spk_signed_file || project.spk?.file;
                      if (!spkFile) return null;
                      return (
                        <Button variant='ghost' size='icon' className='h-6 w-6 text-blue-600 hover:bg-blue-100 shrink-0' asChild title="Lihat SPK">
                          <a 
                            href={spkFile.startsWith('http') ? spkFile : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('/api', '')}/storage/${spkFile}`} 
                            target='_blank' 
                            rel='noopener noreferrer'
                          >
                            <Eye className='h-3.5 w-3.5' />
                          </a>
                        </Button>
                      );
                    })()}
                  </div>
               </div>
            </CardContent>
          )}
        </Card>

        {/* 2. PO Divisi */}
        <Card className={`relative border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${poDivisiCount === totalItems && totalItems > 0 ? 'border-emerald-200 bg-white ring-1 ring-emerald-100' : 'border-neutral-200 bg-white'}`}>
          {poDivisiCount === totalItems && totalItems > 0 && (
            <div className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm z-10 animate-in zoom-in duration-300">
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            </div>
          )}
          <CardHeader className='pb-2 flex flex-row items-center justify-between gap-3 min-w-0'>
            <button className='flex items-center gap-3 flex-1 text-left min-w-0' onClick={() => setIsDivisiCollapsed(!isDivisiCollapsed)}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold shrink-0 ${poDivisiCount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-neutral-100 text-neutral-500'}`}>2</div>
              <div className='flex-1 min-w-0'>
                <CardTitle className='text-sm text-neutral-800 font-bold truncate'>PO Divisi</CardTitle>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wider font-semibold truncate'>Production Team</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-neutral-400 shrink-0 transition-transform duration-200 ${isDivisiCollapsed ? '-rotate-90' : ''}`} />
            </button>
          </CardHeader>
          {!isDivisiCollapsed && (
            <CardContent className='pt-0'>
               <div className='space-y-2 border-t border-neutral-100 pt-2.5'>
                  <div className='h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden'>
                    <div className='h-full bg-emerald-500 transition-all duration-500' style={{ width: `${totalItems ? (poDivisiCount / totalItems) * 100 : 0}%` }} />
                  </div>
                  <p className='text-[10px] font-bold text-neutral-700'>{poDivisiCount} / {totalItems} Items Assigned</p>
               </div>
            </CardContent>
          )}
        </Card>

        {/* 3. Order Gambar Kerja */}
        <Card className={`relative border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${isGkCompleted ? 'border-orange-200 bg-white ring-1 ring-orange-100' : 'border-neutral-200 bg-white'}`}>
          {isGkCompleted && (
            <div className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm z-10 animate-in zoom-in duration-300">
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            </div>
          )}
          <CardHeader className='pb-2 flex flex-row items-center justify-between gap-3 min-w-0'>
            <button className='flex items-center gap-3 flex-1 text-left min-w-0' onClick={() => setIsGkCollapsed(!isGkCollapsed)}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold shrink-0 ${gambarKerjaCount > 0 || isGkCompleted ? 'bg-orange-100 text-orange-600' : 'bg-neutral-100 text-neutral-500'}`}>3</div>
              <div className='flex-1 min-w-0'>
                <CardTitle className='text-sm text-neutral-800 font-bold truncate'>Gambar Kerja</CardTitle>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wider font-semibold truncate'>Technical Drawing</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-neutral-400 shrink-0 transition-transform duration-200 ${isGkCollapsed ? '-rotate-90' : ''}`} />
            </button>
          </CardHeader>
          {!isGkCollapsed && (
            <CardContent className='pt-0'>
                  <div className='space-y-2 border-t border-neutral-100 pt-2.5'>
                    <div className='h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden'>
                      <div className='h-full bg-orange-500 transition-all duration-500' style={{ width: `${gkProgress}%` }} />
                    </div>
                    <div className='flex justify-between items-center mt-1'>
                      <p className='text-[10px] font-bold text-neutral-700'>
                        {orderGk?.pakai_gambar === 0 
                          ? 'Tanpa Gambar' 
                          : `${gambarKerjaCount} / ${totalItems} Drawings Uploaded`}
                      </p>
                      <p className='text-[10px] font-bold text-orange-600'>{Math.round(gkProgress)}%</p>
                    </div>
                  </div>
                  
                  <div className='pt-2 space-y-2 border-t border-neutral-100 mt-2'>
                    {project.order_gambar_kerja && project.order_gambar_kerja.length > 0 ? (
                      <div className='space-y-1.5 max-h-[80px] overflow-y-auto pr-1'>
                        {project.order_gambar_kerja.map((order, idx) => (
                          <div key={idx} className='flex items-center justify-between text-[9px] bg-neutral-50 p-1.5 rounded border border-neutral-100'>
                            <div className='flex flex-col gap-0.5'>
                              <span className='font-bold text-neutral-700'>
                                Target: {order.target_selesai ? format(new Date(order.target_selesai), 'dd MMM') : '-'}
                              </span>
                            </div>
                            <span className={cn(
                              'text-[8px] font-extrabold px-1 rounded',
                              order.pakai_gambar === 0 
                                ? 'bg-neutral-100 text-neutral-600 border border-neutral-200' 
                                : 'bg-orange-50 text-orange-600 border border-orange-100'
                            )}>
                              {order.pakai_gambar === 0 ? 'Tanpa Gambar' : 'Pakai Gambar'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className='text-[9px] text-muted-foreground italic text-center py-1'>No orders yet</p>
                    )}
                    
                    {orderGk && (
                      orderGk.file ? (
                        <div className='p-2 rounded bg-orange-50/80 border border-orange-100 flex items-center justify-between gap-1 min-w-0'>
                          <div className='flex items-center gap-2 overflow-hidden text-left min-w-0 flex-1 mr-1'>
                            <div className='h-6 w-6 rounded bg-white border border-orange-100 flex items-center justify-center text-orange-600 shrink-0'>
                              <FileText className='h-3 w-3' />
                            </div>
                            <div className='flex flex-col min-w-0 flex-1'>
                              <span className='text-[9px] font-bold text-orange-900 leading-none truncate'>Order Drawing</span>
                              <span className='text-[8px] text-orange-600/80 truncate' title={orderGk.file.split('/').pop()}>{orderGk.file.split('/').pop()}</span>
                            </div>
                          </div>
                          <Button variant='ghost' size='icon' className='h-7 w-7 text-orange-600 hover:bg-orange-100 bg-white border border-orange-100 shadow-sm shrink-0' asChild>
                            <a href={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('/api', '')}/storage/${orderGk.file}`} target='_blank' rel='noopener noreferrer'>
                              <FileDown className='h-3.5 w-3.5' />
                            </a>
                          </Button>
                        </div>
                      ) : orderGk.pakai_gambar === 0 ? (
                        <div className='p-2 rounded bg-neutral-50 border border-neutral-200 flex items-center justify-between gap-1 min-w-0'>
                          <div className='flex items-center gap-2 overflow-hidden text-left min-w-0 flex-1 mr-1'>
                            <div className='h-6 w-6 rounded bg-white border border-neutral-200 flex items-center justify-center text-neutral-500 shrink-0'>
                              <ImageIcon className='h-3.5 w-3.5 text-neutral-400' />
                            </div>
                            <div className='flex flex-col min-w-0 flex-1'>
                              <span className='text-[9px] font-bold text-neutral-700 leading-none'>Tanpa Gambar</span>
                              <span className='text-[8px] text-neutral-500'>Order dikirim tanpa berkas gambar</span>
                            </div>
                          </div>
                        </div>
                      ) : null
                    )}

                    <Button 
                      variant='outline' 
                      size='sm' 
                      className='h-7 w-full text-[10px] border-orange-200 text-orange-600 hover:bg-orange-50 gap-1.5 bg-orange-50/30 font-bold'
                      onClick={() => setIsOrderGkDialogOpen(true)}
                    >
                      <Upload className='h-3 w-3' />
                      Order Gambar
                    </Button>
                  </div>
               </CardContent>
          )}
        </Card>

        {/* 4. Dokubah */}
        <Card className={`relative border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${(project.dokubah?.file || project.dokubah?.file_rekap_dokubah) ? 'border-emerald-200 bg-white ring-1 ring-emerald-100' : 'border-neutral-200 bg-white'}`}>
          {(project.dokubah?.file || project.dokubah?.file_rekap_dokubah) && (
            <div className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm z-10 animate-in zoom-in duration-300">
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            </div>
          )}
          <CardHeader className='pb-2 flex flex-row items-center justify-between gap-3 min-w-0'>
            <button className='flex items-center gap-3 flex-1 text-left min-w-0' onClick={() => setIsDokubahCollapsed(!isDokubahCollapsed)}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold shrink-0 ${(project.dokubah?.file || project.dokubah?.file_rekap_dokubah) ? 'bg-emerald-100 text-emerald-600' : 'bg-neutral-100 text-neutral-500'}`}>4</div>
              <div className='flex-1 min-w-0'>
                <CardTitle className='text-sm text-neutral-800 font-bold truncate'>Dokubah</CardTitle>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wider font-semibold truncate'>Changes Document</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-neutral-400 shrink-0 transition-transform duration-200 ${isDokubahCollapsed ? '-rotate-90' : ''}`} />
            </button>
          </CardHeader>
          {!isDokubahCollapsed && (
            <CardContent className='pt-0'>
               <div className='space-y-2 border-t border-neutral-100 pt-2.5'>
                  <div className='h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden'>
                    <div className='h-full bg-blue-500 transition-all duration-500' style={{ width: `${(project.dokubah?.file || project.dokubah?.file_rekap_dokubah) ? 100 : 0}%` }} />
                  </div>
                  
                  {project.dokubah?.file && (
                    <div className='p-2 rounded bg-blue-50 border border-blue-100 flex items-center justify-between gap-1 min-w-0 mt-2'>
                      <div className='flex items-center gap-2 overflow-hidden text-left min-w-0 flex-1 mr-1'>
                        <div className='h-6 w-6 rounded bg-white border border-blue-100 flex items-center justify-center text-blue-600 shrink-0'>
                          <FileText className='h-3 w-3' />
                        </div>
                        <div className='flex flex-col min-w-0 flex-1'>
                          <span className='text-[9px] font-bold text-blue-900 leading-none truncate'>Dokubah File</span>
                          <span className='text-[8px] text-blue-600/85 truncate' title={project.dokubah.file.split('/').pop()}>{project.dokubah.file.split('/').pop()}</span>
                        </div>
                      </div>
                      <Button variant='ghost' size='icon' className='h-7 w-7 text-blue-600 hover:bg-blue-100 bg-white border border-blue-100 shadow-sm shrink-0' asChild>
                        <a 
                          href={project.dokubah.file.startsWith('http') ? project.dokubah.file : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('/api', '')}/storage/${project.dokubah.file}`} 
                          target='_blank' 
                          rel='noopener noreferrer'
                        >
                          <Eye className='h-3.5 w-3.5' />
                        </a>
                      </Button>
                    </div>
                  )}

                  {project.dokubah?.file_rekap_dokubah && (
                    <div className='p-2 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-between gap-1 min-w-0 mt-2'>
                      <div className='flex items-center gap-2 overflow-hidden text-left min-w-0 flex-1 mr-1'>
                        <div className='h-6 w-6 rounded bg-white border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0'>
                          <FileText className='h-3 w-3' />
                        </div>
                        <div className='flex flex-col min-w-0 flex-1'>
                          <span className='text-[9px] font-bold text-indigo-900 leading-none truncate'>Rekap Dokubah</span>
                          <span className='text-[8px] text-indigo-600/85 truncate' title={project.dokubah.file_rekap_dokubah.split('/').pop()}>{project.dokubah.file_rekap_dokubah.split('/').pop()}</span>
                        </div>
                      </div>
                      <Button variant='ghost' size='icon' className='h-7 w-7 text-indigo-600 hover:bg-indigo-100 bg-white border border-indigo-100 shadow-sm shrink-0' asChild>
                        <a 
                          href={project.dokubah.file_rekap_dokubah.startsWith('http') ? project.dokubah.file_rekap_dokubah : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('/api', '')}/storage/${project.dokubah.file_rekap_dokubah}`} 
                          target='_blank' 
                          rel='noopener noreferrer'
                        >
                          <Eye className='h-3.5 w-3.5' />
                        </a>
                      </Button>
                    </div>
                  )}

                  <Button 
                    variant='outline' 
                    size='sm' 
                    className='h-7 w-full text-[10px] border-blue-200 text-blue-600 hover:bg-blue-50 gap-1.5 bg-blue-50/30 font-bold mt-2'
                    onClick={openDokubahUpload}
                  >
                    <Upload className='h-3 w-3' />
                    Upload Dokubah
                  </Button>
               </div>
            </CardContent>
          )}
        </Card>

        {/* 5. Stok Material */}
        <Card className={`relative border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${isStokTerisi ? 'border-emerald-200 bg-white ring-1 ring-emerald-100' : 'border-neutral-200 bg-white'}`}>
          {isStokTerisi && (
            <div className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm z-10 animate-in zoom-in duration-300">
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            </div>
          )}
          <CardHeader className='pb-2 flex flex-row items-center justify-between gap-3 min-w-0'>
            <button className='flex items-center gap-3 flex-1 text-left min-w-0' onClick={() => setIsStokCollapsed(!isStokCollapsed)}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold shrink-0 ${isStokTerisi ? 'bg-emerald-100 text-emerald-600' : 'bg-neutral-100 text-neutral-500'}`}>5</div>
              <div className='flex-1 min-w-0'>
                <CardTitle className='text-sm text-neutral-800 font-bold truncate'>Stok Material</CardTitle>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wider font-semibold truncate'>Availability</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-neutral-400 shrink-0 transition-transform duration-200 ${isStokCollapsed ? '-rotate-90' : ''}`} />
            </button>
          </CardHeader>
          {!isStokCollapsed && (
            <CardContent className='pt-0'>
               <div className='space-y-2 border-t border-neutral-100 pt-2.5'>
                  <div className='h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden'>
                    <div className='h-full bg-emerald-500 transition-all duration-500' style={{ width: `${stokLengkapPercentage}%` }} />
                  </div>
                  <div className='space-y-1 text-[10px] font-bold'>
                    <div className='flex justify-between items-center text-emerald-600'>
                      <span>Lengkap: {stokLengkapCount}</span>
                      <span>{stokLengkapPercentage}%</span>
                    </div>
                    <div className='flex justify-between items-center text-red-500'>
                      <span>Belum Lengkap: {stokBelumLengkapCount}</span>
                      <span>{stokBelumLengkapPercentage}%</span>
                    </div>
                  </div>
               </div>
            </CardContent>
          )}
        </Card>

        {/* 6. Perintah Produksi */}
        <Card className={`relative border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${perintahProduksiCount === totalItems && totalItems > 0 ? 'border-blue-200 bg-white ring-1 ring-blue-100' : 'border-neutral-200 bg-white'}`}>
          {project?.order_produksi && project.order_produksi.length > 0 && (
            <div className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm z-10 animate-in zoom-in duration-300">
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            </div>
          )}
          <CardHeader className='pb-2 flex flex-row items-center justify-between gap-3 min-w-0'>
            <button className='flex items-center gap-3 flex-1 text-left min-w-0' onClick={() => setIsProduksiCollapsed(!isProduksiCollapsed)}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold shrink-0 ${perintahProduksiCount > 0 || (project?.order_produksi && project.order_produksi.length > 0) ? 'bg-blue-100 text-blue-600' : 'bg-neutral-100 text-neutral-500'}`}>6</div>
              <div className='flex-1 min-w-0'>
                <CardTitle className='text-sm text-neutral-800 font-bold truncate'>Perintah Produksi</CardTitle>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wider font-semibold truncate'>Production Orders</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-neutral-400 shrink-0 transition-transform duration-200 ${isProduksiCollapsed ? '-rotate-90' : ''}`} />
            </button>
          </CardHeader>
          {!isProduksiCollapsed && (
            <CardContent className='pt-0'>
               <div className='space-y-2 border-t border-neutral-100 pt-2.5'>
                  <div className='h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden'>
                    <div className='h-full bg-blue-600 transition-all duration-500' style={{ width: `${totalItems ? (perintahProduksiCount / totalItems) * 100 : 0}%` }} />
                  </div>
                  {project?.order_produksi && project.order_produksi.length > 0 && (
                    <div className='flex items-center gap-2 mb-1 p-2 bg-blue-50/80 rounded-md border border-blue-100 min-w-0'>
                      <FileText className='h-3.5 w-3.5 text-blue-600 shrink-0' />
                      <a 
                        href={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('/api', '')}/storage/${project.order_produksi[project.order_produksi.length - 1].file}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-[10px] text-blue-700 hover:underline font-medium truncate flex-1 min-w-0'
                        title={`Order_Produksi_${format(new Date(project.order_produksi[project.order_produksi.length - 1].created_at), 'ddMMyy')}.pdf`}
                      >
                        Order_Produksi_{format(new Date(project.order_produksi[project.order_produksi.length - 1].created_at), 'ddMMyy')}.pdf
                      </a>
                    </div>
                  )}

                  <Button 
                    variant='outline' 
                    size='sm' 
                    className='w-full h-7 text-[10px] text-blue-600 border-blue-200 hover:bg-blue-50 mt-1 gap-2 font-bold'
                    onClick={() => setIsOrderProduksiDialogOpen(true)}
                  >
                    <ClipboardList className='h-3.5 w-3.5' />
                    Order Produksi
                  </Button>
               </div>
            </CardContent>
          )}
        </Card>

        {/* 7. Gudang Barang Jadi */}
        <Card className={`relative border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${totalQtyMasuk >= totalQtyOrder && totalQtyOrder > 0 ? 'border-emerald-200 bg-white ring-1 ring-emerald-100' : 'border-neutral-200 bg-white'}`}>
          {totalQtyMasuk >= totalQtyOrder && totalQtyOrder > 0 && (
            <div className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm z-10 animate-in zoom-in duration-300">
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            </div>
          )}
          <CardHeader className='pb-2 flex flex-row items-center justify-between gap-3 min-w-0'>
            <button className='flex items-center gap-3 flex-1 text-left min-w-0' onClick={() => setIsBjCollapsed(!isBjCollapsed)}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold shrink-0 ${totalQtyMasuk > 0 ? (totalQtyMasuk >= totalQtyOrder ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600') : 'bg-neutral-100 text-neutral-500'}`}>7</div>
              <div className='flex-1 min-w-0'>
                <CardTitle className='text-sm text-neutral-800 font-bold truncate'>Gudang Barang Jadi</CardTitle>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wider font-semibold truncate'>Finished Goods</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-neutral-400 shrink-0 transition-transform duration-200 ${isBjCollapsed ? '-rotate-90' : ''}`} />
            </button>
          </CardHeader>
          {!isBjCollapsed && (
            <CardContent className='pt-0 space-y-4'>
               {/* Barang Masuk Progress */}
               <div className='space-y-1.5 border-t border-neutral-100 pt-2.5'>
                  <div className='flex justify-between items-center'>
                    <p className='text-[10px] font-bold text-neutral-500 uppercase tracking-wider'>Barang Masuk</p>
                    <p className={`text-[10px] font-bold ${totalQtyMasuk >= totalQtyOrder ? 'text-emerald-600' : 'text-blue-600'}`}>{Math.round(totalQtyOrder ? (totalQtyMasuk / totalQtyOrder) * 100 : 0)}%</p>
                  </div>
                  <div className='h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden'>
                    <div className={`h-full transition-all duration-500 ${totalQtyMasuk >= totalQtyOrder ? 'bg-emerald-600' : 'bg-blue-600'}`} style={{ width: `${totalQtyOrder ? (totalQtyMasuk / totalQtyOrder) * 100 : 0}%` }} />
                  </div>
                  <p className='text-[10px] font-bold text-neutral-600'>{totalQtyMasuk} / {totalQtyOrder} Items</p>
               </div>

             </CardContent>
          )}
        </Card>

        {/* 8. Pengiriman */}
        <Card className='border border-neutral-200/60 shadow-sm bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md'>
          <CardHeader className='pb-2 flex flex-row items-center justify-between gap-3 min-w-0'>
            <button className='flex items-center gap-3 flex-1 text-left min-w-0' onClick={() => setIsShipCollapsed(!isShipCollapsed)}>
              <div className='h-8 w-8 rounded-full flex items-center justify-center font-bold bg-neutral-100 text-neutral-500 shrink-0'>8</div>
              <div className='flex-1 min-w-0'>
                <CardTitle className='text-sm text-neutral-800 font-bold truncate'>Pengiriman</CardTitle>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wider font-semibold truncate'>Logistics</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-neutral-400 shrink-0 transition-transform duration-200 ${isShipCollapsed ? '-rotate-90' : ''}`} />
            </button>
          </CardHeader>
          {!isShipCollapsed && (
            <CardContent className='pt-0'>
              <div className='border-t border-neutral-100 pt-2.5 space-y-3'>
                {/* List pengiriman per SPK */}
                {pengirimanPerSpkData &&
                pengirimanPerSpkData.data.length > 0 ? (
                  <div className='space-y-1.5 pt-1 max-h-[180px] overflow-y-auto pr-1'>
                    {[...pengirimanPerSpkData.data]
                      .sort(
                        (a, b) =>
                          new Date(a.tanggal).getTime() -
                          new Date(b.tanggal).getTime()
                      )
                      .map((p) => {
                        const totalKeluar =
                          p.details?.reduce(
                            (s, d) => s + Number(d.jumlah_keluar),
                            0
                          ) ?? 0;
                        const totalTersetting =
                          p.details?.reduce(
                            (s, d) => s + Number(d.jumlah_tersetting),
                            0
                          ) ?? 0;
                        return (
                          <div
                            key={p.id}
                            className='p-2 rounded-md bg-violet-50/60 border border-violet-100 space-y-1'
                          >
                            <div className='flex items-center justify-between gap-1'>
                              <span className='text-[10px] font-bold text-violet-800 truncate'>
                                {format(new Date(p.tanggal), 'dd MMM yyyy')}
                              </span>
                            </div>
                            <div className='flex items-center gap-2 text-[9px] text-neutral-600 font-medium'>
                              {p.supir && (
                                <span className='truncate'>
                                  Supir: {p.supir}
                                </span>
                              )}
                            </div>
                            <div className='flex items-center gap-2 flex-wrap'>
                              {totalKeluar > 0 && (
                                <span className='text-[9px] font-bold bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded'>
                                  Keluar: {totalKeluar}
                                </span>
                              )}
                              {p.surat_jalan && (
                                <a
                                  href={`${(
                                    process.env.NEXT_PUBLIC_API_URL ||
                                    'http://localhost:8000'
                                  ).replace('/api', '')}/storage/${
                                    p.surat_jalan
                                  }`}
                                  target='_blank'
                                  rel='noreferrer'
                                  className='text-[9px] font-semibold text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded hover:bg-neutral-200 flex items-center gap-0.5'
                                >
                                  <Eye className='h-2.5 w-2.5' /> Lihat SJ
                                </a>
                              )}
                              {p.setrim && (
                                <a
                                  href={`${(
                                    process.env.NEXT_PUBLIC_API_URL ||
                                    'http://localhost:8000'
                                  ).replace('/api', '')}/storage/${p.setrim}`}
                                  target='_blank'
                                  rel='noreferrer'
                                  className='text-[9px] font-semibold text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded hover:bg-neutral-200 flex items-center gap-0.5'
                                >
                                  <Eye className='h-2.5 w-2.5' /> Lihat Setrim
                                </a>
                              )}
                              {totalTersetting > 0 && (
                                <span className='text-[9px] font-bold bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded'>
                                  Setting: {totalTersetting}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className='text-[10px] text-muted-foreground text-center py-2'>
                    Belum ada data pengiriman.
                  </p>
                )}

              </div>
            </CardContent>
          )}
        </Card>

        {/* 9. Barang Terkirim */}
        <Card className={`relative border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${totalQtyKeluar >= totalQtyOrder && totalQtyOrder > 0 ? 'border-emerald-200 bg-white ring-1 ring-emerald-100' : 'border-neutral-200 bg-white'}`}>
          {totalQtyKeluar >= totalQtyOrder && totalQtyOrder > 0 && (
            <div className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm z-10 animate-in zoom-in duration-300">
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            </div>
          )}
          <CardHeader className='pb-2 flex flex-row items-center justify-between gap-3 min-w-0'>
            <button className='flex items-center gap-3 flex-1 text-left min-w-0' onClick={() => setIsKeluarCollapsed(!isKeluarCollapsed)}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold shrink-0 ${totalQtyKeluar > 0 ? (totalQtyKeluar >= totalQtyOrder ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600') : 'bg-neutral-100 text-neutral-500'}`}>9</div>
              <div className='flex-1 min-w-0'>
                <CardTitle className='text-sm text-neutral-800 font-bold truncate'>Barang Terkirim</CardTitle>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wider font-semibold truncate'>Delivered Items</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-neutral-400 shrink-0 transition-transform duration-200 ${isKeluarCollapsed ? '-rotate-90' : ''}`} />
            </button>
          </CardHeader>
          {!isKeluarCollapsed && (
            <CardContent className='pt-0'>
               <div className='space-y-2 border-t border-neutral-100 pt-2.5'>
                  <div className='flex justify-between items-center'>
                    <p className='text-[10px] font-bold text-neutral-500 uppercase tracking-wider'>Terkirim</p>
                    <p className={`text-[10px] font-bold ${totalQtyKeluar >= totalQtyOrder ? 'text-emerald-600' : 'text-blue-600'}`}>{Math.round(totalQtyOrder ? (totalQtyKeluar / totalQtyOrder) * 100 : 0)}%</p>
                  </div>
                  <div className='h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden'>
                    <div className={`h-full transition-all duration-500 ${totalQtyKeluar >= totalQtyOrder ? 'bg-emerald-600' : 'bg-blue-600'}`} style={{ width: `${totalQtyOrder ? (totalQtyKeluar / totalQtyOrder) * 100 : 0}%` }} />
                  </div>
                  <p className='text-[10px] font-bold text-neutral-600'>{totalQtyKeluar} / {totalQtyOrder} Items</p>
               </div>
            </CardContent>
          )}
        </Card>

        {/* 10. Barang Terkirim Belum Tersetting */}
        <Card className={`relative border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${totalQtyBelumSetting > 0 ? 'border-amber-200 bg-white ring-1 ring-amber-100' : 'border-neutral-200 bg-white'}`}>
          <CardHeader className='pb-2 flex flex-row items-center justify-between gap-3 min-w-0'>
            <button className='flex items-center gap-3 flex-1 text-left min-w-0' onClick={() => setIsBelumSettingCollapsed(!isBelumSettingCollapsed)}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold shrink-0 ${totalQtyBelumSetting > 0 ? 'bg-amber-100 text-amber-600' : 'bg-neutral-100 text-neutral-500'}`}>10</div>
              <div className='flex-1 min-w-0'>
                <CardTitle className='text-sm text-neutral-800 font-bold truncate'>Belum Tersetting</CardTitle>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wider font-semibold truncate'>Pending Installation</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-neutral-400 shrink-0 transition-transform duration-200 ${isBelumSettingCollapsed ? '-rotate-90' : ''}`} />
            </button>
          </CardHeader>
          {!isBelumSettingCollapsed && (
            <CardContent className='pt-0'>
               <div className='space-y-2 border-t border-neutral-100 pt-2.5'>
                  <div className='flex justify-between items-center'>
                    <p className='text-[10px] font-bold text-neutral-500 uppercase tracking-wider'>Outstanding</p>
                    <p className='text-[10px] font-bold text-amber-600'>{totalQtyBelumSetting} Items</p>
                  </div>
                  <div className='h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden'>
                    <div className='h-full bg-amber-500 transition-all duration-500' style={{ width: `${totalQtyKeluar ? (totalQtyBelumSetting / totalQtyKeluar) * 100 : 0}%` }} />
                  </div>
               </div>
            </CardContent>
          )}
        </Card>

        {/* 11. Barang Sudah Tersetting */}
        <Card className={`relative border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${totalQtySetting >= totalQtyOrder && totalQtyOrder > 0 ? 'border-emerald-200 bg-white ring-1 ring-emerald-100' : 'border-neutral-200 bg-white'}`}>
          {totalQtySetting >= totalQtyOrder && totalQtyOrder > 0 && (
            <div className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm z-10 animate-in zoom-in duration-300">
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            </div>
          )}
          <CardHeader className='pb-2 flex flex-row items-center justify-between gap-3 min-w-0'>
            <button className='flex items-center gap-3 flex-1 text-left min-w-0' onClick={() => setIsSettingCollapsed(!isSettingCollapsed)}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold shrink-0 ${totalQtySetting > 0 ? (totalQtySetting >= totalQtyOrder ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600') : 'bg-neutral-100 text-neutral-500'}`}>11</div>
              <div className='flex-1 min-w-0'>
                <CardTitle className='text-sm text-neutral-800 font-bold truncate'>Barang Tersetting</CardTitle>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wider font-semibold truncate'>Installed Items</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-neutral-400 shrink-0 transition-transform duration-200 ${isSettingCollapsed ? '-rotate-90' : ''}`} />
            </button>
          </CardHeader>
          {!isSettingCollapsed && (
            <CardContent className='pt-0'>
               <div className='space-y-2 border-t border-neutral-100 pt-2.5'>
                  <div className='flex justify-between items-center'>
                    <p className='text-[10px] font-bold text-neutral-500 uppercase tracking-wider'>Tersetting</p>
                    <p className={`text-[10px] font-bold ${totalQtySetting >= totalQtyOrder ? 'text-emerald-600' : 'text-blue-600'}`}>{Math.round(totalQtyOrder ? (totalQtySetting / totalQtyOrder) * 100 : 0)}%</p>
                  </div>
                  <div className='h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden'>
                    <div className={`h-full transition-all duration-500 ${totalQtySetting >= totalQtyOrder ? 'bg-emerald-600' : 'bg-blue-600'}`} style={{ width: `${totalQtyOrder ? (totalQtySetting / totalQtyOrder) * 100 : 0}%` }} />
                  </div>
                  <p className='text-[10px] font-bold text-neutral-600'>{totalQtySetting} / {totalQtyOrder} Items</p>
               </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Items Table Section */}
      <div className='space-y-4 pt-4 border-t'>
        <div className='flex justify-between items-center gap-4'>
          <h2 className='text-lg font-bold flex items-center gap-2 text-neutral-800 shrink-0'>
            <ListChecks className='h-5 w-5 text-neutral-400' />
            Project Items List
            <Badge variant='outline' className='ml-2 bg-neutral-50 text-neutral-600 border-neutral-200'>{totalItems} Items</Badge>
          </h2>
          
          <div className='flex items-center gap-3'>
            {selectedItemIds.length > 0 && (
              <div className='flex items-center gap-3 pr-2 border-r border-neutral-200'>
                <span className='text-xs text-muted-foreground font-medium'>{selectedItemIds.length} item dipilih</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      size='sm' 
                      variant='outline' 
                      className='h-8 bg-white'
                      disabled={bulkUpdateItemDivisiMutation.isPending}
                    >
                      {bulkUpdateItemDivisiMutation.isPending ? (
                        <Loader2 className='h-3.5 w-3.5 mr-2 animate-spin' />
                      ) : (
                        <Building2 className='h-3.5 w-3.5 mr-2' />
                      )}
                      Set PO Divisi Massal
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-[200px] p-0' align='end'>
                    <Command>
                      <CommandInput placeholder='Cari divisi...' />
                      <CommandList>
                        <CommandEmpty>No divisi found.</CommandEmpty>
                        <CommandGroup>
                          {divisions?.map((divisi) => (
                            <CommandItem
                              key={divisi.id}
                              onSelect={() => {
                                bulkUpdateItemDivisiMutation.mutate(divisi.id);
                              }}
                            >
                              <Building2 className='h-4 w-4 mr-2 text-muted-foreground' />
                              {divisi.nama}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                <Button 
                  size='sm' 
                  variant='outline' 
                  className='h-8 bg-white'
                  disabled={bulkUpdateStokMutation.isPending}
                  onClick={openBulkStokDialog}
                >
                  {bulkUpdateStokMutation.isPending ? (
                    <Loader2 className='h-3.5 w-3.5 mr-2 animate-spin' />
                  ) : (
                    <Activity className='h-3.5 w-3.5 mr-2' />
                  )}
                  Set Stok Massal
                </Button>
              </div>
            )}
            <div className='relative w-64'>
              <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 pointer-events-none' />
              <Input
                placeholder='Cari item, lantai, ruang...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-8 h-8 text-xs'
              />
            </div>
          </div>
        </div>

        <div className='rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm'>
          <Table containerClassName="max-h-[600px] overflow-auto">
            <TableHeader className='bg-neutral-50/80 sticky top-0 z-10 shadow-sm shadow-neutral-200/50'>
              <TableRow className='hover:bg-transparent'>
                <TableHead className='w-[40px] text-[10px] uppercase font-bold text-neutral-500'>#</TableHead>
                <TableHead className='w-[40px] text-center'>
                  <Checkbox
                    checked={filteredItems.length > 0 && selectedItemIds.length === filteredItems.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedItemIds(filteredItems.map((i) => i.id));
                      } else {
                        setSelectedItemIds([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead className='text-[10px] uppercase font-bold text-neutral-500'>Lantai | Ruang</TableHead>
                <TableHead className='text-[10px] uppercase font-bold text-neutral-500'>Nama Item</TableHead>
                <TableHead className='text-[10px] uppercase font-bold text-neutral-500'>Vol | Dim</TableHead>
                <TableHead className='text-[10px] uppercase font-bold text-neutral-500'>Qty</TableHead>
                <TableHead className='text-[10px] uppercase font-bold text-neutral-500'>PO Divisi</TableHead>
                <TableHead className='text-[10px] uppercase font-bold text-neutral-500'>Gk MDL</TableHead>
                <TableHead className='text-[10px] uppercase font-bold text-neutral-500'>GK Custom</TableHead>
                <TableHead className='text-[10px] uppercase font-bold text-neutral-500'>Material</TableHead>
                <TableHead className='text-[10px] uppercase font-bold text-neutral-500'>Produksi</TableHead>
                <TableHead className='text-[10px] uppercase font-bold text-neutral-500'>
                  <div className='flex flex-col'>
                    <span>Barang</span>
                    <span>Jadi</span>
                  </div>
                </TableHead>
                <TableHead className='text-[10px] uppercase font-bold text-neutral-500'>
                  <div className='flex flex-col'>
                    <span>Barang</span>
                    <span>Terkirim</span>
                  </div>
                </TableHead>
                <TableHead className='text-[10px] uppercase font-bold text-neutral-500'>
                  <div className='flex flex-col'>
                    <span>Barang</span>
                    <span>Tersetting</span>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingItems ? (
                <TableRow>
                  <TableCell
                    colSpan={15}
                    className='h-32 text-center text-muted-foreground'
                  >
                    <Loader2 className='h-6 w-6 animate-spin mx-auto' />
                  </TableCell>
                </TableRow>
              ) : items?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={15}
                    className='h-32 text-center text-muted-foreground'
                  >
                    No items recorded for this project.
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item, index) => (
                  <TableRow
                    key={item.id}
                    className='hover:bg-neutral-50/50 transition-colors group'
                  >
                    <TableCell className='text-[10px] text-muted-foreground font-medium'>
                      {index + 1}
                    </TableCell>
                    <TableCell className='text-center'>
                      <Checkbox
                        checked={selectedItemIds.includes(item.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedItemIds((prev) => [...prev, item.id]);
                          } else {
                            setSelectedItemIds((prev) =>
                              prev.filter((id) => id !== item.id)
                            );
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-col gap-0.5'>
                        <span className='text-xs font-bold text-neutral-800'>{item.lantai || '-'}</span>
                        <span className='text-[9px] text-muted-foreground truncate max-w-[120px]'>{item.ruang || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.keterangan ? (
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className='flex flex-col gap-0.5 cursor-help'>
                                <span className='text-xs font-bold text-neutral-900 group-hover:text-blue-600 transition-colors'>{item.item}</span>
                                 <span className='text-[14px] text-muted-foreground truncate max-w-[200px]'>{item.keterangan || '-'}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[300px] break-words">
                              <p className="text-xs">{item.keterangan}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <div className='flex flex-col gap-0.5'>
                          <span className='text-xs font-bold text-neutral-900 group-hover:text-blue-600 transition-colors'>{item.item}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className={cn(item.history_fields?.some(f => ['volume', 'panjang', 'lebar', 'tinggi', 'satuan'].includes(f)) ? 'bg-amber-100/80 border-x border-amber-200/50 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.05)]' : '')}>
                      <div className='flex flex-col gap-0.5 group relative'>
                        <div className='flex items-center gap-1.5'>
                          <span className='font-bold text-blue-600 text-xs'>
                            {item.volume || '-'}
                          </span>
                          <div className='flex items-center opacity-0 group-hover:opacity-100 transition-opacity'>
                             <Button 
                                variant='ghost' 
                                size='icon' 
                                className='h-5 w-5 text-neutral-400 hover:text-blue-600'
                                onClick={() => openDimDialog(item)}
                              >
                                <Pencil className='h-3 w-3' />
                             </Button>
                             <Button 
                                variant='ghost' 
                                size='icon' 
                                className='h-5 w-5 text-neutral-400 hover:text-amber-600'
                                onClick={() => openHistory(item)}
                              >
                                <History className='h-3 w-3' />
                             </Button>
                          </div>
                        </div>
                        <span className='text-xs text-muted-foreground'>
                          {item.panjang || '-'}x{item.lebar || '-'}x
                          {item.tinggi || '-'} {item.satuan}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className={cn(item.history_fields?.includes('jumlah') ? 'bg-amber-100/80 border-x border-amber-200/50' : '') + ' font-bold text-sm text-neutral-800'}>{item.jumlah}</TableCell>
                    <TableCell className={cn(item.history_fields?.includes('divisi_id') ? 'bg-amber-100/80 border-x border-amber-200/50' : '')}>
                      <div className='flex items-center gap-2 group/divisi relative'>
                        {item.divisi && editingDivisiItemId !== item.id ? (
                          <Badge
                            variant='outline'
                            className='bg-emerald-50 text-emerald-700 border-emerald-100 font-bold text-[9px] px-1.5 h-5 cursor-pointer hover:bg-emerald-100 transition-colors'
                            onClick={() => setEditingDivisiItemId(item.id)}
                          >
                            {item.divisi.nama}
                          </Badge>
                        ) : (
                          <div className='flex items-center gap-1'>
                            <Popover open={openDivisiPopover === item.id} onOpenChange={(open) => setOpenDivisiPopover(open ? item.id : null)}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="h-6 text-[9px] w-[110px] bg-white border-neutral-200 justify-between px-2"
                                >
                                  <span className="truncate">
                                    {item.divisi_id
                                      ? divisions?.find((d) => d.id === item.divisi_id)?.nama
                                      : "Pilih Divisi..."}
                                  </span>
                                  <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[180px] p-0" align="start">
                                <Command>
                                  <CommandInput placeholder="Cari divisi..." className="text-xs" />
                                  <CommandList>
                                    <CommandEmpty className="text-xs p-2 text-center text-muted-foreground">No divisi found.</CommandEmpty>
                                    <CommandGroup>
                                      {divisions
                                        ? [...divisions]
                                            .sort((a, b) => a.nama.localeCompare(b.nama))
                                            .map((d) => (
                                              <CommandItem
                                                key={d.id}
                                                value={d.nama}
                                                className="text-xs"
                                                onSelect={() => {
                                                  updateItemDivisiMutation.mutate({
                                                    itemId: item.id,
                                                    divisiId: d.id,
                                                  });
                                                  setOpenDivisiPopover(null);
                                                }}
                                              >
                                                <Check
                                                  className={cn(
                                                    "mr-2 h-3 w-3",
                                                    item.divisi_id === d.id ? "opacity-100" : "opacity-0"
                                                  )}
                                                />
                                                {d.nama}
                                              </CommandItem>
                                            ))
                                        : null}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>
                        )}
                        <Button 
                          variant='ghost' 
                          size='icon' 
                          className='h-5 w-5 text-neutral-400 hover:text-amber-600 opacity-0 group-hover/divisi:opacity-100 transition-opacity'
                          onClick={() => openHistory(item)}
                        >
                          <History className='h-3 w-3' />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.mdl_item?.link_gambar_kerja ? (
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-6 w-6 text-blue-600 hover:bg-blue-50'
                          asChild
                        >
                          <a
                            href={item.mdl_item.link_gambar_kerja}
                            target='_blank'
                            rel='noopener noreferrer'
                          >
                            <Eye className='h-3.5 w-3.5' />
                          </a>
                        </Button>
                      ) : (
                        <span className='text-[10px] text-muted-foreground italic'>-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.gambar_kerja?.file ? (
                        <div className='flex items-center gap-1'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-6 w-6 text-blue-600 hover:bg-blue-50'
                            asChild
                          >
                            <a
                              href={item.gambar_kerja.file.startsWith('http') || item.gambar_kerja.file.startsWith('www')
                                ? item.gambar_kerja.file
                                : `${(
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
                        <div className='flex items-center gap-2'>
                          <span className='text-[10px] text-muted-foreground italic'>-</span>
                        </div>
                      )}
                    </TableCell>


                    <TableCell>
                      <div
                        className='cursor-pointer p-1 rounded transition-colors flex flex-col gap-0.5'
                        onClick={() => openStokDialog(item)}
                      >
                        {item.bahan_baku ? (
                          <Badge
                            variant='outline'
                            className={`font-bold text-[9px] h-5 px-1.5 ${
                              item.bahan_baku.ketersediaan_stok === 'Tersedia' ||
                              item.bahan_baku.ketersediaan_stok === 'Lengkap'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                                : item.bahan_baku.ketersediaan_stok === 'Belum Tersedia' ||
                                  item.bahan_baku.ketersediaan_stok === 'Belum Lengkap'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {item.bahan_baku.ketersediaan_stok}
                          </Badge>
                        ) : (
                          <span className='text-[9px] text-muted-foreground italic hover:text-blue-600 transition-colors'>
                            Set Stok
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div 
                        className="flex items-center gap-2 min-w-[120px] cursor-pointer group hover:bg-blue-50 p-1.5 -ml-1.5 rounded-md transition-colors" 
                        onClick={() => openProduksiView(item)}
                      >
                        <span className="text-xs font-bold text-neutral-700 w-8 text-right group-hover:text-blue-700 transition-colors">{Math.round(item.produksi?.is_supplier ? Number(item.barang_supplier?.persen) || 0 : Number(item.produksi?.persen) || 0)}%</span>
                        <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden group-hover:bg-blue-100 transition-colors">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${item.produksi?.is_supplier ? Number(item.barang_supplier?.persen) || 0 : Number(item.produksi?.persen) || 0}%` }} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className='cursor-pointer p-1 rounded transition-colors flex flex-col gap-0.5'
                        onClick={() => openBjDialog(item)}
                      >
                        {item.barang_jadi_masuk &&
                        item.barang_jadi_masuk.length > 0 ? (
                          <Badge className='bg-blue-600 text-white border-none font-bold text-[10px] h-5 px-1.5 shadow-sm'>
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
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const total =
                          item.detail_pengiriman?.reduce(
                            (sum, d) => sum + Number(d.jumlah_keluar),
                            0
                          ) ?? 0;
                        return total > 0 ? (
                          <Badge className='bg-teal-600 text-white border-none font-bold text-[10px] h-5 px-1.5 shadow-sm'>
                            {total} / {item.jumlah}
                          </Badge>
                        ) : (
                          <span className='text-[9px] text-muted-foreground italic'>
                            -
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const total =
                          item.detail_pengiriman?.reduce(
                            (sum, d) => sum + Number(d.jumlah_tersetting),
                            0
                          ) ?? 0;
                        return total > 0 ? (
                          <Badge className='bg-violet-600 text-white border-none font-bold text-[10px] h-5 px-1.5 shadow-sm'>
                            {total} / {item.jumlah}
                          </Badge>
                        ) : (
                          <span className='text-[9px] text-muted-foreground italic'>
                            -
                          </span>
                        );
                      })()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Gambar Kerja Upload Dialog */}
      <AlertDialog open={isGkDialogOpen} onOpenChange={setIsGkDialogOpen}>
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <ImageIcon className='h-5 w-5 text-orange-500' />
              Upload Gambar Kerja
            </AlertDialogTitle>
            <AlertDialogDescription>
              Upload technical drawing for item: <strong>{gkItem?.item}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='gk-file'>File Gambar (PDF/JPG/PNG)</Label>
              <Input
                id='gk-file'
                type='file'
                onChange={(e) => setGkFile(e.target.files?.[0] || null)}
                className='text-xs'
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='gk-start'>Mulai</Label>
                <Input
                  id='gk-start'
                  type='date'
                  value={gkStart}
                  onChange={(e) => setGkStart(e.target.value)}
                  className='text-xs'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='gk-end'>Selesai</Label>
                <Input
                  id='gk-end'
                  type='date'
                  value={gkEnd}
                  onChange={(e) => setGkEnd(e.target.value)}
                  className='text-xs'
                />
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsGkDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <Button
              className='bg-orange-600 hover:bg-orange-700'
              onClick={handleGkUpload}
              disabled={uploadGkMutation.isPending}
            >
              {uploadGkMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <CheckCircle2 className='mr-2 h-4 w-4' />
              )}
              Save Gambar Kerja
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dokubah Upload Dialog */}
      <AlertDialog
        open={isDokubahDialogOpen}
        onOpenChange={setIsDokubahDialogOpen}
      >
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <FileText className='h-5 w-5 text-blue-500' />
              Upload Dokubah
            </AlertDialogTitle>
            <AlertDialogDescription>
              Upload changes document for this project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='dokubah-file'>Link Dokubah</Label>
              <Input
                id='dokubah-file'
                type='text'
                placeholder='Masukkan link google drive...'
                value={typeof dokubahFile === 'string' ? dokubahFile : ''}
                onChange={(e) => setDokubahFile(e.target.value)}
                className='text-xs'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='rekap-dokubah-file'>Link Rekap Dokubah</Label>
              <Input
                id='rekap-dokubah-file'
                type='text'
                placeholder='Masukkan link rekap dokubah...'
                value={typeof dokubahRekapFile === 'string' ? dokubahRekapFile : ''}
                onChange={(e) => setDokubahRekapFile(e.target.value)}
                className='text-xs'
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='dokubah-start'>Mulai</Label>
                <Input
                  id='dokubah-start'
                  type='date'
                  value={dokubahStart}
                  onChange={(e) => setDokubahStart(e.target.value)}
                  className='text-xs'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='dokubah-end'>Selesai</Label>
                <Input
                  id='dokubah-end'
                  type='date'
                  value={dokubahEnd}
                  onChange={(e) => setDokubahEnd(e.target.value)}
                  className='text-xs'
                />
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDokubahDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <Button
              className='bg-blue-600 hover:bg-blue-700'
              onClick={handleDokubahUpload}
              disabled={uploadDokubahMutation.isPending}
            >
              {uploadDokubahMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <CheckCircle2 className='mr-2 h-4 w-4' />
              )}
              Save Dokubah
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stok Material Dialog */}
      <AlertDialog open={isStokDialogOpen} onOpenChange={setIsStokDialogOpen}>
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <Activity className='h-5 w-5 text-emerald-500' />
              Update Stok Material
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ketersediaan stok untuk item: <strong>{stokItem?.item}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='space-y-2'>
              <Label>Ketersediaan Stok</Label>
              <div className='flex p-1 bg-neutral-100 rounded-lg border border-neutral-200'>
                {[
                  { value: 'Belum Lengkap', label: 'Belum Lengkap', color: 'bg-red-500' },
                  { value: 'Lengkap', label: 'Lengkap', color: 'bg-emerald-500' }
                ].map((option) => (
                  <button
                    key={option.value}
                    type='button'
                    onClick={() => setStokStatus(option.value)}
                    className={cn(
                      'flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all duration-200',
                      stokStatus === option.value
                        ? `${option.color} text-white shadow-sm`
                        : 'text-neutral-500 hover:text-neutral-700 hover:bg-white/50'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            {stokStatus === 'Belum Lengkap' && (
              <div className='space-y-2'>
                <Label htmlFor='deskripsi_belum_lengkap'>Deskripsi Bahan Belum Lengkap</Label>
                <Textarea
                  id='deskripsi_belum_lengkap'
                  placeholder='Masukkan deskripsi jika bahan belum lengkap...'
                  value={stokDeskripsiBelumLengkap}
                  onChange={(e) => setStokDeskripsiBelumLengkap(e.target.value)}
                  className='text-xs resize-none'
                  rows={3}
                />
              </div>
            )}
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Tgl Menerima Dokubah</Label>
                <Input
                  type='date'
                  value={stokMenerima}
                  onChange={(e) => setStokMenerima(e.target.value)}
                  className='text-xs'
                />
              </div>
              <div className='space-y-2'>
                <Label>Tgl Keluar</Label>
                <Input
                  type='date'
                  value={stokKeluar}
                  onChange={(e) => setStokKeluar(e.target.value)}
                  className='text-xs'
                />
              </div>
            </div>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label>PIC</Label>
                <Button 
                  variant='ghost' 
                  size='sm' 
                  className='h-6 text-[9px] text-blue-600 gap-1 px-1.5'
                  onClick={() => {
                    setIsManualPic(!isManualPic);
                    setStokPicId('');
                  }}
                >
                  {isManualPic ? (
                    'Back to List'
                  ) : (
                    <>
                      <Plus className='h-2.5 w-2.5' />
                      Input Manual
                    </>
                  )}
                </Button>
              </div>
              
              {!isManualPic ? (
                <Popover open={stokPicOpen} onOpenChange={setStokPicOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={stokPicOpen}
                      className="w-full justify-between text-xs font-normal h-9"
                    >
                      {stokPicId
                        ? pics?.find((p) => p.id.toString() === stokPicId)?.nama
                        : "Pilih PIC..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command className="w-full">
                      <CommandInput placeholder="Cari PIC..." className="h-8" />
                      <CommandList>
                        <CommandEmpty>PIC tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          {pics?.map((p) => (
                            <CommandItem
                              key={p.id}
                              value={p.nama}
                              onSelect={() => {
                                setStokPicId(p.id.toString());
                                setStokPicOpen(false);
                              }}
                              className="text-xs"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  stokPicId === p.id.toString() ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {p.nama} ({p.jabatan})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : (
                <div className='grid grid-cols-2 gap-2'>
                  <Input 
                    placeholder='Nama PIC...'
                    value={newPicName}
                    onChange={(e) => setNewPicName(e.target.value)}
                    className='text-xs h-9'
                  />
                  <Input 
                    placeholder='Jabatan...'
                    value={newPicJabatan}
                    onChange={(e) => setNewPicJabatan(e.target.value)}
                    className='text-xs h-9'
                  />
                </div>
              )}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsStokDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <Button
              className='bg-emerald-600 hover:bg-emerald-700'
              onClick={handleStokUpdate}
              disabled={updateStokMutation.isPending}
            >
              {updateStokMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <CheckCircle2 className='mr-2 h-4 w-4' />
              )}
              Update Stok
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stok Material Massal Dialog */}
      <AlertDialog open={isBulkStokDialogOpen} onOpenChange={setIsBulkStokDialogOpen}>
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <Activity className='h-5 w-5 text-emerald-500' />
              Update Stok Material Massal
            </AlertDialogTitle>
            <AlertDialogDescription>
              Update ketersediaan stok untuk <strong>{selectedItemIds.length}</strong> item terpilih.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='space-y-2'>
              <Label>Ketersediaan Stok</Label>
              <div className='flex p-1 bg-neutral-100 rounded-lg border border-neutral-200'>
                {[
                  { value: 'Belum Lengkap', label: 'Belum Lengkap', color: 'bg-red-500' },
                  { value: 'Lengkap', label: 'Lengkap', color: 'bg-emerald-500' }
                ].map((option) => (
                  <button
                    key={option.value}
                    type='button'
                    onClick={() => setStokStatus(option.value)}
                    className={cn(
                      'flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all duration-200',
                      stokStatus === option.value
                        ? `${option.color} text-white shadow-sm`
                        : 'text-neutral-500 hover:text-neutral-700 hover:bg-white/50'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            {stokStatus === 'Belum Lengkap' && (
              <div className='space-y-2'>
                <Label htmlFor='bulk_deskripsi_belum_lengkap'>Deskripsi Bahan Belum Lengkap</Label>
                <Textarea
                  id='bulk_deskripsi_belum_lengkap'
                  placeholder='Masukkan deskripsi jika bahan belum lengkap...'
                  value={stokDeskripsiBelumLengkap}
                  onChange={(e) => setStokDeskripsiBelumLengkap(e.target.value)}
                  className='text-xs resize-none'
                  rows={3}
                />
              </div>
            )}
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Tgl Menerima Dokubah</Label>
                <Input
                  type='date'
                  value={stokMenerima}
                  onChange={(e) => setStokMenerima(e.target.value)}
                  className='text-xs'
                />
              </div>
              <div className='space-y-2'>
                <Label>Tgl Keluar</Label>
                <Input
                  type='date'
                  value={stokKeluar}
                  onChange={(e) => setStokKeluar(e.target.value)}
                  className='text-xs'
                />
              </div>
            </div>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label>PIC</Label>
                <Button 
                  variant='ghost' 
                  size='sm' 
                  className='h-6 text-[9px] text-blue-600 gap-1 px-1.5'
                  onClick={() => {
                    setIsManualPic(!isManualPic);
                    setStokPicId('');
                  }}
                >
                  {isManualPic ? (
                    'Back to List'
                  ) : (
                    <>
                      <Plus className='h-2.5 w-2.5' />
                      Input Manual
                    </>
                  )}
                </Button>
              </div>
              
              {!isManualPic ? (
                <Popover open={stokPicOpen} onOpenChange={setStokPicOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={stokPicOpen}
                      className="w-full justify-between text-xs font-normal h-9"
                    >
                      {stokPicId
                        ? pics?.find((p) => p.id.toString() === stokPicId)?.nama
                        : "Pilih PIC..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command className="w-full">
                      <CommandInput placeholder="Cari PIC..." className="h-8" />
                      <CommandList>
                        <CommandEmpty>PIC tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          {pics?.map((p) => (
                            <CommandItem
                              key={p.id}
                              value={p.nama}
                              onSelect={() => {
                                setStokPicId(p.id.toString());
                                setStokPicOpen(false);
                              }}
                              className="text-xs"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  stokPicId === p.id.toString() ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {p.nama} ({p.jabatan})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : (
                <div className='grid grid-cols-2 gap-2'>
                  <Input 
                    placeholder='Nama PIC...'
                    value={newPicName}
                    onChange={(e) => setNewPicName(e.target.value)}
                    className='text-xs h-9'
                  />
                  <Input 
                    placeholder='Jabatan...'
                    value={newPicJabatan}
                    onChange={(e) => setNewPicJabatan(e.target.value)}
                    className='text-xs h-9'
                  />
                </div>
              )}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsBulkStokDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <Button
              className='bg-emerald-600 hover:bg-emerald-700'
              onClick={handleBulkStokUpdate}
              disabled={bulkUpdateStokMutation.isPending}
            >
              {bulkUpdateStokMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <CheckCircle2 className='mr-2 h-4 w-4' />
              )}
              Update Stok Massal
            </Button>
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
              className='bg-blue-600 hover:bg-blue-700'
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

      {/* Barang Jadi Terpacking Dialog */}
      <AlertDialog
        open={isPackingDialogOpen}
        onOpenChange={setIsPackingDialogOpen}
      >
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <Package className='h-5 w-5 text-orange-500' />
              Record Packing
            </AlertDialogTitle>
            <AlertDialogDescription>
              Catat jumlah barang yang sudah dipacking untuk item:{' '}
              <strong>{packingItem?.item}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='grid gap-4 py-4'>
            {packingItem &&
              packingItem.barang_jadi_terpacking &&
              packingItem.barang_jadi_terpacking.length > 0 && (
                <div className='p-3 bg-orange-50 rounded-lg border border-orange-100'>
                  <Label className='text-[10px] uppercase text-orange-700 font-bold mb-2 block'>
                    Riwayat Packing Sebelumnya
                  </Label>
                  <div className='space-y-2'>
                    {packingItem.barang_jadi_terpacking.map((record, i) => (
                      <div
                        key={i}
                        className='flex justify-between text-xs border-b border-orange-100 last:border-0 pb-1 last:pb-0'
                      >
                        <span className='text-orange-600'>
                          {format(new Date(record.tanggal), 'dd MMM yyyy')}
                        </span>
                        <span className='font-bold text-orange-600'>
                          +{record.jumlah}
                        </span>
                      </div>
                    ))}
                    <div className='flex justify-between text-xs pt-1 font-bold border-t border-orange-200'>
                      <span>Total Saat Ini</span>
                      <span className='text-orange-900'>
                        {packingItem.barang_jadi_terpacking.reduce(
                          (sum, r) => sum + r.jumlah,
                          0
                        )}{' '}
                        / {packingItem.jumlah}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            <div className='space-y-2'>
              <Label>Tanggal Packing</Label>
              <Input
                type='date'
                value={packingTanggal}
                onChange={(e) => setPackingTanggal(e.target.value)}
                className='text-xs'
              />
            </div>
            <div className='space-y-2'>
              <Label>Jumlah Packing Baru</Label>
              <div className='flex items-center gap-4'>
                <Input
                  type='number'
                  value={packingJumlah === 0 ? '' : packingJumlah}
                  onChange={(e) => setPackingJumlah(parseInt(e.target.value) || 0)}
                  className='font-bold border-orange-200 focus-visible:ring-orange-500'
                  max={
                    packingItem
                      ? packingItem.jumlah -
                        (packingItem.barang_jadi_terpacking?.reduce(
                          (sum, p) => sum + p.jumlah,
                          0
                        ) || 0)
                      : undefined
                  }
                />
                <span className='text-sm text-muted-foreground whitespace-nowrap'>
                  Sisa:{' '}
                  {(packingItem?.jumlah || 0) -
                    (packingItem?.barang_jadi_terpacking?.reduce(
                      (sum, p) => sum + p.jumlah,
                      0
                    ) || 0)}
                </span>
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsPackingDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <Button
              className='bg-orange-600 hover:bg-orange-700 text-white'
              onClick={handlePackingUpdate}
              disabled={
                updatePackingMutation.isPending ||
                packingJumlah < 1 ||
                packingJumlah >
                  (packingItem?.jumlah || 0) -
                    (packingItem?.barang_jadi_terpacking?.reduce(
                      (sum, p) => sum + p.jumlah,
                      0
                    ) || 0)
              }
            >
              {updatePackingMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <CheckCircle2 className='mr-2 h-4 w-4' />
              )}
              Record Packing
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Order Gambar Kerja Dialog */}
      <AlertDialog open={isOrderGkDialogOpen} onOpenChange={setIsOrderGkDialogOpen}>
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <ImageIcon className='h-5 w-5 text-orange-500' />
              Order Gambar Kerja
            </AlertDialogTitle>
            <AlertDialogDescription>
              Upload file brief desain dan tentukan target penyelesaian untuk project ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='grid gap-4 py-4'>
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 bg-neutral-50/50">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-neutral-800">Metode Order</Label>
                <p className="text-[10px] text-muted-foreground">
                  {pakaiGambar ? 'Menggunakan file brief/desain' : 'Tanpa melampirkan berkas gambar'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("text-[10px] font-bold transition-colors", !pakaiGambar ? "text-orange-600" : "text-neutral-400")}>Tanpa Gambar</span>
                <Switch
                  checked={pakaiGambar}
                  onCheckedChange={setPakaiGambar}
                />
                <span className={cn("text-[10px] font-bold transition-colors", pakaiGambar ? "text-orange-600" : "text-neutral-400")}>Pakai Gambar</span>
              </div>
            </div>

            {pakaiGambar && (
              <>
                <div className='space-y-2 animate-in fade-in slide-in-from-top-1 duration-200'>
                  <Label>File Brief / Lampiran</Label>
                  <Input
                    type='file'
                    onChange={(e) => setOrderGkFile(e.target.files?.[0] || null)}
                    className='text-xs'
                  />
                  <p className='text-[10px] text-muted-foreground'>Format: PDF, JPG, PNG, DOC, XLS (Max 10MB)</p>
                </div>
                <div className='space-y-2 animate-in fade-in slide-in-from-top-1 duration-200'>
                  <Label>Target Selesai</Label>
                  <Input
                    type='date'
                    value={orderGkTarget}
                    onChange={(e) => setOrderGkTarget(e.target.value)}
                    className='text-xs'
                  />
                </div>
              </>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsOrderGkDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <Button
              className='bg-orange-600 hover:bg-orange-700'
              onClick={handleOrderGkUpload}
              disabled={uploadOrderGkMutation.isPending || (pakaiGambar && (!orderGkFile || !orderGkTarget))}
            >
              {uploadOrderGkMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Upload className='mr-2 h-4 w-4' />
              )}
              Submit Order
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Order Produksi Dialog */}
      <AlertDialog open={isOrderProduksiDialogOpen} onOpenChange={setIsOrderProduksiDialogOpen}>
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <ClipboardList className='h-5 w-5 text-blue-500' />
              Order Produksi
            </AlertDialogTitle>
            <AlertDialogDescription>
              Upload file order produksi dan tentukan target penyelesaian untuk project ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='space-y-2'>
              <Label>File Order / Lampiran</Label>
              <Input
                type='file'
                onChange={(e) => setOrderProduksiFile(e.target.files?.[0] || null)}
                className='text-xs'
              />
              <p className='text-[10px] text-muted-foreground'>Format: PDF, JPG, PNG, DOC, XLS (Max 10MB)</p>
            </div>
            <div className='space-y-2'>
              <Label>Target Selesai</Label>
              <Input
                type='date'
                value={orderProduksiTarget}
                onChange={(e) => setOrderProduksiTarget(e.target.value)}
                className='text-xs'
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsOrderProduksiDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <Button
              className='bg-blue-600 hover:bg-blue-700'
              onClick={handleOrderProduksiUpload}
              disabled={uploadOrderProduksiMutation.isPending || !orderProduksiFile || !orderProduksiTarget}
            >
              {uploadOrderProduksiMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Upload className='mr-2 h-4 w-4' />
              )}
              Submit Order
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Produksi Progress Dialog (PPIC View-Only) */}
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

      {/* Edit Dimensi Dialog */}
      <AlertDialog open={isDimDialogOpen} onOpenChange={setIsDimDialogOpen}>
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <Pencil className='h-5 w-5 text-blue-500' />
              Edit Volume & Dimensi
            </AlertDialogTitle>
            <AlertDialogDescription>
              Update dimensi untuk item: <strong>{dimItem?.item}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 gap-3'>
              <div className='space-y-2'>
                <Label>Panjang</Label>
                <Input
                  type='number'
                  value={dimData.panjang}
                  onChange={(e) => setDimData({ ...dimData, panjang: parseFloat(e.target.value) || 0 })}
                  className='text-xs'
                />
              </div>
              <div className='space-y-2'>
                <Label>Lebar</Label>
                <Input
                  type='number'
                  value={dimData.lebar}
                  onChange={(e) => setDimData({ ...dimData, lebar: parseFloat(e.target.value) || 0 })}
                  className='text-xs'
                />
              </div>
              <div className='space-y-2'>
                <Label>Tinggi</Label>
                <Input
                  type='number'
                  value={dimData.tinggi}
                  onChange={(e) => setDimData({ ...dimData, tinggi: parseFloat(e.target.value) || 0 })}
                  className='text-xs'
                />
              </div>
              <div className='space-y-2'>
                <Label>Satuan</Label>
                <Select
                  value={dimData.satuan}
                  onValueChange={(val) => setDimData({ ...dimData, satuan: val })}
                >
                  <SelectTrigger className='h-8 text-xs'>
                    <SelectValue placeholder='Pilih Satuan' />
                  </SelectTrigger>
                  <SelectContent>
                    {['M1', 'M2 (pxl)', 'M2 (pxt)', 'UNIT', 'SET'].map((u) => (
                      <SelectItem key={u} value={u} className='text-xs'>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4 pt-2 border-t border-neutral-100'>
              <div className='space-y-2'>
                <Label>Volume (m3)</Label>
                <Input
                  type='number'
                  step='0.01'
                  value={dimData.volume}
                  onChange={(e) => setDimData({ ...dimData, volume: parseFloat(e.target.value) || 0 })}
                  className='text-xs bg-neutral-50 font-bold text-blue-600'
                />
              </div>
              <div className='space-y-2'>
                <Label>Jumlah (Qty)</Label>
                <Input
                  type='number'
                  value={dimData.jumlah}
                  onChange={(e) => setDimData({ ...dimData, jumlah: parseInt(e.target.value) || 0 })}
                  className='text-xs font-bold'
                />
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDimDialogOpen(false)}>Cancel</AlertDialogCancel>
            <Button
              className='bg-blue-600 hover:bg-blue-700'
              onClick={handleDimUpdate}
              disabled={updateDimMutation.isPending}
            >
              {updateDimMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Check className='mr-2 h-4 w-4' />
              )}
              Simpan Perubahan
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Produksi Progress Dialog */}
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
            <div className='grid grid-cols-3 gap-4'>
              <div className='space-y-1 text-center p-3 bg-neutral-50 rounded-xl border border-neutral-100 flex flex-col justify-center'>
                <span className='text-[10px] font-bold text-neutral-500 uppercase tracking-wider'>Jumlah Order</span>
                <div className='text-2xl font-black text-neutral-800'>
                  {produksiViewItem?.jumlah || 0}
                </div>
              </div>
              <div className='space-y-1 text-center p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex flex-col justify-center'>
                <span className='text-[10px] font-bold text-indigo-800 uppercase tracking-wider'>Menggunakan Stok</span>
                <div className='text-2xl font-black text-indigo-600'>
                  {produksiViewItem?.produksi?.menggunakan_stok || 0}
                </div>
              </div>
              <div className='space-y-1 text-center p-3 bg-orange-50 rounded-xl border border-orange-100 flex flex-col justify-center'>
                <span className='text-[10px] font-bold text-orange-800 uppercase tracking-wider'>Total Progress</span>
                <div className='flex items-baseline justify-center gap-1'>
                  <span className='text-2xl font-black text-orange-600'>{Math.round(produksiViewItem?.produksi?.persen || 0)}</span>
                  <span className='text-sm font-bold text-orange-400'>%</span>
                </div>
              </div>
            </div>
            <Progress value={produksiViewItem?.produksi?.persen || 0} className='h-2 bg-orange-200/50 w-full' />

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

      {/* View Barang Supplier Progress Dialog */}
      <AlertDialog
        open={isSupplierViewOpen}
        onOpenChange={setIsSupplierViewOpen}
      >
        <AlertDialogContent className='max-w-xl'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2 text-lg sm:text-xl font-bold tracking-tight text-neutral-800'>
              <Truck className='h-6 w-6 text-blue-500' />
              Detail Progress Supplier
            </AlertDialogTitle>
            <AlertDialogDescription className='text-sm text-neutral-500 mt-1'>
              Melihat progress supplier untuk item: <strong>{supplierViewItem?.item}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className='py-4 space-y-6'>
            {/* Jumlah Order & Persen */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2 text-center p-4 bg-neutral-50 rounded-xl border border-neutral-100'>
                <span className='text-xs font-bold text-neutral-500 uppercase tracking-wider'>Jumlah Order</span>
                <div className='text-3xl font-black text-neutral-800'>
                  {supplierViewItem?.barang_supplier?.jumlah_order || supplierViewItem?.jumlah || 0}
                </div>
              </div>
              <div className='space-y-2 text-center p-4 bg-blue-50 rounded-xl border border-blue-100'>
                <span className='text-xs font-bold text-blue-800 uppercase tracking-wider'>Total Progress</span>
                <div className='flex items-baseline justify-center gap-1'>
                  <span className='text-3xl font-black text-blue-600'>
                    {typeof supplierViewItem?.barang_supplier?.persen === 'number'
                      ? supplierViewItem.barang_supplier.persen.toFixed(0)
                      : (Number(supplierViewItem?.barang_supplier?.persen) || 0).toFixed(0)}
                  </span>
                  <span className='text-xl font-bold text-blue-400'>%</span>
                </div>
              </div>
            </div>

            {/* Fields */}
            <div className='space-y-3'>
              <h4 className='font-bold text-xs text-neutral-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2'>
                <Truck className='h-3 w-3' />
                Tahapan Supplier
              </h4>
              <div className='grid grid-cols-2 sm:grid-cols-2 gap-x-8 gap-y-4'>
                {(
                  [
                    { key: 'barang_dipesan', label: 'Barang Dipesan' },
                    { key: 'barang_tersedia', label: 'Barang Tersedia' },
                    { key: 'rakit', label: 'Rakit' },
                    { key: 'packing', label: 'Packing' },
                    { key: 'terkirim', label: 'Terkirim' },
                  ] as const
                ).map(({ key, label }) => {
                  const isSkipped = supplierViewItem?.barang_supplier?.skipped_fields?.includes(key);
                  const val = supplierViewItem?.barang_supplier?.[key as keyof typeof supplierViewItem.barang_supplier];
                  const order = supplierViewItem?.barang_supplier?.jumlah_order || supplierViewItem?.jumlah || 0;
                  return (
                    <div key={key} className='flex items-center justify-between'>
                      <span className='text-xs text-neutral-600'>{label}</span>
                      <div className='flex items-center gap-2'>
                        {isSkipped ? (
                          <Badge variant='secondary' className='text-[9px] bg-neutral-100 text-neutral-400 border-none'>SKIPPED</Badge>
                        ) : (
                          <span className='text-sm font-bold text-neutral-900'>{Number(val) || 0} <span className='text-[10px] text-neutral-400 font-normal'>/ {order}</span></span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <AlertDialogFooter className='border-t pt-4'>
            <AlertDialogCancel className='bg-neutral-100 hover:bg-neutral-200 border-none'>Tutup</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* History Dialog */}
      <AlertDialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <AlertDialogContent className='max-w-lg'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <History className='h-5 w-5 text-amber-500' />
              History Perubahan
            </AlertDialogTitle>
            <AlertDialogDescription>
              Riwayat perubahan volume & dimensi untuk: <strong>{historyItem?.item}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='py-4 max-h-[400px] overflow-y-auto custom-scrollbar'>
            {isLoadingHistory ? (
              <div className='flex justify-center py-8'>
                <Loader2 className='h-6 w-6 animate-spin text-neutral-300' />
              </div>
            ) : filteredHistory.length === 0 ? (
              <p className='text-center py-8 text-xs text-muted-foreground italic'>Belum ada riwayat perubahan.</p>
            ) : (
              <div className='space-y-4'>
                {filteredHistory.map((h: any) => (
                  <div key={h.id} className='flex gap-4 items-start p-3 rounded-lg bg-neutral-50 border border-neutral-100'>
                    <div className='h-8 w-8 rounded-full bg-white border border-neutral-200 flex items-center justify-center shrink-0'>
                      <User className='h-4 w-4 text-neutral-400' />
                    </div>
                    <div className='flex-1 space-y-1'>
                      <div className='flex justify-between items-start'>
                        <span className='text-xs font-bold text-neutral-900'>{h.user?.name}</span>
                        <span className='text-[10px] text-muted-foreground'>{format(new Date(h.created_at), 'dd MMM yyyy HH:mm')}</span>
                      </div>
                      <p className='text-[11px] text-neutral-600'>
                        Mengubah{' '}
                        <span className='font-bold uppercase'>
                          {h.field === 'divisi_id' ? 'Divisi' : 
                           h.field === 'jumlah' ? 'Jumlah (Qty)' : 
                           h.field}
                        </span>{' '}
                        dari{' '}
                        <span className='line-through text-red-500'>
                          {h.field === 'divisi_id' 
                            ? (divisions?.find((d: any) => d.id.toString() === h.old_value?.toString())?.nama || h.old_value || '-')
                            : (h.old_value || '-')}
                        </span>{' '}
                        menjadi{' '}
                        <span className='font-bold text-emerald-600'>
                          {h.field === 'divisi_id' 
                            ? (divisions?.find((d: any) => d.id.toString() === h.new_value?.toString())?.nama || h.new_value)
                            : h.new_value}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsHistoryOpen(false)}>Tutup</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
