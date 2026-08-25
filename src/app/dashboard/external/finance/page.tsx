"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "@/lib/auth-store"
import { format, differenceInDays, startOfDay } from "date-fns"
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

const getUmurTagihanInfo = (inv: Penagihan) => {
    const statusStr = String(inv.status || '').toLowerCase();
    const isLunas = statusStr === 'lunas' || statusStr === 'paid';

    const baseDateStr = inv.tanggal_invoice || inv.created_at || inv.jatuh_tempo;
    if (!baseDateStr) return { text: '-', colorClass: 'text-neutral-400' };

    const baseDate = startOfDay(new Date(baseDateStr));
    if (isNaN(baseDate.getTime())) return { text: '-', colorClass: 'text-neutral-400' };

    let targetDate = startOfDay(new Date());
    if (isLunas && inv.tanggal_dibayar) {
        const paidDate = startOfDay(new Date(inv.tanggal_dibayar));
        if (!isNaN(paidDate.getTime())) {
            targetDate = paidDate;
        }
    }

    const diffDays = Math.max(0, differenceInDays(targetDate, baseDate));
    const text = `${diffDays} Hari`;

    if (isLunas) {
        return { text, colorClass: 'text-neutral-500 text-xs' };
    }

    if (diffDays <= 30) {
        return { text, colorClass: 'text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs inline-block' };
    } else if (diffDays <= 60) {
        return { text, colorClass: 'text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs inline-block' };
    } else {
        return { text, colorClass: 'text-red-700 font-semibold bg-red-50 px-2 py-0.5 rounded border border-red-200 text-xs inline-block' };
    }
};

