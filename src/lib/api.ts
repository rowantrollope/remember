// API client for Memory Agent
const DEFAULT_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001'

export interface ApiMemory {
    id?: string
    content?: string
    text?: string  // Alternative field name
    memory?: string  // Alternative field name
    original_text?: string
    grounded_text?: string
    timestamp?: string | number
    created_at?: string  // Alternative field name
    formatted_time?: string
    score?: number  // Vector similarity score (0-1)
    relevance_score?: number  // Enhanced relevance score with recency bias and access count
    grounding_applied?: boolean
    // New fields from updated memory format
    tags?: string[]
    last_accessed_at?: string
    access_count?: number
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
        [key: string]: any
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
    excluded_memories?: ApiMemory[]
    filtering_info?: {
        min_similarity_threshold?: number
        total_candidates?: number
        excluded_count?: number
        included_count?: number
    }
}

export interface AskResponse {
    success: boolean
    question: string
    answer: string
    confidence: string
    reasoning: string
    supporting_memories: ApiMemory[]
    excluded_memories?: ApiMemory[]
    filtering_info?: {
        min_similarity_threshold?: number
        total_candidates?: number
        excluded_count?: number
        included_count?: number
    }
}

export interface ChatResponse {
    success: boolean
    message: string
    response: string
}

export interface ChatSessionConfig {
    use_memory?: boolean
    model?: string
    temperature?: number
    max_tokens?: number
    top_k?: number
}

export interface CreateSessionRequest {
    system_prompt: string
    session_id?: string
    config?: ChatSessionConfig
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
    top_k?: number
    min_similarity?: number
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
        excluded_memories?: Array<{
            memory_id: string
            text: string
            timestamp: string
            grounded_text: string
            similarity_score: number
        }>
        filtering_info?: {
            min_similarity_threshold?: number
            total_candidates?: number
            excluded_count?: number
            included_count?: number
        }
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

export interface RecallMentalStateResponse {
    success: boolean
    query: string
    mental_state: string
    memories: ApiMemory[]
    memory_count: number
    excluded_memories?: ApiMemory[]
    filtering_info?: {
        min_similarity_threshold?: number
        total_candidates?: number
        excluded_count?: number
        included_count?: number
    }
}

export interface GetSessionResponse {
    success: boolean
    session_id: string
    system_prompt: string
    created_at: string
    use_memory: boolean
    conversation_length: number
}

export interface DeleteSessionResponse {
    success: boolean
    message: string
    session_id: string
}

export interface GetSessionsResponse {
    success: boolean
    sessions: Array<{
        session_id: string
        created_at: string
        system_prompt: string
        use_memory: boolean
        conversation_length: number
    }>
}

export interface ExtractMemoriesResponse {
    success: boolean
    raw_input: string
    extracted_memories: Array<{
        text: string
        memory_id: string
        grounding_applied: boolean
    }>
    context_prompt?: string
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

        const data = await response.json()

        // Handle error responses that don't follow the expected format
        if (data.error && !data.success) {
            throw new Error(data.error)
        }

        return data
    }

    async remember(memory: string, applyGrounding: boolean = true): Promise<RememberResponse> {
        return this.request<RememberResponse>('/api/memory', {
            method: 'POST',
            body: JSON.stringify({ text: memory, apply_grounding: applyGrounding }),
        })
    }

    async recall(query: string, topK: number = 5, minSimilarity?: number): Promise<RecallResponse> {
        const body: any = { query, top_k: topK }
        if (minSimilarity !== undefined) {
            body.min_similarity = minSimilarity
        }
        return this.request<RecallResponse>('/api/memory/search', {
            method: 'POST',
            body: JSON.stringify(body),
        })
    }

    async ask(question: string, topK: number = 5, minSimilarity?: number): Promise<AskResponse> {
        const body: any = { question, top_k: topK }
        if (minSimilarity !== undefined) {
            body.min_similarity = minSimilarity
        }
        return this.request<AskResponse>('/api/klines/ask', {
            method: 'POST',
            body: JSON.stringify(body),
        })
    }

    // New K-LINE API endpoint for constructing mental state from memories
    async recallMentalState(query: string, topK: number = 5, minSimilarity?: number): Promise<RecallMentalStateResponse> {
        const body: any = { query, top_k: topK }
        if (minSimilarity !== undefined) {
            body.min_similarity = minSimilarity
        }
        return this.request<RecallMentalStateResponse>('/api/klines/recall', {
            method: 'POST',
            body: JSON.stringify(body),
        })
    }

    // K-LINE API endpoint for memory extraction
    async extractMemories(
        rawInput: string,
        contextPrompt?: string,
        applyGrounding: boolean = true
    ): Promise<ExtractMemoriesResponse> {
        return this.request<ExtractMemoriesResponse>('/api/klines/extract', {
            method: 'POST',
            body: JSON.stringify({
                raw_input: rawInput,
                context_prompt: contextPrompt,
                apply_grounding: applyGrounding
            }),
        })
    }

    // New chat endpoint for conversational interface
    async chat(message: string): Promise<ChatResponse> {
        return this.request<ChatResponse>('/api/agent/chat', {
            method: 'POST',
            body: JSON.stringify({ message }),
        })
    }

    // Session-based chat endpoints
    async createChatSession(request: CreateSessionRequest): Promise<CreateSessionResponse> {
        return this.request<CreateSessionResponse>('/api/agent/session', {
            method: 'POST',
            body: JSON.stringify(request),
        })
    }

    async chatWithSession(request: SessionChatRequest): Promise<SessionChatResponse> {
        const body: any = { message: request.message }
        if (request.top_k !== undefined) {
            body.top_k = request.top_k
        }
        if (request.min_similarity !== undefined) {
            body.min_similarity = request.min_similarity
        }

        return this.request<SessionChatResponse>(`/api/agent/session/${request.session_id}`, {
            method: 'POST',
            body: JSON.stringify(body),
        })
    }

    // Additional session management endpoints
    async getChatSession(sessionId: string): Promise<GetSessionResponse> {
        return this.request<GetSessionResponse>(`/api/agent/session/${sessionId}`)
    }

    async deleteChatSession(sessionId: string): Promise<DeleteSessionResponse> {
        return this.request<DeleteSessionResponse>(`/api/agent/session/${sessionId}`, {
            method: 'DELETE',
        })
    }

    async getChatSessions(): Promise<GetSessionsResponse> {
        return this.request<GetSessionsResponse>('/api/agent/sessions')
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
