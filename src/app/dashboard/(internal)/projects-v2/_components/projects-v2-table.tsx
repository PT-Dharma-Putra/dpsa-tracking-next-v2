'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Loader2,
  Check,
  ChevronsUpDown,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Truck,
  CalendarDays,
  Eye,
} from 'lucide-react';
import { format, differenceInDays, startOfDay } from 'date-fns';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
import { toast } from 'sonner';

import {
  projectV2Service,
  ProjectV2,
} from '@/features/projects/services/project-v2-service';
import { ClientService } from '@/features/clients/services/client-service';
import { ProjectFormDialog } from './project-form-dialog';
import { ScheduleDeliveryDialog } from './schedule-delivery-dialog';

export function ProjectsV2Table({
  showSPD = false,
  showPerencanaan = false,
  showProduksi = false,
  onlyShowDetail = false,
  showEngineer = false,
  showPiutang = false,
  showQC = false,
  showAllDashboard = false,
}: {
  showSPD?: boolean;
  showPerencanaan?: boolean;
  showProduksi?: boolean;
  onlyShowDetail?: boolean;
  showEngineer?: boolean;
  showPiutang?: boolean;
  showQC?: boolean;
  showAllDashboard?: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [searchInput, setSearchInput] = React.useState('');
  const [clientId, setClientId] = React.useState<string>('all');
  const [sortBy, setSortBy] = React.useState<string>('created_at');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');
  const [selectedMonth, setSelectedMonth] = React.useState<string>('all');
  const [selectedYear, setSelectedYear] = React.useState<string>('all');

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedProject, setSelectedProject] =
    React.useState<ProjectV2 | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [projectToDelete, setProjectToDelete] =
    React.useState<ProjectV2 | null>(null);

  const [isScheduleOpen, setIsScheduleOpen] = React.useState(false);
  const [projectToSchedule, setProjectToSchedule] =
    React.useState<ProjectV2 | null>(null);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading } = useQuery({
    queryKey: ['projects-v2', page, search, clientId, selectedMonth, selectedYear, sortBy, sortOrder],
    queryFn: () =>
      projectV2Service.getProjects({
        page,
        search,
        client_id: clientId !== 'all' ? clientId : undefined,
        month: selectedMonth !== 'all' ? selectedMonth : undefined,
        year: selectedYear !== 'all' ? selectedYear : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      }),
  });

  const [clientPopoverOpen, setClientPopoverOpen] = React.useState(false);
  const [clientSearch, setClientSearch] = React.useState('');
  const [debouncedClientSearch, setDebouncedClientSearch] = React.useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedClientSearch(clientSearch), 500);
    return () => clearTimeout(timer);
  }, [clientSearch]);

  const {
    data: clientsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingClients,
  } = useInfiniteQuery({
    queryKey: ['clients', debouncedClientSearch],
    queryFn: ({ pageParam = 1 }) =>
      ClientService.getClients({
        page: pageParam,
        search: debouncedClientSearch,
      }),
    getNextPageParam: (lastPage: any) => {
      const current_page = lastPage.meta?.current_page;
      const last_page = lastPage.meta?.last_page;
      return current_page < last_page ? current_page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const clientsRaw = clientsData?.pages.flatMap((page) => page.data) || [];
  const clients = Array.from(
    new Map(clientsRaw.map((c: any) => [c.id, c])).values()
  );

  const observerRef = React.useRef<IntersectionObserver>(null);
  const loadMoreRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  const deleteMutation = useMutation({
    mutationFn: (id: number) => projectV2Service.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-v2'] });
      toast.success('Project deleted successfully');
      setIsDeleteDialogOpen(false);
    },
    onError: () => {
      toast.error('Failed to delete project');
    },
  });

  // PIC Management
  const { data: designers = [] } = useQuery({
    queryKey: ['designers'],
    queryFn: () => projectV2Service.getDesigners(),
    enabled: showSPD,
  });

  const updatePicMutation = useMutation({
    mutationFn: ({ projectId, studioId }: { projectId: number; studioId: number }) =>
      projectV2Service.updatePic(projectId, studioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-v2'] });
      toast.success('PIC updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update PIC');
    },
  });

  const handlePicChange = (projectId: number, studioId: number) => {
    updatePicMutation.mutate({ projectId, studioId });
  };

  const updateNoteMutation = useMutation({
    mutationFn: ({ projectId, note }: { projectId: number; note: string }) =>
      projectV2Service.updateNote(projectId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-v2'] });
      toast.success('Note updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update note');
    },
  });

  const handleUpdateNote = (projectId: number, note: string) => {
    updateNoteMutation.mutate({ projectId, note });
  };

  const handleEdit = (project: ProjectV2) => {
    setSelectedProject(project);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedProject(null);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (project: ProjectV2) => {
    setProjectToDelete(project);
    setIsDeleteDialogOpen(true);
  };

  const handleScheduleClick = (project: ProjectV2) => {
    setProjectToSchedule(project);
    setIsScheduleOpen(true);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      deleteMutation.mutate(projectToDelete.id);
    }
  };

  const projects = data?.data || [];

  return (
    <div className='flex flex-col gap-4 p-4'>
      <div className='flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center'>
        <div className='flex flex-1 gap-2 items-center w-full sm:max-w-md'>
          <div className='relative flex-1'>
            <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search projects...'
              className='pl-8'
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                role='combobox'
                className={cn(
                  'w-[200px] justify-between',
                  !clientId && 'text-muted-foreground'
                )}
              >
                {clientId && clientId !== 'all'
                  ? clients.find((client) => client.id.toString() === clientId)
                      ?.name || 'Select a client'
                  : 'All Clients'}
                <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-[300px] p-0' align='start'>
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder='Search clients...'
                  value={clientSearch}
                  onValueChange={setClientSearch}
                />
                <CommandList>
                  <CommandEmpty>
                    {isLoadingClients
                      ? 'Loading clients...'
                      : 'No clients found.'}
                  </CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value='all'
                      onSelect={() => {
                        setClientId('all');
                        setPage(1);
                        setClientPopoverOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          clientId === 'all' ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      All Clients
                    </CommandItem>
                    {clients.map((client) => (
                      <CommandItem
                        value={client.id.toString()}
                        key={client.id}
                        onSelect={() => {
                          setClientId(client.id.toString());
                          setPage(1);
                          setClientPopoverOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            clientId === client.id.toString()
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                        {client.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {hasNextPage && (
                    <div
                      ref={loadMoreRef}
                      className='py-4 flex justify-center items-center'
                    >
                      <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
                      <span className='ml-2 text-xs text-muted-foreground'>
                        Loading more...
                      </span>
                    </div>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className='flex flex-wrap gap-2 items-center'>
          <Select value={selectedMonth} onValueChange={(v: string) => { setSelectedMonth(v); setPage(1); }}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              <SelectItem value="1">January</SelectItem>
              <SelectItem value="2">February</SelectItem>
              <SelectItem value="3">March</SelectItem>
              <SelectItem value="4">April</SelectItem>
              <SelectItem value="5">May</SelectItem>
              <SelectItem value="6">June</SelectItem>
              <SelectItem value="7">July</SelectItem>
              <SelectItem value="8">August</SelectItem>
              <SelectItem value="9">September</SelectItem>
              <SelectItem value="10">October</SelectItem>
              <SelectItem value="11">November</SelectItem>
              <SelectItem value="12">December</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedYear} onValueChange={(v: string) => { setSelectedYear(v); setPage(1); }}>
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {!onlyShowDetail && !showAllDashboard && (
          <Button
            onClick={handleCreate}
            className='bg-orange-600 hover:bg-orange-700'
          >
            <Plus className='mr-2 h-4 w-4' />
            New Project
          </Button>
        )}
      </div>

      <div className='rounded-md border overflow-hidden'>
        <Table>
          <TableHeader className='bg-neutral-50'>
            <TableRow>
              <TableHead className='w-[50px]'>#</TableHead>
              {showAllDashboard ? (
                <>
                  <TableHead>Client</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Nomor SPK</TableHead>
                  <TableHead>Nomor SPH</TableHead>
                  <TableHead>Prioritas</TableHead>
                  <TableHead
                    className='cursor-pointer hover:bg-neutral-100 transition-colors group'
                    onClick={() => {
                      if (sortBy === 'deadline') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('deadline');
                        setSortOrder('asc');
                      }
                      setPage(1);
                    }}
                  >
                    <div className='flex items-center gap-1'>
                      Deadline
                      {sortBy === 'deadline' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className='h-3 w-3' />
                        ) : (
                          <ArrowDown className='h-3 w-3' />
                        )
                      ) : (
                        <ArrowUpDown className='h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity' />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Sisa Hari</TableHead>
                </>
              ) : (
                <>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Nomor SPK</TableHead>
                  <TableHead>Prioritas</TableHead>
                  {showPiutang && <TableHead>Progres Produksi</TableHead>}
                  {showPiutang && <TableHead>Total Penagihan</TableHead>}
                  {!showEngineer && <TableHead>Client</TableHead>}
                  {!showProduksi && <TableHead>Description</TableHead>}
                </>
              )}
              {!showAllDashboard && !showSPD && (
                <>
                  <TableHead
                    className='cursor-pointer hover:bg-neutral-100 transition-colors group'
                    onClick={() => {
                      if (sortBy === 'deadline') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('deadline');
                        setSortOrder('asc');
                      }
                      setPage(1);
                    }}
                  >
                    <div className='flex items-center gap-1'>
                      Deadline
                      {sortBy === 'deadline' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className='h-3 w-3' />
                        ) : (
                          <ArrowDown className='h-3 w-3' />
                        )
                      ) : (
                        <ArrowUpDown className='h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity' />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>SPH Number</TableHead>

                  {!showProduksi && <TableHead>Sisa Hari</TableHead>}
                </>
              )}
              {!showAllDashboard && !showProduksi && <TableHead>Pakai Desain</TableHead>}
              {!showAllDashboard && !showSPD && <TableHead>Jadwal Pengiriman</TableHead>}
              
              {showAllDashboard && (
                <>
                  <TableHead>Jadwal Pengiriman</TableHead>
                  <TableHead>Persentase Kerja</TableHead>
                  <TableHead>Progres Terakhir</TableHead>
                </>
              )}
              {!showAllDashboard && showSPD && (
                <>
                  {!showEngineer && <TableHead>SPD</TableHead>}
                  {!showEngineer && <TableHead>Pic</TableHead>}
                  {showEngineer ? <TableHead>Desainer</TableHead> : (!showEngineer && <TableHead>Desain</TableHead>)}
                  {!showEngineer && <TableHead>Approval Status</TableHead>}
                  {!showEngineer && <TableHead>Target Desain</TableHead>}
                  {showEngineer && <TableHead>Target</TableHead>}
                  {showEngineer && <TableHead>Persentase</TableHead>}
                  {!showEngineer && <TableHead>Submit</TableHead>}
                  {showEngineer && <TableHead>Submit</TableHead>}
                  <TableHead>Tepat Waktu</TableHead>
                  {showEngineer && <TableHead>Note</TableHead>}
                  {!showEngineer && <TableHead>List Furnitur</TableHead>}
                </>
              )}
              {showProduksi && (
                <>
                  <TableHead>Order Produksi</TableHead>
                  <TableHead>Target Selesai</TableHead>
                  <TableHead>Sisa Hari</TableHead>
                </>
              )}
              {showProduksi && <TableHead>Progres Produksi</TableHead>}
              <TableHead className='w-[100px] text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={showProduksi ? 13 : (showEngineer ? 15 : 16)} className='h-32 text-center text-muted-foreground'>
                  <div className='flex items-center justify-center'>
                    <Loader2 className='h-6 w-6 animate-spin text-neutral-400' />
                  </div>
                </TableCell>
              </TableRow>
            ) : projects.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showProduksi ? 13 : (showEngineer ? 15 : 16)}
                  className='h-32 text-center text-muted-foreground'
                >
                  No projects found.
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project, index) => (
                <TableRow key={project.id}>
                  <TableCell className='font-medium text-muted-foreground'>
                    {(page - 1) * 10 + index + 1}
                  </TableCell>
                   {showAllDashboard ? (
                     <>
                        <TableCell>{project.client?.name || '-'}</TableCell>
                        <TableCell className='max-w-[200px] truncate'>
                          {project.description || (
                            <span className='text-muted-foreground italic text-xs'>None</span>
                          )}
                        </TableCell>
                        <TableCell className='font-medium text-blue-600'>
                          {project.spk_number || project.spk?.nomor_spk || '-'}
                        </TableCell>
                        <TableCell>
                          {project.sph?.nomor_sph || '-'}
                        </TableCell>
                        <TableCell>
                          {project.prioritas === 'Urgent' ? (
                            <Badge className='bg-red-100 text-red-700 border border-red-200 hover:bg-red-100 font-semibold text-[11px]'>
                              Urgent
                            </Badge>
                          ) : project.prioritas === 'Normal' ? (
                            <Badge variant='secondary' className='font-normal text-[11px]'>
                              Normal
                            </Badge>
                          ) : (
                            <span className='text-muted-foreground italic text-xs'>-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {project.deadline
                            ? format(new Date(project.deadline), 'MMM d, yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {project.deadline ? (
                            (() => {
                              const diff = differenceInDays(
                                startOfDay(new Date(project.deadline)),
                                startOfDay(new Date())
                              );
                              return (
                                <div className='flex items-center gap-1.5'>
                                  <Badge
                                    variant='outline'
                                    className={cn(
                                      'font-bold',
                                      diff < 0
                                        ? 'bg-red-50 text-red-700 border-red-200'
                                        : diff <= 3
                                        ? 'bg-orange-50 text-orange-700 border-orange-200'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    )}
                                  >
                                    {diff < 0
                                      ? `Lewat ${Math.abs(diff)} Hari`
                                      : `${diff} Hari`}
                                  </Badge>
                                </div>
                              );
                            })()
                          ) : (
                            <span className='text-muted-foreground italic text-xs'>
                              -
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {project.jadwal_pengiriman ? (
                            <div className='flex items-center gap-1.5 text-xs font-medium text-neutral-900'>
                              <Truck className='h-3 w-3 text-orange-500' />
                              {format(
                                new Date(
                                  project.jadwal_pengiriman.tanggal_pengiriman
                                    ?.tanggal || ''
                                ),
                                'MMM d, yyyy'
                              )}
                            </div>
                          ) : (
                            <span className='text-muted-foreground italic text-xs'>-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {project.progres_kerja ? (
                            <span className='text-sm font-black text-blue-600 tabular-nums'>
                              {Math.round(project.progres_kerja.total)}%
                            </span>
                          ) : (
                            <span className='text-muted-foreground italic text-xs'>-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            if (!project.progres_kerja) return <span className='text-muted-foreground italic text-xs'>-</span>;
                            
                            const stages = [
                              { name: 'PO Divisi', date: project.progres_kerja.tanggal_update_po_divisi, color: 'blue' },
                              { name: 'Gambar Kerja', date: project.progres_kerja.tanggal_update_gambar_kerja, color: 'orange' },
                              { name: 'Dokubah', date: project.progres_kerja.tanggal_update_dokubah, color: 'purple' },
                              { name: 'Stok Material', date: project.progres_kerja.tanggal_update_stok_material, color: 'emerald' },
                              { name: 'Produksi', date: project.progres_kerja.tanggal_update_produksi, color: 'cyan' },
                              { name: 'Gudang', date: project.progres_kerja.tanggal_update_gudang_barang_jadi, color: 'indigo' },
                              { name: 'Pengiriman', date: project.progres_kerja.tanggal_update_pengiriman, color: 'rose' },
                            ];

                            const latest = stages
                              .filter(s => s.date)
                              .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())[0];

                            if (!latest) return <span className='text-muted-foreground italic text-xs'>-</span>;

                            const getColor = (color: string) => {
                              switch (color) {
                                case 'blue': return 'bg-blue-50 text-blue-700 border-blue-200';
                                case 'orange': return 'bg-orange-50 text-orange-700 border-orange-200';
                                case 'purple': return 'bg-purple-50 text-purple-700 border-purple-200';
                                case 'emerald': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                case 'cyan': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
                                case 'indigo': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
                                case 'rose': return 'bg-rose-50 text-rose-700 border-rose-200';
                                default: return 'bg-neutral-50 text-neutral-700 border-neutral-200';
                              }
                            };

                            return (
                              <div className='flex flex-col gap-0.5'>
                                <Badge variant='outline' className={cn("text-[9px] font-bold py-0 h-4 w-fit", getColor(latest.color))}>
                                  {latest.name}
                                </Badge>
                                <span className='text-[8px] text-muted-foreground whitespace-nowrap'>
                                  {format(new Date(latest.date!), 'MMM d, HH:mm')}
                                </span>
                              </div>
                            );
                          })()}
                        </TableCell>
                     </>
                   ) : (
                     <>
                        <TableCell className='font-medium'>{project.name}</TableCell>
                        <TableCell className='font-medium text-blue-600'>
                          {project.spk_number || project.spk?.nomor_spk || '-'}
                        </TableCell>
                        <TableCell>
                          {project.prioritas === 'Urgent' ? (
                            <Badge className='bg-red-100 text-red-700 border border-red-200 hover:bg-red-100 font-semibold text-[11px]'>
                              Urgent
                            </Badge>
                          ) : project.prioritas === 'Normal' ? (
                            <Badge variant='secondary' className='font-normal text-[11px]'>
                              Normal
                            </Badge>
                          ) : (
                            <span className='text-muted-foreground italic text-xs'>-</span>
                          )}
                        </TableCell>
                     </>
                   )}
                   {showPiutang && (
                     <TableCell>
                       <div className='flex items-center gap-2'>
                         <div className='flex-1 min-w-[60px]'>
                           <div className='h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden'>
                             <div
                               className='h-full bg-emerald-500 rounded-full transition-all duration-500'
                               style={{
                                 width: `${project.progres_produksi || 0}%`,
                               }}
                             />
                           </div>
                         </div>
                         <span className='text-xs font-bold text-neutral-700'>
                           {Math.round(project.progres_produksi || 0)}%
                         </span>
                       </div>
                     </TableCell>
                   )}
                   {showAllDashboard && (
                     <></>
                   )}
                   {!showAllDashboard && showPiutang && (
                     <TableCell>
                       <Badge 
                         variant="outline" 
                         className="bg-amber-50 text-amber-700 border-amber-200 font-bold"
                       >
                         {project.penagihans?.reduce((sum, p) => sum + Number(p.persentase || 0), 0)}%
                       </Badge>
                     </TableCell>
                   )}
                  {!showAllDashboard && !showEngineer && <TableCell>{project.client?.name || '-'}</TableCell>}
                  {!showAllDashboard && !showProduksi && (
                    <TableCell className='max-w-[200px] truncate'>
                      {project.description || (
                        <span className='text-muted-foreground italic'>None</span>
                      )}
                    </TableCell>
                  )}
                  {!showAllDashboard && !showSPD && (
                    <>
                      <TableCell>
                        {project.deadline
                          ? format(new Date(project.deadline), 'MMM d, yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {project.sph?.nomor_sph || '-'}
                      </TableCell>

                      {!showProduksi && (
                        <TableCell>
                          {project.deadline ? (
                            (() => {
                              const diff = differenceInDays(
                                startOfDay(new Date(project.deadline)),
                                startOfDay(new Date())
                              );
                              return (
                                <div className='flex items-center gap-1.5'>
                                  <Badge
                                    variant='outline'
                                    className={cn(
                                      'font-bold',
                                      diff < 0
                                        ? 'bg-red-50 text-red-700 border-red-200'
                                        : diff <= 3
                                        ? 'bg-orange-50 text-orange-700 border-orange-200'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    )}
                                  >
                                    {diff < 0
                                      ? `Lewat ${Math.abs(diff)} Hari`
                                      : `${diff} Hari`}
                                  </Badge>
                                </div>
                              );
                            })()
                          ) : (
                            <span className='text-muted-foreground italic text-xs'>
                              -
                            </span>
                          )}
                        </TableCell>
                      )}
                    </>
                  )}
                  {!showAllDashboard && !showProduksi && (
                    <TableCell>
                      {project.need_design ? 'Ya' : 'Tidak'}
                    </TableCell>
                  )}
                  {!showAllDashboard && !showSPD && (
                    <TableCell>
                      {project.jadwal_pengiriman ? (
                        <div
                          className={cn(
                            'space-y-1 p-1 rounded-md',
                            !showProduksi &&
                              'cursor-pointer hover:bg-neutral-50 transition-colors group'
                          )}
                          onClick={
                            !showProduksi
                              ? () => handleScheduleClick(project)
                              : undefined
                          }
                        >
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-1.5 text-xs font-medium text-neutral-900'>
                              <Truck className='h-3 w-3 text-orange-500' />
                              {format(
                                new Date(
                                  project.jadwal_pengiriman.tanggal_pengiriman
                                    ?.tanggal || ''
                                ),
                                'MMM d, yyyy'
                              )}
                            </div>
                            {!showProduksi && (
                              <Pencil className='h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity' />
                            )}
                          </div>
                          {(() => {
                            const jadwalTanggal =
                              project.jadwal_pengiriman.tanggal_pengiriman
                                ?.tanggal;
                            if (!jadwalTanggal || !project.deadline) return null;
                            const diff = differenceInDays(
                              startOfDay(new Date(project.deadline)),
                              startOfDay(new Date(jadwalTanggal))
                            );
                            return (
                              <Badge
                                variant='secondary'
                                className={cn(
                                  'text-[10px] h-4 px-1.5',
                                  diff < 0
                                    ? 'bg-red-50 text-red-600'
                                    : diff <= 2
                                    ? 'bg-orange-50 text-orange-600'
                                    : 'bg-emerald-50 text-emerald-600'
                                )}
                              >
                                {diff < 0
                                  ? `Lewat ${Math.abs(diff)} hari`
                                  : diff === 0
                                  ? 'Tepat Deadline'
                                  : `${diff} hari sebelum deadline`}
                              </Badge>
                            );
                          })()}
                        </div>
                      ) : !showProduksi ? (
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-8 text-xs text-muted-foreground hover:text-orange-600'
                          onClick={() => handleScheduleClick(project)}
                        >
                          <CalendarDays className='mr-1.5 h-3.5 w-3.5' />
                          Set Jadwal
                        </Button>
                      ) : (
                        <span className='text-muted-foreground italic text-xs'>
                          -
                        </span>
                      )}
                    </TableCell>
                  )}
                  {!showAllDashboard && showSPD && (
                    <>
                      {!showEngineer && (
                        <TableCell>
                          {project.designs?.[0]?.spd_file ? (
                            <div className='flex items-center gap-2'>
                              <Badge
                                variant='outline'
                                className='bg-orange-50 text-orange-700 border-orange-200'
                              >
                                Uploaded
                              </Badge>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-7 w-7 text-orange-600'
                                asChild
                              >
                                <a
                                  href={`${(
                                    process.env.NEXT_PUBLIC_API_URL ||
                                    'http://localhost:8000'
                                  ).replace('/api', '')}/storage/${
                                    project.designs[0].spd_file
                                  }`}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                >
                                  <ArrowDown className='h-3 w-3' />
                                </a>
                              </Button>
                            </div>
                          ) : (
                            <span className='text-muted-foreground italic text-[10px]'>
                              Not Uploaded
                            </span>
                          )}
                        </TableCell>
                      )}
                      {!showEngineer && (
                        <TableCell>
                          {project.need_design === 0 ? (
                            <span className='text-muted-foreground italic text-xs'>-</span>
                          ) : project.designs?.[0]?.spd_file ? (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  className={cn(
                                    'h-8 px-2 font-medium flex items-center gap-1.5',
                                    project.designs?.[0]?.studio?.name
                                      ? 'text-neutral-900'
                                      : 'text-muted-foreground italic'
                                  )}
                                >
                                  {project.designs?.[0]?.studio?.name ||
                                    (project.designs?.[0]?.studio_id
                                      ? `ID: ${project.designs[0].studio_id}`
                                      : 'Select Pic')}
                                  <ChevronsUpDown className='h-3 w-3 opacity-50' />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className='w-[200px] p-0'
                                align='start'
                              >
                                <Command>
                                  <CommandInput placeholder='Search designer...' />
                                  <CommandList>
                                    <CommandEmpty>No designer found.</CommandEmpty>
                                    <CommandGroup>
                                      {designers.map((designer) => (
                                        <CommandItem
                                          key={designer.id}
                                          value={designer.name}
                                          onSelect={() => {
                                            handlePicChange(
                                              project.id,
                                              designer.id
                                            );
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              'mr-2 h-4 w-4',
                                              project.designs?.[0]?.studio_id ===
                                                designer.id
                                                ? 'opacity-100'
                                                : 'opacity-0'
                                            )}
                                          />
                                          {designer.name}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          ) : (
                            <div className='flex items-center gap-1.5 px-2 py-1 text-muted-foreground italic text-[10px] bg-neutral-50 rounded border border-dashed border-neutral-200 w-fit'>
                              Menunggu SPD
                            </div>
                          )}
                        </TableCell>
                      )}
                      {showEngineer && (
                        <TableCell>
                          <div className='flex flex-col gap-1'>
                            <span className='text-xs font-medium'>{project.designs?.[0]?.studio?.name || '-'}</span>
                            {project.designs?.[0]?.design_progres && project.designs[0].design_progres.length > 0 && (
                                (() => {
                                    const latest = project.designs[0].design_progres[project.designs[0].design_progres.length - 1];
                                    return (
                                        <div className='flex items-center gap-2'>
                                            {latest.file && (
                                                <Button variant='ghost' size='icon' className='h-5 w-5 text-blue-600' asChild>
                                                    <a 
                                                        href={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('/api', '')}/storage/${latest.file}`}
                                                        target='_blank'
                                                        rel='noopener noreferrer'
                                                    >
                                                        <Eye className='h-3 w-3' />
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })()
                            )}
                          </div>
                        </TableCell>
                      )}
                      {!showEngineer && (
                        <TableCell>
                          {project.designs?.[0]?.design_progres &&
                          project.designs[0].design_progres.length > 0 ? (
                            <Badge
                              variant='outline'
                              className='bg-blue-50 text-blue-700 border-blue-200'
                            >
                              {
                                project.designs[0].design_progres[
                                  project.designs[0].design_progres.length - 1
                                ].tahap_design?.nama
                              }
                            </Badge>
                          ) : (
                            <Badge
                              variant='secondary'
                              className='bg-neutral-100 text-neutral-500 border-none font-normal'
                            >
                              Belum
                            </Badge>
                          )}
                        </TableCell>
                      )}

                      {showEngineer && (
                         <TableCell className='text-xs'>
                            {project.order_gambar_kerja?.[0]?.target_selesai 
                                ? format(new Date(project.order_gambar_kerja[0].target_selesai), 'MMM d, yyyy') 
                                : '-'}
                         </TableCell>
                      )}
                      {showEngineer && (
                        <TableCell>
                          <div className='flex items-center gap-2 min-w-[80px]'>
                            <div className='h-1.5 flex-1 bg-neutral-100 rounded-full overflow-hidden'>
                              <div 
                                className='h-full bg-orange-500 transition-all duration-500' 
                                style={{ width: `${project.drawing_progress ?? 0}%` }} 
                              />
                            </div>
                            <span className='text-[10px] font-bold text-orange-600 tabular-nums'>{project.drawing_progress ?? 0}%</span>
                          </div>
                        </TableCell>
                      )}
                      {!showEngineer && (
                        <TableCell>
                          {project.designs?.[0]?.acc_design?.status ? (
                            <Badge
                              variant='outline'
                              className={cn(
                                'font-bold',
                                project.designs[0].acc_design.status === 'Approved'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              )}
                            >
                              {project.designs[0].acc_design.status}
                            </Badge>
                          ) : (
                            <span className='text-muted-foreground italic text-[10px]'>-</span>
                          )}
                        </TableCell>
                      )}
                      {!showEngineer && (
                        <TableCell>
                          {project.designs?.[0]?.target_selesai ? (
                            <span className="text-xs">{format(new Date(project.designs[0].target_selesai), 'MMM d, yyyy')}</span>
                          ) : (
                            <span className='text-muted-foreground italic text-[10px]'>-</span>
                          )}
                        </TableCell>
                      )}
                      {!showEngineer && (
                        <TableCell>
                          {project.designs?.[0]?.design_progres && project.designs[0].design_progres.length > 0 ? (
                            <span className="text-xs">
                              {(() => {
                                const latest = project.designs[0].design_progres[project.designs[0].design_progres.length - 1];
                                return latest.tanggal_selesai ? format(new Date(latest.tanggal_selesai), 'MMM d, yyyy') : '-';
                              })()}
                            </span>
                          ) : (
                            <span className='text-muted-foreground italic text-[10px]'>-</span>
                          )}
                        </TableCell>
                      )}
                      {showEngineer && (
                        <TableCell className='text-xs'>
                           {project.latest_drawing_submit 
                             ? format(new Date(project.latest_drawing_submit), 'MMM d, yyyy') 
                             : '-'}
                        </TableCell>
                      )}
                      <TableCell>
                        {(() => {
                           const design = project.designs?.[0];
                           const target = showEngineer 
                               ? project.order_gambar_kerja?.[0]?.target_selesai 
                               : design?.target_selesai;
                           
                           const submit = showEngineer 
                             ? project.latest_drawing_submit 
                             : design?.design_progres?.[design.design_progres.length - 1]?.tanggal_selesai;

                           if (!target || !submit) return <span className='text-muted-foreground italic text-[10px]'>-</span>;

                           const isOnTime = new Date(submit) <= new Date(target);
                           return (
                             <Badge variant="outline" className={cn(
                               "font-bold",
                               isOnTime ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
                             )}>
                               {isOnTime ? "Ya" : "Tidak"}
                             </Badge>
                           );
                        })()}
                      </TableCell>
                      {showEngineer && (
                        <TableCell>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant='ghost' size='sm' className='h-8 w-full justify-start font-normal text-xs px-2 truncate max-w-[120px]'>
                                {project.note_engineer || (
                                  <span className='text-muted-foreground italic text-[10px]'>Add note...</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className='w-80 p-4' align="start">
                              <div className='space-y-3'>
                                <div className='flex items-center justify-between'>
                                  <h4 className='font-medium text-sm'>Engineer Note</h4>
                                  <span className='text-[10px] text-muted-foreground'>Auto-saves on blur</span>
                                </div>
                                <textarea
                                  className='w-full min-h-[100px] text-xs p-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500'
                                  placeholder='Type your note here...'
                                  defaultValue={project.note_engineer || ''}
                                  onBlur={(e) => {
                                    if (e.target.value !== (project.note_engineer || '')) {
                                      handleUpdateNote(project.id, e.target.value);
                                    }
                                  }}
                                />
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                      )}
                      {!showEngineer && (
                        <TableCell>
                          {project.list_furnitur ? (
                            <div className='flex items-center justify-center h-7 w-7 rounded-full bg-emerald-50 text-emerald-600 mx-auto'>
                              <Check className='h-4 w-4' />
                            </div>
                          ) : (
                            <Badge
                              variant='secondary'
                              className='bg-neutral-100 text-neutral-500 border-none font-normal'
                            >
                              Belum
                            </Badge>
                          )}
                        </TableCell>
                      )}
                    </>
                  )}
                  {showProduksi && (
                    <>
                      <TableCell>
                        {project.order_produksi?.[0]?.file ? (
                          <div className='flex items-center gap-2'>
                            <Badge
                              variant='outline'
                              className='bg-emerald-50 text-emerald-700 border-emerald-200'
                            >
                              Uploaded
                            </Badge>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-7 w-7 text-emerald-600'
                              asChild
                            >
                              <a
                                href={`${(
                                  process.env.NEXT_PUBLIC_API_URL ||
                                  'http://localhost:8000'
                                ).replace('/api', '')}/storage/${
                                  project.order_produksi[0].file
                                }`}
                                target='_blank'
                                rel='noopener noreferrer'
                              >
                                <ArrowDown className='h-3 w-3' />
                              </a>
                            </Button>
                          </div>
                        ) : (
                          <span className='text-muted-foreground italic text-[10px]'>
                            Not Uploaded
                          </span>
                        )}
                      </TableCell>
                      <TableCell className='text-xs'>
                        {project.order_produksi?.[0]?.target_selesai
                          ? format(
                              new Date(project.order_produksi[0].target_selesai),
                              'MMM d, yyyy'
                            )
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {project.order_produksi?.[0]?.target_selesai ? (
                          (() => {
                            const diff = differenceInDays(
                              startOfDay(new Date(project.order_produksi[0].target_selesai)),
                              startOfDay(new Date())
                            );
                            return (
                              <div className='flex items-center gap-1.5'>
                                <Badge
                                  variant='outline'
                                  className={cn(
                                    'font-bold',
                                    diff < 0
                                      ? 'bg-red-50 text-red-700 border-red-200'
                                      : diff <= 3
                                      ? 'bg-orange-50 text-orange-700 border-orange-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  )}
                                >
                                  {diff < 0
                                    ? `Lewat ${Math.abs(diff)} Hari`
                                    : `${diff} Hari`}
                                </Badge>
                              </div>
                            );
                          })()
                        ) : (
                          <span className='text-muted-foreground italic text-xs'>
                            -
                          </span>
                        )}
                      </TableCell>
                    </>
                  )}
                  {showProduksi && (
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <div className='flex-1 min-w-[60px]'>
                          <div className='h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden'>
                            <div
                              className='h-full bg-emerald-500 rounded-full transition-all duration-500'
                              style={{
                                width: `${project.progres_produksi || 0}%`,
                              }}
                            />
                          </div>
                        </div>
                        <span className='text-xs font-bold text-neutral-700'>
                          {Math.round(project.progres_produksi || 0)}%
                        </span>
                      </div>
                    </TableCell>
                  )}
                  {showAllDashboard ? (
                    <TableCell className='text-right'>
                      <Button
                        variant='outline'
                        size='sm'
                        className='h-8 px-3 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700'
                        onClick={() =>
                          router.push(
                            `/dashboard/projects-v2/monitoring/${project.id}/detail`
                          )
                        }
                      >
                        Detail
                      </Button>
                    </TableCell>
                  ) : (
                    <TableCell className='text-right'>
                      {onlyShowDetail ? (
                        <div className='flex justify-end'>
                          {showSPD && (
                            <Button
                              variant='outline'
                              size='sm'
                              className='h-8 px-3 text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700'
                              onClick={() =>
                                router.push(
                                  showEngineer 
                                    ? `/dashboard/projects-v2/engineer/${project.id}/detail`
                                    : `/dashboard/projects-v2/perintah-kerja/${project.id}/detail`
                                )
                              }
                            >
                              Detail
                            </Button>
                          )}
                          {showPerencanaan && (
                            <Button
                              variant='outline'
                              size='sm'
                              className='h-8 px-3 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700'
                              onClick={() =>
                                router.push(
                                  `/dashboard/projects-v2/perencanaan/${project.id}/detail`
                                )
                              }
                            >
                              Detail
                            </Button>
                          )}
                          {showProduksi && (
                            <Button
                              variant='outline'
                              size='sm'
                              className='h-8 px-3 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700'
                              onClick={() =>
                                router.push(
                                  `/dashboard/projects-v2/produksi/${project.id}/detail`
                                )
                              }
                            >
                              Detail
                            </Button>
                          )}
                          {showQC && (
                            <Button
                              variant='outline'
                              size='sm'
                              className='h-8 px-3 text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700'
                              onClick={() =>
                                router.push(
                                  `/dashboard/projects-v2/qc/${project.id}/detail`
                                )
                              }
                            >
                              Detail
                            </Button>
                          )}
                          {showPiutang && (
                            <Button
                              variant='outline'
                              size='sm'
                              className='h-8 px-3 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700'
                              onClick={() =>
                                router.push(
                                  `/dashboard/projects-v2/piutang/${project.id}/detail`
                                )
                              }
                            >
                              Detail
                            </Button>
                          )}
                        </div>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' className='h-8 w-8 p-0'>
                              <span className='sr-only'>Open menu</span>
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/dashboard/projects-v2/${project.id}/items`
                                )
                              }
                            >
                              <Plus className='mr-2 h-4 w-4' />
                              Item
                            </DropdownMenuItem>
                            {showSPD && (
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/dashboard/projects-v2/perintah-kerja/${project.id}/detail`
                                  )
                                }
                              >
                                <Plus className='mr-2 h-4 w-4' />
                                Detail
                              </DropdownMenuItem>
                            )}
                            {showPerencanaan && (
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/dashboard/projects-v2/perencanaan/${project.id}/detail`
                                  )
                                }
                              >
                                <Plus className='mr-2 h-4 w-4' />
                                Detail
                              </DropdownMenuItem>
                            )}
                            {showQC && (
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/dashboard/projects-v2/qc/${project.id}/detail`
                                  )
                                }
                              >
                                <Plus className='mr-2 h-4 w-4' />
                                Detail
                              </DropdownMenuItem>
                            )}
                            {showProduksi && (
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/dashboard/projects-v2/produksi/${project.id}/detail`
                                  )
                                }
                              >
                                <Plus className='mr-2 h-4 w-4' />
                                Detail
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEdit(project)}>
                              <Pencil className='mr-2 h-4 w-4' />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleScheduleClick(project)}
                            >
                              <Truck className='mr-2 h-4 w-4' />
                              Jadwalkan Pengiriman
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className='text-red-600 focus:text-red-600'
                              onClick={() => handleDeleteClick(project)}
                            >
                              <Trash2 className='mr-2 h-4 w-4' />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {data && data.last_page > 1 && (
        <div className='flex items-center justify-end space-x-2 py-4'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <div className='text-sm text-muted-foreground'>
            Page {page} of {data.last_page}
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setPage((p) => Math.min(data.last_page, p + 1))}
            disabled={page === data.last_page}
          >
            Next
          </Button>
        </div>
      )}

      <ProjectFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        project={selectedProject}
      />

      <ScheduleDeliveryDialog
        open={isScheduleOpen}
        onOpenChange={setIsScheduleOpen}
        project={projectToSchedule}
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project {projectToDelete?.name}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className='bg-red-600 hover:bg-red-700 focus:ring-red-600'
            >
              {deleteMutation.isPending && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
