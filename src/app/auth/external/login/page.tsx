import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { UserAuthForm } from "@/features/auth/components/user-auth-form"

export const metadata: Metadata = {
    title: "Customer Login | DPSA Customer Portal",
    description: "Login page for DPSA Customers.",
}

export default function ExternalLoginPage() {
    return (
        // Note: Saya menghapus 'grid' karena konflik dengan flex-col, cukup pakai flex saja untuk centering
        <div className="relative min-h-screen flex flex-col items-center justify-center bg-slate-50">

            {/* Decorative elements */}
            <div className="absolute inset-0 -z-10 h-full w-full bg-[#f8fafc] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"></div>

            <div className="relative z-20 flex w-full flex-col justify-center items-center p-4 lg:p-8">

                {/* PERUBAHAN DISINI: max-w-[450px] diganti jadi max-w-2xl (lebih lebar) */}
                <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">

                    {/* Header Stripe */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600"></div>

                    <div className="p-8 space-y-8">
                        {/* Branding Section */}
                        <div className="flex flex-col space-y-2 text-center">
                            {/* ... (kode logo tetap sama) ... */}
                            <div className="flex justify-center mb-6">
                                <div className="bg-blue-50 p-3 rounded-full">
                                    <Image src="/Logo.png" alt="DPSA Logo" width={80} height={80} className="object-contain" priority />
                                </div>
                            </div>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase font-sans">
                                CUSTOMER PORTAL
                            </h1>
                            <p className="text-xs text-slate-500 tracking-widest uppercase">
                                Real-time Project Tracking
                            </p>
                        </div>

                        {/* Form Section */}
                        <div className="border-t border-slate-100 pt-6 px-4 md:px-12">
                            {/* Tambahan px-12 agar form tidak terlalu melebar ke samping jika cardnya lebar */}
                            <UserAuthForm onSuccessRedirect="/dashboard/external" className="auth-form-blue" />
                        </div>

                        {/* Footer - Tetap sama */}
                        <p className="text-center text-xs text-slate-500">
                            Received an invitation?{" "}
                            <Link href="/auth/external/register" className="underline underline-offset-4 hover:text-blue-600 transition-colors">
                                Activate Account
                            </Link>
                        </p>
                        <p className="text-center text-xs text-slate-400 mt-4">
                            Are you a staff member?{" "}
                            <Link href="/auth/internal/login" className="underline underline-offset-4 hover:text-slate-600 transition-colors">
                                Staff Login
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center text-xs text-slate-400">
                    &copy; 2026 DPSA Group. Customer Portal. <br />
                    Secure Access.
                </div>

            </div>
        </div>
    )
}