// API client for Memory Agent
const DEFAULT_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001'

export interface ApiMemory {
    id?: string
    content?: string
    text?: string  // Alternative field name
    memory?: string  // Alternative field name
    original_text?: string
    grounded_text?: string
    timestamp?: string
    created_at?: string  // Alternative field name
    formatted_time?: string
    score?: number  // Similarity score
    relevance_score?: number
    grounding_applied?: boolean
    grounding_info?: {
        dependencies_found?: {
            spatial?: string[]
            environmental?: string[]
            temporal?: string[]
            social?: string[]
        }
        changes_made?: Array<{
            original: string
            replacement: string
            type: string
        }>
        unresolved_references?: string[]
    }
    context_snapshot?: {
        temporal?: {
            date?: string
            time?: string
            iso_date?: string
            day_of_week?: string
            month?: string
            year?: number
        }
        spatial?: {
            location?: string
            activity?: string
        }
        social?: {
            people_present?: string[]
        }
        environmental?: {
            weather?: string
            temperature?: string
            mood?: string
            [key: string]: any
        }
    }
    metadata?: {
        location?: string
        tags?: string[]
        confidence?: number
    }
}

export interface ApiResponse<T> {
    success: boolean
    error?: string
    data?: T
}

export interface RememberResponse {
    success: boolean
    memory_id: string
    message: string
    grounding_applied?: boolean
    original_text?: string
    grounded_text?: string
    grounding_info?: {
        dependencies_found?: {
            spatial?: string[]
            environmental?: string[]
            temporal?: string[]
            social?: string[]
        }
        changes_made?: Array<{
            original: string
            replacement: string
            type: string
        }>
        unresolved_references?: string[]
    }
    context_snapshot?: {
        temporal?: {
            date?: string
            time?: string
            iso_date?: string
            day_of_week?: string
            month?: string
            year?: number
        }
        spatial?: {
            location?: string
            activity?: string
        }
        social?: {
            people_present?: string[]
        }
        environmental?: {
            weather?: string
            temperature?: string
            mood?: string
            [key: string]: any
        }
    }
}

export interface RecallResponse {
    success: boolean
    memories: ApiMemory[]
    count: number
}

export interface AskResponse {
    success: boolean
    type: string
    answer: string
    confidence: 'high' | 'medium' | 'low'
    reasoning: string
    supporting_memories: ApiMemory[]
    question?: string
}

export interface ChatResponse {
    success: boolean
    message: string
    response: string
}

export interface ChatSessionConfig {
    model?: string
    temperature?: number
    max_tokens?: number
    use_memory?: boolean
    save_memory?: boolean
}

export interface CreateSessionRequest {
    system_prompt: string
    session_id?: string
    config?: ChatSessionConfig
    use_memory?: boolean
    save_memory?: boolean
}

export interface CreateSessionResponse {
    success: boolean
    session_id: string
    created_at?: string
    system_prompt?: string
    use_memory?: boolean
    message?: string
}

export interface SessionChatRequest {
    session_id: string
    message: string
}

export interface SessionChatResponse {
    success: boolean
    message: string
    session_id: string
    conversation_length?: number
    timestamp?: string
    memory_context?: {
        memories_used: number
        memories: Array<{
            memory_id: string
            text: string
            timestamp: string
            grounded_text: string
            similarity_score: number
        }>
    }
}

export interface StatusResponse {
    status: 'ready' | 'not_initialized' | 'healthy'
    timestamp: string
}

export interface DeleteResponse {
    success: boolean
    message: string
    memory_id: string
}

export interface ClearAllResponse {
    success: boolean
    message: string
    deleted_count: number
}

export interface ContextResponse {
    success: boolean
    context: {
        temporal?: {
            date?: string
            time?: string
            iso_date?: string
            day_of_week?: string
            month?: string
            year?: number
        }
        spatial?: {
            location?: string
            activity?: string
        }
        social?: {
            people_present?: string[]
        }
        environmental?: {
            weather?: string
            temperature?: string
            mood?: string
            [key: string]: any
        }
    }
    message?: string
}

export interface MemoryInfoResponse {
    success: boolean
    memory_count: number
    vector_dimension: number
    vectorset_name: string
    embedding_model: string
    redis_host: string
    redis_port: number
    vectorset_info: {
        'quant-type': string
        'hnsw-m': number
        'vector-dim': number
        size: number
        'max-level': number
        'attributes-count': number
    }
    timestamp: string
}

class MemoryAgentAPI {
    private baseUrl: string

    constructor(baseUrl: string = DEFAULT_API_BASE_URL) {
        this.baseUrl = baseUrl
    }

    // Method to update the base URL dynamically
    updateBaseUrl(newBaseUrl: string) {
        this.baseUrl = newBaseUrl
    }

    // Method to get current base URL
    getBaseUrl(): string {
        return this.baseUrl
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`

        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        })

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`)
        }

        return response.json()
    }

    async remember(memory: string, applyGrounding: boolean = true): Promise<RememberResponse> {
        return this.request<RememberResponse>('/api/memory', {
            method: 'POST',
            body: JSON.stringify({ text: memory, apply_grounding: applyGrounding }),
        })
    }

    async recall(query: string, topK: number = 5): Promise<RecallResponse> {
        return this.request<RecallResponse>('/api/memory/search', {
            method: 'POST',
            body: JSON.stringify({ query, top_k: topK }),
        })
    }

    async ask(question: string, topK: number = 5): Promise<AskResponse> {
        return this.request<AskResponse>('/api/memory/answer', {
            method: 'POST',
            body: JSON.stringify({ question, top_k: topK }),
        })
    }

    // New chat endpoint for conversational interface
    async chat(message: string): Promise<ChatResponse> {
        return this.request<ChatResponse>('/api/chat', {
            method: 'POST',
            body: JSON.stringify({ message }),
        })
    }

    // Session-based chat endpoints
    async createChatSession(request: CreateSessionRequest): Promise<CreateSessionResponse> {
        return this.request<CreateSessionResponse>('/api/chat/session', {
            method: 'POST',
            body: JSON.stringify(request),
        })
    }

    async chatWithSession(request: SessionChatRequest): Promise<SessionChatResponse> {
        return this.request<SessionChatResponse>(`/api/chat/session/${request.session_id}`, {
            method: 'POST',
            body: JSON.stringify({ message: request.message }),
        })
    }

    async getStatus(): Promise<StatusResponse> {
        return this.request<StatusResponse>('/api/health')
    }

    async getMemoryInfo(): Promise<MemoryInfoResponse> {
        return this.request<MemoryInfoResponse>('/api/memory')
    }

    async deleteMemory(memoryId: string): Promise<DeleteResponse> {
        return this.request<DeleteResponse>(`/api/memory/${memoryId}`, {
            method: 'DELETE',
        })
    }

    async getContext(): Promise<ContextResponse> {
        return this.request<ContextResponse>('/api/memory/context')
    }

    async setContext(context: {
        location?: string
        activity?: string
        people_present?: string[]
        weather?: string
        temperature?: string
        mood?: string
        [key: string]: any
    }): Promise<ContextResponse> {
        return this.request<ContextResponse>('/api/memory/context', {
            method: 'POST',
            body: JSON.stringify(context),
        })
    }

    async clearAllMemories(): Promise<ClearAllResponse> {
        return this.request<ClearAllResponse>('/api/memory', {
            method: 'DELETE',
        })
    }
}

// Export the MemoryAgentAPI class for direct instantiation
export { MemoryAgentAPI }

// Create a default instance for backward compatibility
export const memoryAPI = new MemoryAgentAPI()
