"use client"

import React, { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
    Activity, 
    TrendingUp, 
    TrendingDown, 
    Minus,
    RefreshCw,
    Zap,
    Clock,
    DollarSign
} from 'lucide-react'
import { useConfiguredAPI } from '@/hooks/useConfiguredAPI'
import { usePerformanceSettings } from '@/hooks/usePerformanceSettings'
import type { PerformanceMetricsResponse } from '@/lib/api'

// Cache Status Badge Component
interface CacheStatusBadgeProps {
    hitRate?: number
    className?: string
}

export function CacheStatusBadge({ hitRate, className = "" }: CacheStatusBadgeProps) {
    const getStatusColor = (rate: number) => {
        if (rate >= 60) return 'bg-green-100 text-green-800 border-green-200'
        if (rate >= 30) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        return 'bg-red-100 text-red-800 border-red-200'
    }

    const getStatusText = (rate: number) => {
        if (rate >= 60) return 'Excellent'
        if (rate >= 30) return 'Good'
        return 'Poor'
    }

    if (hitRate === undefined) {
        return (
            <Badge variant="outline" className={`${className} bg-gray-100 text-gray-600`}>
                <Activity className="w-3 h-3 mr-1" />
                Cache: Unknown
            </Badge>
        )
    }

    return (
        <Badge 
            variant="outline" 
            className={`${className} ${getStatusColor(hitRate)} border`}
        >
            <Activity className="w-3 h-3 mr-1" />
            Cache: {getStatusText(hitRate)} ({hitRate.toFixed(1)}%)
        </Badge>
    )
}

// Performance Indicator Dot Component
interface PerformanceIndicatorProps {
    hitRate?: number
    size?: 'sm' | 'md' | 'lg'
    showLabel?: boolean
    className?: string
}

export function PerformanceIndicator({ 
    hitRate, 
    size = 'md', 
    showLabel = false,
    className = "" 
}: PerformanceIndicatorProps) {
    const sizeClasses = {
        sm: 'w-2 h-2',
        md: 'w-3 h-3',
        lg: 'w-4 h-4'
    }

    const getIndicatorColor = (rate: number) => {
        if (rate >= 60) return 'bg-green-500'
        if (rate >= 30) return 'bg-yellow-500'
        return 'bg-red-500'
    }

    const getHealthStatus = (rate: number) => {
        if (rate >= 60) return 'Healthy'
        if (rate >= 30) return 'Warning'
        return 'Critical'
    }

    if (hitRate === undefined) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <div className={`${sizeClasses[size]} bg-gray-400 rounded-full animate-pulse`} />
                {showLabel && <span className="text-sm text-gray-600">Loading...</span>}
            </div>
        )
    }

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div 
                className={`${sizeClasses[size]} ${getIndicatorColor(hitRate)} rounded-full`}
                title={`Cache Performance: ${getHealthStatus(hitRate)} (${hitRate.toFixed(1)}%)`}
            />
            {showLabel && (
                <span className="text-sm text-gray-700">
                    {getHealthStatus(hitRate)}
                </span>
            )}
        </div>
    )
}

// Quick Stats Widget Component
interface QuickStatsWidgetProps {
    metrics?: PerformanceMetricsResponse
    compact?: boolean
    className?: string
}

