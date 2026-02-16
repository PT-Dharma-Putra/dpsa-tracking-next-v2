"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QrCode, ClipboardList, Package, PaintBucket, Hammer, Scissors } from "lucide-react"
import { ProductionQueue } from "@/features/production/components/production-queue"
import { useAuth } from "@/hooks/use-auth"

export default function ProductionDashboardPage() {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState("cutting")

    return (
        <div className="container mx-auto p-4 max-w-7xl space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Production Floor</h1>
                    <p className="text-muted-foreground">
                        Manage production queue and track item progress.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2">
                        <QrCode className="w-4 h-4" />
                        Scan Item
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="cutting" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
                    <TabsTrigger value="cutting" className="gap-2">
                        <Scissors className="w-4 h-4" />
                        <span className="hidden sm:inline">Cutting</span>
                    </TabsTrigger>
                    <TabsTrigger value="assembly" className="gap-2">
                        <Hammer className="w-4 h-4" />
                        <span className="hidden sm:inline">Assembly</span>
                    </TabsTrigger>
                    <TabsTrigger value="finishing" className="gap-2">
                        <PaintBucket className="w-4 h-4" />
                        <span className="hidden sm:inline">Finishing</span>
                    </TabsTrigger>
                    <TabsTrigger value="qc" className="gap-2">
                        <ClipboardList className="w-4 h-4" />
                        <span className="hidden sm:inline">QC</span>
                    </TabsTrigger>
                </TabsList>

                {/* Content for each tab */}
                <div className="mt-6">
                    <TabsContent value="cutting">
                        <ProductionQueue stage="cutting" />
                    </TabsContent>
                    <TabsContent value="assembly">
                        <ProductionQueue stage="assembly" />
                    </TabsContent>
                    <TabsContent value="finishing">
                        <ProductionQueue stage="finishing" />
                    </TabsContent>
                    <TabsContent value="qc">
                        <ProductionQueue stage="qc" />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}
