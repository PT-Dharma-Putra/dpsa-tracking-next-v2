"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  Plus, 
  Search, 
  Trash, 
  Pencil, 
  Printer, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Building2, 
  Calendar, 
  Truck, 
  User,
  Settings
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

import { PengirimanService, Pengiriman } from "@/features/pengiriman/services/pengiriman-service"
import { ClientService } from "@/features/clients/services/client-service"
import { PengirimanFormDialog } from "./_components/pengiriman-form-dialog"

export default function PengirimanPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = React.useState("")
  const [clientId, setClientId] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [debouncedSearch, setDebouncedSearch] = React.useState("")

  // Form dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [selectedPengiriman, setSelectedPengiriman] = React.useState<Pengiriman | null>(null)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [pengirimanToDelete, setPengirimanToDelete] = React.useState<number | null>(null)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  React.useEffect(() => {
    setPage(1)
  }, [clientId])

  // Fetch Shipments
  const { data: shipmentsData, isLoading: isLoadingShipments } = useQuery({
    queryKey: ["pengiriman", page, debouncedSearch, clientId],
    queryFn: () => PengirimanService.getPengiriman({
      page,
      search: debouncedSearch,
      client_id: clientId || undefined,
      per_page: 10
    }),
  })

  // Fetch Clients for Filter dropdown (small list is fine)
  const { data: clientsResponse } = useQuery({
    queryKey: ["clients-all-filter"],
    queryFn: () => ClientService.getClients({ per_page: 100 }),
  })
  const clientsList = clientsResponse?.data || []

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => PengirimanService.deletePengiriman(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pengiriman"] })
      toast.success("Data pengiriman berhasil dihapus")
      setDeleteDialogOpen(false)
    },
    onError: () => {
      toast.error("Gagal menghapus data pengiriman")
    }
  })

  const handleCreate = () => {
    setSelectedPengiriman(null)
    setDialogOpen(true)
  }

  const handleEdit = (item: Pengiriman) => {
    setSelectedPengiriman(item)
    setDialogOpen(true)
  }

  const handleDeleteClick = (id: number) => {
    setPengirimanToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (pengirimanToDelete) {
      deleteMutation.mutate(pengirimanToDelete)
    }
  }

  const handlePrint = (id: number) => {
    window.open(`/dashboard/projects-v2/pengiriman/print?id=${id}`, "_blank")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight pt-4 text-neutral-900">Project V2 | Pengiriman</h1>
          <p className="text-sm text-muted-foreground">
            Kelola data pengiriman, monitoring surat jalan, dan koordinasi pemasangan (setting) item proyek.
          </p>
        </div>
        <div>
          <Button onClick={handleCreate} className="w-full md:w-auto bg-primary text-white hover:bg-primary/90 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Tambah Pengiriman
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Cari surat jalan, supir, kendaraan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-neutral-50 border-neutral-200 focus-visible:bg-white"
            />
          </div>

          {/* Client Filter */}
          <div className="w-full">
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-neutral-200 bg-neutral-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Semua Client</option>
              {clientsList.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        {isLoadingShipments ? (
          <div className="p-12 flex flex-col justify-center items-center gap-3 text-muted-foreground text-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            Memuat data pengiriman...
          </div>
        ) : !shipmentsData || shipmentsData.data.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm border-neutral-200 border-dashed border-2 m-6 rounded-lg">
            Tidak ada data pengiriman yang ditemukan. Silakan tambahkan baru atau ubah kata kunci pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50/70 border-b border-neutral-200 text-neutral-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">No. Surat Jalan</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Supir & Kendaraan</th>
                  <th className="p-4">Setrim</th>
                  <th className="p-4">Setting (Pemasangan)</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {shipmentsData.data.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                    {/* Tanggal */}
                    <td className="p-4 whitespace-nowrap font-medium text-neutral-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-neutral-400 shrink-0" />
                        {format(new Date(item.tanggal), "dd MMM yyyy")}
                      </div>
                    </td>

                    {/* No Surat Jalan */}
                    <td className="p-4 font-semibold text-neutral-900 whitespace-nowrap">
                      {item.surat_jalan || "-"}
                    </td>

                    {/* Client */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-neutral-700">
                        <Building2 className="h-4 w-4 text-neutral-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{item.client?.name || "Unknown Client"}</span>
                      </div>
                    </td>

                    {/* Supir & Kendaraan */}
                    <td className="p-4">
                      <div className="space-y-0.5 text-neutral-700 text-xs">
                        {item.supir && (
                          <div className="flex items-center gap-1.5">
                            <User className="h-3 w-3 text-neutral-400 shrink-0" />
                            <span>{item.supir}</span>
                          </div>
                        )}
                        {item.no_kendaraan && (
                          <div className="flex items-center gap-1.5">
                            <Truck className="h-3 w-3 text-neutral-400 shrink-0" />
                            <span>{item.no_kendaraan}</span>
                          </div>
                        )}
                        {!item.supir && !item.no_kendaraan && <span className="text-neutral-400">-</span>}
                      </div>
                    </td>

                    {/* Setrim */}
                    <td className="p-4 whitespace-nowrap text-neutral-700">
                      {item.setrim || "-"}
                    </td>

                    {/* Setting */}
                    <td className="p-4">
                      <div className="space-y-1 text-xs text-neutral-700">
                        {item.koor_setting && (
                          <div>
                            <span className="text-neutral-400">Koor:</span> {item.koor_setting}
                          </div>
                        )}
                        {(item.tanggal_mulai_setting || item.tanggal_selesai_setting) && (
                          <div className="text-neutral-500 font-mono">
                            {item.tanggal_mulai_setting ? format(new Date(item.tanggal_mulai_setting), "dd/MM/yy") : "?"} -{" "}
                            {item.tanggal_selesai_setting ? format(new Date(item.tanggal_selesai_setting), "dd/MM/yy") : "?"}
                          </div>
                        )}
                        {!item.koor_setting && !item.tanggal_mulai_setting && !item.tanggal_selesai_setting && (
                          <span className="text-neutral-400">-</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Print */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePrint(item.id)}
                          className="h-8 w-8 text-neutral-500 hover:text-primary hover:bg-neutral-100"
                          title="Cetak Surat Jalan"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>

                        {/* Edit */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                          className="h-8 w-8 text-neutral-500 hover:text-amber-600 hover:bg-neutral-100"
                          title="Edit Pengiriman"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(item.id)}
                          className="h-8 w-8 text-neutral-500 hover:text-red-600 hover:bg-neutral-100"
                          title="Hapus"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {shipmentsData && shipmentsData.last_page > 1 && (
          <div className="bg-neutral-50/50 border-t border-neutral-200 px-4 py-3 flex items-center justify-between">
            <div className="text-xs text-neutral-500">
              Menampilkan halaman <span className="font-semibold">{shipmentsData.current_page}</span> dari{" "}
              <span className="font-semibold">{shipmentsData.last_page}</span> ({shipmentsData.total} total)
            </div>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="h-8 text-xs flex items-center gap-1"
              >
                <ChevronLeft className="h-3 w-3" />
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(prev => Math.min(prev + 1, shipmentsData.last_page))}
                disabled={page === shipmentsData.last_page}
                className="h-8 text-xs flex items-center gap-1"
              >
                Selanjutnya
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <PengirimanFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        pengiriman={selectedPengiriman}
      />

      {/* Delete Confirmation Alert */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda sangat yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Menghapus data pengiriman ini juga akan menghapus seluruh data item detail yang terkait.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Hapus Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
