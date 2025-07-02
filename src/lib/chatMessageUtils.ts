import type { UnifiedChatMessage } from '@/components/ChatBox'
import type { Conversation } from '@/types'
import type { ApiMemory } from '@/lib/api'
import type { MemorySaveResponse, RecallResponse } from '@/hooks/usePersistentChat'

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

// Convert search results to UnifiedChatMessage format
export interface SearchResult {
    id: string
    query: string
    memories: ApiMemory[]
    memory_count: number
    created_at: string
    excluded_memories?: ApiMemory[]
    filtering_info?: {
        min_similarity_threshold?: number
        total_candidates?: number
        excluded_count?: number
        included_count?: number
    }
}

export function searchResultsToMessages(results: SearchResult[]): UnifiedChatMessage[] {
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

        // Search results response
        messages.push({
            id: `${result.id}-response`,
            type: 'recall_result',
            content: `Found ${result.memory_count} memories matching "${result.query}"`,
            created_at: result.created_at,
            memory_count: result.memory_count,
            supporting_memories: result.memories,
            excluded_memories: result.excluded_memories,
            filtering_info: result.filtering_info
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
            save_success: !isThinking && saveResponse.success,
            grounding_applied: saveResponse.response?.grounding_applied,
            grounding_info: saveResponse.response?.grounding_info,
            context_snapshot: saveResponse.response?.context_snapshot,
            original_text: saveResponse.response?.original_text,
            grounded_text: saveResponse.response?.grounded_text
        })
    })

    return messages
}

// Convert recall responses to UnifiedChatMessage format
export function recallResponsesToMessages(responses: RecallResponse[]): UnifiedChatMessage[] {
    const messages: UnifiedChatMessage[] = []

    responses.forEach((recallResponse, index) => {
        // User query
        messages.push({
            id: `recall-${index}-query`,
            type: 'user',
            content: recallResponse.originalQuery,
            created_at: recallResponse.timestamp
        })

        // Recall response
        if (recallResponse.success && recallResponse.response) {
            messages.push({
                id: `recall-${index}-response`,
                type: 'recall_result',
                content: `Found ${recallResponse.response.memories.length} memories matching "${recallResponse.originalQuery}"`,
                created_at: recallResponse.timestamp,
                memory_count: recallResponse.response.memories.length,
                supporting_memories: recallResponse.response.memories,
                excluded_memories: recallResponse.response.excluded_memories,
                filtering_info: recallResponse.response.filtering_info
            })
        } else {
            messages.push({
                id: `recall-${index}-response`,
                type: 'assistant',
                content: "Failed to search memories",
                created_at: recallResponse.timestamp
            })
        }
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
