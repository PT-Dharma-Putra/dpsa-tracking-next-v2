"use client"

import Link from "next/link"
import Image from "next/image"
import { Trash2, ArrowRight, ShoppingBag, Plus, Minus, PackageOpen, Loader2, MapPin, Building2, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useCartStore } from "@/features/shop/stores/cart-store"
import { toast } from "sonner"
import { useMutation } from "@tanstack/react-query"
import { ProjectService } from "@/features/projects/services/project-service"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"

// --- Sub-Component: Cart Item Row ---
const CartItem = ({ item, updateQuantity, updateItem, removeFromCart }: { item: any, updateQuantity: any, updateItem: any, removeFromCart: any }) => {
    return (
        <div className="flex flex-col gap-6 py-8 first:pt-0 border-b border-neutral-100 last:border-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {/* Image */}
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
                    {item.foto ? (
                        <img
                            src={item.foto}
                            alt={item.nama_barang}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-neutral-300">
                            <ShoppingBag className="h-7 w-7" />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col justify-between sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 space-y-1">
                        <h3 className="font-semibold text-neutral-900 line-clamp-2">{item.nama_barang}</h3>
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                            <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-600">
                                {item.kategori_mdl || 'Item'}
                            </span>
                            {item.nama_satuan_beli && <span>• {item.nama_satuan_beli}</span>}
                        </div>
                    </div>

                    {/* Quantity & Actions */}
                    <div className="flex items-center justify-between gap-6 sm:justify-end">
                        {/* Price (Desktop) */}
                        <div className="hidden text-right sm:block w-32">
                            <p className="text-[10px] uppercase font-bold text-neutral-400">Price</p>
                            <p className="font-semibold text-sm">Rp {(item.harga_jabodetabek || 0).toLocaleString()}</p>
                        </div>

                        {/* Quantity Control */}
                        <div className="flex items-center rounded-lg border border-neutral-200 bg-white shadow-sm overflow-hidden">
                            <button
                                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                className="flex h-8 w-8 items-center justify-center text-neutral-500 hover:text-orange-600 hover:bg-neutral-50 disabled:opacity-50"
                                disabled={item.quantity <= 1}
                            >
                                <Minus className="h-3 w-3" />
                            </button>
                            <div className="flex h-8 w-8 items-center justify-center border-x border-neutral-100 text-xs font-bold">
                                {item.quantity}
                            </div>
                            <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="flex h-8 w-8 items-center justify-center text-neutral-500 hover:text-orange-600 hover:bg-neutral-50"
                            >
                                <Plus className="h-3 w-3" />
                            </button>
                        </div>

                        {/* Total Subitem & Delete */}
                        <div className="flex items-center gap-4 pl-2">
                            <div className="hidden sm:block text-right min-w-[100px]">
                                <p className="text-[10px] uppercase font-bold text-neutral-400">Subtotal</p>
                                <p className="font-bold text-orange-600 text-sm">
                                    Rp {((item.harga_jabodetabek || 0) * item.quantity).toLocaleString()}
                                </p>
                            </div>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-neutral-400 hover:bg-red-50 hover:text-red-600 rounded-full"
                                onClick={() => removeFromCart(item.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Item Details (Lantai, Ruang, Keterangan) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-neutral-50/50 rounded-xl border border-neutral-100">
                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-neutral-500 flex items-center gap-1.5 ml-1">
                        <MapPin className="h-3 w-3" /> Ruang
                    </label>
                    <Input
                        placeholder="Contoh: Ruang Meeting"
                        value={item.ruang || ''}
                        onChange={(e) => updateItem(item.id, { ruang: e.target.value })}
                        className="h-9 text-xs bg-white border-neutral-200 focus:border-orange-300 focus:ring-orange-200"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-neutral-500 flex items-center gap-1.5 ml-1">
                        <MessageSquare className="h-3 w-3" /> Keterangan
                    </label>
                    <Input
                        placeholder="Tambahkan catatan khusus..."
                        value={item.keterangan || ''}
                        onChange={(e) => updateItem(item.id, { keterangan: e.target.value })}
                        className="h-9 text-xs bg-white border-neutral-200 focus:border-orange-300 focus:ring-orange-200"
                    />
                </div>
            </div>
        </div>
    )
}

// --- Main Page Component ---
export default function CartPage() {
    const { items, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCartStore()
    const router = useRouter()
    const { user } = useAuthStore()

    const checkoutMutation = useMutation({
        mutationFn: async () => {
            if (!user?.id) throw new Error("User not authenticated")

            const description = items.map(i => `${i.quantity}x ${i.nama_barang}`).join('\n');

            return ProjectService.createProject({
                name: `Order Request - ${new Date().toLocaleDateString('id-ID')}`,
                description: `Requested Items:\n${description}`,
                client_id: user.id,
                items: items.map(i => ({
                    item: i.nama_barang,
                    jumlah: i.quantity,
                    harga: i.harga_jabodetabek || 0,
                    satuan: i.nama_satuan_beli || 'Unit',
                    item_type: 'MDL',
                    dimensi_panjang: i.dimensi_panjang ?? null,
                    dimensi_lebar: i.dimensi_lebar ?? null,
                    dimensi_tinggi: i.dimensi_tinggi ?? null,
                    mdl_item_id: i.id,
                    lantai: i.lantai ?? null,
                    ruang: i.ruang ?? null,
                    keterangan: i.keterangan ?? null
                }))
            });
        },
        onSuccess: (data) => {
            toast.success("Request Submitted", {
                description: "We have received your order request."
            })
            clearCart()
            router.push(`/dashboard/external/cart/success?orderId=${data.id}`)
        },
        onError: (error) => {
            toast.error("Submission Failed", {
                description: error.message
            })
        }
    })

    // Empty State
    if (items.length === 0) {
        return (
            <div className="flex min-h-[70vh] flex-col items-center justify-center p-4 text-center">
                <div className="relative mb-6">
                    <div className="absolute inset-0 scale-150 rounded-full bg-orange-50 blur-xl" />
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl shadow-orange-100 ring-1 ring-neutral-100">
                        <PackageOpen className="h-10 w-10 text-orange-600" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Your cart is empty</h2>
                <p className="mt-2 max-w-sm text-neutral-500">
                    Browse our catalog to find materials and equipment for your next project.
                </p>
                <Link href="/dashboard/external/mdl" className="mt-8">
                    <Button size="lg" className="bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-200">
                        Browse Catalog
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Request Cart</h1>
                    <p className="mt-1 text-sm text-neutral-500">Review your items before requesting a quotation.</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                    onClick={clearCart}
                >
                    <Trash2 className="mr-2 h-4 w-4" /> Clear Cart
                </Button>
            </div>

            <div className="grid gap-8 lg:grid-cols-12">
                {/* List Items (Kiri - Lebar) */}
                <div className="lg:col-span-8">
                    <Card className="border-neutral-200 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex flex-col">
                                {items.map((item) => (
                                    <CartItem
                                        key={item.id}
                                        item={item}
                                        updateQuantity={updateQuantity}
                                        updateItem={useCartStore.getState().updateItem}
                                        removeFromCart={removeFromCart}
                                    />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Summary (Kanan - Sticky) */}
                <div className="lg:col-span-4">
                    <div className="sticky top-24">
                        <Card className="border-neutral-200 shadow-lg shadow-neutral-100">
                            <CardHeader className="bg-neutral-50/50 pb-4">
                                <CardTitle className="text-lg">Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-500">Total Items</span>
                                    <span className="font-medium text-neutral-900">{items.reduce((acc, item) => acc + item.quantity, 0)} units</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-500">Subtotal (Est.)</span>
                                    <span className="font-medium text-neutral-900">Rp {getTotalPrice().toLocaleString()}</span>
                                </div>

                                <Separator className="my-2" />

                                <div className="flex items-baseline justify-between">
                                    <span className="text-base font-semibold text-neutral-900">Total Estimate</span>
                                    <span className="text-2xl font-bold text-orange-600">
                                        Rp {getTotalPrice().toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-xs text-neutral-400 italic">
                                    *Final price including tax and shipping will be provided in the official quotation.
                                </p>
                            </CardContent>
                            <CardFooter className="pb-6 pt-2">
                                <Button
                                    className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-base font-medium shadow-md shadow-orange-200"
                                    onClick={() => checkoutMutation.mutate()}
                                    disabled={checkoutMutation.isPending}
                                >
                                    {checkoutMutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Processing Request...
                                        </>
                                    ) : (
                                        <>
                                            Submit Request
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>

                        {/* Security / Info Badges */}
                        <div className="mt-6 flex justify-center gap-4 text-xs text-neutral-400">
                            <div className="flex items-center gap-1.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                Official Quotation
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                Secure Request
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}