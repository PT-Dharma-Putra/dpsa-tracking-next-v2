"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { adminService, Role } from "@/features/admin/api/admin-service"
import { PermissionMatrixModal } from "@/components/access-control/PermissionMatrixModal"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Shield, Key, Loader2 } from "lucide-react"

export default function AksesRolePage() {
    const [selectedRole, setSelectedRole] = useState<Role | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const { data: roles = [], isLoading } = useQuery({
        queryKey: ['admin-roles'],
        queryFn: adminService.getRoles,
    })

    const handleManageAccess = (role: Role) => {
        setSelectedRole(role)
        setIsModalOpen(true)
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Shield className="w-6 h-6 text-orange-600" /> Manajemen Akses Role
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Atur hak akses granular (Create, Read, Update, Delete, Sort) untuk setiap role dalam sistem.
                    </p>
                </div>
            </div>

            <div className="border rounded-lg bg-white overflow-hidden shadow-xs">
                <Table>
                    <TableHeader className="bg-neutral-50">
                        <TableRow>
                            <TableHead className="w-[80px]">#</TableHead>
                            <TableHead>Nama Role</TableHead>
                            <TableHead>Guard Name</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-32 text-center">
                                    <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                        <Loader2 className="animate-spin text-orange-600 w-5 h-5" />
                                        <span>Memuat daftar role...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : roles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    Tidak ada data role.
                                </TableCell>
                            </TableRow>
                        ) : (
                            roles.map((role: any, index: number) => (
                                <TableRow key={role.id}>
                                    <TableCell className="font-medium text-neutral-400">{index + 1}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-neutral-900">{role.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700">
                                            {role.guard_name || 'web'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            onClick={() => handleManageAccess(role)}
                                            className="bg-orange-600 hover:bg-orange-700 text-white"
                                        >
                                            <Key className="w-3.5 h-3.5 mr-1.5" /> Atur Hak Akses
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {selectedRole && (
                <PermissionMatrixModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false)
                        setSelectedRole(null)
                    }}
                    type="role"
                    targetId={selectedRole.id}
                    targetName={selectedRole.name}
                />
            )}
        </div>
    )
}
