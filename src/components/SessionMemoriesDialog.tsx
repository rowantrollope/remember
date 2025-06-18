"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Brain, Clock, Target } from 'lucide-react'
import type { SessionMemory } from './ChatBox'

interface SessionMemoriesDialogProps {
    memories: SessionMemory[]
    className?: string
}

export function SessionMemoriesDialog({ memories, className = "" }: SessionMemoriesDialogProps) {
    const [isOpen, setIsOpen] = useState(false)

    if (!memories || memories.length === 0) {
        return null
    }

    const formatTimestamp = (timestamp: string) => {
        try {
            return new Date(timestamp).toLocaleString()
        } catch {
            return timestamp
        }
    }

    const formatSimilarityScore = (score: number | undefined) => {
        if (score === undefined || score === null) return 'N/A'
        return (score * 100).toFixed(1) + '%'
    }

    const getSimilarityColor = (score: number | undefined) => {
        if (score === undefined || score === null) return 'text-gray-600 bg-gray-50'
        if (score >= 0.9) return 'text-green-600 bg-green-50'
        if (score >= 0.7) return 'text-yellow-600 bg-yellow-50'
        return 'text-red-600 bg-red-50'
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary" size="sm" className={className}>
                    <Brain className="w-3 h-3 mr-1" />
                    Memory Enhanced ({memories.length})
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5" />
                        Retrieved Memories ({memories.length})
                    </DialogTitle>
                    <DialogDescription>
                        These memories were used to enhance the response with personalized context.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                    {memories.map((memory, index) => (
                        <div key={memory.memory_id || `memory-${index}`} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                    <h4 className="font-medium text-sm text-gray-900 mb-2">
                                        Memory #{index + 1}
                                    </h4>
                                    <p className="text-gray-700 leading-relaxed">
                                        {memory.grounded_text || memory.text}
                                    </p>
                                </div>
                                {memory.similarity_score !== undefined && (
                                    <Badge
                                        variant="outline"
                                        className={`text-xs ${getSimilarityColor(memory.similarity_score)}`}
                                    >
                                        <Target className="w-3 h-3 mr-1" />
                                        {formatSimilarityScore(memory.similarity_score)}
                                    </Badge>
                                )}
                            </div>

                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                {memory.timestamp && (
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatTimestamp(memory.timestamp)}
                                    </div>
                                )}
                                {memory.memory_id && (
                                    <div className="text-gray-400">
                                        ID: {memory.memory_id.slice(0, 8)}...
                                    </div>
                                )}
                            </div>

                            {memory.grounded_text && memory.grounded_text !== memory.text && (
                                <div className="bg-gray-50 p-2 rounded text-xs">
                                    <span className="font-medium text-gray-600">Original: </span>
                                    <span className="text-gray-700">{memory.text}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <strong>How it works:</strong> The AI retrieved these {memories.length} most relevant memories 
                        based on similarity to your question, then used them to provide a more personalized and 
                        contextual response.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
