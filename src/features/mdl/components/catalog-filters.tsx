"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { mdlService } from "@/features/mdl/api/mdl-service"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Search, X } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { Slider } from "@/components/ui/slider"

export function CatalogFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Query Params
    const initialSearch = searchParams.get("search") || ""
    const initialCategory = searchParams.get("kategori") || ""
    const initialMin = searchParams.get("min_price") || ""
    const initialMax = searchParams.get("max_price") || ""

    // Local State
    const [search, setSearch] = useState(initialSearch)
    const [selectedCategory, setSelectedCategory] = useState(initialCategory)
    const [priceRange, setPriceRange] = useState([Number(initialMin) || 0, Number(initialMax) || 100000000]) // 0 - 100jt default

    const debouncedSearch = useDebounce(search, 500)
    const debouncedPrice = useDebounce(priceRange, 800)

    // Fetch Categories
    const { data: categories = [] } = useQuery({
        queryKey: ["mdl-categories"],
        queryFn: mdlService.getCategories
    })

    // URL Update Logic
    useEffect(() => {
        const params = new URLSearchParams()

        if (debouncedSearch) params.set("search", debouncedSearch)
        if (selectedCategory) params.set("kategori", selectedCategory)

        // Only set price if it deviates from defaults or allows server logic
        if (debouncedPrice[0] > 0) params.set("min_price", debouncedPrice[0].toString())
        if (debouncedPrice[1] < 100000000) params.set("max_price", debouncedPrice[1].toString())

        params.set("page", "1") // Reset page on filter change

        router.push(`/dashboard/external/mdl?${params.toString()}`)
    }, [debouncedSearch, selectedCategory, debouncedPrice, router])

    const clearFilters = () => {
        setSearch("")
        setSelectedCategory("")
        setPriceRange([0, 100000000])
        router.push("/dashboard/external/mdl")
    }

    return (
        <div className="space-y-8">
            {/* Search */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase text-neutral-500 tracking-wider">Search</Label>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
                    <Input
                        placeholder="Search items..."
                        className="pl-9 bg-white border-neutral-200 focus:border-orange-500 focus:ring-orange-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <Separator />

            {/* Categories */}
            <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase text-neutral-500 tracking-wider">Categories</Label>
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setSelectedCategory("")}
                            className={`text-sm ${selectedCategory === "" ? "font-bold text-orange-600" : "text-neutral-600 hover:text-neutral-900"}`}
                        >
                            All Categories
                        </button>
                    </div>
                    {categories.length === 0 && (
                        <div className="text-xs text-neutral-400 italic px-2">No categories found.</div>
                    )}
                    {categories.map((cat: string) => (
                        <div key={cat} className="flex items-center space-x-2">
                            <Checkbox
                                id={cat}
                                checked={selectedCategory === cat}
                                onCheckedChange={() => setSelectedCategory(selectedCategory === cat ? "" : cat)}
                                className="data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                            />
                            <label
                                htmlFor={cat}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-neutral-700"
                            >
                                {cat}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            <Separator />

            {/* Price Range */}
            <div className="space-y-4">
                <Label className="text-xs font-semibold uppercase text-neutral-500 tracking-wider">Price Range</Label>
                <div className="px-2">
                    <Slider
                        defaultValue={[0, 100000000]}
                        max={100000000}
                        step={500000}
                        value={priceRange}
                        onValueChange={setPriceRange}
                        className="accent-orange-600"
                    />
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span>Rp {(priceRange[0]).toLocaleString('id-ID')}</span>
                    <span>Rp {(priceRange[1]).toLocaleString('id-ID')}</span>
                </div>
            </div>

            <Button variant="outline" size="sm" onClick={clearFilters} className="w-full text-neutral-500 hover:text-red-600">
                <X className="mr-2 h-3 w-3" /> Clear Filters
            </Button>
        </div>
    )
}
