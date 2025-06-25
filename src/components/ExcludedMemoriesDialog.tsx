"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    EyeOff,
    Filter,
    Target,
    Calendar,
    Clock,
    Eye,
    Info,
    Copy,
    Check
} from "lucide-react"
import type { Memory } from "@/types"
import { formatTimestamp } from "@/utils/formatters"
import { GroundingInfo } from "@/components/GroundingInfo"

interface ExcludedMemoriesDialogProps {
    excludedMemories: Memory[]
    filteringInfo?: {
        min_similarity_threshold?: number
        total_candidates?: number
        excluded_count?: number
        included_count?: number
    }
    className?: string
}

export function ExcludedMemoriesDialog({ 
    excludedMemories, 
    filteringInfo,
    className 
}: ExcludedMemoriesDialogProps) {
    const [open, setOpen] = useState(false)
    const [showDetails, setShowDetails] = useState<{ [key: string]: boolean }>({})
    const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set())

    const toggleDetails = (memoryId: string) => {
        setShowDetails(prev => ({
            ...prev,
            [memoryId]: !prev[memoryId]
        }))
    }

    const getSimilarityColor = (score?: number) => {
        if (!score) return "text-gray-500"
        if (score >= 0.8) return "text-green-600"
        if (score >= 0.6) return "text-yellow-600"
        return "text-red-600"
    }

    const formatSimilarityScore = (score?: number) => {
        if (!score) return "N/A"
        return `${(score * 100).toFixed(1)}%`
    }

    const formatNemeId = (memoryId: string) => {
        // Extract the last component after the final dash
        const parts = memoryId.split('-')
        return parts[parts.length - 1]
    }

    const copyToClipboard = async (memoryId: string) => {
        try {
            await navigator.clipboard.writeText(memoryId)
            setCopiedIds(prev => new Set(prev).add(memoryId))
            // Clear the copied state after 2 seconds
            setTimeout(() => {
                setCopiedIds(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(memoryId)
                    return newSet
                })
            }, 2000)
        } catch (err) {
            console.error('Failed to copy to clipboard:', err)
        }
    }

    if (!excludedMemories || excludedMemories.length === 0) {
        return null
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={`${className} border-orange-200 text-orange-700 hover:bg-orange-50`}
                >
                    <EyeOff className="w-3 h-3 mr-1" />
                    Excluded memories ({excludedMemories.length})
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <EyeOff className="w-5 h-5 text-orange-600" />
                        Excluded Memories
                        <span className="text-sm text-gray-500 font-normal">({excludedMemories.length})</span>
                    </DialogTitle>
                    {filteringInfo && (
                        <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4" />
                                <span>
                                    Threshold: {filteringInfo.min_similarity_threshold ? 
                                        `${(filteringInfo.min_similarity_threshold * 100).toFixed(1)}%` : 
                                        'N/A'
                                    }
                                </span>
                            </div>
                            {filteringInfo.total_candidates && (
                                <div className="text-xs text-gray-500">
                                    Total candidates: {filteringInfo.total_candidates} | 
                                    Included: {filteringInfo.included_count || 0} | 
                                    Excluded: {filteringInfo.excluded_count || 0}
                                </div>
                            )}
                        </div>
                    )}
                </DialogHeader>

                <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-4">
                        {excludedMemories.map((memory, index) => {
                            const isDetailsVisible = showDetails[memory.id]

                            return (
                                <Card key={memory.id} className="border border-orange-200 bg-orange-50/30">
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col">
                                                <CardTitle className="text-sm font-medium text-orange-800">
                                                    Excluded Memory #{index + 1}
                                                </CardTitle>
                                                <button
                                                    onClick={() => copyToClipboard(memory.id)}
                                                    className="flex items-center gap-1 text-xs text-gray-400 font-mono hover:text-gray-600 transition-colors cursor-pointer"
                                                    title="Click to copy full ID"
                                                >
                                                    <span>Neme ID: {formatNemeId(memory.id)}</span>
                                                    {copiedIds.has(memory.id) ? (
                                                        <Check className="w-3 h-3 text-green-600" />
                                                    ) : (
                                                        <Copy className="w-3 h-3" />
                                                    )}
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {memory.metadata?.score && (
                                                    <Badge variant="outline" className={`text-xs ${getSimilarityColor(memory.metadata.score)}`}>
                                                        <Target className="w-3 h-3 mr-1" />
                                                        {formatSimilarityScore(memory.metadata.score)}
                                                    </Badge>
                                                )}
                                                {memory.metadata?.relevance_score && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Relevance: {memory.metadata.relevance_score.toFixed(1)}%
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="space-y-3">
                                            <p className="text-gray-700 leading-relaxed">
                                                {memory.grounded_text || memory.content || memory.text}
                                            </p>

                                            {/* Timestamp */}
                                            {memory.timestamp && (
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{formatTimestamp(memory.timestamp)}</span>
                                                </div>
                                            )}

                                            {/* Toggle details button */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleDetails(memory.id)}
                                                className="text-xs text-gray-600 hover:text-gray-800 p-0 h-auto"
                                            >
                                                {isDetailsVisible ? (
                                                    <>
                                                        <EyeOff className="w-3 h-3 mr-1" />
                                                        Hide details
                                                    </>
                                                ) : (
                                                    <>
                                                        <Eye className="w-3 h-3 mr-1" />
                                                        Show details
                                                    </>
                                                )}
                                            </Button>

                                            {/* Detailed information */}
                                            {isDetailsVisible && (
                                                <div className="space-y-3 pt-2 border-t border-orange-200">
                                                    {/* Original vs Grounded text */}
                                                    {memory.original_text && memory.grounded_text && memory.original_text !== memory.grounded_text && (
                                                        <div className="space-y-2">
                                                            <div>
                                                                <span className="text-xs font-medium text-gray-600">Original:</span>
                                                                <p className="text-xs text-gray-500 mt-1">{memory.original_text}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-xs font-medium text-gray-600">Grounded:</span>
                                                                <p className="text-xs text-gray-700 mt-1">{memory.grounded_text}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Grounding info */}
                                                    {memory.grounding_info && (
                                                        <GroundingInfo grounding={memory.grounding_info} />
                                                    )}

                                                    {/* Context snapshot */}
                                                    {memory.context_snapshot && (
                                                        <div className="space-y-2">
                                                            <span className="text-xs font-medium text-gray-600">Context Snapshot:</span>
                                                            <div className="text-xs text-gray-500 space-y-1">
                                                                {memory.context_snapshot.spatial?.location && (
                                                                    <div>Location: {memory.context_snapshot.spatial.location}</div>
                                                                )}
                                                                {memory.context_snapshot.spatial?.activity && (
                                                                    <div>Activity: {memory.context_snapshot.spatial.activity}</div>
                                                                )}
                                                                {memory.context_snapshot.social?.people_present && (
                                                                    <div>People: {memory.context_snapshot.social.people_present.join(', ')}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </ScrollArea>

                <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Info className="w-4 h-4" />
                        <span>
                            These memories were retrieved but excluded due to similarity threshold filtering. 
                            Consider lowering the threshold to include more memories.
                        </span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