export default function FinanceOverviewPage() {
    const user = useAuthStore((s) => s.user);

    const isHerminaPusat = React.useMemo(() => {
        if (!user) return false;
        const userRoles = [
            user.role,
            ...(user.roles_list || []),
            ...(user.roles?.map((r: any) => typeof r === 'string' ? r : r.name) || [])
        ].filter(Boolean) as string[];

        return (
            userRoles.some(r => r?.toLowerCase().includes('hermina pusat')) ||
            user.role_id === 19 ||
            (Array.isArray(user.role_ids) && user.role_ids.includes(19))
        );
    }, [user]);

    const { data, isLoading } = useQuery({
        queryKey: ["client-finance"],
        queryFn: ClientService.getFinanceSummary
    })

    const { data: penagihanList = [], isLoading: isLoadingPenagihan } = useQuery({
        queryKey: ["penagihan-all", user?.client_id, isHerminaPusat],
        queryFn: () => penagihanService.getAllPenagihan(isHerminaPusat ? undefined : (user?.client_id ?? undefined))
    })

    const filteredPenagihanList = React.useMemo(() => {
        if (!user) return penagihanList;

        if (isHerminaPusat) {
            // Hermina Pusat sees all invoices belonging to Hermina clients
            return penagihanList.filter((inv: any) => {
                const projectClient = inv.project?.client;
                const projectSpk = inv.project?.spk;
                const penerbit = Array.isArray(projectSpk)
                    ? projectSpk[0]?.penerbit
                    : projectSpk?.penerbit;

                const isProjectClientHermina = projectClient?.hermina === 1 || projectClient?.hermina === true || (projectClient?.name && String(projectClient.name).toLowerCase().includes('hermina'));
                const isPenerbitHermina = penerbit?.hermina === 1 || penerbit?.hermina === true || (penerbit?.name && String(penerbit.name).toLowerCase().includes('hermina'));

                if (projectClient || penerbit) {
                    return Boolean(isProjectClientHermina || isPenerbitHermina);
                }

                return true;
            });
        }

        const userClientId = user.client_id;
        if (!userClientId) return penagihanList;

        return penagihanList.filter((inv: any) => {
            // Relation path: penagihans -> project -> spk -> penerbit_id
            const projectSpk = inv.project?.spk;
            const penerbitId = Array.isArray(projectSpk)
                ? projectSpk[0]?.penerbit_id
                : projectSpk?.penerbit_id;

            const projectClientId = inv.project?.client_id;

            if (penerbitId === undefined && projectClientId === undefined) {
                return true;
            }

            return (
                (penerbitId !== undefined && penerbitId !== null && String(penerbitId) === String(userClientId)) ||
                (projectClientId !== undefined && projectClientId !== null && String(projectClientId) === String(userClientId))
            );
        });
    }, [penagihanList, user, isHerminaPusat]);

    const totalTagihan = React.useMemo(() => {
        return filteredPenagihanList.reduce((acc: number, inv: any) => {
            const val = typeof inv.nominal_penagihan === 'number'
                ? inv.nominal_penagihan
                : parseFloat(inv.nominal_penagihan || '0');
            return acc + (isNaN(val) ? 0 : val);
        }, 0);
    }, [filteredPenagihanList]);

    const totalTerbayar = React.useMemo(() => {
        return filteredPenagihanList.reduce((acc: number, inv: any) => {
            const status = String(inv.status || '').toLowerCase();
            const nominalPenagihan = typeof inv.nominal_penagihan === 'number'
                ? inv.nominal_penagihan
                : parseFloat(inv.nominal_penagihan || '0');
            const nominalDibayar = typeof inv.nominal_dibayar === 'number'
                ? inv.nominal_dibayar
                : parseFloat(inv.nominal_dibayar || '0');

            if (status === 'lunas' || status === 'paid') {
                const amount = !isNaN(nominalDibayar) && nominalDibayar > 0 ? nominalDibayar : nominalPenagihan;
                return acc + (isNaN(amount) ? 0 : amount);
            } else if (status === 'sebagian dibayar') {
                return acc + (isNaN(nominalDibayar) ? 0 : nominalDibayar);
            }
            return acc;
        }, 0);
    }, [filteredPenagihanList]);

    const totalBelumTerbayar = React.useMemo(() => {
        return Math.max(0, totalTagihan - totalTerbayar);
    }, [totalTagihan, totalTerbayar]);

    const nextDueDate = React.useMemo(() => {
        const upcoming = filteredPenagihanList
            .filter((inv: any) => inv.jatuh_tempo && String(inv.status || '').toLowerCase() !== 'lunas')
            .map((inv: any) => inv.jatuh_tempo)
            .sort();
        if (upcoming.length > 0) {
            try {
                return format(new Date(upcoming[0]), 'dd MMM yyyy');
            } catch {
                return upcoming[0];
            }
        }
        return '-';
    }, [filteredPenagihanList]);

    if (isLoading || isLoadingPenagihan) {
        return <div className="p-8"><Skeleton className="h-96 w-full rounded-xl" /></div>
    }

    const paidPercentage = totalTagihan > 0 ? ((totalTerbayar / totalTagihan) * 100).toFixed(1) : '0.0';

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Finance Overview</h1>
                    <p className="text-muted-foreground">Track your project expenses, contracting values, and invoice history.</p>
                </div>
                {/* <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Download Statement
                </Button> */}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-neutral-900 text-white border-neutral-800">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-neutral-400">Total Tagihan</CardDescription>
                        <CardTitle className="text-3xl font-medium">Rp {totalTagihan.toLocaleString('id-ID')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm text-neutral-400">
                            <TrendingUp className="h-4 w-4 text-emerald-400" />
                            <span>Across all active invoices</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Terbayar</CardDescription>
                        <CardTitle className="text-3xl font-medium text-emerald-600">Rp {totalTerbayar.toLocaleString('id-ID')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                            <CreditCard className="h-4 w-4 text-neutral-400" />
                            <span>{paidPercentage}% dari total tagihan</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Belum terbayar</CardDescription>
                        <CardTitle className="text-3xl font-medium text-orange-600">Rp {totalBelumTerbayar.toLocaleString('id-ID')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                            <AlertCircle className="h-4 w-4 text-orange-400" />
                            <span>Next Due: {nextDueDate}</span>
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
                                    <th className="px-4 py-3 text-center">Umur Tagihan</th>
                                    <th className="px-4 py-3 text-right">Nominal Tagihan</th>
                                    <th className="px-4 py-3 text-right">Nominal Terbayar</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-right">File</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 bg-white">
                                {isLoadingPenagihan ? (
                                    <tr>
                                        <td colSpan={9} className="py-8 text-center text-neutral-400">
                                            <div className="flex items-center justify-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
                                                <span>Loading invoice data...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredPenagihanList.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="text-center py-8 text-neutral-400">No invoices found.</td>
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

                                        const agingInfo = getUmurTagihanInfo(inv);

                                        const statusStr = String(inv.status || '');
                                        const isLunas = statusStr.toLowerCase() === 'lunas' || statusStr.toLowerCase() === 'paid';
                                        const nominalTerbayarVal = isLunas && (!inv.nominal_dibayar || Number(inv.nominal_dibayar) === 0)
                                            ? inv.nominal_penagihan
                                            : inv.nominal_dibayar;

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
                                                <td className="px-4 py-4 text-center whitespace-nowrap">
                                                    <span className={agingInfo.colorClass}>
                                                        {agingInfo.text}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-right text-neutral-900 font-medium">
                                                    {formatRupiah(inv.nominal_penagihan)}
                                                </td>
                                                <td className="px-4 py-4 text-right text-emerald-600 font-medium">
                                                    {formatRupiah(nominalTerbayarVal)}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <Badge
                                                        variant="secondary"
                                                        className={cn(
                                                            "font-semibold text-xs",
                                                            isLunas && 'bg-emerald-100 text-emerald-700 border-emerald-200',
                                                            (statusStr === 'Sebagian Dibayar' || statusStr === 'unpaid') && 'bg-amber-100 text-amber-700 border-amber-200',
                                                            (statusStr === 'Belum Bayar' || statusStr === 'overdue') && 'bg-red-100 text-red-700 border-red-200'
                                                        )}
                                                    >
                                                        {inv.status || '-'}
                                                    </Badge>
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
