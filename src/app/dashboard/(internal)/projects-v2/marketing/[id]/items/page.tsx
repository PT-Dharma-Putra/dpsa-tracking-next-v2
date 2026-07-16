'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  Plus,
  Pencil,
  Trash2,
  Ban,
  MoreHorizontal,
  Loader2,
  ArrowLeft,
  Building2,
  User,
  Calendar,
  FileText,
  Upload,
  FileDown,
  CheckCircle2,
  Package,
  ClipboardCheck,
  ChevronDown,
  Info,
  ImageIcon,
  AlertCircle,
  CheckCircle,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

import {
  projectV2Service,
  ProjectItemV2,
} from '@/features/projects/services/project-v2-service';
import { ProjectItemFormDialog } from '../../../_components/project-item-form-dialog';
import { CatalogModal } from '../../../_components/catalog-modal';
import { ProjectItemImportDialog } from '../../../_components/project-item-import-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { ClientService } from '@/features/clients/services/client-service';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const formatRupiah = (value: string | number) => {
  if (value === null || value === undefined || value === '') return '';

  if (typeof value === 'number') {
    const rounded = Math.round(value);
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(rounded);
  }

  if (/^-?\d+(\.\d+)?$/.test(value)) {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      const rounded = Math.round(num);
      return 'Rp ' + new Intl.NumberFormat('id-ID').format(rounded);
    }
  }

  const numberString = value.toString().replace(/[^,\d]/g, '');
  const split = numberString.split(',');
  const sisa = split[0].length % 3;
  let rupiah = split[0].substr(0, sisa);
  const ribuan = split[0].substr(sisa).match(/\d{3}/gi);

  if (ribuan) {
    const separator = sisa ? '.' : '';
    rupiah += separator + ribuan.join('.');
  }

  rupiah = split[1] !== undefined ? rupiah + ',' + split[1] : rupiah;
  return 'Rp ' + rupiah;
};

const parseRawNumber = (value: string) => {
  return value.replace(/[^0-9]/g, '');
};

