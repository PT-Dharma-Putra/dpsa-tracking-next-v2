import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"

import { CustomerRegisterForm } from "@/features/auth/components/customer-register-form"
import { Suspense } from "react"

export const metadata: Metadata = {
    title: "Customer Register | DPSA Customer Portal",
    description: "Register for DPSA Customer Portal access.",
}

export default function CustomerRegisterPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className="relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:px-0 bg-slate-50">

                {/* Decorative elements for Customer Theme (Blue) */}
                <div className="absolute inset-0 -z-10 h-full w-full bg-[#f8fafc] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"></div>

                <div className="relative z-20 flex w-full flex-col justify-center items-center p-4 lg:p-8">

                    <div className="w-full max-w-[500px] bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">

                        {/* Header Stripe (Customer Identity - Blue) */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600"></div>

                        <div className="p-8 space-y-8">
                            {/* Branding Section */}
                            <div className="flex flex-col space-y-2 text-center">
                                <div className="flex justify-center mb-4">
                                    <div className="bg-blue-50 p-3 rounded-full">
                                        <Image
                                            src="/Logo.png"
                                            alt="DPSA Logo"
                                            width={64}
                                            height={64}
                                            className="object-contain"
                                            priority
                                        />
                                    </div>
                                </div>
                                <h1 className="text-xl font-bold tracking-tight text-slate-900 font-sans">
                                    Customer Registration
                                </h1>
                                <p className="text-sm text-slate-500">
                                    Join the DPSA Electronic Tracking System
                                </p>
                            </div>

                            {/* Form Section */}
                            <div className="pt-2">
                                <CustomerRegisterForm />
                            </div>

                            {/* Footer */}
                            <p className="text-center text-xs text-slate-500">
                                Already have an account?{" "}
                                <Link
                                    href="/auth/external/login"
                                    className="underline underline-offset-4 hover:text-blue-600 transition-colors"
                                >
                                    Login to Portal
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
        </Suspense>
    )
}
