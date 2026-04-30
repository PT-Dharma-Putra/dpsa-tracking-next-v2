"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
    Plus, 
    Pencil, 
    Trash2, 
    MoreHorizontal,
    Loader2,
    ArrowLeft,
    Building2,
    User,
    Calendar,
    FileText
} from "lucide-react"
import { format } from "date-fns"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { toast } from "sonner"

import { projectV2Service, ProjectItemV2 } from "@/features/projects/services/project-v2-service"
import { ProjectItemFormDialog } from "../../_components/project-item-form-dialog"

export default function ProjectItemsPage() {
    const params = useParams()
    const router = useRouter()
    const queryClient = useQueryClient()
    const projectId = parseInt(params.id as string)

    const [isFormOpen, setIsFormOpen] = React.useState(false)
    const [selectedItem, setSelectedItem] = React.useState<ProjectItemV2 | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
    const [itemToDelete, setItemToDelete] = React.useState<ProjectItemV2 | null>(null)

    const { data: project, isLoading: isLoadingProject } = useQuery({
        queryKey: ["projects-v2", projectId],
        queryFn: () => projectV2Service.getProject(projectId),
    })

    const { data: items, isLoading: isLoadingItems } = useQuery({
        queryKey: ["project-v2-items", projectId],
        queryFn: () => projectV2Service.getProjectItems(projectId),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => projectV2Service.deleteProjectItem(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-v2-items", projectId] })
            toast.success("Item deleted successfully")
            setIsDeleteDialogOpen(false)
        },
        onError: () => {
            toast.error("Failed to delete item")
        }
    })

    const handleEdit = (item: ProjectItemV2) => {
        setSelectedItem(item)
        setIsFormOpen(true)
    }

    const handleAddItem = () => {
        setSelectedItem(null)
        setIsFormOpen(true)
    }

    const handleDeleteClick = (item: ProjectItemV2) => {
        setItemToDelete(item)
        setIsDeleteDialogOpen(true)
    }

    const confirmDelete = () => {
        if (itemToDelete) {
            deleteMutation.mutate(itemToDelete.id)
        }
    }

    if (isLoadingProject) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            </div>
        )
    }

    if (!project) {
        return <div className="p-8 text-center text-muted-foreground">Project not found.</div>
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">Project Items</h1>
            </div>

            <Card className="border-none shadow-sm bg-gradient-to-br from-white to-neutral-50/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-neutral-800">
                        <FileText className="h-5 w-5 text-orange-500" />
                        Project Details
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-1">
                            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Building2 className="h-4 w-4" /> Project Name
                            </div>
                            <p className="font-semibold text-neutral-900">{project.name}</p>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <User className="h-4 w-4" /> Client
                            </div>
                            <p className="font-semibold text-neutral-900">{project.client?.name || "-"}</p>
                        </div>
                        <div className="space-y-1 lg:col-span-1">
                            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Description
                            </div>
                            <p className="text-neutral-700">{project.description || "-"}</p>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4" /> Deadline
                            </div>
                            <p className="font-semibold text-neutral-900">
                                {project.deadline ? format(new Date(project.deadline), "MMM d, yyyy") : "-"}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Items List</h2>
                <Button onClick={handleAddItem} className="bg-orange-600 hover:bg-orange-700 shadow-sm transition-all hover:scale-[1.02]">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                </Button>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-neutral-50/80">
                        <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>Lantai</TableHead>
                            <TableHead>Ruang</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead>Keterangan</TableHead>
                            <TableHead>Vol</TableHead>
                            <TableHead>Size (P x L x T)</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead className="w-[80px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingItems ? (
                            <TableRow>
                                <TableCell colSpan={10} className="h-32 text-center">
                                    <div className="flex items-center justify-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : items?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="h-32 text-center text-muted-foreground font-medium">
                                    No items found. Click "Add Item" to start.
                                </TableCell>
                            </TableRow>
                        ) : (
                            items?.map((item, index) => (
                                <TableRow key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                                    <TableCell className="text-muted-foreground font-medium">{index + 1}</TableCell>
                                    <TableCell className="text-xs">{item.lantai || "-"}</TableCell>
                                    <TableCell className="text-xs max-w-[120px] truncate">{item.ruang || "-"}</TableCell>
                                    <TableCell className="font-semibold text-neutral-800 text-sm">{item.item}</TableCell>
                                    <TableCell className="max-w-[150px] truncate text-xs">{item.keterangan || "-"}</TableCell>
                                    <TableCell className="font-medium text-blue-600 text-sm">{item.volume || "-"}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {item.panjang || "-"} x {item.lebar || "-"} x {item.tinggi || "-"} {item.satuan}
                                    </TableCell>
                                    <TableCell className="font-medium text-sm">{item.jumlah}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-neutral-100">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-[160px]">
                                                <DropdownMenuItem onClick={() => handleEdit(item)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem 
                                                    className="text-red-600 focus:text-red-600"
                                                    onClick={() => handleDeleteClick(item)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
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

            <ProjectItemFormDialog 
                open={isFormOpen} 
                onOpenChange={setIsFormOpen} 
                projectId={projectId}
                item={selectedItem}
            />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the item "{itemToDelete?.item}".
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
