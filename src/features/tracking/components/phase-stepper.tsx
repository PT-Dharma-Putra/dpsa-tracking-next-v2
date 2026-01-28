import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface PhaseStepperProps {
    currentPhase: number; // 1-4
    className?: string;
    compact?: boolean;
}

const phases = [
    { id: 1, title: "Commercial", subtitle: "Deal & Design" },
    { id: 2, title: "Preparation", subtitle: "Plan & Material" },
    { id: 3, title: "Manufacturing", subtitle: "Produce & QC" },
    { id: 4, title: "Closing", subtitle: "Deliver & BAST" },
]

export function PhaseStepper({ currentPhase, className, compact = false }: PhaseStepperProps) {
    return (
        <div className={cn("w-full transition-all", compact ? "py-1 min-w-[400px]" : "py-4", className)}>
            <div className="relative flex items-center justify-between w-full mx-auto">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full bg-neutral-100 -z-10 transform -translate-y-1/2 rounded-full transition-all"
                    style={{ height: compact ? '2px' : '4px' }} />

                {/* Active Line (Dynamic Width) */}
                <div
                    className="absolute top-1/2 left-0 bg-orange-500 -z-10 transform -translate-y-1/2 transition-all duration-500 ease-in-out rounded-full"
                    style={{
                        width: `${((currentPhase - 1) / (phases.length - 1)) * 100}%`,
                        height: compact ? '2px' : '4px'
                    }}
                />

                {phases.map((phase) => {
                    const isCompleted = phase.id < currentPhase
                    const isActive = phase.id === currentPhase

                    return (
                        <div key={phase.id} className="flex flex-col items-center group relative bg-white px-2">
                            <div
                                className={cn(
                                    "flex items-center justify-center rounded-full border-2 transition-all duration-300 z-10",
                                    compact ? "w-6 h-6 border" : "w-8 h-8 border-2",
                                    isCompleted ? "bg-orange-500 border-orange-500 text-white" :
                                        isActive ? "bg-white border-orange-500 text-orange-500 shadow-sm" :
                                            "bg-white border-neutral-200 text-neutral-300"
                                )}
                            >
                                {isCompleted ? (
                                    <Check className={cn(compact ? "w-3 h-3" : "w-4 h-4")} />
                                ) : (
                                    <span className={cn("font-bold", compact ? "text-[10px]" : "text-xs")}>{phase.id}</span>
                                )}
                            </div>

                            <div className={cn(
                                "absolute flex flex-col items-center text-center transition-all duration-300",
                                compact ? "top-7 w-24" : "top-10 w-32"
                            )}>
                                <span className={cn(
                                    "font-bold truncate transition-colors",
                                    compact ? "text-[10px]" : "text-xs",
                                    isActive ? "text-orange-600" :
                                        isCompleted ? "text-neutral-900" : "text-neutral-400"
                                )}>
                                    {phase.title}
                                </span>
                                {!compact && (
                                    <span className="text-[10px] text-muted-foreground hidden md:block">
                                        {phase.subtitle}
                                    </span>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
