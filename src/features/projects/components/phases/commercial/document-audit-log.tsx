"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProjectService } from "@/features/projects/services/project-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
    History, ChevronDown, FileText, Check, Upload, RotateCw,
    Plus, Eye, AlertCircle, Clock
} from "lucide-react";

interface Props {
    projectId: string | number;
}

interface ActivityEntry {
    id?: number;
    type?: string;
    action?: string;
    description?: string;
    actor?: string;
    user_name?: string;
    version?: number;
    document_type?: string;
    reason?: string;
    created_at?: string;
    timestamp?: string;
}

const ACTION_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
    uploaded: { icon: <Upload className="h-3 w-3" />, color: "bg-blue-500" },
    approved: { icon: <Check className="h-3 w-3" />, color: "bg-green-500" },
    signed: { icon: <Check className="h-3 w-3" />, color: "bg-green-500" },
    revised: { icon: <RotateCw className="h-3 w-3" />, color: "bg-amber-500" },
    addendum: { icon: <Plus className="h-3 w-3" />, color: "bg-purple-500" },
    rejected: { icon: <AlertCircle className="h-3 w-3" />, color: "bg-red-500" },
    created: { icon: <FileText className="h-3 w-3" />, color: "bg-blue-500" },
    default: { icon: <Clock className="h-3 w-3" />, color: "bg-neutral-400" },
};

export function DocumentAuditLog({ projectId }: Props) {
    const [isOpen, setIsOpen] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['project-overview', projectId],
        queryFn: () => ProjectService.getOverview(projectId),
    });

    // Filter activity_stream for document-related events
    const allActivities: ActivityEntry[] = data?.detailed_activities || [];
    const docActivities = allActivities.filter(a => {
        const type = (a.type || a.action || '').toLowerCase();
        return type.includes('sph') || type.includes('spk') || type.includes('document')
            || type.includes('upload') || type.includes('approve') || type.includes('revise')
            || type.includes('addendum') || type.includes('sign');
    });

    // Fallback: if no doc-specific filtering works, show all activities
    const activities = docActivities.length > 0 ? docActivities : allActivities.slice(0, 15);

    if (isLoading) {
        return (
            <Card className="border-neutral-200">
                <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-40" />
                </CardHeader>
                <CardContent className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <Skeleton className="h-5 w-5 rounded-full" />
                            <Skeleton className="h-4 flex-1" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    if (activities.length === 0) {
        return (
            <Card className="border-neutral-200 bg-neutral-50/30">
                <CardContent className="py-6 text-center">
                    <History className="h-5 w-5 text-neutral-300 mx-auto mb-2" />
                    <p className="text-xs text-neutral-400">No document activity recorded yet.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-neutral-200">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CardHeader className="pb-2">
                    <CollapsibleTrigger asChild>
                        <button className="flex items-center justify-between w-full group">
                            <CardTitle className="text-sm font-bold text-neutral-700 flex items-center gap-2">
                                <History className="h-4 w-4 text-orange-600" />
                                Document History
                                <span className="text-[10px] font-normal text-neutral-400 ml-1">
                                    ({activities.length} events)
                                </span>
                            </CardTitle>
                            <ChevronDown className={`h-4 w-4 text-neutral-400 group-hover:text-neutral-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                    </CollapsibleTrigger>
                </CardHeader>

                <CollapsibleContent>
                    <CardContent className="pt-1 pb-4">
                        <div className="relative pl-6 space-y-0">
                            {/* Vertical line */}
                            <div className="absolute left-[9px] top-2 bottom-2 w-px bg-neutral-200" />

                            {activities.map((entry, idx) => {
                                const actionKey = detectAction(entry);
                                const iconConfig = ACTION_ICONS[actionKey] || ACTION_ICONS.default;
                                const dateStr = formatDate(entry.created_at || entry.timestamp);
                                const actor = entry.actor || entry.user_name || 'System';
                                const desc = entry.description || buildDescription(entry);

                                return (
                                    <div key={entry.id || idx} className="relative flex items-start gap-3 py-2 group">
                                        {/* Dot */}
                                        <div className={`absolute -left-6 top-2.5 h-[18px] w-[18px] rounded-full flex items-center justify-center text-white ${iconConfig.color} ring-2 ring-white`}>
                                            {iconConfig.icon}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-neutral-700">
                                                <span className="font-medium text-neutral-900">{actor}</span>
                                                {' '}
                                                <span>{desc}</span>
                                                {entry.version && (
                                                    <span className="ml-1 text-orange-600 font-mono font-bold text-xs">v{entry.version}</span>
                                                )}
                                            </p>
                                            {entry.reason && (
                                                <p className="text-xs text-neutral-400 mt-0.5 italic">Reason: {entry.reason}</p>
                                            )}
                                        </div>

                                        {/* Date */}
                                        <span className="text-[10px] text-neutral-400 whitespace-nowrap shrink-0 mt-0.5">
                                            {dateStr}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}

function detectAction(entry: ActivityEntry): string {
    const text = ((entry.action || '') + ' ' + (entry.description || '') + ' ' + (entry.type || '')).toLowerCase();
    if (text.includes('addendum')) return 'addendum';
    if (text.includes('revis')) return 'revised';
    if (text.includes('approv')) return 'approved';
    if (text.includes('sign')) return 'signed';
    if (text.includes('upload')) return 'uploaded';
    if (text.includes('reject')) return 'rejected';
    if (text.includes('creat')) return 'created';
    return 'default';
}

function buildDescription(entry: ActivityEntry): string {
    const parts: string[] = [];
    if (entry.action) parts.push(entry.action);
    if (entry.document_type) parts.push(entry.document_type.toUpperCase());
    return parts.join(' ') || 'performed an action';
}

function formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
        return dateStr;
    }
}
