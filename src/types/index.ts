export interface Memory {
    id: string
    content: string
    text?: string
    original_text?: string
    grounded_text?: string
    timestamp: string
    formatted_time?: string
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
        score?: number
        relevance_score?: number
    }
}

export interface Conversation {
    id: string
    question: string
    answer: string
    timestamp: string
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
}

export interface ContextInfo {
    // API returns flat structure for some fields
    location?: string
    activity?: string
    people_present?: string[]

    // Temporal info (if supported by API)
    temporal?: {
        date?: string
        time?: string
        iso_date?: string
        day_of_week?: string
        month?: string
        year?: number
    }

    // Environmental info can be in either 'environmental' or 'environment' key
    environmental?: {
        weather?: string
        [key: string]: any
    }
    environment?: {
        weather?: string
        [key: string]: any
    }

    // Legacy nested structure support
    spatial?: {
        location?: string
        activity?: string
    }
    social?: {
        people_present?: string[]
    }
}

export type ApiStatus = 'ready' | 'not_initialized' | 'unknown'
