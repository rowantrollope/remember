"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

export interface ApiPageHeaderProps {
    endpoint: string
    hasMessages: boolean
    onClearChat: () => void
    isLoading?: boolean
}

export function ApiPageHeader({
    endpoint,
    hasMessages,
    onClearChat,
    isLoading = false
}: ApiPageHeaderProps) {
    return (
        <div className="flex-shrink-0 bg-white pb-2 flex justify-between items-center">
            {hasMessages ? (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onClearChat}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={isLoading}
                >
                    <Trash2 className="w-4 h-4" />
                    Clear History
                </Button>
            ) : (
                <div></div>
            )}
            <div className="font-mono text-sm text-muted-foreground">
                {endpoint}
            </div>
        </div>
    )
}
