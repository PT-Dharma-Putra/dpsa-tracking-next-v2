import { useState, useRef } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ProjectService } from "@/features/projects/services/project-service"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
    CheckCircle2, Clock, AlertCircle, Play, Package, 
    Loader, Calendar, Wrench, Camera, FileCheck, 
    X, ImagePlus, Loader2, Lock, ChevronRight, Check
} from "lucide-react"
import Link from "next/link"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

interface ManufacturingPhaseProps {
    project: any
}

export function ManufacturingPhase({ project }: ManufacturingPhaseProps) {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showQcModal, setShowQcModal] = useState(false);
    const [qcPhoto, setQcPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [qcNotes, setQcNotes] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const isPhaseComplete = project.current_phase > 3;

    const [checklist, setChecklist] = useState({
        dimensions: true,
        edging: true,
        finish: true,
        functionality: false
    });

    // HARDCODED STATUS FOR DEMO (Moved to state to allow updates)
    const [productionStatus, setProductionStatus] = useState([
        { id: 1, name: "Cutting", status: "completed", progress: 100, operator: "Budi", time: "2h 30m" },
        { id: 2, name: "Lamination", status: "completed", progress: 100, operator: "Asep", time: "4h 15m" },
        { id: 3, name: "Edging", status: "completed", progress: 100, operator: "Ujang", time: "3h 45m" },
        { id: 4, name: "CNC / Drilling", status: "completed", progress: 100, operator: "Doni", time: "5h 20m" },
        { id: 5, name: "Assembly", status: "completed", progress: 100, operator: "Eko", time: "8h 10m" },
        { id: 6, name: "Finishing", status: "completed", progress: 100, operator: "Fajar", time: "4h 50m" },
        { id: 7, name: "QC", status: "pending", progress: 0, operator: "-", time: "-" },
    ]);

    const [isQCPassed, setIsQCPassed] = useState(false);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setQcPhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePhoto = (e: React.MouseEvent) => {
        e.stopPropagation();
        setQcPhoto(null);
        setPhotoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleApproveQC = async () => {
        if (!qcPhoto) {
            toast.error("Photo Proof Required", {
                description: "Please upload a photo of the item to pass QC verification."
            });
            return;
        }

        setIsSubmitting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        toast.success("QC Passed Successfully", {
            description: "The item has been approved and moved to the next phase."
        });
        
        // Update Local State for UI feedback
        setProductionStatus(prev => prev.map(s => 
            s.name === 'QC' ? { ...s, status: 'completed', progress: 100, operator: "Inspector", time: "Just now" } : s
        ));
        setIsQCPassed(true);
        
        setIsSubmitting(false);
        setShowQcModal(false);
    };

    // Advance Phase
    const advanceMutation = useMutation({
        mutationFn: async () => ProjectService.advancePhase(project.id, false),
        onSuccess: () => {
            toast.success("Phase 3 Completed! Project ready for Delivery.");
            queryClient.invalidateQueries({ queryKey: ["project", project.id] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to advance phase");
        }
    });

    // Gate requirements
    const isProductionComplete = productionStatus.filter(s => s.name !== 'QC').every(s => s.status === 'completed');
    const canAdvance = isProductionComplete && isQCPassed;

    return (
        <div className="space-y-6">
            {/* Header / Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-emerald-50 border-emerald-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-800">Production Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-emerald-600" />
                            <span className="text-2xl font-bold text-emerald-700">In Progress</span>
                        </div>
                        <p className="text-xs text-emerald-600 mt-1">On Schedule</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Total Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-slate-400" />
                            <span className="text-2xl font-bold text-slate-700">{project.items?.length || 12}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Items in Production</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Estimated Completion</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-slate-400" />
                            <span className="text-2xl font-bold text-slate-700">24 Feb 2026</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">5 Days Remaining</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT: Workflow Timeline (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Manufacturing Workflow</CardTitle>
                                    <CardDescription>Real-time progress of production stages</CardDescription>
                                </div>
                                <Link href={`/dashboard/tracking/${project.id}/production`}>
                                    <Button className="bg-blue-600 hover:bg-blue-700">
                                        <Wrench className="w-4 h-4 mr-2" />
                                        Go to Production Floor
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="relative space-y-0">
                                {productionStatus.map((stage, index) => (
                                    <div key={stage.id} className="flex gap-4 pb-8 last:pb-0 relative">
                                        {/* Connector Line */}
                                        {index !== productionStatus.length - 1 && (
                                            <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-slate-100" />
                                        )}

                                        {/* Icon / Status */}
                                        <div className={`relative z-10 flex cursor-default h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 ${getStatusColor(stage.status)}`}>
                                            {getStatusIcon(stage.status)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 pt-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <div>
                                                    <h4 className="font-semibold text-lg text-slate-800">{stage.name}</h4>

                                                    {/* QC Verification UI */}
                                                    {stage.name === 'QC' && (
                                                        <div className="mt-2">
                                                            <Dialog open={showQcModal} onOpenChange={setShowQcModal}>
                                                                <DialogTrigger asChild>
                                                                    <Button 
                                                                        size="sm" 
                                                                        variant="outline" 
                                                                        className={`gap-2 ${stage.status === 'completed' ? 'text-slate-400' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}
                                                                        disabled={stage.status === 'completed'}
                                                                    >
                                                                        <FileCheck className="w-4 h-4" />
                                                                        {stage.status === 'completed' ? 'QC Verified' : 'QC Verification Form'}
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent className="sm:max-w-md">
                                                                    <DialogHeader>
                                                                        <DialogTitle>QC Verification Checklist</DialogTitle>
                                                                        <DialogDescription>
                                                                            Complete the checklist and upload photo proof to pass QC.
                                                                        </DialogDescription>
                                                                    </DialogHeader>
                                                                    <div className="space-y-4 py-4">
                                                                        <div className="space-y-2">
                                                                            <div className="flex items-center gap-2 p-2 border rounded-md bg-slate-50">
                                                                                <input 
                                                                                    type="checkbox" 
                                                                                    checked={checklist.dimensions} 
                                                                                    onChange={(e) => setChecklist(prev => ({ ...prev, dimensions: e.target.checked }))}
                                                                                    className="h-4 w-4 text-emerald-600 rounded cursor-pointer" 
                                                                                />
                                                                                <label className="text-sm font-medium cursor-pointer" onClick={() => setChecklist(prev => ({ ...prev, dimensions: !prev.dimensions }))}>Dimension Check (P x L x T)</label>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 p-2 border rounded-md bg-slate-50">
                                                                                <input 
                                                                                    type="checkbox" 
                                                                                    checked={checklist.edging} 
                                                                                    onChange={(e) => setChecklist(prev => ({ ...prev, edging: e.target.checked }))}
                                                                                    className="h-4 w-4 text-emerald-600 rounded cursor-pointer" 
                                                                                />
                                                                                <label className="text-sm font-medium cursor-pointer" onClick={() => setChecklist(prev => ({ ...prev, edging: !prev.edging }))}>Edging Quality & Bonding</label>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 p-2 border rounded-md bg-slate-50">
                                                                                <input 
                                                                                    type="checkbox" 
                                                                                    checked={checklist.finish} 
                                                                                    onChange={(e) => setChecklist(prev => ({ ...prev, finish: e.target.checked }))}
                                                                                    className="h-4 w-4 text-emerald-600 rounded cursor-pointer" 
                                                                                />
                                                                                <label className="text-sm font-medium cursor-pointer" onClick={() => setChecklist(prev => ({ ...prev, finish: !prev.finish }))}>Surface Finish (Clean & Smooth)</label>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 p-2 border rounded-md bg-slate-50">
                                                                                <input 
                                                                                    type="checkbox" 
                                                                                    checked={checklist.functionality} 
                                                                                    onChange={(e) => setChecklist(prev => ({ ...prev, functionality: e.target.checked }))}
                                                                                    className="h-4 w-4 text-emerald-600 rounded cursor-pointer" 
                                                                                />
                                                                                <label className="text-sm font-medium cursor-pointer" onClick={() => setChecklist(prev => ({ ...prev, functionality: !prev.functionality }))}>Functionality (Hinges/Drawers)</label>
                                                                            </div>
                                                                        </div>

                                                                        <div className="space-y-2">
                                                                            <label className="text-sm font-medium">Upload Photo Proof (Required)</label>
                                                                            <input 
                                                                                type="file" 
                                                                                ref={fileInputRef}
                                                                                className="hidden" 
                                                                                accept="image/*"
                                                                                onChange={handlePhotoChange}
                                                                            />
                                                                            <div 
                                                                                onClick={() => fileInputRef.current?.click()}
                                                                                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                                                                                    photoPreview ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 hover:bg-slate-50'
                                                                                }`}
                                                                            >
                                                                                {photoPreview ? (
                                                                                    <div className="relative aspect-video w-full max-h-[200px] rounded-lg overflow-hidden group">
                                                                                        <img src={photoPreview} alt="QC Preview" className="w-full h-full object-cover" />
                                                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                                            <Button 
                                                                                                size="sm" 
                                                                                                variant="destructive" 
                                                                                                className="h-8 w-8 p-0 rounded-full"
                                                                                                onClick={handleRemovePhoto}
                                                                                            >
                                                                                                <X className="w-4 h-4" />
                                                                                            </Button>
                                                                                        </div>
                                                                                        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                                                                                            <CheckCircle2 className="w-3 h-3" />
                                                                                            Photo Captured
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <>
                                                                                        <Camera className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                                                                        <span className="text-xs text-slate-500">Click to capture/upload QC photo</span>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <div className="space-y-2">
                                                                            <label className="text-sm font-medium">QC Notes</label>
                                                                            <textarea 
                                                                                className="w-full min-h-[80px] p-2 text-sm border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" 
                                                                                placeholder="Enter specific notes or defects found..."
                                                                                value={qcNotes}
                                                                                onChange={(e) => setQcNotes(e.target.value)}
                                                                            ></textarea>
                                                                        </div>
                                                                    </div>
                                                                    <DialogFooter>
                                                                        <Button variant="outline" onClick={() => {
                                                                            // Simple reset for draft
                                                                            toast.info("Draft Saved", { description: "You can continue this verification later." });
                                                                        }}>Save Draft</Button>
                                                                        <Button 
                                                                            className="bg-emerald-600 hover:bg-emerald-700 min-w-[140px]"
                                                                            onClick={handleApproveQC}
                                                                            disabled={isSubmitting}
                                                                        >
                                                                            {isSubmitting ? (
                                                                                <>
                                                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                                    Processing...
                                                                                </>
                                                                            ) : "Approve & Pass QC"}
                                                                        </Button>
                                                                    </DialogFooter>
                                                                </DialogContent>
                                                            </Dialog>
                                                        </div>
                                                    )}
                                                </div>

                                                <Badge 
                                                    variant={stage.status === 'completed' ? 'default' : (stage.status === 'in_progress' ? 'secondary' : 'outline')}
                                                    className={stage.status === 'completed' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                                                >
                                                    {stage.status === 'in_progress' ? 'Running' : (stage.status === 'completed' ? 'Complete' : stage.status)}
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <div>
                                                    <span className="block text-slate-400 text-xs">Progress</span>
                                                    <span className="font-medium text-slate-700">{stage.progress}%</span>
                                                </div>
                                                <div>
                                                    <span className="block text-slate-400 text-xs">Operator</span>
                                                    <span className="font-medium text-slate-700">{stage.operator}</span>
                                                </div>
                                                <div className="col-span-2 md:col-span-2">
                                                    <span className="block text-slate-400 text-xs">Duration/Time</span>
                                                    <span className="font-medium text-slate-700">{stage.time}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT: Phase Gate (1/3) */}
                <div className="space-y-6">
                    <Card className="bg-neutral-900 text-white border-none shadow-lg sticky top-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="h-4 w-4 text-orange-500" />
                                Phase Gate
                            </CardTitle>
                            <CardDescription className="text-neutral-400">
                                Requirements to advance to Phase 4 (Delivery).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <GateRequirement label="Production Complete" met={isProductionComplete} />
                                <GateRequirement label="QC Verification" met={isQCPassed} />
                            </div>

                            <Separator className="bg-neutral-800" />

                            <div className="pt-2">
                                {!isPhaseComplete ? (
                                    <Button
                                        className="w-full bg-orange-600 hover:bg-orange-700 font-bold text-white disabled:opacity-40"
                                        onClick={() => advanceMutation.mutate()}
                                        disabled={advanceMutation.isPending || !canAdvance}
                                    >
                                        {advanceMutation.isPending ? "Processing..." : "Mark Manufacturing Complete"}
                                    </Button>
                                ) : (
                                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white" disabled>
                                        Phase 3 Completed
                                    </Button>
                                )}
                                {!canAdvance && !isPhaseComplete && (
                                    <p className="text-[10px] text-neutral-500 text-center mt-3">
                                        Complete all gate requirements above to proceed.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}


function GateRequirement({ label, met }: { label: string; met: boolean }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-300">{label}</span>
            {met ? (
                <span className="flex items-center text-green-500 text-xs font-bold">
                    <Check className="h-3 w-3 mr-1" /> OK
                </span>
            ) : (
                <span className="flex items-center text-neutral-500 text-xs text-right">
                    <AlertCircle className="h-3 w-3 mr-1" /> Pending
                </span>
            )}
        </div>
    );
}

function getStatusColor(status: string) {
    switch (status) {
        case 'completed': return 'bg-emerald-100 border-emerald-500 text-emerald-600';
        case 'in_progress': return 'bg-blue-100 border-blue-500 text-blue-600';
        default: return 'bg-slate-50 border-slate-200 text-slate-300';
    }
}

function getStatusIcon(status: string) {
    switch (status) {
        case 'completed': return <CheckCircle2 className="w-6 h-6" />;
        case 'in_progress': return <Play className="w-5 h-5 animate-pulse" />;
        default: return <Clock className="w-5 h-5" />;
    }
}
