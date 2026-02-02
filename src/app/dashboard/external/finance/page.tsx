"use client"

import { useQuery } from "@tanstack/react-query"
import { ClientService } from "@/features/dashboard/services/client-service"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, FileText, TrendingUp, CreditCard, AlertCircle } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

export default function FinanceOverviewPage() {
    const { data, isLoading } = useQuery({
        queryKey: ["client-finance"],
        queryFn: ClientService.getFinanceSummary
    })

    if (isLoading) {
        return <div className="p-8"><Skeleton className="h-96 w-full rounded-xl" /></div>
    }

    const { summary, invoices } = data || { summary: {}, invoices: [] }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Finance Overview</h1>
                    <p className="text-muted-foreground">Track your project expenses, contracting values, and invoice history.</p>
                </div>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Download Statement
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-neutral-900 text-white border-neutral-800">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-neutral-400">Total Contract Value</CardDescription>
                        <CardTitle className="text-3xl font-medium">Rp {summary.total_contract_value?.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm text-neutral-400">
                            <TrendingUp className="h-4 w-4 text-emerald-400" />
                            <span>Across all active projects</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Paid</CardDescription>
                        <CardTitle className="text-3xl font-medium text-emerald-600">Rp {summary.total_paid?.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                            <CreditCard className="h-4 w-4 text-neutral-400" />
                            <span>{((summary.total_paid || 0) / (summary.total_contract_value || 1) * 100).toFixed(1)}% of total value</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Outstanding (Unpaid)</CardDescription>
                        <CardTitle className="text-3xl font-medium text-orange-600">Rp {summary.total_outstanding?.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                            <AlertCircle className="h-4 w-4 text-orange-400" />
                            <span>Next Due: {summary.upcoming_due_date}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Invoice History */}
            <Card>
                <CardHeader>
                    <CardTitle>Invoice History</CardTitle>
                    <CardDescription>A complete list of issued invoices.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-neutral-200 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-neutral-50 text-neutral-500 font-medium">
                                <tr>
                                    <th className="px-4 py-3">Invoice #</th>
                                    <th className="px-4 py-3">Project</th>
                                    <th className="px-4 py-3">Due Date</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Amount</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 bg-white">
                                {invoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-neutral-400">No invoices found.</td>
                                    </tr>
                                ) : (
                                    invoices.map((inv: any) => (
                                        <tr key={inv.id} className="hover:bg-neutral-50 transition-colors">
                                            <td className="px-4 py-4 font-medium">{inv.invoice_number}</td>
                                            <td className="px-4 py-4 max-w-[200px] truncate" title={inv.project_name}>{inv.project_name}</td>
                                            <td className="px-4 py-4 text-neutral-500">{inv.due_date}</td>
                                            <td className="px-4 py-4">
                                                <Badge
                                                    variant="secondary"
                                                    className={`
                                                        ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : ''}
                                                        ${inv.status === 'unpaid' ? 'bg-blue-100 text-blue-700' : ''}
                                                        ${inv.status === 'overdue' ? 'bg-red-100 text-red-700' : ''}
                                                    `}
                                                >
                                                    {inv.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-4 text-right font-medium">
                                                Rp {inv.amount.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <Button variant="ghost" size="sm" className="h-8">
                                                    <FileText className="h-4 w-4 mr-2" /> Detail
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
