import { useState, useEffect, useCallback } from 'react'
import type { Conversation } from '@/types'
import type { RememberResponse } from '@/lib/api'

export interface MemorySaveResponse {
    success: boolean
    response: RememberResponse | null
    originalText: string
    timestamp: string
}

interface ChatState {
    conversations: Conversation[]
    memorySaveResponses: MemorySaveResponse[]
    lastUpdated: string
}

const CHAT_STORAGE_KEY = 'memory-chat-history'
const STORAGE_VERSION = '1.0'

export function usePersistentChat() {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [memorySaveResponses, setMemorySaveResponses] = useState<MemorySaveResponse[]>([])
    const [isLoaded, setIsLoaded] = useState(false)

    // Load chat history from localStorage on initialization
    useEffect(() => {
        try {
            const savedData = localStorage.getItem(CHAT_STORAGE_KEY)
            if (savedData) {
                const parsed = JSON.parse(savedData)
                
                // Validate the data structure and version
                if (parsed && parsed.version === STORAGE_VERSION && parsed.data) {
                    const { conversations: savedConversations, memorySaveResponses: savedMemorySaves } = parsed.data
                    
                    // Validate and restore conversations
                    if (Array.isArray(savedConversations)) {
                        setConversations(savedConversations.filter(conv => 
                            conv && 
                            typeof conv.id === 'string' && 
                            typeof conv.question === 'string' && 
                            typeof conv.answer === 'string' &&
                            typeof conv.timestamp === 'string'
                        ))
                    }
                    
                    // Validate and restore memory save responses
                    if (Array.isArray(savedMemorySaves)) {
                        setMemorySaveResponses(savedMemorySaves.filter(save => 
                            save && 
                            typeof save.success === 'boolean' && 
                            typeof save.originalText === 'string' &&
                            typeof save.timestamp === 'string'
                        ))
                    }
                    
                    console.log('Chat history loaded from localStorage', {
                        conversations: savedConversations?.length || 0,
                        memorySaves: savedMemorySaves?.length || 0
                    })
                }
            }
        } catch (error) {
            console.error('Failed to load chat history from localStorage:', error)
            // Clear corrupted data
            localStorage.removeItem(CHAT_STORAGE_KEY)
        } finally {
            setIsLoaded(true)
        }
    }, [])

    // Save chat history to localStorage whenever it changes
    const saveToStorage = useCallback((newConversations: Conversation[], newMemorySaves: MemorySaveResponse[]) => {
        try {
            const chatState: ChatState = {
                conversations: newConversations,
                memorySaveResponses: newMemorySaves,
                lastUpdated: new Date().toISOString()
            }

            const dataToSave = {
                version: STORAGE_VERSION,
                data: chatState,
                savedAt: new Date().toISOString()
            }

            localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(dataToSave))
            console.log('Chat history saved to localStorage', {
                conversations: newConversations.length,
                memorySaves: newMemorySaves.length
            })
        } catch (error) {
            console.error('Failed to save chat history to localStorage:', error)
        }
    }, [])

    // Add a new conversation and persist
    const addConversation = useCallback((conversation: Conversation) => {
        setConversations(prev => {
            const updated = [...prev, conversation]
            saveToStorage(updated, memorySaveResponses)
            return updated
        })
    }, [memorySaveResponses, saveToStorage])

    // Add a new memory save response and persist
    const addMemorySaveResponse = useCallback((saveResponse: MemorySaveResponse) => {
        setMemorySaveResponses(prev => {
            const updated = [...prev, saveResponse]
            saveToStorage(conversations, updated)
            return updated
        })
    }, [conversations, saveToStorage])

    // Update conversations array and persist
    const updateConversations = useCallback((newConversations: Conversation[]) => {
        setConversations(newConversations)
        saveToStorage(newConversations, memorySaveResponses)
    }, [memorySaveResponses, saveToStorage])

    // Update memory save responses array and persist
    const updateMemorySaveResponses = useCallback((newMemorySaves: MemorySaveResponse[] | ((prev: MemorySaveResponse[]) => MemorySaveResponse[])) => {
        if (typeof newMemorySaves === 'function') {
            setMemorySaveResponses(prev => {
                const updated = newMemorySaves(prev)
                saveToStorage(conversations, updated)
                return updated
            })
        } else {
            setMemorySaveResponses(newMemorySaves)
            saveToStorage(conversations, newMemorySaves)
        }
    }, [conversations, saveToStorage])

    // Clear all chat history
    const clearChatHistory = useCallback(() => {
        setConversations([])
        setMemorySaveResponses([])
        localStorage.removeItem(CHAT_STORAGE_KEY)
        console.log('Chat history cleared')
    }, [])

    // Get total message count for debugging
    const getTotalMessageCount = useCallback(() => {
        return conversations.length * 2 + memorySaveResponses.length * 2 // Each conversation = 2 messages, each memory save = 2 messages
    }, [conversations.length, memorySaveResponses.length])

    // Export chat history as JSON
    const exportChatHistory = useCallback(() => {
        const exportData = {
            conversations,
            memorySaveResponses,
            exportedAt: new Date().toISOString(),
            version: STORAGE_VERSION
        }
        return JSON.stringify(exportData, null, 2)
    }, [conversations, memorySaveResponses])

    // Import chat history from JSON
    const importChatHistory = useCallback((jsonData: string) => {
        try {
            const imported = JSON.parse(jsonData)
            if (imported.conversations && imported.memorySaveResponses) {
                setConversations(imported.conversations)
                setMemorySaveResponses(imported.memorySaveResponses)
                saveToStorage(imported.conversations, imported.memorySaveResponses)
                return true
            }
            return false
        } catch (error) {
            console.error('Failed to import chat history:', error)
            return false
        }
    }, [saveToStorage])

    return {
        // State
        conversations,
        memorySaveResponses,
        isLoaded,
        
        // Actions
        addConversation,
        addMemorySaveResponse,
        updateConversations,
        updateMemorySaveResponses,
        clearChatHistory,
        
        // Utilities
        getTotalMessageCount,
        exportChatHistory,
        importChatHistory
    }
}
