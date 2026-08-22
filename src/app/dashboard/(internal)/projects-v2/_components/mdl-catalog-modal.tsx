'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  Search,
  X,
  Package,
  Check,
  Database,
  Filter,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  Info,
  ChevronsUpDown,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

import { MdlService, Mdl } from '@/features/mdl/services/mdl-service';
import { KategoriMDLService } from '@/features/kategori-mdl/services/kategori-mdl-service';
import { SubKategoriMDLService } from '@/features/sub-kategori-mdl/services/sub-kategori-mdl-service';
import { projectV2Service } from '@/features/projects/services/project-v2-service';

interface MdlCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
}

function ItemThumbnail({ src, alt }: { src?: string | null; alt?: string }) {
  const [hasError, setHasError] = React.useState(false);

  if (src && !hasError) {
    const fullUrl = src.startsWith('http')
      ? src
      : `${process.env.NEXT_PUBLIC_API_URL || ''}/${src}`;
    return (
      <img
        src={fullUrl}
        alt={alt || 'Item'}
        className='w-full h-full object-cover'
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div className='w-full h-full bg-amber-50/70 flex items-center justify-center text-amber-500'>
      <Package className='w-6 h-6 stroke-[1.5]' />
    </div>
  );
}

export function MdlCatalogModal({
  isOpen,
  onClose,
  projectId,
}: MdlCatalogModalProps) {
  const queryClient = useQueryClient();

  // Filter state
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [selectedKategoriId, setSelectedKategoriId] =
    React.useState<string>('all');
  const [selectedSubKategoriId, setSelectedSubKategoriId] =
    React.useState<string>('all');
  const [selectedLokasiId, setSelectedLokasiId] = React.useState<string>('all');
  const [selectedLokasiNama, setSelectedLokasiNama] = React.useState<string>('');
  const [filterPopoverOpen, setFilterPopoverOpen] = React.useState(false);
  const [lokasiOpen, setLokasiOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);

  // Collapsed Area Groups
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(
    new Set()
  );

  // Collapsed Sidebar Room Groups (Ringkasan Item Terpilih)
  const [collapsedSidebarGroups, setCollapsedSidebarGroups] =
    React.useState<Set<string>>(new Set());

  // Selection state & items details cache for sidebar summary
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set());
  const [selectedCache, setSelectedCache] = React.useState<Map<number, Mdl>>(
    new Map()
  );
  const [qtyMap, setQtyMap] = React.useState<Record<number, number>>({});

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset filters & selection when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setDebouncedSearch('');
      setSelectedKategoriId('all');
      setSelectedSubKategoriId('all');
      setSelectedLokasiId('all');
      setSelectedLokasiNama('');
      setPage(1);
      setSelectedIds(new Set());
      setSelectedCache(new Map());
      setQtyMap({});
      setCollapsedGroups(new Set());
      setCollapsedSidebarGroups(new Set());
    }
  }, [isOpen]);

  // Queries — dropdown options
  const { data: kategoriRes } = useQuery({
    queryKey: ['kategori-mdl-options'],
    queryFn: () => KategoriMDLService.getKategori({ per_page: -1 }),
    enabled: isOpen,
  });

  const { data: subKategoriRes } = useQuery({
    queryKey: ['sub-kategori-mdl-options'],
    queryFn: () => SubKategoriMDLService.getSubKategori({ per_page: -1 }),
    enabled: isOpen,
  });

  const kategoriOptions = kategoriRes?.data || [];
  const subKategoriOptions = subKategoriRes?.data || [];

  // Query — ambil MDL untuk filter lokasi
  const { data: mdlForLokasiRes } = useQuery({
    queryKey: [
      'mdl-lokasi-filter',
      selectedKategoriId,
      selectedSubKategoriId,
    ],
    queryFn: () =>
      MdlService.getMdl({
        per_page: 500,
        kategori_mdl_id:
          selectedKategoriId !== 'all' ? parseInt(selectedKategoriId) : undefined,
        sub_kategori_mdl_id:
          selectedSubKategoriId !== 'all'
            ? parseInt(selectedSubKategoriId)
            : undefined,
      }),
    enabled: isOpen && (lokasiOpen || filterPopoverOpen),
  });

  const lokasiOptions = React.useMemo(() => {
    const items = mdlForLokasiRes?.data;
    if (!items) return [];
    const seen = new Set<number>();
    const result: Array<{ id: number; nama: string; kode: string }> = [];
    items.forEach((mdl) => {
      if (mdl.lokasi_mdl && !seen.has(mdl.lokasi_mdl.id)) {
        seen.add(mdl.lokasi_mdl.id);
        result.push(mdl.lokasi_mdl as { id: number; nama: string; kode: string });
      }
    });
    return result.sort((a, b) => a.nama.localeCompare(b.nama));
  }, [mdlForLokasiRes]);

  // Query — MDL table data with filters
  const { data: mdlResponse, isLoading: isLoadingMdl } = useQuery({
    queryKey: [
      'mdl-catalog-v2',
      page,
      debouncedSearch,
      selectedKategoriId,
      selectedSubKategoriId,
      selectedLokasiId,
    ],
    queryFn: () =>
      MdlService.getMdl({
        page,
        per_page: 15,
        search: debouncedSearch || undefined,
        kategori_mdl_id:
          selectedKategoriId !== 'all'
            ? parseInt(selectedKategoriId)
            : undefined,
        sub_kategori_mdl_id:
          selectedSubKategoriId !== 'all'
            ? parseInt(selectedSubKategoriId)
            : undefined,
        lokasi_mdl_id:
          selectedLokasiId !== 'all' ? parseInt(selectedLokasiId) : undefined,
      }),
    enabled: isOpen,
  });

  const mdlList = React.useMemo(() => mdlResponse?.data ?? [], [mdlResponse]);
  const meta = mdlResponse?.meta || { current_page: 1, last_page: 1, total: 0 };

  // Sync selected cache when items load
  React.useEffect(() => {
    if (mdlList.length > 0) {
      setSelectedCache((prev) => {
        const next = new Map(prev);
        mdlList.forEach((item) => {
          if (selectedIds.has(item.id)) {
            next.set(item.id, item);
          }
        });
        return next;
      });
    }
  }, [mdlList, selectedIds]);

  // Group MDL items by Area / Location
  const groupedMdl = React.useMemo(() => {
    const groups: Record<string, Mdl[]> = {};

    mdlList.forEach((mdl) => {
      const locationName = mdl.lokasi_mdl?.nama || 'General';
      const lantaiText = mdl.lantai ? ` - ${mdl.lantai}` : '';
      const key = `Area: ${locationName}${lantaiText} (Summary)`;

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(mdl);
    });

    return groups;
  }, [mdlList]);

  // Mutation — save selected MDL items as project items
  const saveMutation = useMutation({
    mutationFn: (items: any[]) =>
      projectV2Service.createProjectItemsBulk(projectId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-v2-items', projectId],
      });
      toast.success(`Berhasil menambahkan ${selectedIds.size} item ke project`);
      onClose();
    },
    onError: () => {
      toast.error('Gagal menambahkan item ke project');
    },
  });

  // Handlers
  const toggleSelect = (mdl: Mdl) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(mdl.id)) {
        next.delete(mdl.id);
        setSelectedCache((c) => {
          const nc = new Map(c);
          nc.delete(mdl.id);
          return nc;
        });
      } else {
        next.add(mdl.id);
        setSelectedCache((c) => new Map(c).set(mdl.id, mdl));
        if (!qtyMap[mdl.id]) {
          setQtyMap((q) => ({ ...q, [mdl.id]: 1 }));
        }
      }
      return next;
    });
  };

  const updateQty = (id: number, delta: number) => {
    setQtyMap((prev) => {
      const current = prev[id] ?? 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const setQtyDirect = (id: number, val: number) => {
    setQtyMap((prev) => ({ ...prev, [id]: Math.max(1, val) }));
  };

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  const toggleSidebarGroupCollapse = (groupKey: string) => {
    setCollapsedSidebarGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  const handleClearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setSelectedKategoriId('all');
    setSelectedSubKategoriId('all');
    setSelectedLokasiId('all');
    setSelectedLokasiNama('');
    setPage(1);
  };

  const handleSave = () => {
    if (selectedIds.size === 0) {
      toast.error('Pilih minimal satu item');
      return;
    }

    const itemsToSave: any[] = [];
    selectedIds.forEach((id) => {
      const mdl = selectedCache.get(id);
      if (mdl) {
        itemsToSave.push({
          mdl_id: mdl.id,
          item: mdl.barang?.nama || mdl.kode_mdl || '-',
          jumlah: qtyMap[mdl.id] ?? 1,
          lantai: mdl.lantai || null,
          ruang: mdl.lokasi_mdl?.nama || null,
          keterangan: mdl.barang?.spesifikasi || null,
          satuan: mdl.barang?.satuan || 'UNIT',
          harga: mdl.barang?.harga ?? null,
          panjang: mdl.barang?.panjang ?? null,
          lebar: mdl.barang?.lebar ?? null,
          tinggi: mdl.barang?.tinggi ?? null,
          divisi_id: null,
        });
      }
    });

    saveMutation.mutate(itemsToSave);
  };

  const formatRupiah = (value?: number | null) => {
    if (value == null) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const hasActiveFilters =
    selectedKategoriId !== 'all' ||
    selectedSubKategoriId !== 'all' ||
    selectedLokasiId !== 'all' ||
    !!debouncedSearch;

  // Compute summary total
  const selectedItemsList = React.useMemo(() => {
    const list: Mdl[] = [];
    selectedIds.forEach((id) => {
      const item = selectedCache.get(id);
      if (item) list.push(item);
    });
    return list;
  }, [selectedIds, selectedCache]);

  // Group selected items by Ruang / Lokasi
  const groupedSelectedItems = React.useMemo(() => {
    const groups: Record<string, Mdl[]> = {};

    selectedItemsList.forEach((item) => {
      const roomName = item.lokasi_mdl?.nama || 'General';
      const lantaiText = item.lantai ? ` - ${item.lantai}` : '';
      const key = `Ruang: ${roomName}${lantaiText}`;

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    return groups;
  }, [selectedItemsList]);

  const totalHarga = React.useMemo(() => {
    return selectedItemsList.reduce((sum, item) => {
      const qty = qtyMap[item.id] ?? 1;
      const price = item.barang?.harga ?? 0;
      return sum + price * qty;
    }, 0);
  }, [selectedItemsList, qtyMap]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='min-w-[calc(100vw-2rem)] w-[calc(100vw-2rem)] max-w-none h-[calc(100vh-2rem)] flex flex-col gap-0 p-0 overflow-hidden border-0 shadow-2xl rounded-2xl'>
        {/* Header Bar */}
        <div className='bg-white border-b border-neutral-200/80 px-6 py-3.5 flex items-center justify-between shrink-0 z-10'>
          <div className='flex items-center gap-3.5'>
            <div className='h-10 w-10 rounded-2xl bg-orange-50 border border-orange-200/60 flex items-center justify-center shrink-0'>
              <Database className='h-5 w-5 text-orange-600' />
            </div>
            <div>
              <DialogTitle className='text-lg font-bold tracking-tight text-neutral-800'>
                Add Item V2 — MDL Catalog
              </DialogTitle>
              <p className='text-xs text-neutral-400 mt-0.5 font-normal'>
                Pilih item dari data MDL untuk ditambahkan ke project
              </p>
            </div>
          </div>

          <div className='flex items-center gap-3'>
            <div className='bg-orange-50 border border-orange-200/80 text-orange-700 text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-1.5'>
              <span className='w-2 h-2 rounded-full bg-orange-500' />
              <span>{selectedIds.size} item dipilih</span>
            </div>

            <Button
              onClick={handleSave}
              disabled={selectedIds.size === 0 || saveMutation.isPending}
              className='bg-[#f05a24] hover:bg-[#d94e1f] text-white font-medium text-xs rounded-full px-6 py-2 transition-all shadow-xs flex items-center gap-1.5'
            >
              {saveMutation.isPending ? (
                <Loader2 className='w-4 h-4 mr-1 animate-spin' />
              ) : (
                <Check className='w-4 h-4 mr-1' />
              )}
              Simpan ke Project
            </Button>

            <button
              onClick={onClose}
              className='h-8 w-8 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full flex items-center justify-center transition-colors'
            >
              <X className='w-5 h-5' />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className='bg-white border-b border-neutral-200/80 px-6 py-2.5 flex items-center gap-3 shrink-0'>
          <Filter className='h-4 w-4 text-neutral-400 shrink-0' />

          {/* Search Input */}
          <div className='relative min-w-[240px] flex-1 max-w-sm'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400' />
            <Input
              placeholder='Cari nama barang, kode MDL...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-9 pr-8 h-9 text-xs bg-neutral-50/60 border-neutral-200 rounded-xl focus:bg-white transition-colors'
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className='absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600'
              >
                <X className='h-3.5 w-3.5' />
              </button>
            )}
          </div>

          {/* Filter Popover Dropdown ("Filter v") */}
          <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className='h-9 px-4 text-xs font-medium border-neutral-200 text-neutral-700 bg-white hover:bg-neutral-50 rounded-xl gap-2 shadow-xs'
              >
                <span>Filter</span>
                <ChevronDown className='h-3.5 w-3.5 text-neutral-400' />
                {hasActiveFilters && (
                  <span className='w-2 h-2 rounded-full bg-orange-500' />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-72 p-4 space-y-3.5' align='start'>
              <div className='text-xs font-bold text-neutral-800 border-b pb-2 flex items-center justify-between'>
                <span>Filter Data MDL</span>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className='text-[11px] text-orange-600 hover:underline font-normal'
                  >
                    Reset Filter
                  </button>
                )}
              </div>

              {/* Category */}
              <div className='space-y-1'>
                <label className='text-[11px] font-medium text-neutral-500'>
                  Category
                </label>
                <Select
                  value={selectedKategoriId}
                  onValueChange={(v) => {
                    setSelectedKategoriId(v);
                    setSelectedSubKategoriId('all');
                    setPage(1);
                  }}
                >
                  <SelectTrigger className='h-9 w-full bg-white text-xs border-neutral-200 rounded-lg'>
                    <SelectValue placeholder='Semua Category' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Semua Category</SelectItem>
                    {kategoriOptions.map((k) => (
                      <SelectItem key={k.id} value={k.id.toString()}>
                        {k.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sub Category */}
              <div className='space-y-1'>
                <label className='text-[11px] font-medium text-neutral-500'>
                  Sub Category
                </label>
                <Select
                  value={selectedSubKategoriId}
                  onValueChange={(v) => {
                    setSelectedSubKategoriId(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className='h-9 w-full bg-white text-xs border-neutral-200 rounded-lg'>
                    <SelectValue placeholder='Semua Sub Category' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Semua Sub Category</SelectItem>
                    {subKategoriOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div className='space-y-1'>
                <label className='text-[11px] font-medium text-neutral-500'>
                  Location
                </label>
                <Popover open={lokasiOpen} onOpenChange={setLokasiOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      role='combobox'
                      className='h-9 w-full justify-between bg-white border-neutral-200 text-xs font-normal rounded-lg'
                    >
                      <span className='truncate'>
                        {selectedLokasiId === 'all'
                          ? 'Semua Location'
                          : selectedLokasiNama || 'Semua Location'}
                      </span>
                      <ChevronsUpDown className='ml-2 h-3.5 w-3.5 shrink-0 opacity-50' />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-60 p-0' align='start'>
                    <Command>
                      <CommandInput
                        placeholder='Cari lokasi...'
                        className='h-8 text-xs'
                      />
                      <CommandList>
                        <CommandEmpty className='py-2 text-center text-xs text-neutral-500'>
                          Lokasi tidak ditemukan
                        </CommandEmpty>
                        <CommandGroup className='max-h-48 overflow-y-auto'>
                          <CommandItem
                            value='all'
                            onSelect={() => {
                              setSelectedLokasiId('all');
                              setSelectedLokasiNama('');
                              setPage(1);
                              setLokasiOpen(false);
                            }}
                            className='text-xs'
                          >
                            <Check
                              className={cn(
                                'mr-2 h-3.5 w-3.5',
                                selectedLokasiId === 'all'
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )}
                            />
                            Semua Location
                          </CommandItem>
                          {lokasiOptions.map((l) => (
                            <CommandItem
                              key={l.id}
                              value={l.nama}
                              onSelect={() => {
                                setSelectedLokasiId(l.id.toString());
                                setSelectedLokasiNama(l.nama);
                                setPage(1);
                                setLokasiOpen(false);
                              }}
                              className='text-xs'
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-3.5 w-3.5',
                                  selectedLokasiId === l.id.toString()
                                    ? 'opacity-100'
                                    : 'opacity-0'
                                )}
                              />
                              {l.nama}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </PopoverContent>
          </Popover>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className='text-xs text-neutral-500 hover:text-neutral-800 underline underline-offset-2 ml-1'
            >
              Reset Filter
            </button>
          )}

          <p className='ml-auto text-xs text-neutral-400 shrink-0'>
            Total: <span className='font-semibold text-neutral-700'>{meta.total}</span> data
          </p>
        </div>

        {/* Main Split Layout */}
        <div className='flex-1 flex overflow-hidden bg-[#f8f9fa]'>
          {/* Left Column — Item Catalog List & Area Groups */}
          <div className='flex-1 flex flex-col overflow-hidden border-r border-neutral-200/80'>
            {/* Header Columns bar */}
            <div className='px-6 py-2.5 bg-neutral-100/60 border-b border-neutral-200/60 flex items-center text-[11px] font-bold text-neutral-400 tracking-wider uppercase shrink-0'>
              <div className='flex-1 min-w-0 pr-4'>
                <span>ITEM DETAILS</span>
              </div>
              <div className='w-44 text-left px-2 shrink-0'>
                <span>DIMENSI (METER)</span>
              </div>
              <div className='w-32 text-right px-2 shrink-0'>
                <span>HARGA</span>
              </div>
              <div className='w-28 text-center pl-4 shrink-0'>
                <span>QTY</span>
              </div>
            </div>

            {/* Scrollable Catalog List */}
            <div className='flex-1 overflow-y-auto px-6 py-4 space-y-5'>
              {isLoadingMdl ? (
                <div className='h-64 flex flex-col items-center justify-center gap-3 text-neutral-400'>
                  <Loader2 className='h-6 w-6 animate-spin text-orange-500' />
                  <span className='text-xs font-medium'>Memuat catalog MDL...</span>
                </div>
              ) : mdlList.length === 0 ? (
                <div className='h-64 flex flex-col items-center justify-center gap-2 text-neutral-400'>
                  <Package className='h-10 w-10 text-neutral-300 stroke-[1.5]' />
                  <p className='text-sm font-semibold text-neutral-700'>
                    Tidak ada data MDL
                  </p>
                  <p className='text-xs text-neutral-400'>
                    Coba ubah kata kunci pencarian atau filter yang diterapkan
                  </p>
                </div>
              ) : (
                Object.entries(groupedMdl).map(([groupKey, items]) => {
                  const isCollapsed = collapsedGroups.has(groupKey);

                  return (
                    <div key={groupKey} className='space-y-2.5'>
                      {/* Area Group Header */}
                      <button
                        onClick={() => toggleGroupCollapse(groupKey)}
                        className='w-full flex items-center gap-2 text-xs font-semibold text-neutral-700 hover:text-orange-600 transition-colors select-none text-left py-1'
                      >
                        {isCollapsed ? (
                          <ChevronRight className='w-4 h-4 text-neutral-400' />
                        ) : (
                          <ChevronDown className='w-4 h-4 text-neutral-500' />
                        )}
                        <span>{groupKey}</span>
                      </button>

                      {/* Items Cards in Group */}
                      {!isCollapsed && (
                        <div className='space-y-2.5'>
                          {items.map((mdl) => {
                            const isSelected = selectedIds.has(mdl.id);
                            const currentQty = qtyMap[mdl.id] ?? 1;

                            // Formatted dimensions
                            const dimensions =
                              mdl.barang?.panjang ||
                              mdl.barang?.lebar ||
                              mdl.barang?.tinggi
                                ? [
                                    mdl.barang.panjang ?? '0',
                                    mdl.barang.lebar ?? '0',
                                    mdl.barang.tinggi ?? '0',
                                  ].join(' x ') + ' m'
                                : '-';

                            const specs =
                              mdl.barang?.spesifikasi ||
                              mdl.sub_kategori_mdl?.nama ||
                              '-';

                            return (
                              <div
                                key={mdl.id}
                                onClick={() => toggleSelect(mdl)}
                                className={cn(
                                  'bg-white border rounded-2xl p-4 transition-all duration-200 cursor-pointer flex items-center gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-neutral-300',
                                  isSelected
                                    ? 'border-orange-300 bg-orange-50/20 ring-1 ring-orange-400/30'
                                    : 'border-neutral-200/90'
                                )}
                              >
                                {/* Checkbox */}
                                <div
                                  className='shrink-0'
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type='button'
                                    onClick={() => toggleSelect(mdl)}
                                    className={cn(
                                      'w-5 h-5 rounded-md border flex items-center justify-center transition-all',
                                      isSelected
                                        ? 'bg-[#f05a24] border-[#f05a24] text-white shadow-xs'
                                        : 'bg-white border-neutral-300 hover:border-orange-400'
                                    )}
                                  >
                                    {isSelected && <Check className='w-3.5 h-3.5 stroke-[3]' />}
                                  </button>
                                </div>

                                {/* Item Image Thumbnail */}
                                <div className='w-14 h-14 rounded-xl bg-neutral-50 border border-neutral-200/80 overflow-hidden shrink-0 flex items-center justify-center relative'>
                                  <ItemThumbnail
                                    src={mdl.foto || mdl.barang?.foto}
                                    alt={mdl.barang?.nama || 'MDL Item'}
                                  />
                                </div>

                                {/* Item Identity Info */}
                                <div className='flex-1 min-w-0 pr-2'>
                                  <div className='flex items-center gap-2'>
                                    <h4 className='font-semibold text-sm text-neutral-800 truncate'>
                                      {mdl.barang?.nama || 'Tanpa Nama'}
                                    </h4>
                                  </div>
                                  <p className='text-[11px] font-mono text-neutral-400 mt-0.5 truncate uppercase'>
                                    {mdl.kode_mdl || '-'}
                                  </p>
                                </div>

                                {/* Spec Info Icon */}
                                <div
                                  className='flex items-center gap-1.5 text-xs text-neutral-500 max-w-[180px] shrink-0'
                                  title={specs}
                                >
                                  <span className='w-4 h-4 rounded-full bg-neutral-100 flex items-center justify-center text-[10px] font-bold text-neutral-400 shrink-0 border border-neutral-200/60'>
                                    i
                                  </span>
                                  <span className='truncate text-[11px] text-neutral-600'>
                                    {specs}
                                  </span>
                                </div>

                                {/* Dimensi Column */}
                                <div className='w-44 text-xs font-medium text-neutral-700 whitespace-nowrap px-2 shrink-0'>
                                  {dimensions}
                                </div>

                                {/* Harga Column */}
                                <div className='w-32 text-right font-bold text-sm text-neutral-900 whitespace-nowrap px-2 shrink-0'>
                                  {formatRupiah(mdl.barang?.harga)}
                                </div>

                                {/* QTY Stepper Column */}
                                <div
                                  className='w-28 flex items-center justify-center shrink-0 pl-2'
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className='flex items-center bg-neutral-100/80 rounded-xl p-1 border border-neutral-200/80 shadow-xs'>
                                    <button
                                      type='button'
                                      onClick={() => updateQty(mdl.id, -1)}
                                      className='w-7 h-7 rounded-lg bg-white hover:bg-neutral-50 text-neutral-600 font-bold flex items-center justify-center text-xs shadow-xs transition-colors'
                                    >
                                      <Minus className='w-3 h-3' />
                                    </button>
                                    <input
                                      type='number'
                                      min={1}
                                      value={currentQty}
                                      onChange={(e) =>
                                        setQtyDirect(
                                          mdl.id,
                                          parseInt(e.target.value) || 1
                                        )
                                      }
                                      className='w-8 text-center text-xs font-bold text-neutral-800 bg-transparent border-0 focus:outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                                    />
                                    <button
                                      type='button'
                                      onClick={() => updateQty(mdl.id, 1)}
                                      className='w-7 h-7 rounded-lg bg-white hover:bg-neutral-50 text-neutral-600 font-bold flex items-center justify-center text-xs shadow-xs transition-colors'
                                    >
                                      <Plus className='w-3 h-3' />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Footer (Left Column) */}
            {meta.last_page > 1 && (
              <div className='bg-white border-t border-neutral-200 px-6 py-3 flex items-center justify-between shrink-0'>
                <p className='text-xs text-neutral-500 font-medium'>
                  Halaman <span className='font-bold text-neutral-800'>{meta.current_page}</span> dari{' '}
                  <span className='font-bold text-neutral-800'>{meta.last_page}</span>
                </p>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={meta.current_page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className='h-8 px-4 rounded-full text-xs font-medium border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={meta.current_page === meta.last_page}
                    onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                    className='h-8 px-4 rounded-full text-xs font-medium border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  >
                    Berikutnya
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column — "Ringkasan Item Terpilih" Sidebar */}
          <div className='w-80 shrink-0 bg-white flex flex-col overflow-hidden shadow-xs'>
            {/* Sidebar Header */}
            <div className='p-5 border-b border-neutral-200/80 bg-white shrink-0'>
              <h3 className='font-bold text-base text-neutral-900 tracking-tight'>
                Ringkasan Item Terpilih
              </h3>
              <p className='text-xs text-neutral-400 mt-0.5 font-medium'>
                {selectedIds.size} item terpilih
              </p>
            </div>

            {/* Selected Items List grouped by Ruang */}
            <div className='flex-1 overflow-y-auto p-4 space-y-3.5'>
              {selectedItemsList.length === 0 ? (
                <div className='h-48 flex flex-col items-center justify-center text-center gap-2 text-neutral-400 px-4'>
                  <Package className='w-8 h-8 text-neutral-300 stroke-[1.5]' />
                  <p className='text-xs font-medium text-neutral-600'>
                    Belum ada item terpilih
                  </p>
                  <p className='text-[11px] text-neutral-400'>
                    Centang item pada daftar catalog di sebelah kiri
                  </p>
                </div>
              ) : (
                Object.entries(groupedSelectedItems).map(([groupKey, items]) => {
                  const isCollapsed = collapsedSidebarGroups.has(groupKey);

                  return (
                    <div key={groupKey} className='space-y-2'>
                      {/* Room Group Header */}
                      <button
                        type='button'
                        onClick={() => toggleSidebarGroupCollapse(groupKey)}
                        className='w-full flex items-center justify-between text-xs font-semibold text-neutral-700 bg-neutral-50 hover:bg-neutral-100/80 border border-neutral-200/80 rounded-xl px-3 py-2 transition-colors select-none'
                      >
                        <div className='flex items-center gap-2 min-w-0 pr-2'>
                          {isCollapsed ? (
                            <ChevronRight className='w-3.5 h-3.5 text-neutral-400 shrink-0' />
                          ) : (
                            <ChevronDown className='w-3.5 h-3.5 text-neutral-500 shrink-0' />
                          )}
                          <span className='truncate text-[11px] font-bold text-neutral-800'>
                            {groupKey}
                          </span>
                        </div>
                        <span className='text-[10px] font-semibold text-orange-600 bg-orange-50 border border-orange-200/60 px-2 py-0.5 rounded-full shrink-0'>
                          {items.length} item
                        </span>
                      </button>

                      {/* Items Cards inside Room Group */}
                      {!isCollapsed && (
                        <div className='space-y-2 pl-1'>
                          {items.map((item) => {
                            const qty = qtyMap[item.id] ?? 1;
                            const itemPrice = (item.barang?.harga ?? 0) * qty;

                            return (
                              <div
                                key={item.id}
                                className='p-2.5 rounded-xl border border-neutral-200/90 bg-white flex items-start gap-2.5 relative group hover:border-neutral-300 transition-all shadow-[0_2px_5px_rgba(0,0,0,0.02)]'
                              >
                                {/* Thumbnail */}
                                <div className='w-11 h-11 rounded-lg bg-neutral-50 border border-neutral-200/80 overflow-hidden shrink-0 flex items-center justify-center relative'>
                                  <ItemThumbnail
                                    src={item.foto || item.barang?.foto}
                                    alt={item.barang?.nama || 'Selected Item'}
                                  />
                                </div>

                                {/* Info & Price */}
                                <div className='flex-1 min-w-0 pr-4'>
                                  <h4 className='text-xs font-semibold text-neutral-800 truncate'>
                                    {item.barang?.nama || 'Tanpa Nama'}
                                  </h4>

                                  {/* Stepper Qty */}
                                  <div className='flex items-center gap-1.5 mt-1 text-[11px] text-neutral-500 font-medium'>
                                    <span>Qty:</span>
                                    <div className='flex items-center bg-neutral-100/90 rounded-lg p-0.5 border border-neutral-200/80 ml-0.5'>
                                      <button
                                        type='button'
                                        onClick={() => updateQty(item.id, -1)}
                                        className='w-4 h-4 rounded bg-white hover:bg-neutral-50 text-neutral-700 font-bold flex items-center justify-center text-[10px] shadow-2xs transition-colors'
                                      >
                                        -
                                      </button>
                                      <span className='w-5 text-center font-bold text-neutral-800 text-[11px]'>
                                        {qty}
                                      </span>
                                      <button
                                        type='button'
                                        onClick={() => updateQty(item.id, 1)}
                                        className='w-4 h-4 rounded bg-white hover:bg-neutral-50 text-neutral-700 font-bold flex items-center justify-center text-[10px] shadow-2xs transition-colors'
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>

                                  <p className='text-xs font-bold text-neutral-900 mt-1'>
                                    {formatRupiah(itemPrice)}
                                  </p>
                                </div>

                                {/* Remove Button */}
                                <button
                                  type='button'
                                  onClick={() => toggleSelect(item)}
                                  className='absolute top-2 right-2 text-neutral-300 hover:text-red-500 p-0.5 rounded-md hover:bg-neutral-100 transition-colors'
                                >
                                  <X className='w-3.5 h-3.5' />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Sidebar Sticky Footer */}
            <div className='p-5 border-t border-neutral-200/80 bg-white space-y-3 shrink-0'>
              <div className='flex items-center justify-between'>
                <span className='text-xs font-medium text-neutral-500'>
                  Total Harga:
                </span>
                <span className='text-sm font-bold text-neutral-900'>
                  {formatRupiah(totalHarga)}
                </span>
              </div>

              <Button
                onClick={handleSave}
                disabled={selectedIds.size === 0 || saveMutation.isPending}
                className='w-full bg-[#f05a24] hover:bg-[#d94e1f] text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5'
              >
                {saveMutation.isPending ? (
                  <Loader2 className='w-4 h-4 mr-1 animate-spin' />
                ) : (
                  <>
                    <span>Lanjutkan ke Project</span>
                    <ChevronRight className='w-4 h-4 ml-0.5' />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
