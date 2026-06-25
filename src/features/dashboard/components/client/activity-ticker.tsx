"use client"

import { Megaphone } from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { ClientService } from "@/features/dashboard/services/client-service";

interface ActivityTickerProps {
    activities?: string[];
}

export function ActivityTicker({ activities: initialActivities = [] }: ActivityTickerProps) {
    // Fetch Real Activities
    const { data: fetchedActivities } = useQuery({
        queryKey: ["client-ticker"],
        queryFn: () => ClientService.getRecentActivity(10),
        initialData: initialActivities
    });

    // Use fetched data, fallback to mock only if explicitly empty and loading failed (optional, but requested to connect real db)
    // Actually, if DB is empty, we might want to show a generic welcome message instead of old mock data.
    const items = (fetchedActivities && fetchedActivities.length > 0)
        ? fetchedActivities
        : ["Welcome to your Executive Portal", "Project updates will appear here in real-time"];

    return (
        <div className="w-full bg-neutral-900 overflow-hidden flex items-center h-10 border-b border-orange-500/20 shadow-md">
            <div className="px-4 h-full bg-orange-600 flex items-center justify-center shrink-0 z-10 shadow-lg">
                <Megaphone className="h-4 w-4 text-white mr-2" />
                <span className="text-white text-xs font-bold uppercase tracking-wider hidden sm:inline">Live Updates</span>
            </div>
            <div className="flex-1 relative h-full flex items-center overflow-hidden">
                <div className="animate-marquee whitespace-nowrap absolute flex items-center gap-12 text-sm text-neutral-300 font-medium">
                    {items.map((item, i) => (
                        <span key={i} className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-3 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                            {item}
                        </span>
                    ))}
                    {/* Duplicate for seamless loop */}
                    {items.map((item, i) => (
                        <span key={`dup-${i}`} className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-3 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                            {item}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
