"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectService } from "@/features/projects/services/project-service";
import { JobService } from "@/features/production/services/job-service";
import { toast } from "sonner";
import { Loader2, Play, StopCircle, Clock, Search } from "lucide-react";

export default function OperatorTerminalPage() {
    const params = useParams(); // Expect [id] for project
    const router = useRouter();
    const projectId = params.id as string;

    // State
    const [searchId, setSearchId] = useState("");
    const [loading, setLoading] = useState(false);
    const [item, setItem] = useState<any>(null);
    const [activeJob, setActiveJob] = useState<any>(null);

    // Fetch Item Details
    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchId) return;

        setLoading(true);
        setItem(null);
        setActiveJob(null);

        try {
            // We need a specific endpoint to find item by ID or Code. 
            // For now, let's assume we search match on 'item_id' or strict 'name'? 
            // Or better, let's fetch all items and filter (since we don't have a specific single item endpoint handy yet).
            // Optimization: Add GET /api/project-items/{id} later. 
            // Workaround: Use existing index with ?search=...

            // Wait, manual ID input usually implies the Primary ID or a specific Code.
            // Let's assume the user inputs the numeric ID for now (e.g. "105").

            // Actually, let's just use the ProjectService.getItems and filter client side for MVP 
            // or add a show method. Let's try to assume we can filter by ID if we pass it.

            const response = await ProjectService.getItems(Number(projectId), searchId);
            // Note: ProjectService.getItems takes (projectId, search). 
            // If the search is Omnisearch, it might return multiple.

            const found = response.data.find((i: any) => i.id.toString() === searchId || i.item.toLowerCase().includes(searchId.toLowerCase()));

            if (found) {
                setItem(found);
                // Check if item has active job locally (from current_job_id if we added it to API resource)
                // We added current_job_id to the model, so it should be in the JSON.
                if (found.current_job_id) {
                    // We might need to fetch the job details? 
                    // Or just know it's active.
                    setActiveJob({ id: found.current_job_id, status: 'IN_PROGRESS' });
                }
            } else {
                toast.error("Item tidak ditemukan.");
            }

        } catch (error) {
            console.error("Search error:", error);
            toast.error("Gagal mencari item.");
        } finally {
            setLoading(false);
        }
    };

    // Actions
    const handleStart = async () => {
        if (!item) return;
        setLoading(true);
        try {
            // Default stage? Or ask user?
            // "Skenario A": Operator is at a machine. Usually the tablet is fixed to a machine?
            // Or the operator selects "I am at Cutting".
            // Let's genericize: Auto-detect next stage? Or hardcode for now based on item current_stage?
            // If item is "PENDING" -> Cutting. 
            // If item is "Cutting" -> It's already there? No, stage means "Ready for...".
            // Let's assume we start whatever stage the item is currently assigned to.

            const stageToStart = item.current_stage || 'CUTTING';

            const job = await JobService.startJob(item.id, stageToStart, "Started via Terminal");
            setActiveJob(job);
            toast.success("Pekerjaan Dimulai!");

            // Refresh Item
            handleSearch();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Gagal memulai job.");
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = async () => {
        if (!item) return;
        setLoading(true);
        try {
            await JobService.finishJob(item.id, "Finished via Terminal");
            setActiveJob(null);
            toast.success("Pekerjaan Selesai!");
            // Refresh
            handleSearch();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Gagal menyelesaikan job.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Operator Terminal</h1>
                    <p className="text-slate-500">Scan atau masukkan ID Barang untuk mulai kerja.</p>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-1">
                    {new Date().toLocaleTimeString()}
                </Badge>
            </div>

            {/* SEARCH AREA */}
            <Card className="border-2 border-slate-200 shadow-sm">
                <CardContent className="p-8">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <Input
                            autoFocus
                            placeholder="Masukkan ID Item (Contoh: 105)"
                            className="text-2xl h-16"
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                        />
                        <Button type="submit" size="lg" className="h-16 px-8 text-xl" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <Search className="w-6 h-6 mr-2" />}
                            Cari
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* ITEM DETAILS & ACTIONS */}
            {item && (
                <Card className={`border-l-8 shadow-md ${activeJob ? 'border-l-emerald-500 bg-emerald-50/50' : 'border-l-blue-500'}`}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-4xl font-bold text-slate-800 mb-2">Item #{item.id}</CardTitle>
                                <h2 className="text-2xl font-medium text-slate-600">{item.item}</h2>
                            </div>
                            <div className="text-right">
                                <Badge className={`text-xl px-4 py-2 ${activeJob ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                                    {activeJob ? 'IN PROGRESS' : (item.current_stage || 'PENDING')}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="grid grid-cols-2 gap-4 text-lg bg-white/50 p-4 rounded-lg">
                            <div>
                                <span className="font-semibold block text-slate-500">Ruang:</span>
                                {item.ruang}
                            </div>
                            <div>
                                <span className="font-semibold block text-slate-500">Dimensi:</span>
                                {item.panjang} x {item.lebar} x {item.tinggi} {item.satuan}
                            </div>
                            <div className="col-span-2">
                                <span className="font-semibold block text-slate-500">Keterangan:</span>
                                {item.keterangan || "-"}
                            </div>
                        </div>

                        {/* BIG ACTION BUTTONS */}
                        <div className="flex gap-4 pt-4">
                            {activeJob ? (
                                <Button
                                    onClick={handleFinish}
                                    disabled={loading}
                                    className="w-full h-32 text-3xl font-bold bg-red-600 hover:bg-red-700 shadow-xl transition-all active:scale-[0.98]"
                                >
                                    <StopCircle className="w-12 h-12 mr-4" />
                                    STOP / FINISH
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleStart}
                                    disabled={loading}
                                    className="w-full h-32 text-3xl font-bold bg-emerald-600 hover:bg-emerald-700 shadow-xl transition-all active:scale-[0.98]"
                                >
                                    <Play className="w-12 h-12 mr-4" />
                                    START JOB
                                </Button>
                            )}
                        </div>

                        {activeJob && (
                            <div className="text-center animate-pulse text-emerald-700 font-medium flex items-center justify-center gap-2">
                                <Clock className="w-5 h-5" />
                                Timer berjalan...
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
