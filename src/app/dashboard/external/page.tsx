"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ExternalDashboardPage() {
    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Customer Dashboard</h1>
                    <p className="text-muted-foreground">Monitor your project progress and status.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Active Projects</CardTitle>
                        <CardDescription>Projects currently in progress</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">0</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Pending Approvals</CardTitle>
                        <CardDescription>Documents waiting for your review</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">0</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
