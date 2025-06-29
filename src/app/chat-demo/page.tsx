"use client"

import { useState } from "react"

// Components
import { PageLayout } from "@/components/PageLayout"
import { UnifiedChat, type UnifiedChatMessage } from "@/components/UnifiedChat"
import { useResponseTimer } from "@/components/ResponseTimer"

// Hooks
import { useConfiguredAPI } from "@/hooks/useConfiguredAPI"
import { useMemoryAPI } from "@/hooks"

// Types
import type { ChatResponse } from "@/lib/api"

interface ChatMessage {
    id: string
    type: 'user' | 'assistant'
    content: string
    created_at: string
}

const chatPrompts = [
    "Tell me about all my restaurant experiences",
    "What patterns do you see in my memories?",
    "Help me understand my food preferences",
    "What have I learned about travel?",
    "Summarize my recent activities"
]

export default function ChatDemoPage() {
    const [input, setInput] = useState("")
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const timer = useResponseTimer()

    const { api: memoryAPI } = useConfiguredAPI()
    const { apiStatus } = useMemoryAPI()

    // Convert chat messages to unified format
    const messages: UnifiedChatMessage[] = []
    for (let i = 0; i < chatHistory.length; i += 2) {
        const userMsg = chatHistory[i]
        const assistantMsg = chatHistory[i + 1]

        if (userMsg && userMsg.type === 'user') {
            messages.push({
                id: userMsg.id,
                question: userMsg.content,
                answer: assistantMsg ? assistantMsg.content : "thinking...",
                created_at: userMsg.created_at,
                isLoading: !assistantMsg,
                startTime: !assistantMsg ? timer.startTime : undefined,
                endTime: assistantMsg ? timer.endTime : undefined
            })
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        timer.startTimer()

        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            type: 'user',
            content: input.trim(),
            created_at: new Date().toISOString()
        }

        // Add user message immediately
        setChatHistory(prev => [...prev, userMessage])
        setInput("")
        setIsLoading(true)
        setError(null)

        try {
            const response: ChatResponse = await memoryAPI.chat(userMessage.content)
            timer.endTimer()

            if (response.success) {
                const assistantMessage: ChatMessage = {
                    id: `assistant-${Date.now()}`,
                    type: 'assistant',
                    content: response.response,
                    created_at: new Date().toISOString()
                }
                setChatHistory(prev => [...prev, assistantMessage])
            } else {
                setError('Failed to get response from chat API')
            }
        } catch (err) {
            timer.endTimer()
            setError(err instanceof Error ? err.message : 'Failed to send message')
        } finally {
            setIsLoading(false)
        }
    }

    const clearError = () => setError(null)

    return (
        <PageLayout
            error={error}
            apiStatus={apiStatus}
            onClearError={clearError}
        >
            {/* Chat Demo Content */}
            <UnifiedChat
                messages={messages}
                input={input}
                onInputChange={setInput}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                title="/api/agent/chat"
                subtitle="Have a conversation with your memories using the LangGraph workflow"
                prompts={chatPrompts}
                placeholder="Ask me anything about your memories..."
                fixedHeight={false}
            />
        </PageLayout>
    )
}
