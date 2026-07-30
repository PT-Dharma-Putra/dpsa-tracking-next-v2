"use client"

import * as React from "react"
import { useState, useEffect, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2, Search, Copy, CheckCircle2 } from "lucide-react"
import { adminService } from "@/features/admin/api/admin-service"
import { toast } from "sonner"

interface PermissionMatrixModalProps {
    isOpen: boolean
    onClose: () => void
    type: 'role' | 'user'
    targetId: number
    targetName: string
}

export function PermissionMatrixModal({
    isOpen,
    onClose,
    type,
    targetId,
    targetName,
}: PermissionMatrixModalProps) {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState('')
    const [selectedIds, setSelectedIds] = useState<number[]>([])
    const [copySourceRoleId, setCopySourceRoleId] = useState<string>('')

    // Fetch Full Access Matrix (Menu hierarchy + available permissions)
    const { data: matrix = [], isLoading: isLoadingMatrix } = useQuery({
        queryKey: ['access-matrix'],
        queryFn: adminService.getAccessMatrix,
        enabled: isOpen,
    })

    // Fetch Roles for Copy Dropdown
    const { data: roles = [] } = useQuery({
        queryKey: ['admin-roles'],
        queryFn: adminService.getRoles,
        enabled: isOpen && type === 'role',
    })

    // Fetch Current Target Permissions
    const { data: currentPermData, isLoading: isLoadingCurrent } = useQuery({
        queryKey: ['target-permissions', type, targetId],
        queryFn: () => type === 'role' 
            ? adminService.getRolePermissions(targetId) 
            : adminService.getUserPermissions(targetId),
        enabled: isOpen && !!targetId,
    })

    // Sync state when current permissions load
    useEffect(() => {
        if (currentPermData?.permission_ids) {
            setSelectedIds(currentPermData.permission_ids)
        }
    }, [currentPermData])

    // Save Mutation
    const saveMutation = useMutation({
        mutationFn: () => type === 'role' 
            ? adminService.updateRolePermissions(targetId, selectedIds)
            : adminService.updateUserPermissions(targetId, selectedIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['target-permissions', type, targetId] })
            queryClient.invalidateQueries({ queryKey: ['user-sidebar-menus'] })
            queryClient.invalidateQueries({ queryKey: ['admin-users-all'] })
            toast.success(`Hak akses ${type === 'role' ? 'role' : 'user'} ${targetName} berhasil disimpan`)
            onClose()
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Gagal menyimpan hak akses')
        }
    })

    // Copy Role Mutation
    const copyMutation = useMutation({
        mutationFn: (sourceId: number) => adminService.copyRolePermissions(targetId, sourceId),
        onSuccess: (data) => {
            if (data?.permission_ids) {
                setSelectedIds(data.permission_ids)
            }
            toast.success("Berhasil menyalin hak akses dari role")
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Gagal menyalin role')
        }
    })

    const handleCopyRoleChange = (sourceRoleId: string) => {
        setCopySourceRoleId(sourceRoleId)
        if (sourceRoleId) {
            copyMutation.mutate(Number(sourceRoleId))
        }
    }

    // Toggle single permission
    const togglePermission = (permId: number) => {
        setSelectedIds(prev => 
            prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
        )
    }

    // Toggle entire menu row permissions
    const toggleMenuRow = (menuPerms: any[], isAllChecked: boolean) => {
        const rowPermIds = menuPerms.map((p: any) => p.id)
        if (isAllChecked) {
            // Remove all
            setSelectedIds(prev => prev.filter(id => !rowPermIds.includes(id)))
        } else {
            // Add all
            setSelectedIds(prev => Array.from(new Set([...prev, ...rowPermIds])))
        }
    }

    const handleResetToRoleDefault = () => {
        if (currentPermData?.role_permission_ids) {
            setSelectedIds(currentPermData.role_permission_ids)
            toast.info("Hak akses disesuaikan dengan template default Role")
        }
    }

    // Filter matrix menus by search query
    const filteredMatrix = useMemo(() => {
        if (!search.trim()) return matrix;
        const q = search.toLowerCase();

        return matrix.map((parent: any) => {
            const parentMatches = parent.name.toLowerCase().includes(q);
            const filteredChildren = (parent.children || []).filter((child: any) => 
                child.name.toLowerCase().includes(q)
            );

            if (parentMatches || filteredChildren.length > 0) {
                return {
                    ...parent,
                    children: parentMatches ? parent.children : filteredChildren
                };
            }
            return null;
        }).filter(Boolean);
    }, [matrix, search])

    const isLoading = isLoadingMatrix || isLoadingCurrent

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6">
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-xl font-bold flex items-center justify-between">
                        <span>Form Modal</span>
                        <div className="flex items-center gap-2">
                            {type === 'user' && (
                                <span className={`text-xs px-2.5 py-1 rounded-full border ${currentPermData?.has_custom_permissions ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                    {currentPermData?.has_custom_permissions ? 'Akses Khusus User' : 'Akses Default Role'}
                                </span>
                            )}
                            <span className="text-sm font-normal text-muted-foreground bg-orange-50 text-orange-700 px-3 py-1 rounded-full border border-orange-200">
                                {type === 'role' ? `Role: ${targetName}` : `User: ${targetName}`}
                            </span>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2 flex-1 overflow-hidden flex flex-col">
                    {/* Controls Row: Copy Role / Reset Role & Search Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                        {type === 'role' ? (
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-neutral-600">Copy dari role</Label>
                                <Select value={copySourceRoleId} onValueChange={handleCopyRoleChange}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Pilih role..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles
                                            .filter((r: any) => r.id !== targetId)
                                            .map((r: any) => (
                                                <SelectItem key={r.id} value={r.id.toString()}>
                                                    {r.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleResetToRoleDefault}
                                    className="text-xs text-neutral-700"
                                >
                                    Reset ke Default Role
                                </Button>
                            </div>
                        )}
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-neutral-600">Cari menu</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <Input
                                    placeholder="Cari..."
                                    className="pl-9"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Permissions Matrix Table */}
                    <div className="border rounded-lg overflow-y-auto flex-1 bg-white">
                        {isLoading ? (
                            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-2">
                                <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
                                <span>Memuat data matriks akses...</span>
                            </div>
                        ) : filteredMatrix.length === 0 ? (
                            <div className="h-48 flex items-center justify-center text-muted-foreground">
                                Tidak ada menu yang cocok dengan pencarian.
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-neutral-100 sticky top-0 z-10 border-b">
                                    <tr>
                                        <th className="text-left py-3 px-4 font-semibold text-neutral-700 w-1/3">Menu</th>
                                        <th className="text-left py-3 px-4 font-semibold text-neutral-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredMatrix.map((parent: any) => {
                                        const ACTION_ORDER: Record<string, number> = {
                                            create: 1,
                                            read: 2,
                                            update: 3,
                                            delete: 4,
                                            sort: 5,
                                            export: 6,
                                            import: 7,
                                        }

                                        const getUniquePerms = (perms: any[]) => {
                                            const seen = new Set<string>()
                                            const filtered = (perms || []).filter((p: any) => {
                                                const key = (p.action || p.name).toLowerCase()
                                                if (seen.has(key)) return false
                                                seen.add(key)
                                                return true
                                            })

                                            return filtered.sort((a: any, b: any) => {
                                                const actA = (a.action || a.name).toLowerCase()
                                                const actB = (b.action || b.name).toLowerCase()
                                                const orderA = ACTION_ORDER[actA] ?? 99
                                                const orderB = ACTION_ORDER[actB] ?? 99
                                                return orderA - orderB
                                            })
                                        }

                                        const parentPerms = getUniquePerms(parent.permissions)

                                        return (
                                            <React.Fragment key={parent.id}>
                                                {/* Parent Menu Row */}
                                                <tr className="bg-neutral-50 font-medium">
                                                    <td className="py-2.5 px-4 text-neutral-900 font-semibold">
                                                        {parent.name}
                                                    </td>
                                                    <td className="py-2.5 px-4">
                                                        <div className="flex items-center gap-6 flex-wrap">
                                                            {parentPerms.map((perm: any) => {
                                                                const isChecked = selectedIds.includes(perm.id)
                                                                return (
                                                                    <div key={perm.id} className="flex items-center gap-2">
                                                                        <Switch
                                                                            checked={isChecked}
                                                                            onCheckedChange={() => togglePermission(perm.id)}
                                                                        />
                                                                        <span className="text-xs text-neutral-600 capitalize">
                                                                            {perm.action || perm.name}
                                                                        </span>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Child Submenu Rows */}
                                                {(parent.children || []).map((child: any) => {
                                                    const childPerms = getUniquePerms(child.permissions)
                                                    const childPermIds = childPerms.map((p: any) => p.id)
                                                    const isAllChecked = childPermIds.length > 0 && childPermIds.every((id: number) => selectedIds.includes(id))

                                                    return (
                                                        <tr key={child.id} className="hover:bg-neutral-50/50 transition-colors">
                                                            <td className="py-2.5 px-4 pl-8">
                                                                <div className="flex items-center gap-2">
                                                                    <Checkbox
                                                                        checked={isAllChecked}
                                                                        onCheckedChange={() => toggleMenuRow(childPerms, isAllChecked)}
                                                                    />
                                                                    <span className="text-neutral-700">{child.name}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-2.5 px-4">
                                                                <div className="flex items-center gap-6 flex-wrap">
                                                                    {childPerms.map((perm: any) => {
                                                                        const isChecked = selectedIds.includes(perm.id)
                                                                        return (
                                                                            <div key={perm.id} className="flex items-center gap-2">
                                                                                <Switch
                                                                                    checked={isChecked}
                                                                                    onCheckedChange={() => togglePermission(perm.id)}
                                                                                />
                                                                                <span className="text-xs text-neutral-600 capitalize">
                                                                                    {perm.action || perm.name}
                                                                                </span>
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </React.Fragment>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <DialogFooter className="pt-2 border-t gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose} disabled={saveMutation.isPending}>
                        Batal
                    </Button>
                    <Button 
                        onClick={() => saveMutation.mutate()} 
                        disabled={saveMutation.isPending}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                        {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                        Simpan Hak Akses
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
