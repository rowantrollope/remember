import React, { useState, useCallback } from 'react'
import { useConfiguredAPI } from './useConfiguredAPI'
import type { 
    PerformanceMetricsResponse, 
    CacheAnalysisResponse,
    CacheClearResponse,
    ConfigResponse,
    ConfigUpdateRequest,
    ConfigUpdateResponse,
    CacheClearRequest
} from '@/lib/api'

interface UsePerformanceAPIState {
    isLoading: boolean
    error: string | null
    lastUpdated: Date | null
}

interface UsePerformanceAPIReturn extends UsePerformanceAPIState {
    // Metrics
    getMetrics: () => Promise<PerformanceMetricsResponse | null>
    
    // Cache management
    clearCache: (request?: CacheClearRequest) => Promise<CacheClearResponse | null>
    analyzeCache: () => Promise<CacheAnalysisResponse | null>
    
    // Configuration
    getConfig: () => Promise<ConfigResponse | null>
    updateConfig: (request: ConfigUpdateRequest) => Promise<ConfigUpdateResponse | null>
    
    // Utility
    clearError: () => void
    retry: () => Promise<void>
}

export function usePerformanceAPI(): UsePerformanceAPIReturn {
    const { api, isLoaded: apiConfigLoaded } = useConfiguredAPI()
    const [state, setState] = useState<UsePerformanceAPIState>({
        isLoading: false,
        error: null,
        lastUpdated: null
    })
    
    // Track the last operation for retry functionality
    const [lastOperation, setLastOperation] = useState<(() => Promise<any>) | null>(null)

    const setLoading = useCallback((loading: boolean) => {
        setState(prev => ({ ...prev, isLoading: loading }))
    }, [])

    const setError = useCallback((error: string | null) => {
        setState(prev => ({ ...prev, error }))
    }, [])

    const setSuccess = useCallback(() => {
        setState(prev => ({ 
            ...prev, 
            error: null, 
            lastUpdated: new Date() 
        }))
    }, [])

    const handleApiCall = useCallback(async <T>(
        operation: () => Promise<T>,
        context: string
    ): Promise<T | null> => {
        setLoading(true)
        setError(null)
        setLastOperation(() => operation)

        try {
            const result = await operation()
            setSuccess()
            return result
        } catch (error) {
            console.error(`Performance API error (${context}):`, error)
            
            let errorMessage = `Failed to ${context}`
            
            if (error instanceof Error) {
                // Handle specific error types
                if (error.message.includes('fetch')) {
                    errorMessage = `Network error while trying to ${context}. Please check your connection.`
                } else if (error.message.includes('404')) {
                    errorMessage = `Performance API endpoint not found. The ${context} feature may not be available.`
                } else if (error.message.includes('500')) {
                    errorMessage = `Server error occurred while trying to ${context}. Please try again later.`
                } else if (error.message.includes('403') || error.message.includes('401')) {
                    errorMessage = `Access denied. You may not have permission to ${context}.`
                } else {
                    errorMessage = `${errorMessage}: ${error.message}`
                }
            }
            
            setError(errorMessage)
            return null
        } finally {
            setLoading(false)
        }
    }, [setLoading, setError, setSuccess])

    // Get performance metrics
    const getMetrics = useCallback(async (): Promise<PerformanceMetricsResponse | null> => {
        return handleApiCall(
            () => api.getPerformanceMetrics(),
            'load performance metrics'
        )
    }, [api, handleApiCall])

    // Clear cache
    const clearCache = useCallback(async (
        request?: CacheClearRequest
    ): Promise<CacheClearResponse | null> => {
        const context = request?.operation_type 
            ? `clear cache for ${request.operation_type}` 
            : 'clear all cache'
            
        return handleApiCall(
            () => api.clearCache(request),
            context
        )
    }, [api, handleApiCall])

    // Analyze cache effectiveness
    const analyzeCache = useCallback(async (): Promise<CacheAnalysisResponse | null> => {
        return handleApiCall(
            () => api.analyzeCacheEffectiveness(),
            'analyze cache effectiveness'
        )
    }, [api, handleApiCall])

    // Get configuration
    const getConfig = useCallback(async (): Promise<ConfigResponse | null> => {
        return handleApiCall(
            () => api.getConfig(),
            'load configuration'
        )
    }, [api, handleApiCall])

    // Update configuration
    const updateConfig = useCallback(async (
        request: ConfigUpdateRequest
    ): Promise<ConfigUpdateResponse | null> => {
        return handleApiCall(
            () => api.updateConfig(request),
            'update configuration'
        )
    }, [api, handleApiCall])

    // Clear error
    const clearError = useCallback(() => {
        setError(null)
    }, [setError])

    // Retry last operation
    const retry = useCallback(async (): Promise<void> => {
        if (lastOperation) {
            await lastOperation()
        }
    }, [lastOperation])

    return {
        // State
        isLoading: state.isLoading,
        error: state.error,
        lastUpdated: state.lastUpdated,
        
        // Methods
        getMetrics,
        clearCache,
        analyzeCache,
        getConfig,
        updateConfig,
        
        // Utility
        clearError,
        retry
    }
}

