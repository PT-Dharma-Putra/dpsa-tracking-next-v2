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
    const getStatusColor = (status: string, isGradient = false) => {
        if (status.includes("Production")) return isGradient ? "from-blue-500 to-cyan-500" : "text-blue-700";
        if (status.includes("Design")) return isGradient ? "from-purple-500 to-pink-500" : "text-purple-700";
        if (status.includes("Done") || status.includes("Installed")) return isGradient ? "from-green-500 to-emerald-500" : "text-green-700";
        return isGradient ? "from-neutral-400 to-neutral-500" : "text-neutral-600";
    };

    return (
        <Card className="group overflow-hidden border-neutral-200 hover:border-orange-200 hover:shadow-lg transition-all duration-300 bg-white">
            {/* Header - No Image */}
            <div className={`h-2 bg-gradient-to-r ${getStatusColor(project.status, true)}`} />

            <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <Badge variant="outline" className={`border-none px-0 ${getStatusColor(project.status)} bg-transparent font-bold uppercase tracking-wider`}>
                            {project.status.replace(/_/g, " ")}
                        </Badge>
                        <h3 className="text-xl font-bold text-neutral-900 tracking-tight group-hover:text-orange-600 transition-colors">
                            {project.name}
                        </h3>
                    </div>
                    <div className="h-10 w-10 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-500">
                        <FileText className="h-5 w-5" />
                    </div>
                </div>
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
                    <Link href={`/dashboard/external/projects/${project.id}`} className="w-full">
                        <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white shadow-orange-200 shadow-md">
                            Review Design <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                ) : (
                    <Link href={`/dashboard/external/projects/${project.id}`} className="w-full">
                        <Button variant="outline" className="w-full border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50">
                            View Details
                        </Button>
                    </Link>
                )}
            </CardFooter>
        </Card>
    );
}
