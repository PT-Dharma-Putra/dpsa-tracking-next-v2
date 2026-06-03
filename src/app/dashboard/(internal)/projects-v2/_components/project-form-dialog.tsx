"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import { CalendarIcon, Loader2, Check, ChevronsUpDown } from "lucide-react"
import { format } from "date-fns"
import { Label } from "@/components/ui/label"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    RadioGroup,
    RadioGroupItem,
} from "@/components/ui/radio-group"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { projectV2Service, ProjectV2 } from "@/features/projects/services/project-v2-service"
import { ClientService } from "@/features/clients/services/client-service"

const formSchema = z.object({
    name: z.string().min(1, "Project name is required"),
    client_id: z.string().min(1, "Client is required"),
    description: z.string().optional(),
    deadline: z.date().optional().nullable(),
    tanggal_selesai: z.date().optional().nullable(),
    need_design: z.number(),
})

type FormValues = z.infer<typeof formSchema>

interface ProjectFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    project?: ProjectV2 | null
}

export function ProjectFormDialog({ open, onOpenChange, project }: ProjectFormDialogProps) {
    const queryClient = useQueryClient()
    const isEdit = !!project

    const [clientPopoverOpen, setClientPopoverOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [debouncedSearch, setDebouncedSearch] = React.useState("")

    React.useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500)
        return () => clearTimeout(timer)
    }, [searchQuery])

    const {
        data: clientsData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isLoadingClients,
    } = useInfiniteQuery({
        queryKey: ["clients", debouncedSearch],
        queryFn: ({ pageParam = 1 }) => ClientService.getClients({ page: pageParam, search: debouncedSearch }),
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

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            client_id: "",
            description: "",
            deadline: null,
            tanggal_selesai: null,
            need_design: 1,
        },
    })

    React.useEffect(() => {
        if (open) {
            if (project) {
                form.reset({
                    name: project.name,
                    client_id: project.client_id.toString(),
                    description: project.description || "",
                    deadline: project.deadline ? new Date(project.deadline) : null,
                    tanggal_selesai: project.tanggal_selesai ? new Date(project.tanggal_selesai) : null,
                    need_design: project.need_design ?? 1,
                })
            } else {
                form.reset({
                    name: "",
                    client_id: "",
                    description: "",
                    deadline: null,
                    tanggal_selesai: null,
                    need_design: 1,
                })
            }
        }
    }, [open, project, form])

    const mutation = useMutation({
        mutationFn: async (values: FormValues) => {
            const payload = {
                name: values.name,
                client_id: parseInt(values.client_id),
                description: values.description,
                deadline: values.deadline ? format(values.deadline, "yyyy-MM-dd") : undefined,
                tanggal_selesai: values.tanggal_selesai ? format(values.tanggal_selesai, "yyyy-MM-dd") : null,
                need_design: values.need_design,
            }

            if (isEdit) {
                return projectV2Service.updateProject(project.id, payload)
            } else {
                return projectV2Service.createProject(payload)
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects-v2"] })
            toast.success(isEdit ? "Project updated successfully" : "Project created successfully")
            onOpenChange(false)
        },
        onError: (error) => {
            toast.error("Failed to save project")
            console.error(error)
        }
    })

    const onSubmit = (values: FormValues) => {
        mutation.mutate(values)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Project" : "Create Project"}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? "Update project details." : "Fill in the details to create a new project."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Project Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter project name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="client_id"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Client</FormLabel>
                                    <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    className={cn(
                                                        "w-full justify-between",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value && clients.length > 0
                                                        ? clients.find(
                                                              (client) => client.id.toString() === field.value
                                                          )?.name || "Select a client"
                                                        : "Select a client"}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[400px] p-0" align="start">
                                            <Command shouldFilter={false}>
                                                <CommandInput 
                                                    placeholder="Search clients..." 
                                                    value={searchQuery}
                                                    onValueChange={setSearchQuery}
                                                />
                                                <CommandList>
                                                    <CommandEmpty>
                                                        {isLoadingClients ? 'Loading clients...' : 'No clients found.'}
                                                    </CommandEmpty>
                                                    <CommandGroup>
                                                        {clients.map((client) => (
                                                            <CommandItem
                                                                value={client.id.toString()}
                                                                key={client.id}
                                                                onSelect={() => {
                                                                    field.onChange(client.id.toString());
                                                                    setClientPopoverOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        client.id.toString() === field.value
                                                                            ? "opacity-100"
                                                                            : "opacity-0"
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
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Optional description" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="deadline"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Deadline</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP")
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value || undefined}
                                                onSelect={field.onChange}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="need_design"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>Perlu Desain?</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={(val) => field.onChange(parseInt(val))}
                                            value={(field.value ?? 1).toString()}
                                            className="flex gap-4"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="1" id="design-ya" />
                                                <Label htmlFor="design-ya" className="font-normal cursor-pointer">Ya</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="0" id="design-tidak" />
                                                <Label htmlFor="design-tidak" className="font-normal cursor-pointer">Tidak</Label>
                                            </div>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEdit ? "Update" : "Create"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
