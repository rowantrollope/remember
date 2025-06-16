"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfidencePill } from "@/components/ConfidencePill"
import { SupportingMemoriesDialog } from "@/components/SupportingMemoriesDialog"
import { User, Bot, CheckCircle, Anchor, MessageCircle, Save } from "lucide-react"
import type { Conversation } from "@/types"
import type { RememberResponse } from "@/lib/api"
import { formatTimestamp } from "@/utils/formatters"
import { useEffect, useRef } from "react"

interface ChatMessage {
    id: string
    type: 'user' | 'assistant' | 'memory_saved'
    content: string
    timestamp: string
    // For assistant messages
    confidence?: 'high' | 'medium' | 'low'
    reasoning?: string
    supporting_memories?: any[]
    // For memory saved messages
    memoryResponse?: RememberResponse | null
    originalText?: string
}

interface MemoryChatTabProps {
    conversations: Conversation[]
    memorySaveResponses: Array<{
        success: boolean
        response: RememberResponse | null
        originalText: string
        timestamp: string
    }>
    chatMode: 'ask' | 'save'
    onChatModeChange: (mode: 'ask' | 'save') => void
}

export function MemoryChatTab({
    conversations,
    memorySaveResponses,
    chatMode,
    onChatModeChange
}: MemoryChatTabProps) {
    const scrollAreaRef = useRef<HTMLDivElement>(null)

    // Combine conversations and memory saves into a unified chat history
    const allMessages: ChatMessage[] = [
        // Convert conversations to chat messages
        ...conversations.flatMap(conv => [
            {
                id: `user-${conv.id}`,
                type: 'user' as const,
                content: conv.question,
                timestamp: conv.timestamp
            },
            {
                id: `assistant-${conv.id}`,
                type: 'assistant' as const,
                content: conv.answer,
                timestamp: conv.timestamp,
                confidence: conv.confidence,
                reasoning: conv.reasoning,
                supporting_memories: conv.supporting_memories
            }
        ]),
        // Convert memory saves to chat messages (user input + system response)
        ...memorySaveResponses.flatMap(save => [
            {
                id: `memory-user-${save.timestamp}`,
                type: 'user' as const,
                content: `Add memory: ${save.originalText}`,
                timestamp: save.timestamp
            },
            {
                id: `memory-saved-${save.timestamp}`,
                type: 'memory_saved' as const,
                content: save.originalText,
                timestamp: save.timestamp,
                memoryResponse: save.response,
                originalText: save.originalText
            }
        ])
    ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (scrollAreaRef.current) {
            // Use setTimeout to ensure DOM has been updated
            setTimeout(() => {
                const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
                if (scrollContainer) {
                    scrollContainer.scrollTop = scrollContainer.scrollHeight
                }
            }, 100)
        }
    }, [allMessages.length])

    const renderMessage = (message: ChatMessage) => {
        switch (message.type) {
            case 'user':
                return (
                    <div key={message.id} className="flex justify-end mb-4">
                        <div className="flex items-start gap-2 max-w-[80%]">
                            <div className="bg-blue-500 text-white rounded-lg px-4 py-2 rounded-br-sm">
                                <p className="text-sm">{message.content}</p>
                            </div>
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-white" />
                            </div>
                        </div>
                    </div>
                )

            case 'assistant':
                return (
                    <div key={message.id} className="flex justify-start mb-4">
                        <div className="flex items-start gap-2 max-w-[80%]">
                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-gray-100 rounded-lg px-4 py-2 rounded-bl-sm">
                                <p className="text-sm text-gray-800 mb-2">{message.content}</p>
                                
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    {message.confidence && (
                                        <ConfidencePill confidence={message.confidence} />
                                    )}
                                    
                                    {message.supporting_memories && message.supporting_memories.length > 0 && (
                                        <SupportingMemoriesDialog 
                                            memories={message.supporting_memories} 
                                            className="text-xs"
                                        />
                                    )}
                                </div>

                                {message.reasoning && (
                                    <p className="text-xs text-gray-500 mt-2 italic">
                                        {message.reasoning}
                                    </p>
                                )}

                                <p className="text-xs text-gray-400 mt-1">
                                    {formatTimestamp(message.timestamp)}
                                </p>
                            </div>
                        </div>
                    </div>
                )

            case 'memory_saved':
                return (
                    <div key={message.id} className="flex justify-start mb-4">
                        <div className="flex items-start gap-2 max-w-[80%]">
                            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 rounded-bl-sm">
                                <p className="text-sm text-green-800 font-medium mb-2">
                                    Added a new memory: &ldquo;{message.content}&rdquo;
                                </p>
                                
                                {message.memoryResponse && (
                                    <div className="space-y-2">
                                        <div className="text-xs text-green-700">
                                            <strong>Memory ID:</strong> {message.memoryResponse.memory_id}
                                        </div>
                                        
                                        {message.memoryResponse.grounded_text && 
                                         message.memoryResponse.grounded_text !== message.originalText && (
                                            <div className="text-xs text-green-700">
                                                <strong>Grounded as:</strong> &ldquo;{message.memoryResponse.grounded_text}&rdquo;
                                            </div>
                                        )}

                                        {message.memoryResponse.grounding_applied && (
                                            <Badge className="text-xs bg-blue-100 text-blue-800">
                                                <Anchor className="w-3 h-3 mr-1" />
                                                Contextual Grounding Applied
                                            </Badge>
                                        )}

                                        {message.memoryResponse.context_snapshot && (
                                            <div className="text-xs text-green-600">
                                                <strong>Context:</strong> {
                                                    [
                                                        message.memoryResponse.context_snapshot.temporal?.date,
                                                        message.memoryResponse.context_snapshot.spatial?.location,
                                                        message.memoryResponse.context_snapshot.environmental?.mood
                                                    ].filter(Boolean).join(', ')
                                                }
                                            </div>
                                        )}
                                    </div>
                                )}

                                <p className="text-xs text-green-500 mt-2">
                                    {formatTimestamp(message.timestamp)}
                                </p>
                            </div>
                        </div>
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <div className="flex flex-col h-full">
            {/* Mode Tabs */}
            <div className="flex border-b border-gray-200 bg-white">
                <Button
                    variant="ghost"
                    onClick={() => onChatModeChange('ask')}
                    className={`flex items-center gap-2 rounded-none border-b-2 px-6 py-3 ${
                        chatMode === 'ask'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-transparent hover:bg-gray-50'
                    }`}
                    type="button"
                >
                    <MessageCircle className="w-4 h-4" />
                    Ask your memory
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => onChatModeChange('save')}
                    className={`flex items-center gap-2 rounded-none border-b-2 px-6 py-3 ${
                        chatMode === 'save'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-transparent hover:bg-gray-50'
                    }`}
                    type="button"
                >
                    <Save className="w-4 h-4" />
                    Add new memory
                </Button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 min-h-0">
                <ScrollArea ref={scrollAreaRef} className="h-full">
                    <div className="p-4">
                        {allMessages.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                            </div>
                        ) : (
                            allMessages.map(renderMessage)
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}
