"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, FileCheck, Truck, Receipt, Star, Download, Upload } from "lucide-react"

interface ClosingPhaseProps {
    project: any
}

export function ClosingPhase({ project }: ClosingPhaseProps) {
    // HARDCODED STEPS
    const closingSteps = [
        {
            id: 1,
            name: "Final QC & Packing",
            description: "All items checked and packed.",
            status: "completed",
            date: "24 Feb 2026",
            icon: <CheckCircle2 className="w-5 h-5" />
        },
        {
            id: 2,
            name: "Delivery / Shipment",
            description: "Surat Jalan created. Items loaded.",
            status: "pending",
            date: "-",
            icon: <Truck className="w-5 h-5" />
        },
        {
            id: 3,
            name: "Installation / Handover",
            description: "Installation at client site. BAST signed.",
            status: "pending",
            date: "-",
            icon: <FileCheck className="w-5 h-5" />
        },
        {
            id: 4,
            name: "Final Invoicing",
            description: "Remaining balance invoice sent.",
            status: "pending",
            date: "-",
            icon: <Receipt className="w-5 h-5" />
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold tracking-tight">Project Closing</h2>
                    <p className="text-sm text-neutral-500">Handover, delivery, and final documentation.</p>
                </div>
                <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download BAST Template
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Timeline */}
                <Card>
                    <CardHeader>
                        <CardTitle>Closing Checklist</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {closingSteps.map((step) => (
                                <div key={step.id} className="flex items-start gap-4">
                                    <div className={`p-2 rounded-full border ${step.status === 'completed' ? 'bg-green-50 border-green-200 text-green-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                        {step.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className={`font-medium ${step.status === 'completed' ? 'text-slate-900' : 'text-slate-500'}`}>{step.name}</h4>
                                            {step.status === 'completed' && <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Done</Badge>}
                                        </div>
                                        <p className="text-sm text-slate-500 mt-1">{step.description}</p>
                                        <p className="text-xs text-slate-400 mt-1">{step.date}</p>

                                        {/* PPIC Shipment UI for Delivery Step */}
                                        {step.name.includes('Delivery') && (
                                            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
                                                <h5 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                    <Truck className="w-4 h-4" /> Shipment Details (PPIC)
                                                </h5>
                                                <div className="grid grid-cols-1 gap-3">
                                                    <div>
                                                        <label className="text-xs font-medium text-slate-500">Driver / Logistics</label>
                                                        <input type="text" className="w-full text-sm border rounded px-2 py-1 mt-1" placeholder="e.g. Lalamove - B 1234 XYZ" />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-slate-500">Upload Delivery Photo</label>
                                                        <div className="border-2 border-dashed border-slate-300 rounded-md p-3 text-center cursor-pointer hover:bg-white transition-colors mt-1">
                                                            <Upload className="w-4 h-4 text-slate-400 mx-auto" />
                                                            <span className="text-[10px] text-slate-500">Photo Proof (Loaded)</span>
                                                        </div>
                                                    </div>
                                                    <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">Save Shipment Info</Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Docs Upload */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Handover Documents (BAST)</CardTitle>
                            <CardDescription>Upload signed BAST here to complete the project.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer">
                                <Upload className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm font-medium text-slate-700">Click to upload signed BAST</p>
                                <p className="text-xs text-slate-400 mt-1">PDF or JPG (Max 5MB)</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-50 border-blue-100">
                        <CardContent className="pt-6">
                            <div className="flex gap-4">
                                <Star className="w-10 h-10 text-blue-500" />
                                <div>
                                    <h4 className="font-semibold text-blue-800">Ready to Close?</h4>
                                    <p className="text-sm text-blue-600 mt-1">Once all steps are done and BAST is uploaded, you can mark this project as 100% Complete.</p>
                                    <Button className="mt-4 bg-blue-600 hover:bg-blue-700 w-full">Complete Project</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
