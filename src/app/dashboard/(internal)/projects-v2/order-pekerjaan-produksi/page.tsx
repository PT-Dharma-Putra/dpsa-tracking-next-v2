'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  FileText,
  Search,
  Plus,
  Printer,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Pencil,
  PenTool,
  Send,
  Trash2,
  ExternalLink,
  Loader2,
  Calendar,
  Building,
  RefreshCw,
  CheckSquare,
  Square,
  Flame,
  Check,
  X,
  Layers,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/hooks/use-auth';
import {
  orderPekerjaanProduksiService,
  OrderPekerjaanProduksiData,
  AvailableOrderItem,
  OrderItemInput,
} from '@/features/projects/services/order-pekerjaan-produksi-service';
import { SignatureDialog } from '@/features/projects/components/signature-dialog';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function OrderPekerjaanProduksiPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const fromParam = searchParams?.get('from') || 'ppic';
  const isPpicView = fromParam === 'ppic';

  const userRoles = useMemo(() => {
    if (!user) return [];
    if (Array.isArray(user.roles)) {
      return user.roles.map((r: any) => (typeof r === 'string' ? r : r.name));
    }
    return [user.role || (user as any).role_name || ''];
  }, [user]);

  const isSuperAdmin = userRoles.includes('Super-Admin');
  const isPPIC = isPpicView && (isSuperAdmin || userRoles.includes('PPIC') || true);
  const isProduksi = !isPpicView && (isSuperAdmin || userRoles.includes('Produksi') || fromParam === 'produksi');

  // Filters State
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [jenisOrderFilter, setJenisOrderFilter] = useState<string>('all');
  const [selectedProjectIdFilter, setSelectedProjectIdFilter] = useState<string>('all');

  // Modals State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);

  // Selected Order for Detail / Edit / Delete
  const [selectedOrder, setSelectedOrder] = useState<OrderPekerjaanProduksiData | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<'submit_order' | 'terima_order' | null>(null);

  // Form State for Create / Edit
  const [formProjectId, setFormProjectId] = useState<number | null>(null);
  const [formTanggalOrder, setFormTanggalOrder] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [formNomorOrder, setFormNomorOrder] = useState<string>('');
  const [formJenisOrder, setFormJenisOrder] = useState<'normal' | 'mendesak'>('normal');
  const [formTargetSelesai, setFormTargetSelesai] = useState<string>('');
  const [formCatatan, setFormCatatan] = useState<string>('');
  const [formDokubah, setFormDokubah] = useState<boolean>(false);
  const [formGambarKerja, setFormGambarKerja] = useState<boolean>(true);
  const [formDataStock, setFormDataStock] = useState<boolean>(false);
  const [formJadwalProduksi, setFormJadwalProduksi] = useState<boolean>(false);

  // Modal Left-Panel State
  const [itemSearch, setItemSearch] = useState<string>('');
  const [expandedProjectIds, setExpandedProjectIds] = useState<number[]>([]);

  // Selected item inputs in Create/Edit: Key is project_item_id
  const [selectedItemRows, setSelectedItemRows] = useState<Record<number, OrderItemInput>>({});

  // 1. Fetch Orders List
  const { data: listResponse, isLoading: listLoading, refetch } = useQuery({
    queryKey: [
      'order-pekerjaan-produksi-list',
      page,
      search,
      statusFilter,
      jenisOrderFilter,
      selectedProjectIdFilter,
    ],
    queryFn: () =>
      orderPekerjaanProduksiService.getList({
        page,
        per_page: 15,
        search: search || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        jenis_order: jenisOrderFilter === 'all' ? undefined : jenisOrderFilter,
        project_id: selectedProjectIdFilter === 'all' ? undefined : Number(selectedProjectIdFilter),
      }),
  });

  // 2. Fetch Available Items for Modal
  const { data: availableItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['available-items-opp-all', createModalOpen, editingOrderId],
    queryFn: () => orderPekerjaanProduksiService.getAvailableItems(null, editingOrderId || undefined),
    enabled: createModalOpen,
  });

  // 3. Group Available Items by Project (Tree structure like serah-terima-gambar)
  type ProjectGroup = {
    project_id: number;
    project_name: string;
    client_name: string;
    nomor_spk: string;
    tanggal_spk_masuk?: string | null;
    items: AvailableOrderItem[];
  };

  const projectGroups = useMemo<ProjectGroup[]>(() => {
    if (!availableItems) return [];
    const q = itemSearch.toLowerCase().trim();
    const filtered = !q
      ? availableItems
      : availableItems.filter((it) => {
          return (
            it.item.toLowerCase().includes(q) ||
            (it.client_name && it.client_name.toLowerCase().includes(q)) ||
            (it.nomor_spk && it.nomor_spk.toLowerCase().includes(q)) ||
            (it.project_name && it.project_name.toLowerCase().includes(q)) ||
            (it.ruang && it.ruang.toLowerCase().includes(q))
          );
        });

    const map = new Map<number, ProjectGroup>();
    filtered.forEach((it) => {
      if (!map.has(it.project_id)) {
        map.set(it.project_id, {
          project_id: it.project_id,
          project_name: it.project_name || ('Projek #' + it.project_id),
          client_name: it.client_name || '-',
          nomor_spk: it.nomor_spk || '-',
          tanggal_spk_masuk: it.tanggal_spk_masuk,
          items: [],
        });
      }
      map.get(it.project_id)!.items.push(it);
    });

    return Array.from(map.values());
  }, [availableItems, itemSearch]);

  // Current active project info
  const currentSelectedProject = useMemo(() => {
    if (!formProjectId || !availableItems) return null;
    const found = availableItems.find((it) => it.project_id === formProjectId);
    if (!found) return null;
    return {
      project_id: found.project_id,
      name: found.project_name || `Projek #${found.project_id}`,
      client_name: found.client_name || '-',
      nomor_spk: found.nomor_spk || '-',
    };
  }, [formProjectId, availableItems]);

  // Expand / Collapse project tree
  const toggleProjectExpand = (projectId: number) => {
    setExpandedProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  };

  const expandAllProjects = () => {
    setExpandedProjectIds(projectGroups.map((p) => p.project_id));
  };

  const collapseAllProjects = () => {
    setExpandedProjectIds([]);
  };

  // Auto-generate number
  const handleAutoGenerateNumber = async (tgl?: string) => {
    try {
      const num = await orderPekerjaanProduksiService.generateNumber(tgl || formTanggalOrder);
      setFormNomorOrder(num);
    } catch (err) {
      console.error('Failed to generate order number', err);
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingOrderId(null);
    setFormProjectId(null);
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    setFormTanggalOrder(todayStr);
    setFormJenisOrder('normal');
    setFormTargetSelesai('');
    setFormCatatan('');
    setFormDokubah(false);
    setFormGambarKerja(true);
    setFormDataStock(false);
    setFormJadwalProduksi(false);
    setSelectedItemRows({});
    setItemSearch('');
    setExpandedProjectIds([]);
    handleAutoGenerateNumber(todayStr);
    setCreateModalOpen(true);
  };

  // Open Edit Modal for Draft
  const handleOpenEdit = async (order: OrderPekerjaanProduksiData) => {
    try {
      const detail = await orderPekerjaanProduksiService.getDetail(order.id);
      setSelectedOrder(detail);
      setEditingOrderId(detail.id);
      setFormProjectId(detail.project_id);
      setFormTanggalOrder(detail.tanggal_order);
      setFormNomorOrder(detail.nomor_order);
      setFormJenisOrder(detail.jenis_order);
      setFormTargetSelesai(detail.target_penyelesaian || '');
      setFormCatatan(detail.catatan || '');
      setFormDokubah(detail.lampiran_dokubah);
      setFormGambarKerja(detail.lampiran_gambar_kerja);
      setFormDataStock(detail.lampiran_data_stock);
      setFormJadwalProduksi(detail.lampiran_jadwal_produksi);
      setExpandedProjectIds([detail.project_id]);

      const rows: Record<number, OrderItemInput> = {};
      detail.items.forEach((it) => {
        rows[it.project_item_id] = {
          project_item_id: it.project_item_id,
          ruang: it.ruang || it.project_item?.ruang || '',
          jumlah: it.jumlah,
          stock: it.stock,
          produksi: it.produksi,
          keterangan: it.keterangan || '',
        };
      });
      setSelectedItemRows(rows);
      setCreateModalOpen(true);
    } catch (err) {
      toast.error('Gagal memuat data order untuk diedit');
    }
  };

  // Open Detail Modal
  const handleOpenDetail = async (order: OrderPekerjaanProduksiData) => {
    try {
      const fullDetail = await orderPekerjaanProduksiService.getDetail(order.id);
      setSelectedOrder(fullDetail);
      setDetailModalOpen(true);
    } catch (err) {
      toast.error('Gagal memuat detail order');
    }
  };

  // Toggle item selection
  const toggleItemRow = (item: AvailableOrderItem) => {
    if (formProjectId && formProjectId !== item.project_id) {
      toast.info(`Order dialihkan ke ${item.project_name || 'projek baru'}, pilihan sebelumnya direset.`);
      const defaultQty = item.remaining_qty > 0 ? item.remaining_qty : item.total_project_qty;
      setFormProjectId(item.project_id);
      setSelectedItemRows({
        [item.id]: {
          project_item_id: item.id,
          ruang: item.ruang || '',
          jumlah: defaultQty,
          stock: 0,
          produksi: defaultQty,
          keterangan: '',
        },
      });
      return;
    }

    setSelectedItemRows((prev) => {
      const next = { ...prev };
      if (next[item.id]) {
        delete next[item.id];
        if (Object.keys(next).length === 0 && !editingOrderId) {
          setFormProjectId(null);
        }
      } else {
        if (!formProjectId) {
          setFormProjectId(item.project_id);
        }
        const defaultQty = item.remaining_qty > 0 ? item.remaining_qty : item.total_project_qty;
        next[item.id] = {
          project_item_id: item.id,
          ruang: item.ruang || '',
          jumlah: defaultQty,
          stock: 0,
          produksi: defaultQty,
          keterangan: '',
        };
      }
      return next;
    });
  };

  // Toggle select all items in a project
  const toggleProjectSelect = (projectItems: AvailableOrderItem[]) => {
    if (projectItems.length === 0) return;
    const targetProjId = projectItems[0].project_id;

    if (formProjectId && formProjectId !== targetProjId) {
      // Switch project
      toast.info(`Order dialihkan ke projek ${projectItems[0].project_name || ''}`);
      const newRows: Record<number, OrderItemInput> = {};
      projectItems.forEach((it) => {
        const qty = it.remaining_qty > 0 ? it.remaining_qty : it.total_project_qty;
        newRows[it.id] = {
          project_item_id: it.id,
          ruang: it.ruang || '',
          jumlah: qty,
          stock: 0,
          produksi: qty,
          keterangan: '',
        };
      });
      setFormProjectId(targetProjId);
      setSelectedItemRows(newRows);
      return;
    }

    const allItemIds = projectItems.map((i) => i.id);
    const isAllSelected = allItemIds.every((id) => !!selectedItemRows[id]);

    setSelectedItemRows((prev) => {
      const next = { ...prev };
      if (isAllSelected) {
        allItemIds.forEach((id) => delete next[id]);
        if (Object.keys(next).length === 0 && !editingOrderId) {
          setFormProjectId(null);
        }
      } else {
        setFormProjectId(targetProjId);
        projectItems.forEach((it) => {
          if (!next[it.id]) {
            const qty = it.remaining_qty > 0 ? it.remaining_qty : it.total_project_qty;
            next[it.id] = {
              project_item_id: it.id,
              ruang: it.ruang || '',
              jumlah: qty,
              stock: 0,
              produksi: qty,
              keterangan: '',
            };
          }
        });
      }
      return next;
    });
  };

  // Remove single selected item
  const removeItemSelect = (itemId: number) => {
    setSelectedItemRows((prev) => {
      const next = { ...prev };
      delete next[itemId];
      if (Object.keys(next).length === 0 && !editingOrderId) {
        setFormProjectId(null);
      }
      return next;
    });
  };

  // Reset all selected items
  const clearAllSelected = () => {
    setSelectedItemRows({});
    if (!editingOrderId) {
      setFormProjectId(null);
    }
  };

  // Update item field (jumlah, stock, produksi, ruang, keterangan)
  const updateItemRow = (itemId: number, field: keyof OrderItemInput, value: any) => {
    setSelectedItemRows((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;

      const updated = { ...existing, [field]: value };
      if (field === 'jumlah' || field === 'stock') {
        const jml = field === 'jumlah' ? Number(value) : existing.jumlah;
        const stk = field === 'stock' ? Number(value) : existing.stock;
        updated.produksi = Math.max(0, jml - stk);
      }
      return { ...prev, [itemId]: updated };
    });
  };

  // Details of selected items for right-hand preview panel
  const selectedItemsDetails = useMemo(() => {
    if (!availableItems || Object.keys(selectedItemRows).length === 0) return [];
    const itemMap = new Map(availableItems.map((i) => [i.id, i]));
    return Object.values(selectedItemRows)
      .map((row) => ({
        ...row,
        detail: itemMap.get(row.project_item_id),
      }))
      .filter((row) => !!row.detail);
  }, [availableItems, selectedItemRows]);

  // Save Mutation (Draft / Submit)
  const saveMutation = useMutation({
    mutationFn: async ({ directlySubmit }: { directlySubmit: boolean }) => {
      if (!formProjectId) throw new Error('Pilih minimal satu item produk dari projek yang tersedia.');
      const itemsArray = Object.values(selectedItemRows);
      if (itemsArray.length === 0) throw new Error('Pilih minimal satu item produk untuk diorder.');

      for (const it of itemsArray) {
        if (!it.jumlah || it.jumlah <= 0) {
          throw new Error('Jumlah order pada setiap item yang dipilih harus minimal 1.');
        }
      }

      if (editingOrderId) {
        return await orderPekerjaanProduksiService.update(editingOrderId, {
          tanggal_order: formTanggalOrder,
          nomor_order: formNomorOrder,
          jenis_order: formJenisOrder,
          target_penyelesaian: formTargetSelesai || null,
          lampiran_dokubah: formDokubah,
          lampiran_gambar_kerja: formGambarKerja,
          lampiran_data_stock: formDataStock,
          lampiran_jadwal_produksi: formJadwalProduksi,
          catatan: formCatatan || undefined,
          items: itemsArray,
        });
      } else {
        return await orderPekerjaanProduksiService.create({
          project_id: formProjectId,
          tanggal_order: formTanggalOrder,
          nomor_order: formNomorOrder || undefined,
          jenis_order: formJenisOrder,
          target_penyelesaian: formTargetSelesai || null,
          lampiran_dokubah: formDokubah,
          lampiran_gambar_kerja: formGambarKerja,
          lampiran_data_stock: formDataStock,
          lampiran_jadwal_produksi: formJadwalProduksi,
          catatan: formCatatan || undefined,
          langsung_kirim: directlySubmit,
          items: itemsArray,
        });
      }
    },
    onSuccess: (res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['order-pekerjaan-produksi-list'] });
      queryClient.invalidateQueries({ queryKey: ['available-items-opp-all'] });
      setCreateModalOpen(false);

      if (vars.directlySubmit) {
        toast.success('Order pekerjaan produksi berhasil diserahkan ke Produksi');
      } else {
        toast.success(
          editingOrderId
            ? 'Order pekerjaan produksi berhasil diperbarui'
            : 'Draft order pekerjaan produksi berhasil disimpan'
        );
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Gagal menyimpan order pekerjaan produksi');
    },
  });

  // Submit Draft to Produksi Mutation
  const submitDraftMutation = useMutation({
    mutationFn: (id: number) => orderPekerjaanProduksiService.submit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-pekerjaan-produksi-list'] });
      toast.success('Order pekerjaan produksi berhasil diserahkan ke Produksi');
      setDetailModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Gagal menyerahkan order');
    },
  });

  // Terima Order Mutation (Produksi)
  const terimaMutation = useMutation({
    mutationFn: (id: number) => orderPekerjaanProduksiService.terima(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-pekerjaan-produksi-list'] });
      toast.success('Order pekerjaan produksi berhasil diterima oleh Produksi');
      if (selectedOrder) {
        orderPekerjaanProduksiService.getDetail(selectedOrder.id).then(setSelectedOrder);
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Gagal menerima order');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => orderPekerjaanProduksiService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-pekerjaan-produksi-list'] });
      toast.success('Order berhasil dihapus');
      setDeleteConfirmOpen(false);
      setSelectedOrder(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Gagal menghapus order');
    },
  });

  const stats = listResponse?.stats || {
    total: 0,
    draft: 0,
    menunggu_diterima: 0,
    diterima: 0,
    mendesak: 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant='outline' className='bg-slate-100 text-slate-700 border-slate-300'>Draft (PPIC)</Badge>;
      case 'menunggu_diterima':
        return <Badge className='bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'>Menunggu Diterima</Badge>;
      case 'diterima':
        return <Badge className='bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'>Diterima Produksi</Badge>;
      case 'dibatalkan':
        return <Badge variant='destructive'>Dibatalkan</Badge>;
      default:
        return <Badge variant='outline'>{status}</Badge>;
    }
  };

  const getJenisOrderBadge = (jenis: string) => {
    if (jenis === 'mendesak') {
      return (
        <Badge className='bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-1 shadow-2xs'>
          <Flame className='h-3 w-3 fill-current' /> Mendesak
        </Badge>
      );
    }
    return (
      <Badge variant='outline' className='bg-blue-50 text-blue-700 border-blue-200 font-medium'>
        Normal
      </Badge>
    );
  };

  const selectedItemCount = Object.keys(selectedItemRows).length;
  const totalProduksiSum = Object.values(selectedItemRows).reduce((sum, it) => sum + (Number(it.produksi) || 0), 0);

  return (
    <div className='space-y-5 p-4 md:p-6 mx-auto'>
      {/* Header Banner */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b'>
        <div>
          <div className='flex items-center gap-2'>
            <Badge variant='secondary' className='text-xs font-semibold uppercase'>
              {isPpicView ? 'PPIC' : 'Produksi'}
            </Badge>
            <span className='text-xs text-muted-foreground'>• Formulir Resmi PPIC - 019</span>
          </div>
          <h1 className='text-2xl font-bold tracking-tight text-slate-900 mt-1'>
            Order Pekerjaan Produksi
          </h1>
          <p className='text-xs md:text-sm text-muted-foreground mt-0.5'>
            Perintah pengerjaan produksi dari PPIC ke pabrik/workshop berdasarkan serah terima gambar kerja.
          </p>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => refetch()}
            className='h-9 gap-1.5'
          >
            <RefreshCw className='h-3.5 w-3.5' /> Segarkan
          </Button>

          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setPendingAction(null);
              setSignatureModalOpen(true);
            }}
            className='h-9 gap-1.5'
          >
            <PenTool className='h-4 w-4 text-primary' />
            Atur Tanda Tangan Saya
          </Button>

          {isPPIC && (
            <Button
              onClick={handleOpenCreate}
              className='h-9 bg-blue-600 hover:bg-blue-700 text-white shadow gap-1.5'
            >
              <Plus className='h-4 w-4' /> Buat Order Baru
            </Button>
          )}
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3'>
        <Card className='p-3 shadow-2xs border-slate-200'>
          <div className='text-xs text-muted-foreground font-medium'>Total Order</div>
          <div className='text-xl font-bold text-slate-800 mt-1'>{stats.total}</div>
        </Card>
        <Card className='p-3 shadow-2xs border-slate-200'>
          <div className='text-xs text-muted-foreground font-medium'>Draft (PPIC)</div>
          <div className='text-xl font-bold text-slate-700 mt-1'>{stats.draft}</div>
        </Card>
        <Card className='p-3 shadow-2xs border-amber-200 bg-amber-50/40'>
          <div className='text-xs text-amber-700 font-medium'>Menunggu Diterima</div>
          <div className='text-xl font-bold text-amber-900 mt-1'>{stats.menunggu_diterima}</div>
        </Card>
        <Card className='p-3 shadow-2xs border-emerald-200 bg-emerald-50/40'>
          <div className='text-xs text-emerald-700 font-medium'>Diterima Produksi</div>
          <div className='text-xl font-bold text-emerald-900 mt-1'>{stats.diterima}</div>
        </Card>
        <Card className='p-3 shadow-2xs border-red-200 bg-red-50/40'>
          <div className='text-xs text-red-700 font-medium flex items-center gap-1'>
            <Flame className='h-3 w-3 fill-current' /> Mendesak (Urgent)
          </div>
          <div className='text-xl font-bold text-red-900 mt-1'>{stats.mendesak}</div>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card className='p-4 shadow-2xs'>
        <div className='flex flex-col sm:flex-row items-center gap-3'>
          <div className='relative flex-1 w-full'>
            <Search className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Cari nomor order, no SPK, nama proyek, konsumen, atau item...'
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className='pl-9 h-9 text-xs'
            />
          </div>

          <div className='flex items-center gap-2 w-full sm:w-auto'>
            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className='w-[150px] h-9 text-xs'>
                <SelectValue placeholder='Status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Semua Status</SelectItem>
                <SelectItem value='draft'>Draft</SelectItem>
                <SelectItem value='menunggu_diterima'>Menunggu Diterima</SelectItem>
                <SelectItem value='diterima'>Diterima</SelectItem>
              </SelectContent>
            </Select>

            {/* Jenis Order Filter */}
            <Select
              value={jenisOrderFilter}
              onValueChange={(val) => {
                setJenisOrderFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className='w-[130px] h-9 text-xs'>
                <SelectValue placeholder='Jenis Order' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Semua Jenis</SelectItem>
                <SelectItem value='normal'>Normal</SelectItem>
                <SelectItem value='mendesak'>Mendesak</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <Card className='shadow-2xs overflow-hidden'>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader className='bg-slate-50'>
              <TableRow className='text-xs'>
                <TableHead className='w-12 text-center'>No</TableHead>
                <TableHead className='w-44'>No. Order</TableHead>
                <TableHead className='w-44'>No. SPK & Klien</TableHead>
                <TableHead>Nama Proyek</TableHead>
                <TableHead className='w-28 text-center'>Jenis</TableHead>
                <TableHead className='w-28 text-center'>Tgl Order</TableHead>
                <TableHead className='w-28 text-center'>Target Selesai</TableHead>
                <TableHead className='w-24 text-center'>Item (Qty)</TableHead>
                <TableHead className='w-32 text-center'>Status</TableHead>
                <TableHead className='w-32 text-center'>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className='text-center py-12 text-muted-foreground'>
                    <div className='flex items-center justify-center gap-2'>
                      <Loader2 className='h-5 w-5 animate-spin text-primary' />
                      <span>Memuat daftar order pekerjaan produksi...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : listResponse?.data && listResponse.data.length > 0 ? (
                listResponse.data.map((order, idx) => {
                  const totalItems = order.items?.length || 0;
                  const totalProdQty = order.items?.reduce((s, it) => s + (Number(it.produksi) || 0), 0) || 0;

                  return (
                    <TableRow key={order.id} className='text-xs hover:bg-slate-50/80 transition-colors'>
                      <TableCell className='text-center font-medium text-slate-500'>
                        {(page - 1) * 15 + idx + 1}
                      </TableCell>
                      <TableCell className='font-bold text-slate-800 font-mono'>
                        {order.nomor_order}
                      </TableCell>
                      <TableCell>
                        <div className='font-semibold text-slate-800'>
                          {order.project?.spk?.nomor_spk || '-'}
                        </div>
                        <div className='text-[11px] text-muted-foreground uppercase truncate max-w-[170px]'>
                          {order.project?.client?.name || '-'}
                        </div>
                      </TableCell>
                      <TableCell className='font-semibold text-slate-900'>
                        {order.project?.name || '-'}
                      </TableCell>
                      <TableCell className='text-center'>
                        {getJenisOrderBadge(order.jenis_order)}
                      </TableCell>
                      <TableCell className='text-center text-slate-700 whitespace-nowrap font-medium'>
                        {order.tanggal_order
                          ? format(new Date(order.tanggal_order), 'dd MMM yyyy', { locale: idLocale })
                          : '-'}
                      </TableCell>
                      <TableCell className='text-center text-slate-700 whitespace-nowrap font-medium'>
                        {order.target_penyelesaian
                          ? format(new Date(order.target_penyelesaian), 'dd MMM yyyy', { locale: idLocale })
                          : '-'}
                      </TableCell>
                      <TableCell className='text-center font-medium'>
                        <div className='font-bold text-blue-700'>{totalItems} jenis</div>
                        <div className='text-[10px] text-slate-500'>{totalProdQty} unit prod</div>
                      </TableCell>
                      <TableCell className='text-center'>
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell className='text-center'>
                        <div className='flex items-center justify-center gap-1'>
                          {/* Detail View */}
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-7 w-7 text-blue-600 hover:bg-blue-50'
                            onClick={() => handleOpenDetail(order)}
                            title='Lihat Detail Order'
                          >
                            <Eye className='h-4 w-4' />
                          </Button>

                          {/* Print View */}
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-7 w-7 text-slate-600 hover:bg-slate-100'
                            asChild
                            title='Cetak Dokumen Order (A4)'
                          >
                            <Link
                              href={`/dashboard/projects-v2/order-pekerjaan-produksi/${order.id}/print`}
                              target='_blank'
                            >
                              <Printer className='h-4 w-4' />
                            </Link>
                          </Button>

                          {/* Action for Produksi: Terima */}
                          {order.status === 'menunggu_diterima' && isProduksi && (
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-7 w-7 text-emerald-600 hover:bg-emerald-50'
                              onClick={() => {
                                setSelectedOrder(order);
                                setPendingAction('terima_order');
                                setSignatureModalOpen(true);
                              }}
                              title='Terima Order Pekerjaan (Tanda Tangan)'
                            >
                              <CheckCircle2 className='h-4 w-4' />
                            </Button>
                          )}

                          {/* Actions for PPIC: Edit / Submit / Delete if Draft */}
                          {order.status === 'draft' && isPPIC && (
                            <>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-7 w-7 text-amber-600 hover:bg-amber-50'
                                onClick={() => handleOpenEdit(order)}
                                title='Edit Order'
                              >
                                <Pencil className='h-3.5 w-3.5' />
                              </Button>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-7 w-7 text-blue-600 hover:bg-blue-50'
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setPendingAction('submit_order');
                                  setSignatureModalOpen(true);
                                }}
                                title='Kirim ke Produksi'
                              >
                                <Send className='h-3.5 w-3.5' />
                              </Button>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-7 w-7 text-red-600 hover:bg-red-50'
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setDeleteConfirmOpen(true);
                                }}
                                title='Hapus Order'
                              >
                                <Trash2 className='h-3.5 w-3.5' />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className='text-center py-10 text-muted-foreground'>
                    <div className='flex flex-col items-center justify-center gap-1.5'>
                      <FileText className='h-8 w-8 text-slate-300' />
                      <p className='font-medium text-xs'>Belum ada order pekerjaan produksi ditemukan</p>
                      {isPPIC && (
                        <Button
                          variant='outline'
                          size='sm'
                          className='mt-2 h-8 text-xs gap-1'
                          onClick={handleOpenCreate}
                        >
                          <Plus className='h-3.5 w-3.5' /> Buat Order Sekarang
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {listResponse && listResponse.last_page > 1 && (
          <div className='flex items-center justify-between px-4 py-3 border-t bg-slate-50 text-xs text-muted-foreground'>
            <div>
              Halaman {listResponse.current_page} dari {listResponse.last_page} (Total {listResponse.total} order)
            </div>
            <div className='flex items-center gap-1'>
              <Button
                variant='outline'
                size='sm'
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className='h-7 text-xs px-2.5'
              >
                Sebelumnya
              </Button>
              <Button
                variant='outline'
                size='sm'
                disabled={page >= listResponse.last_page}
                onClick={() => setPage((p) => p + 1)}
                className='h-7 text-xs px-2.5'
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE / EDIT ORDER PEKERJAAN PRODUKSI (2-PANEL FULL-SCREEN)      */}
      {/* ========================================================================= */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className='min-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] flex flex-col p-6 overflow-hidden'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-lg'>
              <FileText className='h-5 w-5 text-blue-600' />
              {editingOrderId ? 'Edit Draft Order Pekerjaan Produksi' : 'Buat Order Pekerjaan Produksi'}
            </DialogTitle>
            <DialogDescription className='text-xs'>
              {editingOrderId
                ? 'Perbarui rincian item, kuantitas produksi, target penyelesaian, atau catatan order pekerjaan produksi.'
                : 'Pilih item produk dari projek yang gambar kerjanya sudah diserahterimakan ke PPIC untuk diterbitkan ke Produksi.'}
            </DialogDescription>
          </DialogHeader>

          <div className='grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0 overflow-hidden py-2'>
            {/* PANEL KIRI: DAFTAR PROYEK & PILIH ITEM GAMBAR KERJA (7/12) */}
            <div className='lg:col-span-7 xl:col-span-8 flex flex-col h-full min-h-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3'>
              
              {/* Header Bar Panel Kiri */}
              <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200 shrink-0'>
                <div>
                  <div className='flex items-center gap-2'>
                    <h3 className='text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5'>
                      <Building className='h-4 w-4 text-blue-600' />
                      Pilih Item Gambar Kerja per Proyek
                    </h3>
                    <Badge variant='outline' className='text-xs font-semibold bg-blue-50 text-blue-700 border-blue-200'>
                      {projectGroups.length} Proyek Siap Order
                    </Badge>
                  </div>
                  <p className='text-xs text-slate-500 mt-0.5'>
                    Klik baris proyek untuk melihat rincian item produk yang siap diorder ke produksi.
                  </p>
                </div>

                <div className='flex items-center gap-1.5'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={expandAllProjects}
                    className='h-7 text-xs px-2 bg-white'
                  >
                    Buka Semua
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={collapseAllProjects}
                    className='h-7 text-xs px-2 bg-white'
                  >
                    Tutup Semua
                  </Button>
                </div>
              </div>

              {/* Search Bar Panel Kiri */}
              <div className='relative shrink-0'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
                <Input
                  placeholder='Cari nama projek, nomor SPK, client, item, atau ruang...'
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className='pl-9 h-8 text-xs bg-white'
                />
              </div>

              {/* Scrollable Project Tree Table */}
              <div className='flex-1 overflow-y-auto min-h-0 border border-slate-200 rounded-lg bg-white shadow-2xs'>
                {itemsLoading ? (
                  <div className='flex flex-col items-center justify-center py-16 text-slate-500 gap-2'>
                    <Loader2 className='h-6 w-6 animate-spin text-blue-600' />
                    <span className='text-xs'>Memuat daftar item gambar kerja...</span>
                  </div>
                ) : projectGroups.length === 0 ? (
                  <div className='flex flex-col items-center justify-center py-16 text-center text-slate-400 p-6'>
                    <AlertCircle className='h-8 w-8 text-slate-300 mb-2' />
                    <p className='text-sm font-semibold text-slate-700'>Tidak Ada Item Siap Order</p>
                    <p className='text-xs text-slate-500 mt-1 max-w-sm'>
                      Tidak ditemukan item gambar kerja yang berstatus &apos;diterima&apos; oleh PPIC, atau hasil pencarian tidak cocok.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className='sticky top-0 bg-slate-100 z-10 shadow-2xs'>
                      <TableRow className='hover:bg-slate-100 text-[11px] font-semibold text-slate-700 uppercase'>
                        <TableHead className='w-10 text-center py-2'>#</TableHead>
                        <TableHead className='w-36 py-2'>Client</TableHead>
                        <TableHead className='w-36 py-2'>No SPK</TableHead>
                        <TableHead className='w-28 py-2 whitespace-nowrap'>SPK Masuk</TableHead>
                        <TableHead className='py-2'>Nama Proyek</TableHead>
                        <TableHead className='w-32 text-center py-2'>Item Terpilih</TableHead>
                        <TableHead className='w-28 text-center py-2'>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectGroups.map((proj) => {
                        const isExpanded = expandedProjectIds.includes(proj.project_id);
                        const isCurrentActiveProject = formProjectId === proj.project_id;
                        const projectItemIds = proj.items.map((i) => i.id);
                        const selectedCountInProj = isCurrentActiveProject
                          ? projectItemIds.filter((id) => !!selectedItemRows[id]).length
                          : 0;
                        const isAllSelectedInProj = proj.items.length > 0 && selectedCountInProj === proj.items.length;

                        return (
                          <React.Fragment key={proj.project_id}>
                            {/* Baris Utama Proyek (Parent Row) */}
                            <TableRow
                              className={`cursor-pointer select-none font-semibold transition-colors border-t border-slate-200 ${
                                selectedCountInProj > 0
                                  ? 'bg-blue-50/80 hover:bg-blue-100/70'
                                  : isExpanded
                                  ? 'bg-slate-100/90 hover:bg-slate-200/70 text-slate-800'
                                  : 'hover:bg-slate-100/70 bg-white text-slate-800'
                              }`}
                              onClick={() => toggleProjectExpand(proj.project_id)}
                            >
                              <TableCell className='text-center p-2'>
                                <div className='flex items-center justify-center'>
                                  {isExpanded ? (
                                    <ChevronDown className='h-4 w-4 text-blue-700' />
                                  ) : (
                                    <ChevronRight className='h-4 w-4 text-slate-400' />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell
                                className='py-2.5 px-3 text-xs text-slate-700 font-medium truncate max-w-[140px]'
                                title={proj.client_name}
                              >
                                {proj.client_name}
                              </TableCell>
                              <TableCell
                                className='py-2.5 px-3 text-xs font-semibold text-blue-700 truncate max-w-[140px]'
                                title={proj.nomor_spk}
                              >
                                {proj.nomor_spk}
                              </TableCell>
                              <TableCell className='py-2.5 px-3 text-xs text-slate-600 whitespace-nowrap'>
                                {proj.tanggal_spk_masuk
                                  ? format(new Date(proj.tanggal_spk_masuk), 'dd MMM yyyy', { locale: idLocale })
                                  : '-'}
                              </TableCell>
                              <TableCell className='py-2.5 px-3 text-xs sm:text-sm font-bold text-slate-900'>
                                <div className='flex items-center gap-2 min-w-0'>
                                  <Folder
                                    className={`h-4 w-4 shrink-0 ${
                                      selectedCountInProj > 0 ? 'text-blue-600' : 'text-slate-500'
                                    }`}
                                  />
                                  <span className='truncate' title={proj.project_name}>
                                    {proj.project_name}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className='py-2 px-2 text-center' onClick={(e) => e.stopPropagation()}>
                                <Badge
                                  className={`text-[11px] font-semibold ${
                                    isAllSelectedInProj
                                      ? 'bg-blue-600 text-white'
                                      : selectedCountInProj > 0
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                                  }`}
                                >
                                  {selectedCountInProj} / {proj.items.length} dipilih
                                </Badge>
                              </TableCell>
                              <TableCell className='py-2 px-2 text-center' onClick={(e) => e.stopPropagation()}>
                                <Button
                                  type='button'
                                  variant='ghost'
                                  size='sm'
                                  onClick={() => toggleProjectSelect(proj.items)}
                                  className={`h-6 px-2 text-xs font-medium ${
                                    isAllSelectedInProj
                                      ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                      : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                                  }`}
                                >
                                  {isAllSelectedInProj ? 'Batal Semua' : 'Pilih Semua'}
                                </Button>
                              </TableCell>
                            </TableRow>

                            {/* Baris Child (Sub-table Item Produk per Proyek) */}
                            {isExpanded && (
                              <TableRow className='bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-200'>
                                <TableCell colSpan={7} className='p-3 pl-8 bg-slate-50/70 border-l-4 border-blue-500'>
                                  <div className='rounded-md border border-slate-200 bg-white shadow-2xs overflow-hidden'>
                                    <Table>
                                      <TableHeader>
                                        <TableRow className='bg-slate-50 text-[11px] font-semibold text-slate-600'>
                                          <TableHead className='w-10 text-center py-1.5'>Pilih</TableHead>
                                          <TableHead className='w-28 py-1.5'>Ruang</TableHead>
                                          <TableHead className='py-1.5'>Item Produk</TableHead>
                                          <TableHead className='w-16 text-center py-1.5'>Satuan</TableHead>
                                          <TableHead className='w-16 text-center py-1.5'>Sisa SPK</TableHead>
                                          <TableHead className='w-24 text-center py-1.5'>Jml Order</TableHead>
                                          <TableHead className='w-20 text-center py-1.5'>Stock</TableHead>
                                          <TableHead className='w-20 text-center py-1.5'>Produksi</TableHead>
                                          <TableHead className='w-32 py-1.5'>Keterangan</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {proj.items.map((it) => {
                                          const isSelected = !!selectedItemRows[it.id];
                                          const rowData = selectedItemRows[it.id];

                                          return (
                                            <TableRow
                                              key={it.id}
                                              className={`text-xs transition-colors ${
                                                isSelected ? 'bg-blue-50/70 hover:bg-blue-50' : 'hover:bg-slate-50'
                                              }`}
                                            >
                                              <TableCell className='text-center p-2'>
                                                <input
                                                  type='checkbox'
                                                  checked={isSelected}
                                                  onChange={() => toggleItemRow(it)}
                                                  className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                                                />
                                              </TableCell>

                                              <TableCell className='p-2'>
                                                {isSelected ? (
                                                  <Input
                                                    value={rowData.ruang || ''}
                                                    onChange={(e) => updateItemRow(it.id, 'ruang', e.target.value)}
                                                    placeholder='Ruang...'
                                                    className='h-7 text-xs bg-white'
                                                  />
                                                ) : (
                                                  <span className='text-slate-600'>{it.ruang || '-'}</span>
                                                )}
                                              </TableCell>

                                              <TableCell className='p-2'>
                                                <div className='flex items-center gap-1.5 flex-wrap'>
                                                  <span className='font-bold uppercase text-slate-800'>{it.item}</span>
                                                  {it.file_gambar_kerja && (
                                                    <a
                                                      href={it.file_gambar_kerja}
                                                      target='_blank'
                                                      rel='noopener noreferrer'
                                                      className='inline-flex items-center gap-0.5 text-[10px] text-blue-600 hover:underline'
                                                      title='Lihat Gambar Kerja PDF'
                                                    >
                                                      <Eye className='h-3 w-3' /> PDF
                                                    </a>
                                                  )}
                                                </div>
                                                <div className='text-[10px] text-slate-500 mt-0.5'>
                                                  Total SPK: {it.total_project_qty} {it.satuan}
                                                  {it.already_ordered_qty > 0 && ` • Sudah diorder: ${it.already_ordered_qty}`}
                                                </div>
                                              </TableCell>

                                              <TableCell className='text-center p-2 font-medium text-slate-600'>
                                                {it.satuan}
                                              </TableCell>

                                              <TableCell className='text-center p-2 font-medium'>
                                                <Badge
                                                  variant='outline'
                                                  className={`text-[10px] ${
                                                    it.remaining_qty > 0
                                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                      : 'bg-slate-100 text-slate-500'
                                                  }`}
                                                >
                                                  {it.remaining_qty}
                                                </Badge>
                                              </TableCell>

                                              <TableCell className='p-2'>
                                                {isSelected ? (
                                                  <Input
                                                    type='number'
                                                    min={1}
                                                    value={rowData.jumlah}
                                                    onChange={(e) => updateItemRow(it.id, 'jumlah', Number(e.target.value))}
                                                    className='h-7 text-xs text-center font-bold text-blue-700 bg-white'
                                                  />
                                                ) : (
                                                  <span className='text-center block text-slate-400'>-</span>
                                                )}
                                              </TableCell>

                                              <TableCell className='p-2'>
                                                {isSelected ? (
                                                  <Input
                                                    type='number'
                                                    min={0}
                                                    value={rowData.stock}
                                                    onChange={(e) => updateItemRow(it.id, 'stock', Number(e.target.value))}
                                                    placeholder='0'
                                                    className='h-7 text-xs text-center bg-white'
                                                  />
                                                ) : (
                                                  <span className='text-center block text-slate-400'>-</span>
                                                )}
                                              </TableCell>

                                              <TableCell className='p-2 text-center'>
                                                {isSelected ? (
                                                  <span className='font-bold text-blue-800 text-xs px-2 py-0.5 bg-white border border-blue-200 rounded block'>
                                                    {rowData.produksi}
                                                  </span>
                                                ) : (
                                                  <span className='text-slate-400'>-</span>
                                                )}
                                              </TableCell>

                                              <TableCell className='p-2'>
                                                {isSelected ? (
                                                  <Input
                                                    value={rowData.keterangan || ''}
                                                    onChange={(e) => updateItemRow(it.id, 'keterangan', e.target.value)}
                                                    placeholder='Catatan item...'
                                                    className='h-7 text-xs bg-white'
                                                  />
                                                ) : (
                                                  <span className='text-slate-400'>-</span>
                                                )}
                                              </TableCell>
                                            </TableRow>
                                          );
                                        })}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>

            {/* PANEL KANAN: FORM ORDER & PREVIEW ITEM TERPILIH (5/12) */}
            <div className='lg:col-span-5 xl:col-span-4 flex flex-col h-full min-h-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 space-y-3.5 shadow-sm'>
              
              {/* Form Fields Header */}
              <div className='space-y-2.5 pb-3 border-b border-slate-200 shrink-0 overflow-y-auto max-h-[42vh] pr-1'>
                <div className='flex items-center justify-between'>
                  <h4 className='text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5'>
                    <FileText className='h-4 w-4 text-blue-600' />
                    Informasi Order Produksi
                  </h4>
                </div>

                {/* Selected Project Status Banner */}
                {currentSelectedProject ? (
                  <div className='p-2.5 rounded-lg bg-blue-50/80 border border-blue-200 text-xs flex items-center justify-between gap-2'>
                    <div className='min-w-0 flex-1'>
                      <div className='font-bold text-blue-900 truncate uppercase'>{currentSelectedProject.name}</div>
                      <div className='text-[11px] text-blue-700 flex items-center gap-1.5 mt-0.5 truncate'>
                        <span>SPK: <strong>{currentSelectedProject.nomor_spk}</strong></span>
                        <span>•</span>
                        <span className='truncate'>{currentSelectedProject.client_name}</span>
                      </div>
                    </div>
                    {!editingOrderId && (
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={clearAllSelected}
                        className='h-6 text-[10px] px-1.5 text-red-600 hover:text-red-700 hover:bg-red-50'
                        title='Ganti Projek'
                      >
                        Ganti Projek
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className='p-2 rounded border border-dashed border-slate-300 bg-slate-50 text-[11px] text-slate-500 italic text-center'>
                    Pilih item dari daftar proyek di sebelah kiri untuk mengikat dokumen order ini.
                  </div>
                )}

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
                  <div>
                    <Label className='text-[11px] font-semibold text-slate-700'>Tanggal Order *</Label>
                    <Input
                      type='date'
                      value={formTanggalOrder}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormTanggalOrder(val);
                        if (!editingOrderId) {
                          handleAutoGenerateNumber(val);
                        }
                      }}
                      className='mt-1 text-xs h-8'
                    />
                  </div>

                  <div>
                    <div className='flex items-center justify-between'>
                      <Label className='text-[11px] font-semibold text-slate-700'>No. Order Dokumen</Label>
                      <button
                        type='button'
                        onClick={() => handleAutoGenerateNumber(formTanggalOrder)}
                        className='text-[10px] text-blue-600 hover:underline flex items-center gap-0.5'
                      >
                        <RefreshCw className='h-2.5 w-2.5' /> Auto
                      </button>
                    </div>
                    <Input
                      value={formNomorOrder}
                      onChange={(e) => setFormNomorOrder(e.target.value)}
                      placeholder='OPP/PPIC/YYYYMMDD/...'
                      className='mt-1 text-xs h-8 font-mono font-semibold'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1'>
                  <div>
                    <Label className='text-[11px] font-semibold text-slate-700 block mb-1'>Jenis Order</Label>
                    <div className='flex items-center gap-3 mt-1'>
                      <label className='flex items-center gap-1.5 cursor-pointer text-xs font-medium'>
                        <input
                          type='radio'
                          name='jenis_order'
                          value='normal'
                          checked={formJenisOrder === 'normal'}
                          onChange={() => setFormJenisOrder('normal')}
                          className='text-blue-600'
                        />
                        <span>Normal</span>
                      </label>
                      <label className='flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-red-600'>
                        <input
                          type='radio'
                          name='jenis_order'
                          value='mendesak'
                          checked={formJenisOrder === 'mendesak'}
                          onChange={() => setFormJenisOrder('mendesak')}
                          className='text-red-600'
                        />
                        <span className='flex items-center gap-1'>
                          <Flame className='h-3.5 w-3.5 fill-current' /> Mendesak
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <Label className='text-[11px] font-semibold text-slate-700'>Target Selesai</Label>
                    <Input
                      type='date'
                      value={formTargetSelesai}
                      onChange={(e) => setFormTargetSelesai(e.target.value)}
                      className='mt-1 text-xs h-8'
                    />
                  </div>
                </div>

                {/* Checklist Data Fisik */}
                <div className='p-2 bg-slate-50 border rounded-md space-y-1'>
                  <Label className='text-[10px] font-bold text-slate-700 uppercase'>
                    *Data yang harus dilampirkan:
                  </Label>
                  <div className='grid grid-cols-2 gap-1.5 text-[11px]'>
                    <label className='flex items-center gap-1.5 cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={formDokubah}
                        onChange={(e) => setFormDokubah(e.target.checked)}
                        className='h-3.5 w-3.5 rounded border-gray-300 text-blue-600'
                      />
                      <span>Dokubah</span>
                    </label>
                    <label className='flex items-center gap-1.5 cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={formGambarKerja}
                        onChange={(e) => setFormGambarKerja(e.target.checked)}
                        className='h-3.5 w-3.5 rounded border-gray-300 text-blue-600'
                      />
                      <span>Gambar Kerja</span>
                    </label>
                    <label className='flex items-center gap-1.5 cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={formDataStock}
                        onChange={(e) => setFormDataStock(e.target.checked)}
                        className='h-3.5 w-3.5 rounded border-gray-300 text-blue-600'
                      />
                      <span>Data Stock</span>
                    </label>
                    <label className='flex items-center gap-1.5 cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={formJadwalProduksi}
                        onChange={(e) => setFormJadwalProduksi(e.target.checked)}
                        className='h-3.5 w-3.5 rounded border-gray-300 text-blue-600'
                      />
                      <span>Jadwal Produksi</span>
                    </label>
                  </div>
                </div>

                <div>
                  <Label className='text-[11px] font-semibold text-slate-700'>Catatan dari PPIC (Opsional)</Label>
                  <Textarea
                    placeholder='Instruksi khusus untuk mandor/tim produksi...'
                    value={formCatatan}
                    onChange={(e) => setFormCatatan(e.target.value)}
                    className='mt-1 text-xs h-12 min-h-12'
                  />
                </div>
              </div>

              {/* Cart / Preview Header */}
              <div className='flex items-center justify-between shrink-0 pt-1'>
                <div className='flex items-center gap-2'>
                  <h4 className='text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5'>
                    <CheckSquare className='h-4 w-4 text-emerald-600' />
                    Preview Item Terpilih
                  </h4>
                  <Badge variant='secondary' className='text-[11px] font-bold bg-blue-50 text-blue-700 border-blue-200'>
                    {selectedItemCount} Item
                  </Badge>
                  <Badge variant='secondary' className='text-[11px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200'>
                    {totalProduksiSum} Unit Prod
                  </Badge>
                </div>

                {selectedItemCount > 0 && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={clearAllSelected}
                    className='h-6 text-[11px] px-1.5 text-red-600 hover:text-red-700 hover:bg-red-50'
                  >
                    Reset Pilihan
                  </Button>
                )}
              </div>

              {/* Scrollable Preview List */}
              <div className='flex-1 overflow-y-auto min-h-0 border rounded-lg bg-slate-50/70 p-2 space-y-1.5'>
                {selectedItemsDetails.length === 0 ? (
                  <div className='h-full flex flex-col items-center justify-center text-center p-4 text-slate-400'>
                    <Square className='h-8 w-8 text-slate-300 mb-1' />
                    <p className='text-xs font-medium text-slate-600'>Belum ada item dipilih</p>
                    <p className='text-[11px] text-slate-400 mt-0.5'>
                      Centang item dari daftar proyek di sebelah kiri untuk menambahkannya ke order pekerjaan produksi ini.
                    </p>
                  </div>
                ) : (
                  selectedItemsDetails.map((it) => (
                    <div
                      key={it.project_item_id}
                      className='flex items-center justify-between p-2 rounded-md bg-white border border-slate-200 text-xs shadow-2xs hover:border-slate-300 transition-colors'
                    >
                      <div className='min-w-0 flex-1 pr-2'>
                        <div className='flex items-center gap-1.5'>
                          <span className='font-bold text-slate-800 truncate uppercase'>{it.detail?.item}</span>
                          <Badge variant='outline' className='text-[10px] font-semibold text-blue-700 bg-blue-50 border-blue-200 px-1 py-0'>
                            {it.jumlah} {it.detail?.satuan}
                          </Badge>
                          {it.ruang && (
                            <span className='text-[10px] text-slate-600 bg-slate-100 px-1 rounded'>
                              {it.ruang}
                            </span>
                          )}
                        </div>
                        <div className='flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 truncate'>
                          <span className='font-medium text-emerald-700'>Produksi: {it.produksi}</span>
                          <span>•</span>
                          <span>Stock: {it.stock}</span>
                          {it.keterangan && (
                            <>
                              <span>•</span>
                              <span className='italic text-slate-600 truncate'>{it.keterangan}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className='flex items-center gap-1 shrink-0'>
                        {it.detail?.file_gambar_kerja && (
                          <a
                            href={it.detail.file_gambar_kerja}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='p-1 text-slate-400 hover:text-blue-600 rounded'
                            title='Lihat File PDF'
                          >
                            <ExternalLink className='h-3.5 w-3.5' />
                          </a>
                        )}
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          onClick={() => removeItemSelect(it.project_item_id)}
                          className='h-6 w-6 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded'
                          title='Hapus dari order ini'
                        >
                          <X className='h-3.5 w-3.5' />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Action Buttons Footer di Kanan */}
              <div className='pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    setCreateModalOpen(false);
                    setEditingOrderId(null);
                  }}
                  disabled={saveMutation.isPending}
                  className='w-full sm:w-auto h-9 text-xs'
                >
                  Batal
                </Button>

                <div className='flex items-center gap-2 w-full sm:w-auto'>
                  <Button
                    type='button'
                    variant='secondary'
                    size='sm'
                    onClick={() => saveMutation.mutate({ directlySubmit: false })}
                    disabled={saveMutation.isPending || selectedItemCount === 0 || !formProjectId}
                    className='flex-1 sm:flex-none h-9 text-xs'
                  >
                    {saveMutation.isPending && <Loader2 className='h-3.5 w-3.5 animate-spin mr-1' />}
                    {editingOrderId ? 'Simpan Perubahan' : 'Simpan Draft'}
                  </Button>

                  <Button
                    type='button'
                    size='sm'
                    onClick={() => saveMutation.mutate({ directlySubmit: true })}
                    disabled={saveMutation.isPending || selectedItemCount === 0 || !formProjectId}
                    className='flex-1 sm:flex-none h-9 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className='h-3.5 w-3.5 animate-spin' />
                    ) : (
                      <Send className='h-3.5 w-3.5' />
                    )}
                    {editingOrderId ? 'Simpan & Kirim Produksi' : 'Kirim ke Produksi'}
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 2: DETAIL ORDER PEKERJAAN PRODUKSI                                  */}
      {/* ========================================================================= */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        {/* <DialogContent className='max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-6'> */}
        <DialogContent className='min-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] flex flex-col p-6 overflow-y-auto'>
          <DialogHeader>
            <div className='flex items-center justify-between pr-6'>
              <DialogTitle className='flex items-center gap-2 text-lg'>
                <FileText className='h-5 w-5 text-blue-600' />
                Detail Order Pekerjaan Produksi
              </DialogTitle>
              {selectedOrder && <div>{getStatusBadge(selectedOrder.status)}</div>}
            </div>
            <DialogDescription className='text-xs'>
              {selectedOrder ? (
                <>
                  No. Order: <strong className='font-mono text-slate-800'>{selectedOrder.nomor_order}</strong> • SPK: <strong>{selectedOrder.project?.spk?.nomor_spk || '-'}</strong>
                </>
              ) : (
                'Memuat detail dokumen order pekerjaan produksi...'
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className='space-y-4'>
              {/* Document Header Box */}
              <div className='border-2 border-slate-900 rounded p-4 bg-white'>
                <div className='flex items-center justify-between border-b-2 border-slate-900 pb-3 gap-2'>
                  <div className='w-28'>
                    <img src='/Logo.png' alt='Logo' className='h-10 object-contain' />
                  </div>
                  <div className='flex-1 text-center'>
                    <h2 className='text-lg font-black tracking-wider uppercase text-slate-900'>
                      ORDER PEKERJAAN PRODUKSI
                    </h2>
                  </div>
                  <div className='border border-slate-900 text-[10px] text-center font-semibold'>
                    <div className='grid grid-cols-2 border-b border-slate-900 divide-x divide-slate-900'>
                      <div className='p-1 bg-slate-100 font-bold'>PPIC 019</div>
                      <div className='p-1'>Rev : 00</div>
                    </div>
                    <div className='p-1'>Terbit : 02/26</div>
                  </div>
                </div>

                {/* Header Information */}
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 pt-3 text-xs'>
                  <div>
                    <span className='text-muted-foreground'>No. SPK : </span>
                    <strong className='text-slate-900 font-bold'>
                      {selectedOrder.project?.spk?.nomor_spk || '-'}
                    </strong>
                  </div>
                  <div>
                    <span className='text-muted-foreground'>Tanggal Order Diberikan : </span>
                    <strong className='text-slate-900'>
                      {selectedOrder.tanggal_order
                        ? format(new Date(selectedOrder.tanggal_order), 'dd/MM/yyyy')
                        : '-'}
                    </strong>
                  </div>
                  <div>
                    <span className='text-muted-foreground'>Nama Proyek : </span>
                    <strong className='text-slate-900'>{selectedOrder.project?.name || '-'}</strong>
                  </div>
                  <div>
                    <span className='text-muted-foreground'>No. Order Dokumen : </span>
                    <strong className='font-mono font-bold text-blue-700'>
                      {selectedOrder.nomor_order}
                    </strong>
                  </div>
                  <div className='sm:col-span-2 flex items-center gap-3 pt-1'>
                    <span className='text-muted-foreground'>Jenis Order :</span>
                    <div className='flex items-center gap-4'>
                      <span className='flex items-center gap-1.5'>
                        {selectedOrder.jenis_order === 'normal' ? (
                          <CheckSquare className='h-4 w-4 text-blue-600' />
                        ) : (
                          <Square className='h-4 w-4 text-slate-300' />
                        )}
                        <span>Normal</span>
                      </span>
                      <span className='flex items-center gap-1.5'>
                        {selectedOrder.jenis_order === 'mendesak' ? (
                          <CheckSquare className='h-4 w-4 text-red-600' />
                        ) : (
                          <Square className='h-4 w-4 text-slate-300' />
                        )}
                        <span className='text-red-700 font-semibold'>Mendesak (Urgent)</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className='border rounded-lg p-3 bg-white space-y-2'>
                <Label className='text-xs font-bold text-slate-800 uppercase'>
                  Detail Pekerjaan ({selectedOrder.items?.length || 0} Item)
                </Label>
                <div className='border rounded overflow-hidden'>
                  <Table>
                    <TableHeader className='bg-slate-50'>
                      <TableRow className='text-xs'>
                        <TableHead className='w-10 text-center py-2'>No</TableHead>
                        <TableHead className='w-32 py-2'>Ruang</TableHead>
                        <TableHead className='py-2'>Item Produk</TableHead>
                        <TableHead className='w-16 text-center py-2'>Jumlah</TableHead>
                        <TableHead className='w-16 text-center py-2'>Stock</TableHead>
                        <TableHead className='w-16 text-center py-2'>Produksi</TableHead>
                        <TableHead className='w-40 py-2'>Keterangan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items?.map((it, idx) => (
                        <TableRow key={it.id} className='text-xs'>
                          <TableCell className='text-center p-2 font-medium text-slate-500'>
                            {idx + 1}
                          </TableCell>
                          <TableCell className='p-2 font-medium text-slate-700'>
                            {it.ruang || '-'}
                          </TableCell>
                          <TableCell className='p-2 font-bold uppercase text-slate-900'>
                            {it.project_item?.item || '-'}
                          </TableCell>
                          <TableCell className='text-center p-2 font-bold text-slate-800'>
                            {it.jumlah}
                          </TableCell>
                          <TableCell className='text-center p-2 text-slate-600 font-medium'>
                            {it.stock}
                          </TableCell>
                          <TableCell className='text-center p-2 font-bold text-blue-700'>
                            {it.produksi}
                          </TableCell>
                          <TableCell className='p-2 text-slate-600'>
                            {it.keterangan || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Checklist Lampiran Data Fisik */}
              <div className='p-3 bg-slate-50 border rounded-lg text-xs space-y-1.5'>
                <strong className='text-slate-800 block'>*Data yang harus dilampirkan:</strong>
                <div className='flex items-center gap-4 flex-wrap text-slate-700'>
                  <span className='font-semibold text-slate-500'>17. Data Fisik:</span>
                  <span className='flex items-center gap-1'>
                    {selectedOrder.lampiran_dokubah ? <CheckSquare className='h-3.5 w-3.5 text-blue-600' /> : <Square className='h-3.5 w-3.5 text-slate-300' />}
                    Dokubah
                  </span>
                  <span className='flex items-center gap-1'>
                    {selectedOrder.lampiran_gambar_kerja ? <CheckSquare className='h-3.5 w-3.5 text-blue-600' /> : <Square className='h-3.5 w-3.5 text-slate-300' />}
                    Gambar Kerja
                  </span>
                  <span className='flex items-center gap-1'>
                    {selectedOrder.lampiran_data_stock ? <CheckSquare className='h-3.5 w-3.5 text-blue-600' /> : <Square className='h-3.5 w-3.5 text-slate-300' />}
                    Data Stock
                  </span>
                  <span className='flex items-center gap-1'>
                    {selectedOrder.lampiran_jadwal_produksi ? <CheckSquare className='h-3.5 w-3.5 text-blue-600' /> : <Square className='h-3.5 w-3.5 text-slate-300' />}
                    Jadwal Produksi
                  </span>
                </div>
              </div>

              {/* Target & Catatan */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs p-3 bg-white border rounded-lg'>
                <div>
                  <span className='text-muted-foreground block text-[11px]'>Target Penyelesaian :</span>
                  <strong className='text-slate-900 text-sm'>
                    {selectedOrder.target_penyelesaian
                      ? format(new Date(selectedOrder.target_penyelesaian), 'dd MMMM yyyy', { locale: idLocale })
                      : '-'}
                  </strong>
                </div>
                <div>
                  <span className='text-muted-foreground block text-[11px]'>Catatan dari PPIC :</span>
                  <p className='text-slate-800 whitespace-pre-wrap font-medium mt-0.5'>
                    {selectedOrder.catatan || <span className='text-muted-foreground italic'>Tidak ada catatan.</span>}
                  </p>
                </div>
              </div>

              {/* Persetujuan dan Tanda Tangan */}
              <div className='border-2 border-slate-900 rounded overflow-hidden'>
                <div className='bg-slate-100 font-bold text-center text-xs py-1.5 border-b border-slate-900'>
                  Persetujuan dan Tanda Tangan
                </div>
                <div className='grid grid-cols-2 divide-x divide-slate-900 text-xs'>
                  {/* PPIC (Diberikan Oleh) */}
                  <div className='p-3 text-center space-y-1.5'>
                    <div className='font-bold text-slate-800'>Diberikan Oleh : (PPIC)</div>
                    <div className='h-20 flex items-center justify-center my-1'>
                      {selectedOrder.pembuat?.tanda_tangan?.file_url ? (
                        <img
                          src={selectedOrder.pembuat.tanda_tangan.file_url}
                          alt='TTD PPIC'
                          className='h-16 max-w-full object-contain'
                        />
                      ) : (
                        <span className='text-[11px] text-muted-foreground italic'>Belum ada tanda tangan</span>
                      )}
                    </div>
                    <div className='border-t pt-1 font-semibold text-slate-900'>
                      Nama : {selectedOrder.pembuat?.name || '-'}
                    </div>
                    <div className='text-[11px] text-muted-foreground'>
                      Tanggal : {selectedOrder.tanggal_diserahkan ? format(new Date(selectedOrder.tanggal_diserahkan), 'dd/MM/yyyy') : '-'}
                    </div>
                  </div>

                  {/* Produksi (Diterima Oleh) */}
                  <div className='p-3 text-center space-y-1.5'>
                    <div className='font-bold text-slate-800'>Diterima Oleh : (Produksi)</div>
                    <div className='h-20 flex items-center justify-center my-1'>
                      {selectedOrder.status === 'diterima' && selectedOrder.penerima?.tanda_tangan?.file_url ? (
                        <img
                          src={selectedOrder.penerima.tanda_tangan.file_url}
                          alt='TTD Produksi'
                          className='h-16 max-w-full object-contain'
                        />
                      ) : selectedOrder.status === 'menunggu_diterima' ? (
                        <Badge className='bg-amber-100 text-amber-800 border-amber-300'>
                          Menunggu Penerimaan Produksi
                        </Badge>
                      ) : (
                        <span className='text-[11px] text-muted-foreground italic'>-</span>
                      )}
                    </div>
                    <div className='border-t pt-1 font-semibold text-slate-900'>
                      Nama : {selectedOrder.penerima?.name || '........................'}
                    </div>
                    <div className='text-[11px] text-muted-foreground'>
                      Tanggal : {selectedOrder.tanggal_diterima ? format(new Date(selectedOrder.tanggal_diterima), 'dd/MM/yyyy') : '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className='gap-2 sm:gap-0 pt-3 border-t'>
            {selectedOrder && (
              <Button
                variant='outline'
                asChild
                className='text-xs h-9 gap-1.5'
              >
                <Link
                  href={`/dashboard/projects-v2/order-pekerjaan-produksi/${selectedOrder.id}/print`}
                  target='_blank'
                >
                  <Printer className='h-3.5 w-3.5' /> Cetak Dokumen Resmi
                </Link>
              </Button>
            )}

            <div className='flex items-center gap-2'>
              {/* If Draft and PPIC: Kirim ke Produksi */}
              {selectedOrder?.status === 'draft' && isPPIC && (
                <Button
                  onClick={() => {
                    setPendingAction('submit_order');
                    setSignatureModalOpen(true);
                  }}
                  className='text-xs h-9 bg-blue-600 hover:bg-blue-700 text-white gap-1'
                >
                  <Send className='h-3.5 w-3.5' /> Kirim ke Produksi
                </Button>
              )}

              {/* If Menunggu Diterima and Produksi: Terima Order */}
              {selectedOrder?.status === 'menunggu_diterima' && isProduksi && (
                <Button
                  onClick={() => {
                    setPendingAction('terima_order');
                    setSignatureModalOpen(true);
                  }}
                  className='text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow'
                >
                  <CheckCircle2 className='h-4 w-4' /> Terima Order Pekerjaan
                </Button>
              )}

              <Button
                variant='secondary'
                onClick={() => setDetailModalOpen(false)}
                className='text-xs h-9'
              >
                Tutup
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* SIGNATURE DIALOG FOR PPIC SUBMIT OR PRODUKSI TERIMA                        */}
      {/* ========================================================================= */}
      <SignatureDialog
        open={signatureModalOpen}
        onOpenChange={setSignatureModalOpen}
        onSuccess={() => {
          setSignatureModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['order-pekerjaan-produksi-list'] });
          if (selectedOrder) {
            orderPekerjaanProduksiService.getDetail(selectedOrder.id).then(setSelectedOrder);
          }
          if (pendingAction === 'submit_order' && selectedOrder) {
            submitDraftMutation.mutate(selectedOrder.id);
          } else if (pendingAction === 'terima_order' && selectedOrder) {
            terimaMutation.mutate(selectedOrder.id);
          }
          setPendingAction(null);
        }}
      />

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION DIALOG                                                */}
      {/* ========================================================================= */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className='max-w-md p-4 sm:p-6'>
          <DialogHeader>
            <DialogTitle className='text-destructive flex items-center gap-2'>
              <AlertCircle className='h-5 w-5' /> Konfirmasi Hapus Order
            </DialogTitle>
            <DialogDescription className='text-xs'>
              Apakah Anda yakin ingin menghapus draft order <strong>{selectedOrder?.nomor_order}</strong>? Data yang dihapus tidak dapat dikembalikan.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className='gap-2 sm:gap-0 pt-2'>
            <Button
              variant='outline'
              onClick={() => setDeleteConfirmOpen(false)}
              className='text-xs h-9'
            >
              Batal
            </Button>
            <Button
              variant='destructive'
              onClick={() => selectedOrder && deleteMutation.mutate(selectedOrder.id)}
              disabled={deleteMutation.isPending}
              className='text-xs h-9'
            >
              {deleteMutation.isPending && <Loader2 className='h-3.5 w-3.5 animate-spin mr-1' />}
              Hapus Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
