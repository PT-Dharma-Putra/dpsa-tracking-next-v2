"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { Search, Loader2, Check } from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { projectV2Service, MDLItem } from "@/features/projects/services/project-v2-service"
import { useDebounce } from "@/hooks/use-debounce"

interface MDLItemSelectorDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelect: (item: MDLItem) => void
}

export function MDLItemSelectorDialog({ open, onOpenChange, onSelect }: MDLItemSelectorDialogProps) {
    const [search, setSearch] = React.useState("")
    const debouncedSearch = useDebounce(search, 500)
    const [page, setPage] = React.useState(1)

    const { data, isLoading } = useQuery({
        queryKey: ["mdl-items", debouncedSearch, page],
        queryFn: () => projectV2Service.getMDLItems({ search: debouncedSearch, page, per_page: 10 }),
        enabled: open,
    })

    const items = data?.data || []
    const totalPages = data?.last_page || 1

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Select Item from Master Data</DialogTitle>
                </DialogHeader>

                <div className="flex items-center gap-2 px-1 py-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or category..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setPage(1)
                            }}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto border rounded-md">
                    <Table>
                        <TableHeader className="sticky top-0 bg-white z-10">
                            <TableRow>
                                <TableHead>Kategori</TableHead>
                                <TableHead>Sub Kategori</TableHead>
                                <TableHead>Kode</TableHead>
                                <TableHead>Nama Barang</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                        No items found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item: MDLItem) => (
                                    <TableRow key={item.id} className="hover:bg-neutral-50">
                                        <TableCell className="text-xs">{item.kategori_mdl}</TableCell>
                                        <TableCell className="text-xs">{item.sub_kategori || "-"}</TableCell>
                                        <TableCell className="text-xs font-mono">{item.kode_barang || "-"}</TableCell>
                                        <TableCell className="text-sm font-medium">{item.nama_barang}</TableCell>
                                        <TableCell>
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => onSelect(item)}
                                            >
                                                Select
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-2 py-4">
                        <p className="text-xs text-muted-foreground">
                            Page {page} of {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
