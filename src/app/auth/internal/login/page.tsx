import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"

import { UserAuthForm } from "@/features/auth/components/user-auth-form"
// import { cn } from "@/lib/utils"

export const metadata: Metadata = {
    title: "Staff Login | DPSA Internal System",
    description: "Login page for DPSA internal staff.",
}

export default function StaffLoginPage() {
    return (
        <>
            {/* Menggunakan Flexbox standard untuk centering, menghapus 'grid' yang tidak perlu */}
            <div className="relative min-h-screen flex flex-col items-center justify-center bg-neutral-50/50">

                {/* Decorative elements for Light Theme */}
                <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>

                <div className="relative z-20 flex w-full flex-col justify-center items-center p-4 lg:p-8">

                    {/* PERUBAHAN UTAMA: max-w-[450px] diubah menjadi max-w-2xl */}
                    <div className="w-full max-w-2xl bg-white border border-neutral-200 rounded-xl shadow-xl overflow-hidden">

                        {/* Header Stripe (Identity) */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600"></div>

                        <div className="p-8 space-y-8">
                            {/* Branding Section */}
                            <div className="flex flex-col space-y-2 text-center">
                                <div className="flex justify-center mb-6">
                                    <div className="relative h-24 w-auto aspect-square flex items-center justify-center">
                                        <Image
                                            src="/Logo.png"
                                            alt="DPSA Logo"
                                            width={96}
                                            height={96}
                                            className="object-contain"
                                            priority
                                        />
                                    </div>
                                </div>
                                <h1 className="text-xl font-bold tracking-wider text-neutral-900 uppercase font-sans">
                                    PT DHARMA PUTRA <br /><span className="text-orange-600">SEJAHTERA ABADI</span>
                                </h1>
                                <p className="text-xs text-neutral-500 tracking-widest uppercase">
                                    Internal Operations System
                                </p>
                            </div>

                            {/* Form Section */}
                            {/* Tambahan padding horizontal (px-4 md:px-12) agar form tidak terlalu lebar ke samping */}
                            <div className="border-t border-neutral-100 pt-6 px-4 md:px-12">
                                <UserAuthForm onSuccessRedirect="/dashboard" />
                            </div>

                            {/* Footer */}
                            <p className="text-center text-xs text-neutral-500">
                                Are you a new staff member?{" "}
                                <Link
                                    href="/auth/internal/register"
                                    className="underline underline-offset-4 hover:text-orange-600 transition-colors"
                                >
                                    Register Account
                                </Link>
                            </p>
                            <p className="text-center text-xs text-neutral-400 mt-2">
                                Not a staff member?{" "}
                                <Link
                                    href="/auth/external/login"
                                    className="underline underline-offset-4 hover:text-orange-600 transition-colors"
                                >
                                    Customer Login
                                </Link>
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 text-center text-xs text-neutral-400">
                        &copy; 2026 DPSA Group. All rights reserved. <br />
                        Authorized Access Only.
                    </div>

                </div>
            </div>
        </>
    )
}