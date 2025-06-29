"use client"

import React, { useRef, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Send, Brain, MapPin, Trash2 } from 'lucide-react'
import { ConfidencePill } from '@/components/ConfidencePill'
import { SupportingMemoriesDialog } from '@/components/SupportingMemoriesDialog'
import { SessionMemoriesDialog } from '@/components/SessionMemoriesDialog'
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
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const scrollAreaRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom when new messages are added
    useEffect(() => {
        if (messagesEndRef.current && scrollAreaRef.current) {
            // Find the scrollable viewport within the ScrollArea
            const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement
            if (viewport) {
                // Scroll the viewport to the bottom smoothly
                viewport.scrollTo({
                    top: viewport.scrollHeight,
                    behavior: 'smooth'
                })
            }
        }
    }, [messages])

    return (
        <div className={`h-[600px] flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm ${borderColor} ${className}`}>
            {/* Header */}
            <div className={`flex flex-col space-y-1.5 p-6 ${headerBgColor} border-b ${borderColor} rounded-t-lg`}>
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold leading-none tracking-tight flex items-center gap-2">
                        {headerIcon}
                        {title}
                        {badge}
                    </h3>
                    {onClearChat && messages.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClearChat}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={isLoading}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                </div>
                <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col p-0 overflow-hidden">
                {/* Messages */}
                <div className="flex-1 min-h-0">
                    <ScrollArea ref={scrollAreaRef} className="h-full">
                        <div className="p-4 space-y-4">
                            {messages.map((message) => (
                                <div key={message.id} className="space-y-2">
                                    <div className="bg-blue-100 p-3 rounded-lg ml-8">
                                        <p className="text-sm font-medium text-blue-800">You:</p>
                                        <p className="text-blue-700">{message.question}</p>
                                    </div>
                                    <div className={`${messageBgColor} p-3 rounded-lg mr-8`}>
                                        <p className="text-sm font-medium">Assistant:</p>
                                        <p className="whitespace-pre-wrap">{message.answer}</p>
                                        
                                        {/* Memory indicators */}
                                        {showMemoryIndicators && (
                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                {message.hasMemory && message.session_memories && message.session_memories.length > 0 ? (
                                                    <SessionMemoriesDialog
                                                        memories={message.session_memories}
                                                        excludedMemories={message.excluded_memories as SessionMemory[]}
                                                        filteringInfo={message.filtering_info}
                                                        className="text-xs"
                                                    />
                                                ) : message.hasMemory ? (
                                                    <Badge variant="secondary" className="text-xs">
                                                        <Brain className="w-3 h-3 mr-1" />
                                                        Memory Enhanced
                                                    </Badge>
                                                ) : null}
                                                {message.confidence && (
                                                    <ConfidencePill confidence={message.confidence} className="text-xs" />
                                                )}
                                                {message.supporting_memories && message.supporting_memories.length > 0 && (
                                                    <SupportingMemoriesDialog
                                                        memories={message.supporting_memories as Memory[]}
                                                        excludedMemories={message.excluded_memories as Memory[]}
                                                        filteringInfo={message.filtering_info}
                                                        className="text-xs"
                                                    />
                                                )}
                                                {message.reasoning && (
                                                    <Badge variant="outline" className="text-xs">
                                                        <MapPin className="w-3 h-3 mr-1" />
                                                        Reasoning available
                                                    </Badge>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className={`${messageBgColor} p-3 rounded-lg mr-8`}>
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                        <span>{loadingText}</span>
                                    </div>
                                </div>
                            )}
                            {/* Scroll target */}
                            <div ref={messagesEndRef} />
                        </div>
                    </ScrollArea>
                </div>
                
                {/* Input Form */}
                <div className={`border-t ${borderColor} p-4`}>
                    <form onSubmit={onSubmit} className="flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => onInputChange(e.target.value)}
                            placeholder={placeholder}
                            disabled={isLoading}
                            className="flex-1"
                        />
                        <Button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className={buttonColor}
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}
