"use client"

import { useState } from "react"

// Components
import { PageLayout } from "@/components/PageLayout"
import { PageInputForm } from "@/components/PageInputForm"
import { RotatingPrompts } from "@/components/RotatingPrompts"
import { ChatBox, type UnifiedChatMessage } from "@/components/ChatBox"
import { ApiPageHeader } from "@/components/ApiPageHeader"

// Hooks and types
import { useConfiguredAPI } from "@/hooks/useConfiguredAPI"
import { useMemoryAPI } from "@/hooks"
import { useSettings } from "@/hooks/useSettings"
import type { RecallMentalStateResponse } from "@/lib/api"

// Utils
import { createThinkingMessage, updateThinkingMessage } from "@/lib/chatMessageUtils"

const recallPrompts = [
    "Example: Construct mental state about travel preferences",
    "Example: Build context around food experiences", 
    "Example: Recall memories about work projects",
    "Example: Mental state for learning activities",
    "Example: Context around social interactions"
]

export default function RecallPage() {
    const [input, setInput] = useState("")
    const [messages, setMessages] = useState<UnifiedChatMessage[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const { api } = useConfiguredAPI()
    const { apiStatus, clearError: clearMemoryError } = useMemoryAPI()
    const { settings } = useSettings()

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        const currentInput = input
        setInput("")
        setIsLoading(true)
        setError(null)

        // Add user message
        const userMessage: UnifiedChatMessage = {
            id: `user-${Date.now()}`,
            type: 'user',
            content: currentInput,
            created_at: new Date().toISOString()
        }

        // Add thinking message
        const thinkingMessage = createThinkingMessage(Date.now().toString())

        setMessages(prev => [...prev, userMessage, thinkingMessage])

        try {
            const response: RecallMentalStateResponse = await api.recallMentalState(currentInput, settings.questionTopK, settings.minSimilarity)

            if (response.success) {
                // Replace thinking message with real response
                const realMessage: UnifiedChatMessage = {
                    id: `recall-${Date.now()}`,
                    type: 'recall_result',
                    content: response.mental_state,
                    created_at: new Date().toISOString(),
                    mental_state: response.mental_state,
                    memory_count: response.memory_count,
                    supporting_memories: response.memories
                }

                setMessages(prev => updateThinkingMessage(prev, thinkingMessage.id, realMessage))
            } else {
                // Remove thinking message on error
                setMessages(prev => prev.filter(msg => msg.id !== thinkingMessage.id))
                setError('Failed to construct mental state')
            }
        } catch (err) {
            // Remove thinking message on error
            setMessages(prev => prev.filter(msg => msg.id !== thinkingMessage.id))
            setError(err instanceof Error ? err.message : 'Failed to recall mental state')
        } finally {
            setIsLoading(false)
        }
    }

    const clearError = () => {
        setError(null)
        clearMemoryError()
    }

    const clearChat = () => {
        setMessages([])
    }

    // Check if there are any messages
    const hasMessages = messages.length > 0

    return (
        <PageLayout
            error={error}
            apiStatus={apiStatus}
            onClearError={clearError}
        >
            {/* Recall API Content */}
            <div className="h-full flex flex-col">
                <ApiPageHeader
                    endpoint="(POST) /api/klines/recall"
                    hasMessages={hasMessages}
                    onClearChat={clearChat}
                    isLoading={isLoading}
                />
                {hasMessages ? (
                    // Layout when there are messages - ChatBox + input at bottom
                    <>
                        <div className="flex-1 min-h-0 p-4 bg-white">
                            <ChatBox
                                messages={messages}
                                isLoading={isLoading}
                                loadingText="Constructing mental state..."
                                showMemoryIndicators={true}
                                enableMemoryExpansion={true}
                                copiedId={copiedId}
                                onCopyId={copyIdToClipboard}
                            />
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
                    // Layout when no messages - input centered vertically with prompt
                    <div className="flex-1 flex items-center justify-center -mt-40 bg-white">
                        <div className="w-full">
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                    K-Line Mental State Re-construction
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
