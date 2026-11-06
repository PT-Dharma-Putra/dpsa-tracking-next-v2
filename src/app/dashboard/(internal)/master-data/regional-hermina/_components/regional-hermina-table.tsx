"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Trash2, Loader2, MapPin, Search } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { RegionalHerminaService, RegionalHermina } from "@/features/regional-hermina/services/regional-hermina-service"
import { RegionalHerminaFormDialog } from "./regional-hermina-form-dialog"

export function RegionalHerminaTable() {
    const queryClient = useQueryClient()
    const [search, setSearch] = React.useState("")
    const [isFormOpen, setIsFormOpen] = React.useState(false)
    const [selectedItem, setSelectedItem] = React.useState<RegionalHermina | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
    const [itemToDelete, setItemToDelete] = React.useState<RegionalHermina | null>(null)

    const { data: regionalList, isLoading } = useQuery({
        queryKey: ["regional-hermina"],
        queryFn: () => RegionalHerminaService.getRegionalHermina(),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => RegionalHerminaService.deleteRegionalHermina(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["regional-hermina"] })
            toast.success("Regional Hermina berhasil dihapus")
            setIsDeleteDialogOpen(false)
            setItemToDelete(null)
        },
        onError: () => {
            toast.error("Gagal menghapus Regional Hermina")
        }
    })

    const handleEdit = (item: RegionalHermina) => {
        setSelectedItem(item)
        setIsFormOpen(true)
    }

    const handleDelete = (item: RegionalHermina) => {
        setItemToDelete(item)
        setIsDeleteDialogOpen(true)
    }

    const handleCreate = () => {
        setSelectedItem(null)
        setIsFormOpen(true)
    }

    const filtered = regionalList?.filter(item => {
        const query = search.toLowerCase()
        return (
            item.regional.toLowerCase().includes(query) ||
            (item.angka_romawi?.toLowerCase().includes(query) ?? false) ||
            (item.nama_direktur?.toLowerCase().includes(query) ?? false) ||
            (item.keterangan?.toLowerCase().includes(query) ?? false)
        )
    }) ?? []

    return (
        <div className="p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-orange-100 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-neutral-800">Daftar Regional Hermina</p>
                        <p className="text-xs text-muted-foreground">{filtered.length} regional terdaftar</p>
                    </div>
                </div>
                <Button onClick={handleCreate} className="bg-orange-600 hover:bg-orange-700 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Regional
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Cari regional, angka romawi, direktur..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 bg-neutral-50 border-neutral-200 focus:bg-white"
                />
            </div>

            {/* Table */}
            <div className="rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-neutral-50/80">
                        <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>Regional</TableHead>
                            <TableHead className="w-[130px]">Angka Romawi</TableHead>
                            <TableHead>Nama Direktur</TableHead>
                            <TableHead>Keterangan</TableHead>
                            <TableHead className="w-[140px]">Dibuat</TableHead>
                            <TableHead className="w-[110px] text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-neutral-400" />
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-sm">
                                    {search ? "Tidak ada regional yang cocok." : "Belum ada data regional Hermina. Klik 'Tambah Regional' untuk memulai."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((item, index) => (
                                <TableRow key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                                    <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                                    <TableCell className="font-semibold text-neutral-900">
                                        {item.regional}
                                    </TableCell>
                                    <TableCell>
                                        {item.angka_romawi ? (
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-mono font-bold text-xs px-2.5 py-0.5">
                                                {item.angka_romawi}
                                            </Badge>
                                        ) : (
                                            <span className="text-neutral-400 text-xs">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-neutral-700">
                                        {item.nama_direktur || <span className="text-muted-foreground italic text-xs">-</span>}
                                    </TableCell>
                                    <TableCell className="text-sm text-neutral-600 max-w-[260px] truncate" title={item.keterangan || ""}>
                                        {item.keterangan || <span className="text-muted-foreground italic text-xs">-</span>}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {item.created_at ? format(new Date(item.created_at), "d MMM yyyy") : "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                                                onClick={() => handleEdit(item)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                                                onClick={() => handleDelete(item)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Form Dialog */}
            <RegionalHerminaFormDialog
                open={isFormOpen}
                onOpenChange={(open) => {
                    setIsFormOpen(open)
                    if (!open) setSelectedItem(null)
                }}
                regionalHermina={selectedItem}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Regional Hermina</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus regional <strong>"{itemToDelete?.regional}"</strong>? Tindakan ini dapat dibatalkan melalui pemulihan data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => itemToDelete && deleteMutation.mutate(itemToDelete.id)}
                        >
                            {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
