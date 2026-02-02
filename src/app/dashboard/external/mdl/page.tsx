"use client"

import { useQuery } from "@tanstack/react-query"
import { ShoppingBag, Plus, Search, LayoutGrid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useCartStore } from "@/features/shop/stores/cart-store"
import { mdlService } from "@/features/mdl/api/mdl-service"
import { MDLItem } from "@/features/mdl/types"
import { toast } from "sonner"
import { CatalogFilters } from "@/features/mdl/components/catalog-filters"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import { cn } from "@/lib/utils"

export default function CatalogPage() {
    const searchParams = useSearchParams()
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

    // Parse URL params
    const page = Number(searchParams.get("page")) || 1
    const search = searchParams.get("search") || undefined
    const kategori = searchParams.get("kategori") || undefined
    const min_price = searchParams.get("min_price") ? Number(searchParams.get("min_price")) : undefined
    const max_price = searchParams.get("max_price") ? Number(searchParams.get("max_price")) : undefined

    // Fetch MDL Items with Params
    const { data, isLoading } = useQuery({
        queryKey: ["mdl-catalog", page, search, kategori, min_price, max_price],
        queryFn: () => mdlService.getItems({
            page,
            per_page: viewMode === "list" ? 20 : 12, // Load more items in list view
            search,
            kategori,
            min_price,
            max_price
        }),
        placeholderData: (prev) => prev
    })

    const items = data?.data || []
    const router = useRouter()

    const updatePage = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set("page", newPage.toString())
        router.push(`/dashboard/external/mdl?${params.toString()}`)
    }

    return (
        <div className="flex flex-col md:flex-row gap-8 animate-in fade-in duration-700">
            {/* Sidebar Filters */}
            <aside className="w-full md:w-64 shrink-0 space-y-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mb-2">Catalog</h1>
                    <p className="text-sm text-muted-foreground">Browse premium materials.</p>
                </div>
                <CatalogFilters />
            </aside>

            {/* Main Content */}
            <div className="flex-1">
                {/* Header Actions */}
                <div className="flex justify-between items-center mb-6">
                    <p className="text-sm text-neutral-500">
                        Showing <span className="font-semibold text-neutral-900">{items.length}</span> items
                    </p>
                    <div className="flex items-center space-x-1 border rounded-lg p-1 bg-white">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn("h-8 w-8 p-0", viewMode === "grid" && "bg-neutral-100 text-orange-600")}
                            onClick={() => setViewMode("grid")}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn("h-8 w-8 p-0", viewMode === "list" && "bg-neutral-100 text-orange-600")}
                            onClick={() => setViewMode("list")}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {isLoading ? (
                    <div className={cn(
                        "gap-6",
                        viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-4"
                    )}>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className={cn(
                                "bg-neutral-100 animate-pulse rounded-xl",
                                viewMode === "grid" ? "h-[180px]" : "h-[80px]"
                            )} />
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-32 bg-neutral-50/50 rounded-2xl border-2 border-dashed border-neutral-100">
                        <ShoppingBag className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
                        <h3 className="text-lg font-semibold text-neutral-900">No items found</h3>
                        <p className="text-neutral-500 max-w-xs mx-auto mt-2">Try adjusting your search or filters to find what you're looking for.</p>
                    </div>
                ) : (
                    <>
                        {viewMode === "grid" ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                                {items.map((item: MDLItem) => (
                                    <ProductCard key={item.id} item={item} />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3 mb-8">
                                {items.map((item: MDLItem) => (
                                    <ProductListItem key={item.id} item={item} />
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        <div className="flex justify-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => updatePage(page - 1)}
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <div className="flex items-center px-4 font-medium text-sm">
                                Page {data?.current_page} of {data?.last_page}
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => updatePage(page + 1)}
                                disabled={!data?.next_page_url}
                            >
                                Next
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

function ProductCard({ item }: { item: MDLItem }) {
    const addToCart = useCartStore((state) => state.addToCart)

    const handleAdd = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        addToCart(item, 1)
        toast.success("Added to cart", {
            description: `${item.nama_barang}`
        })
    }

    return (
        <Link href={`/dashboard/external/mdl/${item.id}`}>
            <Card className="hover:shadow-md transition-all duration-300 group cursor-pointer h-full border-neutral-200 hover:border-orange-300 bg-white">
                <CardContent className="p-5 flex flex-col h-full justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider bg-neutral-100 text-neutral-600 border-none shrink-0">
                                {item.kategori_mdl}
                            </Badge>
                        </div>
                        <h3 className="font-semibold text-neutral-900 leading-snug group-hover:text-orange-600 transition-colors" title={item.nama_barang}>
                            {item.nama_barang}
                        </h3>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-50 mt-auto">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-medium">Price</span>
                            <span className="font-bold text-neutral-900">
                                Rp {(item.harga_jabodetabek || 0).toLocaleString('id-ID')}
                            </span>
                        </div>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-neutral-400 hover:text-orange-600 hover:bg-orange-50 rounded-full"
                            onClick={handleAdd}
                        >
                            <Plus className="h-5 w-5" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}

function ProductListItem({ item }: { item: MDLItem }) {
    const addToCart = useCartStore((state) => state.addToCart)

    const handleAdd = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        addToCart(item, 1)
        toast.success("Added to cart", {
            description: `${item.nama_barang}`
        })
    }

    return (
        <Link href={`/dashboard/external/mdl/${item.id}`} className="block">
            <div className="bg-white border border-neutral-200 rounded-lg p-4 hover:border-orange-300 hover:shadow-sm transition-all flex items-center gap-4 group">
                {/* Icon Placeholder (Mini) */}
                <div className="h-10 w-10 bg-neutral-50 rounded-md flex items-center justify-center shrink-0 border border-neutral-100">
                    <ShoppingBag className="h-4 w-4 text-neutral-300" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-6">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-[9px] uppercase tracking-wider text-neutral-500 border-neutral-200 h-5">
                                {item.kategori_mdl}
                            </Badge>
                        </div>
                        <h3 className="font-medium text-neutral-900 truncate group-hover:text-orange-600 transition-colors">
                            {item.nama_barang}
                        </h3>
                    </div>

                    <div className="md:col-span-3 hidden md:block">
                        <span className="text-xs text-neutral-500 line-clamp-1">
                            {item.spesifikasi_dan_material || "-"}
                        </span>
                    </div>

                    <div className="md:col-span-3 text-right">
                        <span className="font-bold text-neutral-900 block">
                            Rp {(item.harga_jabodetabek || 0).toLocaleString('id-ID')}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                            per {item.nama_satuan_beli || 'unit'}
                        </span>
                    </div>
                </div>

                {/* Action */}
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 text-neutral-400 hover:text-orange-600 hover:bg-orange-50 rounded-full shrink-0"
                    onClick={handleAdd}
                >
                    <Plus className="h-5 w-5" />
                </Button>
            </div>
        </Link>
    )
}
