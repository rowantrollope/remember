import { useState, useEffect, useCallback } from 'react'
import { PerformanceConfig } from '@/lib/api'

// Create a custom event for performance settings changes
const PERFORMANCE_SETTINGS_CHANGE_EVENT = 'performance-settings-changed'

// Dispatch custom event when performance settings change
const dispatchPerformanceSettingsChange = (newSettings: PerformanceSettings) => {
    window.dispatchEvent(new CustomEvent(PERFORMANCE_SETTINGS_CHANGE_EVENT, {
        detail: newSettings
    }))
}

export interface PerformanceSettings {
    // Basic cache settings
    cacheEnabled: boolean
    cacheType: 'hash' | 'semantic_vectorset'
    optimizationsEnabled: boolean
    batchProcessingEnabled: boolean
    defaultCacheTtlSeconds: number
    
    // Similarity thresholds for semantic cache
    similarityThresholds: {
        global: number
        queryOptimization: number
        memoryRelevance: number
        contextAnalysis: number
        memoryGrounding: number
        extractionEvaluation: number
        conversation: number
        answerGeneration: number
    }
    
    // TTL settings for different operation types
    ttlSettings: {
        queryOptimization: number
        memoryRelevance: number
        contextAnalysis: number
        memoryGrounding: number
        extractionEvaluation: number
        conversation: number
        answerGeneration: number
    }
    
    // UI preferences
    autoRefreshEnabled: boolean
    autoRefreshIntervalSeconds: number
}

const DEFAULT_PERFORMANCE_SETTINGS: PerformanceSettings = {
    // Basic cache settings
    cacheEnabled: true,
    cacheType: 'semantic_vectorset',
    optimizationsEnabled: true,
    batchProcessingEnabled: true,
    defaultCacheTtlSeconds: 3600, // 1 hour
    
    // Default similarity thresholds based on operation type
    similarityThresholds: {
        global: 0.85,
        queryOptimization: 0.90,
        memoryRelevance: 0.85,
        contextAnalysis: 0.88,
        memoryGrounding: 0.82,
        extractionEvaluation: 0.80,
        conversation: 0.95,
        answerGeneration: 0.87
    },
    
    // Default TTL settings (in seconds)
    ttlSettings: {
        queryOptimization: 7200,    // 2 hours
        memoryRelevance: 3600,      // 1 hour
        contextAnalysis: 1800,      // 30 minutes
        memoryGrounding: 3600,      // 1 hour
        extractionEvaluation: 1800, // 30 minutes
        conversation: 900,          // 15 minutes
        answerGeneration: 1800      // 30 minutes
    },
    
    // UI preferences
    autoRefreshEnabled: false,
    autoRefreshIntervalSeconds: 30
}

const PERFORMANCE_SETTINGS_STORAGE_KEY = 'memory-app-performance-settings'
const PERFORMANCE_SETTINGS_VERSION = '1.0'

