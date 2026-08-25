"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "@/lib/auth-store"
import { ActivityTicker } from "@/features/dashboard/components/client/activity-ticker"
import { ClientProjectCard } from "@/features/dashboard/components/client/project-card"
import { ClientService, HerminaClient } from "@/features/dashboard/services/client-service"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Building2, Eye, MapPin, User, X, Hospital } from "lucide-react"

export default function ClientDashboardPage() {
    const { user } = useAuthStore()
    const [selectedClientId, setSelectedClientId] = React.useState<number | null>(null)
    const activeProjectRef = React.useRef<HTMLDivElement>(null)

    // Check if user has "Hermina Pusat" role
    const userRoles = [
        user?.role,
        ...(user?.roles_list || []),
        ...(user?.roles?.map(r => typeof r === 'string' ? r : r.name) || [])
    ].filter(Boolean) as string[]

    const isHerminaPusat = userRoles.some(r => r?.toLowerCase().includes('hermina pusat')) || user?.role_id === 15

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

    // Filter projects based on selected client (if selected by Hermina Pusat user)
    const displayProjects = React.useMemo(() => {
        if (selectedClientId === null) return projects
        return projects.filter(p => p.client_id === selectedClientId)
    }, [projects, selectedClientId])

    const selectedClientObj = React.useMemo(() => {
        if (!selectedClientId) return null
        return herminaClients.find(c => c.id === selectedClientId)
    }, [herminaClients, selectedClientId])

    // Calculate Stats
    const activeProjects = displayProjects.filter(p => !['done', 'cancelled', 'deleted'].includes(p.status.toLowerCase())).length

    const handleSelectClient = (clientId: number) => {
        setSelectedClientId(clientId)
        setTimeout(() => {
            activeProjectRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
    }

    const handleResetFilter = () => {
        setSelectedClientId(null)
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
            <div className="-mt-8 -mx-4 sm:-mx-6 lg:-mx-8 mb-8 sticky top-20 z-40">
                <ActivityTicker />
            </div>

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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
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

                        {selectedClientId && (
                            <Button
                                onClick={handleResetFilter}
                                variant="ghost"
                                size="sm"
                                className="text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 self-start sm:self-auto font-medium"
                            >
                                <X className="w-3.5 h-3.5 mr-1" />
                                Tampilkan Semua Projek
                            </Button>
                        )}
                    </div>

                    {herminaClients.length === 0 ? (
                        <div className="text-center py-10 bg-neutral-50 rounded-xl border border-dashed text-neutral-400 text-sm">
                            Tidak ada data cabang Hermina ditemukan.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {herminaClients.map((client) => {
                                const isSelected = selectedClientId === client.id
                                const clientProjects = projects.filter(p => p.client_id === client.id)

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
                                                            : "bg-neutral-100 text-neutral-600"
                                                    }`}
                                                >
                                                    {clientProjects.length} Projek
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
                    )}
                </div>
            )}

            {/* SECTION: Active Project */}
            <div ref={activeProjectRef} className="pt-2 scroll-mt-24">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
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
                    {/* <span className="text-sm text-neutral-400">Sorted by Priority</span> */}
                </div>

                {displayProjects.length === 0 ? (
                    <div className="text-center py-12 bg-neutral-50 rounded-xl border-dashed border-2 border-neutral-200">
                        <p className="text-neutral-400">
                            {selectedClientObj
                                ? `Tidak ada projek aktif ditemukan untuk ${selectedClientObj.name}.`
                                : "No active projects found."}
                        </p>
                        {selectedClientObj && (
                            <Button
                                variant="link"
                                onClick={handleResetFilter}
                                className="mt-2 text-xs text-orange-600"
                            >
                                Lihat semua projek cabang Hermina
                            </Button>
                        )}
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
