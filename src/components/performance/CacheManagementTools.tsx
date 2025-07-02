"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { 
    Trash2, 
    TrendingUp, 
    Download, 
    AlertTriangle,
    CheckCircle,
    XCircle,
    Info,
    Loader2,
    FileText
} from 'lucide-react'
import { useConfiguredAPI } from '@/hooks/useConfiguredAPI'
import type { 
    CacheAnalysisResponse,
    PerformanceMetricsResponse,
    OperationMetrics 
} from '@/lib/api'

interface CacheManagementToolsProps {
    metrics?: PerformanceMetricsResponse
    onCacheCleared?: () => void
}

export function CacheManagementTools({ metrics, onCacheCleared }: CacheManagementToolsProps) {
    const { api } = useConfiguredAPI()
    
    const [isClearing, setIsClearing] = useState(false)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [selectedOperation, setSelectedOperation] = useState<string>('')
    const [analysis, setAnalysis] = useState<CacheAnalysisResponse | null>(null)
    const [showAnalysisDialog, setShowAnalysisDialog] = useState(false)
    const [clearStatus, setClearStatus] = useState<'idle' | 'success' | 'error'>('idle')

    const clearAllCache = async () => {
        if (!confirm('Are you sure you want to clear all cache? This action cannot be undone and may temporarily impact performance.')) {
            return
        }

        setIsClearing(true)
        setClearStatus('idle')
        
        try {
            const result = await api.clearCache()
            setClearStatus('success')
            onCacheCleared?.()
            
            // Show success message briefly
            setTimeout(() => setClearStatus('idle'), 3000)
        } catch (error) {
            console.error('Failed to clear all cache:', error)
            setClearStatus('error')
            setTimeout(() => setClearStatus('idle'), 5000)
        } finally {
            setIsClearing(false)
        }
    }

    const clearOperationCache = async () => {
        if (!selectedOperation) return
        
        if (!confirm(`Are you sure you want to clear cache for ${selectedOperation.replace(/_/g, ' ')}?`)) {
            return
        }

        setIsClearing(true)
        setClearStatus('idle')
        
        try {
            const result = await api.clearCache({ operation_type: selectedOperation })
            setClearStatus('success')
            onCacheCleared?.()
            setSelectedOperation('')
            
            // Show success message briefly
            setTimeout(() => setClearStatus('idle'), 3000)
        } catch (error) {
            console.error('Failed to clear operation cache:', error)
            setClearStatus('error')
            setTimeout(() => setClearStatus('idle'), 5000)
        } finally {
            setIsClearing(false)
        }
    }

    const analyzeCache = async () => {
        setIsAnalyzing(true)
        
        try {
            const result = await api.analyzeCacheEffectiveness()
            setAnalysis(result)
            setShowAnalysisDialog(true)
        } catch (error) {
            console.error('Failed to analyze cache effectiveness:', error)
        } finally {
            setIsAnalyzing(false)
        }
    }

    const exportReport = async () => {
        if (!metrics) return

        setIsExporting(true)
        
        try {
            // Include analysis in the report if available
            let analysisData = analysis
            if (!analysisData) {
                try {
                    analysisData = await api.analyzeCacheEffectiveness()
                } catch (error) {
                    console.warn('Could not include analysis in report:', error)
                }
            }

            const operationMetrics = metrics.operation_metrics || []
            
            const report = {
                timestamp: new Date().toISOString(),
                performance_metrics: metrics.performance_metrics,
                operation_metrics: operationMetrics,
                analysis: analysisData,
                summary: {
                    total_operations: operationMetrics.length,
                    average_hit_rate: operationMetrics.length > 0 
                        ? operationMetrics.reduce((sum, op) => sum + op.hit_rate, 0) / operationMetrics.length 
                        : 0,
                    best_performing_operation: operationMetrics.length > 0 
                        ? operationMetrics.reduce((best, current) => 
                            current.hit_rate > best.hit_rate ? current : best
                        ) 
                        : null,
                    worst_performing_operation: operationMetrics.length > 0 
                        ? operationMetrics.reduce((worst, current) => 
                            current.hit_rate < worst.hit_rate ? current : worst
                        ) 
                        : null
                }
            }

            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Failed to export report:', error)
        } finally {
            setIsExporting(false)
        }
    }

    const getEffectivenessIcon = (rating: string) => {
        switch (rating) {
            case 'excellent': return <CheckCircle className="w-5 h-5 text-green-600" />
            case 'good': return <CheckCircle className="w-5 h-5 text-blue-600" />
            case 'fair': return <AlertTriangle className="w-5 h-5 text-yellow-600" />
            case 'poor': return <XCircle className="w-5 h-5 text-red-600" />
            default: return <Info className="w-5 h-5 text-gray-600" />
        }
    }

    const getEffectivenessColor = (rating: string) => {
        switch (rating) {
            case 'excellent': return 'bg-green-100 text-green-800'
            case 'good': return 'bg-blue-100 text-blue-800'
            case 'fair': return 'bg-yellow-100 text-yellow-800'
            case 'poor': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className="space-y-6">
            {/* Quick Actions Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trash2 className="w-5 h-5" />
                        Quick Actions
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Status Messages */}
                    {clearStatus === 'success' && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-700">Cache cleared successfully!</span>
                        </div>
                    )}
                    
                    {clearStatus === 'error' && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="text-sm text-red-700">Failed to clear cache. Please try again.</span>
                        </div>
                    )}

                    {/* Clear All Cache */}
                    <div className="space-y-2">
                        <Button
                            variant="destructive"
                            onClick={clearAllCache}
                            disabled={isClearing}
                            className="w-full flex items-center gap-2"
                        >
                            {isClearing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Trash2 className="w-4 h-4" />
                            )}
                            {isClearing ? 'Clearing...' : 'Clear All Cache'}
                        </Button>
                        <p className="text-xs text-gray-500">
                            Removes all cached entries across all operations. Use with caution.
                        </p>
                    </div>

                    {/* Clear Operation-Specific Cache */}
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <Select value={selectedOperation} onValueChange={setSelectedOperation}>
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Select operation type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(metrics?.operation_metrics || []).map((operation) => (
                                        <SelectItem key={operation.operation_type} value={operation.operation_type}>
                                            {operation.operation_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                onClick={clearOperationCache}
                                disabled={!selectedOperation || isClearing}
                                className="flex items-center gap-2"
                            >
                                {isClearing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                Clear
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                            Clear cache for a specific operation type only.
                        </p>
                    </div>

                    {/* Analyze Cache Effectiveness */}
                    <div className="space-y-2">
                        <Button
                            variant="outline"
                            onClick={analyzeCache}
                            disabled={isAnalyzing}
                            className="w-full flex items-center gap-2"
                        >
                            {isAnalyzing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <TrendingUp className="w-4 h-4" />
                            )}
                            {isAnalyzing ? 'Analyzing...' : 'Analyze Cache Effectiveness'}
                        </Button>
                        <p className="text-xs text-gray-500">
                            Get recommendations for improving cache performance.
                        </p>
                    </div>

                    {/* Export Performance Report */}
                    <div className="space-y-2">
                        <Button
                            variant="outline"
                            onClick={exportReport}
                            disabled={!metrics || isExporting}
                            className="w-full flex items-center gap-2"
                        >
                            {isExporting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            {isExporting ? 'Exporting...' : 'Export Performance Report'}
                        </Button>
                        <p className="text-xs text-gray-500">
                            Download a comprehensive JSON report of current performance metrics.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Cache Statistics Summary */}
            {metrics && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Cache Statistics Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                                <span className="text-gray-600">Cache Type:</span>
                                <div className="font-medium capitalize">
                                    {(metrics.performance_metrics?.cache_stats?.cache_type || 'N/A').replace('_', ' ')}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-gray-600">Hit Rate:</span>
                                <div className="font-medium">
                                    {(metrics.performance_metrics?.cache_stats?.hit_rate_percent || 0).toFixed(1)}%
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-gray-600">Total Requests:</span>
                                <div className="font-medium">
                                    {(metrics.performance_metrics?.cache_stats?.total_requests || 0).toLocaleString()}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-gray-600">Stores:</span>
                                <div className="font-medium">
                                    {(metrics.performance_metrics?.cache_stats?.stores || 0).toLocaleString()}
                                </div>
                            </div>
                        </div>
                        
                        {metrics.performance_metrics?.cache_stats?.embedding_calls && (
                            <div className="pt-2 border-t">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Embedding Calls:</span>
                                    <span className="font-medium">
                                        {metrics.performance_metrics.cache_stats.embedding_calls.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Cache Analysis Dialog */}
            <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {analysis && getEffectivenessIcon(analysis.effectiveness_rating)}
                            Cache Effectiveness Analysis
                        </DialogTitle>
                        <DialogDescription>
                            Detailed analysis of your cache performance with actionable recommendations.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {analysis && (
                        <div className="space-y-6">
                            {/* Overall Rating */}
                            <div className="text-center">
                                <div className="mb-3">
                                    {getEffectivenessIcon(analysis.effectiveness_rating)}
                                </div>
                                <Badge className={getEffectivenessColor(analysis.effectiveness_rating)}>
                                    {analysis.effectiveness_rating.charAt(0).toUpperCase() + analysis.effectiveness_rating.slice(1)} Performance
                                </Badge>
                            </div>

                            {/* Current vs Potential Performance */}
                            <div className="space-y-3">
                                <h4 className="font-medium">Performance Comparison</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Current Hit Rate:</span>
                                        <span className="font-medium">
                                            {analysis.current_vs_potential.current_hit_rate.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Potential Hit Rate:</span>
                                        <span className="font-medium text-green-600">
                                            {analysis.current_vs_potential.potential_hit_rate.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Potential Savings */}
                            <div className="space-y-3">
                                <h4 className="font-medium">Additional Savings Potential</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Cost Savings:</span>
                                        <span className="font-medium text-green-600">
                                            +${analysis.potential_additional_savings.cost_usd.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Time Savings:</span>
                                        <span className="font-medium text-green-600">
                                            +{(analysis.potential_additional_savings.time_seconds / 60).toFixed(1)} minutes
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="space-y-3">
                                <h4 className="font-medium">Recommendations</h4>
                                <ul className="space-y-2">
                                    {analysis.recommendations.map((recommendation, index) => (
                                        <li key={index} className="flex items-start gap-2 text-sm">
                                            <span className="text-blue-600 mt-1 flex-shrink-0">•</span>
                                            <span>{recommendation}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
