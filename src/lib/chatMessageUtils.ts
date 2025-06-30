import type { UnifiedChatMessage } from '@/components/ChatBox'
import type { Conversation } from '@/types'
import type { RecallMentalStateResponse, ApiMemory } from '@/lib/api'
import type { MemorySaveResponse } from '@/hooks/usePersistentChat'

// Convert Conversation (from ask API) to UnifiedChatMessage format
export function conversationToMessages(conversations: Conversation[]): UnifiedChatMessage[] {
    const messages: UnifiedChatMessage[] = []
    
    conversations.forEach(conv => {
        // User question
        messages.push({
            id: `${conv.id}-question`,
            type: 'user',
            content: conv.question,
            created_at: conv.created_at,
            user_question: conv.question
        })
        
        // Assistant answer
        messages.push({
            id: `${conv.id}-answer`,
            type: 'assistant',
            content: conv.answer,
            created_at: conv.created_at,
            confidence: conv.confidence,
            reasoning: conv.reasoning,
            supporting_memories: conv.supporting_memories,
            excluded_memories: conv.excluded_memories,
            filtering_info: conv.filtering_info
        })
    })
    
    return messages
}

// Convert recall results to UnifiedChatMessage format
export interface RecallResult {
    id: string
    query: string
    mental_state: string
    memories: ApiMemory[]
    memory_count: number
    created_at: string
}

export function recallResultsToMessages(results: RecallResult[]): UnifiedChatMessage[] {
    const messages: UnifiedChatMessage[] = []
    
    results.forEach(result => {
        // User query
        messages.push({
            id: `${result.id}-query`,
            type: 'user',
            content: result.query,
            created_at: result.created_at,
            user_question: result.query
        })
        
        // Mental state response
        messages.push({
            id: `${result.id}-response`,
            type: 'recall_result',
            content: result.mental_state,
            created_at: result.created_at,
            mental_state: result.mental_state,
            memory_count: result.memory_count,
            supporting_memories: result.memories
        })
    })
    
    return messages
}

// Convert memory save responses to UnifiedChatMessage format
export function memorySaveResponsesToMessages(responses: MemorySaveResponse[]): UnifiedChatMessage[] {
    const messages: UnifiedChatMessage[] = []
    
    responses.forEach((saveResponse, index) => {
        // User input
        messages.push({
            id: `save-${index}-input`,
            type: 'user',
            content: `Add memory: ${saveResponse.originalText}`,
            created_at: saveResponse.timestamp
        })
        
        // System response
        const isThinking = saveResponse.response?.message === "thinking..."
        messages.push({
            id: `save-${index}-response`,
            type: 'memory_save',
            content: isThinking ? 
                "Thinking..." : 
                `✓ Memory saved successfully\nMemory ID: ${saveResponse.response?.memory_id}`,
            created_at: saveResponse.timestamp,
            memory_id: saveResponse.response?.memory_id,
            save_success: !isThinking && saveResponse.success
        })
    })
    
    return messages
}

// Convert simple chat messages to UnifiedChatMessage format
export interface SimpleChatMessage {
    id: string
    type: 'user' | 'assistant'
    content: string
    created_at: string
}

export function simpleChatToMessages(chatHistory: SimpleChatMessage[]): UnifiedChatMessage[] {
    return chatHistory.map(msg => ({
        id: msg.id,
        type: msg.type,
        content: msg.content,
        created_at: msg.created_at
    }))
}

// Helper to add a "thinking" message
export function createThinkingMessage(id: string): UnifiedChatMessage {
    return {
        id: `thinking-${id}`,
        type: 'assistant',
        content: "thinking...",
        created_at: new Date().toISOString()
    }
}

// Helper to update a thinking message with real response
export function updateThinkingMessage(
    messages: UnifiedChatMessage[], 
    thinkingId: string, 
    newMessage: Partial<UnifiedChatMessage>
): UnifiedChatMessage[] {
    return messages.map(msg => 
        msg.id === thinkingId ? { ...msg, ...newMessage } : msg
    )
}
