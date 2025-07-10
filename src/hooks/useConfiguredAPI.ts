import { useMemo } from 'react'
import { MemoryAgentAPI } from '@/lib/api'
import { useSettings } from './useSettings'

export function useConfiguredAPI() {
    const { isLoaded, getApiBaseUrl, settings } = useSettings()

    // Create a new API instance when settings change
    // This ensures that vectorstore changes are properly reflected
    const api = useMemo(() => {
        const baseUrl = isLoaded ? getApiBaseUrl() : 'http://localhost:5001'
        const vectorStoreName = isLoaded ? settings.vectorStoreName : 'memories'

        console.log('useConfiguredAPI: Creating API instance with:', { baseUrl, vectorStoreName })
        return new MemoryAgentAPI(baseUrl, vectorStoreName)
    }, [isLoaded, getApiBaseUrl, settings.vectorStoreName])

    return {
        api,
        isLoaded,
        baseUrl: isLoaded ? getApiBaseUrl() : 'http://localhost:5001',
        vectorStoreName: isLoaded ? settings.vectorStoreName : 'memories'
    }
}

// Export a function to get a default API instance
// This can be used in places where hooks can't be used
// Note: This will use default settings and won't reflect user preferences
export function getConfiguredAPI(): MemoryAgentAPI {
    return new MemoryAgentAPI('http://localhost:5001', 'memories')
}
