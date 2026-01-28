import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"

import { UserRegisterForm } from "@/features/auth/components/user-register-form"
// import { cn } from "@/lib/utils"

export const metadata: Metadata = {
    title: "Staff Registration | DPSA Internal System",
    description: "Create a new staff account.",
}

export default function StaffRegisterPage() {
    return (
        <>
            <div className="relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:px-0 bg-neutral-50/50">

                {/* Decorative elements for Light Theme */}
                <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>

                <div className="relative z-20 flex w-full flex-col justify-center items-center p-4 lg:p-8">

                    <div className="w-full max-w-[550px] bg-white border border-neutral-200 rounded-xl shadow-xl overflow-hidden">

                        {/* Header Stripe (Identity) */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600"></div>

                        <div className="p-8 space-y-8">
                            {/* Branding Section */}
                            <div className="flex flex-col space-y-2 text-center">
                                <div className="flex justify-center mb-6">
                                    <div className="relative h-20 w-auto aspect-square flex items-center justify-center">
                                        <Image
                                            src="/Logo.png"
                                            alt="DPSA Logo"
                                            width={80}
                                            height={80}
                                            className="object-contain"
                                            priority
                                        />
                                    </div>
                                </div>
                                <h1 className="text-xl font-bold tracking-wider text-neutral-900 uppercase font-sans">
                                    New Staff Registration
                                </h1>
                                <p className="text-xs text-neutral-500">
                                    Join the digital workforce of PT Dharma Putra Sejahtera Abadi
                                </p>
                            </div>

                            {/* Form Section */}
                            <div className="border-t border-neutral-100 pt-6">
                                <UserRegisterForm />
                            </div>

                            {/* Footer */}
                            <p className="text-center text-xs text-neutral-500">
                                Already have an account?{" "}
                                <Link
                                    href="/auth/internal/login"
                                    className="underline underline-offset-4 hover:text-orange-600 transition-colors"
                                >
                                    Back to Login
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
