"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    BarChart3,
    TrendingUp,
    RefreshCw,
    Settings,
    Trash2,
    Download,
    Activity,
    Zap,
    AlertTriangle,
    CheckCircle,
    XCircle,
    HelpCircle
} from "lucide-react"
import { PageLayout } from "@/components/PageLayout"
import { useMemoryAPI } from "@/hooks"
import { usePerformanceSettings } from "@/hooks/usePerformanceSettings"
import type {
    PerformanceMetricsResponse,
    CacheAnalysisResponse,
    OperationMetrics
} from "@/lib/api"

// Performance chart components (will be implemented separately)
import { CacheHitRateChart } from "@/components/performance/CacheHitRateChart"
import { PerformanceComparisonChart } from "@/components/performance/PerformanceComparisonChart"
import { OperationBreakdownChart } from "@/components/performance/OperationBreakdownChart"
import { PerformanceTestingInterface } from "@/components/performance/PerformanceTestingInterface"
// import { PerformanceHelpDialog } from "@/components/performance/PerformanceHelpSystem"
import {
    PerformanceErrorBoundary,
    PerformanceApiError,
    PerformanceUnavailable,
    PerformanceLoading
} from "@/components/performance/PerformanceErrorBoundary"
import { usePerformanceAPI, usePerformanceAvailability } from "@/hooks/usePerformanceAPI"

