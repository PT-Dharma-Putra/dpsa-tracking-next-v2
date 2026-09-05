"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "@/lib/auth-store"
import { ActivityTicker } from "@/features/dashboard/components/client/activity-ticker"
import { ClientProjectCard } from "@/features/dashboard/components/client/project-card"
import { ClientService, HerminaClient } from "@/features/dashboard/services/client-service"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2, Building2, Eye, MapPin, User, X, Hospital, Search, ChevronLeft, ChevronRight } from "lucide-react"

const ITEMS_PER_PAGE = 4

export default function ClientDashboardPage() {
    const { user } = useAuthStore()
    const router = useRouter()
    const searchParams = useSearchParams()

    const [selectedClientId, setSelectedClientId] = React.useState<number | null>(null)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [spkSearchQuery, setSpkSearchQuery] = React.useState("")
    const [currentPage, setCurrentPage] = React.useState(1)
    const activeProjectRef = React.useRef<HTMLDivElement>(null)
    const isInitializedRef = React.useRef(false)

    // Restore saved filter from URL query param or sessionStorage on mount
    React.useEffect(() => {
        if (typeof window === "undefined") return

        const paramClientId = searchParams.get("client_id")
        const storedClientId = sessionStorage.getItem("external_selected_client_id")
        const storedSearch = sessionStorage.getItem("external_hermina_search")
        const storedPage = sessionStorage.getItem("external_hermina_page")

        if (paramClientId) {
            const parsed = Number(paramClientId)
            if (!isNaN(parsed)) {
                setSelectedClientId(parsed)
                sessionStorage.setItem("external_selected_client_id", parsed.toString())
            }
        } else if (!isInitializedRef.current && storedClientId) {
            const parsed = Number(storedClientId)
            if (!isNaN(parsed)) {
                setSelectedClientId(parsed)
                router.replace(`/dashboard/external?client_id=${parsed}`, { scroll: false })
            }
        } else if (isInitializedRef.current && !paramClientId) {
            setSelectedClientId(null)
            sessionStorage.removeItem("external_selected_client_id")
        }

        if (storedSearch && !isInitializedRef.current) {
            setSearchQuery(storedSearch)
        }
        if (storedPage && !isInitializedRef.current) {
            const parsedPage = Number(storedPage)
            if (!isNaN(parsedPage) && parsedPage > 0) {
                setCurrentPage(parsedPage)
            }
        }

        isInitializedRef.current = true
    }, [searchParams, router])

    // Check if user has "Hermina Pusat" role
    const userRoles = [
        user?.role,
        ...(user?.roles_list || []),
        ...(user?.roles?.map(r => typeof r === 'string' ? r : r.name) || [])
    ].filter(Boolean) as string[]

    const isHerminaPusat = userRoles.some(r => r?.toLowerCase().includes('hermina pusat')) || user?.role_id === 19

    // Fetch Hermina Clients if user role is Hermina Pusat
    const { data: herminaClients = [], isLoading: isLoadingHermina } = useQuery({
        queryKey: ["hermina-clients"],
        queryFn: ClientService.getHerminaClients,
        enabled: isHerminaPusat,
    })

    // Fetch Client Projects
    const { data: projects = [], isLoading } = useQuery({
        queryKey: ["client-projects"],
        queryFn: () => ClientService.getMyProjects()
    })

    // Sort clients by project count (descending) & filter by search query
    const sortedAndFilteredHerminaClients = React.useMemo(() => {
        const withCounts = herminaClients.map(client => {
            const count = typeof client.projects_count === 'number' && client.projects_count > 0
                ? client.projects_count
                : projects.filter(p => p.client_id === client.id).length
            return { client, count }
        })

        // Sort descending by project count, then alphabetically by name
        withCounts.sort((a, b) => {
            if (b.count !== a.count) {
                return b.count - a.count
            }
            return a.client.name.localeCompare(b.client.name)
        })

        if (!searchQuery.trim()) return withCounts

        const query = searchQuery.toLowerCase()
        return withCounts.filter(({ client }) =>
            client.name?.toLowerCase().includes(query) ||
            client.address?.toLowerCase().includes(query) ||
            client.director_name?.toLowerCase().includes(query)
        )
    }, [herminaClients, projects, searchQuery])

    // Save search & reset pagination to page 1 when search changes
    const handleSearchChange = (val: string) => {
        setSearchQuery(val)
        if (typeof window !== "undefined") {
            if (val) {
                sessionStorage.setItem("external_hermina_search", val)
            } else {
                sessionStorage.removeItem("external_hermina_search")
            }
        }
    }

    React.useEffect(() => {
        if (isInitializedRef.current) {
            setCurrentPage(1)
            if (typeof window !== "undefined") {
                sessionStorage.setItem("external_hermina_page", "1")
            }
        }
    }, [searchQuery])

    const totalItems = sortedAndFilteredHerminaClients.length
    const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))

    const visiblePageNumbers = React.useMemo(() => {
        if (totalPages <= 3) {
            return Array.from({ length: totalPages }, (_, i) => i + 1)
        }
        if (currentPage <= 2) {
            return [1, 2, 3]
        }
        if (currentPage >= totalPages - 1) {
            return [totalPages - 2, totalPages - 1, totalPages]
        }
        return [currentPage - 1, currentPage, currentPage + 1]
    }, [currentPage, totalPages])

    const paginatedClients = React.useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE
        return sortedAndFilteredHerminaClients.slice(start, start + ITEMS_PER_PAGE)
    }, [sortedAndFilteredHerminaClients, currentPage])

    // Filter projects based on selected client (if selected by Hermina Pusat user)
    const clientProjects = React.useMemo(() => {
        if (selectedClientId === null) return projects
        return projects.filter(p => p.client_id === selectedClientId)
    }, [projects, selectedClientId])

    // Filter projects based on SPK number search query
    const displayProjects = React.useMemo(() => {
        if (!spkSearchQuery.trim()) return clientProjects
        const query = spkSearchQuery.trim().toLowerCase()
        return clientProjects.filter(p => p.nomor_spk?.toLowerCase().includes(query))
    }, [clientProjects, spkSearchQuery])

    const selectedClientObj = React.useMemo(() => {
        if (!selectedClientId) return null
        return herminaClients.find(c => c.id === selectedClientId)
    }, [herminaClients, selectedClientId])

    // Calculate Stats
    const activeProjects = clientProjects.filter(p => !['done', 'cancelled', 'deleted'].includes(p.status.toLowerCase())).length

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
        if (typeof window !== "undefined") {
            sessionStorage.setItem("external_hermina_page", page.toString())
        }
    }

    const handleSelectClient = (clientId: number) => {
        setSelectedClientId(clientId)
        if (typeof window !== "undefined") {
            sessionStorage.setItem("external_selected_client_id", clientId.toString())
        }
        router.replace(`/dashboard/external?client_id=${clientId}`, { scroll: false })
        setTimeout(() => {
            activeProjectRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
    }

    const handleResetFilter = () => {
        setSelectedClientId(null)
        if (typeof window !== "undefined") {
            sessionStorage.removeItem("external_selected_client_id")
        }
        router.replace('/dashboard/external', { scroll: false })
    }

    if (isLoading || (isHerminaPusat && isLoadingHermina)) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 1. Ticker */}
            {/* <div className="-mt-8 -mx-4 sm:-mx-6 lg:-mx-8 mb-8 sticky top-20 z-40">
                <ActivityTicker />
            </div> */}

            {/* 2. Welcome & Stats */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-neutral-200">
                <div className="space-y-2">
                    <h2 className="text-3xl font-light text-neutral-900 flex items-center gap-3">
                        Good Afternoon, <span className="font-bold">{user?.name || 'Valued Client'}</span>
                        {isHerminaPusat && (
                            <Badge className="bg-emerald-600 text-white font-semibold hover:bg-emerald-700">
                                Hermina Pusat
                            </Badge>
                        )}
                    </h2>
                    <p className="text-neutral-500">
                        {isHerminaPusat
                            ? "Pantau dan kelola seluruh projek cabang RS Hermina secara terpusat."
                            : "Here is the latest progress on your interior projects."}
                    </p>
                </div>

                <div className="flex gap-4 sm:gap-8">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-neutral-900 tracking-tight">{activeProjects}</div>
                        <div className="text-xs text-neutral-400 uppercase tracking-widest font-medium mt-1">
                            {selectedClientId ? "Filtered Projects" : "Active Projects"}
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION: List Hermina (Displayed ONLY for role "Hermina Pusat", before Active Project) */}
            {isHerminaPusat && (
                <div className="space-y-4 pt-2">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                        <div>
                            <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                                <Hospital className="h-5 w-5 text-emerald-600" />
                                List Hermina
                                <Badge variant="outline" className="ml-2 bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">
                                    {herminaClients.length} Cabang
                                </Badge>
                            </h3>
                            <p className="text-xs text-neutral-500 mt-1">
                                Klik <span className="font-semibold text-neutral-700">"Lihat Projek"</span> pada cabang untuk menampilkan projek di section Active Project.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {/* Search Input */}
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <Input
                                    type="text"
                                    placeholder="Cari cabang Hermina..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="pl-9 pr-8 h-9 text-xs border-neutral-200 focus-visible:ring-emerald-500 rounded-lg"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => handleSearchChange("")}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {selectedClientId && (
                                <Button
                                    onClick={handleResetFilter}
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-medium"
                                >
                                    <X className="w-3.5 h-3.5 mr-1" />
                                    Tampilkan Semua Projek
                                </Button>
                            )}
                        </div>
                    </div>

                    {sortedAndFilteredHerminaClients.length === 0 ? (
                        <div className="text-center py-10 bg-neutral-50 rounded-xl border border-dashed text-neutral-400 text-sm">
                            {searchQuery ? `Tidak ada cabang Hermina sesuai pencarian "${searchQuery}".` : "Tidak ada data cabang Hermina ditemukan."}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {paginatedClients.map(({ client, count }) => {
                                    const isSelected = selectedClientId === client.id

                                    return (
                                        <div
                                            key={client.id}
                                            className={`group relative rounded-xl border p-4 transition-all duration-200 flex flex-col justify-between ${
                                                isSelected
                                                    ? "border-orange-500 bg-orange-50/30 shadow-md ring-2 ring-orange-500/20"
                                                    : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm"
                                            }`}
                                        >
                                            <div className="space-y-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors shrink-0">
                                                        <Building2 className="w-5 h-5" />
                                                    </div>
                                                    <Badge
                                                        variant="secondary"
                                                        className={`text-[10px] font-bold ${
                                                            isSelected
                                                                ? "bg-orange-600 text-white"
                                                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                        }`}
                                                    >
                                                        {count} Projek
                                                    </Badge>
                                                </div>

                                                <div>
                                                    <h4 className="font-bold text-neutral-900 text-base leading-tight group-hover:text-emerald-700 transition-colors line-clamp-1">
                                                        {client.name}
                                                    </h4>
                                                    {client.address && (
                                                        <p className="text-xs text-neutral-500 line-clamp-2 mt-1 flex items-start gap-1">
                                                            <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                                                            <span>{client.address}</span>
                                                        </p>
                                                    )}
                                                </div>

                                                {(client.director_name || client.general_affair_name) && (
                                                    <div className="pt-2 border-t border-neutral-100 space-y-1 text-[11px] text-neutral-600">
                                                        {client.director_name && (
                                                            <div className="truncate flex items-center gap-1">
                                                                <User className="w-3 h-3 text-neutral-400 shrink-0" />
                                                                <span className="truncate">Dir: {client.director_name}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-4 mt-3">
                                                <Button
                                                    onClick={() => handleSelectClient(client.id)}
                                                    variant={isSelected ? "default" : "outline"}
                                                    size="sm"
                                                    className={`w-full text-xs font-semibold h-9 ${
                                                        isSelected
                                                            ? "bg-orange-600 hover:bg-orange-700 text-white"
                                                            : "border-neutral-300 text-neutral-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                                                    }`}
                                                >
                                                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                                                    {isSelected ? "Sedang Dilihat" : "Lihat Projek"}
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-neutral-500">
                                    <div>
                                        Menampilkan <span className="font-semibold text-neutral-800">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="font-semibold text-neutral-800">{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}</span> dari <span className="font-semibold text-neutral-800">{totalItems}</span> cabang
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1}
                                            className="h-8 px-2.5 text-xs border-neutral-200"
                                        >
                                            <ChevronLeft className="w-4 h-4 mr-1" />
                                            Prev
                                        </Button>

                                        <div className="flex items-center gap-1 px-2">
                                            {visiblePageNumbers.map(page => (
                                                <button
                                                    key={page}
                                                    onClick={() => handlePageChange(page)}
                                                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                                                        currentPage === page
                                                            ? "bg-emerald-600 text-white font-bold"
                                                            : "hover:bg-neutral-100 text-neutral-600"
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                            disabled={currentPage === totalPages}
                                            className="h-8 px-2.5 text-xs border-neutral-200"
                                        >
                                            Next
                                            <ChevronRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* SECTION: Active Project */}
            <div ref={activeProjectRef} className="pt-2 scroll-mt-24">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                            Active Project
                            <Badge variant="outline" className="ml-2 bg-orange-50 text-orange-700 border-none">
                                {activeProjects} Ongoing
                            </Badge>
                        </h3>
                        {selectedClientObj && (
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-neutral-500">Menampilkan projek untuk:</span>
                                <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs font-semibold flex items-center gap-1">
                                    <Building2 className="w-3 h-3" />
                                    {selectedClientObj.name}
                                </Badge>
                                <button
                                    onClick={handleResetFilter}
                                    className="text-xs text-neutral-400 hover:text-neutral-700 underline ml-1"
                                >
                                    Tampilkan Semua
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Search Input by SPK Number placed on the right */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <Input
                            type="text"
                            placeholder="Cari nomor SPK..."
                            value={spkSearchQuery}
                            onChange={(e) => setSpkSearchQuery(e.target.value)}
                            className="pl-9 pr-8 h-9 text-xs border-neutral-200 focus-visible:ring-orange-500 rounded-lg"
                        />
                        {spkSearchQuery && (
                            <button
                                onClick={() => setSpkSearchQuery("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                aria-label="Clear SPK search"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {displayProjects.length === 0 ? (
                    <div className="text-center py-12 bg-neutral-50 rounded-xl border-dashed border-2 border-neutral-200">
                        <p className="text-neutral-400 text-sm">
                            {spkSearchQuery
                                ? `Tidak ada projek dengan nomor SPK "${spkSearchQuery}".`
                                : selectedClientObj
                                ? `Tidak ada projek aktif ditemukan untuk ${selectedClientObj.name}.`
                                : "No active projects found."}
                        </p>
                        {spkSearchQuery ? (
                            <Button
                                variant="link"
                                onClick={() => setSpkSearchQuery("")}
                                className="mt-2 text-xs text-orange-600"
                            >
                                Hapus pencarian SPK
                            </Button>
                        ) : selectedClientObj ? (
                            <Button
                                variant="link"
                                onClick={handleResetFilter}
                                className="mt-2 text-xs text-orange-600"
                            >
                                Lihat semua projek cabang Hermina
                            </Button>
                        ) : null}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {displayProjects.map(project => (
                            <ClientProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

