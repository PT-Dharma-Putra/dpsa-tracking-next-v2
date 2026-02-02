"use client"

import { FileText } from "lucide-react"

interface DocumentViewerProps {
    url: string | null | undefined
    title?: string
    emptyMessage?: string
}

export function DocumentViewer({ url, title = "Document", emptyMessage = "No document uploaded yet" }: DocumentViewerProps) {
    if (!url) {
        return (
            <div className="flex flex-col items-center justify-center h-[500px] bg-neutral-100 rounded-lg border border-neutral-200">
                <FileText className="h-16 w-16 text-neutral-300 mb-4" />
                <p className="text-neutral-500 text-sm">{emptyMessage}</p>
            </div>
        )
    }

    return (
        <div className="w-full h-[600px] bg-white rounded-lg border border-neutral-200 overflow-hidden">
            <iframe
                src={url}
                title={title}
                className="w-full h-full"
                style={{ border: "none" }}
            />
        </div>
    )
}
