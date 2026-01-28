"use client"

import { usePathname } from "next/navigation"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import React from "react"

export function DashboardBreadcrumb() {
    const pathname = usePathname()

    // Split pathname into segments, removing empty strings
    const segments = pathname.split('/').filter(Boolean)

    // Map segments to readable names
    const getReadableName = (segment: string) => {
        // Capitalize first letter and replace hyphens
        return segment
            .replace(/-/g, ' ')
            .replace(/^\w/, (c) => c.toUpperCase())
    }

    // Don't show "Dashboard" twice if we are at root
    // segments[0] is usually "dashboard"

    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/dashboard">Internal</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />

                {segments.map((segment, index) => {
                    const isLast = index === segments.length - 1
                    const href = `/${segments.slice(0, index + 1).join('/')}`
                    const readableName = getReadableName(segment)

                    if (segment === 'dashboard') {
                        if (segments.length === 1) {
                            return (
                                <BreadcrumbItem key={href}>
                                    <BreadcrumbPage>Dashboard</BreadcrumbPage>
                                </BreadcrumbItem>
                            )
                        }
                        return (
                            <React.Fragment key={href}>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                            </React.Fragment>
                        )
                    }

                    return (
                        <React.Fragment key={href}>
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage>{readableName}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink href={href}>{readableName}</BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!isLast && <BreadcrumbSeparator />}
                        </React.Fragment>
                    )
                })}
            </BreadcrumbList>
        </Breadcrumb>
    )
}
