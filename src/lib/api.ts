// API client for Memory Agent
// Use relative URL to go through Next.js rewrites (avoids CORS)
const DEFAULT_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''

export interface ApiMemory {
    id?: string
    content?: string
    text?: string  // Alternative field name
    memory?: string  // Alternative field name
    original_text?: string
    grounded_text?: string
    created_at?: string  // ISO 8601 UTC timestamp
    last_accessed_at?: string  // ISO 8601 UTC timestamp
    score?: number  // Vector similarity score (0-1)
    relevance_score?: number  // Enhanced relevance score with recency bias and access count
    grounding_applied?: boolean
    // Additional fields from updated memory format
    tags?: string[]
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
            [key: string]: unknown
        }
    }
    metadata?: {
        location?: string
        tags?: string[]
        confidence?: number
        [key: string]: unknown
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
            [key: string]: unknown
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
    confidence: 'high' | 'medium' | 'low'
    reasoning: string
    supporting_memories: Array<{
        id: string
        text: string
        relevance_score: number
        timestamp: string
        tags: string[]
        relevance_reasoning: string
    }>
    kline: {
        coherence_score: number
        mental_state: string
    }
    total_memories_searched: number
    relevant_memories_used: number
    type: 'answer' | 'help'
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
    created_at?: string
    memory_context?: {
        memories_used: number
        memories: Array<{
            memory_id: string
            text: string
            created_at: string
            grounded_text: string
            similarity_score: number
        }>
        excluded_memories?: Array<{
            memory_id: string
            text: string
            created_at: string
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
            [key: string]: unknown
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
    created_at: string
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

// Performance API interfaces
export interface CacheStats {
    hit_rate_percent: number // Percentage (0-100)
    total_requests: number
    semantic_hits?: number // For semantic cache
    semantic_misses?: number // For semantic cache
    hits?: number // For hash cache
    misses?: number // For hash cache
    stores: number
    errors: number
    embedding_calls?: number // Only for semantic cache
    cache_type?: 'hash' | 'semantic_vectorset' // Only for semantic cache
}

export interface OperationMetrics {
    operation_type: string
    hit_rate: number // Percentage (0-100)
    hits: number
    misses: number
    avg_similarity?: number // Only for semantic cache
    ttl_seconds: number
}

export interface PerformanceMetricsResponse {
    success: boolean
    performance_metrics: {
        cache_stats: CacheStats
    }
    operation_metrics?: OperationMetrics[]
    last_updated?: string // ISO 8601 timestamp
}

export interface CacheAnalysisResponse {
    success: boolean
    effectiveness_rating: 'poor' | 'fair' | 'good' | 'excellent'
    recommendations: string[]
    potential_additional_savings: {
        cost_usd: number
        time_seconds: number
    }
    current_vs_potential: {
        current_hit_rate: number
        potential_hit_rate: number
    }
}

export interface CacheClearRequest {
    operation_type?: string
    pattern?: string
}

export interface CacheClearResponse {
    success: boolean
    message: string
    cleared_entries: number
}

export interface PerformanceConfig {
    cache_enabled: boolean
    cache_type: 'hash' | 'semantic_vectorset'
    optimizations_enabled: boolean
    batch_processing_enabled: boolean
    default_cache_ttl_seconds: number
    similarity_thresholds: {
        global: number
        query_optimization: number
        memory_relevance: number
        context_analysis: number
        memory_grounding: number
        extraction_evaluation: number
        conversation: number
        answer_generation: number
    }
    ttl_settings: {
        query_optimization: number
        memory_relevance: number
        context_analysis: number
        memory_grounding: number
        extraction_evaluation: number
        conversation: number
        answer_generation: number
    }
}

export interface ConfigResponse {
    success: boolean
    config: PerformanceConfig
}

export interface ConfigUpdateRequest {
    config: Partial<PerformanceConfig>
}

export interface ConfigUpdateResponse {
    success: boolean
    message: string
    config: PerformanceConfig
}

class MemoryAgentAPI {
    private baseUrl: string
    private vectorStoreName: string

    constructor(baseUrl: string = DEFAULT_API_BASE_URL, vectorStoreName: string = 'memories') {
        this.baseUrl = baseUrl
        this.vectorStoreName = vectorStoreName
    }

    // Method to update the base URL dynamically
    updateBaseUrl(newBaseUrl: string) {
        this.baseUrl = newBaseUrl
    }

    // Method to get current base URL
    getBaseUrl(): string {
        return this.baseUrl
    }

    // Method to update the vectorstore name dynamically
    updateVectorStoreName(newVectorStoreName: string) {
        this.vectorStoreName = newVectorStoreName
    }

    // Method to get current vectorstore name
    getVectorStoreName(): string {
        return this.vectorStoreName
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
        return this.request<RememberResponse>(`/api/memory/${this.vectorStoreName}`, {
            method: 'POST',
            body: JSON.stringify({ text: memory, apply_grounding: applyGrounding }),
        })
    }

    async recall(query: string, topK: number = 5, minSimilarity?: number): Promise<RecallResponse> {
        const body: { query: string; top_k: number; min_similarity?: number } = { query, top_k: topK }
        if (minSimilarity !== undefined) {
            body.min_similarity = minSimilarity
        }
        return this.request<RecallResponse>(`/api/memory/${this.vectorStoreName}/search`, {
            method: 'POST',
            body: JSON.stringify(body),
        })
    }

    async ask(question: string, topK: number = 5, minSimilarity?: number): Promise<AskResponse> {
        const body: { question: string; top_k: number; min_similarity?: number } = { question, top_k: topK }
        if (minSimilarity !== undefined) {
            body.min_similarity = minSimilarity
        }
        return this.request<AskResponse>(`/api/memory/${this.vectorStoreName}/ask`, {
            method: 'POST',
            body: JSON.stringify(body),
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
        const body: {
            message: string;
            top_k?: number;
            min_similarity?: number;
        } = { message: request.message }
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



    async getMemoryInfo(): Promise<MemoryInfoResponse> {
        return this.request<MemoryInfoResponse>(`/api/memory/${this.vectorStoreName}`)
    }

    async deleteMemory(memoryId: string): Promise<DeleteResponse> {
        return this.request<DeleteResponse>(`/api/memory/${this.vectorStoreName}/${memoryId}`, {
            method: 'DELETE',
        })
    }

    async getContext(): Promise<ContextResponse> {
        return this.request<ContextResponse>(`/api/memory/${this.vectorStoreName}/context`)
    }

    async setContext(context: {
        location?: string
        activity?: string
        people_present?: string[]
        weather?: string
        [key: string]: unknown
    }): Promise<ContextResponse> {
        return this.request<ContextResponse>(`/api/memory/${this.vectorStoreName}/context`, {
            method: 'POST',
            body: JSON.stringify(context),
        })
    }

    async clearAllMemories(): Promise<ClearAllResponse> {
        return this.request<ClearAllResponse>(`/api/memory/${this.vectorStoreName}/all`, {
            method: 'DELETE',
        })
    }

    // Performance API methods
    async getPerformanceMetrics(): Promise<PerformanceMetricsResponse> {
        return this.request<PerformanceMetricsResponse>('/api/performance/metrics')
    }

    async clearCache(request?: CacheClearRequest): Promise<CacheClearResponse> {
        return this.request<CacheClearResponse>('/api/performance/cache/clear', {
            method: 'POST',
            body: JSON.stringify(request || {}),
        })
    }

    async analyzeCacheEffectiveness(): Promise<CacheAnalysisResponse> {
        return this.request<CacheAnalysisResponse>('/api/performance/cache/analyze')
    }

    async getConfig(): Promise<ConfigResponse> {
        return this.request<ConfigResponse>('/api/config')
    }

    async updateConfig(request: ConfigUpdateRequest): Promise<ConfigUpdateResponse> {
        return this.request<ConfigUpdateResponse>('/api/config', {
            method: 'PUT',
            body: JSON.stringify(request)
        })
    }

    // LLM Configuration methods
    async getLLMConfig(): Promise<import('@/types').LLMConfigResponse> {
        return this.request<import('@/types').LLMConfigResponse>('/api/llm/config')
    }

    async updateLLMConfig(request: import('@/types').LLMConfigUpdateRequest): Promise<import('@/types').LLMConfigUpdateResponse> {
        return this.request<import('@/types').LLMConfigUpdateResponse>('/api/llm/config', {
            method: 'PUT',
            body: JSON.stringify(request)
        })
    }

    async getOllamaModels(baseUrl?: string): Promise<import('@/types').OllamaModelsResponse> {
        const params = new URLSearchParams()
        if (baseUrl) {
            params.append('base_url', baseUrl)
        }
        
        const endpoint = '/api/llm/ollama/models' + (params.toString() ? '?' + params.toString() : '')
        return this.request<import('@/types').OllamaModelsResponse>(endpoint)
    }
}

// Export the MemoryAgentAPI class for direct instantiation
export { MemoryAgentAPI }

// Create a default instance for backward compatibility with 'memories' as default vectorstore
export const memoryAPI = new MemoryAgentAPI(DEFAULT_API_BASE_URL, 'memories')
