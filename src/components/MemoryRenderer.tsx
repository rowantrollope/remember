"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import type { Memory } from "@/types"

interface MemoryRendererProps {
    memories: Memory[]
    excludedMemories?: Memory[]
    filteringInfo?: {
        min_similarity_threshold?: number
        total_candidates?: number
        excluded_count?: number
        included_count?: number
    }
    type: 'supporting' | 'excluded'
    className?: string
}

export function MemoryRenderer({
    memories,
    excludedMemories = [],
    filteringInfo,
    type,
    className = ""
}: MemoryRendererProps) {
    const [copiedId, setCopiedId] = useState<string | null>(null)

    // Helper function to get the last component of an ID after the final dash
    const getShortId = (id: string) => {
        const parts = id.split('-')
        return parts[parts.length - 1]
    }

    // Function to copy ID to clipboard with visual feedback
    const copyIdToClipboard = async (fullId: string) => {
        try {
            await navigator.clipboard.writeText(fullId)
            setCopiedId(fullId)
            setTimeout(() => setCopiedId(null), 2000) // Clear feedback after 2 seconds
        } catch (err) {
            console.error('Failed to copy ID to clipboard:', err)
        }
    }

    if (memories.length === 0) return null

    const isExcluded = type === 'excluded'
    const summaryColor = isExcluded ? 'text-orange-600 hover:text-orange-800' : 'text-blue-600 hover:text-blue-800'
    const containerBg = isExcluded ? 'bg-orange-50 border-orange-200' : 'bg-white border'
    const badgeColors = isExcluded 
        ? 'border-orange-300 text-orange-700 hover:bg-orange-100'
        : 'hover:bg-gray-50'
    const copiedBadgeColors = isExcluded
        ? 'bg-orange-100 text-orange-800 border-orange-400'
        : 'bg-green-50 text-green-700 border-green-200'

    return (
        <details className={`mt-2 ${className}`}>
            <summary className={`text-sm cursor-pointer ${summaryColor}`}>
                See {memories.length} {type} memories
            </summary>
            <div className="mt-2 space-y-2">
                {isExcluded && (
                    <div className="text-xs text-orange-700 bg-orange-50 p-2 rounded">
                        These memories were retrieved but excluded due to similarity threshold filtering.
                        {filteringInfo?.min_similarity_threshold && (
                            <span> Threshold: {(filteringInfo.min_similarity_threshold * 100).toFixed(1)}%</span>
                        )}
                    </div>
                )}
                {memories.map((memory, index) => (
                    <div key={memory.id || `memory-${index}`} className={`${containerBg} rounded p-2 text-sm`}>
                        {/* Memory ID Badge */}
                        {memory.id && (
                            <div className="mb-2">
                                <Badge
                                    variant="outline"
                                    className={`font-mono text-xs cursor-pointer transition-colors ${
                                        copiedId === memory.id
                                            ? copiedBadgeColors
                                            : badgeColors
                                    }`}
                                    onClick={() => copyIdToClipboard(memory.id!)}
                                    title={`Click to copy full ID: ${memory.id}`}
                                >
                                    {copiedId === memory.id ? '✓ Copied!' : `Neme ID: ${getShortId(memory.id)}`}
                                </Badge>
                            </div>
                        )}
                        <div className="text-gray-700">{memory.content || memory.text}</div>
                        <div className="text-xs text-gray-500 mt-1 flex justify-between">
                            <span>{new Date(memory.created_at).toLocaleString()}</span>
                            {memory.metadata?.relevance_score && (
                                <span className={isExcluded ? 'text-orange-600' : ''}>
                                    {memory.metadata.relevance_score}% relevant
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </details>
    )
}
