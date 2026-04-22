"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectService } from "@/features/projects/services/project-service";
import { JobService } from "@/features/production/services/job-service";
import { toast } from "sonner";
import { Loader2, Play, StopCircle, Clock, Search } from "lucide-react";

export default function OperatorTerminalPage() {
    const params = useParams();
    const projectId = params?.id as string;

    const [searchId, setSearchId] = useState("");
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [loadingAction, setLoadingAction] = useState(false);

    const [item, setItem] = useState<any>(null);
    const [activeJob, setActiveJob] = useState<any>(null);

    // SEARCH ITEM
    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchId || !projectId) return;

        setLoadingSearch(true);
        setItem(null);
        setActiveJob(null);

        try {
            // const response = await ProjectService.getItems(Number(projectId), searchId);
            const response = await ProjectService.getItems(Number(projectId));

            const found = response.data.find(
                (i: any) =>
                    i.id.toString() === searchId ||
                    i.item.toLowerCase().includes(searchId.toLowerCase())
            );

            if (!found) {
                toast.error("Item tidak ditemukan.");
                return;
            }

            setItem(found);

            if (found.current_job_id) {
                setActiveJob({
                    id: found.current_job_id,
                    status: "IN_PROGRESS",
                });
            }
        } catch (error) {
            console.error(error);
            toast.error("Gagal mencari item.");
        } finally {
            setLoadingSearch(false);
        }
    };

    // START JOB
    const handleStart = async () => {
        if (!item) return;

        setLoadingAction(true);
        try {
            const stage = item.current_stage || "CUTTING";

            const job = await JobService.startJob(
                item.id,
                stage,
                "Started via Terminal"
            );

            setActiveJob(job);
            toast.success("Pekerjaan dimulai!");

            await handleSearch(); // penting: await
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Gagal memulai job.");
        } finally {
            setLoadingAction(false);
        }
    };

    // FINISH JOB
    const handleFinish = async () => {
        if (!item) return;

        setLoadingAction(true);
        try {
            await JobService.finishJob(item.id, "Finished via Terminal");

            setActiveJob(null);
            toast.success("Pekerjaan selesai!");

            await handleSearch(); // penting: await
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Gagal menyelesaikan job.");
        } finally {
            setLoadingAction(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            {/* HEADER */}
            <div className="flex justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Operator Terminal</h1>
                    <p className="text-slate-500">
                        Scan atau masukkan ID Barang
                    </p>
                </div>
                <Badge variant="outline">
                    {new Date().toLocaleTimeString()}
                </Badge>
            </div>

            {/* SEARCH */}
            <Card>
                <CardContent className="p-6">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <Input
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                            placeholder="Masukkan ID Item"
                        />
                        <Button disabled={loadingSearch}>
                            {loadingSearch ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <Search />
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* ITEM */}
            {item && (
                <Card className={activeJob ? "border-green-500" : "border-blue-500"}>
                    <CardHeader>
                        <CardTitle>
                            Item #{item.id} - {item.item}
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div>
                            <p>Ruang: {item.ruang}</p>
                            <p>
                                Dimensi: {item.panjang} x {item.lebar} x{" "}
                                {item.tinggi} {item.satuan}
                            </p>
                        </div>

                        {activeJob ? (
                            <Button
                                onClick={handleFinish}
                                disabled={loadingAction}
                                className="w-full bg-red-600"
                            >
                                <StopCircle className="mr-2" />
                                STOP
                            </Button>
                        ) : (
                            <Button
                                onClick={handleStart}
                                disabled={loadingAction}
                                className="w-full bg-green-600"
                            >
                                <Play className="mr-2" />
                                START
                            </Button>
                        )}

                        {activeJob && (
                            <div className="text-center text-green-600 flex justify-center gap-2">
                                <Clock /> Timer berjalan...
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}