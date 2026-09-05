"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ProjectService } from "../../services/project-service"
import { projectV2Service } from "../../services/project-v2-service"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
    Loader2, 
    Calendar, 
    DollarSign, 
    LayoutDashboard, 
    AlertCircle, 
    CheckCircle2, 
    Search,
    BarChart3,
    Truck,
    Activity,
    User as UserIcon
} from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog"

interface OverviewTabProps {
    projectId: number
}

export function OverviewTab({ projectId }: OverviewTabProps) {
    const [searchQuery, setSearchQuery] = useState("")

    // View Produksi State
    const [isProduksiViewOpen, setIsProduksiViewOpen] = useState(false);
    const [produksiViewItem, setProduksiViewItem] = useState<any | null>(null);
    const [isSupplierViewOpen, setIsSupplierViewOpen] = useState(false);
    const [supplierViewItem, setSupplierViewItem] = useState<any | null>(null);

    const { data: overview, isLoading } = useQuery({
        queryKey: ['project-overview', projectId],
        queryFn: () => ProjectService.getOverview(projectId),
    });

    const { data: v2Items = [] } = useQuery({
        queryKey: ['project-v2-items', projectId],
        queryFn: () => projectV2Service.getProjectItems(projectId),
    });

    const openProduksiView = (item: any) => {
        const matchedV2 = v2Items.find((v: any) => v.id === item.id || v.item === item.name) || item;
        if (matchedV2.produksi?.is_supplier || matchedV2.is_supplier) {
            setSupplierViewItem(matchedV2);
            setIsSupplierViewOpen(true);
        } else {
            setProduksiViewItem(matchedV2);
            setIsProduksiViewOpen(true);
        }
    };

    if (isLoading) {
        return <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-orange-600" /></div>;
    }

    if (!overview) {
        return <div className="text-center py-10 text-neutral-500">Failed to load overview data.</div>;
    }

    const { project, stats = {}, matrix = [] } = overview;

    const filteredMatrix = matrix?.filter((item: any) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const name = (item.name || "").toLowerCase();
        const ruang = (item.ruang || item.room || "").toLowerCase();
        const lantai = (item.lantai || item.floor || "").toLowerCase();
        return name.includes(q) || ruang.includes(q) || lantai.includes(q);
    });

    return (
        <div className="space-y-6">

            {/* 1. Project Health Stats */}
            {(() => {
                const isCompleted = Boolean((project as any)?.tanggal_selesai) || String(project?.status).toLowerCase() === 'completed' || stats.overall_progress === 100;
                const jadwalKirimFormatted = (() => {
                    if (!project?.deadline) return "Belum diatur";
                    try {
                        return format(new Date(project.deadline), 'd MMMM yyyy', { locale: idLocale });
                    } catch {
                        return project.deadline;
                    }
                })();

                return (
                    <div className={`grid grid-cols-1 ${isCompleted ? 'md:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4'} gap-4`}>
                        <StatsCard
                            title="Overall Progress"
                            value={`${stats.overall_progress ?? 0}%`}
                            icon={<LayoutDashboard className="h-4 w-4 text-blue-500" />}
                            desc={`The last progres: ${stats.last_progress_label || 'Draft'}`}
                        />
                        <StatsCard
                            title="SPK Value"
                            value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(stats.total_spk_value ?? 0)}
                            icon={<DollarSign className="h-4 w-4 text-green-500" />}
                            desc="Total SPK Value"
                        />
                        {!isCompleted && (() => {
                            const days = stats.deadline_days;
                            let deadlineValue = "Belum diatur";
                            let deadlineColor = "text-neutral-900";

                            if (days !== null && days !== undefined) {
                                if (days < 0) {
                                    deadlineValue = `Lewat ${Math.abs(days)} Hari`;
                                    deadlineColor = "text-red-600";
                                } else {
                                    deadlineValue = `Tersisa ${days} Hari`;
                                    deadlineColor = days < 8 ? "text-orange-600" : "text-neutral-900";
                                }
                            }

                            return (
                                <StatsCard
                                    title="Deadline"
                                    value={deadlineValue}
                                    valueClassName={deadlineColor}
                                    icon={<Calendar className="h-4 w-4 text-orange-500" />}
                                    desc={days !== null && project?.deadline 
                                        ? `Based on Schedule: ${format(new Date(project.deadline), 'd MMMM yyyy', { locale: idLocale })}` 
                                        : "No Deadline Set"}
                                />
                            );
                        })()}
                        <StatsCard
                            title="Pengiriman"
                            value={jadwalKirimFormatted}
                            icon={<Truck className="h-4 w-4 text-sky-500" />}
                            desc="Jadwal Kirim"
                        />
                    </div>
                );
            })()}

            {/* 2. Item Progress Matrix */}
            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle className="text-lg">Item Progres Matrix</CardTitle>
                        <CardDescription>Detailed breakdown of each item's status across all phases. Klik pada Progres Produksi untuk melihat detail.</CardDescription>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
                        <Input
                            type="search"
                            placeholder="Cari item, ruang, lantai..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-white border-neutral-200 focus:ring-orange-500 text-sm h-9"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40px] text-center">No.</TableHead>
                                <TableHead className="w-[22%]">Nama Item</TableHead>
                                <TableHead className="w-[12%]">Lantai</TableHead>
                                <TableHead className="w-[13%]">Ruang</TableHead>
                                <TableHead className="w-[7%] text-center">QTY</TableHead>
                                <TableHead className="w-[22%]">Progres Produksi</TableHead>
                                <TableHead className="w-[10%] text-center">Terkirim</TableHead>
                                <TableHead className="w-[10%] text-center">Tersetting</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredMatrix?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8 text-neutral-500">
                                        Tidak ada item yang sesuai dengan pencarian "{searchQuery}".
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredMatrix?.map((item: any, index: number) => {
                                    // Calculate combined progress
                                    const designProgress = item.design?.progress || 0;
                                    const productionProgress = item.production?.progress || 0;
                                    
                                    const workProgress = (!item.design?.needed || designProgress === 100) 
                                        ? Math.max(designProgress, productionProgress) 
                                        : designProgress;
                                    
                                    const shippedQty = item.shipped_qty ?? item.delivery?.shipped_qty ?? 0;
                                    const tersettingQty = item.tersetting_qty ?? item.install?.tersetting_qty ?? 0;
                                    const totalQty = item.qty ?? item.delivery?.qty ?? 1;

                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-center font-medium text-neutral-500">
                                                {index + 1}
                                            </TableCell>

                                            <TableCell className="font-medium text-neutral-900">
                                                {item.name}
                                                {item.design?.needed && <Badge variant="outline" className="ml-2 text-[10px]">Customize</Badge>}
                                            </TableCell>

                                            <TableCell className="font-medium text-neutral-600">
                                                {item.lantai || item.floor || "-"}
                                            </TableCell>

                                            <TableCell className="font-medium text-neutral-600">
                                                {item.ruang || item.room || "-"}
                                            </TableCell>

                                            <TableCell className="text-center font-medium text-neutral-800">
                                                {totalQty}
                                            </TableCell>

                                            <TableCell>
                                                <div 
                                                    className="flex items-center gap-2 min-w-[140px] cursor-pointer group hover:bg-blue-50 p-1.5 -ml-1.5 rounded-md transition-colors" 
                                                    onClick={() => openProduksiView(item)}
                                                    title="Klik untuk melihat detail progres produksi"
                                                >
                                                    <span className="text-xs font-bold text-neutral-700 w-8 text-right group-hover:text-blue-700 transition-colors">
                                                        {workProgress}%
                                                    </span>
                                                    <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden group-hover:bg-blue-100 transition-colors">
                                                        <div 
                                                            className="h-full bg-blue-600 rounded-full transition-all duration-300" 
                                                            style={{ width: `${workProgress}%` }} 
                                                        />
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-center whitespace-nowrap">
                                                <span className="text-xs font-semibold text-neutral-800">
                                                    {shippedQty} / {totalQty}
                                                </span>
                                            </TableCell>

                                            <TableCell className="text-center whitespace-nowrap">
                                                <span className="text-xs font-semibold text-neutral-800">
                                                    {tersettingQty} / {totalQty}
                                                </span>
                                            </TableCell>

                                            <TableCell className="text-right">
                                                {item.design?.progress === 100 ? (
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Ready</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-neutral-500">In Progress</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* View Produksi Progress Dialog */}
            <AlertDialog open={isProduksiViewOpen} onOpenChange={setIsProduksiViewOpen}>
                <AlertDialogContent className='max-w-2xl'>
                    <AlertDialogHeader>
                        <AlertDialogTitle className='flex items-center gap-2'>
                            <BarChart3 className='h-5 w-5 text-orange-500' />
                            Detail Progress Produksi
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Melihat progress produksi untuk item: <strong>{produksiViewItem?.item || produksiViewItem?.name}</strong>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    
                    <div className='py-4 space-y-6'>
                        {/* Summary Progress */}
                        <div className='grid grid-cols-3 gap-4'>
                            <div className='space-y-1 text-center p-3 bg-neutral-50 rounded-xl border border-neutral-100 flex flex-col justify-center'>
                                <span className='text-[10px] font-bold text-neutral-500 uppercase tracking-wider'>Jumlah Order</span>
                                <div className='text-2xl font-black text-neutral-800'>
                                    {produksiViewItem?.jumlah || produksiViewItem?.qty || 0}
                                </div>
                            </div>
                            <div className='space-y-1 text-center p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex flex-col justify-center'>
                                <span className='text-[10px] font-bold text-indigo-800 uppercase tracking-wider'>Menggunakan Stok</span>
                                <div className='text-2xl font-black text-indigo-600'>
                                    {produksiViewItem?.produksi?.menggunakan_stok || 0}
                                </div>
                            </div>
                            <div className='space-y-1 text-center p-3 bg-orange-50 rounded-xl border border-orange-100 flex flex-col justify-center'>
                                <span className='text-[10px] font-bold text-orange-800 uppercase tracking-wider'>Total Progress</span>
                                <div className='flex items-baseline justify-center gap-1'>
                                    <span className='text-2xl font-black text-orange-600'>{Math.round(produksiViewItem?.produksi?.persen || 0)}</span>
                                    <span className='text-sm font-bold text-orange-400'>%</span>
                                </div>
                            </div>
                        </div>
                        <Progress value={produksiViewItem?.produksi?.persen || 0} className='h-2 bg-orange-200/50 w-full' />

                        <div className='grid grid-cols-2 gap-x-8 gap-y-6'>
                            {/* Mesin Section */}
                            <div className='space-y-3'>
                                <h4 className='font-bold text-xs text-neutral-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2'>
                                    <Activity className='h-3 w-3' />
                                    Tahapan Mesin
                                </h4>
                                <div className='space-y-3'>
                                    {[
                                        { label: 'Cold Press', value: produksiViewItem?.produksi?.cold_press, key: 'cold_press' },
                                        { label: 'Running Saw', value: produksiViewItem?.produksi?.running_saw, key: 'running_saw' },
                                        { label: 'Edging', value: produksiViewItem?.produksi?.edging, key: 'edging' },
                                        { label: 'CNC', value: produksiViewItem?.produksi?.cnc, key: 'cnc' },
                                    ].map((field) => {
                                        const isSkipped = (produksiViewItem?.produksi as any)?.skipped_fields?.includes(field.key);
                                        const order = produksiViewItem?.jumlah || produksiViewItem?.qty || 0;
                                        return (
                                            <div key={field.key} className='flex items-center justify-between'>
                                                <span className='text-xs text-neutral-600'>{field.label}</span>
                                                <div className='flex items-center gap-2'>
                                                    {isSkipped ? (
                                                        <Badge variant='secondary' className='text-[9px] bg-neutral-100 text-neutral-400 border-none'>SKIPPED</Badge>
                                                    ) : (
                                                        <span className='text-sm font-bold text-neutral-900'>{field.value || 0} <span className='text-[10px] text-neutral-400 font-normal'>/ {order}</span></span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Manual Section */}
                            <div className='space-y-3'>
                                <h4 className='font-bold text-xs text-neutral-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2'>
                                    <UserIcon className='h-3 w-3' />
                                    Tahapan Manual
                                </h4>
                                <div className='space-y-3'>
                                    {[
                                        { label: 'Tukang Kayu', value: produksiViewItem?.produksi?.tukang_kayu, key: 'tukang_kayu' },
                                        { label: 'Tukang Jok', value: produksiViewItem?.produksi?.tukang_jok, key: 'tukang_jok' },
                                        { label: 'Rakit', value: produksiViewItem?.produksi?.rakit, key: 'rakit' },
                                        { label: 'Finishing', value: produksiViewItem?.produksi?.finishing, key: 'finishing' },
                                    ].map((field) => {
                                        const isSkipped = (produksiViewItem?.produksi as any)?.skipped_fields?.includes(field.key);
                                        const order = produksiViewItem?.jumlah || produksiViewItem?.qty || 0;
                                        return (
                                            <div key={field.key} className='flex items-center justify-between'>
                                                <span className='text-xs text-neutral-600'>{field.label}</span>
                                                <div className='flex items-center gap-2'>
                                                    {isSkipped ? (
                                                        <Badge variant='secondary' className='text-[9px] bg-neutral-100 text-neutral-400 border-none'>SKIPPED</Badge>
                                                    ) : (
                                                        <span className='text-sm font-bold text-neutral-900'>{field.value || 0} <span className='text-[10px] text-neutral-400 font-normal'>/ {order}</span></span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <AlertDialogFooter className='border-t pt-4'>
                        <AlertDialogCancel className='bg-neutral-100 hover:bg-neutral-200 border-none'>Tutup</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* View Barang Supplier Progress Dialog */}
            <AlertDialog
                open={isSupplierViewOpen}
                onOpenChange={setIsSupplierViewOpen}
            >
                <AlertDialogContent className='max-w-xl'>
                    <AlertDialogHeader>
                        <AlertDialogTitle className='flex items-center gap-2 text-lg sm:text-xl font-bold tracking-tight text-neutral-800'>
                            <Truck className='h-6 w-6 text-blue-500' />
                            Detail Progress Supplier
                        </AlertDialogTitle>
                        <AlertDialogDescription className='text-sm text-neutral-500 mt-1'>
                            Melihat progress supplier untuk item: <strong>{supplierViewItem?.item || supplierViewItem?.name}</strong>
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className='py-4 space-y-6'>
                        {/* Jumlah Order & Persen */}
                        <div className='grid grid-cols-2 gap-4'>
                            <div className='space-y-2 text-center p-4 bg-neutral-50 rounded-xl border border-neutral-100'>
                                <span className='text-xs font-bold text-neutral-500 uppercase tracking-wider'>Jumlah Order</span>
                                <div className='text-3xl font-black text-neutral-800'>
                                    {supplierViewItem?.barang_supplier?.jumlah_order || supplierViewItem?.jumlah || supplierViewItem?.qty || 0}
                                </div>
                            </div>
                            <div className='space-y-2 text-center p-4 bg-blue-50 rounded-xl border border-blue-100'>
                                <span className='text-xs font-bold text-blue-800 uppercase tracking-wider'>Total Progress</span>
                                <div className='flex items-baseline justify-center gap-1'>
                                    <span className='text-3xl font-black text-blue-600'>
                                        {typeof supplierViewItem?.barang_supplier?.persen === 'number'
                                            ? supplierViewItem.barang_supplier.persen.toFixed(0)
                                            : (Number(supplierViewItem?.barang_supplier?.persen) || 0).toFixed(0)}
                                    </span>
                                    <span className='text-xl font-bold text-blue-400'>%</span>
                                </div>
                            </div>
                        </div>

                        {/* Fields */}
                        <div className='space-y-3'>
                            <h4 className='font-bold text-xs text-neutral-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2'>
                                <Truck className='h-3 w-3' />
                                Tahapan Supplier
                            </h4>
                            <div className='grid grid-cols-2 sm:grid-cols-2 gap-x-8 gap-y-4'>
                                {(
                                    [
                                        { key: 'barang_dipesan', label: 'Barang Dipesan' },
                                        { key: 'barang_tersedia', label: 'Barang Tersedia' },
                                        { key: 'rakit', label: 'Rakit' },
                                        { key: 'packing', label: 'Packing' },
                                        { key: 'terkirim', label: 'Terkirim' },
                                    ] as const
                                ).map(({ key, label }) => {
                                    const isSkipped = (supplierViewItem?.barang_supplier as any)?.skipped_fields?.includes(key);
                                    const val = supplierViewItem?.barang_supplier?.[key as keyof typeof supplierViewItem.barang_supplier];
                                    const order = supplierViewItem?.barang_supplier?.jumlah_order || supplierViewItem?.jumlah || supplierViewItem?.qty || 0;
                                    return (
                                        <div key={key} className='flex items-center justify-between'>
                                            <span className='text-xs text-neutral-600'>{label}</span>
                                            <div className='flex items-center gap-2'>
                                                {isSkipped ? (
                                                    <Badge variant='secondary' className='text-[9px] bg-neutral-100 text-neutral-400 border-none'>SKIPPED</Badge>
                                                ) : (
                                                    <span className='text-sm font-bold text-neutral-900'>{Number(val) || 0} <span className='text-[10px] text-neutral-400 font-normal'>/ {order}</span></span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <AlertDialogFooter className='border-t pt-4'>
                        <AlertDialogCancel className='bg-neutral-100 hover:bg-neutral-200 border-none'>Tutup</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

function StatsCard({ title, value, icon, desc, valueClassName }: any) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium text-neutral-500">{title}</p>
                    {icon}
                </div>
                <div className={`text-2xl font-bold ${valueClassName || ''}`}>{value}</div>
                <p className="text-xs text-neutral-400 mt-1">{desc}</p>
            </CardContent>
        </Card>
    )
}
