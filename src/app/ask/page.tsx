"use client"

import { useState } from "react"

// Components
import { PageLayout } from "@/components/PageLayout"
import { PageInputForm } from "@/components/PageInputForm"
import { UnifiedChat, type UnifiedChatMessage } from "@/components/UnifiedChat"
import { useResponseTimer } from "@/components/ResponseTimer"

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
    const timer = useResponseTimer()

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

    // Convert conversations to unified chat messages
    const messages: UnifiedChatMessage[] = conversations.map(conv => ({
        id: conv.id,
        question: conv.question,
        answer: conv.answer,
        created_at: conv.created_at,
        isLoading: conv.answer === "thinking...",
        confidence: conv.confidence,
        reasoning: conv.reasoning,
        supporting_memories: conv.supporting_memories,
        excluded_memories: conv.excluded_memories,
        filtering_info: conv.filtering_info,
        startTime: conv.answer === "thinking..." ? timer.startTime : undefined,
        endTime: conv.answer !== "thinking..." ? timer.endTime : undefined
    }))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        timer.startTimer()

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

        // Add the temporary conversation immediately
        addConversation(tempConversation)
        const currentInput = input
        setInput("")

        try {
            const result = await askQuestion(currentInput, settings.questionTopK, settings.minSimilarity)
            timer.endTimer()

            if (typeof result === 'object' && result.success) {
                // Replace the temporary conversation with the real one
                const updatedConversations = persistentConversations.map(conv =>
                    conv.id === tempConversation.id ? result.conversation : conv
                )
                // Update the conversations array directly
                updateConversations(updatedConversations)
            } else {
                // Remove the temporary conversation on error
                const filteredConversations = persistentConversations.filter(conv => conv.id !== tempConversation.id)
                updateConversations(filteredConversations)
            }
        } catch {
            timer.endTimer()
            // Remove the temporary conversation on error
            const filteredConversations = persistentConversations.filter(conv => conv.id !== tempConversation.id)
            updateConversations(filteredConversations)
        }
    }

    // Create custom input component with grounding toggle
    const customInputComponent = (
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
    )

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

                <UnifiedChat
                    messages={messages}
                    input={input}
                    onInputChange={setInput}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                    title="Ask Memory a Question"
                    subtitle="Get structured answers with confidence analysis and supporting evidence"
                    prompts={chatPrompts}
                    customInputComponent={customInputComponent}
                    showConfidence={true}
                    showReasoning={true}
                    showSupportingMemories={true}
                    showExcludedMemories={true}
                    fixedHeight={false}
                />
            </div>
        </PageLayout>
    )
}
