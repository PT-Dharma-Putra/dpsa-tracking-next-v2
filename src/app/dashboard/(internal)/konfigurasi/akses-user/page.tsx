"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { adminService } from "@/features/admin/api/admin-service"
import { User } from "@/features/auth/types"
import { PermissionMatrixModal } from "@/components/access-control/PermissionMatrixModal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { UserCheck, Key, Search, Loader2 } from "lucide-react"

export default function AksesUserPage() {
    const [search, setSearch] = useState('')
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const { data: response, isLoading } = useQuery({
        queryKey: ['admin-users-all', search],
        queryFn: () => adminService.getAllUsers({ search, per_page: 50 }),
    })

    const users = response?.data || []

    const handleManageAccess = (user: User) => {
        setSelectedUser(user)
        setIsModalOpen(true)
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <UserCheck className="w-6 h-6 text-orange-600" /> Manajemen Akses Spesifik User
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Berikan izin akses tambahan khusus (Direct Override) untuk user tertentu tanpa mengubah role utamanya.
                    </p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input
                        placeholder="Cari user..."
                        className="pl-9"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="border rounded-lg bg-white overflow-hidden shadow-xs">
                <Table>
                    <TableHeader className="bg-neutral-50">
                        <TableRow>
                            <TableHead className="w-[60px]">#</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Roles</TableHead>
                            <TableHead>Divisi</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center">
                                    <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                        <Loader2 className="animate-spin text-orange-600 w-5 h-5" />
                                        <span>Memuat daftar user...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    Tidak ada data user.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user: User, index: number) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium text-neutral-400">{index + 1}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-neutral-900">{user.name}</span>
                                            <span className="text-xs text-muted-foreground">{user.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {user.roles && Array.isArray(user.roles) && user.roles.length > 0 ? (
                                                user.roles.map((r: any, rIdx: number) => (
                                                    <Badge key={rIdx} variant="outline" className="text-xs bg-slate-50 text-slate-700">
                                                        {typeof r === 'string' ? r : r?.name}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700">{user.role}</Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {user.divisi ? user.divisi : <span className="text-muted-foreground text-xs">-</span>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            onClick={() => handleManageAccess(user)}
                                            className="bg-orange-600 hover:bg-orange-700 text-white"
                                        >
                                            <Key className="w-3.5 h-3.5 mr-1.5" /> Atur Akses Khusus
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {selectedUser && (
                <PermissionMatrixModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false)
                        setSelectedUser(null)
                    }}
                    type="user"
                    targetId={selectedUser.id}
                    targetName={selectedUser.name}
                />
            )}
        </div>
    )
}
