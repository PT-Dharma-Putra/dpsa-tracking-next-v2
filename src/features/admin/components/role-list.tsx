"use client"

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
import { Input } from "@/components/ui/input"
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Loader2, MoreHorizontal, Pencil, Trash2, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { adminService } from "@/features/admin/api/admin-service"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/use-debounce"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"

export function RoleList() {
    const queryClient = useQueryClient()
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const debouncedSearch = useDebounce(search, 500)
    
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [selectedRole, setSelectedRole] = useState<any>(null)
    const [roleName, setRoleName] = useState('')

    // Reset page when search changes
    useEffect(() => {
        setPage(1)
    }, [debouncedSearch])

    const { data: response, isLoading } = useQuery({
        queryKey: ['admin-roles-paginated', page, debouncedSearch],
        queryFn: () => adminService.getRolesPaginated({ page, search: debouncedSearch }),
    })

    const roles = response?.data || []
    const meta = response

    const createMutation = useMutation({
        mutationFn: (data: { name: string }) => adminService.createRole(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-roles-paginated'] })
            queryClient.invalidateQueries({ queryKey: ['admin-roles'] })
            toast.success("Role created successfully")
            setIsDialogOpen(false)
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create role")
        }
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: { name: string } }) => adminService.updateRole(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-roles-paginated'] })
            queryClient.invalidateQueries({ queryKey: ['admin-roles'] })
            toast.success("Role updated successfully")
            setIsDialogOpen(false)
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update role")
        }
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => adminService.deleteRole(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-roles-paginated'] })
            queryClient.invalidateQueries({ queryKey: ['admin-roles'] })
            toast.success("Role deleted successfully")
            setIsDeleteDialogOpen(false)
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to delete role")
        }
    })

    const openCreateDialog = () => {
        setSelectedRole(null)
        setRoleName('')
        setIsDialogOpen(true)
    }

    const openEditDialog = (role: any) => {
        setSelectedRole(role)
        setRoleName(role.name)
        setIsDialogOpen(true)
    }

    const handleSubmit = () => {
        if (!roleName.trim()) return toast.error("Role name is required")
        
        if (selectedRole) {
            updateMutation.mutate({ id: selectedRole.id, data: { name: roleName } })
        } else {
            createMutation.mutate({ name: roleName })
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input 
                        placeholder="Search roles..." 
                        className="pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button onClick={openCreateDialog} className="bg-orange-600 hover:bg-orange-700">
                    <Plus className="w-4 h-4 mr-2" /> Add Role
                </Button>
            </div>

            <div className="rounded-md border bg-white overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>Role Name</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    <div className="flex justify-center"><Loader2 className="animate-spin text-orange-600" /></div>
                                </TableCell>
                            </TableRow>
                        ) : roles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No roles found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            roles.map((role: any, index: number) => (
                                <TableRow key={role.id}>
                                    <TableCell className="font-medium text-neutral-500">
                                        {(page - 1) * (meta?.per_page || 15) + index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {role.name}
                                    </TableCell>
                                    <TableCell className="text-sm text-neutral-500">
                                        {role.created_at ? format(new Date(role.created_at), 'dd MMM yyyy HH:mm') : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openEditDialog(role)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                {!['Super-Admin', 'Client'].includes(role.name) && (
                                                    <DropdownMenuItem 
                                                        className="text-red-600"
                                                        onClick={() => {
                                                            setSelectedRole(role)
                                                            setIsDeleteDialogOpen(true)
                                                        }}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-between px-2">
                    <div className="text-sm text-muted-foreground">
                        Showing {(page - 1) * meta.per_page + 1} to {Math.min(page * meta.per_page, meta.total)} of {meta.total} roles
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: meta.last_page }, (_, i) => i + 1).map((p) => (
                                <Button
                                    key={p}
                                    variant={page === p ? "default" : "outline"}
                                    size="sm"
                                    className={page === p ? "bg-orange-600 hover:bg-orange-700" : ""}
                                    onClick={() => setPage(p)}
                                >
                                    {p}
                                </Button>
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === meta.last_page}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Next <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Create/Edit Dialog */}
            <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{selectedRole ? 'Edit Role' : 'Add New Role'}</AlertDialogTitle>
                        <AlertDialogDescription>
                            Roles define groups of permissions in the system.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="roleName">Role Name</Label>
                            <Input 
                                id="roleName" 
                                placeholder="e.g. Production Manager"
                                value={roleName} 
                                onChange={e => setRoleName(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsDialogOpen(false)}>Cancel</AlertDialogCancel>
                        <Button 
                            disabled={createMutation.isPending || updateMutation.isPending}
                            onClick={handleSubmit} 
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {createMutation.isPending || updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            {selectedRole ? 'Update Role' : 'Create Role'}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will permanently delete the role <strong>{selectedRole?.name}</strong>.
                            It will also be removed from the permissions system.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
                        <Button 
                            variant="destructive"
                            disabled={deleteMutation.isPending}
                            onClick={() => deleteMutation.mutate(selectedRole.id)}
                        >
                            {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Delete Role
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
