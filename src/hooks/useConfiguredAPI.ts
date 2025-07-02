import { useMemo } from 'react'
import { MemoryAgentAPI } from '@/lib/api'
import { useSettings } from './useSettings'

// Create a singleton API instance that can be reconfigured
let apiInstance: MemoryAgentAPI | null = null

export function useConfiguredAPI() {
    const { isLoaded, getApiBaseUrl } = useSettings()

    // Create or update the API instance when settings change
    const api = useMemo(() => {
        const baseUrl = isLoaded ? getApiBaseUrl() : 'http://localhost:5001'

        if (!apiInstance) {
            apiInstance = new MemoryAgentAPI(baseUrl)
        } else {
            // Update the existing instance with new base URL
            apiInstance.updateBaseUrl(baseUrl)
        }

        return apiInstance
    }, [isLoaded, getApiBaseUrl])

    return {
        api,
        isLoaded,
        baseUrl: isLoaded ? getApiBaseUrl() : 'http://localhost:5001'
    }
}

// Export a function to get the configured API instance
// This can be used in places where hooks can't be used
export function getConfiguredAPI(): MemoryAgentAPI {
    if (!apiInstance) {
        apiInstance = new MemoryAgentAPI('http://localhost:5001')
    }
    return apiInstance
}
