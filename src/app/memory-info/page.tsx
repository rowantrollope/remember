"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, ArrowLeft, AlertCircle } from "lucide-react"
import Link from "next/link"
import { memoryAPI, type MemoryInfoResponse } from "@/lib/api"

// Memory Info specific Navbar Component
function MemoryInfoNavbar() {
    return (
        <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center space-x-2">
                            <h1 className="text-2xl font-bold text-purple-600">Recall</h1>
                        </Link>
                    </div>

                    {/* Back button */}
                    <div className="flex items-center space-x-4">
                        <Link href="/">
                            <Button variant="ghost" className="flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Chat
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default function MemoryInfoPage() {
    const [memoryInfo, setMemoryInfo] = useState<MemoryInfoResponse | null>(null)
    const [apiStatus, setApiStatus] = useState<'ready' | 'not_initialized' | 'unknown'>('unknown')
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Check API status and fetch memory info on component mount
    useEffect(() => {
        const initializeAPI = async () => {
            try {
                setIsLoading(true)
                // Check status first
                const status = await memoryAPI.getStatus()
                setApiStatus(status.status)

                // If API is ready, try to fetch memory info
                if (status.status === 'ready') {
                    try {
                        const info = await memoryAPI.getMemoryInfo()
                        if (info.success) {
                            setMemoryInfo(info)
                        }
                    } catch (error) {
                        // Memory info endpoint not available - continue without it
                        console.warn('Memory info endpoint not available:', error)
                        setError('Memory info endpoint not available')
                    }
                }
            } catch (error) {
                setApiStatus('not_initialized')
                setError(`Failed to connect to Memory Agent API: ${error instanceof Error ? error.message : 'Unknown error'}`)
            } finally {
                setIsLoading(false)
            }
        }
        initializeAPI()
    }, [])

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
            <MemoryInfoNavbar />
            <div className="max-w-4xl mx-auto p-6">
                <div className="space-y-6">
                    {/* Page Header */}
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Memory System Information</h1>
                        <p className="text-gray-600">Detailed statistics and configuration of your memory system</p>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            <p className="text-red-700">{error}</p>
                        </div>
                    )}

                    {/* API Status Warning */}
                    {apiStatus !== 'ready' && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-yellow-500" />
                            <p className="text-yellow-700">
                                {apiStatus === 'not_initialized'
                                    ? 'Memory Agent API is not initialized. Please check the server.'
                                    : 'Checking API status...'}
                            </p>
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="text-center py-12">
                            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-gray-600">Loading memory information...</p>
                        </div>
                    )}

                    {/* Memory Statistics */}
                    {!isLoading && memoryInfo && (
                        <div className="grid md:grid-cols-3 gap-6">
                            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                                <CardContent className="p-6">
                                    <div className="text-center p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
                                        <div className="text-3xl font-bold text-purple-600">
                                            {memoryInfo.memory_count || 0}
                                        </div>
                                        <div className="text-sm text-gray-600 mt-1">Total Memories</div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                                <CardContent className="p-6">
                                    <div className="text-center p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg">
                                        <div className="text-3xl font-bold text-blue-600">
                                            {memoryInfo.vector_dimension || 0}
                                        </div>
                                        <div className="text-sm text-gray-600 mt-1">Vector Dimensions</div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                                <CardContent className="p-6">
                                    <div className="text-center p-4 bg-gradient-to-r from-green-100 to-teal-100 rounded-lg">
                                        <div className="text-3xl font-bold text-green-600">
                                            {memoryInfo.vectorset_info ? Object.keys(memoryInfo.vectorset_info).length : 0}
                                        </div>
                                        <div className="text-sm text-gray-600 mt-1">Vector Set Properties</div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* System Details */}
                    {!isLoading && memoryInfo && (
                        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Brain className="w-6 h-6" />
                                    System Configuration
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-gray-900">Embedding Model</h3>
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <p className="text-gray-800 font-mono">{memoryInfo.embedding_model}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-gray-900">Vector Set</h3>
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <p className="text-gray-800 font-mono">{memoryInfo.vectorset_name}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-gray-900">Redis Configuration</h3>
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <p className="text-gray-800 font-mono">
                                                {memoryInfo.redis_host}:{memoryInfo.redis_port}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-gray-900">HNSW Parameters</h3>
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <p className="text-gray-800 font-mono">
                                                M: {memoryInfo.vectorset_info['hnsw-m']}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Additional Vector Set Info */}
                                {memoryInfo.vectorset_info && Object.keys(memoryInfo.vectorset_info).length > 1 && (
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-gray-900">Additional Vector Set Properties</h3>
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                {Object.entries(memoryInfo.vectorset_info).map(([key, value]) => (
                                                    <div key={key} className="flex justify-between">
                                                        <span className="text-gray-600">{key}:</span>
                                                        <span className="text-gray-800 font-mono">{String(value)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* No Data State */}
                    {!isLoading && !memoryInfo && apiStatus === 'ready' && (
                        <div className="text-center py-12">
                            <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Memory Information Available</h3>
                            <p className="text-gray-600">The memory system is running but detailed information is not available.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
