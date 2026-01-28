"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserApprovalTable } from "@/features/admin/components/user-approval-table"
import { UserListTable } from "@/features/admin/components/user-list-table"
import { RoleList } from "@/features/admin/components/role-list"
import { Users } from "lucide-react"

export default function UserManagementPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg text-orange-600">
                    <Users className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900">User Management</h1>
                    <p className="text-muted-foreground">Manage user registrations and access control.</p>
                </div>
            </div>

            <Tabs defaultValue="pending" className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <TabsList>
                        <TabsTrigger value="pending">Pending Requests</TabsTrigger>
                        <TabsTrigger value="all">All Users</TabsTrigger>
                        <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="pending" className="space-y-4">
                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg text-sm text-orange-800 mb-4">
                        <strong>Pending Users:</strong> Review and approve new staff accounts here. They cannot login until approved.
                    </div>
                    <UserApprovalTable />
                </TabsContent>

                <TabsContent value="all">
                    <UserListTable />
                </TabsContent>

                <TabsContent value="roles">
                    <RoleList />
                </TabsContent>
            </Tabs>
        </div>
    )
}
