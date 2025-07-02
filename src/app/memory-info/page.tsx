"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Brain, AlertCircle, CheckCircle, Settings, RotateCcw, BarChart3 } from "lucide-react"
import { type MemoryInfoResponse } from "@/lib/api"
import { useConfiguredAPI } from "@/hooks/useConfiguredAPI"
import { ClearAllMemoriesDialog } from "@/components/ClearAllMemoriesDialog"
import { usePersistentChat } from "@/hooks/usePersistentChat"
import { useSettings } from "@/hooks/useSettings"
import { Navbar } from "@/components/Navbar"
import { LLMConfigurationPanel } from "@/components/llm"

export default function MemoryInfoPage() {
    const [memoryInfo, setMemoryInfo] = useState<MemoryInfoResponse | null>(null)
    const [apiStatus, setApiStatus] = useState<'ready' | 'not_initialized' | 'unknown'>('unknown')
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isClearingMemories, setIsClearingMemories] = useState(false)
    const [clearSuccess, setClearSuccess] = useState<string | null>(null)
    const [tempTopK, setTempTopK] = useState<string>('5')
    const [tempMinSimilarity, setTempMinSimilarity] = useState<string>('0.7')
    const [tempServerUrl, setTempServerUrl] = useState<string>('http://localhost')
    const [tempServerPort, setTempServerPort] = useState<string>('5001')

    // Get chat history clearing function
    const { clearChatHistory } = usePersistentChat()

    // Get settings and configured API
    const { settings, updateSetting, resetSettings } = useSettings()
    const { api: memoryAPI, isLoaded: apiConfigLoaded } = useConfiguredAPI()

    // Sync temp values with settings when settings change
    useEffect(() => {
        setTempTopK(settings.questionTopK.toString())
        setTempMinSimilarity(settings.minSimilarity.toString())
        setTempServerUrl(settings.serverUrl)
        setTempServerPort(settings.serverPort.toString())
    }, [settings.questionTopK, settings.minSimilarity, settings.serverUrl, settings.serverPort])

    // Check API status and fetch memory info on component mount
    useEffect(() => {
        // Don't try to connect until API configuration is loaded
        if (!apiConfigLoaded) {
            return
        }

        const initializeAPI = async () => {
            try {
                setIsLoading(true)
                setError(null)

                // Try to fetch memory info to check if API is working
                const info = await memoryAPI.getMemoryInfo()
                if (info.success) {
                    setMemoryInfo(info)
                    setApiStatus('ready')
                } else {
                    setApiStatus('not_initialized')
                    setError('Memory Agent API returned an error')
                }
            } catch (error) {
                setApiStatus('not_initialized')
                setError(`Failed to connect to Memory Agent API: ${error instanceof Error ? error.message : 'Unknown error'}`)
            } finally {
                setIsLoading(false)
            }
        }
        initializeAPI()
    }, [memoryAPI, apiConfigLoaded])

    const handleClearAllMemories = async () => {
        setIsClearingMemories(true)
        setError(null)
        setClearSuccess(null)

        try {
            const response = await memoryAPI.clearAllMemories()

            if (response.success) {
                setClearSuccess(`Successfully cleared ${response.deleted_count} memories and chat history`)

                // Clear local chat history
                clearChatHistory()

                // Refresh memory info to show updated count
                if (apiStatus === 'ready') {
                    try {
                        const info = await memoryAPI.getMemoryInfo()
                        if (info.success) {
                            setMemoryInfo(info)
                        }
                    } catch (error) {
                        console.warn('Failed to refresh memory info after clearing:', error)
                    }
                }
            } else {
                setError('Failed to clear memories')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to clear memories')
        } finally {
            setIsClearingMemories(false)
        }
    }

    return (
        <div className="min-h-screen ">
            <Navbar />
            <div className="max-w-4xl mx-auto p-6">
                <div className="space-y-6">
                    {/* Page Header */}
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
                        <p className="text-gray-600">Detailed statistics and configuration Remem Agent</p>
                    </div>

                    {/* Success Display */}
                    {clearSuccess && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <p className="text-green-700">{clearSuccess}</p>
                        </div>
                    )}

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
                        <>
                            <div className="grid grid-cols-3 gap-6">
                                <Card className="text-center p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
                                    <CardContent>
                                        <div>
                                            <div className="text-3xl font-bold text-purple-600">
                                                {memoryInfo.memory_count || 0}
                                            </div>
                                            <div className="text-sm text-gray-600 mt-1">Total Memories</div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="text-center p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg">
                                    <CardContent>
                                        <div className="text-3xl font-bold text-blue-600">
                                            {memoryInfo.vector_dimension || 0}
                                        </div>
                                        <div className="text-sm text-gray-600 mt-1">Vector Dimensions</div>
                                    </CardContent>
                                </Card>

                                <Card className="text-center p-4 bg-gradient-to-r from-green-100 to-teal-100 rounded-lg">
                                    <CardContent className="">
                                        <div className="text-3xl font-bold text-green-600">
                                            {memoryInfo.vectorset_info ? Object.keys(memoryInfo.vectorset_info).length : 0}
                                        </div>
                                        <div className="text-sm text-gray-600 mt-1">Attributes</div>
                                    </CardContent>
                                </Card>
                            </div>


                        </>
                    )}
                    {/* Settings Section */}
                    <Card className="">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Settings className="w-6 h-6" />
                                Application Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="question-top-k" className="text-sm font-medium">
                                        Number of memories to use when answering questions
                                    </Label>
                                    <p className="text-xs text-gray-500">
                                        Controls how many relevant memories are considered when the AI answers your questions.
                                        Higher values provide more context but may include less relevant information.
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            id="question-top-k"
                                            type="number"
                                            min="1"
                                            max="50"
                                            value={tempTopK}
                                            onChange={(e) => setTempTopK(e.target.value)}
                                            className="w-24"
                                        />
                                        <Button
                                            onClick={() => {
                                                const value = parseInt(tempTopK)
                                                if (value >= 1 && value <= 50) {
                                                    updateSetting('questionTopK', value)
                                                }
                                            }}
                                            size="sm"
                                            disabled={
                                                tempTopK === settings.questionTopK.toString() ||
                                                parseInt(tempTopK) < 1 ||
                                                parseInt(tempTopK) > 50 ||
                                                isNaN(parseInt(tempTopK))
                                            }
                                        >
                                            Save
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                resetSettings()
                                                setTempTopK('10')
                                                setTempMinSimilarity('0.9')
                                                setTempServerUrl('http://localhost')
                                                setTempServerPort('5001')
                                            }}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <RotateCcw className="w-4 h-4 mr-1" />
                                            Reset All
                                        </Button>
                                    </div>
                                    <p className="text-xs text-gray-600">
                                        Current setting: <span className="font-mono font-medium">{settings.questionTopK}</span> memories
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="min-similarity" className="text-sm font-medium">
                                        Minimum similarity threshold for memory retrieval
                                    </Label>
                                    <p className="text-xs text-gray-500">
                                        Controls how similar memories must be to your question to be considered relevant.
                                        Higher values (closer to 1.0) require more precise matches, lower values include more diverse memories.
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            id="min-similarity"
                                            type="number"
                                            min="0.0"
                                            max="1.0"
                                            step="0.1"
                                            value={tempMinSimilarity}
                                            onChange={(e) => setTempMinSimilarity(e.target.value)}
                                            className="w-24"
                                        />
                                        <Button
                                            onClick={() => {
                                                const value = parseFloat(tempMinSimilarity)
                                                if (value >= 0.0 && value <= 1.0) {
                                                    updateSetting('minSimilarity', value)
                                                }
                                            }}
                                            size="sm"
                                            disabled={
                                                tempMinSimilarity === settings.minSimilarity.toString() ||
                                                parseFloat(tempMinSimilarity) < 0.0 ||
                                                parseFloat(tempMinSimilarity) > 1.0 ||
                                                isNaN(parseFloat(tempMinSimilarity))
                                            }
                                        >
                                            Save
                                        </Button>
                                    </div>
                                    <p className="text-xs text-gray-600">
                                        Current setting: <span className="font-mono font-medium">{settings.minSimilarity}</span> similarity threshold
                                    </p>
                                </div>

                                {/* Server Configuration */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">
                                        REMEM Server Configuration
                                    </Label>
                                    <p className="text-xs text-gray-500">
                                        Configure the URL and port for your REMEM Memory Agent server.
                                    </p>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="server-url" className="text-xs text-gray-600">Server URL</Label>
                                            <Input
                                                id="server-url"
                                                type="text"
                                                placeholder="http://localhost"
                                                value={tempServerUrl}
                                                onChange={(e) => setTempServerUrl(e.target.value)}
                                                className="text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="server-port" className="text-xs text-gray-600">Port</Label>
                                            <Input
                                                id="server-port"
                                                type="number"
                                                min="1"
                                                max="65535"
                                                placeholder="5001"
                                                value={tempServerPort}
                                                onChange={(e) => setTempServerPort(e.target.value)}
                                                className="text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 pt-2">
                                        <Button
                                            onClick={() => {
                                                const port = parseInt(tempServerPort)
                                                const url = tempServerUrl.trim()

                                                if (url &&
                                                    (url.startsWith('http://') || url.startsWith('https://')) &&
                                                    port >= 1 && port <= 65535) {
                                                    updateSetting('serverUrl', url)
                                                    updateSetting('serverPort', port)
                                                }
                                            }}
                                            size="sm"
                                            disabled={
                                                !tempServerUrl.trim() ||
                                                (!tempServerUrl.startsWith('http://') && !tempServerUrl.startsWith('https://')) ||
                                                tempServerUrl === settings.serverUrl &&
                                                tempServerPort === settings.serverPort.toString() ||
                                                parseInt(tempServerPort) < 1 ||
                                                parseInt(tempServerPort) > 65535 ||
                                                isNaN(parseInt(tempServerPort))
                                            }
                                        >
                                            Save Server Settings
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setTempServerUrl('http://localhost')
                                                setTempServerPort('5001')
                                                updateSetting('serverUrl', 'http://localhost')
                                                updateSetting('serverPort', 5001)
                                            }}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <RotateCcw className="w-4 h-4 mr-1" />
                                            Reset Server
                                        </Button>
                                    </div>
                                    <p className="text-xs text-gray-600">
                                        Current server: <span className="font-mono font-medium">{settings.serverUrl}:{settings.serverPort}</span>
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* System Details */}
                    {!isLoading && memoryInfo && (
                        <Card className="">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Brain className="w-6 h-6" />
                                    Remem Agent Configuration
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
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

                    {/* LLM Configuration Section */}
                    {apiStatus === 'ready' && (
                        <LLMConfigurationPanel />
                    )}

                    {/* Clear All Memories Section */}
                    {apiStatus === 'ready' && (
                        <Card className="">
                            <CardHeader>
                                <CardTitle className="text-xl text-red-600">Danger Zone</CardTitle>
                            </CardHeader>
                            <CardContent className="w-full space-y-4 flex items-center justify-center">
                                <p className="text-gray-600">
                                    Permanently delete all memories from your memory bank and clear your local chat history. <br />This action cannot be undone.
                                </p>
                                <div className="grow"></div>
                                <ClearAllMemoriesDialog
                                    onConfirm={handleClearAllMemories}
                                    isLoading={isClearingMemories}
                                    memoryCount={memoryInfo?.memory_count || 0}
                                />
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
