"use client"

import { Megaphone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SystemService } from "@/features/common/services/system-service";

export function ProjectTicker() {
    // Fetch Real Activity Logs
    const { data: activities, isError } = useQuery({
        queryKey: ['activity-logs', 'ticker'],
        queryFn: () => SystemService.getRecentActivity(5),
        retry: false // Don't retry if endpoint missing, fallback to static
    });

    // Fallback Mock Data if API fails or is empty
    const fallbackItems = [
        "System Ready: Dashboard Connected to Live Database",
        "Welcome to DPSA Tracking System v2.0",
        "Waiting for new project activities..."
    ];

    const items = (activities?.data && activities.data.length > 0)
        ? activities.data.map((log: any) => `${log.description} (${new Date(log.created_at).toLocaleTimeString()})`)
        : fallbackItems;

    return (
        <div className="w-full bg-neutral-900 overflow-hidden flex items-center h-10 border border-neutral-800 rounded-lg shadow-sm">
            <div className="px-3 h-full bg-orange-600 flex items-center justify-center shrink-0 z-10">
                <Megaphone className="h-4 w-4 text-white hover:scale-110 transition-transform" />
            </div>
            <div className="flex-1 relative h-full flex items-center overflow-hidden bg-neutral-900/50">
                <div className="animate-marquee whitespace-nowrap absolute flex items-center gap-12 text-xs text-neutral-300 font-medium">
                    {items.map((item: string, i: number) => (
                        <span key={i} className="flex items-center">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                            {item}
                        </span>
                    ))}
                    {/* Duplicate for seamless loop */}
                    {items.map((item: string, i: number) => (
                        <span key={`dup-${i}`} className="flex items-center">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                            {item}
                        </span>
                    ))}
                </div>
            </div>
            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 40s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    );
}
