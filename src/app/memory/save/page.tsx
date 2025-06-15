"use client"

import { useState } from "react"

// Components
import { PageLayout } from "@/components/PageLayout"
import { PageInputForm } from "@/components/PageInputForm"
import { RotatingPrompts } from "@/components/RotatingPrompts"

// Hooks
import { useMemoryAPI } from "@/hooks"
import { usePersistentChat } from "@/hooks/usePersistentChat"

// Types
import type { MemorySaveResponse } from "@/hooks/usePersistentChat"

const savePrompts = [
    "I had lunch at a great Italian restaurant",
    "Finished reading an amazing book about AI",
    "Met an interesting person at the conference",
    "Learned a new programming technique today",
    "Discovered a beautiful hiking trail"
]

export default function MemorySavePage() {
    const [input, setInput] = useState("")

    // Use persistent chat hook for memory save responses
    const {
        memorySaveResponses,
        addMemorySaveResponse,
    } = usePersistentChat()

    const {
        isLoading,
        error,
        apiStatus,
        groundingEnabled,
        saveMemory,
        setGroundingEnabled,
        clearError,
    } = useMemoryAPI()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        const result = await saveMemory(input)
        if (result.success && result.response) {
            const saveResponse: MemorySaveResponse = {
                success: true,
                response: result.response,
                originalText: input,
                timestamp: new Date().toISOString()
            }
            // Add to persistent storage
            addMemorySaveResponse(saveResponse)
            setInput("")
        }
    }

    // Check if there are any memory save responses
    const hasMessages = memorySaveResponses.length > 0

    return (
        <PageLayout
            error={error}
            apiStatus={apiStatus}
            onClearError={clearError}
        >
            {/* Memory Save Content */}
            <div className="h-full flex flex-col">
                {hasMessages ? (
                    // Layout when there are messages - input at bottom
                    <>
                        <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-white">
                            <div className="space-y-4">
                                {memorySaveResponses.map((saveResponse, index) => (
                                    <div key={index} className="space-y-3">
                                        {/* User Memory Input */}
                                        <div className="flex justify-end">
                                            <div className="max-w-[80%] bg-blue-500 text-white rounded-lg px-4 py-2">
                                                <div className="text-sm text-blue-100 mb-1">Add memory:</div>
                                                <div className="whitespace-pre-wrap">{saveResponse.originalText}</div>
                                                <div className="text-xs text-blue-100 mt-1">
                                                    {new Date(saveResponse.timestamp).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </div>

                                        {/* System Confirmation */}
                                        <div className="flex justify-start">
                                            <div className="max-w-[80%] bg-green-100 text-green-900 rounded-lg px-4 py-2">
                                                <div className="font-medium mb-2">✓ Memory saved successfully!</div>
                                                
                                                {saveResponse.response && (
                                                    <div className="space-y-2 text-sm">
                                                        <div>
                                                            <span className="font-medium">Memory ID:</span> {saveResponse.response.memory_id}
                                                        </div>
                                                        
                                                        {saveResponse.response.grounding_applied && (
                                                            <div>
                                                                <span className="font-medium">Grounding applied:</span> Yes
                                                            </div>
                                                        )}

                                                        {saveResponse.response.grounded_text && saveResponse.response.grounded_text !== saveResponse.originalText && (
                                                            <div>
                                                                <span className="font-medium">Enhanced text:</span>
                                                                <div className="bg-white rounded p-2 mt-1 text-gray-700">
                                                                    {saveResponse.response.grounded_text}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {saveResponse.response.grounding_info?.changes_made && saveResponse.response.grounding_info.changes_made.length > 0 && (
                                                            <details className="mt-2">
                                                                <summary className="cursor-pointer text-green-700 hover:text-green-800">
                                                                    View grounding changes ({saveResponse.response.grounding_info.changes_made.length})
                                                                </summary>
                                                                <div className="mt-2 space-y-1">
                                                                    {saveResponse.response.grounding_info.changes_made.map((change, changeIndex) => (
                                                                        <div key={changeIndex} className="bg-white rounded p-2 text-xs">
                                                                            <div className="text-red-600">- {change.original}</div>
                                                                            <div className="text-green-600">+ {change.replacement}</div>
                                                                            <div className="text-gray-500">({change.type})</div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </details>
                                                        )}

                                                        {saveResponse.response.context_snapshot && (
                                                            <details className="mt-2">
                                                                <summary className="cursor-pointer text-green-700 hover:text-green-800">
                                                                    View context snapshot
                                                                </summary>
                                                                <div className="mt-2 bg-white rounded p-2 text-xs">
                                                                    <pre className="whitespace-pre-wrap text-gray-700">
                                                                        {JSON.stringify(saveResponse.response.context_snapshot, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            </details>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="text-xs text-green-600 mt-2">
                                                    {new Date(saveResponse.timestamp).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Input Form at bottom */}
                        <div className="flex-shrink-0 rounded">
                            <PageInputForm
                                input={input}
                                setInput={setInput}
                                pageType="save"
                                isLoading={isLoading}
                                onSubmit={handleSubmit}
                                groundingEnabled={groundingEnabled}
                                onGroundingToggle={setGroundingEnabled}
                                placeholder="What would you like to remember?"
                            />
                        </div>
                    </>
                ) : (
                    // Layout when no messages - input centered vertically with prompt
                    <div className="flex-1 flex items-center justify-center -mt-40 bg-white">
                        <div className="w-full">
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">Save Memory</h1>
                                <p className="text-gray-600">
                                    Store important moments and information with contextual grounding
                                </p>
                            </div>
                            <RotatingPrompts prompts={savePrompts} />
                            <PageInputForm
                                input={input}
                                setInput={setInput}
                                pageType="save"
                                isLoading={isLoading}
                                onSubmit={handleSubmit}
                                groundingEnabled={groundingEnabled}
                                onGroundingToggle={setGroundingEnabled}
                                placeholder="What would you like to remember?"
                            />
                        </div>
                    </div>
                )}
            </div>
        </PageLayout>
    )
}
