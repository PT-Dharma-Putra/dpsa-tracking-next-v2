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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2, MoreHorizontal, Pencil, Trash2, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { adminService } from "@/features/admin/api/admin-service"
import { User } from "@/features/auth/types"
import { projectV2Service } from "@/features/projects/services/project-v2-service"
import { format } from "date-fns"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/use-debounce"

export function UserListTable() {
    const queryClient = useQueryClient()
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const debouncedSearch = useDebounce(search, 500)
    
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role_id: '',
        divisi_id: '',
        account_status: 'approved'
    })

    // Reset page when search changes
    useEffect(() => {
        setPage(1)
    }, [debouncedSearch])

    const { data: response, isLoading } = useQuery({
        queryKey: ['admin-users-all', page, debouncedSearch],
        queryFn: () => adminService.getAllUsers({ page, search: debouncedSearch }),
    })

    const users = response?.data || []
    const meta = response?.meta

    const { data: roles } = useQuery({
        queryKey: ['admin-roles'],
        queryFn: adminService.getRoles,
    })

    const { data: divisions } = useQuery({
        queryKey: ['admin-divisions'],
        queryFn: projectV2Service.getDivisions,
    })

    const createMutation = useMutation({
        mutationFn: (data: any) => adminService.createUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users-all'] })
            toast.success("User created successfully")
            closeDialog()
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create user")
        }
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => adminService.updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users-all'] })
            toast.success("User updated successfully")
            closeDialog()
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update user")
        }
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => adminService.deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users-all'] })
            toast.success("User deleted successfully")
            setIsDeleteDialogOpen(false)
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to delete user")
        }
    })

    const openCreateDialog = () => {
        setSelectedUser(null)
        setFormData({
            name: '',
            email: '',
            password: '',
            password_confirmation: '',
            role_id: '',
            divisi_id: '',
            account_status: 'approved'
        })
        setIsDialogOpen(true)
    }

    const openEditDialog = (user: any) => {
        setSelectedUser(user)
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            password_confirmation: '',
            role_id: user.role_id?.toString() || '',
            divisi_id: user.divisi_id?.toString() || '',
            account_status: user.account_status || 'approved'
        })
        setIsDialogOpen(true)
    }

    const closeDialog = () => {
        setIsDialogOpen(false)
        setSelectedUser(null)
    }

    const handleSubmit = () => {
        if (selectedUser) {
            updateMutation.mutate({ id: selectedUser.id, data: formData })
        } else {
            createMutation.mutate(formData)
        }
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
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input 
                        placeholder="Search users..." 
                        className="pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button onClick={openCreateDialog} className="bg-orange-600 hover:bg-orange-700">
                    <Plus className="w-4 h-4 mr-2" /> Add User
                </Button>
            </div>

            <div className="rounded-md border bg-white overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Division</TableHead>
                            <TableHead>Account Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <div className="flex justify-center"><Loader2 className="animate-spin text-orange-600" /></div>
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user: User, index: number) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium text-neutral-500">
                                        {(page - 1) * (meta?.per_page || 15) + index + 1}
                                    </TableCell>
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
                                    <TableCell>
                                        <Badge className={getStatusColor(user.account_status)}>
                                            {(user.account_status || 'unknown').toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    className="text-red-600"
                                                    onClick={() => {
                                                        setSelectedUser(user)
                                                        setIsDeleteDialogOpen(true)
                                                    }}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
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
                        Showing {(page - 1) * (meta?.per_page || 0) + 1} to {Math.min(page * (meta?.per_page || 0), meta?.total || 0)} of {meta?.total || 0} users
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
                        <AlertDialogTitle>{selectedUser ? 'Edit User' : 'Add New User'}</AlertDialogTitle>
                    </AlertDialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input 
                                id="name" 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input 
                                id="email" 
                                type="email"
                                value={formData.email} 
                                onChange={e => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input 
                                    id="password" 
                                    type="password"
                                    placeholder={selectedUser ? "Leave blank to keep same" : ""}
                                    value={formData.password} 
                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">Confirm</Label>
                                <Input 
                                    id="password_confirmation" 
                                    type="password"
                                    value={formData.password_confirmation} 
                                    onChange={e => setFormData({...formData, password_confirmation: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Role</Label>
                                <Select 
                                    value={formData.role_id} 
                                    onValueChange={val => setFormData({...formData, role_id: val})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles?.map((role: any) => (
                                            <SelectItem key={role.id} value={role.id.toString()}>{role.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Division</Label>
                                <Select 
                                    value={formData.divisi_id} 
                                    onValueChange={val => setFormData({...formData, divisi_id: val})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Divisi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {divisions?.map((div: any) => (
                                            <SelectItem key={div.id} value={div.id.toString()}>{div.nama}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Account Status</Label>
                            <Select 
                                value={formData.account_status} 
                                onValueChange={val => setFormData({...formData, account_status: val})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={closeDialog}>Cancel</AlertDialogCancel>
                        <Button 
                            disabled={createMutation.isPending || updateMutation.isPending}
                            onClick={handleSubmit} 
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {createMutation.isPending || updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            {selectedUser ? 'Update User' : 'Create User'}
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
                            This action will permanently delete user <strong>{selectedUser?.name}</strong>.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
                        <Button 
                            variant="destructive"
                            disabled={deleteMutation.isPending}
                            onClick={() => selectedUser && deleteMutation.mutate(selectedUser.id)}
                        >
                            {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Delete User
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
