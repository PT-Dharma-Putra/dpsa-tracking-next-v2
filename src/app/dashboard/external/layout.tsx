"use client"

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, LogOut, LayoutDashboard, Settings, FileText, ShoppingBag, ShoppingCart, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ClientNotifications } from "@/features/dashboard/components/client/client-notifications";
import { useAuthStore } from "@/lib/auth-store";
import { useCartStore } from "@/features/shop/stores/cart-store";

export default function CustomerLayout({ children }: { children: ReactNode }) {
    const router = useRouter()
    const { token, hydrated, user, logout } = useAuthStore()
    const [isChecking, setIsChecking] = useState(true)

    const handleLogout = () => {
        logout()
        router.push("/auth/external/login")
    }

    useEffect(() => {
        if (!hydrated) return

        if (!token) {
            router.replace("/auth/external/login")
            return
        }

        // Check Role: Only Clients allowed
        if (user?.role !== 'Client') {
            // Staff should not be here
            router.replace("/dashboard")
            return
        }

        setIsChecking(false)
    }, [token, hydrated, user, router])

    if (!hydrated || isChecking) {
        return <div className="h-screen flex items-center justify-center bg-white text-neutral-400">Loading Customer Portal...</div>
    }

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col font-sans text-neutral-900">
            {/* === PREMIUM HEADER === */}
            <header className="bg-white border-b border-neutral-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    {/* Logo Section */}
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 text-white">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-neutral-950">DPSA <span className="text-orange-600">Client</span></h1>
                            <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">Executive Portal</p>
                        </div>
                    </div>

                    {/* Navigation (Desktop) */}
                    <nav className="hidden md:flex items-center gap-1 rounded-full bg-neutral-100/50 p-1 border border-neutral-200/50">
                        <NavLink href="/dashboard/external" active={false}>
                            <LayoutDashboard className="h-4 w-4 mr-2" />
                            Dashboard
                        </NavLink>
                        <NavLink href="/dashboard/external/projects" active={false}>
                            <FileText className="h-4 w-4 mr-2" />
                            My Projects
                        </NavLink>
                        <NavLink href="/dashboard/external/mdl" active={false}>
                            <ShoppingBag className="h-4 w-4 mr-2" />
                            Catalog
                        </NavLink>
                        <NavLink href="/dashboard/external/finance" active={false}>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Finance
                        </NavLink>
                    </nav>

                    {/* Cart Button */}
                    <CartButton />

                    {/* User Profile */}
                    <div className="flex items-center gap-2">
                        <ClientNotifications />
                        <div className="h-8 w-px bg-neutral-200 mx-2 hidden sm:block" />

                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-neutral-900 leading-none">{user?.name || 'Client'}</p>
                            <p className="text-xs text-neutral-500 mt-1">{user?.email || 'Executive Portal'}</p>
                        </div>
                        <Avatar className="h-10 w-10 border-2 border-orange-100 shadow-sm cursor-pointer hover:ring-2 hover:ring-orange-500 transition-all">
                            <AvatarImage src="https://github.com/shadcn.png" />
                            <AvatarFallback className="bg-orange-50 text-orange-600 font-bold">
                                {user?.name?.substring(0, 2).toUpperCase() || 'CL'}
                            </AvatarFallback>
                        </Avatar>
                        <Button variant="ghost" size="icon" onClick={handleLogout} className="text-neutral-400 hover:text-red-500 hover:bg-red-50 ml-1">
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </header>

            {/* === MAIN CONTENT === */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>

            {/* === FOOTER === */}
            <footer className="bg-white border-t border-neutral-200 py-8 mt-auto">
                <div className="max-w-7xl mx-auto px-4 text-center text-sm text-neutral-400">
                    <p>&copy; {new Date().getFullYear()} PT. Dharma Putra Interior. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

function NavLink({ href, children, active }: { href: string, children: ReactNode, active?: boolean }) {
    return (
        <Link href={href} className={`
            flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
            ${active
                ? "bg-white text-orange-600 shadow-sm border border-neutral-200/50"
                : "text-neutral-500 hover:text-neutral-900 hover:bg-white/50"}
        `}>
            {children}
        </Link>
    )
}

function CartButton() {
    // Prevent hydration mismatch
    const [mounted, setMounted] = useState(false);
    const totalItems = useCartStore((state) => state.getTotalItems());

    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return (
        <Link href="/dashboard/external/cart">
            <Button variant="ghost" size="icon" className="relative text-neutral-500 hover:text-orange-600">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-orange-600 text-[10px] font-bold text-white flex items-center justify-center border-2 border-white">
                        {totalItems}
                    </span>
                )}
            </Button>
        </Link>
    )
}

