"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ShoppingBag, ArrowRight, FileText } from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

export default function OrderSuccessPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const orderId = searchParams.get("orderId")

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] py-12 px-4 animate-in zoom-in-95 duration-500">
            <div className="text-center space-y-6 max-w-md w-full">
                {/* Success Icon */}
                <div className="mx-auto h-24 w-24 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Order Received!</h1>
                    <p className="text-neutral-500">
                        Your request has been successfully submitted. We will process your quotation immediately.
                    </p>
                </div>

                <Card className="bg-neutral-50 border-dashed border-neutral-200">
                    <CardContent className="p-6">
                        <div className="text-sm font-medium text-neutral-500 mb-1 uppercase tracking-wider">Order Reference</div>
                        <div className="text-2xl font-bold family-mono text-neutral-900">
                            {orderId ? `REQ-${orderId.toString().padStart(4, '0')}` : 'PENDING'}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-3 pt-4">
                    {orderId && (
                        <Button
                            className="w-full bg-neutral-900 hover:bg-neutral-800 h-12"
                            onClick={() => router.push(`/dashboard/external/projects/${orderId}`)}
                        >
                            <FileText className="mr-2 h-4 w-4" /> Track Order Status
                        </Button>
                    )}
                    <Link href="/dashboard/external/mdl" className="w-full">
                        <Button variant="outline" className="w-full h-12">
                            <ShoppingBag className="mr-2 h-4 w-4" /> Continue Shopping
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
