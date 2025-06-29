"use client"

import React, { useRef, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Send, Trash2, Brain, MapPin } from 'lucide-react'
import { AnimatedThinking } from '@/components/AnimatedThinking'
import { ResponseTimer } from '@/components/ResponseTimer'
import { MemoryRenderer } from '@/components/MemoryRenderer'
import { RotatingPrompts } from '@/components/RotatingPrompts'
import { ConfidencePill } from '@/components/ConfidencePill'
import { SupportingMemoriesDialog } from '@/components/SupportingMemoriesDialog'
import { SessionMemoriesDialog } from '@/components/SessionMemoriesDialog'
import type { Memory } from '@/types'

export interface UnifiedChatMessage {
    id: string
    question: string
    answer: string
    created_at: string | Date
    isLoading?: boolean
    startTime?: number
    endTime?: number
    // Memory-related fields
    confidence?: 'high' | 'medium' | 'low'
    reasoning?: string
    supporting_memories?: Memory[]
    excluded_memories?: Memory[]
    filtering_info?: {
        min_similarity_threshold?: number
        total_candidates?: number
        excluded_count?: number
        included_count?: number
    }
    // Session memories for demo pages
    session_memories?: Array<{
        memory_id?: string
        text: string
        created_at?: string
        grounded_text?: string
        similarity_score?: number
    }>
    hasMemory?: boolean
}

export interface UnifiedChatProps {
    // Required props
    messages: UnifiedChatMessage[]
    input: string
    onInputChange: (value: string) => void
    onSubmit: (e: React.FormEvent) => void
    isLoading: boolean
    
    // Empty state props
    title: string
    subtitle: string
    prompts?: string[]
    
    // Optional functionality
    onClearChat?: () => void
    placeholder?: string
    loadingText?: string
    
    // Styling props
    headerIcon?: React.ReactNode
    borderColor?: string
    headerBgColor?: string
    messageBgColor?: string
    buttonColor?: string
    badge?: React.ReactNode
    className?: string
    
    // Custom input component
    customInputComponent?: React.ReactNode
    
    // Memory display options
    showMemoryIndicators?: boolean
    showConfidence?: boolean
    showReasoning?: boolean
    showSupportingMemories?: boolean
    showExcludedMemories?: boolean
    
    // Layout options
    fixedHeight?: boolean
    height?: string
}

