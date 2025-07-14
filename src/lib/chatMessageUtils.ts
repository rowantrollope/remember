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

        // Create a nicely formatted success message
        const formatSuccessMessage = (response: any) => {
            if (!response) return "Memory saved successfully"

            const memoryId = response.memory_id

            let message = `✅ Memory "${saveResponse.originalText}" saved successfully!\n\n`

            // Add grounding information if available
            if (response.grounding_applied) {
                message += `🔗 Contextual grounding applied\n`

                if (response.grounding_info?.changes_made && response.grounding_info.changes_made.length > 0) {
                    message += `📝 Enhanced with context:\n`
                    response.grounding_info.changes_made.forEach((change: any) => {
                        message += `   • "${change.original}" → "${change.replacement}"\n`
                    })
                }

                if (response.grounding_info?.dependencies_found) {
                    const deps = response.grounding_info.dependencies_found
                    if (deps.temporal && deps.temporal.length > 0) {
                        message += `⏰ Temporal context: ${deps.temporal.join(', ')}\n`
                    }
                    if (deps.spatial && deps.spatial.length > 0) {
                        message += `📍 Location context: ${deps.spatial.join(', ')}\n`
                    }
                    if (deps.social && deps.social.length > 0) {
                        message += `👥 Social context: ${deps.social.join(', ')}\n`
                    }
                    if (deps.environmental && deps.environmental.length > 0) {
                        message += `🌍 Environmental context: ${deps.environmental.join(', ')}\n`
                    }
                }
            } else {
                message += `📝 Stored as provided (no contextual grounding)\n`
            }

            // Add context snapshot information if available
            if (response.context_snapshot) {
                const context = response.context_snapshot
                message += `\n📊 Context captured:\n`

                if (context.temporal?.date) {
                    message += `   📅 Date: ${context.temporal.date}\n`
                }
                if (context.spatial?.location) {
                    message += `   📍 Location: ${context.spatial.location}\n`
                }
                if (context.spatial?.activity) {
                    message += `   🎯 Activity: ${context.spatial.activity}\n`
                }
                if (context.environmental?.mood) {
                    message += `   😊 Mood: ${context.environmental.mood}\n`
                }
            }

            message += `\n🆔 Full Memory ID: ${memoryId}`

            return message
        }

        messages.push({
            id: `save-${index}-response`,
            type: 'memory_save',
            content: isThinking ?
                "Thinking..." :
                formatSuccessMessage(saveResponse.response),
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
