"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Play,
    Square,
    RotateCcw,
    TrendingUp,
    Clock,
    Zap,
    Target,
    BarChart3,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Loader2
} from 'lucide-react'
import { useConfiguredAPI } from '@/hooks/useConfiguredAPI'

interface TestResult {
    id: string
    timestamp: Date
    testType: 'cache_effectiveness' | 'load_test' | 'benchmark'
    query: string
    hitRate?: number
    responseTime: number
    cacheHit: boolean
    similarity?: number
    recommendations?: string[]
}

interface LoadTestResult {
    id: string
    timestamp: Date
    concurrentRequests: number
    totalRequests: number
    averageResponseTime: number
    successRate: number
    cacheHitRate: number
    errors: number
}

interface BenchmarkResult {
    id: string
    timestamp: Date
    withCache: {
        averageResponseTime: number
        totalCost: number
        hitRate: number
    }
    withoutCache: {
        averageResponseTime: number
        totalCost: number
    }
    improvement: {
        timeReduction: number
        costSavings: number
    }
}

export function PerformanceTestingInterface() {
    const { api } = useConfiguredAPI()

    // Test states
    const [isRunningTest, setIsRunningTest] = useState(false)
    const [currentTest, setCurrentTest] = useState<string | null>(null)

    // Test inputs
    const [testQuery, setTestQuery] = useState('')
    const [testQueries, setTestQueries] = useState<string[]>([])
    const [concurrentRequests, setConcurrentRequests] = useState(5)
    const [totalRequests, setTotalRequests] = useState(50)

    // Results
    const [testResults, setTestResults] = useState<TestResult[]>([])
    const [loadTestResults, setLoadTestResults] = useState<LoadTestResult[]>([])
    const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult[]>([])

    // Cache Effectiveness Test
    const runCacheEffectivenessTest = async () => {
        if (!testQuery.trim()) return

        setIsRunningTest(true)
        setCurrentTest('cache_effectiveness')

        try {
            const startTime = Date.now()

            // First request (likely cache miss)
            const firstResponse = await api.ask(testQuery)
            const firstResponseTime = Date.now() - startTime

            // Wait a moment then make second request (should be cache hit if working)
            await new Promise(resolve => setTimeout(resolve, 100))

            const secondStartTime = Date.now()
            const secondResponse = await api.ask(testQuery)
            const secondResponseTime = Date.now() - secondStartTime

            // Analyze results
            const cacheHit = secondResponseTime < firstResponseTime * 0.8 // Significant improvement
            const hitRate = cacheHit ? 100 : 0

            const result: TestResult = {
                id: `test-${Date.now()}`,
                timestamp: new Date(),
                testType: 'cache_effectiveness',
                query: testQuery,
                hitRate,
                responseTime: secondResponseTime,
                cacheHit,
                recommendations: generateRecommendations(hitRate, secondResponseTime)
            }

            setTestResults(prev => [result, ...prev])

        } catch (error) {
            console.error('Cache effectiveness test failed:', error)
        } finally {
            setIsRunningTest(false)
            setCurrentTest(null)
        }
    }

    // Load Test
    const runLoadTest = async () => {
        if (testQueries.length === 0) return

        setIsRunningTest(true)
        setCurrentTest('load_test')

        try {
            const startTime = Date.now()
            const promises: Promise<any>[] = []
            const results: any[] = []
            let errors = 0

            // Create concurrent requests
            for (let i = 0; i < totalRequests; i++) {
                const query = testQueries[i % testQueries.length]
                const promise = api.ask(query)
                    .then(response => {
                        results.push({ success: true, responseTime: Date.now() - startTime })
                    })
                    .catch(error => {
                        errors++
                        results.push({ success: false, error })
                    })

                promises.push(promise)

                // Add delay between batches to simulate concurrent load
                if (i % concurrentRequests === 0 && i > 0) {
                    await Promise.all(promises.slice(-concurrentRequests))
                    await new Promise(resolve => setTimeout(resolve, 50))
                }
            }

            await Promise.all(promises)

            const totalTime = Date.now() - startTime
            const successfulRequests = results.filter(r => r.success).length
            const averageResponseTime = results
                .filter(r => r.success)
                .reduce((sum, r) => sum + r.responseTime, 0) / successfulRequests

            const loadTestResult: LoadTestResult = {
                id: `load-test-${Date.now()}`,
                timestamp: new Date(),
                concurrentRequests,
                totalRequests,
                averageResponseTime,
                successRate: (successfulRequests / totalRequests) * 100,
                cacheHitRate: 0, // Would need to be calculated from actual cache metrics
                errors
            }

            setLoadTestResults(prev => [loadTestResult, ...prev])

        } catch (error) {
            console.error('Load test failed:', error)
        } finally {
            setIsRunningTest(false)
            setCurrentTest(null)
        }
    }

    // Benchmark Test
    const runBenchmarkTest = async () => {
        if (testQueries.length === 0) return

        setIsRunningTest(true)
        setCurrentTest('benchmark')

        try {
            // Test with cache (current state)
            const withCacheStart = Date.now()
            const withCachePromises = testQueries.map(query => api.ask(query))
            await Promise.all(withCachePromises)
            const withCacheTime = Date.now() - withCacheStart

            // Clear cache and test without
            await api.clearCache()

            const withoutCacheStart = Date.now()
            const withoutCachePromises = testQueries.map(query => api.ask(query))
            await Promise.all(withoutCachePromises)
            const withoutCacheTime = Date.now() - withoutCacheStart

            const benchmarkResult: BenchmarkResult = {
                id: `benchmark-${Date.now()}`,
                timestamp: new Date(),
                withCache: {
                    averageResponseTime: withCacheTime / testQueries.length,
                    totalCost: 0.01 * testQueries.length, // Estimated
                    hitRate: 85 // Estimated
                },
                withoutCache: {
                    averageResponseTime: withoutCacheTime / testQueries.length,
                    totalCost: 0.05 * testQueries.length // Estimated
                },
                improvement: {
                    timeReduction: ((withoutCacheTime - withCacheTime) / withoutCacheTime) * 100,
                    costSavings: (0.04 * testQueries.length)
                }
            }

            setBenchmarkResults(prev => [benchmarkResult, ...prev])

        } catch (error) {
            console.error('Benchmark test failed:', error)
        } finally {
            setIsRunningTest(false)
            setCurrentTest(null)
        }
    }

    const generateRecommendations = (hitRate: number, responseTime: number): string[] => {
        const recommendations: string[] = []

        if (hitRate < 50) {
            recommendations.push('Consider adjusting similarity thresholds to improve cache hit rates')
            recommendations.push('Review TTL settings - they might be too short')
        }

        if (responseTime > 1000) {
            recommendations.push('Response time is high - consider optimizing query complexity')
            recommendations.push('Check if semantic cache is properly configured')
        }

        if (hitRate > 80) {
            recommendations.push('Excellent cache performance! Consider similar optimization for other operations')
        }

        return recommendations
    }

    const addTestQuery = () => {
        if (testQuery.trim() && !testQueries.includes(testQuery.trim())) {
            setTestQueries(prev => [...prev, testQuery.trim()])
            setTestQuery('')
        }
    }

    const removeTestQuery = (index: number) => {
        setTestQueries(prev => prev.filter((_, i) => i !== index))
    }

    const clearAllResults = () => {
        setTestResults([])
        setLoadTestResults([])
        setBenchmarkResults([])
    }

    const getStatusIcon = (success: boolean, hitRate?: number) => {
        if (!success) return <XCircle className="w-4 h-4 text-red-600" />
        if (hitRate && hitRate > 80) return <CheckCircle className="w-4 h-4 text-green-600" />
        if (hitRate && hitRate > 50) return <AlertTriangle className="w-4 h-4 text-yellow-600" />
        return <XCircle className="w-4 h-4 text-red-600" />
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Performance Testing</h2>
                    <p className="text-gray-600">Test and benchmark cache performance with various scenarios</p>
                </div>
                <Button
                    variant="outline"
                    onClick={clearAllResults}
                    disabled={isRunningTest}
                    className="flex items-center gap-2"
                >
                    <RotateCcw className="w-4 h-4" />
                    Clear Results
                </Button>
            </div>

            <Tabs defaultValue="setup" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="setup">Test Setup</TabsTrigger>
                    <TabsTrigger value="cache">Cache Tests</TabsTrigger>
                    <TabsTrigger value="load">Load Tests</TabsTrigger>
                    <TabsTrigger value="benchmark">Benchmarks</TabsTrigger>
                </TabsList>

                <TabsContent value="setup" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="w-5 h-5" />
                                Test Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Query Setup */}
                            <div className="space-y-4">
                                <Label className="text-base font-medium">Test Queries</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Enter a test query..."
                                        value={testQuery}
                                        onChange={(e) => setTestQuery(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addTestQuery()}
                                        className="flex-1"
                                    />
                                    <Button onClick={addTestQuery} disabled={!testQuery.trim()}>
                                        Add Query
                                    </Button>
                                </div>

                                {testQueries.length > 0 && (
                                    <div className="space-y-2">
                                        <Label className="text-sm text-gray-600">
                                            Test Queries ({testQueries.length})
                                        </Label>
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {testQueries.map((query, index) => (
                                                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                                    <span className="flex-1 text-sm">{query}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeTestQuery(index)}
                                                        className="h-6 w-6 p-0"
                                                    >
                                                        ×
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Load Test Settings */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="concurrent">Concurrent Requests</Label>
                                    <Input
                                        id="concurrent"
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={concurrentRequests}
                                        onChange={(e) => setConcurrentRequests(parseInt(e.target.value) || 5)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="total">Total Requests</Label>
                                    <Input
                                        id="total"
                                        type="number"
                                        min="10"
                                        max="1000"
                                        value={totalRequests}
                                        onChange={(e) => setTotalRequests(parseInt(e.target.value) || 50)}
                                    />
                                </div>
                            </div>

                            {/* Quick Test Buttons */}
                            <div className="flex gap-2 pt-4 border-t">
                                <Button
                                    onClick={runCacheEffectivenessTest}
                                    disabled={isRunningTest || !testQuery.trim()}
                                    className="flex items-center gap-2"
                                >
                                    {isRunningTest && currentTest === 'cache_effectiveness' ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Zap className="w-4 h-4" />
                                    )}
                                    Test Cache Effectiveness
                                </Button>

                                <Button
                                    onClick={runLoadTest}
                                    disabled={isRunningTest || testQueries.length === 0}
                                    variant="outline"
                                    className="flex items-center gap-2"
                                >
                                    {isRunningTest && currentTest === 'load_test' ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <BarChart3 className="w-4 h-4" />
                                    )}
                                    Run Load Test
                                </Button>

                                <Button
                                    onClick={runBenchmarkTest}
                                    disabled={isRunningTest || testQueries.length === 0}
                                    variant="outline"
                                    className="flex items-center gap-2"
                                >
                                    {isRunningTest && currentTest === 'benchmark' ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <TrendingUp className="w-4 h-4" />
                                    )}
                                    Run Benchmark
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="cache" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="w-5 h-5" />
                                Cache Effectiveness Results
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {testResults.length === 0 ? (
                                <div className="text-center py-8">
                                    <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Cache Tests Run</h3>
                                    <p className="text-gray-600">Run cache effectiveness tests to see results here.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Query</TableHead>
                                            <TableHead>Hit Rate</TableHead>
                                            <TableHead>Response Time</TableHead>
                                            <TableHead>Cache Hit</TableHead>
                                            <TableHead>Timestamp</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {testResults.map((result) => (
                                            <TableRow key={result.id}>
                                                <TableCell>
                                                    {getStatusIcon(true, result.hitRate)}
                                                </TableCell>
                                                <TableCell className="max-w-xs truncate">
                                                    {result.query}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={result.hitRate && result.hitRate > 50 ? "default" : "destructive"}>
                                                        {result.hitRate?.toFixed(1)}%
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{result.responseTime}ms</TableCell>
                                                <TableCell>
                                                    {result.cacheHit ? (
                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                    ) : (
                                                        <XCircle className="w-4 h-4 text-red-600" />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {result.timestamp.toLocaleTimeString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="load" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5" />
                                Load Test Results
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loadTestResults.length === 0 ? (
                                <div className="text-center py-8">
                                    <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Load Tests Run</h3>
                                    <p className="text-gray-600">Run load tests to see performance under concurrent load.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Concurrent</TableHead>
                                            <TableHead>Total Requests</TableHead>
                                            <TableHead>Success Rate</TableHead>
                                            <TableHead>Avg Response Time</TableHead>
                                            <TableHead>Errors</TableHead>
                                            <TableHead>Timestamp</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loadTestResults.map((result) => (
                                            <TableRow key={result.id}>
                                                <TableCell>{result.concurrentRequests}</TableCell>
                                                <TableCell>{result.totalRequests}</TableCell>
                                                <TableCell>
                                                    <Badge variant={result.successRate > 95 ? "default" : "destructive"}>
                                                        {result.successRate.toFixed(1)}%
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{result.averageResponseTime.toFixed(0)}ms</TableCell>
                                                <TableCell>
                                                    {result.errors > 0 ? (
                                                        <Badge variant="destructive">{result.errors}</Badge>
                                                    ) : (
                                                        <Badge variant="default">0</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {result.timestamp.toLocaleTimeString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="benchmark" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                Benchmark Results
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {benchmarkResults.length === 0 ? (
                                <div className="text-center py-8">
                                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Benchmarks Run</h3>
                                    <p className="text-gray-600">Run benchmarks to compare performance with and without cache.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>With Cache</TableHead>
                                            <TableHead>Without Cache</TableHead>
                                            <TableHead>Time Reduction</TableHead>
                                            <TableHead>Cost Savings</TableHead>
                                            <TableHead>Timestamp</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {benchmarkResults.map((result) => (
                                            <TableRow key={result.id}>
                                                <TableCell>
                                                    {result.withCache.averageResponseTime.toFixed(0)}ms
                                                </TableCell>
                                                <TableCell>
                                                    {result.withoutCache.averageResponseTime.toFixed(0)}ms
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="default" className="bg-green-100 text-green-800">
                                                        {result.improvement.timeReduction.toFixed(1)}%
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="default" className="bg-blue-100 text-blue-800">
                                                        ${result.improvement.costSavings.toFixed(2)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {result.timestamp.toLocaleTimeString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}