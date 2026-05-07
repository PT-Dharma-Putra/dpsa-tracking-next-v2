"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Minus, Search, X, Package, Check, ShoppingCart } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { projectV2Service } from "@/features/projects/services/project-v2-service"

interface CatalogModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: number
}

interface CartItem {
  mdlItem: any
  quantity: number
}

export function CatalogModal({ isOpen, onClose, projectId }: CatalogModalProps) {
  const queryClient = useQueryClient()

  // Filters state
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all")
  const [selectedLokasi, setSelectedLokasi] = React.useState<string>("all")
  const [page, setPage] = React.useState(1)
  const [minPrice, setMinPrice] = React.useState<number>(0)
  const [maxPrice, setMaxPrice] = React.useState<number>(100000000)
  const [debouncedMinPrice, setDebouncedMinPrice] = React.useState<number>(0)
  const [debouncedMaxPrice, setDebouncedMaxPrice] = React.useState<number>(100000000)

  // Cart state: map of mdl_item_id -> CartItem
  const [cart, setCart] = React.useState<Record<number, CartItem>>({})

  // Debounce Search & Price
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setDebouncedMinPrice(minPrice)
      setDebouncedMaxPrice(maxPrice)
      setPage(1) // Reset page on filter change
    }, 500)
    return () => clearTimeout(timer)
  }, [search, minPrice, maxPrice])

  // Queries
  const { data: categories } = useQuery({
    queryKey: ["mdl-categories"],
    queryFn: () => projectV2Service.getMDLCategories(),
    enabled: isOpen,
  })

  const { data: locations } = useQuery({
    queryKey: ["mdl-locations"],
    queryFn: () => projectV2Service.getMDLLocations(),
    enabled: isOpen,
  })

  const { data: itemsData, isLoading: isLoadingItems } = useQuery({
    queryKey: ["mdl-items", page, debouncedSearch, selectedCategory, selectedLokasi, debouncedMinPrice, debouncedMaxPrice],
    queryFn: () => projectV2Service.getMDLItems({
      page,
      per_page: 12,
      search: debouncedSearch || undefined,
      kategori: selectedCategory !== "all" ? selectedCategory : undefined,
      lokasi_ruangan: selectedLokasi !== "all" ? selectedLokasi : undefined,
      min_price: debouncedMinPrice > 0 ? debouncedMinPrice : undefined,
      max_price: debouncedMaxPrice < 100000000 ? debouncedMaxPrice : undefined,
    }),
    enabled: isOpen,
  })

  // Mutations
  const bulkSubmitMutation = useMutation({
    mutationFn: (items: any[]) => projectV2Service.createProjectItemsBulk(projectId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-v2-items", projectId] })
      toast.success("Successfully added items to project")
      setCart({})
      onClose()
    },
    onError: () => {
      toast.error("Failed to add items to project")
    }
  })

  // Handlers
  const handleAddToCart = (item: any) => {
    setCart(prev => {
      const existing = prev[item.id]
      if (existing) {
        return { ...prev, [item.id]: { ...existing, quantity: existing.quantity + 1 } }
      }
      return { ...prev, [item.id]: { mdlItem: item, quantity: 1 } }
    })
  }

  const handleUpdateQuantity = (item: any, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => {
        const newCart = { ...prev }
        delete newCart[item.id]
        return newCart
      })
      return
    }
    
    setCart(prev => ({
      ...prev,
      [item.id]: { mdlItem: item, quantity }
    }))
  }

  const handleClearFilters = () => {
    setSearch("")
    setDebouncedSearch("")
    setSelectedCategory("all")
    setSelectedLokasi("all")
    setMinPrice(0)
    setMaxPrice(100000000)
    setPage(1)
  }

  const handleSubmit = () => {
    const itemsToSubmit = Object.values(cart).map(cartItem => ({
      mdl_item_id: cartItem.mdlItem.id,
      item: cartItem.mdlItem.nama_barang,
      jumlah: cartItem.quantity,
      volume: cartItem.mdlItem.volume || null,
      keterangan: cartItem.mdlItem.spesifikasi_dan_material || null,
      lantai: null,
      ruang: cartItem.mdlItem.lokasi_ruangan || null,
      divisi_id: null,
    }))

    if (itemsToSubmit.length === 0) {
      toast.error("Cart is empty")
      return
    }

    bulkSubmitMutation.mutate(itemsToSubmit)
  }

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value)
  }

  const totalItems = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0)
  const items = itemsData?.data || []
  const totalPages = itemsData?.last_page || 1

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="mb-8 flex h-[calc(100vh-2rem)] min-w-[calc(100vw-2rem)] flex-col justify-between gap-0 p-0">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div>
            <DialogTitle className="text-2xl font-bold tracking-tight text-neutral-800">Catalog</DialogTitle>
            <p className="text-sm text-neutral-500 mt-1">Browse premium materials and add to project.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-neutral-100 px-4 py-2 rounded-full border border-neutral-200">
              <ShoppingCart className="w-4 h-4 text-neutral-500" />
              <span className="font-semibold text-sm text-neutral-700">{totalItems} items selected</span>
            </div>
            <Button onClick={handleSubmit} disabled={totalItems === 0 || bulkSubmitMutation.isPending} className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-6">
              {bulkSubmitMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Save to Project
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-[280px] bg-white border-r flex flex-col shrink-0 overflow-y-auto">
            <div className="p-6 flex flex-col gap-8">
              {/* Search */}
              <div className="space-y-3">
                <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <Input 
                    placeholder="Search items..." 
                    className="pl-9 h-10 bg-neutral-50 border-neutral-200 focus:bg-white transition-colors" 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-4">
                <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Categories</Label>
                <RadioGroup value={selectedCategory} onValueChange={setSelectedCategory} className="flex flex-col gap-3">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="all" id="cat-all" className="text-orange-600 border-neutral-300" />
                    <Label htmlFor="cat-all" className="font-medium cursor-pointer">All Categories</Label>
                  </div>
                  {categories?.map((cat) => (
                    <div key={cat} className="flex items-center space-x-3">
                      <RadioGroupItem value={cat} id={`cat-${cat}`} className="text-orange-600 border-neutral-300" />
                      <Label htmlFor={`cat-${cat}`} className="text-neutral-600 cursor-pointer">{cat}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Lokasi Ruangan */}
              <div className="space-y-4">
                <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Lokasi Ruangan</Label>
                <RadioGroup value={selectedLokasi} onValueChange={setSelectedLokasi} className="flex flex-col gap-3">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="all" id="loc-all" className="text-orange-600 border-neutral-300" />
                    <Label htmlFor="loc-all" className="font-medium cursor-pointer">All Locations</Label>
                  </div>
                  {locations?.map((loc) => (
                    <div key={loc} className="flex items-center space-x-3">
                      <RadioGroupItem value={loc} id={`loc-${loc}`} className="text-orange-600 border-neutral-300" />
                      <Label htmlFor={`loc-${loc}`} className="text-neutral-600 cursor-pointer">{loc}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Button variant="outline" onClick={handleClearFilters} className="w-full h-10 border-neutral-200 text-neutral-600 font-medium hover:bg-neutral-50">
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden relative bg-neutral-50/50">
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-neutral-500 font-medium">Showing <span className="text-neutral-800 font-bold">{itemsData?.total || 0}</span> items</p>
              </div>

              {isLoadingItems ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-neutral-400">
                  <Package className="w-12 h-12 mb-4 text-neutral-300" />
                  <p className="text-lg font-medium text-neutral-500">No items found</p>
                  <p className="text-sm">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {items.map((item: any) => {
                    const cartItem = cart[item.id]
                    const qty = cartItem?.quantity || 0

                    return (
                      <Card key={item.id} className="overflow-hidden border-neutral-200/60 shadow-sm hover:shadow-md transition-all duration-200 group flex flex-col h-full bg-white">
                        <CardContent className="p-5 flex flex-col h-full">
                          <div className="mb-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-500">
                                {item.kategori_mdl}
                              </span>
                              {item.lokasi_ruangan && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600">
                                  {item.lokasi_ruangan}
                                </span>
                              )}
                            </div>
                            <h3 className="font-bold text-neutral-800 leading-tight line-clamp-2 mt-2">{item.nama_barang}</h3>
                          </div>
                          
                          <div className="mt-auto pt-4 flex items-center justify-between border-t border-neutral-100">
                            <div>
                              <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider mb-0.5">Price</p>
                              <p className="font-bold text-neutral-900">{item.harga_pulau_jawa ? formatRupiah(item.harga_pulau_jawa) : '-'}</p>
                            </div>
                            
                            <div className="shrink-0">
                              {qty > 0 ? (
                                <div className="flex items-center bg-orange-50 border border-orange-200 rounded-lg p-1 h-10">
                                  <button onClick={() => handleUpdateQuantity(item, qty - 1)} className="w-8 h-8 flex items-center justify-center text-orange-600 hover:bg-orange-100 rounded-md transition-colors">
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span className="w-8 text-center font-bold text-orange-700 text-sm">{qty}</span>
                                  <button onClick={() => handleUpdateQuantity(item, qty + 1)} className="w-8 h-8 flex items-center justify-center text-orange-600 hover:bg-orange-100 rounded-md transition-colors">
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <Button size="icon" variant="outline" onClick={() => handleAddToCart(item)} className="h-10 w-10 border-neutral-200 text-neutral-600 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 rounded-lg transition-colors">
                                  <Plus className="w-5 h-5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white border-t px-6 py-4 flex items-center justify-center gap-4 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] z-10">
                <Button 
                  variant="outline" 
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-6 rounded-full font-medium"
                >
                  Previous
                </Button>
                <span className="text-sm font-medium text-neutral-600 px-4">
                  Page {page} of {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-6 rounded-full font-medium"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
