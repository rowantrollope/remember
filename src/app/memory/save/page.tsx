"use client"

import { useState, useRef, useEffect } from "react"

// Components
import { PageLayout } from "@/components/PageLayout"
import { PageInputForm } from "@/components/PageInputForm"
import { RotatingPrompts } from "@/components/RotatingPrompts"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

// Icons
import { Trash2, AlertTriangle } from "lucide-react"

// Hooks
import { useMemoryAPI } from "@/hooks"
import { usePersistentChat } from "@/hooks/usePersistentChat"

// Types
import type { MemorySaveResponse } from "@/hooks/usePersistentChat"

const savePrompts = [
    "Example: I had lunch at a great Italian restaurant",
    "Example: Finished reading an amazing book about AI",
    "Example: Met an interesting person at the conference",
    "Example: Learned a new programming technique today",
    "Example: Discovered a beautiful hiking trail"
]

// Clear History Dialog Component
function ClearHistoryDialog({ onConfirm, messageCount }: { onConfirm: () => void, messageCount: number }) {
    const [isOpen, setIsOpen] = useState(false)

    const handleConfirm = () => {
        onConfirm()
        setIsOpen(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                >
                    <Trash2 className="w-4 h-4" />
                    Clear History
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                        Clear Chat History
                    </DialogTitle>
                    <DialogDescription className="text-left">
                        This action will permanently delete all {messageCount} saved memory conversations from your local chat history.
                        <br />
                        <br />
                        <strong className="text-red-600">This action cannot be undone.</strong>
                        <br />
                        <br />
                        Are you sure you want to continue?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        className="w-full sm:w-auto"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        className="w-full sm:w-auto"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Yes, Clear History
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function MemorySavePage() {
    const [input, setInput] = useState("")
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Use persistent chat hook for memory save responses
    const {
        memorySaveResponses,
        addMemorySaveResponse,
        clearChatHistory,
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

    // Auto-scroll to bottom when new messages are added
    useEffect(() => {
        if (messagesEndRef.current && scrollContainerRef.current) {
            // Scroll the container to the bottom smoothly
            scrollContainerRef.current.scrollTo({
                top: scrollContainerRef.current.scrollHeight,
                behavior: 'smooth'
            })
        }
    }, [memorySaveResponses])

    const scrollContainerRef = useRef<HTMLDivElement>(null)

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

    const handleClearHistory = () => {
        clearChatHistory()
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
            <div className="relative h-full flex flex-col">
                {hasMessages ? (
                    // Layout when there are messages - input at bottom
                    <>
                        {/* Header with Clear History button */}
                        <div className="absolute w-full bg-white/75 backdrop-blur-sm -top-0 flex-shrink-0 flex justify-between items-center">
                            <ClearHistoryDialog
                                onConfirm={handleClearHistory}
                                messageCount={memorySaveResponses.length}
                            />
                            <div className="grow"></div>
                            <div className="font-mono text-muted-foreground">
                                (POST) /api/memory
                            </div>
                        </div>

                        <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto p-4 bg-white">
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
                                                        {/* Basic Info */}
                                                        <div>
                                                            <span className="font-medium">Memory ID:</span> {saveResponse.response.memory_id}
                                                        </div>

                                                        <div>
                                                            <span className="font-medium">Success:</span> {saveResponse.response.success ? 'Yes' : 'No'}
                                                        </div>

                                                        {saveResponse.response.message && (
                                                            <div>
                                                                <span className="font-medium">Message:</span> {saveResponse.response.message}
                                                            </div>
                                                        )}

                                                        <div>
                                                            <span className="font-medium">Grounding applied:</span> {saveResponse.response.grounding_applied ? 'Yes' : 'No'}
                                                        </div>

                                                        {/* Original vs Grounded Text */}
                                                        {saveResponse.response.original_text && (
                                                            <div>
                                                                <span className="font-medium">Original text:</span>
                                                                <div className="bg-white rounded p-2 mt-1 text-gray-700">
                                                                    {saveResponse.response.original_text}
                                                                </div>
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

                                                        {/* Grounding Information */}
                                                        {saveResponse.response.grounding_info && (
                                                            <details className="mt-2">
                                                                <summary className="cursor-pointer text-green-700 hover:text-green-800 font-medium">
                                                                    View grounding details
                                                                </summary>
                                                                <div className="mt-2 space-y-2">
                                                                    {/* Dependencies Found */}
                                                                    {saveResponse.response.grounding_info.dependencies_found && (
                                                                        <div>
                                                                            <div className="font-medium text-xs text-gray-600 mb-1">Dependencies Found:</div>
                                                                            <div className="bg-white rounded p-2 text-xs">
                                                                                <pre className="whitespace-pre-wrap text-gray-700">
                                                                                    {JSON.stringify(saveResponse.response.grounding_info.dependencies_found, null, 2)}
                                                                                </pre>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Changes Made */}
                                                                    {saveResponse.response.grounding_info.changes_made && saveResponse.response.grounding_info.changes_made.length > 0 && (
                                                                        <div>
                                                                            <div className="font-medium text-xs text-gray-600 mb-1">Changes Made ({saveResponse.response.grounding_info.changes_made.length}):</div>
                                                                            <div className="space-y-1">
                                                                                {saveResponse.response.grounding_info.changes_made.map((change, changeIndex) => (
                                                                                    <div key={changeIndex} className="bg-white rounded p-2 text-xs">
                                                                                        <div className="text-red-600">- {change.original}</div>
                                                                                        <div className="text-green-600">+ {change.replacement}</div>
                                                                                        <div className="text-gray-500">({change.type})</div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Unresolved References */}
                                                                    {saveResponse.response.grounding_info.unresolved_references && saveResponse.response.grounding_info.unresolved_references.length > 0 && (
                                                                        <div>
                                                                            <div className="font-medium text-xs text-gray-600 mb-1">Unresolved References:</div>
                                                                            <div className="bg-white rounded p-2 text-xs">
                                                                                <ul className="list-disc list-inside text-gray-700">
                                                                                    {saveResponse.response.grounding_info.unresolved_references.map((ref, refIndex) => (
                                                                                        <li key={refIndex}>{ref}</li>
                                                                                    ))}
                                                                                </ul>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </details>
                                                        )}

                                                        {/* Context Snapshot */}
                                                        {saveResponse.response.context_snapshot && (
                                                            <details className="mt-2">
                                                                <summary className="cursor-pointer text-green-700 hover:text-green-800 font-medium">
                                                                    View context snapshot
                                                                </summary>
                                                                <div className="mt-2 bg-white rounded p-2 text-xs">
                                                                    <pre className="whitespace-pre-wrap text-gray-700">
                                                                        {JSON.stringify(saveResponse.response.context_snapshot, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            </details>
                                                        )}

                                                        {/* Raw API Response */}
                                                        <details className="mt-2">
                                                            <summary className="cursor-pointer text-green-700 hover:text-green-800 font-medium">
                                                                View raw API response
                                                            </summary>
                                                            <div className="mt-2 bg-white rounded p-2 text-xs">
                                                                <pre className="whitespace-pre-wrap text-gray-700 max-h-40 overflow-y-auto">
                                                                    {JSON.stringify(saveResponse.response, null, 2)}
                                                                </pre>
                                                            </div>
                                                        </details>

                                                        {/* Request Details */}
                                                        <details className="mt-2">
                                                            <summary className="cursor-pointer text-green-700 hover:text-green-800 font-medium">
                                                                View request details
                                                            </summary>
                                                            <div className="mt-2 bg-white rounded p-2 text-xs">
                                                                <div className="space-y-1">
                                                                    <div><span className="font-medium">Original Input:</span> {saveResponse.originalText}</div>
                                                                    <div><span className="font-medium">Timestamp:</span> {saveResponse.timestamp}</div>
                                                                    <div><span className="font-medium">Grounding Enabled:</span> {groundingEnabled ? 'Yes' : 'No'}</div>
                                                                </div>
                                                            </div>
                                                        </details>
                                                    </div>
                                                )}

                                                <div className="text-xs text-green-600 mt-2">
                                                    {new Date(saveResponse.timestamp).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {/* Scroll target */}
                                <div ref={messagesEndRef} />
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
                                placeholder="Enter a memory to save..."
                            />
                        </div>
                    </>
                ) : (
                    // Layout when no messages - input centered vertically with prompt
                    <div className="flex-1 flex items-center justify-center -mt-40 bg-white">
                        <div className="absolute top-0 right-0 font-mono text-muted-foreground">
                            (POST) /api/memory
                        </div>
                        <div className="w-full">
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                    Save a new Memory (Neme):
                                </h1>
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
                                placeholder="Enter a memory to save..."
                            />
                        </div>
                    </div>
                )}
            </div>
        </PageLayout>
    )
}
