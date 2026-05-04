"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Trash2, Loader2, Building2, Search } from "lucide-react"
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

import { projectV2Service, Divisi } from "@/features/projects/services/project-v2-service"
import { DivisiFormDialog } from "./divisi-form-dialog"

export function DivisiTable() {
    const queryClient = useQueryClient()
    const [search, setSearch] = React.useState("")
    const [isFormOpen, setIsFormOpen] = React.useState(false)
    const [selectedDivisi, setSelectedDivisi] = React.useState<Divisi | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
    const [divisiToDelete, setDivisiToDelete] = React.useState<Divisi | null>(null)

    const { data: divisions, isLoading } = useQuery({
        queryKey: ["divisions"],
        queryFn: () => projectV2Service.getDivisions(),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => projectV2Service.deleteDivisi(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["divisions"] })
            toast.success("Divisi berhasil dihapus")
            setIsDeleteDialogOpen(false)
            setDivisiToDelete(null)
        },
        onError: () => {
            toast.error("Gagal menghapus divisi")
        }
    })

    const handleEdit = (divisi: Divisi) => {
        setSelectedDivisi(divisi)
        setIsFormOpen(true)
    }

    const handleDelete = (divisi: Divisi) => {
        setDivisiToDelete(divisi)
        setIsDeleteDialogOpen(true)
    }

    const handleCreate = () => {
        setSelectedDivisi(null)
        setIsFormOpen(true)
    }

    const filtered = divisions?.filter(d =>
        d.nama.toLowerCase().includes(search.toLowerCase()) ||
        (d.nama_panjang?.toLowerCase().includes(search.toLowerCase()) ?? false)
    ) ?? []

    return (
        <div className="p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-neutral-800">Daftar Divisi</p>
                        <p className="text-xs text-muted-foreground">{filtered.length} divisi terdaftar</p>
                    </div>
                </div>
                <Button onClick={handleCreate} className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Divisi
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Cari divisi..."
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
                            <TableHead>Nama Divisi</TableHead>
                            <TableHead>Nama Panjang</TableHead>
                            <TableHead>Dibuat</TableHead>
                            <TableHead className="w-[120px] text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-neutral-400" />
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-sm">
                                    {search ? "Tidak ada divisi yang cocok." : "Belum ada divisi. Klik 'Tambah Divisi' untuk memulai."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((divisi, index) => (
                                <TableRow key={divisi.id} className="hover:bg-neutral-50/50 transition-colors">
                                    <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 font-bold text-sm px-3 py-1">
                                            {divisi.nama}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-neutral-600">
                                        {divisi.nama_panjang || <span className="text-muted-foreground italic text-xs">-</span>}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {divisi.created_at ? format(new Date(divisi.created_at), "d MMM yyyy") : "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                                                onClick={() => handleEdit(divisi)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                                                onClick={() => handleDelete(divisi)}
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
            <DivisiFormDialog
                open={isFormOpen}
                onOpenChange={(open) => {
                    setIsFormOpen(open)
                    if (!open) setSelectedDivisi(null)
                }}
                divisi={selectedDivisi}
            />

            {/* Delete Confirm Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Divisi</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus divisi <strong>"{divisiToDelete?.nama}"</strong>? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => divisiToDelete && deleteMutation.mutate(divisiToDelete.id)}
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
