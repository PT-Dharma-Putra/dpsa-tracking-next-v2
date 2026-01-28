"use client"

import { useQuery } from "@tanstack/react-query"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { adminService } from "@/features/admin/api/admin-service"
import { format } from "date-fns"

export function UserListTable() {
    const { data: users, isLoading } = useQuery({
        queryKey: ['admin-users-all'],
        queryFn: adminService.getAllUsers,
    })

    if (isLoading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-orange-600" /></div>
    }

    if (!users || users.length === 0) {
        return (
            <div className="p-12 text-center border rounded-lg bg-neutral-50">
                <p className="text-neutral-500">No users found in the system.</p>
            </div>
        )
    }

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800 hover:bg-green-100 border-none';
            case 'pending': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-none';
            case 'rejected': return 'bg-red-100 text-red-800 hover:bg-red-100 border-none';
            default: return 'bg-neutral-100 text-neutral-800 hover:bg-neutral-100 border-none';
        }
    }

    return (
        <div className="rounded-md border bg-white">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Division</TableHead>
                        <TableHead>Join Date</TableHead>
                        <TableHead>Account Status</TableHead>
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
                                {user.created_at ? format(new Date(user.created_at), 'dd MMM yyyy') : '-'}
                            </TableCell>
                            <TableCell>
                                <Badge className={getStatusColor(user.account_status)}>
                                    {(user.account_status || 'unknown').toUpperCase()}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
