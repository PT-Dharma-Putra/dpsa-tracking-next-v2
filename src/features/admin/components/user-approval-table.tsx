"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Check, X, Loader2 } from "lucide-react"
import { adminService } from "@/features/admin/api/admin-service"
import { toast } from "sonner"
import { format } from "date-fns"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"

export function UserApprovalTable() {
    const queryClient = useQueryClient()
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
    const [rejectionReason, setRejectionReason] = useState("")

    // Query Pending Users
    const { data: users, isLoading } = useQuery({
        queryKey: ['admin-users-pending'],
        queryFn: adminService.getPendingUsers,
    })

    // Approve Mutation
    const approveMutation = useMutation({
        mutationFn: adminService.approveUser,
        onSuccess: () => {
            toast.success("User approved successfully")
            queryClient.invalidateQueries({ queryKey: ['admin-users-pending'] })
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
        },
        onError: (error: any) => {
            toast.error("Failed to approve user")
        }
    })

    // Reject Mutation
    const rejectMutation = useMutation({
        mutationFn: ({ id, reason }: { id: number, reason: string }) => adminService.rejectUser(id, reason),
        onSuccess: () => {
            toast.success("User rejected")
            setRejectDialogOpen(false)
            setRejectionReason("")
            setSelectedUserId(null)
            queryClient.invalidateQueries({ queryKey: ['admin-users-pending'] })
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
        },
        onError: (error: any) => {
            toast.error("Failed to reject user")
        }
    })

    const handleApprove = (id: number) => {
        approveMutation.mutate(id)
    }

    const openRejectDialog = (id: number) => {
        setSelectedUserId(id)
        setRejectDialogOpen(true)
    }

    const confirmReject = () => {
        if (selectedUserId) {
            rejectMutation.mutate({ id: selectedUserId, reason: rejectionReason })
        }
    }

    if (isLoading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-orange-600" /></div>
    }

    if (!users || users.length === 0) {
        return (
            <div className="p-12 text-center border rounded-lg bg-neutral-50">
                <p className="text-neutral-500">No pending approval requests found.</p>
            </div>
        )
    }

    return (
        <>
            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Division</TableHead>
                            <TableHead>Registered At</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{user.name}</span>
                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="w-fit">{user.role}</Badge>
                                </TableCell>
                                <TableCell>
                                    {user.divisi ? user.divisi : <span className="text-muted-foreground">-</span>}
                                </TableCell>
                                <TableCell className="text-sm">
                                    {user.created_at ? format(new Date(user.created_at), 'dd MMM yyyy HH:mm') : '-'}
                                </TableCell>
                                <TableCell>
                                    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-none">
                                        Pending
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 w-8 p-0 text-green-600 border-green-200 hover:bg-green-50"
                                            onClick={() => handleApprove(user.id)}
                                            disabled={approveMutation.isPending}
                                        >
                                            {approveMutation.isPending && approveMutation.variables === user.id ?
                                                <Loader2 className="h-4 w-4 animate-spin" /> :
                                                <Check className="h-4 w-4" />
                                            }
                                            <span className="sr-only">Approve</span>
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50"
                                            onClick={() => openRejectDialog(user.id)}
                                        >
                                            <X className="h-4 w-4" />
                                            <span className="sr-only">Reject</span>
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reject User Registration?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will reject the user's registration. Please provide a reason.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-2">
                        <Input
                            placeholder="Reason for rejection..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); confirmReject(); }}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={!rejectionReason || rejectMutation.isPending}
                        >
                            {rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
