"use client"

import { SPHEditor } from "@/features/projects/components/sph/sph-editor"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function SPHBuilderPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const { user, hydrated } = useAuthStore()

    useEffect(() => {
        if (hydrated && user) {
            // If user is Client, they should NOT access this page
            if (user.role === 'Client') {
                router.replace('/dashboard/external')
            }
        }
    }, [user, hydrated, router])

    if (!hydrated) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-neutral-300" /></div>

    if (!user || user.role === 'Client') return null; // Prevent flash

    return (
        <div className="min-h-screen bg-neutral-50/50 flex flex-col font-sans">
            <div className="border-b border-neutral-200 bg-white sticky top-0 z-30">
                <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/dashboard/tracking/${params.id}?tab=commercial`} className="p-2 hover:bg-neutral-100 rounded-full text-neutral-500 transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-lg font-bold text-neutral-900 flex items-center gap-3">
                                SPH Builder
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-mono">DRAFT</Badge>
                            </h1>
                            <p className="text-xs text-neutral-500">Project #{params.id} • Quotation Editor</p>
                        </div>
                    </div>
                    <div className="text-sm text-neutral-400">
                        Auto-saved 2 mins ago
                    </div>
                </div>
            </div>

            <main className="flex-1 max-w-screen-2xl mx-auto w-full p-6">
                <SPHEditor />
            </main>
        </div>
    )
}
