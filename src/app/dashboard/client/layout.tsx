import { ReactNode } from "react";
import Link from "next/link";
import { Building2, LogOut, LayoutDashboard, Settings, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function CustomerLayout({ children }: { children: ReactNode }) {
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
                        <NavLink href="/dashboard/client" active>
                            <LayoutDashboard className="h-4 w-4 mr-2" />
                            Dashboard
                        </NavLink>
                        <NavLink href="/dashboard/client/projects">
                            <FileText className="h-4 w-4 mr-2" />
                            My Projects
                        </NavLink>
                    </nav>

                    {/* User Profile */}
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-neutral-900 leading-none">Dr. Client</p>
                            <p className="text-xs text-neutral-500 mt-1">RS Hermina Kemayoran</p>
                        </div>
                        <Avatar className="h-10 w-10 border-2 border-orange-100 shadow-sm cursor-pointer hover:ring-2 hover:ring-orange-500 transition-all">
                            <AvatarImage src="https://github.com/shadcn.png" />
                            <AvatarFallback className="bg-orange-50 text-orange-600 font-bold">DR</AvatarFallback>
                        </Avatar>
                        <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-red-500 hover:bg-red-50 ml-1">
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
