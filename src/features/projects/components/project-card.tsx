"use client";

import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight, User, Link2 } from "lucide-react";
import Link from "next/link";
import { Project } from "../services/project-service";
import { format } from "date-fns";

// Phase Labels Map
const PHASE_LABELS: Record<number, string> = {
    1: "Commercial & Design",
    2: "Preparation",
    3: "Manufacturing",
    4: "Closing",
};

// Phase Colors Map
const PHASE_COLORS: Record<number, "default" | "secondary" | "destructive" | "outline"> = {
    1: "outline", // Blue-ish usually
    2: "secondary", // Orange/Yellow
    3: "default", // Green/Primary
    4: "outline", // Gray
};

interface ProjectCardProps {
    project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
    const phaseName = PHASE_LABELS[project.current_phase] || "Unknown";
    const formattedDate = project.created_at
        ? format(new Date(project.created_at), "dd MMM yyyy")
        : "-";

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-bold line-clamp-1" title={project.name}>
                            {project.name}
                        </CardTitle>
                        <div className="flex items-center text-sm text-muted-foreground">
                            <User className="mr-1 h-3 w-3" />
                            {project.client?.name || "No Client"}
                        </div>
                    </div>
                    <Badge variant={PHASE_COLORS[project.current_phase] as any}>
                        Phase {project.current_phase}
                    </Badge>
                </div>
                {/* Addendum badge */}
                {project.is_addendum && (
                    <div className="flex items-center gap-1 text-xs text-blue-500">
                        <Link2 className="h-3 w-3" />
                        <span>ADD-{project.addendum_number}</span>
                    </div>
                )}
            </CardHeader>
            <CardContent className="space-y-4 pb-3">
                <div className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                    {project.description || "No description provided."}
                </div>

                <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                    <div className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3" />
                        Created: {formattedDate}
                    </div>
                </div>

                {/* Addendum count for parent projects */}
                {project.addendums && project.addendums.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Link2 className="h-3 w-3" />
                        {project.addendums.length} addendum(s)
                    </div>
                )}

                {/* Phase Progress Bar (Visual only for now) */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                        <span>{phaseName}</span>
                        <span className="text-muted-foreground">{project.status}</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary"
                            style={{ width: `${(project.current_phase / 4) * 100}%` }}
                        />
                    </div>
                </div>

            </CardContent>
            <CardFooter className="pt-2">
                <Link href={`/dashboard/tracking/${project.id}`} className="w-full">
                    <Button className="w-full" variant="outline">
                        View Workspace
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
}
