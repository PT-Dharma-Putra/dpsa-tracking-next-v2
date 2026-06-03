"use client"

import { useQuery } from "@tanstack/react-query"
import { ClientService } from "@/features/dashboard/services/client-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, FileText, ArrowRight, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

export function ActionCenter() {
    const { data: actions, isLoading } = useQuery({
        queryKey: ["client-actions"],
        queryFn: ClientService.getActionItems
    })

    // if (isLoading) {
    //     return <ActionCenterSkeleton />
    // }

    if (!actions || actions.length === 0) {
        return (
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
                <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-green-900">All Caught Up!</h3>
                            <p className="text-sm text-green-700">No pending actions required from your side.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-orange-100 shadow-sm overflow-hidden">
            <CardHeader className="bg-orange-50/50 pb-4 border-b border-orange-100/50">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg text-orange-900">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                        Action Center
                    </CardTitle>
                    <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full">
                        {actions.length} Pending
                    </span>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-neutral-100">
                    {actions.map((action) => (
                        <div key={action.id} className="p-4 hover:bg-neutral-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex gap-3">
                                <div className={`shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${action.type === 'invoice' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                    }`}>
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm text-neutral-900">{action.title}</h4>
                                    <p className="text-xs text-neutral-500">{action.subtitle} • {action.projectName}</p>
                                </div>
                            </div>
                            <Link href={action.cta_link}>
                                <Button size="sm" className={`${action.urgent ? 'bg-orange-600 hover:bg-orange-700' : 'bg-neutral-900 hover:bg-neutral-800'
                                    } w-full sm:w-auto`}>
                                    {action.cta_label}
                                    <ArrowRight className="ml-2 h-3 w-3" />
                                </Button>
                            </Link>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

function ActionCenterSkeleton() {
    return (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-6 w-32" />
            </div>
            {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-full">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </div>
                    <Skeleton className="h-9 w-24" />
                </div>
            ))}
        </div>
    )
}
