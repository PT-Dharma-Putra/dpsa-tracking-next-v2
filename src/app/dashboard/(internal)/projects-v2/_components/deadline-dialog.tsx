"use client"

import * as React from "react"
import { format } from "date-fns"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CalendarIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { projectV2Service, ProjectV2 } from "@/features/projects/services/project-v2-service"

interface DeadlineDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    project: ProjectV2 | null
}

export function DeadlineDialog({ open, onOpenChange, project }: DeadlineDialogProps) {
    const queryClient = useQueryClient()
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined)

    React.useEffect(() => {
        if (open && project) {
            setSelectedDate(project.deadline ? new Date(project.deadline) : undefined)
        } else {
            setSelectedDate(undefined)
        }
    }, [open, project])

    const mutation = useMutation({
        mutationFn: async (date: Date | undefined) => {
            if (!project) return;
            const payload = {
                name: project.name,
                client_id: project.client_id,
                description: project.description || undefined,
                deadline: date ? format(date, "yyyy-MM-dd") : undefined,
                tanggal_selesai: project.tanggal_selesai ? format(new Date(project.tanggal_selesai), "yyyy-MM-dd") : null,
                need_design: project.need_design ?? 1,
            }
            return projectV2Service.updateProject(project.id, payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects-v2"] })
            toast.success("Deadline updated successfully")
            onOpenChange(false)
        },
        onError: (error) => {
            toast.error("Failed to update deadline")
            console.error(error)
        }
    })

    const handleSave = () => {
        mutation.mutate(selectedDate)
    }

    if (!project) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] rounded-xl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-neutral-900">Ubah Deadline</DialogTitle>
                    <DialogDescription className="text-neutral-500 text-sm">
                        Ubah batas waktu penyelesaian untuk project <strong className="text-neutral-700 font-semibold">{project.name}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Deadline Baru</label>
                        <Popover modal>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full pl-3 text-left font-normal border-neutral-200 hover:border-neutral-300 h-10 rounded-lg shadow-sm flex items-center justify-between",
                                        !selectedDate && "text-muted-foreground"
                                    )}
                                >
                                    {selectedDate ? (
                                        format(selectedDate, "PPP")
                                    ) : (
                                        <span>Pilih tanggal</span>
                                    )}
                                    <CalendarIcon className="h-4 w-4 text-neutral-400" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => onOpenChange(false)}
                        className="rounded-lg"
                    >
                        Batal
                    </Button>
                    <Button 
                        type="button" 
                        onClick={handleSave} 
                        disabled={mutation.isPending}
                        className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-sm"
                    >
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Simpan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
