"use client"

import { useEffect, useState } from "react";
import { ProjectsV2Table } from "../projects-v2/_components/projects-v2-table";
import QuoteModal from "@/components/quoteModal";
import { useAuth } from "@/hooks/use-auth";

export default function AllProjectsPage() {
    const { user } = useAuth();
    const [showQuote, setShowQuote] = useState(false);
    
    useEffect(() => {
        if (typeof window !== "undefined") {
            const hasSeenQuote = sessionStorage.getItem("hasSeenQuote");
            if (!hasSeenQuote) {
                setShowQuote(true);
                sessionStorage.setItem("hasSeenQuote", "true");
            }
        }
    }, []);

    return (
        <div className="space-y-6 w-full max-w-full overflow-hidden">
            {showQuote && <QuoteModal username={user?.name || "User"} />}
            
            <div>
                <h1 className="text-2xl font-semibold tracking-tight pt-4">Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                    Manage and track all projects in one place.
                </p>
            </div>

            <ProjectsV2Table showAllDashboard={true} />
        </div>
    )
}
