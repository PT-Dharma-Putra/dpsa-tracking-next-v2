"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { mdlService } from "@/features/mdl/api/mdl-service"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ShoppingBag, ArrowLeft, ShieldCheck, Ruler, Truck, Copy } from "lucide-react"
import { useCartStore } from "@/features/shop/stores/cart-store"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProductDetailPage() {
    const params = useParams()
    const router = useRouter()
    const id = Number(params.id)
    const addToCart = useCartStore((state) => state.addToCart)

    const { data: item, isLoading } = useQuery({
        queryKey: ["mdl-item", id],
        queryFn: () => mdlService.getById(id),
        enabled: !!id
    })

    if (isLoading) {
        return <ProductDetailSkeleton />
    }

    if (!item) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <h2 className="text-xl font-bold text-neutral-900">Product Not Found</h2>
                <Button variant="link" onClick={() => router.back()}>Go Back</Button>
            </div>
        )
    }

    const handleAddToCart = () => {
        addToCart(item, 1)
        toast.success("Added to cart", {
            description: `${item.nama_barang}`
        })
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Breadcrumb / Back */}
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="pl-0 text-neutral-500 hover:text-neutral-900">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Catalog
            </Button>

            <div className="space-y-8">
                {/* Header Section (Simplified) */}
                <div className="border-b border-neutral-100 pb-8">
                    <Badge variant="secondary" className="mb-4 bg-orange-100 text-orange-700 hover:bg-orange-100 border-none px-3 py-1">
                        {item.kategori_mdl}
                    </Badge>
                    <h1 className="text-4xl font-bold text-neutral-900 mb-4 leading-tight">{item.nama_barang}</h1>
                    <div className="flex items-center gap-3 text-sm text-neutral-500">
                        <Badge variant="outline" className="rounded-md font-mono text-xs px-2 py-0.5">{item.kode_barang || 'NO-CODE'}</Badge>
                        <span className="text-neutral-300">|</span>
                        <span>{item.sub_kategori || 'General Item'}</span>
                        <span className="text-neutral-300">|</span>
                        <span>Added on {new Date(item.created_at || new Date()).toLocaleDateString()}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Main Content (Specs) - 8 Cols */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Specs Card */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-xl font-semibold text-neutral-900">
                                <Ruler className="h-5 w-5 text-orange-600" /> Specifications
                            </div>
                            <Card className="border-neutral-200 shadow-sm">
                                <CardContent className="p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 Jabodetabek
Rp 10.000.000gap-x-12">
                                        <div>
                                            <span className="text-neutral-400 block text-xs uppercase tracking-wider font-semibold mb-2">Dimensions (LxWxH)</span>
                                            <span className="text-lg font-medium text-neutral-900 block">
                                                {item.dimensi_panjang ?? '-'} x {item.dimensi_lebar ?? '-'} x {item.dimensi_tinggi ?? '-'} mx
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-neutral-400 block text-xs uppercase tracking-wider font-semibold mb-2">Volume</span>
                                            <span className="text-lg font-medium text-neutral-900 block">{item.volume ?? '-'} m³</span>
                                        </div>
                                        <div className="md:col-span-2">
                                            <span className="text-neutral-400 block text-xs uppercase tracking-wider font-semibold mb-2">Material & Finish</span>
                                            <p className="text-lg font-medium text-neutral-900 leading-relaxed whitespace-pre-wrap">
                                                {item.spesifikasi_dan_material || 'No specific material data available.'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-neutral-400 block text-xs uppercase tracking-wider font-semibold mb-2">Recommended Location</span>
                                            <span className="text-lg font-medium text-neutral-900 block">{item.lokasi_ruangan || 'General Use'}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Additional Info Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100/50 flex flex-col gap-3">
                                <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-neutral-900 mb-1">Warranty Assurance</h4>
                                    <p className="text-sm text-neutral-600 leading-relaxed">
                                        {item.prioritas_garansi || "Protected by standard manufacturer warranty policies."}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100/50 flex flex-col gap-3">
                                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Truck className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-neutral-900 mb-1">Delivery Information</h4>
                                    <p className="text-sm text-neutral-600 leading-relaxed">
                                        Includes delivery for Jabodetabek. Check with sales for other regions.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Actions - 4 Cols (Sticky) */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="sticky top-24 space-y-6">
                            {/* Price Card (Moved Here) */}
                            <Card className="border-orange-200 bg-orange-50/30 overflow-hidden">
                                <div className="bg-orange-100/50 px-6 py-3 border-b border-orange-200/50 flex items-center gap-2">
                                    <ShoppingBag className="h-4 w-4 text-orange-700" />
                                    <span className="text-xs font-bold text-orange-800 uppercase tracking-wider">Pricing Details</span>
                                </div>
                                <CardContent className="p-6 space-y-5">
                                    <div className="flex flex-col gap-4">
                                        <div className="border-b border-orange-200/50 pb-4">
                                            <span className="text-sm font-medium text-neutral-500 block mb-1">Jabodetabek</span>
                                            <span className="text-3xl font-bold text-neutral-900 tracking-tight">
                                                Rp {Number(item.harga_jabodetabek || 0).toLocaleString('id-ID')}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-xs font-medium text-neutral-500 block mb-1">Pulau Jawa</span>
                                                <span className="text-lg font-semibold text-neutral-700 block">
                                                    Rp {Number(item.harga_pulau_jawa || 0).toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-xs font-medium text-neutral-500 block mb-1">Luar Jawa</span>
                                                <span className="text-lg font-semibold text-neutral-700 block">
                                                    Rp {Number(item.harga_luar_jawa || 0).toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <Button size="lg" className="w-full bg-neutral-900 hover:bg-neutral-800 text-white shadow-lg h-12 text-base mt-2" onClick={handleAddToCart}>
                                        Add to Cart
                                    </Button>
                                    <p className="text-[10px] text-center text-neutral-400">
                                        Price excludes tax. Unit: {item.nama_satuan_beli || 'Pcs'}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Docs */}
                            <div className="space-y-3 pt-4 border-t border-neutral-100">
                                <h4 className="font-medium text-xs text-neutral-500 uppercase tracking-wider mb-2">Resources</h4>
                                {item.foto && (
                                    <Button variant="outline" className="w-full justify-start h-auto py-3 bg-white hover:bg-neutral-50" onClick={() => window.open(item.foto, '_blank')}>
                                        <ShoppingBag className="mr-3 h-4 w-4 text-neutral-500" /> View Product Photo
                                    </Button>
                                )}
                                {item.link_gambar_kerja ? (
                                    <Button variant="outline" className="w-full justify-start h-auto py-3 bg-white hover:bg-neutral-50" onClick={() => window.open(item.link_gambar_kerja, '_blank')}>
                                        <Copy className="mr-3 h-4 w-4 text-neutral-500" /> Work Drawing (DWG)
                                    </Button>
                                ) : (
                                    <div className="text-xs text-neutral-400 italic px-2 py-2 text-center bg-neutral-50 rounded-lg border border-dashed border-neutral-200">
                                        No work drawing available.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function ProductDetailSkeleton() {
    return (
        <div className="max-w-7xl mx-auto space-y-8 p-8">
            <Skeleton className="h-10 w-32" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <Skeleton className="aspect-square rounded-2xl" />
                <div className="space-y-6">
                    <Skeleton className="h-12 w-3/4" />
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-40 w-full rounded-xl" />
                </div>
            </div>
        </div>
    )
}
