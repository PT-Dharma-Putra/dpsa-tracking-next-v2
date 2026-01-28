"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Upload, Users, FileText, Settings } from "lucide-react"
import { useAuthStore } from "@/lib/auth-store"

export function QuickActions() {
    const { user } = useAuthStore()
    const isAdmin = user?.roles?.some(r => r.name === 'SUPER_ADMIN' || r.name === 'ADMIN')

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
                <Link href="/dashboard/tracking/new">
                    <Button variant="outline" className="w-full justify-start h-10 border-dashed hover:border-orange-500 hover:text-orange-600">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Project
                    </Button>
                </Link>

                <Link href="/dashboard/mdl/import">
                    <Button variant="outline" className="w-full justify-start h-10">
                        <Upload className="mr-2 h-4 w-4" />
                        Import MDL Data
                    </Button>
                </Link>

                <Link href="/dashboard/mdl">
                    <Button variant="outline" className="w-full justify-start h-10">
                        <FileText className="mr-2 h-4 w-4" />
                        View Master List
                    </Button>
                </Link>

                {isAdmin && (
                    <Link href="/dashboard/users">
                        <Button variant="outline" className="w-full justify-start h-10 text-neutral-600">
                            <Users className="mr-2 h-4 w-4" />
                            Manage Users
                        </Button>
                    </Link>
                )}
            </CardContent>
        </Card>
    )
}
