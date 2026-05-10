"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { axiosInstance } from "@/lib/axios"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"

export function NotificationsPopover() {
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();
    const router = useRouter();

    // Fetch Unread Count
    const { data: unreadCount = 0 } = useQuery({
        queryKey: ["notifications", "unread"],
        queryFn: async () => {
            const res = await axiosInstance.get("/notifications/unread-count");
            return res.data.count;
        },
        refetchInterval: 15000, // Poll every 15s
    });

    // Fetch List on Open
    const { data: rawData = null } = useQuery({
        queryKey: ["notifications", "list"],
        queryFn: async () => {
            const res = await axiosInstance.get("/notifications");
            return res.data;
        },
        enabled: isOpen,
    });

    const notifications = rawData?.data?.data || [];

    // Mark Read Mutation
    const markReadMutation = useMutation({
        mutationFn: async (id: string) => {
            await axiosInstance.post(`/notifications/${id}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
    });

    const handleNotifClick = (notif: any) => {
        if (!notif.read_at) {
            markReadMutation.mutate(notif.id);
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-neutral-400 hover:text-orange-600 hover:bg-orange-50 mr-2">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full ring-2 ring-white" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 shadow-xl border-neutral-200" align="end">
                <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-white">
                    <h4 className="font-semibold text-sm">Notifikasi</h4>
                    {unreadCount > 0 && <Badge variant="secondary" className="text-[10px] bg-orange-100 text-orange-700 hover:bg-orange-100">{unreadCount} Baru</Badge>}
                </div>
                <ScrollArea className="h-[350px] bg-white">
                    {notifications.length === 0 ? (
                        <div className="p-10 text-center flex flex-col items-center justify-center space-y-2">
                            <Bell className="h-8 w-8 text-neutral-200" />
                            <p className="text-xs text-neutral-400">Belum ada notifikasi</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-neutral-50">
                            {notifications.map((notif: any) => (
                                <div
                                    key={notif.id}
                                    className={`p-4 hover:bg-neutral-50 transition-colors cursor-pointer group ${!notif.read_at ? 'bg-orange-50/40' : ''}`}
                                    onClick={() => handleNotifClick(notif)}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <p className={`text-[13px] leading-tight pr-4 ${!notif.read_at ? 'font-semibold text-neutral-900' : 'text-neutral-600'}`}>
                                            {notif.data.title || 'Informasi Baru'}
                                        </p>
                                        <span className="text-[10px] text-neutral-400 whitespace-nowrap">
                                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">{notif.data.message}</p>
                                    {!notif.read_at && (
                                        <div className="mt-2 h-1.5 w-1.5 rounded-full bg-orange-500" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="p-2 border-t border-neutral-100 bg-neutral-50 rounded-b-lg">
                    <Button variant="ghost" className="w-full text-[11px] h-8 text-neutral-500 hover:text-orange-600">
                        Lihat Semua Riwayat
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