export default function ProjectItemsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = parseInt(params.id as string);

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = React.useState(false);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<ProjectItemV2 | null>(
    null
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<ProjectItemV2 | null>(
    null
  );
  const [isCancelDialogOpen, setIsCancelDialogOpen] = React.useState(false);
  const [itemToCancel, setItemToCancel] = React.useState<ProjectItemV2 | null>(
    null
  );

  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ['projects-v2', projectId],
    queryFn: () => projectV2Service.getProject(projectId),
  });

  const { data: items, isLoading: isLoadingItems } = useQuery({
    queryKey: ['project-v2-items', projectId],
    queryFn: () => projectV2Service.getProjectItems(projectId),
  });

  const [selectedItemIds, setSelectedItemIds] = React.useState<number[]>([]);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = React.useState(false);

  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      const promises = selectedItemIds.map(id => projectV2Service.deleteProjectItem(id));
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-v2-items', projectId],
      });
      toast.success(`${selectedItemIds.length} item berhasil dihapus`);
      setSelectedItemIds([]);
      setIsBulkDeleteDialogOpen(false);
    },
    onError: () => {
      toast.error('Gagal menghapus beberapa item');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => projectV2Service.deleteProjectItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-v2-items', projectId],
      });
      toast.success('Item deleted successfully');
      setIsDeleteDialogOpen(false);
    },
    onError: () => {
      toast.error('Failed to delete item');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => projectV2Service.cancelProjectItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-v2-items', projectId],
      });
      toast.success('Item dibatalkan');
      setIsCancelDialogOpen(false);
    },
    onError: () => {
      toast.error('Gagal membatalkan item');
    },
  });

  const handleEdit = (item: ProjectItemV2) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  };

  const handleAddItem = () => {
    setIsCatalogOpen(true);
  };

  const handleDeleteClick = (item: ProjectItemV2) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
    }
  };

  const handleCancelClick = (item: ProjectItemV2) => {
    setItemToCancel(item);
    setIsCancelDialogOpen(true);
  };

  const confirmCancel = () => {
    if (itemToCancel) {
      cancelMutation.mutate(itemToCancel.id);
    }
  };

  const [spdFile, setSpdFile] = React.useState<File | null>(null);
  const [spdPendukungFiles, setSpdPendukungFiles] = React.useState<
    (File | null)[]
  >([]);
  const [targetSelesaiDate, setTargetSelesaiDate] = React.useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );

  const uploadSpdMutation = useMutation({
    mutationFn: ({
      file,
      date,
      pendukung,
    }: {
      file: File;
      date: string;
      pendukung?: File[];
    }) => projectV2Service.uploadSPD(projectId, file, date, pendukung),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-v2', projectId] });
      toast.success('SPD uploaded successfully');
      setSpdFile(null);
      setSpdPendukungFiles([]);
    },
    onError: () => {
      toast.error('Failed to upload SPD');
    },
  });

  const handleSpdUpload = () => {
    if (!spdFile) {
      toast.error('Please select a file');
      return;
    }
    uploadSpdMutation.mutate({
      file: spdFile,
      date: targetSelesaiDate,
      pendukung: spdPendukungFiles.filter((f): f is File => f !== null),
    });
  };

  const [sphFile, setSphFile] = React.useState<File | null>(null);
  const [sphNumber, setSphNumber] = React.useState<string>('');
  const [sphNominal, setSphNominal] = React.useState<string>('');
  const [sphPpn, setSphPpn] = React.useState<string>('');
  const [sphGrandTotal, setSphGrandTotal] = React.useState<string>('');

  const uploadSphMutation = useMutation({
    mutationFn: ({
      file,
      number,
      nominal_dpp,
      ppn,
      grand_total,
    }: {
      file: File;
      number: string;
      nominal_dpp?: string;
      ppn?: string;
      grand_total?: string;
    }) => projectV2Service.uploadSPH(projectId, file, number, nominal_dpp, ppn, grand_total),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-v2', projectId] });
      toast.success('SPH uploaded successfully');
      setSphFile(null);
      setSphNumber('');
      setSphNominal('');
      setSphPpn('');
      setSphGrandTotal('');
    },
    onError: () => {
      toast.error('Failed to upload SPH');
    },
  });

  const approveSphMutation = useMutation({
    mutationFn: () => projectV2Service.approveSPH(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-v2', projectId] });
      toast.success('SPH Approved');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve SPH');
    },
  });

  const handleSphUpload = () => {
    if (!sphFile || !sphNumber) {
      toast.error('Please provide both file and SPH number');
      return;
    }
    uploadSphMutation.mutate({
      file: sphFile,
      number: sphNumber,
      nominal_dpp: sphNominal,
      ppn: sphPpn,
      grand_total: sphGrandTotal,
    });
  };

  const [accSentDate, setAccSentDate] = React.useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [accDoneDate, setAccDoneDate] = React.useState<string>('');
  const [accStatus, setAccStatus] = React.useState<string>('In Review');
  const [buktiAccFile, setBuktiAccFile] = React.useState<File | null>(null);

  const updateAccMutation = useMutation({
    mutationFn: (payload: {
      tanggal_kirim?: string;
      tanggal_acc?: string;
      status: string;
      bukti_acc?: File | null;
    }) => projectV2Service.updateAccDesign(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-v2', projectId] });
      toast.success('ACC Design updated successfully');
      setBuktiAccFile(null);
    },
    onError: () => {
      toast.error('Failed to update ACC Design');
    },
  });

  const handleAccUpdate = () => {
    updateAccMutation.mutate({
      tanggal_kirim: accSentDate,
      tanggal_acc: accDoneDate || undefined,
      status: 'Approved',
      bukti_acc: buktiAccFile,
    });
  };

  const [spkFile, setSpkFile] = React.useState<File | null>(null);
  const [spkNumber, setSpkNumber] = React.useState<string>('');
  const [spkTanggalSpk, setSpkTanggalSpk] = React.useState<string>('');
  const [spkDeadline, setSpkDeadline] = React.useState<string>('');
  const [spkTanggalMasuk, setSpkTanggalMasuk] = React.useState<string>('');
  const [spkNominal, setSpkNominal] = React.useState<string>('');
  const [spkPpn, setSpkPpn] = React.useState<string>('');
  const [spkGrandTotal, setSpkGrandTotal] = React.useState<string>('');
  const [spkPenerbitId, setSpkPenerbitId] = React.useState<string>('');

  const [clientPopoverOpen, setClientPopoverOpen] = React.useState(false);
  const [editClientPopoverOpen, setEditClientPopoverOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data: clientsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingClients,
  } = useInfiniteQuery({
    queryKey: ['clients', debouncedSearch],
    queryFn: ({ pageParam = 1 }) =>
      ClientService.getClients({ page: pageParam, search: debouncedSearch }),
    getNextPageParam: (lastPage: any) => {
      const current_page = lastPage.meta?.current_page;
      const last_page = lastPage.meta?.last_page;
      return current_page < last_page ? current_page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const clientsRaw = clientsData?.pages.flatMap((page) => page.data) || [];
  const clients = Array.from(new Map(clientsRaw.map((c: any) => [c.id, c])).values());

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

  const uploadSpkMutation = useMutation({
    mutationFn: ({
      file,
      number,
      deadline,
      prioritas,
      tanggal_masuk,
      nominal_dpp,
      tanggal_spk,
      ppn,
      grand_total,
      penerbit_id,
    }: {
      file: File;
      number: string;
      deadline?: string;
      tanggal_masuk?: string;
      nominal_dpp?: string;
      tanggal_spk?: string;
      ppn?: string;
      grand_total?: string;
      penerbit_id?: string;
    }) =>
      projectV2Service.uploadSPK(
        projectId,
        file,
        number,
        deadline,
        undefined, // prioritas is no longer passed from this form
        tanggal_masuk,
        nominal_dpp,
        tanggal_spk,
        ppn,
        grand_total,
        penerbit_id
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-v2', projectId] });
      toast.success('SPK uploaded successfully');
      setSpkFile(null);
      setSpkNumber('');
      setSpkTanggalSpk('');
      setSpkDeadline('');
      setSpkTanggalMasuk('');
      setSpkNominal('');
      setSpkPpn('');
      setSpkGrandTotal('');
      setSpkPenerbitId('');
    },
    onError: () => {
      toast.error('Failed to upload SPK');
    },
  });

  const handleSpkUpload = () => {
    if (!spkFile || !spkNumber) {
      toast.error('Please provide both file and SPK number');
      return;
    }
    uploadSpkMutation.mutate({
      file: spkFile,
      number: spkNumber,
      deadline: spkDeadline,
      tanggal_masuk: spkTanggalMasuk,
      nominal_dpp: parseRawNumber(spkNominal),
      tanggal_spk: spkTanggalSpk,
      ppn: spkPpn,
      grand_total: spkGrandTotal,
      penerbit_id: spkPenerbitId || undefined,
    });
  };

  const [isEditSphModalOpen, setIsEditSphModalOpen] = React.useState(false);
  const [editSphFile, setEditSphFile] = React.useState<File | null>(null);
  const [editSphNumber, setEditSphNumber] = React.useState<string>('');
  const [editSphNominal, setEditSphNominal] = React.useState<string>('');
  const [editSphPpn, setEditSphPpn] = React.useState<string>('');
  const [editSphGrandTotal, setEditSphGrandTotal] = React.useState<string>('');

  const updateSphMutation = useMutation({
    mutationFn: () =>
      projectV2Service.updateSphMeta(projectId, {
        nomor_sph: editSphNumber,
        file: editSphFile,
        nominal_dpp: editSphNominal ? parseRawNumber(editSphNominal) : undefined,
        ppn: editSphPpn || undefined,
        grand_total: editSphGrandTotal ? parseRawNumber(editSphGrandTotal) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-v2', projectId] });
      toast.success('SPH berhasil diperbarui');
      setEditSphFile(null);
      setIsEditSphModalOpen(false);
    },
    onError: () => {
      toast.error('Gagal memperbarui SPH');
    },
  });

  const handleOpenEditSph = () => {
    if (existingSph) {
      setEditSphNumber(existingSph.nomor_sph || '');
      setEditSphNominal(
        existingSph.nominal_dpp ? formatRupiah(String(existingSph.nominal_dpp)) : ''
      );
      setEditSphPpn(existingSph.ppn ? String(existingSph.ppn) : '');
      setEditSphGrandTotal(
        existingSph.nominal ? formatRupiah(String(existingSph.nominal)) : ''
      );
    }
    setIsEditSphModalOpen(true);
  };

  const [isEditSpkModalOpen, setIsEditSpkModalOpen] = React.useState(false);
  const [editSpkFile, setEditSpkFile] = React.useState<File | null>(null);
  const [editSpkNumber, setEditSpkNumber] = React.useState<string>('');
  const [editSpkTanggalSpk, setEditSpkTanggalSpk] = React.useState<string>('');
  const [editSpkDeadline, setEditSpkDeadline] = React.useState<string>('');
  const [editSpkTanggalMasuk, setEditSpkTanggalMasuk] = React.useState<string>('');
  const [editSpkNominal, setEditSpkNominal] = React.useState<string>('');
  const [editSpkPpn, setEditSpkPpn] = React.useState<string>('');
  const [editSpkGrandTotal, setEditSpkGrandTotal] = React.useState<string>('');
  const [editSpkPenerbitId, setEditSpkPenerbitId] = React.useState<string>('');

  const updateSpkMutation = useMutation({
    mutationFn: () =>
      projectV2Service.updateSpkMeta(projectId, {
        nomor_spk: editSpkNumber,
        file: editSpkFile,
        tanggal_spk: editSpkTanggalSpk || undefined,
        deadline: editSpkDeadline || undefined,
        tanggal_masuk: editSpkTanggalMasuk || undefined,
        nominal_dpp: editSpkNominal ? parseRawNumber(editSpkNominal) : undefined,
        ppn: editSpkPpn || undefined,
        grand_total: editSpkGrandTotal ? parseRawNumber(editSpkGrandTotal) : undefined,
        penerbit_id: editSpkPenerbitId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-v2', projectId] });
      toast.success('SPK berhasil diperbarui');
      setEditSpkFile(null);
      setIsEditSpkModalOpen(false);
    },
    onError: () => {
      toast.error('Gagal memperbarui SPK');
    },
  });

  const toDateInput = (val: string | null | undefined) =>
    val ? val.substring(0, 10) : '';

  const handleOpenEditSpk = () => {
    if (existingSpk) {
      setEditSpkNumber(existingSpk.nomor_spk || '');
      setEditSpkTanggalSpk(toDateInput(existingSpk.tanggal_spk));
      setEditSpkDeadline(toDateInput(project?.deadline));
      setEditSpkTanggalMasuk(toDateInput(existingSpk.tanggal_masuk));
      setEditSpkNominal(
        existingSpk.nominal_dpp ? formatRupiah(String(existingSpk.nominal_dpp)) : ''
      );
      setEditSpkPpn(existingSpk.ppn ? String(existingSpk.ppn) : '');
      setEditSpkGrandTotal(
        existingSpk.nominal ? formatRupiah(String(existingSpk.nominal)) : ''
      );
      setEditSpkPenerbitId(existingSpk.penerbit_id ? String(existingSpk.penerbit_id) : '');
    }
    setIsEditSpkModalOpen(true);
  };

  const [signedSpkFile, setSignedSpkFile] = React.useState<File | null>(null);
  const [signedSpkDeadline, setSignedSpkDeadline] = React.useState<string>('');
  const [signedSpkTanggalMasuk, setSignedSpkTanggalMasuk] =
    React.useState<string>('');
  const [signedSpkNominal, setSignedSpkNominal] = React.useState<string>('');
  const [isSignedSpkModalOpen, setIsSignedSpkModalOpen] = React.useState(false);

  const approveSpkMutation = useMutation({
    mutationFn: ({
      file,
      deadline,
      tanggal_masuk,
      nominal,
    }: {
      file: File;
      deadline?: string;
      tanggal_masuk?: string;
      nominal?: string;
    }) =>
      projectV2Service.approveSPK(
        projectId,
        file,
        deadline,
        tanggal_masuk,
        nominal
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-v2', projectId] });
      toast.success('Signed SPK uploaded successfully');
      setSignedSpkFile(null);
      setSignedSpkDeadline('');
      setSignedSpkTanggalMasuk('');
      setSignedSpkNominal('');
      setIsSignedSpkModalOpen(false);
    },
    onError: () => {
      toast.error('Failed to upload Signed SPK');
    },
  });

  const handleSignedSpkUpload = () => {
    if (!signedSpkFile) {
      toast.error('Please provide a file');
      return;
    }
    approveSpkMutation.mutate({
      file: signedSpkFile,
      deadline: signedSpkDeadline,
      tanggal_masuk: signedSpkTanggalMasuk,
      nominal: parseRawNumber(signedSpkNominal) || undefined,
    });
  };

  const [isSpdModalOpen, setIsSpdModalOpen] = React.useState(false);
  const [isAccModalOpen, setIsAccModalOpen] = React.useState(false);
  const [isSphModalOpen, setIsSphModalOpen] = React.useState(false);
  const [isSpkModalOpen, setIsSpkModalOpen] = React.useState(false);

  const [isSpdCollapsed, setIsSpdCollapsed] = React.useState(true);
  const [isAccCollapsed, setIsAccCollapsed] = React.useState(true);
  const [isSphCollapsed, setIsSphCollapsed] = React.useState(true);
  const [isSpkCollapsed, setIsSpkCollapsed] = React.useState(true);
  const [isNeedDesignModalOpen, setIsNeedDesignModalOpen] =
    React.useState(false);
  const [needDesignValue, setNeedDesignValue] = React.useState<number>(
    project?.need_design ?? 1
  );

  const existingSpd = project?.designs?.[0];
  const existingSph = project?.sphs?.[0];
  const existingAcc = existingSpd?.acc_design;
  const existingSpk = project?.spk;

  // Sync state when project data loads
  React.useEffect(() => {
    if (existingAcc) {
      if (existingAcc.tanggal_kirim) setAccSentDate(existingAcc.tanggal_kirim);
      if (existingAcc.tanggal_acc) setAccDoneDate(existingAcc.tanggal_acc);
      setAccStatus(existingAcc.status);
    }
    if (project) {
      setNeedDesignValue(project.need_design);
    }
  }, [existingAcc, project]);

  // Pre-populate signed SPK states when modal opens
  React.useEffect(() => {
    if (isSignedSpkModalOpen && existingSpk) {
      setSignedSpkDeadline(existingSpk.deadline || '');
      setSignedSpkTanggalMasuk(existingSpk.tanggal_masuk || '');
      setSignedSpkNominal(
        existingSpk.nominal ? formatRupiah(existingSpk.nominal) : ''
      );
    }
  }, [isSignedSpkModalOpen, existingSpk]);

  const updateNeedDesignMutation = useMutation({
    mutationFn: (value: number) => {
      if (!project) throw new Error('Project not found');
      return projectV2Service.updateProject(projectId, {
        name: project.name,
        client_id: project.client_id,
        need_design: value,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-v2', projectId] });
      toast.success('Project updated successfully');
      setIsNeedDesignModalOpen(false);
    },
    onError: () => {
      toast.error('Failed to update project');
    },
  });

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
      title: 'Upload SPD',
      description:
        project.need_design === 0 ? 'Tanpa Design' : 'Surat Permintaan Desain',
      isCompleted: project.need_design === 0 || !!existingSpd?.spd_file,
      isActive: true,
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-500',
      lightBg: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
    {
      id: 2,
      title: 'ACC Design',
      description:
        project.need_design === 0 ? 'Tanpa Design' : 'Approval Desain',
      isCompleted:
        project.need_design === 0 || existingAcc?.status === 'Approved',
      isActive: project.need_design === 0 || !!existingSpd?.spd_file,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500',
      lightBg: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
    },
    {
      id: 3,
      title: 'Upload SPH',
      description:
        project.need_design === 0 ? 'Tanpa Design' : 'Surat Penawaran Harga',
      isCompleted: !!existingSph?.file,
      isActive: project.need_design === 0 || existingAcc?.status === 'Approved',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500',
      lightBg: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      id: 4,
      title: 'Upload SPK',
      description: 'Surat Perintah Kerja',
      isCompleted: !!existingSpk?.file || !!existingSpk?.spk_signed_file,
      isActive: !!existingSph?.file,
      icon: ClipboardCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500',
      lightBg: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    {
      id: 5,
      title: 'Project Items',
      description: 'Add items',
      isCompleted: items && items.length > 0,
      isActive: !!existingSpk?.file,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500',
      lightBg: 'bg-blue-50',
      borderColor: 'border-blue-200',
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
              <p className='text-xs text-muted-foreground'>Project Workflow</p>
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
                  <Calendar className='h-3 w-3 text-neutral-400' />
                  {format(new Date(project.deadline), 'MMM d, yyyy')}
                </span>
              )}
              <button
                onClick={() => setIsNeedDesignModalOpen(true)}
                className='group flex items-center gap-1 text-xs hover:bg-neutral-100 px-1.5 py-0.5 rounded-md transition-colors'
              >
                {project.need_design ? (
                  <span className='flex items-center gap-1 text-emerald-600 font-medium'>
                    <Info className='h-3 w-3 text-emerald-500' />
                    Perlu Desain
                    <Pencil className='h-2.5 w-2.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity' />
                  </span>
                ) : (
                  <span className='flex items-center gap-1 text-neutral-600 font-medium'>
                    <Info className='h-3 w-3 text-neutral-400' />
                    Tidak Perlu Desain
                    <Pencil className='h-2.5 w-2.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity' />
                  </span>
                )}
              </button>
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
      <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full'>
        {/* 1. SPD SECTION */}
        <Card
          className={`border shadow-sm transition-all duration-300 ${
            flowSteps[0].isActive
              ? flowSteps[0].isCompleted
                ? 'border-orange-200 bg-white ring-1 ring-orange-100'
                : 'border-orange-300 bg-white ring-2 ring-orange-500 ring-offset-2'
              : 'border-neutral-200 bg-neutral-50/80 opacity-60 grayscale-[0.5]'
          }`}
        >
          <CardHeader className='pb-3 flex flex-row items-center justify-between gap-2 min-w-0'>
            <button
              className='flex items-center gap-2 flex-1 text-left min-w-0'
              onClick={() => setIsSpdCollapsed((v) => !v)}
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center font-bold shrink-0 ${
                  flowSteps[0].isActive
                    ? 'bg-orange-100 text-orange-600'
                    : 'bg-neutral-200 text-neutral-500'
                }`}
              >
                1
              </div>
              <div className='flex-1 min-w-0'>
                <CardTitle
                  className='text-sm sm:text-base text-neutral-800 truncate'
                  title='Upload SPD'
                >
                  Upload SPD
                </CardTitle>
                <p
                  className='text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider truncate'
                  title='Surat Permintaan Desain'
                >
                  'Surat Permintaan Desain'
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-neutral-400 transition-transform duration-200 mr-1 shrink-0 ${
                  isSpdCollapsed ? '-rotate-90' : ''
                }`}
              />
            </button>
          </CardHeader>
          {!isSpdCollapsed && (
            <CardContent>
              {existingSpd?.spd_file ? (
                <>
                  <div className='p-3 rounded-xl bg-orange-50/80 border border-orange-100 flex items-center justify-between shadow-sm min-w-0 gap-2'>
                    <div className='flex items-center gap-3 min-w-0 flex-1 mr-2'>
                      <div className='h-8 w-8 rounded-lg bg-white shadow-sm border border-orange-100 flex items-center justify-center text-orange-600 shrink-0'>
                        <FileText className='h-4 w-4' />
                      </div>
                      <div className='min-w-0 flex-1'>
                        <p
                          className='text-xs font-bold text-orange-900 truncate'
                          title='SPD Document'
                        >
                          SPD Document
                        </p>
                        <p className='text-[10px] text-orange-600/80 truncate'>
                          {format(
                            new Date(
                              existingSpd.target_selesai ||
                                existingSpd.tanggal ||
                                existingSpd.created_at
                            ),
                            'MMM d, yyyy'
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8 text-orange-600 hover:bg-orange-200 bg-white shadow-sm border border-orange-100 shrink-0'
                      asChild
                    >
                      <a
                        href={`${(
                          process.env.NEXT_PUBLIC_API_URL ||
                          'http://localhost:8000'
                        ).replace('/api', '')}/storage/${existingSpd.spd_file}`}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        <FileDown className='h-4 w-4' />
                      </a>
                    </Button>
                  </div>
                  {/* {project.file_pendukung_spd &&
                    project.file_pendukung_spd.length > 0 && (
                      <div className='mt-3 pt-3 border-t border-orange-100 space-y-2'>
                        <p className='text-[10px] font-bold text-orange-700 uppercase tracking-wider'>
                          File Pendukung
                        </p>
                        <div className='grid grid-cols-1 gap-2'>
                          {project.file_pendukung_spd.map((fp, i) => (
                            <div
                              key={fp.id}
                              className='flex items-center justify-between p-2 rounded-lg bg-white border border-orange-50 shadow-sm min-w-0 gap-2'
                            >
                              <div className='flex items-center gap-2 overflow-hidden min-w-0 flex-1 mr-2'>
                                <FileText className='h-3 w-3 text-orange-400 shrink-0' />
                                <span
                                  className='text-[10px] text-orange-800 truncate'
                                  title={`File Pendukung ${i + 1}`}
                                >
                                  File Pendukung {i + 1}
                                </span>
                              </div>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-6 w-6 text-orange-600 hover:bg-orange-50 shrink-0'
                                asChild
                              >
                                <a
                                  href={`${(
                                    process.env.NEXT_PUBLIC_API_URL ||
                                    'http://localhost:8000'
                                  ).replace('/api', '')}/storage/${fp.file}`}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                >
                                  <FileDown className='h-3 w-3' />
                                </a>
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )} */}
                  <Button
                    size='sm'
                    variant='outline'
                    className='w-full h-8 text-[10px] border-orange-200 text-orange-600 hover:bg-orange-50 mt-3 shrink-0'
                    disabled={
                      !flowSteps[0].isActive || project.need_design === 0
                    }
                    onClick={() => setIsSpdModalOpen(true)}
                  >
                    <Upload className='h-3 w-3 mr-1' />
                    Ganti SPD
                  </Button>
                </>
              ) : (
                <div className='space-y-3'>
                  <p className='text-xs text-muted-foreground italic'>
                    {project.need_design === 0
                      ? 'Tanpa Desain'
                      : 'Belum ada file SPD.'}
                  </p>
                  <Button
                    size='sm'
                    variant='outline'
                    className='w-full h-8 text-[10px] border-orange-200 text-orange-600 hover:bg-orange-50 shrink-0'
                    disabled={
                      !flowSteps[0].isActive || project.need_design === 0
                    }
                    onClick={() => setIsSpdModalOpen(true)}
                  >
                    <Upload className='h-3 w-3 mr-1' />
                    Upload SPD
                  </Button>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* 2. ACC DESIGN SECTION */}
        <Card
          className={`border shadow-sm transition-all duration-300 ${
            flowSteps[1].isActive
              ? flowSteps[1].isCompleted
                ? 'border-emerald-200 bg-white ring-1 ring-emerald-100'
                : 'border-emerald-300 bg-white ring-2 ring-emerald-500 ring-offset-2'
              : 'border-neutral-200 bg-neutral-50/80 opacity-60 grayscale-[0.5]'
          }`}
        >
          <CardHeader className='pb-3 flex flex-row items-center justify-between gap-2 min-w-0'>
            <button
              className='flex items-center gap-2 flex-1 text-left min-w-0'
              onClick={() => setIsAccCollapsed((v) => !v)}
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center font-bold shrink-0 ${
                  flowSteps[1].isActive
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-neutral-200 text-neutral-500'
                }`}
              >
                2
              </div>
              <div className='flex-1 min-w-0'>
                <CardTitle
                  className='text-sm sm:text-base text-neutral-800 truncate'
                  title='ACC Design'
                >
                  ACC Design
                </CardTitle>
                <p
                  className='text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider truncate'
                  title='Approval Status'
                >
                  'Approval Status'
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-neutral-400 transition-transform duration-200 mr-1 shrink-0 ${
                  isAccCollapsed ? '-rotate-90' : ''
                }`}
              />
            </button>
          </CardHeader>
          {!isAccCollapsed && (
            <CardContent className='space-y-4'>
              {existingAcc ? (
                <div className='space-y-3'>
                  <div className='space-y-2'>
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                        existingAcc.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <CheckCircle2 className='h-3 w-3 shrink-0' />
                      <span className='truncate'>{existingAcc.status}</span>
                    </div>
                    {existingAcc.tanggal_kirim && (
                      <p className='text-[10px] text-muted-foreground truncate'>
                        Kirim:{' '}
                        {format(
                          new Date(existingAcc.tanggal_kirim),
                          'MMM d, yyyy'
                        )}
                      </p>
                    )}
                    {existingAcc.tanggal_acc && (
                      <p className='text-[10px] text-muted-foreground truncate'>
                        ACC:{' '}
                        {format(
                          new Date(existingAcc.tanggal_acc),
                          'MMM d, yyyy'
                        )}
                      </p>
                    )}
                    {existingAcc.bukti_acc && (
                      <a
                        href={`${(
                          process.env.NEXT_PUBLIC_API_URL ||
                          'http://localhost:8000'
                        ).replace('/api', '')}/storage/${
                          existingAcc.bukti_acc
                        }`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-[10px] text-emerald-600 hover:underline flex items-center gap-1 min-w-0'
                      >
                        <FileDown className='h-3 w-3 shrink-0' />
                        <span className='truncate'>Bukti ACC</span>
                      </a>
                    )}
                  </div>
                  <Button
                    size='sm'
                    variant='outline'
                    className='w-full h-8 text-[10px] border-emerald-200 text-emerald-600 hover:bg-emerald-50 shrink-0'
                    disabled={
                      !flowSteps[1].isActive || project.need_design === 0
                    }
                    onClick={() => setIsAccModalOpen(true)}
                  >
                    <Pencil className='h-3 w-3 mr-1' />
                    Update ACC Design
                  </Button>
                </div>
              ) : (
                <div className='space-y-3'>
                  <p className='text-xs text-muted-foreground italic'>
                    {project.need_design === 0
                      ? 'Tanpa Desain'
                      : 'Belum ada data ACC.'}
                  </p>
                  <Button
                    size='sm'
                    variant='outline'
                    className='w-full h-8 text-[10px] border-emerald-200 text-emerald-600 hover:bg-emerald-50 shrink-0'
                    disabled={
                      !flowSteps[1].isActive || project.need_design === 0
                    }
                    onClick={() => setIsAccModalOpen(true)}
                  >
                    <Pencil className='h-3 w-3 mr-1' />
                    Update ACC Design
                  </Button>
                </div>
              )}

              {/* Design Progress Files from Studio */}
              {existingSpd?.design_progres &&
                existingSpd.design_progres.length > 0 && (
                  <div className='pt-4 border-t border-neutral-100 space-y-3'>
                    <p className='text-[10px] uppercase font-bold text-neutral-500 flex items-center gap-1.5 truncate'>
                      <ImageIcon className='h-3 w-3 shrink-0' />
                      Design Progress Files
                    </p>
                    <div className='space-y-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar'>
                      {existingSpd.design_progres.map((p) => (
                        <div
                          key={p.id}
                          className='p-2 rounded-lg border border-neutral-100 bg-neutral-50/50 space-y-1.5 min-w-0'
                        >
                          <div className='flex items-start justify-between gap-2 min-w-0'>
                            <div className='min-w-0 flex-1'>
                              <p
                                className='text-[10px] font-bold text-neutral-800 truncate'
                                title={p.tahap_design?.nama}
                              >
                                {p.tahap_design?.nama}
                              </p>
                              <p className='text-[8px] text-muted-foreground'>
                                Submit:{' '}
                                {p.tanggal_selesai
                                  ? format(
                                      new Date(p.tanggal_selesai),
                                      'MMM d, yyyy'
                                    )
                                  : '-'}
                              </p>
                            </div>
                            {p.file && (
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-6 w-6 text-blue-600 bg-white shadow-sm border border-blue-50 shrink-0'
                                asChild
                              >
                                <a
                                  href={`${(
                                    process.env.NEXT_PUBLIC_API_URL ||
                                    'http://localhost:8000'
                                  ).replace('/api', '')}/storage/${p.file}`}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                >
                                  <FileDown className='h-3 w-3' />
                                </a>
                              </Button>
                            )}
                          </div>
                          {p.catatan && (
                            <p className='text-[9px] text-neutral-600 bg-white p-1.5 rounded border border-neutral-50 italic break-words'>
                              "{p.catatan}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </CardContent>
          )}
        </Card>

        {/* 3. SPH SECTION */}
        <Card
          className={`border shadow-sm transition-all duration-300 ${
            flowSteps[2].isActive
              ? flowSteps[2].isCompleted
                ? 'border-blue-200 bg-white ring-1 ring-blue-100'
                : 'border-blue-300 bg-white ring-2 ring-blue-500 ring-offset-2'
              : 'border-neutral-200 bg-neutral-50/80 opacity-60 grayscale-[0.5]'
          }`}
        >
          <CardHeader className='pb-3 flex flex-row items-center justify-between gap-2 min-w-0'>
            <button
              className='flex items-center gap-2 flex-1 text-left min-w-0'
              onClick={() => setIsSphCollapsed((v) => !v)}
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center font-bold shrink-0 ${
                  flowSteps[2].isActive
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-neutral-200 text-neutral-500'
                }`}
              >
                3
              </div>
              <div className='flex-1 min-w-0'>
                <CardTitle
                  className='text-sm sm:text-base text-neutral-800 truncate'
                  title='Upload SPH'
                >
                  Upload SPH
                </CardTitle>
                <p
                  className='text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider truncate'
                  title='Surat Penawaran'
                >
                  'Surat Penawaran'
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-neutral-400 transition-transform duration-200 mr-1 shrink-0 ${
                  isSphCollapsed ? '-rotate-90' : ''
                }`}
              />
            </button>
          </CardHeader>
          {!isSphCollapsed && (
            <CardContent className='space-y-3'>
              {/* List Furnitur from Studio */}
              {project?.list_furnitur?.file && (
                <div className='p-3 rounded-xl bg-purple-50/80 border border-purple-100 flex items-center justify-between shadow-sm min-w-0 gap-2'>
                  <div className='flex items-center gap-3 min-w-0 flex-1 mr-2'>
                    <div className='h-8 w-8 rounded-lg bg-white shadow-sm border border-purple-100 flex items-center justify-center text-purple-600 shrink-0'>
                      <FileText className='h-4 w-4' />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='text-xs font-bold text-purple-900 truncate'>
                        List Furnitur
                      </p>
                      <p className='text-[10px] text-purple-600/80 truncate'>
                        Uploaded by Studio
                      </p>
                    </div>
                  </div>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-8 w-8 text-purple-600 hover:bg-purple-200 bg-white shadow-sm border border-purple-100 shrink-0'
                    asChild
                  >
                    <a
                      href={`${(
                        process.env.NEXT_PUBLIC_API_URL ||
                        'http://localhost:8000'
                      ).replace('/api', '')}/storage/${
                        project.list_furnitur.file
                      }`}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <FileDown className='h-4 w-4' />
                    </a>
                  </Button>
                </div>
              )}
              {existingSph?.file ? (
                <div className='space-y-3'>
                  <div className='p-3 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-between shadow-sm min-w-0 gap-2'>
                    <div className='flex items-center gap-3 min-w-0 flex-1 mr-2'>
                      <div className='h-8 w-8 rounded-lg bg-white shadow-sm border border-blue-100 flex items-center justify-center text-blue-600 shrink-0'>
                        <FileText className='h-4 w-4' />
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='flex flex-wrap items-center gap-1.5'>
                          <p
                            className='text-xs font-bold text-blue-900 truncate max-w-full'
                            title={existingSph.nomor_sph}
                          >
                            {existingSph.nomor_sph}
                          </p>
                          {existingSph.status && (
                            <Badge
                              variant='outline'
                              className={`text-[9px] h-4 px-1.5 uppercase tracking-wider shrink-0 ${
                                existingSph.status === 'approved'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : existingSph.status === 'revision'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              {existingSph.status}
                            </Badge>
                          )}
                        </div>
                        <p className='text-[10px] text-blue-600/80 truncate'>
                          {format(
                            new Date(existingSph.created_at),
                            'MMM d, yyyy'
                          )}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center shrink-0'>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8 text-blue-600 hover:bg-blue-200 bg-white shadow-sm border border-blue-100 shrink-0'
                        asChild
                      >
                        <a
                          href={`${(
                            process.env.NEXT_PUBLIC_API_URL ||
                            'http://localhost:8000'
                          ).replace('/api', '')}/storage/${existingSph.file}`}
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          <FileDown className='h-4 w-4' />
                        </a>
                      </Button>
                    </div>
                  </div>
                  <Button
                    size='sm'
                    variant='outline'
                    className='w-full h-8 text-[10px] border-blue-200 text-blue-700 hover:bg-blue-50 shrink-0'
                    disabled={
                      !flowSteps[2].isActive ||
                      existingSph?.status === 'approved'
                    }
                    onClick={handleOpenEditSph}
                  >
                    <Pencil className='h-3 w-3 mr-1' />
                    Edit SPH
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    className='w-full h-8 text-[10px] border-blue-200 text-blue-600 hover:bg-blue-50 shrink-0'
                    disabled={
                      !flowSteps[2].isActive ||
                      existingSph?.status === 'approved'
                    }
                    onClick={() => setIsSphModalOpen(true)}
                  >
                    <Upload className='h-3 w-3 mr-1' />
                    Ganti SPH
                  </Button>
                </div>
              ) : (
                <div className='space-y-3'>
                  <p className='text-xs text-muted-foreground italic'>
                    {project.need_design === 0
                      ? 'Tanpa Desain'
                      : 'Belum ada file SPH.'}
                  </p>
                  <Button
                    size='sm'
                    variant='outline'
                    className='w-full h-8 text-[10px] border-blue-200 text-blue-600 hover:bg-blue-50 shrink-0'
                    disabled={!flowSteps[2].isActive}
                    onClick={() => setIsSphModalOpen(true)}
                  >
                    <Upload className='h-3 w-3 mr-1' />
                    Upload SPH
                  </Button>
                </div>
              )}

              {existingSph?.file && existingSph.status !== 'approved' && (
                <Button
                  size='sm'
                  className='w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] h-8 shadow-sm mt-1 shrink-0'
                  onClick={() => approveSphMutation.mutate()}
                  disabled={approveSphMutation.isPending}
                >
                  {approveSphMutation.isPending ? (
                    <Loader2 className='h-3 w-3 animate-spin mr-1.5' />
                  ) : (
                    <CheckCircle className='h-3 w-3 mr-1.5' />
                  )}
                  Approve SPH
                </Button>
              )}

              {existingSph?.status === 'revision' &&
                existingSph.note_revision && (
                  <div className='p-3 rounded-xl bg-red-50 border border-red-100 space-y-1.5'>
                    <p className='text-[10px] font-bold text-red-800 uppercase tracking-tight flex items-center gap-1'>
                      <AlertCircle className='h-3 w-3 shrink-0' />
                      Revision Requested
                    </p>
                    <p className='text-[11px] text-red-700 italic bg-white/50 p-2 rounded border border-red-50 break-words'>
                      "{existingSph.note_revision}"
                    </p>
                    <Button
                      size='sm'
                      className='w-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] h-8 mt-2 shadow-sm shrink-0'
                      onClick={() => setIsSphModalOpen(true)}
                    >
                      <Upload className='h-3 w-3 mr-1.5' />
                      Upload SPH Baru (Revisi)
                    </Button>
                  </div>
                )}

              {/* SPH History */}
              {project?.sphs && project.sphs.length > 1 && (
                <div className='mt-4 pt-4 border-t border-neutral-100'>
                  <p className='text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2'>
                    History SPH
                  </p>
                  <div className='space-y-2'>
                    {project.sphs.slice(1).map((sph: any, idx: number) => (
                      <div
                        key={idx}
                        className='flex items-center justify-between p-2 rounded-lg bg-neutral-50 border border-neutral-100 group min-w-0 gap-2'
                      >
                        <div className='flex items-center gap-2 overflow-hidden min-w-0 flex-1'>
                          <FileText className='h-3 w-3 text-neutral-400 shrink-0' />
                          <div className='min-w-0 flex-1'>
                            <p
                              className='text-[10px] font-medium text-neutral-700 truncate'
                              title={sph.nomor_sph}
                            >
                              {sph.nomor_sph}
                            </p>
                            <p className='text-[9px] text-neutral-400 truncate'>
                              {format(
                                new Date(sph.created_at),
                                'dd/MM/yyyy HH:mm'
                              )}
                            </p>
                          </div>
                        </div>
                        <div className='flex items-center gap-1 shrink-0'>
                          <Badge
                            variant='outline'
                            className={`text-[8px] h-3.5 px-1 uppercase tracking-tight shrink-0 ${
                              sph.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                : sph.status === 'revision'
                                ? 'bg-red-50 text-red-600 border-red-100'
                                : 'bg-blue-50 text-blue-600 border-blue-100'
                            }`}
                          >
                            {sph.status}
                          </Badge>
                          <Button
                            size='icon'
                            variant='ghost'
                            className='h-6 w-6 text-blue-600 hover:bg-blue-100 shrink-0'
                            asChild
                          >
                            <a
                              href={`${(
                                process.env.NEXT_PUBLIC_API_URL ||
                                'http://localhost:8000'
                              ).replace('/api', '')}/storage/${sph.file}`}
                              target='_blank'
                              rel='noopener noreferrer'
                            >
                              <FileDown className='h-3 w-3' />
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* 4. SPK SECTION */}
        <Card
          className={`border shadow-sm transition-all duration-300 ${
            flowSteps[3].isActive
              ? flowSteps[3].isCompleted
                ? 'border-purple-200 bg-white ring-1 ring-purple-100'
                : 'border-purple-300 bg-white ring-2 ring-purple-500 ring-offset-2'
              : 'border-neutral-200 bg-neutral-50/80 opacity-60 grayscale-[0.5]'
          }`}
        >
          <CardHeader className='pb-3 flex flex-row items-center justify-between gap-2 min-w-0'>
            <button
              className='flex items-center gap-2 flex-1 text-left min-w-0'
              onClick={() => setIsSpkCollapsed((v) => !v)}
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center font-bold shrink-0 ${
                  flowSteps[3].isActive
                    ? 'bg-purple-100 text-purple-600'
                    : 'bg-neutral-200 text-neutral-500'
                }`}
              >
                4
              </div>
              <div className='flex-1 min-w-0'>
                <CardTitle
                  className='text-sm sm:text-base text-neutral-800 truncate'
                  title='Upload SPK'
                >
                  Upload SPK
                </CardTitle>
                <p
                  className='text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider truncate'
                  title='Surat Perintah Kerja'
                >
                  Surat Perintah Kerja
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-neutral-400 transition-transform duration-200 mr-1 shrink-0 ${
                  isSpkCollapsed ? '-rotate-90' : ''
                }`}
              />
            </button>
          </CardHeader>
          {!isSpkCollapsed && (
            <CardContent>
              {existingSpk?.file || existingSpk?.spk_signed_file ? (
                <div className='space-y-3'>
                  <div className='p-3 rounded-xl bg-purple-50/80 border border-purple-100 flex items-center justify-between shadow-sm min-w-0 gap-2'>
                    <div className='flex items-center gap-3 min-w-0 flex-1 mr-2'>
                      <div className='h-8 w-8 rounded-lg bg-white shadow-sm border border-purple-100 flex items-center justify-center text-purple-600 shrink-0'>
                        <FileText className='h-4 w-4' />
                      </div>
                      <div className='min-w-0 flex-1'>
                        <p
                          className='text-xs font-bold text-purple-900 truncate'
                          title={existingSpk.nomor_spk}
                        >
                          {existingSpk.nomor_spk}
                        </p>
                        <p className='text-[10px] text-purple-600/80 truncate'>
                          {format(
                            new Date(existingSpk.created_at),
                            'MMM d, yyyy'
                          )}
                          {existingSpk.tanggal_spk &&
                            ` • SPK: ${format(
                              new Date(existingSpk.tanggal_spk),
                              'MMM d, yyyy'
                            )}`}
                        </p>
                      </div>
                    </div>
                    <div className='flex gap-2 shrink-0'>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8 text-purple-600 hover:bg-purple-200 bg-white shadow-sm border border-purple-100'
                        asChild
                      >
                        <a
                          href={`${(
                            process.env.NEXT_PUBLIC_API_URL ||
                            'http://localhost:8000'
                          ).replace('/api', '')}/storage/${
                            existingSpk.spk_signed_file || existingSpk.file
                          }`}
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          <FileDown className='h-4 w-4' />
                        </a>
                      </Button>
                    </div>
                  </div>

                  {/* Signed SPK Section */}
                  {
                    existingSpk?.spk_signed_file && (
                      <div className='p-3 rounded-xl bg-emerald-50/80 border border-emerald-100 flex items-center justify-between shadow-sm min-w-0 gap-2'>
                        <div className='flex items-center gap-3 min-w-0 flex-1 mr-2'>
                          <div className='h-8 w-8 rounded-lg bg-white shadow-sm border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0'>
                            <CheckCircle2 className='h-4 w-4' />
                          </div>
                          <div className='min-w-0 flex-1'>
                            <p
                              className='text-xs font-bold text-emerald-900 truncate'
                              title='SPK Bertanda Tangan'
                            >
                              SPK Bertanda Tangan
                            </p>
                            <p className='text-[10px] text-emerald-600/80 italic font-medium truncate'>
                              {existingSpk.spk_status === 'approved'
                                ? 'Terverifikasi'
                                : 'Sudah diunggah'}
                              {existingSpk.tanggal_masuk &&
                                ` • Masuk: ${format(
                                  new Date(existingSpk.tanggal_masuk),
                                  'MMM d, yyyy'
                                )}`}
                              {existingSpk.nominal &&
                                ` • Nominal: ${formatRupiah(
                                  existingSpk.nominal
                                )}`}
                            </p>
                          </div>
                        </div>
                        <div className='flex gap-2 shrink-0'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8 text-emerald-600 hover:bg-emerald-200 bg-white shadow-sm border border-emerald-100'
                            asChild
                          >
                            <a
                              href={`${(
                                process.env.NEXT_PUBLIC_API_URL ||
                                'http://localhost:8000'
                              ).replace('/api', '')}/storage/${
                                existingSpk.spk_signed_file
                              }`}
                              target='_blank'
                              rel='noopener noreferrer'
                            >
                              <FileDown className='h-4 w-4' />
                            </a>
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8 text-neutral-400 hover:bg-neutral-100 bg-white shadow-sm border border-neutral-100'
                            onClick={() => setIsSignedSpkModalOpen(true)}
                          >
                            <Upload className='h-3 w-3' />
                          </Button>
                        </div>
                      </div>
                    )
                    // : (
                    //   <Button
                    //     variant='outline'
                    //     className='w-full text-xs h-9 border-dashed border-emerald-300 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400 font-semibold'
                    //     onClick={() => setIsSignedSpkModalOpen(true)}
                    //   >
                    //     <Upload className='h-3.5 w-3.5 mr-1.5' />
                    //     Upload SPK Bertanda Tangan
                    //   </Button>
                    // )
                  }
                  <Button
                    size='sm'
                    variant='outline'
                    className='w-full h-8 text-[10px] border-purple-200 text-purple-700 hover:bg-purple-50 shrink-0 mt-1'
                    disabled={!flowSteps[3].isActive}
                    onClick={handleOpenEditSpk}
                  >
                    <Pencil className='h-3 w-3 mr-1' />
                    Edit SPK
                  </Button>
                  {/* <Button
                      size='sm'
                      variant='outline'
                      className='w-full h-8 text-[10px] border-purple-200 text-purple-600 hover:bg-purple-50 shrink-0 mt-1'
                      disabled={!flowSteps[3].isActive}
                      onClick={() => setIsSpkModalOpen(true)}
                    >
                      <Upload className='h-3 w-3 mr-1' />
                      Ganti SPK
                    </Button> */}
                </div>
              ) : (
                <div className='space-y-3'>
                  <p className='text-xs text-muted-foreground italic'>
                    Belum ada file SPK.
                  </p>
                  <Button
                    size='sm'
                    variant='outline'
                    className='w-full h-8 text-[10px] border-purple-200 text-purple-600 hover:bg-purple-50 shrink-0'
                    disabled={!flowSteps[3].isActive}
                    onClick={() => setIsSpkModalOpen(true)}
                  >
                    <Upload className='h-3 w-3 mr-1' />
                    Upload SPK
                  </Button>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>
      <Card
        className={`border shadow-sm overflow-hidden transition-all duration-300 w-full ${
          flowSteps[4].isActive && !flowSteps[4].isCompleted
            ? 'ring-2 ring-blue-500 ring-offset-2'
            : 'ring-1 ring-neutral-200/50'
        }`}
      >
        <CardHeader className='bg-blue-50/50 border-b border-blue-100 flex flex-row items-center justify-between py-4'>
          <div className='flex items-center gap-3'>
            <div className='h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold'>
              5
            </div>
            <div>
              <CardTitle className='text-lg text-blue-900'>
                Project Items
              </CardTitle>
              <p className='text-xs text-blue-600/80'>
                Add and manage items for this project
              </p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            {selectedItemIds.length > 0 && (
              <Button
                onClick={() => setIsBulkDeleteDialogOpen(true)}
                variant='destructive'
                className='shadow-sm transition-all hover:scale-105 active:scale-95'
              >
                <Trash2 className='mr-2 h-4 w-4' />
                Hapus Terpilih ({selectedItemIds.length})
              </Button>
            )}
            <Button
              onClick={() => setIsImportOpen(true)}
              variant='outline'
              className='border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 shadow-sm'
            >
              <Upload className='mr-2 h-4 w-4' />
              Import Excel
            </Button>

            <Button
              onClick={handleAddItem}
              className='bg-blue-600 hover:bg-blue-700 shadow-sm transition-all hover:scale-105 active:scale-95'
            >
              <Plus className='mr-2 h-4 w-4' />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader className='bg-white'>
                <TableRow>
                  <TableHead className='w-[40px] text-center'>
                    <Checkbox
                      checked={!!items && items.length > 0 && selectedItemIds.length === items.length}
                      onCheckedChange={(checked) => {
                        if (checked && items) {
                          setSelectedItemIds(items.map((i) => i.id));
                        } else {
                          setSelectedItemIds([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead className='w-[50px] whitespace-nowrap'>
                    #
                  </TableHead>
                  <TableHead className='whitespace-nowrap'>
                    Kode Barang
                  </TableHead>
                  <TableHead className='whitespace-nowrap'>Lantai</TableHead>
                  <TableHead className='whitespace-nowrap'>
                    Area/Sub Kategori
                  </TableHead>
                  <TableHead className='whitespace-nowrap'>Ruang</TableHead>
                  <TableHead className='whitespace-nowrap min-w-[200px]'>
                    Item
                  </TableHead>
                  <TableHead className='whitespace-nowrap'>
                    Size (P x L x T) <br /> (Meter)
                  </TableHead>
                  <TableHead className='whitespace-nowrap'>Vol</TableHead>
                  <TableHead className='whitespace-nowrap'>Satuan</TableHead>
                  <TableHead className='whitespace-nowrap text-center'>
                    Qty
                  </TableHead>
                  <TableHead className='whitespace-nowrap min-w-[200px]'>
                    Keterangan
                  </TableHead>
                  <TableHead className='whitespace-nowrap'>Tipe</TableHead>
                  <TableHead className='w-[80px] text-right whitespace-nowrap'>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingItems ? (
                  <TableRow>
                    <TableCell colSpan={12} className='h-32 text-center'>
                      <div className='flex items-center justify-center'>
                        <Loader2 className='h-6 w-6 animate-spin text-neutral-400' />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : items?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className='h-40 text-center'>
                      <div className='flex flex-col items-center justify-center text-muted-foreground space-y-3'>
                        <div className='h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center'>
                          <Package className='h-6 w-6 text-neutral-400' />
                        </div>
                        <div className='space-y-1'>
                          <p className='font-semibold text-neutral-700'>
                            No items found
                          </p>
                          <p className='text-xs text-neutral-500'>
                            Click Add Item to start adding project items.
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  items?.map((item, index) => (
                    <TableRow
                      key={item.id}
                      className='hover:bg-blue-50/30 transition-colors group'
                    >
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
                      <TableCell className='text-muted-foreground font-medium'>
                        {index + 1}
                      </TableCell>
                      <TableCell className='text-xs text-neutral-500 whitespace-nowrap'>
                        {item.mdl_item?.kode_barang || '-'}
                      </TableCell>
                      <TableCell className='text-xs'>
                        {item.lantai || '-'}
                      </TableCell>
                      <TableCell
                        className='font-semibold text-neutral-800 text-sm max-w-[200px] truncate'
                        title={item.sub_kategori}
                      >
                        {item.sub_kategori}
                      </TableCell>
                      <TableCell
                        className='text-xs max-w-[120px] truncate'
                        title={item.ruang}
                      >
                        {item.ruang || '-'}
                      </TableCell>
                      <TableCell
                        className='font-semibold text-neutral-800 text-sm max-w-[200px] truncate'
                        title={item.item}
                      >
                        {item.item}
                      </TableCell>
                      <TableCell className='text-xs text-muted-foreground whitespace-nowrap bg-neutral-50/50 group-hover:bg-transparent'>
                        {item.panjang || '-'} x {item.lebar || '-'} x{' '}
                        {item.tinggi || '-'}
                      </TableCell>
                      <TableCell className='font-medium text-blue-600 text-sm'>
                        {item.volume || '-'}
                      </TableCell>
                      <TableCell className='text-xs'>
                        {item.satuan || '-'}
                      </TableCell>
                      <TableCell className='font-semibold text-sm text-center bg-blue-50/30 group-hover:bg-transparent text-blue-700'>
                        {item.jumlah}
                      </TableCell>
                      <TableCell
                        className='max-w-[200px] truncate text-xs text-neutral-600'
                        title={item.keterangan}
                      >
                        {item.keterangan || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={item.custom ? 'destructive' : 'secondary'}
                          className='text-[10px] h-5 px-1.5 font-normal'
                        >
                          {item.custom ? 'Custom' : 'Standar'}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8 hover:bg-white shadow-sm ring-1 ring-neutral-200/50'
                            >
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align='end'
                            className='w-[160px]'
                          >
                            <DropdownMenuItem onClick={() => handleEdit(item)}>
                              <Pencil className='mr-2 h-4 w-4' />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className='text-orange-600 focus:text-orange-600 focus:bg-orange-50'
                              onClick={() => handleCancelClick(item)}
                              disabled={item.status === 'Cancelled'}
                            >
                              <Ban className='mr-2 h-4 w-4' />
                              Cancel
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className='text-red-600 focus:text-red-600 focus:bg-red-50'
                              onClick={() => handleDeleteClick(item)}
                            >
                              <Trash2 className='mr-2 h-4 w-4' />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal SPD */}
      <Dialog open={isSpdModalOpen} onOpenChange={setIsSpdModalOpen}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-orange-700'>
              <FileText className='h-5 w-5' />
              Upload SPD
            </DialogTitle>
          </DialogHeader>
          <div className='flex flex-col gap-3 py-2'>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium'>
                File (PDF/JPG/PNG/DOC)
              </Label>
              <Input
                type='file'
                accept='.pdf,.jpg,.jpeg,.png,.doc,.docx'
                onChange={(e) => setSpdFile(e.target.files?.[0] || null)}
                className='h-9 text-xs'
              />
            </div>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium'>Target Penyelesaian</Label>
              <Input
                type='date'
                value={targetSelesaiDate}
                onChange={(e) => setTargetSelesaiDate(e.target.value)}
                className='h-9 text-xs'
              />
            </div>
            <div className='space-y-3 pt-2'>
              <div className='flex items-center justify-between'>
                <Label className='text-xs font-medium'>File Pendukung</Label>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='h-7 text-[10px] bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'
                  onClick={() =>
                    setSpdPendukungFiles([...spdPendukungFiles, null])
                  }
                >
                  <Plus className='h-3 w-3 mr-1' />
                  Tambah
                </Button>
              </div>

              <div className='space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar'>
                {spdPendukungFiles.map((file, index) => (
                  <div key={index} className='flex gap-2 items-center'>
                    <div className='relative flex-1'>
                      <Input
                        type='file'
                        accept='.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx'
                        onChange={(e) => {
                          const newFiles = [...spdPendukungFiles];
                          newFiles[index] = e.target.files?.[0] || null;
                          setSpdPendukungFiles(newFiles);
                        }}
                        className='h-9 text-[10px] pr-8'
                      />
                      {spdPendukungFiles[index] && (
                        <CheckCircle2 className='h-3 w-3 text-emerald-500 absolute right-2.5 top-3' />
                      )}
                    </div>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8 text-neutral-400 hover:text-red-600 hover:bg-red-50 shrink-0'
                      onClick={() => {
                        const newFiles = spdPendukungFiles.filter(
                          (_, i) => i !== index
                        );
                        setSpdPendukungFiles(newFiles);
                      }}
                    >
                      <Trash2 className='h-3.5 w-3.5' />
                    </Button>
                  </div>
                ))}
                {spdPendukungFiles.length === 0 && (
                  <p className='text-[10px] text-muted-foreground italic text-center py-4 bg-neutral-50 rounded-lg border border-dashed'>
                    Belum ada file pendukung
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsSpdModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              size='sm'
              className='bg-orange-600 hover:bg-orange-700'
              onClick={() => {
                handleSpdUpload();
                setIsSpdModalOpen(false);
              }}
              disabled={!spdFile || uploadSpdMutation.isPending}
            >
              {uploadSpdMutation.isPending ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Upload className='h-4 w-4 mr-1' />
              )}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal ACC Design */}
      <Dialog open={isAccModalOpen} onOpenChange={setIsAccModalOpen}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-emerald-700'>
              <CheckCircle2 className='h-5 w-5' />
              ACC Design Confirmation
            </DialogTitle>
          </DialogHeader>
          <div className='flex flex-col gap-3 py-2'>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium text-neutral-600'>
                Tanggal Kirim ke Client
              </Label>
              <Input
                type='date'
                value={accSentDate}
                onChange={(e) => setAccSentDate(e.target.value)}
                className='h-9 text-xs'
              />
            </div>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium text-emerald-700'>
                Tanggal Approved
              </Label>
              <Input
                type='date'
                value={accDoneDate}
                onChange={(e) => setAccDoneDate(e.target.value)}
                className='h-9 text-xs border-emerald-200'
              />
            </div>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium text-emerald-700'>
                Bukti ACC (File pdf design fix) (Maks 8MB)
              </Label>
              <Input
                type='file'
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (file) {
                    if (file.size > 8 * 1024 * 1024) {
                      toast.error('Ukuran file tidak boleh melebihi 8 MB');
                      e.target.value = '';
                      setBuktiAccFile(null);
                      return;
                    }
                  }
                  setBuktiAccFile(file);
                }}
                className='h-9 text-[10px] border-emerald-200 bg-emerald-50/30'
              />
              {buktiAccFile && (
                <p className='text-[10px] text-emerald-600 font-medium'>
                  Ukuran file: {(buktiAccFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              )}
              {existingAcc?.bukti_acc && !buktiAccFile && (
                <p className='text-[10px] text-muted-foreground italic'>
                  File exists. Upload new to replace.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsAccModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              size='sm'
              className='bg-emerald-600 hover:bg-emerald-700'
              onClick={() => {
                handleAccUpdate();
                setIsAccModalOpen(false);
              }}
              disabled={updateAccMutation.isPending || (!buktiAccFile && !existingAcc?.bukti_acc)}
            >
              {updateAccMutation.isPending ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <CheckCircle2 className='h-4 w-4 mr-1' />
              )}
              Confirm ACC
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Edit SPH */}
      <Dialog open={isEditSphModalOpen} onOpenChange={setIsEditSphModalOpen}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-blue-700'>
              <Pencil className='h-5 w-5' />
              Edit SPH
            </DialogTitle>
          </DialogHeader>
          <div className='flex flex-col gap-3 py-2'>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium text-blue-700'>
                Nomor SPH
              </Label>
              <Input
                placeholder='Nomor SPH'
                value={editSphNumber}
                onChange={(e) => setEditSphNumber(e.target.value)}
                className='h-9 text-xs border-blue-200'
              />
            </div>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium text-blue-700'>
                Nominal (DPP)
              </Label>
              <Input
                type='text'
                placeholder='Rp 0'
                value={editSphNominal}
                onChange={(e) => {
                  const formatted = formatRupiah(e.target.value);
                  setEditSphNominal(formatted);
                  const nominalNum = parseInt(parseRawNumber(e.target.value) || '0', 10);
                  const ppnAmount = Math.round(nominalNum * (parseFloat(editSphPpn || '0') / 100));
                  setEditSphGrandTotal((nominalNum + ppnAmount) > 0 ? formatRupiah((nominalNum + ppnAmount).toString()) : '');
                }}
                className='h-9 text-xs font-mono border-blue-200'
              />
            </div>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium text-blue-700'>
                PPN 12% (11/12 x 12%)
              </Label>
              <div className='flex items-center gap-3 h-9'>
                <Switch
                  checked={editSphPpn === '11'}
                  onCheckedChange={(checked) => {
                    const pct = checked ? '11' : '0';
                    setEditSphPpn(pct);
                    const nominalNum = parseInt(parseRawNumber(editSphNominal) || '0', 10);
                    const ppnAmount = Math.round(nominalNum * (parseFloat(pct || '0') / 100));
                    setEditSphGrandTotal((nominalNum + ppnAmount) > 0 ? formatRupiah((nominalNum + ppnAmount).toString()) : '');
                  }}
                />
                <span className='text-xs font-medium text-neutral-600'>
                  {editSphPpn === '11' ? 'Ya' : 'Tidak'}
                </span>
              </div>
            </div>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium text-blue-700'>
                Grand Total
              </Label>
              <Input
                type='text'
                placeholder='Rp 0'
                value={editSphGrandTotal}
                onChange={(e) => setEditSphGrandTotal(formatRupiah(e.target.value))}
                className='h-9 text-xs font-mono border-blue-200'
              />
            </div>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium'>
                Ganti File{' '}
                <span className='text-neutral-400 font-normal'>
                  (PDF/JPG/PNG/DOC — opsional)
                </span>
              </Label>
              <Input
                type='file'
                accept='.pdf,.jpg,.jpeg,.png,.doc,.docx'
                onChange={(e) => setEditSphFile(e.target.files?.[0] || null)}
                className='h-9 text-xs'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsEditSphModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              size='sm'
              className='bg-blue-600 hover:bg-blue-700'
              onClick={() => updateSphMutation.mutate()}
              disabled={!editSphNumber || updateSphMutation.isPending}
            >
              {updateSphMutation.isPending ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Pencil className='h-4 w-4 mr-1' />
              )}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal SPH */}
      <Dialog open={isSphModalOpen} onOpenChange={setIsSphModalOpen}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-blue-700'>
              <FileText className='h-5 w-5' />
              Upload SPH
            </DialogTitle>
          </DialogHeader>

          <div className='flex flex-col gap-3 py-2'>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium'>Nomor SPH</Label>
              <Input
                placeholder='Nomor SPH'
                value={sphNumber}
                onChange={(e) => setSphNumber(e.target.value)}
                className='h-9 text-xs'
              />
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs font-medium'>Nominal (DPP)</Label>
              <Input
                type='text'
                placeholder='Rp 0'
                value={formatRupiah(sphNominal)}
                onChange={(e) => {
                  const raw = parseRawNumber(e.target.value);
                  setSphNominal(raw);
                  const nominalNum = parseInt(raw || '0', 10);
                  const ppnAmount = Math.round(nominalNum * (parseFloat(sphPpn || '0') / 100));
                  setSphGrandTotal((nominalNum + ppnAmount) > 0 ? (nominalNum + ppnAmount).toString() : '');
                }}
                className='h-9 text-xs font-mono'
              />
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs font-medium'>PPN 12% (11/12 x 12%)</Label>
              <div className='flex items-center gap-3 h-9'>
                <Switch
                  checked={sphPpn === '11'}
                  onCheckedChange={(checked) => {
                    const pct = checked ? '11' : '0';
                    setSphPpn(pct);
                    const nominalNum = parseInt(sphNominal || '0', 10);
                    const ppnAmount = Math.round(nominalNum * (parseFloat(pct || '0') / 100));
                    setSphGrandTotal((nominalNum + ppnAmount) > 0 ? (nominalNum + ppnAmount).toString() : '');
                  }}
                />
                <span className='text-xs font-medium text-neutral-600'>
                  {sphPpn === '11' ? 'Ya' : 'Tidak'}
                </span>
              </div>
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs font-medium'>Grand Total</Label>
              <Input
                type='text'
                placeholder='Rp 0'
                value={formatRupiah(sphGrandTotal)}
                onChange={(e) => setSphGrandTotal(parseRawNumber(e.target.value))}
                className='h-9 text-xs font-mono'
              />
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs font-medium'>
                File (PDF/JPG/PNG/DOC)
              </Label>
              <Input
                type='file'
                accept='.pdf,.jpg,.jpeg,.png,.doc,.docx'
                onChange={(e) => setSphFile(e.target.files?.[0] || null)}
                className='h-9 text-xs'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsSphModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              size='sm'
              className='bg-blue-600 hover:bg-blue-700'
              onClick={() => {
                handleSphUpload();
                setIsSphModalOpen(false);
              }}
              disabled={!sphFile || !sphNumber || uploadSphMutation.isPending}
            >
              {uploadSphMutation.isPending ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Upload className='h-4 w-4 mr-1' />
              )}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Edit SPK */}
      <Dialog open={isEditSpkModalOpen} onOpenChange={setIsEditSpkModalOpen}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-purple-700'>
              <Pencil className='h-5 w-5' />
              Edit SPK
            </DialogTitle>
          </DialogHeader>
          <div className='flex flex-col gap-3 py-2'>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium text-purple-700'>
                Nomor SPK
              </Label>
              <Input
                placeholder='Nomor SPK'
                value={editSpkNumber}
                onChange={(e) => setEditSpkNumber(e.target.value)}
                className='h-9 text-xs border-purple-200'
              />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1.5'>
                <Label className='text-xs font-medium text-purple-700'>
                  Tanggal SPK
                </Label>
                <Input
                  type='date'
                  value={editSpkTanggalSpk}
                  onChange={(e) => setEditSpkTanggalSpk(e.target.value)}
                  className='h-9 text-xs border-purple-200 w-full'
                />
              </div>
              <div className='space-y-1.5'>
                <Label className='text-xs font-medium text-purple-700'>
                  Tanggal Masuk
                </Label>
                <Input
                  type='date'
                  value={editSpkTanggalMasuk}
                  onChange={(e) => setEditSpkTanggalMasuk(e.target.value)}
                  className='h-9 text-xs border-purple-200 w-full'
                />
              </div>
            </div>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium text-purple-700'>
                Nominal (DPP)
              </Label>
              <Input
                type='text'
                placeholder='Rp 0'
                value={editSpkNominal}
                onChange={(e) => {
                  const formatted = formatRupiah(e.target.value);
                  setEditSpkNominal(formatted);
                  const nominalNum = parseInt(parseRawNumber(e.target.value) || '0', 10);
                  const ppnAmount = Math.round(nominalNum * (parseFloat(editSpkPpn || '0') / 100));
                  setEditSpkGrandTotal((nominalNum + ppnAmount) > 0 ? formatRupiah((nominalNum + ppnAmount).toString()) : '');
                }}
                className='h-9 text-xs border-purple-200'
              />
            </div>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium text-purple-700'>
                PPN 12% (11/12 x 12%)
              </Label>
              <div className='flex items-center gap-3 h-9'>
                <Switch
                  checked={editSpkPpn === '11'}
                  onCheckedChange={(checked) => {
                    const pct = checked ? '11' : '0';
                    setEditSpkPpn(pct);
                    const nominalNum = parseInt(parseRawNumber(editSpkNominal) || '0', 10);
                    const ppnAmount = Math.round(nominalNum * (parseFloat(pct || '0') / 100));
                    setEditSpkGrandTotal((nominalNum + ppnAmount) > 0 ? formatRupiah((nominalNum + ppnAmount).toString()) : '');
                  }}
                />
                <span className='text-xs font-medium text-neutral-600'>
                  {editSpkPpn === '11' ? 'Ya' : 'Tidak'}
                </span>
              </div>
            </div>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium text-purple-700'>
                Grand Total
              </Label>
              <Input
                type='text'
                placeholder='Rp 0'
                value={editSpkGrandTotal}
                onChange={(e) => setEditSpkGrandTotal(formatRupiah(e.target.value))}
                className='h-9 text-xs font-mono border-purple-200'
              />
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs font-medium text-purple-700'>
                Diterbitkan Oleh
              </Label>
              <Popover open={editClientPopoverOpen} onOpenChange={setEditClientPopoverOpen}>
                  <PopoverTrigger asChild>
                      <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                              "w-full justify-between h-9 text-xs border-purple-200 font-normal",
                              !editSpkPenerbitId && "text-muted-foreground"
                          )}
                      >
                          {editSpkPenerbitId && clients.length > 0
                              ? clients.find(
                                    (client) => client.id.toString() === editSpkPenerbitId
                                )?.name || "Pilih Penerbit..."
                              : "Pilih Penerbit..."}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                      <Command shouldFilter={false}>
                          <CommandInput 
                              placeholder="Cari client..." 
                              value={searchQuery}
                              onValueChange={setSearchQuery}
                              className="text-xs h-9"
                          />
                          <CommandList>
                              <CommandEmpty className="text-xs p-2 text-center text-muted-foreground">
                                  {isLoadingClients ? 'Loading...' : 'Tidak ditemukan.'}
                              </CommandEmpty>
                              <CommandGroup>
                                  {clients.map((client) => (
                                      <CommandItem
                                          value={client.id.toString()}
                                          key={client.id}
                                          onSelect={() => {
                                              setEditSpkPenerbitId(client.id.toString());
                                              setEditClientPopoverOpen(false);
                                          }}
                                          className="text-xs"
                                      >
                                          <Check
                                              className={cn(
                                                  "mr-2 h-4 w-4",
                                                  client.id.toString() === editSpkPenerbitId
                                                      ? "opacity-100"
                                                      : "opacity-0"
                                              )}
                                          />
                                          {client.name}
                                      </CommandItem>
                                  ))}
                              </CommandGroup>
                              {hasNextPage && (
                                  <div ref={loadMoreRef} className="py-2 flex justify-center items-center">
                                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                      <span className="ml-2 text-[10px] text-muted-foreground">Loading more...</span>
                                  </div>
                              )}
                          </CommandList>
                      </Command>
                  </PopoverContent>
              </Popover>
            </div>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium'>
                Ganti File{' '}
                <span className='text-neutral-400 font-normal'>
                  (PDF/JPG/PNG/DOC — opsional)
                </span>
              </Label>
              <Input
                type='file'
                accept='.pdf,.jpg,.jpeg,.png,.doc,.docx'
                onChange={(e) => setEditSpkFile(e.target.files?.[0] || null)}
                className='h-9 text-xs'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsEditSpkModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              size='sm'
              className='bg-purple-600 hover:bg-purple-700'
              onClick={() => updateSpkMutation.mutate()}
              disabled={!editSpkNumber || updateSpkMutation.isPending}
            >
              {updateSpkMutation.isPending ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Pencil className='h-4 w-4 mr-1' />
              )}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal SPK */}
      <Dialog open={isSpkModalOpen} onOpenChange={setIsSpkModalOpen}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-purple-700'>
              <ClipboardCheck className='h-5 w-5' />
              Upload SPK
            </DialogTitle>
          </DialogHeader>
          <div className='flex flex-col gap-3 py-2'>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium text-purple-700'>
                Nomor SPK
              </Label>
              <Input
                placeholder='Nomor SPK'
                value={spkNumber}
                onChange={(e) => setSpkNumber(e.target.value)}
                className='h-9 text-xs border-purple-200'
              />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1.5'>
                <Label className='text-xs font-medium text-purple-700'>
                  Tanggal SPK
                </Label>
                <Input
                  type='date'
                  value={spkTanggalSpk}
                  onChange={(e) => setSpkTanggalSpk(e.target.value)}
                  className='h-9 text-xs border-purple-200 w-full'
                />
              </div>
              <div className='space-y-1.5'>
                <Label className='text-xs font-medium text-purple-700'>
                  Tanggal Masuk
                </Label>
                <Input
                  type='date'
                  value={spkTanggalMasuk}
                  onChange={(e) => setSpkTanggalMasuk(e.target.value)}
                  className='h-9 text-xs border-purple-200 w-full'
                />
              </div>
            </div>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium text-purple-700'>
                Nominal (DPP)
              </Label>
              <Input
                type='text'
                placeholder='Rp 0'
                value={spkNominal}
                onChange={(e) => {
                  const formatted = formatRupiah(e.target.value);
                  setSpkNominal(formatted);
                  const nominalNum = parseInt(parseRawNumber(e.target.value) || '0', 10);
                  const ppnAmount = Math.round(nominalNum * (parseFloat(spkPpn || '0') / 100));
                  setSpkGrandTotal((nominalNum + ppnAmount) > 0 ? (nominalNum + ppnAmount).toString() : '');
                }}
                className='h-9 text-xs border-purple-200'
              />
            </div>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium text-purple-700'>
                PPN 12% (11/12 x 12%)
              </Label>
              <div className='flex items-center gap-3 h-9'>
                <Switch
                  checked={spkPpn === '11'}
                  onCheckedChange={(checked) => {
                    const pct = checked ? '11' : '0';
                    setSpkPpn(pct);
                    const nominalNum = parseInt(parseRawNumber(spkNominal) || '0', 10);
                    const ppnAmount = Math.round(nominalNum * (parseFloat(pct || '0') / 100));
                    setSpkGrandTotal((nominalNum + ppnAmount) > 0 ? (nominalNum + ppnAmount).toString() : '');
                  }}
                />
                <span className='text-xs font-medium text-neutral-600'>
                  {spkPpn === '11' ? 'Ya' : 'Tidak'}
                </span>
              </div>
            </div>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium text-purple-700'>
                Grand Total
              </Label>
              <Input
                type='text'
                placeholder='Rp 0'
                value={formatRupiah(spkGrandTotal)}
                onChange={(e) => setSpkGrandTotal(parseRawNumber(e.target.value))}
                className='h-9 text-xs font-mono border-purple-200'
              />
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs font-medium text-purple-700'>
                Diterbitkan Oleh
              </Label>
              <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
                  <PopoverTrigger asChild>
                      <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                              "w-full justify-between h-9 text-xs border-purple-200 font-normal",
                              !spkPenerbitId && "text-muted-foreground"
                          )}
                      >
                          {spkPenerbitId && clients.length > 0
                              ? clients.find(
                                    (client) => client.id.toString() === spkPenerbitId
                                )?.name || "Pilih Penerbit..."
                              : "Pilih Penerbit..."}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                      <Command shouldFilter={false}>
                          <CommandInput 
                              placeholder="Cari client..." 
                              value={searchQuery}
                              onValueChange={setSearchQuery}
                              className="text-xs h-9"
                          />
                          <CommandList>
                              <CommandEmpty className="text-xs p-2 text-center text-muted-foreground">
                                  {isLoadingClients ? 'Loading...' : 'Tidak ditemukan.'}
                              </CommandEmpty>
                              <CommandGroup>
                                  {clients.map((client) => (
                                      <CommandItem
                                          value={client.id.toString()}
                                          key={client.id}
                                          onSelect={() => {
                                              setSpkPenerbitId(client.id.toString());
                                              setClientPopoverOpen(false);
                                          }}
                                          className="text-xs"
                                      >
                                          <Check
                                              className={cn(
                                                  "mr-2 h-4 w-4",
                                                  client.id.toString() === spkPenerbitId
                                                      ? "opacity-100"
                                                      : "opacity-0"
                                              )}
                                          />
                                          {client.name}
                                      </CommandItem>
                                  ))}
                              </CommandGroup>
                              {hasNextPage && (
                                  <div ref={loadMoreRef} className="py-2 flex justify-center items-center">
                                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                      <span className="ml-2 text-[10px] text-muted-foreground">Loading more...</span>
                                  </div>
                              )}
                          </CommandList>
                      </Command>
                  </PopoverContent>
              </Popover>
            </div>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium'>
                File (PDF/JPG/PNG/DOC)
              </Label>
              <Input
                type='file'
                accept='.pdf,.jpg,.jpeg,.png,.doc,.docx'
                onChange={(e) => setSpkFile(e.target.files?.[0] || null)}
                className='h-9 text-xs'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsSpkModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              size='sm'
              className='bg-purple-600 hover:bg-purple-700'
              onClick={() => {
                handleSpkUpload();
                setIsSpkModalOpen(false);
              }}
              disabled={!spkFile || !spkNumber || uploadSpkMutation.isPending}
            >
              {uploadSpkMutation.isPending ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Upload className='h-4 w-4 mr-1' />
              )}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Upload Signed SPK */}
      <Dialog
        open={isSignedSpkModalOpen}
        onOpenChange={setIsSignedSpkModalOpen}
      >
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-emerald-700'>
              <CheckCircle2 className='h-5 w-5' />
              Upload SPK Bertanda Tangan
            </DialogTitle>
          </DialogHeader>
          <div className='flex flex-col gap-4 py-4'>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium text-emerald-700'>
                Tanggal Masuk
              </Label>
              <Input
                type='date'
                value={signedSpkTanggalMasuk}
                onChange={(e) => setSignedSpkTanggalMasuk(e.target.value)}
                className='h-9 text-xs border-emerald-200'
              />
            </div>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium text-emerald-700'>
                Deadline Penyelesaian
              </Label>
              <Input
                type='date'
                value={signedSpkDeadline}
                onChange={(e) => setSignedSpkDeadline(e.target.value)}
                className='h-9 text-xs border-emerald-200'
              />
            </div>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium text-emerald-700'>
                Nominal
              </Label>
              <Input
                type='text'
                placeholder='Masukkan Nominal SPK'
                value={signedSpkNominal}
                onChange={(e) =>
                  setSignedSpkNominal(formatRupiah(e.target.value))
                }
                className='h-9 text-xs border-emerald-200'
              />
            </div>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium text-emerald-700'>
                File SPK Bertanda Tangan
              </Label>
              <div className='flex flex-col gap-2'>
                <Input
                  type='file'
                  onChange={(e) =>
                    setSignedSpkFile(e.target.files?.[0] || null)
                  }
                  className='h-9 text-xs border-emerald-200 file:text-[10px] file:bg-emerald-50 file:text-emerald-700 file:border-emerald-100 hover:file:bg-emerald-100'
                />
                <p className='text-[10px] text-muted-foreground italic'>
                  Format: PDF, JPG, PNG. Maks 10MB.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsSignedSpkModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              size='sm'
              className='bg-emerald-600 hover:bg-emerald-700'
              onClick={handleSignedSpkUpload}
              disabled={!signedSpkFile || approveSpkMutation.isPending}
            >
              {approveSpkMutation.isPending ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Upload className='h-4 w-4 mr-1' />
              )}
              Upload & Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Need Design Toggle */}
      <Dialog
        open={isNeedDesignModalOpen}
        onOpenChange={setIsNeedDesignModalOpen}
      >
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-neutral-800'>
              <Info className='h-5 w-5 text-orange-500' />
              Setting Kebutuhan Desain
            </DialogTitle>
          </DialogHeader>
          <div className='flex flex-col gap-4 py-4'>
            <p className='text-sm text-muted-foreground'>
              Tentukan apakah project ini membutuhkan proses desain dari studio
              atau tidak.
            </p>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium'>Kebutuhan Desain</Label>
              <Select
                value={needDesignValue.toString()}
                onValueChange={(v) => setNeedDesignValue(parseInt(v))}
              >
                <SelectTrigger className='h-10'>
                  <SelectValue placeholder='Pilih status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='1'>
                    Perlu Desain (Wajib Upload SPD & ACC)
                  </SelectItem>
                  <SelectItem value='0'>
                    Tidak Perlu Desain (Langsung SPH)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsNeedDesignModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              size='sm'
              className='bg-orange-600 hover:bg-orange-700'
              onClick={() => updateNeedDesignMutation.mutate(needDesignValue)}
              disabled={
                updateNeedDesignMutation.isPending ||
                needDesignValue === project.need_design
              }
            >
              {updateNeedDesignMutation.isPending ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <CheckCircle2 className='h-4 w-4 mr-1' />
              )}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProjectItemFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        projectId={projectId}
        item={selectedItem}
      />

      <ProjectItemImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        projectId={projectId}
      />

      <AlertDialog
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan item ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Item <strong>{itemToCancel?.item}</strong> akan ditandai sebagai{' '}
              <strong>Cancelled</strong>. Anda dapat mengubah statusnya kembali
              melalui edit jika diperlukan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              className='bg-orange-600 hover:bg-orange-700'
            >
              {cancelMutation.isPending && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              Ya, Batalkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the item {itemToDelete?.item}. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className='bg-red-600 hover:bg-red-700'
            >
              {deleteMutation.isPending && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isBulkDeleteDialogOpen}
        onOpenChange={setIsBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {selectedItemIds.length} item?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus {selectedItemIds.length} item yang dipilih secara permanen. Anda tidak dapat membatalkan tindakan ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDeleteMutation.mutate()}
              className='bg-red-600 hover:bg-red-700'
            >
              {bulkDeleteMutation.isPending && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        projectId={projectId}
      />
    </div>
  );
}