// Hook for checking performance feature availability
export function usePerformanceAvailability() {
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
    const [isChecking, setIsChecking] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { api, isLoaded: apiConfigLoaded } = useConfiguredAPI()

    const checkAvailability = useCallback(async () => {
        setIsChecking(true)
        setError(null)

        try {
            // Try to fetch performance metrics to check if the feature is available
            await api.getPerformanceMetrics()
            setIsAvailable(true)
        } catch (error) {
            console.warn('Performance features not available:', error)
            
            if (error instanceof Error) {
                if (error.message.includes('404')) {
                    setError('Performance API endpoints not found. Feature may not be enabled.')
                } else if (error.message.includes('403') || error.message.includes('401')) {
                    setError('Access denied to performance features.')
                } else {
                    setError('Performance features are currently unavailable.')
                }
            } else {
                setError('Unable to check performance feature availability.')
            }
            
            setIsAvailable(false)
        } finally {
            setIsChecking(false)
        }
    }, [api])

    return {
        isAvailable,
        isChecking,
        error,
        checkAvailability
    }
}

// Hook for performance metrics with auto-refresh
export function usePerformanceMetrics(autoRefresh = false, intervalSeconds = 30) {
    const [metrics, setMetrics] = useState<PerformanceMetricsResponse | null>(null)
    const { getMetrics, isLoading, error, clearError } = usePerformanceAPI()
    const { isLoaded: apiConfigLoaded } = useConfiguredAPI()

    const fetchMetrics = useCallback(async () => {
        const result = await getMetrics()
        if (result) {
            setMetrics(result)
        }
    }, [getMetrics])

    // Auto-refresh functionality
    const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

    const startAutoRefresh = useCallback(() => {
        if (refreshInterval) {
            clearInterval(refreshInterval)
        }
        
        const interval = setInterval(fetchMetrics, intervalSeconds * 1000)
        setRefreshInterval(interval)
        
        return () => {
            clearInterval(interval)
            setRefreshInterval(null)
        }
    }, [fetchMetrics, intervalSeconds, refreshInterval])

    const stopAutoRefresh = useCallback(() => {
        if (refreshInterval) {
            clearInterval(refreshInterval)
            setRefreshInterval(null)
        }
    }, [refreshInterval])

    // Effect for auto-refresh
    React.useEffect(() => {
        if (autoRefresh) {
            const cleanup = startAutoRefresh()
            return cleanup
        } else {
            stopAutoRefresh()
        }
    }, [autoRefresh, startAutoRefresh, stopAutoRefresh])

    // Initial fetch
    React.useEffect(() => {
        // Don't try to fetch until API configuration is loaded
        if (!apiConfigLoaded) {
            return
        }
        fetchMetrics()
    }, [fetchMetrics, apiConfigLoaded])

    return {
        metrics,
        isLoading,
        error,
        clearError,
        refreshMetrics: fetchMetrics,
        startAutoRefresh,
        stopAutoRefresh
    }
}
