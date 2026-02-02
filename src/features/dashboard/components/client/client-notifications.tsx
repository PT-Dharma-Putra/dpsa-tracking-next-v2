"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { axiosInstance } from "@/lib/axios"
import Link from "next/link"

export function ClientNotifications() {
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();

    // Fetch Unread Count
    const { data: unreadCount = 0 } = useQuery({
        queryKey: ["notifications", "unread"],
        queryFn: async () => {
            const res = await axiosInstance.get("/notifications/unread-count");
            return res.data.count;
        },
        refetchInterval: 10000, // Poll every 10s
    });

    // Fetch List on Open
    const { data: notifications = [] } = useQuery({
        queryKey: ["notifications", "list"],
        queryFn: async () => {
            const res = await axiosInstance.get("/notifications");
            return res.data.data;
        },
        enabled: isOpen,
    });

    // Mark Read Mutation
    const markReadMutation = useMutation({
        mutationFn: async (id: string) => {
            await axiosInstance.post(`/notifications/${id}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
    });

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-neutral-400 hover:text-orange-600 hover:bg-orange-50 mr-2">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full animate-pulse ring-2 ring-white" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b border-neutral-100 flex justify-between items-center">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {unreadCount > 0 && <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">{unreadCount} New</Badge>}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-neutral-400 text-sm">
                            No notifications yet.
                        </div>
                    ) : (
                        <div className="divide-y divide-neutral-50">
                            {notifications.map((notif: any) => (
                                <div
                                    key={notif.id}
                                    className={`p-4 hover:bg-neutral-50 transition-colors cursor-pointer ${!notif.read_at ? 'bg-orange-50/30' : ''}`}
                                    onClick={() => !notif.read_at && markReadMutation.mutate(notif.id)}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <p className={`text-sm ${!notif.read_at ? 'font-semibold text-neutral-900' : 'text-neutral-600'}`}>
                                            {notif.data.title}
                                        </p>
                                        <span className="text-[10px] text-neutral-400 whitespace-nowrap ml-2">
                                            {new Date(notif.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-500 line-clamp-2">{notif.data.message}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="p-2 border-t border-neutral-100 bg-neutral-50">
                    <Button variant="ghost" className="w-full text-xs h-8 text-neutral-500">
                        View All
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