export function usePerformanceSettings() {
    const [settings, setSettings] = useState<PerformanceSettings>(DEFAULT_PERFORMANCE_SETTINGS)
    const [isLoaded, setIsLoaded] = useState(false)

    // Save settings to localStorage
    const saveToStorage = useCallback((settingsToSave: PerformanceSettings) => {
        try {
            const dataToStore = {
                version: PERFORMANCE_SETTINGS_VERSION,
                settings: settingsToSave
            }
            localStorage.setItem(PERFORMANCE_SETTINGS_STORAGE_KEY, JSON.stringify(dataToStore))
            console.log('usePerformanceSettings: Settings saved to localStorage:', settingsToSave)
            
            // Dispatch change event
            dispatchPerformanceSettingsChange(settingsToSave)
        } catch (error) {
            console.error('usePerformanceSettings: Failed to save settings to localStorage:', error)
        }
    }, [])

    // Load settings from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(PERFORMANCE_SETTINGS_STORAGE_KEY)
            if (stored) {
                const parsed = JSON.parse(stored)
                if (parsed.version === PERFORMANCE_SETTINGS_VERSION && parsed.settings) {
                    const savedSettings = parsed.settings

                    // Validate and merge with defaults
                    const validatedSettings: PerformanceSettings = {
                        cacheEnabled: typeof savedSettings.cacheEnabled === 'boolean' 
                            ? savedSettings.cacheEnabled 
                            : DEFAULT_PERFORMANCE_SETTINGS.cacheEnabled,
                        cacheType: (savedSettings.cacheType === 'hash' || savedSettings.cacheType === 'semantic_vectorset')
                            ? savedSettings.cacheType
                            : DEFAULT_PERFORMANCE_SETTINGS.cacheType,
                        optimizationsEnabled: typeof savedSettings.optimizationsEnabled === 'boolean'
                            ? savedSettings.optimizationsEnabled
                            : DEFAULT_PERFORMANCE_SETTINGS.optimizationsEnabled,
                        batchProcessingEnabled: typeof savedSettings.batchProcessingEnabled === 'boolean'
                            ? savedSettings.batchProcessingEnabled
                            : DEFAULT_PERFORMANCE_SETTINGS.batchProcessingEnabled,
                        defaultCacheTtlSeconds: typeof savedSettings.defaultCacheTtlSeconds === 'number' &&
                                              savedSettings.defaultCacheTtlSeconds > 0
                            ? savedSettings.defaultCacheTtlSeconds
                            : DEFAULT_PERFORMANCE_SETTINGS.defaultCacheTtlSeconds,
                        similarityThresholds: {
                            ...DEFAULT_PERFORMANCE_SETTINGS.similarityThresholds,
                            ...(savedSettings.similarityThresholds || {})
                        },
                        ttlSettings: {
                            ...DEFAULT_PERFORMANCE_SETTINGS.ttlSettings,
                            ...(savedSettings.ttlSettings || {})
                        },
                        autoRefreshEnabled: typeof savedSettings.autoRefreshEnabled === 'boolean'
                            ? savedSettings.autoRefreshEnabled
                            : DEFAULT_PERFORMANCE_SETTINGS.autoRefreshEnabled,
                        autoRefreshIntervalSeconds: typeof savedSettings.autoRefreshIntervalSeconds === 'number' &&
                                                   savedSettings.autoRefreshIntervalSeconds >= 5
                            ? savedSettings.autoRefreshIntervalSeconds
                            : DEFAULT_PERFORMANCE_SETTINGS.autoRefreshIntervalSeconds
                    }

                    setSettings(validatedSettings)
                    console.log('usePerformanceSettings: Settings loaded from localStorage:', validatedSettings)
                } else {
                    console.log('usePerformanceSettings: Using default settings (invalid stored data)')
                }
            } else {
                console.log('usePerformanceSettings: Using default settings (no stored data)')
            }
        } catch (error) {
            console.error('usePerformanceSettings: Failed to load settings from localStorage:', error)
            // Clear corrupted data
            localStorage.removeItem(PERFORMANCE_SETTINGS_STORAGE_KEY)
        } finally {
            setIsLoaded(true)
            console.log('usePerformanceSettings: Settings loading complete, isLoaded set to true')
        }
    }, [])

    // Update a specific setting
    const updateSetting = useCallback(<K extends keyof PerformanceSettings>(
        key: K,
        value: PerformanceSettings[K]
    ) => {
        console.log('updatePerformanceSetting called:', { key, value })
        setSettings(prev => {
            const updated = { ...prev, [key]: value }
            console.log('Performance settings updated from', prev[key], 'to', value)
            saveToStorage(updated)
            return updated
        })
    }, [saveToStorage])

    // Update multiple settings at once
    const updateSettings = useCallback((newSettings: Partial<PerformanceSettings>) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings }
            saveToStorage(updated)
            return updated
        })
    }, [saveToStorage])

    // Update similarity threshold for a specific operation
    const updateSimilarityThreshold = useCallback((
        operation: keyof PerformanceSettings['similarityThresholds'],
        value: number
    ) => {
        setSettings(prev => {
            const updated = {
                ...prev,
                similarityThresholds: {
                    ...prev.similarityThresholds,
                    [operation]: value
                }
            }
            saveToStorage(updated)
            return updated
        })
    }, [saveToStorage])

    // Update TTL setting for a specific operation
    const updateTtlSetting = useCallback((
        operation: keyof PerformanceSettings['ttlSettings'],
        value: number
    ) => {
        setSettings(prev => {
            const updated = {
                ...prev,
                ttlSettings: {
                    ...prev.ttlSettings,
                    [operation]: value
                }
            }
            saveToStorage(updated)
            return updated
        })
    }, [saveToStorage])

    // Reset settings to defaults
    const resetSettings = useCallback(() => {
        setSettings(DEFAULT_PERFORMANCE_SETTINGS)
        saveToStorage(DEFAULT_PERFORMANCE_SETTINGS)
    }, [saveToStorage])

    // Apply preset configurations
    const applyPreset = useCallback((preset: 'conservative' | 'aggressive' | 'balanced') => {
        let presetSettings: Partial<PerformanceSettings>

        switch (preset) {
            case 'conservative':
                presetSettings = {
                    ttlSettings: {
                        queryOptimization: 14400,    // 4 hours
                        memoryRelevance: 7200,       // 2 hours
                        contextAnalysis: 3600,       // 1 hour
                        memoryGrounding: 7200,       // 2 hours
                        extractionEvaluation: 3600,  // 1 hour
                        conversation: 1800,          // 30 minutes
                        answerGeneration: 3600       // 1 hour
                    },
                    similarityThresholds: {
                        ...settings.similarityThresholds,
                        global: 0.90
                    }
                }
                break
            case 'aggressive':
                presetSettings = {
                    ttlSettings: {
                        queryOptimization: 1800,     // 30 minutes
                        memoryRelevance: 900,        // 15 minutes
                        contextAnalysis: 600,        // 10 minutes
                        memoryGrounding: 900,        // 15 minutes
                        extractionEvaluation: 600,   // 10 minutes
                        conversation: 300,           // 5 minutes
                        answerGeneration: 600        // 10 minutes
                    },
                    similarityThresholds: {
                        ...settings.similarityThresholds,
                        global: 0.80
                    }
                }
                break
            case 'balanced':
            default:
                presetSettings = {
                    ttlSettings: DEFAULT_PERFORMANCE_SETTINGS.ttlSettings,
                    similarityThresholds: DEFAULT_PERFORMANCE_SETTINGS.similarityThresholds
                }
                break
        }

        updateSettings(presetSettings)
    }, [settings.similarityThresholds, updateSettings])

    // Convert to API format
    const toApiConfig = useCallback((): PerformanceConfig => {
        return {
            cache_enabled: settings.cacheEnabled,
            cache_type: settings.cacheType,
            optimizations_enabled: settings.optimizationsEnabled,
            batch_processing_enabled: settings.batchProcessingEnabled,
            default_cache_ttl_seconds: settings.defaultCacheTtlSeconds,
            similarity_thresholds: {
                global: settings.similarityThresholds.global,
                query_optimization: settings.similarityThresholds.queryOptimization,
                memory_relevance: settings.similarityThresholds.memoryRelevance,
                context_analysis: settings.similarityThresholds.contextAnalysis,
                memory_grounding: settings.similarityThresholds.memoryGrounding,
                extraction_evaluation: settings.similarityThresholds.extractionEvaluation,
                conversation: settings.similarityThresholds.conversation,
                answer_generation: settings.similarityThresholds.answerGeneration
            },
            ttl_settings: {
                query_optimization: settings.ttlSettings.queryOptimization,
                memory_relevance: settings.ttlSettings.memoryRelevance,
                context_analysis: settings.ttlSettings.contextAnalysis,
                memory_grounding: settings.ttlSettings.memoryGrounding,
                extraction_evaluation: settings.ttlSettings.extractionEvaluation,
                conversation: settings.ttlSettings.conversation,
                answer_generation: settings.ttlSettings.answerGeneration
            }
        }
    }, [settings])

    return {
        // State
        settings,
        isLoaded,

        // Actions
        updateSetting,
        updateSettings,
        updateSimilarityThreshold,
        updateTtlSetting,
        resetSettings,
        applyPreset,

        // Helpers
        toApiConfig
    }
}