export function QuickStatsWidget({ 
    metrics, 
    compact = false, 
    className = "" 
}: QuickStatsWidgetProps) {
    if (!metrics) {
        return (
            <Card className={`${className} ${compact ? 'p-3' : 'p-4'}`}>
                <CardContent className="p-0">
                    <div className="flex items-center justify-center py-4">
                        <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                        <span className="ml-2 text-sm text-gray-600">Loading stats...</span>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const stats = [
        {
            icon: Activity,
            label: 'Hit Rate',
            value: `${metrics.cache_statistics.hit_rate.toFixed(1)}%`,
            color: metrics.cache_statistics.hit_rate >= 60 ? 'text-green-600' : 
                   metrics.cache_statistics.hit_rate >= 30 ? 'text-yellow-600' : 'text-red-600'
        },
        {
            icon: DollarSign,
            label: 'Savings',
            value: `$${metrics.cache_statistics.estimated_cost_savings_usd.toFixed(2)}`,
            color: 'text-blue-600'
        },
        {
            icon: Clock,
            label: 'Time Saved',
            value: `${(metrics.cache_statistics.estimated_time_savings_seconds / 60).toFixed(1)}m`,
            color: 'text-purple-600'
        }
    ]

    if (compact) {
        return (
            <div className={`flex items-center gap-4 ${className}`}>
                {stats.map((stat, index) => {
                    const Icon = stat.icon
                    return (
                        <div key={index} className="flex items-center gap-1">
                            <Icon className={`w-4 h-4 ${stat.color}`} />
                            <span className="text-sm font-medium">{stat.value}</span>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <Card className={className}>
            <CardContent className="p-4">
                <div className="space-y-3">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon
                        return (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Icon className={`w-4 h-4 ${stat.color}`} />
                                    <span className="text-sm text-gray-600">{stat.label}</span>
                                </div>
                                <span className="text-sm font-medium">{stat.value}</span>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}

// Live Performance Monitor Component
interface LivePerformanceMonitorProps {
    autoRefresh?: boolean
    refreshInterval?: number
    className?: string
}

export function LivePerformanceMonitor({ 
    autoRefresh = false, 
    refreshInterval = 30,
    className = "" 
}: LivePerformanceMonitorProps) {
    const { api } = useConfiguredAPI()
    const { settings } = usePerformanceSettings()
    const [metrics, setMetrics] = useState<PerformanceMetricsResponse | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
    const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable')

    // Track previous hit rate for trend calculation
    const [previousHitRate, setPreviousHitRate] = useState<number | null>(null)

    const fetchMetrics = async () => {
        setIsLoading(true)
        try {
            const response = await api.getPerformanceMetrics()
            
            const currentHitRate = response.performance_metrics?.cache_stats?.hit_rate_percent ?? 0
            
            // Calculate trend
            if (previousHitRate !== null && currentHitRate !== previousHitRate) {
                const diff = currentHitRate - previousHitRate
                if (Math.abs(diff) < 1) {
                    setTrend('stable')
                } else if (diff > 0) {
                    setTrend('up')
                } else {
                    setTrend('down')
                }
            }
            
            setPreviousHitRate(currentHitRate)
            setMetrics(response)
            setLastUpdate(new Date())
        } catch (error) {
            console.error('Failed to fetch performance metrics:', error)
        } finally {
            setIsLoading(false)
        }
    }

    // Auto-refresh functionality
    useEffect(() => {
        fetchMetrics() // Initial load
        
        if (autoRefresh || settings.autoRefreshEnabled) {
            const interval = setInterval(
                fetchMetrics, 
                (refreshInterval || settings.autoRefreshIntervalSeconds) * 1000
            )
            return () => clearInterval(interval)
        }
    }, [autoRefresh, refreshInterval, settings.autoRefreshEnabled, settings.autoRefreshIntervalSeconds])

    const getTrendIcon = () => {
        switch (trend) {
            case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />
            case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />
            default: return <Minus className="w-4 h-4 text-gray-600" />
        }
    }

    return (
        <Card className={className}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Live Performance
                    </h4>
                    <div className="flex items-center gap-2">
                        {getTrendIcon()}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={fetchMetrics}
                            disabled={isLoading}
                            className="h-6 w-6 p-0"
                        >
                            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Cache Status</span>
                            <PerformanceIndicator 
                                hitRate={metrics?.performance_metrics?.cache_stats?.hit_rate_percent} 
                                showLabel 
                            />
                        </div>

                    {metrics && (
                        <>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Hit Rate</span>
                                <span className="text-sm font-medium">
                                    {(metrics.performance_metrics?.cache_stats?.hit_rate_percent || 0).toFixed(1)}%
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Requests</span>
                                <span className="text-sm font-medium">
                                    {(metrics.performance_metrics?.cache_stats?.total_requests || 0).toLocaleString()}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Cache Type</span>
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded capitalize">
                                    {(metrics.performance_metrics?.cache_stats?.cache_type || 'N/A').replace('_', ' ')}
                                </span>
                            </div>
                        </>
                    )}

                    {lastUpdate && (
                        <div className="text-xs text-gray-500 text-center pt-2 border-t">
                            Last updated: {lastUpdate.toLocaleTimeString()}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

// Compact Performance Summary Component
interface CompactPerformanceSummaryProps {
    metrics?: PerformanceMetricsResponse
    onClick?: () => void
    className?: string
}

export function CompactPerformanceSummary({ 
    metrics, 
    onClick,
    className = "" 
}: CompactPerformanceSummaryProps) {
    if (!metrics) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                <span className="text-sm text-gray-600">Loading performance...</span>
            </div>
        )
    }

    const hitRate = metrics.performance_metrics?.cache_stats?.hit_rate_percent || 0
    const isClickable = !!onClick

    return (
        <div 
            className={`flex items-center gap-3 ${className} ${isClickable ? 'cursor-pointer hover:bg-gray-50 p-2 rounded' : ''}`}
            onClick={onClick}
        >
            <PerformanceIndicator hitRate={hitRate} size="sm" />
            
            <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600">
                    Cache: <span className="font-medium">{hitRate.toFixed(1)}%</span>
                </span>
                
                <span className="text-gray-600">
                    Stores: <span className="font-medium">
                        {(metrics.performance_metrics?.cache_stats?.stores || 0).toLocaleString()}
                    </span>
                </span>
                
                <span className="text-gray-600">
                    Requests: <span className="font-medium">
                        {(metrics.performance_metrics?.cache_stats?.total_requests || 0).toLocaleString()}
                    </span>
                </span>
            </div>
        </div>
    )
}
