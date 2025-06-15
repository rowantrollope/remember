import { useMemo } from 'react'
import { MemoryAgentAPI } from '@/lib/api'
import { useSettings } from './useSettings'

// Create a singleton API instance that can be reconfigured
let apiInstance: MemoryAgentAPI | null = null

export function useConfiguredAPI() {
    const { isLoaded, getApiBaseUrl } = useSettings()

    // Create or update the API instance when settings change
    const api = useMemo(() => {
        console.log('useConfiguredAPI: isLoaded:', isLoaded)
        if (!isLoaded) {
            // Return a default instance while settings are loading
            if (!apiInstance) {
                apiInstance = new MemoryAgentAPI()
                console.log('useConfiguredAPI: Created default instance with URL:', apiInstance.getBaseUrl())
            }
            return apiInstance
        }

        const baseUrl = getApiBaseUrl()
        console.log('useConfiguredAPI: Settings loaded, baseUrl:', baseUrl)

        if (!apiInstance) {
            apiInstance = new MemoryAgentAPI(baseUrl)
            console.log('useConfiguredAPI: Created new instance with URL:', baseUrl)
        } else {
            // Update the existing instance with new base URL
            apiInstance.updateBaseUrl(baseUrl)
            console.log('useConfiguredAPI: Updated instance with URL:', baseUrl)
        }

        return apiInstance
    }, [isLoaded, getApiBaseUrl])

    return {
        api,
        isLoaded,
        baseUrl: isLoaded ? getApiBaseUrl() : 'Loading...'
    }
}

// Export a function to get the configured API instance
// This can be used in places where hooks can't be used
export function getConfiguredAPI(): MemoryAgentAPI {
    if (!apiInstance) {
        apiInstance = new MemoryAgentAPI()
    }
    return apiInstance
}
