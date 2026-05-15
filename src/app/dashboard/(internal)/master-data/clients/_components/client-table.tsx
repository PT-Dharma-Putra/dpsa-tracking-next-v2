"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Trash2, Loader2, Users, Search, Mail, Phone, MapPin, ChevronLeft, ChevronRight } from "lucide-react"
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

import { ClientService, Client } from "@/features/clients/services/client-service"
import { ClientFormDialog } from "./client-form-dialog"

export function ClientTable() {
    const queryClient = useQueryClient()
    const [page, setPage] = React.useState(1)
    const [search, setSearch] = React.useState("")
    const [isFormOpen, setIsFormOpen] = React.useState(false)
    const [selectedClient, setSelectedClient] = React.useState<Client | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
    const [clientToDelete, setClientToDelete] = React.useState<Client | null>(null)

    const { data: clientResponse, isLoading } = useQuery({
        queryKey: ["clients", page, search],
        queryFn: () => ClientService.getClients({ page, search }),
    })

    const clients = clientResponse?.data || []
    const meta = clientResponse?.meta || { current_page: 1, last_page: 1, total: 0 }

    const deleteMutation = useMutation({
        mutationFn: (id: number) => ClientService.deleteClient(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clients"] })
            toast.success("Client berhasil dihapus")
            setIsDeleteDialogOpen(false)
            setClientToDelete(null)
        },
        onError: () => {
            toast.error("Gagal menghapus client")
        }
    })

    const handleEdit = (client: Client) => {
        setSelectedClient(client)
        setIsFormOpen(true)
    }

    const handleDelete = (client: Client) => {
        setClientToDelete(client)
        setIsDeleteDialogOpen(true)
    }

    const handleCreate = () => {
        setSelectedClient(null)
        setIsFormOpen(true)
    }

    const filtered = clients // Filtered by backend now

    return (
        <div className="p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-neutral-800">Daftar Client</p>
                        <p className="text-xs text-muted-foreground">{meta.total} client terdaftar</p>
                    </div>
                </div>
                <Button onClick={handleCreate} className="bg-orange-600 hover:bg-orange-700 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Client
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Cari client..."
                    value={search}
                    onChange={e => {
                        setSearch(e.target.value)
                        setPage(1) // Reset to first page on search
                    }}
                    className="pl-9 bg-neutral-50 border-neutral-200 focus:bg-white"
                />
            </div>

            {/* Table */}
            <div className="rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-neutral-50/80">
                        <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Kontak</TableHead>
                            <TableHead>Alamat</TableHead>
                            <TableHead>Total Project</TableHead>
                            <TableHead className="w-[120px] text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-neutral-400" />
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-sm">
                                    {search ? "Tidak ada client yang cocok." : "Belum ada client. Klik 'Tambah Client' untuk memulai."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((client, index) => (
                                <TableRow key={client.id} className="hover:bg-neutral-50/50 transition-colors">
                                    <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-neutral-900">{client.name}</span>
                                                <Badge variant="outline" className={`text-[9px] h-4 px-1.5 uppercase tracking-wider ${
                                                    client.hermina === 1 
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                                    : 'bg-orange-50 text-orange-700 border-orange-200'
                                                }`}>
                                                    {client.hermina === 1 ? 'Hermina' : 'Non Hermina'}
                                                </Badge>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground">ID: #{client.id}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                                                <Mail className="h-3 w-3 text-neutral-400" />
                                                {client.email}
                                            </div>
                                            {client.phone && (
                                                <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                                                    <Phone className="h-3 w-3 text-neutral-400" />
                                                    {client.phone}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-start gap-1.5 text-xs text-neutral-600 max-w-[200px]">
                                            <MapPin className="h-3 w-3 text-neutral-400 mt-0.5 shrink-0" />
                                            <span className="line-clamp-2">{client.address || "-"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-neutral-100 text-neutral-600 border-none font-medium">
                                            {client.projects_count || 0} Project
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                                                onClick={() => handleEdit(client)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                                                onClick={() => handleDelete(client)}
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

            {/* Pagination */}
            <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                    Menampilkan {(meta.current_page - 1) * 10 + 1} sampai {Math.min(meta.current_page * 10, meta.total)} dari {meta.total} data
                </p>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={meta.current_page === 1 || isLoading}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: meta.last_page }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === meta.last_page || Math.abs(p - meta.current_page) <= 1)
                            .map((p, i, arr) => (
                                <React.Fragment key={p}>
                                    {i > 0 && arr[i-1] !== p - 1 && <span className="text-neutral-300">...</span>}
                                    <Button
                                        variant={p === meta.current_page ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setPage(p)}
                                        className={`h-8 w-8 p-0 text-xs ${p === meta.current_page ? "bg-orange-600 hover:bg-orange-700" : ""}`}
                                    >
                                        {p}
                                    </Button>
                                </React.Fragment>
                            ))}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                        disabled={meta.current_page === meta.last_page || isLoading}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Form Dialog */}
            <ClientFormDialog
                open={isFormOpen}
                onOpenChange={(open) => {
                    setIsFormOpen(open)
                    if (!open) setSelectedClient(null)
                }}
                client={selectedClient}
            />

            {/* Delete Confirm Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Client</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus client <strong>"{clientToDelete?.name}"</strong>? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => clientToDelete && deleteMutation.mutate(clientToDelete.id)}
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