export default function PerformancePage() {
    const { error, apiStatus, clearError } = useMemoryAPI()
    const { settings: performanceSettings } = usePerformanceSettings()
    const { isAvailable, isChecking, error: availabilityError, checkAvailability } = usePerformanceAvailability()
    const performanceAPI = usePerformanceAPI()
    
    const [metrics, setMetrics] = useState<PerformanceMetricsResponse | null>(null)
    const [analysis, setAnalysis] = useState<CacheAnalysisResponse | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
    const [sortColumn, setSortColumn] = useState<keyof OperationMetrics>('hit_rate')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
    const [showAnalysisDialog, setShowAnalysisDialog] = useState(false)

    // Auto-refresh functionality
    useEffect(() => {
        if (performanceSettings.autoRefreshEnabled) {
            const interval = setInterval(() => {
                refreshMetrics()
            }, performanceSettings.autoRefreshIntervalSeconds * 1000)

            return () => clearInterval(interval)
        }
    }, [performanceSettings.autoRefreshEnabled, performanceSettings.autoRefreshIntervalSeconds])

    // Load initial metrics
    useEffect(() => {
        loadMetrics()
    }, [])

    const loadMetrics = async () => {
        setIsLoading(true)
        const result = await performanceAPI.getMetrics()
        if (result) {
            setMetrics(result)
            setLastRefresh(new Date())
        }
        setIsLoading(false)
    }

    const refreshMetrics = async () => {
        setIsRefreshing(true)
        const result = await performanceAPI.getMetrics()
        if (result) {
            setMetrics(result)
            setLastRefresh(new Date())
        }
        setIsRefreshing(false)
    }

    const loadAnalysis = async () => {
        const result = await performanceAPI.analyzeCache()
        if (result) {
            setAnalysis(result)
            setShowAnalysisDialog(true)
        }
    }

    const clearAllCache = async () => {
        if (confirm('Are you sure you want to clear all cache? This action cannot be undone.')) {
            const result = await performanceAPI.clearCache()
            if (result) {
                await refreshMetrics()
            }
        }
    }

    const clearOperationCache = async (operationType: string) => {
        if (confirm(`Are you sure you want to clear cache for ${operationType}?`)) {
            const result = await performanceAPI.clearCache({ operation_type: operationType })
            if (result) {
                await refreshMetrics()
            }
        }
    }

    const exportReport = () => {
        if (!metrics) return

        const report = {
            timestamp: new Date().toISOString(),
            cache_stats: metrics.performance_metrics.cache_stats,
            operation_metrics: metrics.operation_metrics,
            analysis: analysis
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
    }

    const getHitRateColor = (hitRate: number) => {
        if (hitRate >= 60) return 'text-green-600 bg-green-100'
        if (hitRate >= 30) return 'text-yellow-600 bg-yellow-100'
        return 'text-red-600 bg-red-100'
    }

    const getEffectivenessIcon = (rating: string) => {
        switch (rating) {
            case 'excellent': return <CheckCircle className="w-5 h-5 text-green-600" />
            case 'good': return <CheckCircle className="w-5 h-5 text-blue-600" />
            case 'fair': return <AlertTriangle className="w-5 h-5 text-yellow-600" />
            case 'poor': return <XCircle className="w-5 h-5 text-red-600" />
            default: return <Activity className="w-5 h-5 text-gray-600" />
        }
    }

    // Since the API doesn't return operation_metrics, we'll create a mock one from cache_stats
    const operationMetrics = metrics?.operation_metrics || (metrics?.performance_metrics?.cache_stats ? [{
        operation_type: 'cache_operations',
        hit_rate: metrics.performance_metrics.cache_stats.hit_rate_percent,
        hits: metrics.performance_metrics.cache_stats.semantic_hits || metrics.performance_metrics.cache_stats.hits || 0,
        misses: metrics.performance_metrics.cache_stats.semantic_misses || metrics.performance_metrics.cache_stats.misses || 0,
        ttl_seconds: 3600 // Default TTL
    }] : [])

    const sortedOperations = operationMetrics?.sort((a, b) => {
        const aValue = a[sortColumn]
        const bValue = b[sortColumn]

        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
        }

        const aStr = String(aValue)
        const bStr = String(bValue)
        return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
    })

    const handleSort = (column: keyof OperationMetrics) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortColumn(column)
            setSortDirection('desc')
        }
    }

    // Check availability first
    if (isChecking) {
        return (
            <PageLayout
                error={error}
                apiStatus={apiStatus}
                onClearError={clearError}
            >
                <PerformanceLoading message="Checking performance feature availability..." size="lg" />
            </PageLayout>
        )
    }

    if (isAvailable === false) {
        return (
            <PageLayout
                error={error}
                apiStatus={apiStatus}
                onClearError={clearError}
            >
                <PerformanceUnavailable
                    reason={availabilityError || "Performance monitoring is not available"}
                    onRetry={checkAvailability}
                />
            </PageLayout>
        )
    }

    return (
        <PageLayout
            error={error}
            apiStatus={apiStatus}
            onClearError={clearError}
        >
            <PerformanceErrorBoundary>
                <div className="h-full flex flex-col">
                {/* Header */}
                <div className="flex-shrink-0 bg-white pb-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-6 h-6 text-blue-600" />
                            <h1 className="text-2xl font-bold text-gray-900">Performance Dashboard</h1>
                        </div>
                        {lastRefresh && (
                            <div className="text-sm text-gray-500">
                                Last updated: {lastRefresh.toLocaleTimeString()}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={refreshMetrics}
                            disabled={isRefreshing}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadAnalysis}
                            className="flex items-center gap-2"
                        >
                            <TrendingUp className="w-4 h-4" />
                            Analyze
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={exportReport}
                            disabled={!metrics}
                            className="flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => alert('Help documentation coming soon!')}
                            className="flex items-center gap-2"
                        >
                            <HelpCircle className="w-4 h-4" />
                            Help
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 min-h-0 overflow-auto">
                    {/* Performance API Error Display */}
                    {performanceAPI.error && (
                        <div className="p-4">
                            <PerformanceApiError
                                error={performanceAPI.error}
                                onRetry={performanceAPI.retry}
                                onDismiss={performanceAPI.clearError}
                                context="load performance data"
                            />
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                                <p className="text-gray-600">Loading performance metrics...</p>
                            </div>
                        </div>
                    ) : metrics ? (
                        <div className="space-y-6">
                            {/* Cache Statistics Overview */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
                                        <Activity className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {metrics.performance_metrics?.cache_stats?.hit_rate_percent?.toFixed(1) ?? 'N/A'}%
                                        </div>
                                        <Badge className={getHitRateColor(metrics.performance_metrics?.cache_stats?.hit_rate_percent ?? 0)}>
                                            {(metrics.performance_metrics?.cache_stats?.hit_rate_percent ?? 0) >= 60 ? 'Excellent' :
                                             (metrics.performance_metrics?.cache_stats?.hit_rate_percent ?? 0) >= 30 ? 'Good' : 'Needs Improvement'}
                                        </Badge>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                                        <Activity className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {metrics.performance_metrics?.cache_stats?.total_requests ?? 0}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Cache requests
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Errors</CardTitle>
                                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {metrics.performance_metrics?.cache_stats?.errors ?? 0}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Cache errors
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Cache Type</CardTitle>
                                        <Zap className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-lg font-bold capitalize">
                                            {metrics.performance_metrics?.cache_stats?.cache_type?.replace('_', ' ') ?? 'N/A'}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {metrics.performance_metrics?.cache_stats?.total_requests ?? 0} total requests
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Charts and Tables */}
                            <Tabs defaultValue="overview" className="w-full">
                                <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="overview">Overview</TabsTrigger>
                                    <TabsTrigger value="operations">Operations</TabsTrigger>
                                    <TabsTrigger value="testing">Testing</TabsTrigger>
                                    <TabsTrigger value="management">Management</TabsTrigger>
                                </TabsList>

                                <TabsContent value="overview" className="space-y-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Cache Hit Rate Trend</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <CacheHitRateChart metrics={metrics} />
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Performance Comparison</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <PerformanceComparisonChart metrics={metrics} />
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Operation Breakdown</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <OperationBreakdownChart metrics={metrics} />
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="operations" className="space-y-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Operation-Specific Metrics</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead 
                                                            className="cursor-pointer"
                                                            onClick={() => handleSort('operation_type')}
                                                        >
                                                            Operation Type
                                                        </TableHead>
                                                        <TableHead 
                                                            className="cursor-pointer"
                                                            onClick={() => handleSort('hit_rate')}
                                                        >
                                                            Hit Rate %
                                                        </TableHead>
                                                        <TableHead 
                                                            className="cursor-pointer"
                                                            onClick={() => handleSort('hits')}
                                                        >
                                                            Hits
                                                        </TableHead>
                                                        <TableHead 
                                                            className="cursor-pointer"
                                                            onClick={() => handleSort('misses')}
                                                        >
                                                            Misses
                                                        </TableHead>
                                                        {metrics.performance_metrics?.cache_stats?.cache_type === 'semantic_vectorset' && (
                                                            <TableHead
                                                                className="cursor-pointer"
                                                                onClick={() => handleSort('avg_similarity')}
                                                            >
                                                                Avg Similarity
                                                            </TableHead>
                                                        )}
                                                        <TableHead 
                                                            className="cursor-pointer"
                                                            onClick={() => handleSort('ttl_seconds')}
                                                        >
                                                            TTL
                                                        </TableHead>
                                                        <TableHead>Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {sortedOperations?.map((operation) => (
                                                        <TableRow key={operation.operation_type}>
                                                            <TableCell className="font-medium">
                                                                {operation.operation_type.replace(/_/g, ' ')}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge className={getHitRateColor(operation.hit_rate ?? 0)}>
                                                                    {operation.hit_rate?.toFixed(1) ?? 'N/A'}%
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>{operation.hits}</TableCell>
                                                            <TableCell>{operation.misses}</TableCell>
                                                            {metrics.performance_metrics?.cache_stats?.cache_type === 'semantic_vectorset' && (
                                                                <TableCell>
                                                                    {operation.avg_similarity?.toFixed(3) || 'N/A'}
                                                                </TableCell>
                                                            )}
                                                            <TableCell>
                                                                {Math.floor(operation.ttl_seconds / 60)}m
                                                            </TableCell>
                                                            <TableCell>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => clearOperationCache(operation.operation_type)}
                                                                    className="flex items-center gap-1"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                    Clear
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="testing" className="space-y-6">
                                    <PerformanceTestingInterface />
                                </TabsContent>

                                <TabsContent value="management" className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Quick Actions</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <Button
                                                    variant="destructive"
                                                    onClick={clearAllCache}
                                                    className="w-full flex items-center gap-2"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Clear All Cache
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={loadAnalysis}
                                                    className="w-full flex items-center gap-2"
                                                >
                                                    <TrendingUp className="w-4 h-4" />
                                                    Analyze Effectiveness
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={exportReport}
                                                    disabled={!metrics}
                                                    className="w-full flex items-center gap-2"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Export Report
                                                </Button>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Cache Statistics</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600">Semantic Hits:</span>
                                                    <span className="font-medium">{metrics.performance_metrics?.cache_stats?.semantic_hits ?? metrics.performance_metrics?.cache_stats?.hits ?? 0}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600">Semantic Misses:</span>
                                                    <span className="font-medium">{metrics.performance_metrics?.cache_stats?.semantic_misses ?? metrics.performance_metrics?.cache_stats?.misses ?? 0}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600">Total Requests:</span>
                                                    <span className="font-medium">{metrics.performance_metrics?.cache_stats?.total_requests ?? 0}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600">Stores:</span>
                                                    <span className="font-medium">{metrics.performance_metrics?.cache_stats?.stores ?? 0}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600">Errors:</span>
                                                    <span className="font-medium">{metrics.performance_metrics?.cache_stats?.errors ?? 0}</span>
                                                </div>
                                                {metrics.performance_metrics?.cache_stats?.embedding_calls && (
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-gray-600">Embedding Calls:</span>
                                                        <span className="font-medium">{metrics.performance_metrics.cache_stats.embedding_calls}</span>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Configuration</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <Button
                                                    variant="outline"
                                                    className="w-full flex items-center gap-2"
                                                >
                                                    <Settings className="w-4 h-4" />
                                                    Performance Settings
                                                </Button>
                                                <div className="text-sm text-gray-600">
                                                    <div>Cache Type: {metrics.performance_metrics?.cache_stats?.cache_type ?? 'N/A'}</div>
                                                    <div>Auto-refresh: {performanceSettings.autoRefreshEnabled ? 'On' : 'Off'}</div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Performance Data</h3>
                                <p className="text-gray-600 mb-4">
                                    Performance metrics are not available. This could be because:
                                </p>
                                <ul className="text-sm text-gray-500 text-left max-w-md mx-auto mb-6">
                                    <li>• Performance optimization is not enabled</li>
                                    <li>• No cache operations have been performed yet</li>
                                    <li>• The performance API is not available</li>
                                </ul>
                                <Button onClick={loadMetrics} className="flex items-center gap-2">
                                    <RefreshCw className="w-4 h-4" />
                                    Try Again
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Analysis Dialog */}
                <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                {analysis && getEffectivenessIcon(analysis.effectiveness_rating)}
                                Cache Effectiveness Analysis
                            </DialogTitle>
                            <DialogDescription>
                                Analysis of your current cache performance and recommendations for improvement.
                            </DialogDescription>
                        </DialogHeader>
                        
                        {analysis && (
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-medium mb-2">Overall Rating</h4>
                                    <Badge className={
                                        analysis.effectiveness_rating === 'excellent' ? 'bg-green-100 text-green-800' :
                                        analysis.effectiveness_rating === 'good' ? 'bg-blue-100 text-blue-800' :
                                        analysis.effectiveness_rating === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }>
                                        {analysis.effectiveness_rating ? 
                                            analysis.effectiveness_rating.charAt(0).toUpperCase() + analysis.effectiveness_rating.slice(1) : 
                                            'Unknown'
                                        }
                                    </Badge>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-2">Recommendations</h4>
                                    <ul className="text-sm space-y-1">
                                        {(analysis.recommendations || []).map((rec, index) => (
                                            <li key={index} className="flex items-start gap-2">
                                                <span className="text-blue-600 mt-1">•</span>
                                                <span>{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-2">Potential Improvements</h4>
                                    <div className="text-sm space-y-1">
                                        <div>Additional Cost Savings: ${analysis.potential_additional_savings?.cost_usd?.toFixed(2) ?? 'N/A'}</div>
                                        <div>Additional Time Savings: {analysis.potential_additional_savings?.time_seconds ? (analysis.potential_additional_savings.time_seconds / 60).toFixed(1) : 'N/A'} minutes</div>
                                        <div>Potential Hit Rate: {analysis.current_vs_potential?.potential_hit_rate?.toFixed(1) ?? 'N/A'}%</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
                </div>
            </PerformanceErrorBoundary>
        </PageLayout>
    )
}
