"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus,
    Pencil,
    Trash2,
    Loader2,
    Search,
    FileText,
    CheckCircle2,
    Clock,
    User as UserIcon,
    Building2,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";

import {
    ListSpkMasuk,
    ListSpkMasukService,
} from "@/features/list-spk-masuk/services/list-spk-masuk-service";
import { ListSpkMasukFormDialog } from "./list-spk-masuk-form-dialog";

export function ListSpkMasukTable() {
    const queryClient = useQueryClient();

    // Filters and pagination state
    const [page, setPage] = React.useState(1);
    const [perPage, setPerPage] = React.useState(10);
    const [search, setSearch] = React.useState("");
    const [debouncedSearch, setDebouncedSearch] = React.useState("");
    const [marketingFilter, setMarketingFilter] = React.useState<string>("all");
    const [uploadFilter, setUploadFilter] = React.useState<string>("all");

    // Modal state
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [selectedItem, setSelectedItem] = React.useState<ListSpkMasuk | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [itemToDelete, setItemToDelete] = React.useState<ListSpkMasuk | null>(null);

    // Debounce search input
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 350);
        return () => clearTimeout(timer);
    }, [search]);

    // Query Data
    const { data: response, isLoading, isFetching, refetch } = useQuery({
        queryKey: ["list-spk-masuk", page, perPage, debouncedSearch, marketingFilter, uploadFilter],
        queryFn: () =>
            ListSpkMasukService.getAll({
                page,
                per_page: perPage,
                search: debouncedSearch || undefined,
                marketing_id: marketingFilter !== "all" ? Number(marketingFilter) : undefined,
                is_uploaded:
                    uploadFilter === "uploaded"
                        ? true
                        : uploadFilter === "not_uploaded"
                        ? false
                        : undefined,
            }),
    });

    // Query marketing list for filter
    const { data: marketings = [] } = useQuery({
        queryKey: ["marketing-users-list"],
        queryFn: ListSpkMasukService.getMarketings,
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: (id: number) => ListSpkMasukService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["list-spk-masuk"] });
            toast.success("Data SPK Masuk berhasil dihapus");
            setIsDeleteDialogOpen(false);
            setItemToDelete(null);
        },
        onError: (err: any) => {
            const errorMsg = err?.response?.data?.message || "Gagal menghapus data";
            toast.error(errorMsg);
        },
    });

    const handleCreate = () => {
        setSelectedItem(null);
        setIsFormOpen(true);
    };

    const handleEdit = (item: ListSpkMasuk) => {
        setSelectedItem(item);
        setIsFormOpen(true);
    };

    const handleDelete = (item: ListSpkMasuk) => {
        setItemToDelete(item);
        setIsDeleteDialogOpen(true);
    };

    const formatDateSafe = (dateString?: string | null) => {
        if (!dateString) return "-";
        try {
            const parsed = parseISO(dateString.substring(0, 10));
            return format(parsed, "dd MMM yyyy", { locale: localeId });
        } catch {
            return dateString;
        }
    };

    const items = response?.data || [];
    const meta = response?.meta || {
        current_page: 1,
        last_page: 1,
        per_page: perPage,
        total: 0,
        from: 0,
        to: 0,
    };
    const stats = response?.stats || {
        total: meta.total || 0,
        uploaded: 0,
        not_uploaded: 0,
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header & Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-neutral-900">List SPK Masuk</h2>
                    <p className="text-sm text-neutral-500">
                        Manajemen dan pencatatan surat perintah kerja yang telah masuk dari klien.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="h-9"
                    >
                        <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                    <Button
                        onClick={handleCreate}
                        className="h-9 bg-orange-600 hover:bg-orange-700 text-white shadow-sm"
                    >
                        <Plus className="mr-1.5 h-4 w-4" />
                        Tambah SPK Masuk
                    </Button>
                </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border border-neutral-200 shadow-sm bg-gradient-to-br from-white to-neutral-50/50">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                Total SPK Masuk
                            </p>
                            <h3 className="text-2xl font-bold text-neutral-800 mt-1">{stats.total}</h3>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                            <FileText className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-neutral-200 shadow-sm bg-gradient-to-br from-white to-neutral-50/50">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                Sudah Upload
                            </p>
                            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{stats.uploaded}</h3>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-neutral-200 shadow-sm bg-gradient-to-br from-white to-neutral-50/50">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                Belum Upload
                            </p>
                            <h3 className="text-2xl font-bold text-amber-600 mt-1">{stats.not_uploaded}</h3>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                            <Clock className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[240px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari No SPK, Nama Projek, Client..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-neutral-50 border-neutral-200 focus:bg-white h-9"
                    />
                </div>

                {/* Filter Marketing */}
                <div className="w-[180px]">
                    <Select
                        value={marketingFilter}
                        onValueChange={(val) => {
                            setMarketingFilter(val);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="h-9 bg-neutral-50 border-neutral-200 focus:bg-white text-xs">
                            <SelectValue placeholder="Semua Marketing" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Marketing</SelectItem>
                            {marketings.map((m) => (
                                <SelectItem key={m.id} value={String(m.id)}>
                                    {m.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Filter Status Upload */}
                <div className="w-[170px]">
                    <Select
                        value={uploadFilter}
                        onValueChange={(val) => {
                            setUploadFilter(val);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="h-9 bg-neutral-50 border-neutral-200 focus:bg-white text-xs">
                            <SelectValue placeholder="Status Upload" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Status</SelectItem>
                            <SelectItem value="uploaded">Sudah Upload</SelectItem>
                            <SelectItem value="not_uploaded">Belum Upload</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Main Table */}
            <div className="rounded-xl border border-neutral-200 overflow-hidden shadow-sm bg-white">
                <Table>
                    <TableHeader className="bg-neutral-50/80">
                        <TableRow>
                            <TableHead className="w-[50px] text-center">#</TableHead>
                            <TableHead>Tgl Masuk</TableHead>
                            <TableHead>No. SPK</TableHead>
                            <TableHead>Nama Projek</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Marketing</TableHead>
                            <TableHead className="text-center">Status Upload</TableHead>
                            <TableHead>Tgl Upload</TableHead>
                            <TableHead className="w-[100px] text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
                                        <span>Memuat data SPK Masuk...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-32 text-center text-neutral-500">
                                    <div className="flex flex-col items-center justify-center gap-1.5">
                                        <FileText className="h-8 w-8 text-neutral-300" />
                                        <p className="font-medium text-neutral-600">Belum ada data SPK Masuk</p>
                                        <p className="text-xs text-neutral-400">
                                            Klik tombol &quot;Tambah SPK Masuk&quot; untuk mencatat data baru.
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item, index) => {
                                const rowNumber = (meta.current_page - 1) * meta.per_page + index + 1;
                                return (
                                    <TableRow key={item.id} className="hover:bg-neutral-50/60">
                                        <TableCell className="text-center font-medium text-neutral-400 text-xs">
                                            {rowNumber}
                                        </TableCell>
                                        <TableCell className="font-medium whitespace-nowrap text-xs">
                                            {formatDateSafe(item.tanggal_spk_masuk)}
                                        </TableCell>
                                        <TableCell className="font-semibold text-neutral-800 text-xs">
                                            {item.no_spk}
                                        </TableCell>
                                        <TableCell className="text-neutral-700 text-xs max-w-[220px] truncate" title={item.nama_projek}>
                                            {item.nama_projek}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            <div className="flex items-center gap-1.5">
                                                <Building2 className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                                                <span className="font-medium text-neutral-800 truncate" title={item.client?.name}>
                                                    {item.client?.name || "-"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {item.marketing ? (
                                                <div className="flex items-center gap-1.5">
                                                    <UserIcon className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                                                    <span className="text-neutral-700">{item.marketing.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-neutral-400 italic">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {item.is_uploaded ? (
                                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-[11px] font-medium">
                                                    Sudah Upload
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 text-[11px] font-medium">
                                                    Belum Upload
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs text-neutral-600 whitespace-nowrap">
                                            {formatDateSafe(item.tanggal_upload)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(item)}
                                                    className="h-8 w-8 text-neutral-600 hover:text-orange-600 hover:bg-orange-50"
                                                    title="Edit Data"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(item)}
                                                    className="h-8 w-8 text-neutral-600 hover:text-red-600 hover:bg-red-50"
                                                    title="Hapus Data"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {meta.last_page > 1 && (
                <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
                    <p>
                        Menampilkan <span className="font-semibold text-neutral-700">{meta.from || 0}</span> -{" "}
                        <span className="font-semibold text-neutral-700">{meta.to || 0}</span> dari{" "}
                        <span className="font-semibold text-neutral-700">{meta.total}</span> data
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1 || isLoading}
                            className="h-8 px-2"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Sebelumnya
                        </Button>
                        <span className="font-medium text-neutral-700">
                            Hal. {meta.current_page} dari {meta.last_page}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                            disabled={page >= meta.last_page || isLoading}
                            className="h-8 px-2"
                        >
                            Berikutnya
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Form Dialog for Create and Edit */}
            <ListSpkMasukFormDialog
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                item={selectedItem}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus data SPK Masuk{" "}
                            <span className="font-semibold text-neutral-800">
                                {itemToDelete?.no_spk} ({itemToDelete?.nama_projek})
                            </span>
                            ? Data yang dihapus tidak akan ditampilkan lagi.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => itemToDelete && deleteMutation.mutate(itemToDelete.id)}
                            disabled={deleteMutation.isPending}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
