"use client"

import { useState, useRef, useEffect } from "react"

// Components
import { PageLayout } from "@/components/PageLayout"
import { PageInputForm } from "@/components/PageInputForm"
import { RotatingPrompts } from "@/components/RotatingPrompts"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Hooks and types
import { useConfiguredAPI } from "@/hooks/useConfiguredAPI"
import { useMemoryAPI } from "@/hooks"
import { useSettings } from "@/hooks/useSettings"
import type { RecallMentalStateResponse, ApiMemory } from "@/lib/api"

interface RecallResult {
    id: string
    query: string
    mental_state: string
    memories: ApiMemory[]
    memory_count: number
    timestamp: string
}

const recallPrompts = [
    "Example: Construct mental state about travel preferences",
    "Example: Build context around food experiences", 
    "Example: Recall memories about work projects",
    "Example: Mental state for learning activities",
    "Example: Context around social interactions"
]

export default function RecallPage() {
    const [input, setInput] = useState("")
    const [results, setResults] = useState<RecallResult[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

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

    const { api } = useConfiguredAPI()
    const { apiStatus, clearError: clearMemoryError } = useMemoryAPI()
    const { settings } = useSettings()

    // Auto-scroll to bottom when new results are added
    useEffect(() => {
        if (messagesEndRef.current && scrollContainerRef.current) {
            // Scroll the container to the bottom smoothly
            scrollContainerRef.current.scrollTo({
                top: scrollContainerRef.current.scrollHeight,
                behavior: 'smooth'
            })
        }
    }, [results])

    const scrollContainerRef = useRef<HTMLDivElement>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        setIsLoading(true)
        setError(null)

        try {
            const response: RecallMentalStateResponse = await api.recallMentalState(input, settings.questionTopK, settings.minSimilarity)
            
            if (response.success) {
                const newResult: RecallResult = {
                    id: `recall-${Date.now()}`,
                    query: response.query,
                    mental_state: response.mental_state,
                    memories: response.memories,
                    memory_count: response.memory_count,
                    timestamp: new Date().toISOString()
                }
                setResults(prev => [...prev, newResult])
                setInput("")
            } else {
                setError('Failed to construct mental state')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to recall mental state')
        } finally {
            setIsLoading(false)
        }
    }

    const clearError = () => {
        setError(null)
        clearMemoryError()
    }

    // Check if there are any results
    const hasResults = results.length > 0

    return (
        <PageLayout
            error={error}
            apiStatus={apiStatus}
            onClearError={clearError}
        >
            {/* Recall API Content */}
            <div className="relative h-full flex flex-col">
                <div className="absolute w-full bg-white/75 backdrop-blur-md flex-shrink-0 flex justify-between items-center">
                    <div className="grow"></div>
                    <div className="font-mono text-muted-foreground">
                        (POST) /api/klines/recall
                    </div>
                </div>
                {hasResults ? (
                    // Layout when there are results - input at bottom
                    <>
                        <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto p-4 bg-white">
                            <div className="space-y-6">
                                {results.map((result) => (
                                    <div key={result.id} className="space-y-4">
                                        {/* User Query */}
                                        <div className="flex justify-end">
                                            <div className="max-w-[80%] bg-blue-500 text-white rounded-lg px-4 py-2">
                                                <div className="whitespace-pre-wrap">{result.query}</div>
                                                <div className="text-xs text-blue-100 mt-1">
                                                    {new Date(result.timestamp).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Mental State Response */}
                                        <div className="flex justify-start">
                                            <div className="max-w-[90%] space-y-4">
                                                {/* Mental State Card */}
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle className="text-lg flex items-center gap-2">
                                                            🧠 Mental State (K-Line)
                                                            <Badge variant="secondary">
                                                                {result.memory_count} memories
                                                            </Badge>
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="whitespace-pre-wrap text-gray-900">
                                                            {result.mental_state}
                                                        </div>
                                                    </CardContent>
                                                </Card>

                                                {/* Supporting Memories */}
                                                {result.memories && result.memories.length > 0 && (
                                                    <Card>
                                                        <CardHeader>
                                                            <CardTitle className="text-lg">
                                                                📚 Supporting Memories ({result.memories.length})
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <div className="space-y-3">
                                                                {result.memories.map((memory, index) => (
                                                                    <div key={memory.id || `${result.id}-memory-${index}`}
                                                                         className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">

                                                                        {/* Memory Header */}
                                                                        <div className="flex items-start justify-between mb-3">
                                                                            <div className="flex items-center gap-2">
                                                                                {memory.id && (
                                                                                    <Badge
                                                                                        variant="outline"
                                                                                        className={`font-mono text-xs cursor-pointer transition-colors ${
                                                                                            copiedId === memory.id
                                                                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                                                                : 'hover:bg-gray-50'
                                                                                        }`}
                                                                                        onClick={() => copyIdToClipboard(memory.id!)}
                                                                                        title={`Click to copy full ID: ${memory.id}`}
                                                                                    >
                                                                                        {copiedId === memory.id ? '✓ Copied!' : `Neme ID: ${getShortId(memory.id)}`}
                                                                                    </Badge>
                                                                                )}
                                                                                {memory.relevance_score && (
                                                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                                                        {memory.relevance_score.toFixed(3)} Relevance Score
                                                                                    </Badge>
                                                                                )}
                                                                                {memory.score && (
                                                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                                                        {(memory.score * 100).toFixed(1)}% Vector similarity
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* Memory Content */}
                                                                        <div className="space-y-3">
                                                                            {/* Main Text */}
                                                                            <div>
                                                                                <div className="text-sm font-medium text-gray-700 mb-1">Current Text:</div>
                                                                                <div className="text-gray-900 bg-gray-50 p-3 rounded border-l-4 border-blue-400">
                                                                                    {memory.text || memory.grounded_text}
                                                                                </div>
                                                                            </div>

                                                                            {/* Original vs Grounded Text */}
                                                                            {memory.original_text && memory.grounded_text && memory.original_text !== memory.grounded_text && (
                                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                                    <div>
                                                                                        <div className="text-sm font-medium text-gray-700 mb-1">Original:</div>
                                                                                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border">
                                                                                            {memory.original_text}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div>
                                                                                        <div className="text-sm font-medium text-gray-700 mb-1">Grounded:</div>
                                                                                        <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded border border-blue-200">
                                                                                            {memory.grounded_text}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            {/* Tags */}
                                                                            {memory.tags && memory.tags.length > 0 && (
                                                                                <div>
                                                                                    <div className="text-sm font-medium text-gray-700 mb-1">Tags:</div>
                                                                                    <div className="flex flex-wrap gap-1">
                                                                                        {memory.tags.map((tag: string, tagIndex: number) => (
                                                                                            <Badge key={tagIndex} variant="secondary" className="text-xs">
                                                                                                {tag}
                                                                                            </Badge>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            {/* Temporal Information */}
                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                                                                <div>
                                                                                    <div className="font-medium text-gray-700 mb-1">Created:</div>
                                                                                    <div className="text-gray-600">
                                                                                        {memory.formatted_time ||
                                                                                         (memory.created_at ? new Date(memory.created_at).toLocaleString() :
                                                                                          memory.timestamp ? new Date(typeof memory.timestamp === 'number' ? memory.timestamp * 1000 : memory.timestamp).toLocaleString() : 'Unknown')}
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <div className="font-medium text-gray-700 mb-1">Grounding:</div>
                                                                                    <div className="text-gray-600">
                                                                                        {memory.grounding_applied ? (
                                                                                            <span className="text-green-600">✓ Applied</span>
                                                                                        ) : (
                                                                                            <span className="text-gray-400">✗ Not applied</span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* Access Information */}
                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                                                                {memory.last_accessed_at && (
                                                                                    <div>
                                                                                        <div className="font-medium text-gray-700 mb-1">Last Accessed:</div>
                                                                                        <div className="text-gray-600">
                                                                                            {new Date(memory.last_accessed_at).toLocaleString()}
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                                <div>
                                                                                    <div className="font-medium text-gray-700 mb-1">Access Count:</div>
                                                                                    <div className="text-gray-600">
                                                                                        {memory.access_count || 0} times
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* Expandable Sections */}
                                                                            <div className="space-y-2">
                                                                                {/* Grounding Info */}
                                                                                {memory.grounding_info && Object.keys(memory.grounding_info).length > 0 && (
                                                                                    <details className="text-xs">
                                                                                        <summary className="cursor-pointer hover:text-gray-700 font-medium text-gray-600">
                                                                                            🔗 Grounding Information
                                                                                        </summary>
                                                                                        <div className="mt-2 bg-blue-50 p-2 rounded border">
                                                                                            <pre className="text-xs overflow-x-auto">
                                                                                                {JSON.stringify(memory.grounding_info, null, 2)}
                                                                                            </pre>
                                                                                        </div>
                                                                                    </details>
                                                                                )}

                                                                                {/* Context Snapshot */}
                                                                                {memory.context_snapshot && Object.keys(memory.context_snapshot).length > 0 && (
                                                                                    <details className="text-xs">
                                                                                        <summary className="cursor-pointer hover:text-gray-700 font-medium text-gray-600">
                                                                                            📸 Context Snapshot
                                                                                        </summary>
                                                                                        <div className="mt-2 bg-yellow-50 p-2 rounded border">
                                                                                            <pre className="text-xs overflow-x-auto">
                                                                                                {JSON.stringify(memory.context_snapshot, null, 2)}
                                                                                            </pre>
                                                                                        </div>
                                                                                    </details>
                                                                                )}

                                                                                {/* Raw Metadata */}
                                                                                {memory.metadata && Object.keys(memory.metadata).length > 0 && (
                                                                                    <details className="text-xs">
                                                                                        <summary className="cursor-pointer hover:text-gray-700 font-medium text-gray-600">
                                                                                            🔧 Raw Metadata
                                                                                        </summary>
                                                                                        <div className="mt-2 bg-gray-50 p-2 rounded border">
                                                                                            <pre className="text-xs overflow-x-auto">
                                                                                                {JSON.stringify(memory.metadata, null, 2)}
                                                                                            </pre>
                                                                                        </div>
                                                                                    </details>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )}

                                                <div className="text-xs text-gray-500">
                                                    {new Date(result.timestamp).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {/* Scroll target */}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Input Form at bottom */}
                        <div className="flex-shrink-0 rounded">
                            <PageInputForm
                                input={input}
                                setInput={setInput}
                                pageType="chat"
                                isLoading={isLoading}
                                onSubmit={handleSubmit}
                                placeholder="Enter query to construct mental state..."
                            />
                        </div>
                    </>
                ) : (
                    // Layout when no results - input centered vertically with prompt
                    <div className="flex-1 flex items-center justify-center -mt-40 bg-white">
                        <div className="w-full">
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                    K-Line Mental State Construction
                                </h1>
                                <p className="text-gray-600">
                                    Build coherent mental states by recalling and organizing relevant memories
                                </p>
                            </div>
                            <RotatingPrompts prompts={recallPrompts} />
                            <PageInputForm
                                input={input}
                                setInput={setInput}
                                pageType="chat"
                                isLoading={isLoading}
                                onSubmit={handleSubmit}
                                placeholder="Enter query to construct mental state..."
                            />
                        </div>
                    </div>
                )}
            </div>
        </PageLayout>
    )
}
