import { Megaphone } from "lucide-react";

interface ActivityTickerProps {
    activities?: string[];
}

export function ActivityTicker({ activities = [] }: ActivityTickerProps) {
    // Default mock data if empty
    const items = activities.length > 0 ? activities : [
        "Project LOBBY-CL1 just entered Production Phase",
        "Design for 'Kitchen Set' Approved by Client",
        "Material for 'Wardrobe' has arrived at Workshop",
        "New Invoice #INV-2024-001 is available for download"
    ];

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
