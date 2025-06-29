"use client"

import React from 'react'
import { UnifiedChat, type UnifiedChatMessage } from '@/components/UnifiedChat'
import { useResponseTimer } from '@/components/ResponseTimer'
import type { Memory } from '@/types'

export interface SessionMemory {
    memory_id?: string
    text: string
    created_at?: string
    grounded_text?: string
    similarity_score?: number
}

export interface ChatMessage {
    id: string
    question: string
    answer: string
    created_at: Date
    hasMemory: boolean
    confidence?: 'high' | 'medium' | 'low'
    reasoning?: string
    supporting_memories?: unknown[]
    excluded_memories?: unknown[]
    filtering_info?: {
        min_similarity_threshold?: number
        total_candidates?: number
        excluded_count?: number
        included_count?: number
    }
    session_memories?: SessionMemory[]
}

export interface ChatBoxProps {
    title: string
    subtitle: string
    messages: ChatMessage[]
    input: string
    onInputChange: (value: string) => void
    onSubmit: (e: React.FormEvent) => void
    onClearChat?: () => void
    isLoading: boolean
    placeholder?: string
    headerIcon?: React.ReactNode
    borderColor?: string
    headerBgColor?: string
    messageBgColor?: string
    buttonColor?: string
    loadingText?: string
    showMemoryIndicators?: boolean
    badge?: React.ReactNode
    className?: string
}

export function ChatBox({
    title,
    subtitle,
    messages,
    input,
    onInputChange,
    onSubmit,
    onClearChat,
    isLoading,
    placeholder = "Ask a question...",
    headerIcon,
    borderColor = "border-gray-200",
    headerBgColor = "bg-gray-50",
    messageBgColor = "bg-gray-100",
    buttonColor = "bg-blue-600 hover:bg-blue-700",
    loadingText = "Thinking...",
    showMemoryIndicators = false,
    badge,
    className = ""
}: ChatBoxProps) {
    const timer = useResponseTimer()

    // Convert ChatMessage to UnifiedChatMessage
    const unifiedMessages: UnifiedChatMessage[] = messages.map(message => ({
        id: message.id,
        question: message.question,
        answer: message.answer,
        created_at: message.created_at,
        isLoading: false, // ChatBox doesn't handle loading states in messages
        confidence: message.confidence,
        reasoning: message.reasoning,
        supporting_memories: message.supporting_memories as Memory[],
        excluded_memories: message.excluded_memories as Memory[],
        filtering_info: message.filtering_info,
        session_memories: message.session_memories,
        hasMemory: message.hasMemory
    }))

    return (
        <UnifiedChat
            messages={unifiedMessages}
            input={input}
            onInputChange={onInputChange}
            onSubmit={onSubmit}
            isLoading={isLoading}
            title={title}
            subtitle={subtitle}
            onClearChat={onClearChat}
            placeholder={placeholder}
            loadingText={loadingText}
            headerIcon={headerIcon}
            borderColor={borderColor}
            headerBgColor={headerBgColor}
            messageBgColor={messageBgColor}
            buttonColor={buttonColor}
            badge={badge}
            className={className}
            showMemoryIndicators={showMemoryIndicators}
            fixedHeight={true}
            height="600px"
        />
    )
}
