"use client";

import { useQuery } from "@tanstack/react-query";
import { DesignService, SPHItem, DesignStatus } from "@/features/projects/services/design-service";
import { BusinessRole, canViewPricing, canUploadDesign, canApproveDesign } from "@/lib/get-user-role";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    Image as ImageIcon, Upload, CheckCircle2, Clock, Pencil, Eye, AlertCircle,
    RotateCw, ArrowRight
} from "lucide-react";

interface Props {
    projectId: string | number;
    role: BusinessRole;
}

const STATUS_CONFIG: Record<DesignStatus, { label: string; color: string; icon: React.ReactNode }> = {
    TODO: { label: "To Do", color: "bg-neutral-100 text-neutral-600 border-neutral-200", icon: <Clock className="h-3 w-3" /> },
    ON_DESIGN: { label: "On Design", color: "bg-blue-50 text-blue-700 border-blue-200", icon: <Pencil className="h-3 w-3" /> },
    IN_REVIEW: { label: "In Review", color: "bg-amber-50 text-amber-700 border-amber-200", icon: <Eye className="h-3 w-3" /> },
    REVISION: { label: "Revision", color: "bg-red-50 text-red-700 border-red-200", icon: <RotateCw className="h-3 w-3" /> },
    DONE: { label: "Done", color: "bg-green-50 text-green-700 border-green-200", icon: <CheckCircle2 className="h-3 w-3" /> },
};

export function CommercialItemTable({ projectId, role }: Props) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['design-items', projectId],
        queryFn: () => DesignService.getItems(projectId),
    });

    const items: SPHItem[] = data?.items || [];
    const summary = data?.summary;
    const showPricing = canViewPricing(role);

    if (isLoading) return <TableSkeleton />;

    if (error) {
        return (
            <div className="rounded-xl border border-red-100 bg-red-50/50 p-6 text-center">
                <AlertCircle className="h-5 w-5 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-600">Failed to load items.</p>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="rounded-xl border-2 border-dashed border-neutral-200 p-8 text-center">
                <ImageIcon className="h-8 w-8 text-neutral-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-neutral-500">No items yet</p>
                <p className="text-xs text-neutral-400 mt-1">Add items from the SPH page to begin tracking.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Summary bar */}
            {summary && (
                <div className="flex items-center gap-4 text-xs text-neutral-500 px-1">
                    <span><strong className="text-neutral-900">{items.length}</strong> items</span>
                    <span className="text-neutral-300">•</span>
                    <span><strong className="text-neutral-900">{summary.design_needed || 0}</strong> need design</span>
                    <span className="text-neutral-300">•</span>
                    <span>Avg progress: <strong className="text-orange-600">{summary.avg_progress || 0}%</strong></span>
                </div>
            )}

            {/* Table */}
            <div className="rounded-xl border border-neutral-200 overflow-hidden bg-white">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-neutral-50/80 hover:bg-neutral-50/80">
                            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 w-10">#</TableHead>
                            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Item</TableHead>
                            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 w-16 text-center">Qty</TableHead>
                            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 w-32">Design Status</TableHead>
                            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 w-20 text-center">Progress</TableHead>
                            {showPricing && (
                                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 w-28 text-right">Price</TableHead>
                            )}
                            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 w-24 text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item, idx) => (
                            <ItemRow
                                key={item.id}
                                item={item}
                                index={idx + 1}
                                role={role}
                                showPricing={showPricing}
                            />
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function ItemRow({
    item,
    index,
    role,
    showPricing,
}: {
    item: SPHItem;
    index: number;
    role: BusinessRole;
    showPricing: boolean;
}) {
    const statusCfg = STATUS_CONFIG[item.design_status] || STATUS_CONFIG.TODO;
    const progressPct = item.design_progress || 0;

    return (
        <TableRow className="group hover:bg-orange-50/30 transition-colors">
            <TableCell className="text-xs text-neutral-400 font-mono">{index}</TableCell>

            {/* Item info */}
            <TableCell>
                <div>
                    <p className="text-sm font-medium text-neutral-900 group-hover:text-orange-700 transition-colors">
                        {item.name}
                    </p>
                    {item.specs && (
                        <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">{item.specs}</p>
                    )}
                </div>
            </TableCell>

            {/* Qty */}
            <TableCell className="text-center">
                <span className="text-sm font-medium text-neutral-700">{item.qty || '—'}</span>
            </TableCell>

            {/* Design Status */}
            <TableCell>
                {item.needs_design ? (
                    <Badge variant="outline" className={`text-[10px] font-bold ${statusCfg.color} gap-1`}>
                        {statusCfg.icon}
                        {statusCfg.label}
                    </Badge>
                ) : (
                    <span className="text-xs text-neutral-400 italic">No design</span>
                )}
            </TableCell>

            {/* Progress */}
            <TableCell className="text-center">
                {item.needs_design ? (
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 bg-neutral-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-orange-500 rounded-full transition-all duration-500"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-bold text-neutral-500 w-8 text-right">{progressPct}%</span>
                    </div>
                ) : (
                    <span className="text-xs text-neutral-300">—</span>
                )}
            </TableCell>

            {/* Pricing (role-filtered) */}
            {showPricing && (
                <TableCell className="text-right">
                    {item.unit_price ? (
                        <span className="text-sm font-medium text-neutral-700">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.unit_price)}
                        </span>
                    ) : (
                        <span className="text-xs text-neutral-300">—</span>
                    )}
                </TableCell>
            )}

            {/* Actions */}
            <TableCell className="text-center">
                <TooltipProvider delayDuration={200}>
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Studio: Upload Design */}
                        {canUploadDesign(role) && item.needs_design && item.design_status !== 'DONE' && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600 hover:bg-blue-50">
                                        <Upload className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top"><p className="text-xs">Upload Design</p></TooltipContent>
                            </Tooltip>
                        )}

                        {/* Supervisor: Approve Design */}
                        {canApproveDesign(role) && item.design_status === 'IN_REVIEW' && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:bg-green-50">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top"><p className="text-xs">Approve Design</p></TooltipContent>
                            </Tooltip>
                        )}

                        {/* Everyone: View detail */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50">
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top"><p className="text-xs">View Details</p></TooltipContent>
                        </Tooltip>
                    </div>
                </TooltipProvider>
            </TableCell>
        </TableRow>
    );
}

function TableSkeleton() {
    return (
        <div className="rounded-xl border border-neutral-200 overflow-hidden bg-white">
            <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-4 w-6" />
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-4 w-10" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-2 w-16" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                ))}
            </div>
        </div>
    );
}
