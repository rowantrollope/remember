"use client"

import { useState, useEffect } from "react"

// Components
import { PageLayout } from "@/components/PageLayout"
import { PageInputForm } from "@/components/PageInputForm"
import { MemoryChatTab } from "@/components/tabs/MemoryChatTab"
import { RotatingPrompts } from "@/components/RotatingPrompts"

// Hooks and types
import { useMemoryAPI } from "@/hooks"
import { usePersistentChat } from "@/hooks/usePersistentChat"
import { useSettings } from "@/hooks/useSettings"
import { useConfiguredAPI } from "@/hooks/useConfiguredAPI"

// Memory-saving prompts for empty state - moved outside component to prevent re-creation
const chatPrompts = [
    "What do you want to remember today?",
    "Don't forget... it's my anniversary next week",
    "Capture an important moment",
    "Remember something meaningful",
    "Save a thought or feeling",
    "Record a special memory"
]

export default function MemoryChatPage() {
    const [input, setInput] = useState("")
    const [chatMode, setChatMode] = useState<'ask' | 'save'>('ask')

    // Use persistent chat hook for conversations and memory saves
    const {
        conversations: persistentConversations,
        memorySaveResponses,
        addConversation,
        addMemorySaveResponse,
    } = usePersistentChat()

    const {
        conversations: apiConversations,
        isLoading,
        error,
        apiStatus,
        groundingEnabled,
        saveMemory,
        askQuestion,
        setGroundingEnabled,
        clearError,
    } = useMemoryAPI()

    // Get settings for question top_k and configured API
    const { settings } = useSettings()
    const { api: memoryAPI } = useConfiguredAPI()

    // Sync API conversations with persistent storage
    const conversations = persistentConversations.length > 0 ? persistentConversations : apiConversations

    // Fetch memory count on mount to determine default chat mode
    useEffect(() => {
        const fetchMemoryCount = async () => {
            try {
                // Only fetch if API is ready
                if (apiStatus === 'ready') {
                    const memoryInfo = await memoryAPI.getMemoryInfo()
                    if (memoryInfo.success) {
                        // Set default mode to 'save' if no memories exist, otherwise 'ask'
                        if (memoryInfo.memory_count === 0) {
                            setChatMode('save')
                        }
                    }
                }
            } catch (error) {
                // If memory info is not available, keep default behavior
                console.warn('Could not fetch memory count:', error)
            }
        }

        fetchMemoryCount()
    }, [apiStatus, memoryAPI]) // Re-run when API status or API instance changes


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        let success = false
        if (chatMode === 'save') {
            const result = await saveMemory(input)
            success = result.success
            if (result.success && result.response) {
                const saveResponse = {
                    success: true,
                    response: result.response,
                    originalText: input,
                    timestamp: new Date().toISOString()
                }
                // Add to persistent storage
                addMemorySaveResponse(saveResponse)
            }
        } else {
            const result = await askQuestion(input, settings.questionTopK)
            if (typeof result === 'object' && result.success) {
                success = true
                // Add the new conversation to persistent storage
                addConversation(result.conversation)
            } else {
                success = result as boolean
            }
        }

        if (success) {
            setInput("")
        }
    }

    // Check if there are any chat messages
    const hasMessages = conversations.length > 0 || memorySaveResponses.length > 0

    return (
        <PageLayout
            error={error}
            apiStatus={apiStatus}
            onClearError={clearError}
        >
            {/* Memory Chat Content */}
            <div className="h-full flex flex-col">
                {hasMessages ? (
                    // Layout when there are messages - input at bottom
                    <>
                        <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-white">
                            <MemoryChatTab
                                conversations={conversations}
                                memorySaveResponses={memorySaveResponses}
                                chatMode={chatMode}
                                onChatModeChange={setChatMode}
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
                                chatMode={chatMode}
                                groundingEnabled={groundingEnabled}
                                onGroundingToggle={setGroundingEnabled}
                            />
                        </div>
                    </>
                ) : (
                    // Layout when no messages - input centered vertically with prompt
                    <div className="flex-1 flex items-center justify-center -mt-40 bg-white">
                        <div className="w-full">
                            <RotatingPrompts prompts={chatPrompts} />
                            <PageInputForm
                                input={input}
                                setInput={setInput}
                                pageType="chat"
                                isLoading={isLoading}
                                onSubmit={handleSubmit}
                                chatMode={chatMode}
                                groundingEnabled={groundingEnabled}
                                onGroundingToggle={setGroundingEnabled}
                            />
                        </div>
                    </div>
                )}
            </div>
        </PageLayout>
    )
}
