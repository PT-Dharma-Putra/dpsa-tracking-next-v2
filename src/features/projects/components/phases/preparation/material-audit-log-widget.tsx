"use client"

import { useQuery } from "@tanstack/react-query"
import { MaterialService } from "@/features/projects/services/material-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Clock, User, ArrowRight } from "lucide-react"
import { format } from "date-fns"

interface MaterialAuditLogWidgetProps {
    projectId: number;
}

export function MaterialAuditLogWidget({ projectId }: MaterialAuditLogWidgetProps) {
    const { data, isLoading } = useQuery({
        queryKey: ["material-audit-logs", projectId],
        queryFn: () => MaterialService.getAuditLogs(projectId),
    });

    const auditLogs = data?.data || [];

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
            pending: { variant: "outline", className: "border-yellow-200 text-yellow-700 bg-yellow-50" },
            available: { variant: "outline", className: "border-green-200 text-green-700 bg-green-50" },
            need_purchase: { variant: "outline", className: "border-orange-200 text-orange-700 bg-orange-50" },
            released: { variant: "outline", className: "border-blue-200 text-blue-700 bg-blue-50" },
        };

        const config = variants[status] || { variant: "outline" as const, className: "" };
        return <Badge variant={config.variant} className={`text-xs ${config.className}`}>{status}</Badge>;
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Material Audit Log</CardTitle>
                <CardDescription>
                    Complete history of all material status changes and actions
                </CardDescription>
            </CardHeader>
            <CardContent>
                {auditLogs.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500">
                        <Clock className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
                        <p className="text-sm">No audit logs yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {auditLogs.map((log: any) => (
                            <div
                                key={log.id}
                                className="flex gap-4 p-4 border border-neutral-100 rounded-lg hover:bg-neutral-50 transition-colors"
                            >
                                {/* Timeline dot */}
                                <div className="flex flex-col items-center">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                                    <div className="w-px h-full bg-neutral-200 mt-1" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex-1">
                                            {/* Item Name */}
                                            {log.material?.sph_item?.item_name && (
                                                <p className="text-xs font-medium text-blue-600 mb-1">
                                                    📦 {log.material.sph_item.item_name}
                                                </p>
                                            )}
                                            {/* Material Name */}
                                            <p className="text-sm font-medium text-neutral-900">
                                                {log.material?.material_name || 'Unknown Material'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-neutral-500 flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-medium text-neutral-600">{log.action}</span>
                                        {log.old_status && log.new_status && (
                                            <div className="flex items-center gap-2">
                                                {getStatusBadge(log.old_status)}
                                                <ArrowRight className="h-3 w-3 text-neutral-400" />
                                                {getStatusBadge(log.new_status)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Notes */}
                                    {log.notes && (
                                        <p className="text-xs text-neutral-600 bg-neutral-50 p-2 rounded border border-neutral-100">
                                            {log.notes}
                                        </p>
                                    )}

                                    {/* Performer */}
                                    <div className="flex items-center gap-1 mt-2 text-xs text-neutral-500">
                                        <User className="h-3 w-3" />
                                        <span>by {log.performer?.name || 'System'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
