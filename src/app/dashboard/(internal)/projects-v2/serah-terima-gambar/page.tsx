'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  FileText,
  Search,
  Filter,
  Plus,
  Printer,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  PenTool,
  Pencil,
  Send,
  Layers,
  Trash2,
  ExternalLink,
  Loader2,
  XCircle,
  Calendar,
  CheckSquare,
  Square,
  Building,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  X,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/hooks/use-auth';
import {
  suratSerahTerimaService,
  SuratSerahTerimaItem,
  DrawingItemDetail,
} from '@/features/projects/services/surat-serah-terima-service';
import { kopSuratService } from '@/features/master-data/services/kop-surat-service';
import { SignatureDialog } from '@/features/projects/components/signature-dialog';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function SuratSerahTerimaGambarPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const fromParam = searchParams.get('from') || 'studio';
  const isPpicView = fromParam === 'ppic';

  // Role detection
  const userRoles = useMemo(() => {
    if (!user) return [];
    if (Array.isArray(user.roles)) {
      return user.roles.map((r: any) => (typeof r === 'string' ? r : r.name));
    }
    return [user.role || (user as any).role_name || ''];
  }, [user]);

  const isSuperAdmin = userRoles.includes('Super-Admin');
  const isPPIC = isSuperAdmin || userRoles.includes('PPIC') || isPpicView;
  const isEngineer = !isPpicView && (isSuperAdmin || userRoles.includes('Studio') || userRoles.includes('Engineer') || true);

  // Filters state
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const [filterTanggal, setFilterTanggal] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modals state
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSurat, setSelectedSurat] = useState<SuratSerahTerimaItem | null>(null);

  // Form State for Create/Edit
  const [editingSuratId, setEditingSuratId] = useState<number | null>(null);
  const [formTanggal, setFormTanggal] = useState<string>(todayStr);
  const [formNomorSurat, setFormNomorSurat] = useState<string>('');
  const [formKopId, setFormKopId] = useState<string>('');
  const [formCatatan, setFormCatatan] = useState<string>('');
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [itemSearch, setItemSearch] = useState<string>('');
  const [groupByItem, setGroupByItem] = useState<boolean>(true);

  // Approval / Reject Dialog State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectCatatan, setRejectCatatan] = useState('');

  // 1. Fetch List Surat Serah Terima
  const { data: listResponse, isLoading: listLoading, refetch: refetchList } = useQuery({
    queryKey: ['surat-serah-terima-list', currentPage, filterTanggal, filterStatus, searchQuery],
    queryFn: () =>
      suratSerahTerimaService.getList({
        page: currentPage,
        tanggal: filterTanggal || undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        search: searchQuery || undefined,
      }),
  });

  // 2. Fetch Active Kop Surat list
  const { data: kopSuratList } = useQuery({
    queryKey: ['kop-surat-list'],
    queryFn: () => kopSuratService.getKopSuratList(),
  });

  // 3. Fetch Available Drawing Items for Create/Edit modal (not restricted by formTanggal)
  const { data: availableItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['available-drawing-items', createModalOpen, editingSuratId],
    queryFn: () =>
      suratSerahTerimaService.getAvailableItems({
        exclude_surat_id: editingSuratId || undefined,
      }),
    enabled: createModalOpen,
  });

  // Grouped available items by Project
  type ProjectGroup = {
    project_id: number;
    project_name: string;
    client_name: string;
    nomor_spk: string;
    tanggal_spk_masuk?: string | null;
    items: DrawingItemDetail[];
  };

  const projectGroups = useMemo<ProjectGroup[]>(() => {
    if (!availableItems) return [];
    const q = itemSearch.toLowerCase().trim();
    const filtered = !q
      ? availableItems
      : availableItems.filter((it) => {
          return (
            it.item.toLowerCase().includes(q) ||
            (it.project_name && it.project_name.toLowerCase().includes(q)) ||
            it.client_name.toLowerCase().includes(q) ||
            it.nomor_spk.toLowerCase().includes(q)
          );
        });

    const map = new Map<number, ProjectGroup>();
    filtered.forEach((it) => {
      if (!map.has(it.project_id)) {
        map.set(it.project_id, {
          project_id: it.project_id,
          project_name: it.project_name || `Projek #${it.project_id}`,
          client_name: it.client_name || '-',
          nomor_spk: it.nomor_spk || '-',
          tanggal_spk_masuk: it.tanggal_spk_masuk || null,
          items: [],
        });
      }
      map.get(it.project_id)!.items.push(it);
    });

    const groups = Array.from(map.values()).sort((a, b) => b.project_id - a.project_id);
    groups.forEach((g) => {
      g.items.sort((a, b) => b.id - a.id);
    });

    return groups;
  }, [availableItems, itemSearch]);

  const [expandedProjectIds, setExpandedProjectIds] = useState<number[]>([]);

  const toggleProjectExpand = (projectId: number) => {
    setExpandedProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  };

  const collapseAllProjects = () => {
    setExpandedProjectIds([]);
  };

  const expandAllProjects = () => {
    setExpandedProjectIds(projectGroups.map((p) => p.project_id));
  };

  // Selected items with full details for right-hand preview panel
  const selectedItemsDetails = useMemo(() => {
    if (!availableItems || selectedItemIds.length === 0) return [];
    return availableItems.filter((it) => selectedItemIds.includes(it.id));
  }, [availableItems, selectedItemIds]);

  const totalSelectedUnits = useMemo(() => {
    return selectedItemsDetails.reduce((sum, it) => sum + (Number(it.jumlah) || 1), 0);
  }, [selectedItemsDetails]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: { langsung_kirim: boolean }) =>
      suratSerahTerimaService.create({
        tanggal: formTanggal,
        nomor_surat: formNomorSurat || undefined,
        kop_surat_id: formKopId ? Number(formKopId) : undefined,
        item_ids: selectedItemIds,
        catatan: formCatatan,
        langsung_kirim: payload.langsung_kirim,
      }),
    onSuccess: (res) => {
      toast.success(res.message);
      setCreateModalOpen(false);
      resetCreateForm();
      queryClient.invalidateQueries({ queryKey: ['surat-serah-terima-list'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Gagal membuat surat serah terima');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: number; langsung_kirim: boolean }) =>
      suratSerahTerimaService.update(payload.id, {
        tanggal: formTanggal,
        nomor_surat: formNomorSurat,
        kop_surat_id: formKopId ? Number(formKopId) : undefined,
        item_ids: selectedItemIds,
        catatan: formCatatan,
      }),
    onSuccess: async (res, variables) => {
      if (variables.langsung_kirim) {
        await suratSerahTerimaService.submit(variables.id);
        toast.success('Surat serah terima berhasil diperbarui dan diserahkan ke PPIC');
      } else {
        toast.success(res.message || 'Draft surat serah terima berhasil diperbarui');
      }
      setCreateModalOpen(false);
      setEditingSuratId(null);
      resetCreateForm();
      queryClient.invalidateQueries({ queryKey: ['surat-serah-terima-list'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Gagal memperbarui surat serah terima');
    },
  });

  const submitMutation = useMutation({
    mutationFn: (id: number) => suratSerahTerimaService.submit(id),
    onSuccess: () => {
      toast.success('Surat serah terima berhasil diserahkan ke PPIC');
      queryClient.invalidateQueries({ queryKey: ['surat-serah-terima-list'] });
      if (detailModalOpen && selectedSurat) {
        suratSerahTerimaService.getDetail(selectedSurat.id).then(setSelectedSurat);
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Gagal menyerahkan surat');
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => suratSerahTerimaService.approve(id),
    onSuccess: (res) => {
      toast.success(res.message);
      setDetailModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['surat-serah-terima-list'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Gagal menyetujui surat serah terima');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, catatan }: { id: number; catatan: string }) =>
      suratSerahTerimaService.reject(id, { catatan }),
    onSuccess: (res) => {
      toast.success(res.message);
      setRejectModalOpen(false);
      setDetailModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['surat-serah-terima-list'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Gagal menolak surat');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => suratSerahTerimaService.delete(id),
    onSuccess: () => {
      toast.success('Surat serah terima berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['surat-serah-terima-list'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Gagal menghapus surat');
    },
  });

  const resetCreateForm = () => {
    setEditingSuratId(null);
    setFormTanggal(todayStr);
    setFormNomorSurat('');
    setFormCatatan('');
    setSelectedItemIds([]);
    setItemSearch('');
    setExpandedProjectIds([]);
  };

  const handleOpenCreateModal = () => {
    resetCreateForm();
    if (kopSuratList && kopSuratList.length > 0) {
      const stuKop = kopSuratList.find((k) => k.nama_identitas_iso === 'STU' || k.is_active);
      if (stuKop) {
        setFormKopId(String(stuKop.id));
      } else {
        setFormKopId(String(kopSuratList[0].id));
      }
    }
    setCreateModalOpen(true);
  };

  const handleOpenEdit = async (item: SuratSerahTerimaItem) => {
    try {
      const fullDetail = await suratSerahTerimaService.getDetail(item.id);
      setEditingSuratId(fullDetail.id);
      setFormTanggal(fullDetail.tanggal ? format(new Date(fullDetail.tanggal), 'yyyy-MM-dd') : todayStr);
      setFormNomorSurat(fullDetail.nomor_surat);
      setFormKopId(fullDetail.kop_surat_id ? String(fullDetail.kop_surat_id) : '');
      setFormCatatan(fullDetail.catatan || '');
      setSelectedItemIds(fullDetail.items?.map((it) => it.project_item_id) || []);
      setItemSearch('');
      setDetailModalOpen(false); // Close detail modal if opened from there
      setCreateModalOpen(true);
    } catch (err) {
      toast.error('Gagal memuat data draft surat');
    }
  };

  const toggleItemSelect = (id: number) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleProjectSelect = (projectItems: DrawingItemDetail[]) => {
    const ids = projectItems.map((i) => i.id);
    const allSelected = ids.every((id) => selectedItemIds.includes(id));
    if (allSelected) {
      setSelectedItemIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedItemIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };

  const toggleSelectAllFiltered = () => {
    const allFilteredIds = projectGroups.flatMap((p) => p.items.map((i) => i.id));
    const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedItemIds.includes(id));
    if (allSelected) {
      setSelectedItemIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
    } else {
      setSelectedItemIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const removeItemSelect = (id: number) => {
    setSelectedItemIds((prev) => prev.filter((i) => i !== id));
  };

  const clearAllSelected = () => {
    setSelectedItemIds([]);
  };

  const handleOpenDetail = async (item: SuratSerahTerimaItem) => {
    try {
      const fullDetail = await suratSerahTerimaService.getDetail(item.id);
      setSelectedSurat(fullDetail);
      setDetailModalOpen(true);
    } catch (err) {
      toast.error('Gagal memuat detail surat');
    }
  };

  // Grouped items in detail modal (same product merged into single row)
  type GroupedDetailRow = {
    client_name: string;
    nomor_spk: string;
    item: string;
    satuan: string;
    total_jumlah: number;
    file_url: string | null;
    submit_date: string | null;
    sub_item_count: number;
  };

  const groupedDetailItems = useMemo<GroupedDetailRow[]>(() => {
    if (!selectedSurat?.items) return [];
    const map = new Map<string, GroupedDetailRow>();

    selectedSurat.items.forEach((itemRec) => {
      const pi = itemRec.project_item;
      const clientName = (pi?.project?.client?.name || '-').trim();
      const nomorSpk = (pi?.project?.spk?.nomor_spk || '-').trim();
      const itemName = (pi?.item || '-').trim();
      const satuan = (pi?.satuan || 'UNIT').trim();
      const key = `${clientName.toLowerCase()}_${nomorSpk.toLowerCase()}_${itemName.toLowerCase()}_${satuan.toLowerCase()}`;
      const gk = pi?.gambar_kerja;
      const fileUrl = gk?.file ? (gk.file.startsWith('http') ? gk.file : `/storage/${gk.file}`) : null;
      const submitDate = gk?.tanggal_selesai || gk?.updated_at || null;

      if (!map.has(key)) {
        map.set(key, {
          client_name: clientName,
          nomor_spk: nomorSpk,
          item: itemName,
          satuan,
          total_jumlah: Number(pi?.jumlah || 1),
          file_url: fileUrl,
          submit_date: submitDate,
          sub_item_count: 1,
        });
      } else {
        const existing = map.get(key)!;
        existing.total_jumlah += Number(pi?.jumlah || 1);
        existing.sub_item_count += 1;
        if (!existing.file_url && fileUrl) {
          existing.file_url = fileUrl;
        }
      }
    });

    return Array.from(map.values());
  }, [selectedSurat]);

  const stats = listResponse?.stats || {
    total: 0,
    hari_ini: 0,
    menunggu_approval: 0,
    diterima: 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant='outline' className='bg-slate-100 text-slate-700 border-slate-300'>Draft</Badge>;
      case 'menunggu_approval':
        return <Badge className='bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'>Menunggu Approval PPIC</Badge>;
      case 'diterima':
        return <Badge className='bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'>Diterima PPIC</Badge>;
      case 'ditolak':
        return <Badge className='bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'>Ditolak</Badge>;
      default:
        return <Badge variant='secondary'>{status}</Badge>;
    }
  };

  return (
    <div className='space-y-6 p-4 sm:p-6'>
      
      {/* Page Header */}
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <div className='flex items-center gap-2'>
            <FileText className='h-7 w-7 text-primary' />
            <h1 className='text-2xl font-bold tracking-tight'>Surat Serah Terima Gambar</h1>
            <Badge variant='secondary' className='ml-1 font-semibold text-xs'>
              {isPpicView ? 'Divisi PPIC' : 'Divisi Studio / Engineer'}
            </Badge>
          </div>
          <p className='mt-1 text-sm text-muted-foreground'>
            Formulir resmi <strong>STU - 004</strong> serah terima gambar kerja harian dari Engineer ke PPIC.
          </p>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setSignatureModalOpen(true)}
            className='gap-1.5'
          >
            <PenTool className='h-4 w-4 text-primary' />
            Atur Tanda Tangan Saya
          </Button>

          {!isPpicView && isEngineer && (
            <Button
              size='sm'
              onClick={handleOpenCreateModal}
              className='gap-1.5 bg-blue-600 hover:bg-blue-700'
            >
              <Plus className='h-4 w-4' />
              Buat Surat Serah Terima
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4'>
        <Card className='shadow-xs'>
          <CardHeader className='pb-2 pt-3 px-4'>
            <CardTitle className='text-xs font-medium text-muted-foreground'>
              Total Surat
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-3'>
            <div className='text-2xl font-bold'>{stats.total}</div>
          </CardContent>
        </Card>

        <Card className='shadow-xs border-blue-200 bg-blue-50/40'>
          <CardHeader className='pb-2 pt-3 px-4'>
            <CardTitle className='text-xs font-medium text-blue-700'>
              Dibuat Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-3'>
            <div className='text-2xl font-bold text-blue-700'>{stats.hari_ini}</div>
          </CardContent>
        </Card>

        <Card className='shadow-xs border-amber-200 bg-amber-50/40'>
          <CardHeader className='pb-2 pt-3 px-4'>
            <CardTitle className='text-xs font-medium text-amber-700'>
              Menunggu Approval PPIC
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-3'>
            <div className='text-2xl font-bold text-amber-700'>{stats.menunggu_approval}</div>
          </CardContent>
        </Card>

        <Card className='shadow-xs border-emerald-200 bg-emerald-50/40'>
          <CardHeader className='pb-2 pt-3 px-4'>
            <CardTitle className='text-xs font-medium text-emerald-700'>
              Selesai Diterima
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-3'>
            <div className='text-2xl font-bold text-emerald-700'>{stats.diterima}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className='shadow-xs'>
        <CardContent className='p-4 space-y-3'>
          <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
            
            {/* Left Filter: Date picker with quick buttons */}
            <div className='flex flex-wrap items-center gap-2'>
              <Label className='text-xs font-medium text-muted-foreground whitespace-nowrap'>
                Tanggal:
              </Label>
              <Input
                type='date'
                value={filterTanggal}
                onChange={(e) => setFilterTanggal(e.target.value)}
                className='w-36 h-9 text-xs'
              />
              <Button
                variant={filterTanggal === todayStr ? 'default' : 'outline'}
                size='sm'
                onClick={() => setFilterTanggal(todayStr)}
                className='h-8 text-xs'
              >
                Hari Ini
              </Button>
              {filterTanggal && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setFilterTanggal('')}
                  className='h-8 text-xs text-muted-foreground'
                >
                  Semua Tanggal
                </Button>
              )}
            </div>

            {/* Right Filter: Search & Status */}
            <div className='flex flex-wrap items-center gap-2'>
              <div className='relative w-48 sm:w-64'>
                <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Cari no surat, klien, item...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-8 h-9 text-xs'
                />
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className='w-40 h-9 text-xs'>
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Semua Status</SelectItem>
                  <SelectItem value='draft'>Draft</SelectItem>
                  <SelectItem value='menunggu_approval'>Menunggu Approval</SelectItem>
                  <SelectItem value='diterima'>Diterima</SelectItem>
                  <SelectItem value='ditolak'>Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className='shadow-xs'>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow className='bg-muted/40'>
                <TableHead className='w-12 text-center'>No</TableHead>
                <TableHead className='w-40'>No Surat</TableHead>
                <TableHead className='w-28'>Tanggal</TableHead>
                {/* <TableHead className='w-36'>Kop Dokumen</TableHead> */}
                <TableHead>Diserahkan Oleh</TableHead>
                <TableHead>Diterima Oleh</TableHead>
                <TableHead className='text-center w-24'>Jml Item</TableHead>
                <TableHead className='w-40'>Status</TableHead>
                <TableHead className='text-right w-36'>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className='h-40 text-center'>
                    <Loader2 className='mx-auto h-6 w-6 animate-spin text-muted-foreground' />
                    <span className='mt-2 block text-xs text-muted-foreground'>Memuat data surat...</span>
                  </TableCell>
                </TableRow>
              ) : !listResponse?.data || listResponse.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className='h-32 text-center text-sm text-muted-foreground'>
                    Tidak ada surat serah terima gambar ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                listResponse.data.map((item, idx) => {
                  const kop = item.kop_surat;
                  const isoCode = kop?.nama_identitas_iso && kop?.nomor_identitas_iso 
                    ? `${kop.nama_identitas_iso} - ${kop.nomor_identitas_iso}` 
                    : (kop?.nomor_identitas_iso || 'STU - 004');

                  return (
                    <TableRow key={item.id} className='hover:bg-muted/30'>
                      <TableCell className='text-center font-medium text-xs'>
                        {((listResponse.current_page - 1) * listResponse.per_page) + idx + 1}
                      </TableCell>
                      <TableCell className='font-semibold text-xs text-blue-700'>
                        {item.nomor_surat}
                      </TableCell>
                      <TableCell className='text-xs whitespace-nowrap'>
                        {item.tanggal ? format(new Date(item.tanggal), 'dd MMM yyyy', { locale: idLocale }) : '-'}
                      </TableCell>
                      {/* <TableCell className='text-xs font-medium'>
                        <span className='rounded bg-slate-100 px-1.5 py-0.5 border text-slate-800 text-[11px] font-mono'>
                          {isoCode}
                        </span>
                      </TableCell> */}
                      <TableCell className='text-xs'>
                        <div className='font-medium'>{item.pengirim?.name || '-'}</div>
                        {item.pengirim?.tanda_tangan && (
                          <span className='text-[10px] text-emerald-600 font-medium flex items-center gap-0.5'>
                            ✓ Bertanda tangan
                          </span>
                        )}
                      </TableCell>
                      <TableCell className='text-xs'>
                        <div className='font-medium'>{item.penerima?.name || '-'}</div>
                        {item.status === 'diterima' && item.penerima?.tanda_tangan && (
                          <span className='text-[10px] text-emerald-600 font-medium flex items-center gap-0.5'>
                            ✓ Bertanda tangan
                          </span>
                        )}
                      </TableCell>
                      <TableCell className='text-center'>
                        <Badge variant='secondary' className='text-xs'>
                          {item.items?.length || 0} Item
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(item.status)}
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex items-center justify-end gap-1'>
                          {/* Detail Button */}
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => handleOpenDetail(item)}
                            title='Lihat Detail & Approval'
                            className='h-8 w-8 text-slate-600 hover:text-primary'
                          >
                            <Eye className='h-4 w-4' />
                          </Button>

                          {/* Print Button */}
                          <Button
                            variant='ghost'
                            size='icon'
                            asChild
                            title='Cetak Surat (STU-004)'
                            className='h-8 w-8 text-blue-600 hover:text-blue-800'
                          >
                            <Link
                              href={`/dashboard/projects-v2/serah-terima-gambar/${item.id}/print`}
                              target='_blank'
                            >
                              <Printer className='h-4 w-4' />
                            </Link>
                          </Button>

                          {/* Edit Button if Draft */}
                          {item.status === 'draft' && isEngineer && (
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() => handleOpenEdit(item)}
                              title='Edit Draft Surat'
                              className='h-8 w-8 text-amber-600 hover:text-amber-800'
                            >
                              <Pencil className='h-4 w-4' />
                            </Button>
                          )}

                          {/* Submit Button if Draft */}
                          {item.status === 'draft' && isEngineer && (
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() => submitMutation.mutate(item.id)}
                              title='Serahkan ke PPIC'
                              className='h-8 w-8 text-blue-600 hover:text-blue-800'
                            >
                              <Send className='h-4 w-4' />
                            </Button>
                          )}

                          {/* Delete Button if Draft */}
                          {item.status === 'draft' && (
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() => {
                                if (confirm(`Yakin ingin menghapus draft surat ${item.nomor_surat}?`)) {
                                  deleteMutation.mutate(item.id);
                                }
                              }}
                              title='Hapus Draft'
                              className='h-8 w-8 text-rose-500 hover:text-rose-700'
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination Footer */}
      {listResponse && listResponse.last_page > 1 && (
        <div className='flex items-center justify-between px-2 text-xs text-muted-foreground'>
          <div>
            Menampilkan halaman {listResponse.current_page} dari {listResponse.last_page} ({listResponse.total} surat)
          </div>
          <div className='flex items-center gap-1'>
            <Button
              variant='outline'
              size='sm'
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className='h-8 px-2'
            >
              Sebelumnya
            </Button>
            <Button
              variant='outline'
              size='sm'
              disabled={currentPage >= listResponse.last_page}
              onClick={() => setCurrentPage((p) => p + 1)}
              className='h-8 px-2'
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}

      {/* MODAL 1: Buat Surat Serah Terima */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className='min-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] flex flex-col p-6 overflow-hidden'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-lg'>
              <FileText className='h-5 w-5 text-blue-600' />
              {editingSuratId ? 'Edit Draft Surat Serah Terima Gambar' : 'Buat Surat Serah Terima Gambar Harian'}
            </DialogTitle>
            <DialogDescription>
              {editingSuratId
                ? 'Perbarui data tanggal, nomor surat, kop surat, atau daftar centang item yang diserahterimakan.'
                : 'Pilih tanggal dan centang item-item produk yang gambar kerjanya sudah selesai untuk diserahterimakan ke PPIC.'}
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
                      {projectGroups.length} Proyek
                    </Badge>
                  </div>
                  <p className='text-xs text-slate-500 mt-0.5'>
                    Klik baris proyek untuk melihat atau menyembunyikan item gambar kerja.
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
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={toggleSelectAllFiltered}
                    className='h-7 text-xs px-2 gap-1 bg-white font-medium text-blue-700 border-blue-200 hover:bg-blue-50'
                  >
                    <CheckSquare className='h-3.5 w-3.5' />
                    Pilih Semua
                  </Button>
                </div>
              </div>

              {/* Search Bar Panel Kiri */}
              <div className='relative shrink-0'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
                <Input
                  placeholder='Cari nama projek, nomor SPK, client, atau item...'
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
                    <p className='text-sm font-semibold text-slate-700'>Tidak Ada Gambar Kerja Siap Turun</p>
                    <p className='text-xs text-slate-500 mt-1 max-w-sm'>
                      Tidak ditemukan gambar kerja berstatus selesai yang belum diserahterimakan, atau hasil pencarian tidak cocok.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className='sticky top-0 bg-slate-100 z-10 shadow-2xs'>
                      <TableRow className='hover:bg-slate-100 text-[11px] font-semibold text-slate-700 uppercase'>
                        <TableHead className='w-10 text-center py-2'>#</TableHead>
                        <TableHead className='w-36 py-2'>Client</TableHead>
                        <TableHead className='w-36 py-2'>No SPK</TableHead>
                        <TableHead className='w-32 py-2 whitespace-nowrap'>SPK Masuk</TableHead>
                        <TableHead className='py-2'>Nama Proyek</TableHead>
                        <TableHead className='w-32 text-center py-2'>Item Terpilih</TableHead>
                        <TableHead className='w-28 text-center py-2'>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectGroups.map((proj) => {
                        const isExpanded = expandedProjectIds.includes(proj.project_id);
                        const projectItemIds = proj.items.map((i) => i.id);
                        const selectedCountInProj = projectItemIds.filter((id) => selectedItemIds.includes(id)).length;
                        const isAllSelectedInProj = proj.items.length > 0 && selectedCountInProj === proj.items.length;

                        return (
                          <React.Fragment key={proj.project_id}>
                            {/* Baris Utama Proyek (Parent Row) */}
                            <TableRow
                              className={`cursor-pointer select-none font-semibold transition-colors border-t border-slate-200 ${
                                selectedCountInProj > 0
                                  ? 'bg-blue-50/70 hover:bg-blue-100/60'
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
                                          <TableHead className='py-1.5'>Item Produk</TableHead>
                                          <TableHead className='w-16 text-center py-1.5'>Satuan</TableHead>
                                          <TableHead className='w-14 text-center py-1.5'>Jml</TableHead>
                                          <TableHead className='w-28 text-center py-1.5'>Tanggal Selesai</TableHead>
                                          <TableHead className='w-24 text-center py-1.5'>File PDF</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {proj.items.map((it) => {
                                          const isSelected = selectedItemIds.includes(it.id);
                                          return (
                                            <TableRow
                                              key={it.id}
                                              className={`cursor-pointer text-xs transition-colors ${
                                                isSelected ? 'bg-blue-50/70 hover:bg-blue-50' : 'hover:bg-slate-50'
                                              }`}
                                              onClick={() => toggleItemSelect(it.id)}
                                            >
                                              <TableCell className='text-center p-2'>
                                                <input
                                                  type='checkbox'
                                                  checked={isSelected}
                                                  onChange={() => toggleItemSelect(it.id)}
                                                  className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                                                  onClick={(e) => e.stopPropagation()}
                                                />
                                              </TableCell>
                                              <TableCell className='font-medium uppercase text-slate-800 p-2'>
                                                {it.item}
                                              </TableCell>
                                              <TableCell className='text-center p-2 font-medium text-slate-600'>
                                                {it.satuan}
                                              </TableCell>
                                              <TableCell className='text-center p-2 font-bold text-blue-700'>
                                                {it.jumlah}
                                              </TableCell>
                                              <TableCell className='text-center p-2 text-slate-700 whitespace-nowrap font-medium text-[11px]'>
                                                {it.tanggal_submit
                                                  ? format(new Date(it.tanggal_submit), 'dd MMM yyyy', { locale: idLocale })
                                                  : it.tanggal_selesai
                                                  ? format(new Date(it.tanggal_selesai), 'dd MMM yyyy', { locale: idLocale })
                                                  : '-'}
                                              </TableCell>
                                              <TableCell className='text-center p-2' onClick={(e) => e.stopPropagation()}>
                                                {it.file_gambar_kerja ? (
                                                  <a
                                                    href={it.file_gambar_kerja}
                                                    target='_blank'
                                                    rel='noreferrer'
                                                    className='inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-medium'
                                                  >
                                                    PDF <ExternalLink className='h-3 w-3' />
                                                  </a>
                                                ) : (
                                                  <span className='text-[10px] text-muted-foreground'>-</span>
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

            {/* PANEL KANAN: FORM SURAT & PREVIEW ITEM TERPILIH (5/12) */}
            <div className='lg:col-span-5 xl:col-span-4 flex flex-col h-full min-h-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 space-y-3.5 shadow-sm'>
              
              {/* Header Surat Form Fields */}
              <div className='space-y-2.5 pb-3 border-b border-slate-200 shrink-0'>
                <div className='flex items-center justify-between'>
                  <h4 className='text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5'>
                    <FileText className='h-4 w-4 text-blue-600' />
                    Informasi Surat Serah Terima
                  </h4>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
                  <div>
                    <Label className='text-[11px] font-semibold text-slate-700'>Tanggal Serah Terima *</Label>
                    <Input
                      type='date'
                      value={formTanggal}
                      onChange={(e) => setFormTanggal(e.target.value)}
                      className='mt-1 text-xs h-8'
                    />
                  </div>

                  <div>
                    <Label className='text-[11px] font-semibold text-slate-700'>Kop Surat Acuan</Label>
                    <Select value={formKopId} onValueChange={setFormKopId}>
                      <SelectTrigger className='mt-1 text-xs h-8'>
                        <SelectValue placeholder='Pilih Kop Surat' />
                      </SelectTrigger>
                      <SelectContent>
                        {kopSuratList?.map((k) => (
                          <SelectItem key={k.id} value={String(k.id)}>
                            {k.nama_kop} ({k.nama_identitas_iso || 'ISO'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className='text-[11px] font-semibold text-slate-700'>Nomor Surat (Opsional)</Label>
                  <Input
                    placeholder='Otomatis: STG/YYYYMMDD/...'
                    value={formNomorSurat}
                    onChange={(e) => setFormNomorSurat(e.target.value)}
                    className='mt-1 text-xs h-8'
                  />
                </div>

                <div>
                  <Label className='text-[11px] font-semibold text-slate-700'>Catatan Tambahan (Opsional)</Label>
                  <Textarea
                    placeholder='Catatan khusus untuk serah terima ini...'
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
                    {selectedItemIds.length} Item
                  </Badge>
                  <Badge variant='secondary' className='text-[11px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200'>
                    {totalSelectedUnits} Unit
                  </Badge>
                </div>

                {selectedItemIds.length > 0 && (
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
                      Centang item dari daftar proyek di sebelah kiri untuk menambahkannya ke surat serah terima ini.
                    </p>
                  </div>
                ) : (
                  selectedItemsDetails.map((it) => (
                    <div
                      key={it.id}
                      className='flex items-center justify-between p-2 rounded-md bg-white border border-slate-200 text-xs shadow-2xs hover:border-slate-300 transition-colors'
                    >
                      <div className='min-w-0 flex-1 pr-2'>
                        <div className='flex items-center gap-1.5'>
                          <span className='font-bold text-slate-800 truncate uppercase'>{it.item}</span>
                          <Badge variant='outline' className='text-[10px] font-semibold text-blue-700 bg-blue-50 border-blue-200 px-1 py-0'>
                            {it.jumlah} {it.satuan}
                          </Badge>
                        </div>
                        <div className='flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 truncate'>
                          <span className='font-medium text-slate-600 truncate'>{it.project_name}</span>
                          <span>•</span>
                          <span className='truncate'>{it.client_name}</span>
                          <span>•</span>
                          <span className='truncate'>SPK: {it.nomor_spk}</span>
                        </div>
                      </div>

                      <div className='flex items-center gap-1 shrink-0'>
                        {it.file_gambar_kerja && (
                          <a
                            href={it.file_gambar_kerja}
                            target='_blank'
                            rel='noreferrer'
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
                          onClick={() => removeItemSelect(it.id)}
                          className='h-6 w-6 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded'
                          title='Hapus dari serah terima'
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
                    setEditingSuratId(null);
                  }}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className='w-full sm:w-auto h-9 text-xs'
                >
                  Batal
                </Button>

                <div className='flex items-center gap-2 w-full sm:w-auto'>
                  <Button
                    type='button'
                    variant='secondary'
                    size='sm'
                    onClick={() => {
                      if (editingSuratId) {
                        updateMutation.mutate({ id: editingSuratId, langsung_kirim: false });
                      } else {
                        createMutation.mutate({ langsung_kirim: false });
                      }
                    }}
                    disabled={createMutation.isPending || updateMutation.isPending || selectedItemIds.length === 0}
                    className='flex-1 sm:flex-none h-9 text-xs'
                  >
                    {editingSuratId ? 'Simpan Perubahan' : 'Simpan Draft'}
                  </Button>

                  <Button
                    type='button'
                    size='sm'
                    onClick={() => {
                      if (editingSuratId) {
                        updateMutation.mutate({ id: editingSuratId, langsung_kirim: true });
                      } else {
                        createMutation.mutate({ langsung_kirim: true });
                      }
                    }}
                    disabled={createMutation.isPending || updateMutation.isPending || selectedItemIds.length === 0}
                    className='flex-1 sm:flex-none h-9 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? (
                      <Loader2 className='h-3.5 w-3.5 animate-spin' />
                    ) : (
                      <Send className='h-3.5 w-3.5' />
                    )}
                    {editingSuratId ? 'Simpan & Kirim PPIC' : 'Kirim ke PPIC'}
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Detail & Approval PPIC */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className='min-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] flex flex-col p-6 overflow-hidden'>
          {selectedSurat && (
            <>
              <DialogHeader>
                <div className='flex items-center justify-between pr-6'>
                  <DialogTitle className='flex items-center gap-2 text-lg'>
                    <FileText className='h-5 w-5 text-primary' />
                    Detail Surat Serah Terima Gambar
                  </DialogTitle>
                  <div>{getStatusBadge(selectedSurat.status)}</div>
                </div>
                <DialogDescription>
                  Nomor Surat: <strong>{selectedSurat.nomor_surat}</strong> • Tanggal: {selectedSurat.tanggal}
                </DialogDescription>
              </DialogHeader>

              <div className='space-y-4 py-2 flex-1 overflow-y-auto pr-1'>
                
                {/* Meta details */}
                <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg border bg-slate-50/50 p-3 text-xs'>
                  <div>
                    <span className='text-muted-foreground block text-[11px]'>Kop Surat ISO:</span>
                    <strong className='font-mono'>
                      {selectedSurat.kop_surat?.nama_identitas_iso || 'STU'} - {selectedSurat.kop_surat?.nomor_identitas_iso || '004'}
                    </strong>
                  </div>
                  <div>
                    <span className='text-muted-foreground block text-[11px]'>Diserahkan Oleh:</span>
                    <strong>{selectedSurat.pengirim?.name || '-'}</strong>
                  </div>
                  <div>
                    <span className='text-muted-foreground block text-[11px]'>Diterima Oleh (PPIC):</span>
                    <strong>{selectedSurat.penerima?.name || '-'}</strong>
                  </div>
                  <div>
                    <span className='text-muted-foreground block text-[11px]'>Waktu Terima:</span>
                    <strong>
                      {selectedSurat.tanggal_terima ? format(new Date(selectedSurat.tanggal_terima), 'dd/MM/yyyy HH:mm') : '-'}
                    </strong>
                  </div>
                </div>

                {/* Items Table */}
                <div className='rounded-lg border space-y-2 p-3 bg-white'>
                  <Label className='text-xs font-bold uppercase tracking-wider text-slate-700'>
                    Daftar Item Gambar Kerja ({groupedDetailItems.length} Jenis Item)
                  </Label>
                  
                  <div className='max-h-[45vh] min-h-[280px] overflow-y-auto rounded border'>
                    <Table>
                      <TableHeader>
                        <TableRow className='bg-muted/50 text-[11px]'>
                          <TableHead className='w-10 text-center'>No</TableHead>
                          <TableHead className='w-40'>Konsumen</TableHead>
                          <TableHead className='w-24'>SPK</TableHead>
                          <TableHead>Item Produk</TableHead>
                          <TableHead className='w-16 text-center'>Satuan</TableHead>
                          <TableHead className='w-14 text-center'>Jml</TableHead>
                          <TableHead className='w-28 text-center'>Tanggal Submit</TableHead>
                          <TableHead className='w-24 text-center'>Gambar PDF</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupedDetailItems.map((it, idx) => {
                          return (
                            <TableRow key={`detail-grp-${idx}`} className='text-xs'>
                              <TableCell className='text-center font-medium p-2'>{idx + 1}</TableCell>
                              <TableCell className='font-bold uppercase text-slate-800 p-2'>
                                {it.client_name}
                              </TableCell>
                              <TableCell className='font-medium text-slate-600 p-2'>
                                {it.nomor_spk}
                              </TableCell>
                              <TableCell className='font-medium uppercase text-slate-800 p-2'>
                                <div className='flex items-center gap-1.5 flex-wrap'>
                                  <span>{it.item}</span>
                                  {it.sub_item_count > 1 && (
                                    <Badge variant='outline' className='text-[10px] bg-blue-50 text-blue-700 border-blue-200 px-1 py-0'>
                                      {it.sub_item_count} baris digabung
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className='text-center p-2 font-medium'>
                                {it.satuan}
                              </TableCell>
                              <TableCell className='text-center p-2 font-bold text-blue-700'>
                                {it.total_jumlah}
                              </TableCell>
                              <TableCell className='text-center p-2 text-slate-700 whitespace-nowrap font-medium text-[11px]'>
                                {it.submit_date ? format(new Date(it.submit_date), 'dd MMM yyyy', { locale: idLocale }) : '-'}
                              </TableCell>
                              <TableCell className='text-center p-2'>
                                {it.file_url ? (
                                  <a
                                    href={it.file_url}
                                    target='_blank'
                                    rel='noreferrer'
                                    className='inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-semibold'
                                  >
                                    Buka PDF <ExternalLink className='h-3 w-3' />
                                  </a>
                                ) : (
                                  <span className='text-[10px] text-muted-foreground'>-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Signatures Preview Block */}
                <div className='grid grid-cols-2 gap-4 rounded-lg border p-4 bg-slate-50/50'>
                  
                  {/* Pengirim (Engineer) */}
                  <div className='text-center border-r pr-4'>
                    <span className='text-xs text-muted-foreground block font-medium'>Diserahkan oleh (Engineer):</span>
                    <div className='my-2 flex h-20 items-center justify-center'>
                      {selectedSurat.pengirim?.tanda_tangan?.file_url ? (
                        <img
                          src={selectedSurat.pengirim.tanda_tangan.file_url}
                          alt='TTD Pengirim'
                          className='max-h-16 object-contain'
                        />
                      ) : (
                        <span className='text-xs text-muted-foreground italic'>(Belum ada tanda tangan)</span>
                      )}
                    </div>
                    <span className='font-bold text-xs uppercase underline block'>
                      {selectedSurat.pengirim?.name || '-'}
                    </span>
                    <span className='text-[11px] text-muted-foreground block'>
                      Tgl: {selectedSurat.tanggal_kirim ? format(new Date(selectedSurat.tanggal_kirim), 'dd/MM/yyyy') : '-'}
                    </span>
                  </div>

                  {/* Penerima (PPIC) */}
                  <div className='text-center pl-4'>
                    <span className='text-xs text-muted-foreground block font-medium'>Diterima oleh (PPIC):</span>
                    <div className='my-2 flex h-20 items-center justify-center'>
                      {selectedSurat.status === 'diterima' && selectedSurat.penerima?.tanda_tangan?.file_url ? (
                        <img
                          src={selectedSurat.penerima.tanda_tangan.file_url}
                          alt='TTD Penerima'
                          className='max-h-16 object-contain'
                        />
                      ) : (
                        <span className='text-xs text-amber-600 font-medium italic'>
                          {selectedSurat.status === 'menunggu_approval' ? 'Menunggu Approval PPIC' : '-'}
                        </span>
                      )}
                    </div>
                    <span className='font-bold text-xs uppercase underline block'>
                      {selectedSurat.penerima?.name || '........................'}
                    </span>
                    <span className='text-[11px] text-muted-foreground block'>
                      Tgl: {selectedSurat.tanggal_terima ? format(new Date(selectedSurat.tanggal_terima), 'dd/MM/yyyy') : '-'}
                    </span>
                  </div>

                </div>

                {selectedSurat.catatan && (
                  <div className='rounded border bg-amber-50/50 p-2.5 text-xs text-amber-900'>
                    <strong>Catatan:</strong> {selectedSurat.catatan}
                  </div>
                )}

              </div>

              <DialogFooter className='gap-2 sm:gap-0 pt-2 border-t'>
                <div className='flex items-center gap-2 mr-auto'>
                  <Button
                    variant='outline'
                    size='sm'
                    asChild
                    className='gap-1.5'
                  >
                    <Link
                      href={`/dashboard/projects-v2/serah-terima-gambar/${selectedSurat.id}/print`}
                      target='_blank'
                    >
                      <Printer className='h-4 w-4 text-blue-600' />
                      Cetak Dokumen (STU-004)
                    </Link>
                  </Button>
                </div>

                <div className='flex gap-2'>
                  {selectedSurat.status === 'draft' && isEngineer && (
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => handleOpenEdit(selectedSurat)}
                      className='gap-1.5 text-amber-600 hover:text-amber-800 border-amber-300 hover:bg-amber-50'
                    >
                      <Pencil className='h-4 w-4' />
                      Edit Draft
                    </Button>
                  )}

                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setDetailModalOpen(false)}
                  >
                    Tutup
                  </Button>

                  {/* Approval Actions for PPIC */}
                  {selectedSurat.status === 'menunggu_approval' && isPPIC && (
                    <>
                      <Button
                        type='button'
                        variant='destructive'
                        size='sm'
                        onClick={() => {
                          setRejectCatatan('');
                          setRejectModalOpen(true);
                        }}
                      >
                        Tolak / Minta Revisi
                      </Button>
                      <Button
                        type='button'
                        size='sm'
                        onClick={() => approveMutation.mutate(selectedSurat.id)}
                        disabled={approveMutation.isPending}
                        className='gap-1.5 bg-emerald-600 hover:bg-emerald-700'
                      >
                        {approveMutation.isPending ? (
                          <Loader2 className='h-4 w-4 animate-spin' />
                        ) : (
                          <CheckCircle2 className='h-4 w-4' />
                        )}
                        Setujui & Terima Gambar
                      </Button>
                    </>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 3: Reject Dialog */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-destructive flex items-center gap-2'>
              <AlertCircle className='h-5 w-5' />
              Tolak Serah Terima Gambar
            </DialogTitle>
            <DialogDescription>
              Berikan catatan atau alasan penolakan gambar agar tim Engineer dapat melakukan revisi/perbaikan.
            </DialogDescription>
          </DialogHeader>

          <div className='py-2'>
            <Label className='text-xs font-semibold'>Alasan Penolakan / Catatan Revisi *</Label>
            <Textarea
              placeholder='Contoh: Gambar kerja item lemari belum ada detail ukuran...'
              value={rejectCatatan}
              onChange={(e) => setRejectCatatan(e.target.value)}
              className='mt-1 text-xs h-24'
            />
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setRejectModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant='destructive'
              onClick={() => {
                if (!rejectCatatan.trim()) {
                  toast.error('Catatan penolakan wajib diisi');
                  return;
                }
                if (selectedSurat) {
                  rejectMutation.mutate({ id: selectedSurat.id, catatan: rejectCatatan });
                }
              }}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending && <Loader2 className='mr-1.5 h-4 w-4 animate-spin' />}
              Konfirmasi Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 4: User Signature Dialog */}
      <SignatureDialog
        open={signatureModalOpen}
        onOpenChange={setSignatureModalOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['surat-serah-terima-list'] });
          if (selectedSurat) {
            suratSerahTerimaService.getDetail(selectedSurat.id).then(setSelectedSurat);
          }
        }}
      />

    </div>
  );
}
