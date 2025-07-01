"use client"

import React, { useState, useEffect } from "react"

// Components
import { PageLayout } from "@/components/PageLayout"
import { PageInputForm } from "@/components/PageInputForm"
import { RotatingPrompts } from "@/components/RotatingPrompts"
import { ChatBox, type UnifiedChatMessage } from "@/components/ChatBox"
import { ApiPageHeader } from "@/components/ApiPageHeader"

// Hooks
import { useMemoryAPI } from "@/hooks"
import { usePersistentChat } from "@/hooks/usePersistentChat"

// Types
import type { MemorySaveResponse } from "@/hooks/usePersistentChat"

// Utils
import { memorySaveResponsesToMessages, createThinkingMessage, updateThinkingMessage } from "@/lib/chatMessageUtils"

const savePrompts = [
    "Example: I had lunch at a great Italian restaurant",
    "Example: Finished reading an amazing book about AI",
    "Example: Met an interesting person at the conference",
    "Example: Learned a new programming technique today",
    "Example: Discovered a beautiful hiking trail"
]

export default function SavePage() {
    const [input, setInput] = useState("")
    const [messages, setMessages] = useState<UnifiedChatMessage[]>([])

    // Use persistent chat hook for memory save responses (for persistence)
    const {
        memorySaveResponses,
        addMemorySaveResponse,
        clearChatHistory,
    } = usePersistentChat()

    const {
        isLoading,
        error,
        apiStatus,
        groundingEnabled,
        saveMemory,
        setGroundingEnabled,
        clearError,
    } = useMemoryAPI()

    // Convert persistent memory save responses to messages on component mount
    useEffect(() => {
        if (memorySaveResponses.length > 0) {
            const convertedMessages = memorySaveResponsesToMessages(memorySaveResponses)
            setMessages(convertedMessages)
        }
    }, [memorySaveResponses])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        const currentInput = input
        setInput("")

        // Add user message
        const userMessage: UnifiedChatMessage = {
            id: `user-${Date.now()}`,
            type: 'user',
            content: `Add memory: ${currentInput}`,
            created_at: new Date().toISOString()
        }

        // Add thinking message
        const thinkingMessage = createThinkingMessage(Date.now().toString())

        setMessages(prev => [...prev, userMessage, thinkingMessage])

        try {
            const result = await saveMemory(currentInput)
            if (result.success && result.response) {
                // Create success message
                const successMessage: UnifiedChatMessage = {
                    id: `save-${Date.now()}`,
                    type: 'memory_save',
                    content: `✓ Memory saved successfully\nMemory ID: ${result.response.memory_id}`,
                    created_at: new Date().toISOString(),
                    memory_id: result.response.memory_id,
                    save_success: true
                }

                // Replace thinking message with success message
                setMessages(prev => updateThinkingMessage(prev, thinkingMessage.id, successMessage))

                // Also add to persistent storage
                const saveResponse: MemorySaveResponse = {
                    success: true,
                    response: result.response,
                    originalText: currentInput,
                    timestamp: new Date().toISOString()
                }
                addMemorySaveResponse(saveResponse)
            } else {
                // Remove thinking message on error
                setMessages(prev => prev.filter(msg => msg.id !== thinkingMessage.id))
            }
        } catch {
            // Remove thinking message on error
            setMessages(prev => prev.filter(msg => msg.id !== thinkingMessage.id))
        }
    }

    const clearChat = () => {
        setMessages([])
        clearChatHistory()
    }

    // Check if there are any memory save responses
    const hasMessages = messages.length > 0

    return (
        <PageLayout
            error={error}
            apiStatus={apiStatus}
            onClearError={clearError}
        >
            {/* Memory Save Content */}
            <div className="h-full flex flex-col">
                <ApiPageHeader
                    endpoint="(POST) /api/nemes/save"
                    hasMessages={hasMessages}
                    onClearChat={clearChat}
                    isLoading={isLoading}
                />
                {hasMessages ? (
                    // Layout when there are messages - ChatBox + input at bottom
                    <>
                        <div className="flex-1 min-h-0 px-4 bg-white">
                            <ChatBox
                                messages={messages}
                                isLoading={isLoading}
                                loadingText="Saving memory..."
                                showMemoryIndicators={true}
                                enableMemoryExpansion={true}
                            />
                        </div>

                        {/* Input Form at bottom */}
                        <div className="flex-shrink-0 rounded">
                            <PageInputForm
                                input={input}
                                setInput={setInput}
                                pageType="save"
                                isLoading={isLoading}
                                onSubmit={handleSubmit}
                                groundingEnabled={groundingEnabled}
                                onGroundingToggle={setGroundingEnabled}
                                placeholder="Enter a memory to save..."
                            />
                        </div>
                    </>
                ) : (
                    // Layout when no messages - input centered vertically with prompt
                    <div className="flex-1 flex items-center justify-center -mt-40 bg-white">
                        <div className="w-full">
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                    Save a new Memory:
                                </h1>
                                <p className="text-gray-600">
                                    Store important moments and information with contextual grounding
                                </p>
                            </div>
                            <RotatingPrompts prompts={savePrompts} />
                            <PageInputForm
                                input={input}
                                setInput={setInput}
                                pageType="save"
                                isLoading={isLoading}
                                onSubmit={handleSubmit}
                                groundingEnabled={groundingEnabled}
                                onGroundingToggle={setGroundingEnabled}
                                placeholder="Enter a memory to save..."
                            />
                        </div>
                    </div>
                )}
            </div>
        </PageLayout>
    )
}
