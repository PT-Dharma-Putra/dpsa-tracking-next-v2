"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import { 
    Search, 
    Plus, 
    Pencil, 
    Trash2, 
    MoreHorizontal,
    Loader2,
    Check,
    ChevronsUpDown,
    ArrowUpDown,
    ArrowDown,
    ArrowUp
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
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

import { projectV2Service, ProjectV2 } from "@/features/projects/services/project-v2-service"
import { ClientService } from "@/features/clients/services/client-service"
import { ProjectFormDialog } from "./project-form-dialog"

export function ProjectsV2Table({ 
    showSPD = false, 
    showPerencanaan = false,
    showProduksi = false,
    onlyShowDetail = false
}: { 
    showSPD?: boolean, 
    showPerencanaan?: boolean,
    showProduksi?: boolean,
    onlyShowDetail?: boolean
}) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [page, setPage] = React.useState(1)
    const [search, setSearch] = React.useState("")
    const [searchInput, setSearchInput] = React.useState("")
    const [clientId, setClientId] = React.useState<string>("all")
    const [sortBy, setSortBy] = React.useState<string>("created_at")
    const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc")
    
    const [isFormOpen, setIsFormOpen] = React.useState(false)
    const [selectedProject, setSelectedProject] = React.useState<ProjectV2 | null>(null)
    
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
    const [projectToDelete, setProjectToDelete] = React.useState<ProjectV2 | null>(null)

    // Debounce search
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput)
            setPage(1)
        }, 500)
        return () => clearTimeout(timer)
    }, [searchInput])

    const { data, isLoading } = useQuery({
        queryKey: ["projects-v2", page, search, clientId, sortBy, sortOrder],
        queryFn: () => projectV2Service.getProjects({
            page,
            search,
            client_id: clientId !== "all" ? clientId : undefined,
            sort_by: sortBy,
            sort_order: sortOrder
        }),
    })

    const [clientPopoverOpen, setClientPopoverOpen] = React.useState(false)
    const [clientSearch, setClientSearch] = React.useState("")
    const [debouncedClientSearch, setDebouncedClientSearch] = React.useState("")

    React.useEffect(() => {
        const timer = setTimeout(() => setDebouncedClientSearch(clientSearch), 500)
        return () => clearTimeout(timer)
    }, [clientSearch])

    const {
        data: clientsData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isLoadingClients,
    } = useInfiniteQuery({
        queryKey: ["clients", debouncedClientSearch],
        queryFn: ({ pageParam = 1 }) => ClientService.getClients({ page: pageParam, search: debouncedClientSearch }),
        getNextPageParam: (lastPage: any) => {
            const current_page = lastPage.meta?.current_page;
            const last_page = lastPage.meta?.last_page;
            return current_page < last_page ? current_page + 1 : undefined;
        },
        initialPageParam: 1,
    })

    const clientsRaw = clientsData?.pages.flatMap((page) => page.data) || []
    const clients = Array.from(new Map(clientsRaw.map((c: any) => [c.id, c])).values())

    const observerRef = React.useRef<IntersectionObserver>(null)
    const loadMoreRef = React.useCallback(
        (node: HTMLDivElement | null) => {
            if (isFetchingNextPage) return
            if (observerRef.current) observerRef.current.disconnect()
            
            observerRef.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasNextPage) {
                    fetchNextPage()
                }
            })
            
            if (node) observerRef.current.observe(node)
        },
        [isFetchingNextPage, hasNextPage, fetchNextPage]
    )

    const deleteMutation = useMutation({
        mutationFn: (id: number) => projectV2Service.deleteProject(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects-v2"] })
            toast.success("Project deleted successfully")
            setIsDeleteDialogOpen(false)
        },
        onError: () => {
            toast.error("Failed to delete project")
        }
    })

    const handleEdit = (project: ProjectV2) => {
        setSelectedProject(project)
        setIsFormOpen(true)
    }

    const handleCreate = () => {
        setSelectedProject(null)
        setIsFormOpen(true)
    }

    const handleDeleteClick = (project: ProjectV2) => {
        setProjectToDelete(project)
        setIsDeleteDialogOpen(true)
    }

    const confirmDelete = () => {
        if (projectToDelete) {
            deleteMutation.mutate(projectToDelete.id)
        }
    }

    const projects = data?.data || []

    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                <div className="flex flex-1 gap-2 items-center w-full sm:max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search projects..."
                            className="pl-8"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                    </div>
                    <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                className={cn("w-[200px] justify-between", !clientId && "text-muted-foreground")}
                            >
                                {clientId && clientId !== "all"
                                    ? clients.find((client) => client.id.toString() === clientId)?.name || "Select a client"
                                    : "All Clients"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                            <Command shouldFilter={false}>
                                <CommandInput 
                                    placeholder="Search clients..." 
                                    value={clientSearch}
                                    onValueChange={setClientSearch}
                                />
                                <CommandList>
                                    <CommandEmpty>
                                        {isLoadingClients ? 'Loading clients...' : 'No clients found.'}
                                    </CommandEmpty>
                                    <CommandGroup>
                                        <CommandItem
                                            value="all"
                                            onSelect={() => {
                                                setClientId("all");
                                                setPage(1);
                                                setClientPopoverOpen(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    clientId === "all" ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            All Clients
                                        </CommandItem>
                                        {clients.map((client) => (
                                            <CommandItem
                                                value={client.id.toString()}
                                                key={client.id}
                                                onSelect={() => {
                                                    setClientId(client.id.toString());
                                                    setPage(1);
                                                    setClientPopoverOpen(false);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        clientId === client.id.toString() ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {client.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                    {hasNextPage && (
                                        <div ref={loadMoreRef} className="py-4 flex justify-center items-center">
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                            <span className="ml-2 text-xs text-muted-foreground">Loading more...</span>
                                        </div>
                                    )}
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
                {!onlyShowDetail && (
                    <Button onClick={handleCreate} className="bg-orange-600 hover:bg-orange-700">
                        <Plus className="mr-2 h-4 w-4" />
                        New Project
                    </Button>
                )}
            </div>

            <div className="rounded-md border overflow-hidden">
                <Table>
                    <TableHeader className="bg-neutral-50">
                        <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>Project Name</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead 
                                className="cursor-pointer hover:bg-neutral-100 transition-colors group"
                                onClick={() => {
                                    if (sortBy === "deadline") {
                                        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                                    } else {
                                        setSortBy("deadline")
                                        setSortOrder("asc")
                                    }
                                    setPage(1)
                                }}
                            >
                                <div className="flex items-center gap-1">
                                    Deadline
                                    {sortBy === "deadline" ? (
                                        sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                    ) : (
                                        <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                                    )}
                                </div>
                            </TableHead>
                            <TableHead>SPK Number</TableHead>
                            {showSPD && (
                                <>
                                    <TableHead>SPD</TableHead>
                                    <TableHead>Desain</TableHead>
                                    <TableHead>List Furnitur</TableHead>
                                </>
                            )}
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center">
                                    <div className="flex items-center justify-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : projects.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                    No projects found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            projects.map((project, index) => (
                                <TableRow key={project.id}>
                                    <TableCell className="font-medium text-muted-foreground">
                                        {(page - 1) * 10 + index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">{project.name}</TableCell>
                                    <TableCell>{project.client?.name || "-"}</TableCell>
                                    <TableCell className="max-w-[200px] truncate">
                                        {project.description || <span className="text-muted-foreground italic">None</span>}
                                    </TableCell>
                                    <TableCell>
                                        {project.deadline ? format(new Date(project.deadline), "MMM d, yyyy") : "-"}
                                    </TableCell>
                                    <TableCell>{project.spk_number || project.spk?.nomor_spk || "-"}</TableCell>
                                    {showSPD && (
                                        <>
                                            <TableCell>
                                                {project.designs?.[0]?.spd_file ? (
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                                            Uploaded
                                                        </Badge>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-orange-600" asChild>
                                                            <a 
                                                                href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/storage/${project.designs[0].spd_file}`} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                            >
                                                                <ArrowDown className="h-3 w-3" />
                                                            </a>
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground italic text-[10px]">Not Uploaded</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {project.designs?.[0]?.design_progres && project.designs[0].design_progres.length > 0 ? (
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                        {project.designs[0].design_progres[project.designs[0].design_progres.length - 1].tahap_design?.nama}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-neutral-100 text-neutral-500 border-none font-normal">
                                                        Belum
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {project.list_furnitur ? (
                                                    <div className="flex items-center justify-center h-7 w-7 rounded-full bg-emerald-50 text-emerald-600 mx-auto">
                                                        <Check className="h-4 w-4" />
                                                    </div>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-neutral-100 text-neutral-500 border-none font-normal">
                                                        Belum
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </>
                                    )}
                                    <TableCell className="text-right">
                                        {onlyShowDetail ? (
                                            <div className="flex justify-end">
                                                {showSPD && (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="h-8 px-3 text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                                                        onClick={() => router.push(`/dashboard/projects-v2/perintah-kerja/${project.id}/detail`)}
                                                    >
                                                        Detail
                                                    </Button>
                                                )}
                                                {showPerencanaan && (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="h-8 px-3 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                                        onClick={() => router.push(`/dashboard/projects-v2/perencanaan/${project.id}/detail`)}
                                                    >
                                                        Detail
                                                    </Button>
                                                )}
                                                {showProduksi && (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="h-8 px-3 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                                                        onClick={() => router.push(`/dashboard/projects-v2/produksi/${project.id}/detail`)}
                                                    >
                                                        Detail
                                                    </Button>
                                                )}
                                            </div>
                                        ) : (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/projects-v2/${project.id}/items`)}>
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        Item
                                                    </DropdownMenuItem>
                                                    {showSPD && (
                                                        <DropdownMenuItem onClick={() => router.push(`/dashboard/projects-v2/perintah-kerja/${project.id}/detail`)}>
                                                            <Plus className="mr-2 h-4 w-4" />
                                                            Detail
                                                        </DropdownMenuItem>
                                                    )}
                                                    {showPerencanaan && (
                                                        <DropdownMenuItem onClick={() => router.push(`/dashboard/projects-v2/perencanaan/${project.id}/detail`)}>
                                                            <Plus className="mr-2 h-4 w-4" />
                                                            Detail
                                                        </DropdownMenuItem>
                                                    )}
                                                    {showProduksi && (
                                                        <DropdownMenuItem onClick={() => router.push(`/dashboard/projects-v2/produksi/${project.id}/detail`)}>
                                                            <Plus className="mr-2 h-4 w-4" />
                                                            Detail
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleEdit(project)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem 
                                                        className="text-red-600 focus:text-red-600"
                                                        onClick={() => handleDeleteClick(project)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {data && data.last_page > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </Button>
                    <div className="text-sm text-muted-foreground">
                        Page {page} of {data.last_page}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(data.last_page, p + 1))}
                        disabled={page === data.last_page}
                    >
                        Next
                    </Button>
                </div>
            )}

            <ProjectFormDialog 
                open={isFormOpen} 
                onOpenChange={setIsFormOpen} 
                project={selectedProject} 
            />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the project "{projectToDelete?.name}".
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
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
