import Link from "next/link";
import { ArrowRight, Clock, FileText, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface Project {
    id: number;
    name: string;
    status: string;
    progress: number;
    thumbnail?: string | null;
    description?: string | null;
}

export function ClientProjectCard({ project }: { project: Project }) {
    const isActionRequired = project.status.includes("Review") || project.status.includes("Approval");

    // Helper for status color
    const getStatusColor = (status: string) => {
        if (status.includes("Production")) return "bg-blue-100 text-blue-700 border-blue-200";
        if (status.includes("Design")) return "bg-purple-100 text-purple-700 border-purple-200";
        if (status.includes("Done") || status.includes("Installed")) return "bg-green-100 text-green-700 border-green-200";
        return "bg-neutral-100 text-neutral-600 border-neutral-200";
    };

    return (
        <Card className="group overflow-hidden border-neutral-200 hover:border-orange-200 hover:shadow-lg transition-all duration-300 bg-white">
            {/* Thumbnail Header */}
            <div className="h-48 bg-neutral-100 relative overflow-hidden">
                {/* Placeholder or Image */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                {project.thumbnail ? (
                    <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-300 bg-neutral-50">
                        <FileText className="h-12 w-12 opacity-20" />
                    </div>
                )}

                <div className="absolute bottom-4 left-4 z-20">
                    <Badge variant="outline" className={`bg-white/90 backdrop-blur border-none mb-2 ${getStatusColor(project.status)}`}>
                        {project.status.replace(/_/g, " ")}
                    </Badge>
                    <h3 className="text-xl font-bold text-white tracking-tight drop-shadow-md">{project.name}</h3>
                </div>
            </div>

            <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-neutral-500 font-medium">Overall Progress</span>
                        <span className="text-neutral-900 font-bold">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" indicatorClassName={project.progress === 100 ? "bg-green-500" : "bg-orange-500"} />
                </div>

                {project.description && (
                    <p className="text-sm text-neutral-500 line-clamp-2">{project.description}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-neutral-400">
                    <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Last updated 2h ago</span>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-6 pt-0">
                {isActionRequired ? (
                    <Link href={`/dashboard/client/projects/${project.id}`} className="w-full">
                        <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white shadow-orange-200 shadow-md">
                            Review Design <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                ) : (
                    <Link href={`/dashboard/client/projects/${project.id}`} className="w-full">
                        <Button variant="outline" className="w-full border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50">
                            View Details
                        </Button>
                    </Link>
                )}
            </CardFooter>
        </Card>
    );
}
