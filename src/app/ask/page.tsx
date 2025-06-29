"use client"

import { useState, useRef, useEffect } from "react"

// Components
import { PageLayout } from "@/components/PageLayout"
import { PageInputForm } from "@/components/PageInputForm"
import { RotatingPrompts } from "@/components/RotatingPrompts"
import { Badge } from "@/components/ui/badge"
import { GroundingInfo } from "@/components/GroundingInfo"

// Hooks and types
import { useMemoryAPI } from "@/hooks"
import { usePersistentChat } from "@/hooks/usePersistentChat"
import { useSettings } from "@/hooks/useSettings"
import type { Conversation } from "@/types"



const chatPrompts = [
    "Example: What restaurants have I been to?",
    "Example: What did I eat yesterday?",
    "Example: Tell me about my recent travels",
    "Example: What books have I read?",
    "Example: What movies did I enjoy?"
]

export default function AskPage() {
    const [input, setInput] = useState("")
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

    // Use persistent chat hook for conversations
    const {
        conversations: persistentConversations,
        addConversation,
        updateConversations,
    } = usePersistentChat()

    const {
        isLoading,
        error,
        apiStatus,
        groundingEnabled,
        askQuestion,
        setGroundingEnabled,
        clearError,
    } = useMemoryAPI()

    const { settings } = useSettings()

    // Use only persistent conversations to avoid duplicates
    const conversations = persistentConversations

    // Auto-scroll to bottom when new conversations are added
    useEffect(() => {
        if (messagesEndRef.current && scrollContainerRef.current) {
            // Scroll the container to the bottom smoothly
            scrollContainerRef.current.scrollTo({
                top: scrollContainerRef.current.scrollHeight,
                behavior: 'smooth'
            })
        }
    }, [conversations])

    const scrollContainerRef = useRef<HTMLDivElement>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        // Create a temporary conversation with "thinking" state
        const tempConversation: Conversation = {
            id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            question: input,
            answer: "thinking...",
            created_at: new Date().toISOString(),
            confidence: undefined,
            reasoning: undefined,
            supporting_memories: undefined,
            excluded_memories: undefined,
            filtering_info: undefined,
        }

        // Add the temporary conversation immediately and get the updated array
        const conversationsWithTemp = [...persistentConversations, tempConversation]
        addConversation(tempConversation)
        const currentInput = input
        setInput("")

        try {
            const result = await askQuestion(currentInput, settings.questionTopK, settings.minSimilarity)
            console.log('Ask question result:', result) // Debug logging
            if (typeof result === 'object' && result.success) {
                // Replace the temporary conversation with the real one
                const updatedConversations = conversationsWithTemp.map(conv =>
                    conv.id === tempConversation.id ? result.conversation : conv
                )
                console.log('Updated conversations:', updatedConversations) // Debug logging
                // Update the conversations array directly
                updateConversations(updatedConversations)
            } else {
                console.error('Ask question failed:', result) // Debug logging
                // Remove the temporary conversation on error
                const filteredConversations = conversationsWithTemp.filter(conv => conv.id !== tempConversation.id)
                updateConversations(filteredConversations)
            }
        } catch (error) {
            console.error('Ask question error:', error) // Debug logging
            // Remove the temporary conversation on error
            const filteredConversations = conversationsWithTemp.filter(conv => conv.id !== tempConversation.id)
            updateConversations(filteredConversations)
        }
    }

    // Check if there are any chat messages
    const hasMessages = conversations.length > 0

    return (
        <PageLayout
            error={error}
            apiStatus={apiStatus}
            onClearError={clearError}
        >
            {/* Ask API Content */}
            <div className="relative h-full flex flex-col">
                <div className="absolute w-full bg-white/5 backdrop-blur-sm flex-shrink-0 flex justify-between items-center">
                    <div className="grow"></div>
                    <div className="font-mono text-muted-foreground">
                        (POST) /api/klines/ask
                    </div>
                </div>
                {hasMessages ? (
                    // Layout when there are messages - input at bottom
                    <>
                        <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto p-4 bg-white">
                            <div className="space-y-6">
                                {conversations.map((conversation) => (
                                    <div key={conversation.id} className="space-y-3">
                                        {/* User Question */}
                                        <div className="flex justify-end">
                                            <div className="max-w-[80%] bg-blue-500 text-white rounded-lg px-4 py-2">
                                                <div className="whitespace-pre-wrap">{conversation.question}</div>
                                                <div className="text-xs text-blue-100 mt-1">
                                                    {new Date(conversation.created_at).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Assistant Answer */}
                                        <div className="flex justify-start">
                                            <div className="max-w-[80%] bg-gray-100 text-gray-900 rounded-lg px-4 py-2">
                                                {/* Confidence Badge */}
                                                {conversation.confidence && (
                                                    <div className="mb-2">
                                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${conversation.confidence === 'high'
                                                                ? 'bg-green-100 text-green-800'
                                                                : conversation.confidence === 'medium'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {conversation.confidence} confidence
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Answer */}
                                                <div className="whitespace-pre-wrap mb-2">{conversation.answer}</div>

                                                {/* Reasoning */}
                                                {conversation.reasoning && (
                                                    <div className="text-sm text-gray-600 italic mb-2">
                                                        {conversation.reasoning}
                                                    </div>
                                                )}

                                                {/* Supporting Memories */}
                                                {conversation.supporting_memories && conversation.supporting_memories.length > 0 && (
                                                    <details className="mt-2">
                                                        <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
                                                            See {conversation.supporting_memories.length} supporting memories
                                                        </summary>
                                                        <div className="mt-2 space-y-2">
                                                            {conversation.supporting_memories.map((memory, index) => (
                                                                <div key={memory.id || `${conversation.id}-memory-${index}`} className="bg-white border rounded p-2 text-sm">
                                                                    {/* Memory ID Badge */}
                                                                    {memory.id && (
                                                                        <div className="mb-2">
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
                                                                        </div>
                                                                    )}
                                                                    <div className="text-gray-700">{memory.content || memory.text}</div>
                                                                    <div className="text-xs text-gray-500 mt-1 flex justify-between">
                                                                        <span>{new Date(memory.created_at).toLocaleString()}</span>
                                                                        {memory.metadata?.relevance_score && (
                                                                            <span>{memory.metadata.relevance_score}% relevant</span>
                                                                        )}
                                                                    </div>

                                                                    {/* Grounding Information */}
                                                                    {memory.grounding_applied && memory.grounding_info && (
                                                                        <div className="mt-2">
                                                                            <GroundingInfo memory={memory} className="text-xs" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </details>
                                                )}

                                                {/* Excluded Memories */}
                                                {conversation.excluded_memories && conversation.excluded_memories.length > 0 && (
                                                    <details className="mt-2">
                                                        <summary className="text-sm text-orange-600 cursor-pointer hover:text-orange-800">
                                                            See {conversation.excluded_memories.length} excluded memories
                                                        </summary>
                                                        <div className="mt-2 space-y-2">
                                                            <div className="text-xs text-orange-700 bg-orange-50 p-2 rounded">
                                                                These memories were retrieved but excluded due to similarity threshold filtering.
                                                                {conversation.filtering_info?.min_similarity_threshold && (
                                                                    <span> Threshold: {(conversation.filtering_info.min_similarity_threshold * 100).toFixed(1)}%</span>
                                                                )}
                                                            </div>
                                                            {conversation.excluded_memories.map((memory, index) => (
                                                                <div key={memory.id || `${conversation.id}-excluded-memory-${index}`} className="bg-orange-50 border border-orange-200 rounded p-2 text-sm">
                                                                    {/* Memory ID Badge */}
                                                                    {memory.id && (
                                                                        <div className="mb-2">
                                                                            <Badge
                                                                                variant="outline"
                                                                                className={`font-mono text-xs cursor-pointer transition-colors border-orange-300 text-orange-700 ${
                                                                                    copiedId === memory.id
                                                                                        ? 'bg-orange-100 text-orange-800 border-orange-400'
                                                                                        : 'hover:bg-orange-100'
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
                                                                            <span className="text-orange-600">{memory.metadata.relevance_score}% relevant</span>
                                                                        )}
                                                                    </div>

                                                                    {/* Grounding Information */}
                                                                    {memory.grounding_applied && memory.grounding_info && (
                                                                        <div className="mt-2">
                                                                            <GroundingInfo memory={memory} className="text-xs" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </details>
                                                )}

                                                <div className="text-xs text-gray-500 mt-1">
                                                    {new Date(conversation.created_at).toLocaleTimeString()}
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
                                groundingEnabled={groundingEnabled}
                                onGroundingToggle={setGroundingEnabled}
                                placeholder="Ask a question about your memories..."
                            />
                        </div>
                    </>
                ) : (
                    // Layout when no messages - input centered vertically with prompt
                    <div className="flex-1 flex items-center justify-center -mt-40 bg-white">
                        <div className="w-full">
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                    Ask Memory a Question
                                </h1>
                                <p className="text-gray-600">
                                    Get structured answers with confidence analysis and supporting evidence
                                </p>
                            </div>
                            <RotatingPrompts prompts={chatPrompts} />
                            <PageInputForm
                                input={input}
                                setInput={setInput}
                                pageType="chat"
                                isLoading={isLoading}
                                onSubmit={handleSubmit}
                                groundingEnabled={groundingEnabled}
                                onGroundingToggle={setGroundingEnabled}
                                placeholder="Ask a question about your memories..."
                            />
                        </div>
                    </div>
                )}
            </div>
        </PageLayout>
    )
}
