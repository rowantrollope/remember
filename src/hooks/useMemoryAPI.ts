import { useState, useEffect, useCallback } from "react"
import { useConfiguredAPI } from "./useConfiguredAPI"
import type { Memory, Conversation, ApiStatus, ContextInfo } from "@/types"

export function useMemoryAPI() {
    console.log('useMemoryAPI: Hook called')
    const [memories, setMemories] = useState<Memory[]>([])
    const [searchResults, setSearchResults] = useState<Memory[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [apiStatus, setApiStatus] = useState<ApiStatus>('unknown')
    const [currentContext, setCurrentContext] = useState<ContextInfo | null>(null)
    const [groundingEnabled, setGroundingEnabled] = useState(true)

    // Get the configured API client
    const { api: memoryAPI, isLoaded } = useConfiguredAPI()
    console.log('useMemoryAPI: Got API instance, isLoaded:', isLoaded)

    // Check API status on mount and when API configuration changes
    useEffect(() => {
        console.log('useMemoryAPI: useEffect running, isLoaded:', isLoaded, 'memoryAPI:', !!memoryAPI)
        const initializeAPI = async () => {
            try {
                console.log('Initializing API, isLoaded:', isLoaded, 'baseUrl:', memoryAPI.getBaseUrl())
                setApiStatus('unknown') // Reset to unknown while checking
                const status = await memoryAPI.getStatus()
                console.log('API status response:', status)
                // Map 'healthy' status from server to 'ready' for frontend
                const mappedStatus = status.status === 'healthy' ? 'ready' : status.status
                setApiStatus(mappedStatus)
                setError(null) // Clear any previous errors
                console.log('API status set to:', mappedStatus)
            } catch (error) {
                console.error('API status check failed:', error)
                setApiStatus('not_initialized')
                setError(`Failed to connect to Memory Agent API: ${error instanceof Error ? error.message : 'Unknown error'}`)
            }
        }
        initializeAPI()
    }, [])

    const saveMemory = async (content: string) => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await memoryAPI.remember(content, groundingEnabled)

            // Debug logging to see what the API returns
            console.log('Save memory API response:', response)
            console.log('Grounding enabled:', groundingEnabled)

            if (response.success) {
                const newMemory: Memory = {
                    id: response.memory_id,
                    content,
                    text: response.grounded_text || content,
                    original_text: response.original_text,
                    grounded_text: response.grounded_text,
                    timestamp: new Date().toISOString(),
                    grounding_applied: response.grounding_applied,
                    grounding_info: response.grounding_info,
                    context_snapshot: response.context_snapshot,
                    metadata: {
                        tags: ["user-input"],
                        confidence: 0.9,
                    },
                }

                setMemories((prev) => [newMemory, ...prev])
                return { success: true, response }
            } else {
                setError('Failed to save memory')
                return { success: false, response: null }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save memory')
            return { success: false, response: null }
        } finally {
            setIsLoading(false)
        }
    }

    const askQuestion = async (question: string, topK: number = 5) => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await memoryAPI.ask(question, topK)

            if (response.success) {
                // Convert supporting memories to the Memory format
                const supportingMemories: Memory[] = response.supporting_memories?.map((mem, index) => {
                    const content = mem.content || mem.text || mem.memory || 'No content available'
                    const timestamp = mem.timestamp || mem.created_at || new Date().toISOString()
                    const id = mem.id || `supporting-memory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`

                    return {
                        id,
                        content,
                        text: mem.text,
                        original_text: mem.original_text,
                        grounded_text: mem.grounded_text,
                        timestamp,
                        formatted_time: mem.formatted_time,
                        grounding_applied: mem.grounding_applied,
                        grounding_info: mem.grounding_info,
                        context_snapshot: mem.context_snapshot,
                        metadata: {
                            ...mem.metadata,
                            score: mem.score,
                            relevance_score: mem.relevance_score
                        }
                    }
                }) || []

                const newConversation: Conversation = {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    question,
                    answer: response.answer,
                    timestamp: new Date().toISOString(),
                    confidence: response.confidence,
                    reasoning: response.reasoning,
                    supporting_memories: supportingMemories,
                }

                // Don't store in local state - let the calling component handle persistence
                return { success: true, conversation: newConversation }
            } else {
                setError('Failed to get answer from Memory Agent')
                return false
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to ask question')
            return false
        } finally {
            setIsLoading(false)
        }
    }

    const searchMemories = async (query: string, topK: number = 5) => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await memoryAPI.recall(query, topK)

            // Debug logging to see what the search returns
            console.log('Search memories API response:', response)
            console.log('Number of memories found:', response.memories?.length || 0)
            if (response.memories?.length > 0) {
                console.log('First memory grounding info:', {
                    grounding_applied: response.memories[0].grounding_applied,
                    grounding_info: response.memories[0].grounding_info,
                    original_text: response.memories[0].original_text,
                    grounded_text: response.memories[0].grounded_text
                })
            }

            if (response.success) {
                const formattedMemories: Memory[] = response.memories.map((mem, index) => {
                    const content = mem.content || mem.text || mem.memory || 'No content available'
                    const timestamp = mem.timestamp || mem.created_at || new Date().toISOString()
                    const id = mem.id || `memory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`

                    return {
                        id,
                        content,
                        text: mem.text,
                        original_text: mem.original_text,
                        grounded_text: mem.grounded_text,
                        timestamp,
                        formatted_time: mem.formatted_time,
                        grounding_applied: mem.grounding_applied,
                        grounding_info: mem.grounding_info,
                        context_snapshot: mem.context_snapshot,
                        metadata: {
                            ...mem.metadata,
                            score: mem.score,
                            relevance_score: mem.relevance_score
                        }
                    }
                })

                // Debug logging for formatted memories
                console.log('Formatted memories for display:', formattedMemories.map(mem => ({
                    id: mem.id,
                    content: mem.content,
                    grounding_applied: mem.grounding_applied,
                    has_grounding_info: !!mem.grounding_info
                })))

                setSearchResults(formattedMemories)
                return true
            } else {
                setError('Failed to search memories')
                return false
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to search memories')
            return false
        } finally {
            setIsLoading(false)
        }
    }

    const deleteMemory = async (memoryId: string) => {
        try {
            const response = await memoryAPI.deleteMemory(memoryId)

            if (response.success) {
                // Remove the memory from search results
                setSearchResults((prev) => prev.filter(memory => memory.id !== memoryId))
                return true
            } else {
                setError('Failed to delete memory')
                return false
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete memory')
            return false
        }
    }

    const clearAllMemories = async () => {
        try {
            const response = await memoryAPI.clearAllMemories()

            if (response.success) {
                // Clear all local state
                setMemories([])
                setSearchResults([])
                // Note: conversations are managed by usePersistentChat hook
                return { success: true, deletedCount: response.deleted_count }
            } else {
                setError('Failed to clear all memories')
                return { success: false, deletedCount: 0 }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to clear all memories')
            return { success: false, deletedCount: 0 }
        }
    }

    const getContext = useCallback(async () => {
        try {
            const response = await memoryAPI.getContext()
            if (response.success) {
                setCurrentContext(response.context)
                return response.context
            }
            return null
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to get context')
            return null
        }
    }, [memoryAPI])

    const updateContext = useCallback(async (context: {
        location?: string
        activity?: string
        people_present?: string[]
        weather?: string
        temperature?: string
        mood?: string
        [key: string]: any
    }) => {
        try {
            const response = await memoryAPI.setContext(context)
            if (response.success) {
                setCurrentContext(response.context)
                return true
            }
            return false
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update context')
            return false
        }
    }, [memoryAPI])

    const clearError = () => setError(null)

    return {
        // State
        memories,
        searchResults,
        isLoading,
        error,
        apiStatus,
        currentContext,
        groundingEnabled,

        // Actions
        saveMemory,
        askQuestion,
        searchMemories,
        deleteMemory,
        clearAllMemories,
        getContext,
        updateContext,
        setGroundingEnabled,
        clearError,
    }
}
