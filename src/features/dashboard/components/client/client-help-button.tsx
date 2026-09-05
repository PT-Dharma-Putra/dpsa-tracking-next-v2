"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { LifeBuoy, AlertCircle, Sparkles, ClipboardList, ChevronUp } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ClientTaskDialog } from "./client-task-dialog"

export function ClientHelpButton() {
    const router = useRouter()
    const [dialogOpen, setDialogOpen] = React.useState(false)
    const [dialogTipe, setDialogTipe] = React.useState<"Request Fitur" | "Lapor Kendala">("Lapor Kendala")

    const handleOpenModal = (tipe: "Request Fitur" | "Lapor Kendala") => {
        setDialogTipe(tipe)
        setDialogOpen(true)
    }

    return (
        <>
            <div className="fixed bottom-6 right-6 z-40">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="group flex items-center gap-2 bg-neutral-900 hover:bg-neutral-950 text-white px-4 py-3 rounded-full shadow-xl hover:shadow-2xl hover:shadow-neutral-900/20 border border-neutral-700/60 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                            aria-label="Pusat Bantuan & Lapor Kendala"
                        >
                            <div className="relative">
                                <LifeBuoy className="h-5 w-5 text-orange-400 group-hover:rotate-45 transition-transform duration-300" />
                                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                                </span>
                            </div>
                            <span className="text-xs font-bold tracking-wide pr-1">Bantuan & Request</span>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="top" className="w-64 p-2 rounded-2xl shadow-2xl border-neutral-200 mb-2">
                        <DropdownMenuLabel className="px-3 py-2">
                            <p className="text-xs font-bold text-neutral-900 leading-tight">Pusat Dukungan IT</p>
                            <p className="text-[11px] text-neutral-500 font-normal mt-0.5">Lapor kendala sistem atau ajukan fitur baru</p>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            onClick={() => handleOpenModal("Lapor Kendala")}
                            className="flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer hover:bg-red-50 focus:bg-red-50 transition-colors"
                        >
                            <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600 shrink-0 mt-0.5">
                                <AlertCircle className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-neutral-800">Lapor Kendala / Bug</p>
                                <p className="text-[10px] text-neutral-500">Ada kendala, data tidak sesuai, atau error</p>
                            </div>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() => handleOpenModal("Request Fitur")}
                            className="flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer hover:bg-purple-50 focus:bg-purple-50 transition-colors"
                        >
                            <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 shrink-0 mt-0.5">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-neutral-800">Request Fitur Baru</p>
                                <p className="text-[10px] text-neutral-500">Usulkan ide atau penambahan fitur sistem</p>
                            </div>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            onClick={() => router.push("/dashboard/external/requests")}
                            className="flex items-center gap-2 p-2.5 rounded-xl cursor-pointer text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                        >
                            <ClipboardList className="h-4 w-4 text-neutral-400" />
                            <span>Lihat Riwayat Tiket Saya</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <ClientTaskDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                defaultTipe={dialogTipe}
            />
        </>
    )
}
