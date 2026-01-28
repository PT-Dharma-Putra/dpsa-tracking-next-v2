"use client"

import { AlertTriangle, Info } from "lucide-react"
import { useEffect, useState } from "react"

export function ProjectTicker() {
    const [messages, setMessages] = useState<string[]>([
        "Project Alpha: Deadline H-2 (30 Jan 2026)",
        "Project Beta: Progress 75% - Waiting for Approval",
        "New MDL Data Imported Successfully",
        "System Maintenance scheduled for Sunday 12:00 PM"
    ])

    // In a real app, we would fetch these messages from an API
    // useEffect(() => { ... }, [])

    return (
        <div className="w-full bg-neutral-900 text-white overflow-hidden py-1.5 rounded-lg mb-2 shadow-md relative">
            <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-neutral-900 to-transparent w-16 z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-neutral-900 to-transparent w-16 z-10"></div>

            <div className="animate-marquee whitespace-nowrap flex gap-12 items-center">
                {/* Duplicate the messages to create a seamless loop */}
                {[...messages, ...messages].map((msg, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm font-medium">
                        {msg.includes("Deadline") ? (
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                        ) : (
                            <Info className="w-4 h-4 text-blue-400" />
                        )}
                        <span>{msg}</span>
                    </div>
                ))}
            </div>

            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    )
}
