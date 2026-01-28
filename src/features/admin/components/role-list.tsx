"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const SYSTEM_ROLES = [
    { name: 'Super-Admin', description: 'Full access to all system features.' },
    { name: 'Marketing', description: 'Can manage client projects and quotations (SPH).' },
    { name: 'Studio', description: 'Can upload designs and manage revisions.' },
    { name: 'Gudang', description: 'Manages inventory and warehouse items.' },
    { name: 'Produksi', description: 'Oversees production logs and progress.' },
    { name: 'Keuangan', description: 'Manages invoices, payments, and settlements.' },
    { name: 'Quality Control', description: 'Passes or rejects items based on quality.' },
    { name: 'PPIC', description: 'Production Planning and Inventory Control.' },
    { name: 'Client', description: 'External user, limited view of their own projects.' },
]

export function RoleList() {
    return (
        <div className="rounded-md border bg-white">
            <div className="p-4 border-b bg-neutral-50/50">
                <h3 className="font-semibold text-neutral-900">System Roles</h3>
                <p className="text-sm text-muted-foreground">List of available roles and their permissions.</p>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Role Name</TableHead>
                        <TableHead>Access Level</TableHead>
                        <TableHead>Description</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {SYSTEM_ROLES.map((role) => (
                        <TableRow key={role.name}>
                            <TableCell className="font-medium">
                                {role.name}
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary">
                                    {role.name === 'Super-Admin' ? 'System Root' : 'Service Role'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {role.description}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
