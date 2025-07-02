"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { 
    Settings, 
    RotateCcw, 
    Save, 
    AlertTriangle,
    Info,
    Zap,
    Clock,
    Sliders
} from 'lucide-react'
import { usePerformanceSettings } from '@/hooks/usePerformanceSettings'
import { useConfiguredAPI } from '@/hooks/useConfiguredAPI'

export function PerformanceConfigDialog() {
    const { api } = useConfiguredAPI()
    const { 
        settings, 
        updateSetting, 
        updateSimilarityThreshold, 
        updateTtlSetting, 
        resetSettings, 
        applyPreset,
        toApiConfig 
    } = usePerformanceSettings()
    
    const [isOpen, setIsOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

    // Local state for form inputs
    const [localSettings, setLocalSettings] = useState(settings)

    // Sync local settings with global settings when dialog opens
    useEffect(() => {
        if (isOpen) {
            setLocalSettings(settings)
            setSaveStatus('idle')
        }
    }, [isOpen, settings])

    const handleSave = async () => {
        setIsSaving(true)
        setSaveStatus('idle')
        
        try {
            // Update all settings in a single batch to avoid multiple synchronous state updates
            // Defer the update to the next tick to avoid React render timing issues
            setTimeout(() => {
                // Build complete settings update
                const settingsUpdate: any = {}
                
                Object.entries(localSettings).forEach(([key, value]) => {
                    if (key === 'similarityThresholds') {
                        Object.entries(value as any).forEach(([thresholdKey, thresholdValue]) => {
                            if (!settingsUpdate.similarityThresholds) {
                                settingsUpdate.similarityThresholds = { ...settings.similarityThresholds }
                            }
                            settingsUpdate.similarityThresholds[thresholdKey] = thresholdValue
                        })
                    } else if (key === 'ttlSettings') {
                        Object.entries(value as any).forEach(([ttlKey, ttlValue]) => {
                            if (!settingsUpdate.ttlSettings) {
                                settingsUpdate.ttlSettings = { ...settings.ttlSettings }
                            }
                            settingsUpdate.ttlSettings[ttlKey] = ttlValue
                        })
                    } else {
                        settingsUpdate[key] = value
                    }
                })
                
                // Apply all updates in a single call
                updateSettings(settingsUpdate)
            }, 0)

            // Send to API using current local settings
            const currentApiConfig = {
                cache_enabled: localSettings.cacheEnabled,
                cache_type: localSettings.cacheType,
                optimizations_enabled: localSettings.optimizationsEnabled,
                batch_processing_enabled: localSettings.batchProcessingEnabled,
                default_cache_ttl_seconds: localSettings.defaultCacheTtlSeconds,
                similarity_thresholds: {
                    global: localSettings.similarityThresholds.global,
                    query_optimization: localSettings.similarityThresholds.queryOptimization,
                    memory_relevance: localSettings.similarityThresholds.memoryRelevance,
                    context_analysis: localSettings.similarityThresholds.contextAnalysis,
                    memory_grounding: localSettings.similarityThresholds.memoryGrounding,
                    extraction_evaluation: localSettings.similarityThresholds.extractionEvaluation,
                    conversation: localSettings.similarityThresholds.conversation,
                    answer_generation: localSettings.similarityThresholds.answerGeneration
                },
                ttl_settings: {
                    query_optimization: localSettings.ttlSettings.queryOptimization,
                    memory_relevance: localSettings.ttlSettings.memoryRelevance,
                    context_analysis: localSettings.ttlSettings.contextAnalysis,
                    memory_grounding: localSettings.ttlSettings.memoryGrounding,
                    extraction_evaluation: localSettings.ttlSettings.extractionEvaluation,
                    conversation: localSettings.ttlSettings.conversation,
                    answer_generation: localSettings.ttlSettings.answerGeneration
                }
            }
            
            await api.updateConfig({ config: currentApiConfig })
            
            setSaveStatus('success')
            setTimeout(() => setSaveStatus('idle'), 3000)
        } catch (error) {
            console.error('Failed to save performance configuration:', error)
            setSaveStatus('error')
            setTimeout(() => setSaveStatus('idle'), 5000)
        } finally {
            setIsSaving(false)
        }
    }

    const handleReset = () => {
        if (confirm('Are you sure you want to reset all performance settings to defaults?')) {
            resetSettings()
            setLocalSettings(settings)
        }
    }

    const handlePreset = (preset: 'conservative' | 'aggressive' | 'balanced') => {
        applyPreset(preset)
        setLocalSettings(settings)
    }

    const updateLocalSetting = (key: keyof typeof localSettings, value: any) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }))
    }

    const updateLocalSimilarityThreshold = (operation: string, value: number) => {
        setLocalSettings(prev => ({
            ...prev,
            similarityThresholds: {
                ...prev.similarityThresholds,
                [operation]: value
            }
        }))
    }

    const updateLocalTtlSetting = (operation: string, value: number) => {
        setLocalSettings(prev => ({
            ...prev,
            ttlSettings: {
                ...prev.ttlSettings,
                [operation]: value
            }
        }))
    }

    const formatTtlDisplay = (seconds: number) => {
        if (seconds >= 3600) {
            return `${(seconds / 3600).toFixed(1)}h`
        } else if (seconds >= 60) {
            return `${Math.floor(seconds / 60)}m`
        } else {
            return `${seconds}s`
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                >
                    <Settings className="w-4 h-4" />
                    Performance Settings
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Performance Configuration
                    </DialogTitle>
                    <DialogDescription>
                        Configure cache settings, similarity thresholds, and TTL values to optimize performance.
                    </DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                        <TabsTrigger value="similarity">Similarity</TabsTrigger>
                        <TabsTrigger value="ttl">TTL Settings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-6">
                        {/* Cache Type Selection */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium flex items-center gap-2">
                                <Zap className="w-4 h-4" />
                                Cache Type
                            </Label>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        id="hash-cache"
                                        name="cacheType"
                                        value="hash"
                                        checked={localSettings.cacheType === 'hash'}
                                        onChange={(e) => updateLocalSetting('cacheType', e.target.value)}
                                        className="w-4 h-4"
                                    />
                                    <Label htmlFor="hash-cache" className="text-sm">
                                        Hash-based Caching
                                    </Label>
                                </div>
                                <p className="text-xs text-gray-500 ml-6">
                                    Fast exact matches. Best for repeated identical queries.
                                </p>
                                
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        id="semantic-cache"
                                        name="cacheType"
                                        value="semantic_vectorset"
                                        checked={localSettings.cacheType === 'semantic_vectorset'}
                                        onChange={(e) => updateLocalSetting('cacheType', e.target.value)}
                                        className="w-4 h-4"
                                    />
                                    <Label htmlFor="semantic-cache" className="text-sm">
                                        Semantic VectorSet Caching
                                    </Label>
                                </div>
                                <p className="text-xs text-gray-500 ml-6">
                                    Intelligent similarity matching. Best for varied but related queries.
                                </p>
                            </div>
                            
                            {localSettings.cacheType !== settings.cacheType && (
                                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                    <p className="text-sm text-yellow-700">
                                        Changing cache type requires a server restart to take effect.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Basic Toggle Settings */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium">Enable Caching</Label>
                                    <p className="text-xs text-gray-500">
                                        Turn caching on or off globally
                                    </p>
                                </div>
                                <Switch
                                    checked={localSettings.cacheEnabled}
                                    onCheckedChange={(checked) => updateLocalSetting('cacheEnabled', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium">Enable Optimizations</Label>
                                    <p className="text-xs text-gray-500">
                                        Advanced performance optimizations
                                    </p>
                                </div>
                                <Switch
                                    checked={localSettings.optimizationsEnabled}
                                    onCheckedChange={(checked) => updateLocalSetting('optimizationsEnabled', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium">Enable Batch Processing</Label>
                                    <p className="text-xs text-gray-500">
                                        Process multiple requests together
                                    </p>
                                </div>
                                <Switch
                                    checked={localSettings.batchProcessingEnabled}
                                    onCheckedChange={(checked) => updateLocalSetting('batchProcessingEnabled', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium">Auto-refresh Dashboard</Label>
                                    <p className="text-xs text-gray-500">
                                        Automatically refresh performance metrics
                                    </p>
                                </div>
                                <Switch
                                    checked={localSettings.autoRefreshEnabled}
                                    onCheckedChange={(checked) => updateLocalSetting('autoRefreshEnabled', checked)}
                                />
                            </div>
                        </div>

                        {/* Default TTL Setting */}
                        <div className="space-y-2">
                            <Label htmlFor="default-ttl" className="text-sm font-medium">
                                Default Cache TTL (seconds)
                            </Label>
                            <Input
                                id="default-ttl"
                                type="number"
                                min="60"
                                max="86400"
                                value={localSettings.defaultCacheTtlSeconds}
                                onChange={(e) => updateLocalSetting('defaultCacheTtlSeconds', parseInt(e.target.value) || 3600)}
                                className="w-32"
                            />
                            <p className="text-xs text-gray-500">
                                Default time-to-live for cache entries (60 seconds to 24 hours)
                            </p>
                        </div>

                        {/* Auto-refresh Interval */}
                        {localSettings.autoRefreshEnabled && (
                            <div className="space-y-2">
                                <Label htmlFor="refresh-interval" className="text-sm font-medium">
                                    Auto-refresh Interval (seconds)
                                </Label>
                                <Input
                                    id="refresh-interval"
                                    type="number"
                                    min="5"
                                    max="300"
                                    value={localSettings.autoRefreshIntervalSeconds}
                                    onChange={(e) => updateLocalSetting('autoRefreshIntervalSeconds', parseInt(e.target.value) || 30)}
                                    className="w-32"
                                />
                                <p className="text-xs text-gray-500">
                                    How often to refresh the dashboard (5-300 seconds)
                                </p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="similarity" className="space-y-6">
                        {localSettings.cacheType === 'semantic_vectorset' ? (
                            <>
                                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <Info className="w-4 h-4 text-blue-600" />
                                    <p className="text-sm text-blue-700">
                                        Similarity thresholds determine when cached results are considered relevant enough to return.
                                    </p>
                                </div>

                                {/* Global Similarity Threshold */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium flex items-center gap-2">
                                        <Sliders className="w-4 h-4" />
                                        Global Similarity Threshold
                                    </Label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min="0.0"
                                            max="1.0"
                                            step="0.05"
                                            value={localSettings.similarityThresholds.global}
                                            onChange={(e) => updateLocalSimilarityThreshold('global', parseFloat(e.target.value))}
                                            className="flex-1"
                                        />
                                        <span className="text-sm font-mono w-12">
                                            {localSettings.similarityThresholds.global.toFixed(2)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Default threshold applied to all operations unless overridden
                                    </p>
                                </div>

                                {/* Individual Operation Thresholds */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium">Operation-Specific Thresholds</h4>
                                    {Object.entries(localSettings.similarityThresholds).map(([key, value]) => {
                                        if (key === 'global') return null
                                        
                                        const displayName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                                        
                                        return (
                                            <div key={key} className="space-y-2">
                                                <Label className="text-sm">{displayName}</Label>
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="range"
                                                        min="0.0"
                                                        max="1.0"
                                                        step="0.05"
                                                        value={value}
                                                        onChange={(e) => updateLocalSimilarityThreshold(key, parseFloat(e.target.value))}
                                                        className="flex-1"
                                                    />
                                                    <span className="text-sm font-mono w-12">
                                                        {value.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <Sliders className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Similarity Settings Not Available</h3>
                                <p className="text-gray-600">
                                    Similarity thresholds are only available when using Semantic VectorSet caching.
                                </p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="ttl" className="space-y-6">
                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <Clock className="w-4 h-4 text-green-600" />
                            <p className="text-sm text-green-700">
                                TTL (Time To Live) settings control how long cache entries remain valid.
                            </p>
                        </div>

                        {/* Preset Buttons */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Quick Presets</Label>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePreset('conservative')}
                                >
                                    Conservative
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePreset('balanced')}
                                >
                                    Balanced
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePreset('aggressive')}
                                >
                                    Aggressive
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500">
                                Conservative: Longer TTLs, fewer cache misses. Aggressive: Shorter TTLs, fresher data.
                            </p>
                        </div>

                        {/* Individual TTL Settings */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium">Operation-Specific TTL Settings</h4>
                            {Object.entries(localSettings.ttlSettings).map(([key, value]) => {
                                const displayName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                                
                                return (
                                    <div key={key} className="space-y-2">
                                        <Label className="text-sm">{displayName}</Label>
                                        <div className="flex items-center gap-4">
                                            <Input
                                                type="number"
                                                min="60"
                                                max="86400"
                                                value={value}
                                                onChange={(e) => updateLocalTtlSetting(key, parseInt(e.target.value) || 3600)}
                                                className="w-32"
                                            />
                                            <span className="text-sm text-gray-500">
                                                ({formatTtlDisplay(value)})
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={handleReset}
                        className="flex items-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset to Defaults
                    </Button>
                    
                    <div className="flex items-center gap-2">
                        {saveStatus === 'success' && (
                            <span className="text-sm text-green-600">Settings saved!</span>
                        )}
                        {saveStatus === 'error' && (
                            <span className="text-sm text-red-600">Failed to save settings</span>
                        )}
                        
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
