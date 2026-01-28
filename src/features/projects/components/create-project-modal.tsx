"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ProjectService } from "../services/project-service";
import { ClientService } from "@/features/clients/services/client-service";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

const formSchema = z.object({
    name: z.string().min(3, "Project name must be at least 3 characters"),
    client_id: z.string().min(1, "Please select a client"),
    description: z.string().optional(),
    due_date: z.string().optional(),
});

export function CreateProjectModal() {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            client_id: "",
            description: "",
            due_date: "",
        },
    });

    // Fetch Clients
    const { data: clientsResponse, isLoading: clientsLoading } = useQuery({
        queryKey: ["clients"],
        queryFn: () => ClientService.getClients(),
    });

    // Create Mutation
    const mutation = useMutation({
        mutationFn: ProjectService.createProject,
        onSuccess: () => {
            toast.success("Project created successfully");
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            setOpen(false);
            form.reset();
        },
        onError: (error) => {
            toast.error("Failed to create project");
            console.error(error);
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        mutation.mutate(values);
    }

    const clients = clientsResponse?.data || [];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Project
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
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
                                        <Input placeholder="e.g. Villa Bali Renovation" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="client_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Client</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a client" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {clientsLoading ? (
                                                <SelectItem value="loading" disabled>
                                                    Loading clients...
                                                </SelectItem>
                                            ) : (
                                                clients.map((client: any) => (
                                                    <SelectItem key={client.id} value={client.id.toString()}>
                                                        {client.name}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
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
                                        <Textarea
                                            placeholder="Brief details about the project..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="due_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Target Deadline (Optional)</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending ? "Creating..." : "Create Project"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
