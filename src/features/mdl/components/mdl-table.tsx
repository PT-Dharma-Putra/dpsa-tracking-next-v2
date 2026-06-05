"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { mdlService } from "../api/mdl-service"
import { MDLItem, MDLQueryParams } from "../types"
import { MDLDetailModal } from "./mdl-detail-modal"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, Edit, Trash2, Eye } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { MDL_CATEGORIES } from "../constants"
import { usePermissions } from "@/hooks/use-permissions"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface MDLTableProps {
    onEdit: (item: any) => void;
    onStatsUpdate: (stats: any) => void;
}

export function MDLTable({ onEdit, onStatsUpdate }: MDLTableProps) {
    const { canViewPrice } = usePermissions();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [detailItem, setDetailItem] = useState<MDLItem | null>(null);

    const debouncedSearch = useDebounce(search, 500);

    const { data, isLoading } = useQuery({
        queryKey: ['mdl-items', page, debouncedSearch, category],
        queryFn: () => mdlService.getItems({
            page,
            per_page: 50,
            search: debouncedSearch,
            kategori: category || undefined
        }),
    });

    useEffect(() => {
        if (data) {
            onStatsUpdate({
                totalItems: data.total,
                totalCategories: MDL_CATEGORIES.length,
                categoryCounts: {}
            });
        }
    }, [data, onStatsUpdate]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    }

    const items = data?.data || [];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search..."
                            value={search}
                            onChange={handleSearch}
                            className="pl-9 w-[250px]"
                        />
                    </div>
                    <Select value={category || "all"} onValueChange={(v) => { setCategory(v === "all" ? "" : v); setPage(1); }}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Filter Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {MDL_CATEGORIES.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {data && (
                    <div className="text-sm text-muted-foreground">
                        Showing {data.from || 0} to {data.to || 0} of {data.total || 0}
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="p-12 flex justify-center bg-white rounded-md border"><Loader2 className="animate-spin text-blue-600" /></div>
            ) : items.length === 0 ? (
                <div className="p-12 text-center border rounded-lg bg-neutral-50">
                    <p className="text-neutral-500">No items found.</p>
                </div>
            ) : (
                <div className="rounded-md border bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Kode</TableHead>
                                <TableHead>Nama Barang</TableHead>
                                <TableHead>Kategori</TableHead>
                                <TableHead>Sub Kategori</TableHead>
                                <TableHead>Satuan</TableHead>
                                {canViewPrice && <TableHead className="text-right">Harga (IDR)</TableHead>}
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-mono text-xs">{item.kode_barang || '-'}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium max-w-[250px] truncate" title={item.nama_barang}>{item.nama_barang}</span>
                                            {item.lokasi_ruangan && <span className="text-xs text-muted-foreground">{item.lokasi_ruangan}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="w-fit text-xs">{item.kategori_mdl}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {item.sub_kategori ? <span className="text-xs text-muted-foreground">{item.sub_kategori}</span> : '-'}
                                    </TableCell>
                                    <TableCell className="text-xs">{item.nama_satuan_beli || '-'}</TableCell>
                                    {canViewPrice && (
                                        <TableCell className="text-right font-mono text-xs">
                                            {item.harga_pulau_jawa?.toLocaleString('id-ID') || '-'}
                                        </TableCell>
                                    )}
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                                onClick={() => setDetailItem(item)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:bg-amber-50" onClick={() => onEdit(item)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <MDLDetailModal
                item={detailItem}
                open={!!detailItem}
                onOpenChange={(open) => !open && setDetailItem(null)}
            />

            {data && data.last_page > 1 && (
                <div className="flex justify-end gap-2 mt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={data.current_page === 1}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => p + 1)}
                        disabled={data.current_page === data.last_page}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    )
}
