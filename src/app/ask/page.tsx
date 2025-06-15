"use client"

import { useState } from "react"

// Components
import { PageLayout } from "@/components/PageLayout"
import { PageInputForm } from "@/components/PageInputForm"
import { RotatingPrompts } from "@/components/RotatingPrompts"

// Hooks and types
import { useMemoryAPI } from "@/hooks"
import { usePersistentChat } from "@/hooks/usePersistentChat"
import { useSettings } from "@/hooks/useSettings"



const chatPrompts = [
    "What restaurants have I been to?",
    "What did I eat yesterday?",
    "Tell me about my recent travels",
    "What books have I read?",
    "What movies did I enjoy?"
]

export default function AskPage() {
    const [input, setInput] = useState("")

    // Use persistent chat hook for conversations
    const {
        conversations: persistentConversations,
        addConversation,
    } = usePersistentChat()

    const {
        conversations: apiConversations,
        isLoading,
        error,
        apiStatus,
        groundingEnabled,
        askQuestion,
        setGroundingEnabled,
        clearError,
    } = useMemoryAPI()

    const { settings } = useSettings()

    // Combine conversations from persistent storage and current session
    const conversations = [...persistentConversations, ...apiConversations]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        const result = await askQuestion(input, settings.questionTopK)
        if (typeof result === 'object' && result.success) {
            // Add the new conversation to persistent storage
            addConversation(result.conversation)
            setInput("")
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
            <div className="h-full flex flex-col">
                {hasMessages ? (
                    // Layout when there are messages - input at bottom
                    <>
                        <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-white">
                            <div className="space-y-6">
                                {conversations.map((conversation) => (
                                    <div key={conversation.id} className="space-y-3">
                                        {/* User Question */}
                                        <div className="flex justify-end">
                                            <div className="max-w-[80%] bg-blue-500 text-white rounded-lg px-4 py-2">
                                                <div className="whitespace-pre-wrap">{conversation.question}</div>
                                                <div className="text-xs text-blue-100 mt-1">
                                                    {new Date(conversation.timestamp).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Assistant Answer */}
                                        <div className="flex justify-start">
                                            <div className="max-w-[80%] bg-gray-100 text-gray-900 rounded-lg px-4 py-2">
                                                {/* Confidence Badge */}
                                                {conversation.confidence && (
                                                    <div className="mb-2">
                                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                                            conversation.confidence === 'high' 
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
                                                                <div key={memory.id || index} className="bg-white border rounded p-2 text-sm">
                                                                    <div className="text-gray-700">{memory.content || memory.text}</div>
                                                                    <div className="text-xs text-gray-500 mt-1 flex justify-between">
                                                                        <span>{memory.formatted_time || new Date(memory.timestamp).toLocaleString()}</span>
                                                                        {memory.metadata?.relevance_score && (
                                                                            <span>{memory.metadata.relevance_score}% relevant</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </details>
                                                )}

                                                <div className="text-xs text-gray-500 mt-1">
                                                    {new Date(conversation.timestamp).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
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
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">Ask Your Memory</h1>
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
