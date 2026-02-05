"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Save, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProjectService, Project } from "@/features/projects/services/project-service"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface ScheduleWidgetProps {
    project: Project;
}

export function ScheduleWidget({ project }: ScheduleWidgetProps) {
    const queryClient = useQueryClient();
    const [startDate, setStartDate] = useState<Date | undefined>(
        project.start_date ? new Date(project.start_date) : undefined
    );
    const [dueDate, setDueDate] = useState<Date | undefined>(
        project.due_date ? new Date(project.due_date) : undefined
    );

    const updateScheduleMutation = useMutation({
        mutationFn: async () => {
            return await ProjectService.updateProject(project.id, {
                start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
                due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null
            });
        },
        onSuccess: () => {
            toast.success("Project schedule updated");
            queryClient.invalidateQueries({ queryKey: ["project", project.id] });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update schedule");
        }
    });

    const hasChanges =
        (startDate?.toISOString() !== (project.start_date ? new Date(project.start_date).toISOString() : undefined)) ||
        (dueDate?.toISOString() !== (project.due_date ? new Date(project.due_date).toISOString() : undefined));

    return (
        <Card className="border-neutral-200 shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wide text-neutral-500 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Project Schedule
                </CardTitle>
                <CardDescription>
                    Define the production timeline.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Start Date */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-neutral-600 uppercase">Start Date</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !startDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={startDate}
                                    onSelect={setStartDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Due Date */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-neutral-600 uppercase">Deadline (Due Date)</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !dueDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={dueDate}
                                    onSelect={setDueDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button
                        size="sm"
                        onClick={() => updateScheduleMutation.mutate()}
                        disabled={!hasChanges || updateScheduleMutation.isPending}
                    >
                        {updateScheduleMutation.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-3 w-3" />
                                Save Schedule
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
