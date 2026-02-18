"use client"

import { useState, use } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { QrCode, ClipboardList, Package, PaintBucket, Hammer, Scissors, ArrowLeft, Layers, BoxSelect, Drill } from "lucide-react"
import { ProductionQueue } from "@/features/production/components/production-queue"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"

export default function ProjectProductionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState("cutting")

    return (
        <div className="container mx-auto p-4 max-w-7xl space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/tracking/${id}`}>
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Project Production Floor</h1>
                        <p className="text-muted-foreground">
                            Managing production queue for Project ID: #{id}
                        </p>
                    </div>
                </div>
                {/* 
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2">
                        <QrCode className="w-4 h-4" />
                        Scan Item
                    </Button>
                </div>
                */}
            </div>

            <Tabs defaultValue="cutting" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="flex w-full overflow-x-auto justify-start no-scrollbar snap-x">
                    <TabsTrigger value="cutting" className="gap-2 min-w-[100px]">
                        <Scissors className="w-4 h-4" />
                        <span className="hidden sm:inline">Cutting</span>
                    </TabsTrigger>
                    <TabsTrigger value="lamination" className="gap-2 min-w-[100px]">
                        <Layers className="w-4 h-4" />
                        <span className="hidden sm:inline">Lamination</span>
                    </TabsTrigger>
                    <TabsTrigger value="edging" className="gap-2 min-w-[100px]">
                        <BoxSelect className="w-4 h-4" />
                        <span className="hidden sm:inline">Edging</span>
                    </TabsTrigger>
                    <TabsTrigger value="cnc" className="gap-2 min-w-[100px]">
                        <Drill className="w-4 h-4" />
                        <span className="hidden sm:inline">CNC</span>
                    </TabsTrigger>
                    <TabsTrigger value="assembly" className="gap-2 min-w-[100px]">
                        <Hammer className="w-4 h-4" />
                        <span className="hidden sm:inline">Assembly</span>
                    </TabsTrigger>
                    <TabsTrigger value="finishing" className="gap-2 min-w-[100px]">
                        <PaintBucket className="w-4 h-4" />
                        <span className="hidden sm:inline">Finishing</span>
                    </TabsTrigger>
                    <TabsTrigger value="qc" className="gap-2 min-w-[100px]">
                        <ClipboardList className="w-4 h-4" />
                        <span className="hidden sm:inline">QC</span>
                    </TabsTrigger>
                </TabsList>

                {/* Content for each tab */}
                <div className="mt-6">
                    <TabsContent value="cutting">
                        <ProductionQueue stage="cutting" projectId={id} />
                    </TabsContent>
                    <TabsContent value="lamination">
                        <ProductionQueue stage="lamination" projectId={id} />
                    </TabsContent>
                    <TabsContent value="edging">
                        <ProductionQueue stage="edging" projectId={id} />
                    </TabsContent>
                    <TabsContent value="cnc">
                        <ProductionQueue stage="cnc" projectId={id} />
                    </TabsContent>
                    <TabsContent value="assembly">
                        <ProductionQueue stage="assembly" projectId={id} />
                    </TabsContent>
                    <TabsContent value="finishing">
                        <ProductionQueue stage="finishing" projectId={id} />
                    </TabsContent>
                    <TabsContent value="qc">
                        <ProductionQueue stage="qc" projectId={id} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}
