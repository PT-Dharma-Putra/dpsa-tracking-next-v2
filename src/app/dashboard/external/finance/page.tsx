"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "@/lib/auth-store"
import { format } from "date-fns"
import { ClientService } from "@/features/dashboard/services/client-service"
import { penagihanService, Penagihan } from "@/features/projects/services/penagihan-service"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, FileText, TrendingUp, CreditCard, AlertCircle, Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const storageBase = (
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
).replace('/api', '');

const formatRupiah = (val: string | number | null | undefined) => {
    if (val === null || val === undefined || val === '') return '-';
    const num = typeof val === 'number' ? val : parseFloat(val.toString());
    if (isNaN(num)) return String(val);
    return `Rp ${num.toLocaleString('id-ID')}`;
};

export default function FinanceOverviewPage() {
    const user = useAuthStore((s) => s.user);

    const { data, isLoading } = useQuery({
        queryKey: ["client-finance"],
        queryFn: ClientService.getFinanceSummary
    })

    const { data: penagihanList = [], isLoading: isLoadingPenagihan } = useQuery({
        queryKey: ["penagihan-all"],
        queryFn: () => penagihanService.getAllPenagihan()
    })

    const filteredPenagihanList = React.useMemo(() => {
        if (!user) return penagihanList;

        const userClientId = user.client_id;

        return penagihanList.filter((inv: any) => {
            // Relation path: penagihans -> project -> spk -> penerbit_id
            const projectSpk = inv.project?.spk;
            const penerbitId = Array.isArray(projectSpk)
                ? projectSpk[0]?.penerbit_id
                : projectSpk?.penerbit_id;

            // If relation data is not loaded or missing, fallback to include it
            if (penerbitId === undefined || penerbitId === null) {
                return true;
            }

            // Match penerbit_id from SPK table directly with user.client_id
            if (!userClientId) return true;
            return String(penerbitId) === String(userClientId);
        });
    }, [penagihanList, user]);

    if (isLoading) {
        return <div className="p-8"><Skeleton className="h-96 w-full rounded-xl" /></div>
    }

    const summary: any = (data as any)?.summary || {};

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
                                    <th className="px-4 py-3">Nomor SPK</th>
                                    <th className="px-4 py-3">Project</th>
                                    <th className="px-4 py-3">Due Date</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Nominal Tagihan</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 bg-white">
                                {isLoadingPenagihan ? (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-neutral-400">
                                            <div className="flex items-center justify-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
                                                <span>Loading invoice data...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredPenagihanList.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-neutral-400">No invoices found.</td>
                                    </tr>
                                ) : (
                                    filteredPenagihanList.map((inv: Penagihan) => {
                                        const fileUrl = inv.file
                                            ? inv.file.startsWith('http')
                                                ? inv.file
                                                : `${storageBase}/storage/${inv.file}`
                                            : null;

                                        const noSpkStr =
                                            inv.project?.spk?.nomor_spk ||
                                            (inv as any).spk_number ||
                                            inv.project?.spk_number ||
                                            (inv as any).spk?.nomor_spk ||
                                            '-';

                                        const dueDateStr = inv.jatuh_tempo
                                            ? format(new Date(inv.jatuh_tempo), 'dd MMM yyyy')
                                            : (inv as any).due_date || '-';

                                        const statusStr = String(inv.status || '');

                                        return (
                                            <tr key={inv.id} className="hover:bg-neutral-50 transition-colors">
                                                <td className="px-4 py-4 font-medium text-neutral-900">
                                                    {inv.nomor_invoice || '-'}
                                                </td>
                                                <td className="px-4 py-4 text-neutral-700">
                                                    {noSpkStr}
                                                </td>
                                                <td className="px-4 py-4 max-w-[200px] truncate text-neutral-700" title={inv.project?.name || (inv as any).project_name || '-'}>
                                                    {inv.project?.name || (inv as any).project_name || '-'}
                                                </td>
                                                <td className="px-4 py-4 text-neutral-500">
                                                    {dueDateStr}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Badge
                                                        variant="secondary"
                                                        className={cn(
                                                            "font-semibold text-xs",
                                                            (statusStr === 'Lunas' || statusStr === 'paid') && 'bg-emerald-100 text-emerald-700 border-emerald-200',
                                                            (statusStr === 'Sebagian Dibayar' || statusStr === 'unpaid') && 'bg-amber-100 text-amber-700 border-amber-200',
                                                            (statusStr === 'Belum Bayar' || statusStr === 'overdue') && 'bg-red-100 text-red-700 border-red-200'
                                                        )}
                                                    >
                                                        {inv.status || '-'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-4 text-right text-neutral-900 font-medium">
                                                    {formatRupiah(inv.nominal_penagihan)}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    {fileUrl ? (
                                                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50" asChild>
                                                            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                                                <FileText className="h-3.5 w-3.5" /> File
                                                            </a>
                                                        </Button>
                                                    ) : (
                                                        <span className="text-neutral-400 italic text-xs">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