export function UnifiedChat({
    messages,
    input,
    onInputChange,
    onSubmit,
    isLoading,
    title,
    subtitle,
    prompts,
    onClearChat,
    placeholder = "Type your message...",
    loadingText = "thinking",
    headerIcon,
    borderColor = "border-gray-200",
    headerBgColor = "bg-gray-50",
    messageBgColor = "bg-gray-100",
    buttonColor = "bg-blue-600 hover:bg-blue-700",
    badge,
    className = "",
    customInputComponent,
    showMemoryIndicators = false,
    showConfidence = false,
    showReasoning = false,
    showSupportingMemories = false,
    showExcludedMemories = false,
    fixedHeight = false,
    height = "600px"
}: UnifiedChatProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const scrollAreaRef = useRef<HTMLDivElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom when new messages are added
    useEffect(() => {
        if (fixedHeight && messagesEndRef.current && scrollAreaRef.current) {
            // For fixed height containers (like ChatBox), use ScrollArea viewport
            const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement
            if (viewport) {
                viewport.scrollTo({
                    top: viewport.scrollHeight,
                    behavior: 'smooth'
                })
            }
        } else if (!fixedHeight && messagesEndRef.current && scrollContainerRef.current) {
            // For flexible height containers (like ask page), use container scroll
            scrollContainerRef.current.scrollTo({
                top: scrollContainerRef.current.scrollHeight,
                behavior: 'smooth'
            })
        }
    }, [messages, fixedHeight])

    const hasMessages = messages.length > 0

    // Render confidence pill
    const renderConfidencePill = (confidence: string) => (
        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
            confidence === 'high'
                ? 'bg-green-100 text-green-800'
                : confidence === 'medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
        }`}>
            {confidence} confidence
        </span>
    )

    // Default input component
    const defaultInputComponent = (
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
    )

    if (fixedHeight) {
        // Fixed height layout (for demo pages)
        return (
            <div className={`h-[${height}] flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm ${borderColor} ${className}`}>
                {/* Header */}
                <div className={`flex flex-col space-y-1.5 p-6 ${headerBgColor} border-b ${borderColor} rounded-t-lg`}>
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold leading-none tracking-tight flex items-center gap-2">
                            {headerIcon}
                            {title}
                            {badge}
                        </h3>
                        {onClearChat && hasMessages && (
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
                                            {message.isLoading ? (
                                                <div className="flex items-center gap-2">
                                                    <AnimatedThinking text={loadingText} />
                                                    {message.startTime && (
                                                        <ResponseTimer
                                                            startTime={message.startTime}
                                                            endTime={message.endTime}
                                                            isLoading={message.isLoading}
                                                        />
                                                    )}
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="whitespace-pre-wrap">{message.answer}</p>
                                                    {message.endTime && message.startTime && (
                                                        <div className="mt-1">
                                                            <ResponseTimer
                                                                startTime={message.startTime}
                                                                endTime={message.endTime}
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Memory indicators for demo pages */}
                                                    {showMemoryIndicators && (
                                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                                            {message.hasMemory && message.session_memories && message.session_memories.length > 0 ? (
                                                                <SessionMemoriesDialog
                                                                    memories={message.session_memories}
                                                                    excludedMemories={message.excluded_memories as any[]}
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
                                                                    memories={message.supporting_memories}
                                                                    excludedMemories={message.excluded_memories}
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
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {/* Scroll target */}
                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>
                    </div>
                    
                    {/* Input Form */}
                    <div className={`border-t ${borderColor} p-4`}>
                        {customInputComponent || defaultInputComponent}
                    </div>
                </div>
            </div>
        )
    }

    // Flexible height layout (for ask page)
    return (
        <div className={`relative h-full flex flex-col ${className}`}>
            {hasMessages ? (
                <>
                    <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto p-4 bg-white">
                        <div className="space-y-6">
                            {messages.map((message) => (
                                <div key={message.id} className="space-y-3">
                                    {/* User Question */}
                                    <div className="flex justify-end">
                                        <div className="max-w-[80%] bg-blue-500 text-white rounded-lg px-4 py-2">
                                            <div className="whitespace-pre-wrap">{message.question}</div>
                                            <div className="text-xs text-blue-100 mt-1">
                                                {new Date(message.created_at).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Assistant Answer */}
                                    <div className="flex justify-start">
                                        <div className="max-w-[80%] bg-gray-100 text-gray-900 rounded-lg px-4 py-2">
                                            {/* Confidence Badge */}
                                            {showConfidence && message.confidence && (
                                                <div className="mb-2">
                                                    {renderConfidencePill(message.confidence)}
                                                </div>
                                            )}

                                            {/* Answer */}
                                            {message.isLoading ? (
                                                <div className="flex items-center gap-2">
                                                    <AnimatedThinking text={loadingText} />
                                                    {message.startTime && (
                                                        <ResponseTimer 
                                                            startTime={message.startTime}
                                                            endTime={message.endTime}
                                                            isLoading={message.isLoading}
                                                        />
                                                    )}
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="whitespace-pre-wrap mb-2">{message.answer}</div>
                                                    {message.endTime && message.startTime && (
                                                        <ResponseTimer 
                                                            startTime={message.startTime}
                                                            endTime={message.endTime}
                                                            className="block mb-2"
                                                        />
                                                    )}
                                                </>
                                            )}

                                            {/* Reasoning */}
                                            {showReasoning && message.reasoning && (
                                                <div className="text-sm text-gray-600 italic mb-2">
                                                    {message.reasoning}
                                                </div>
                                            )}

                                            {/* Supporting Memories */}
                                            {showSupportingMemories && message.supporting_memories && message.supporting_memories.length > 0 && (
                                                <MemoryRenderer
                                                    memories={message.supporting_memories}
                                                    excludedMemories={message.excluded_memories}
                                                    filteringInfo={message.filtering_info}
                                                    type="supporting"
                                                />
                                            )}

                                            {/* Excluded Memories */}
                                            {showExcludedMemories && message.excluded_memories && message.excluded_memories.length > 0 && (
                                                <MemoryRenderer
                                                    memories={message.excluded_memories}
                                                    filteringInfo={message.filtering_info}
                                                    type="excluded"
                                                />
                                            )}

                                            <div className="text-xs text-gray-500 mt-1">
                                                {new Date(message.created_at).toLocaleTimeString()}
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
                        {customInputComponent || (
                            <div className="space-y-3 border p-4 rounded-xl shadow-md">
                                {defaultInputComponent}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                // Layout when no messages - input centered vertically with prompt
                <div className="flex-1 flex items-center justify-center -mt-40 bg-white">
                    <div className="w-full">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
                            <p className="text-gray-600">{subtitle}</p>
                        </div>
                        {prompts && <RotatingPrompts prompts={prompts} />}
                        {customInputComponent || (
                            <div className="space-y-3 border p-4 rounded-xl shadow-md">
                                {defaultInputComponent}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
