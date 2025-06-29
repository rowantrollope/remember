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

interface ClearHistoryDialogProps {
    onConfirm: () => void
    messageCount: number
}

function ClearHistoryDialog({ onConfirm, messageCount }: ClearHistoryDialogProps) {
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
                <DialogFooter className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                    >
                        Clear History
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function SavePage() {
    const [input, setInput] = useState("")
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Use persistent chat hook for memory save responses
    const {
        memorySaveResponses,
        addMemorySaveResponse,
        updateMemorySaveResponses,
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

        // Create a temporary memory save response with "thinking" state
        const tempSaveResponse: MemorySaveResponse = {
            success: true,
            response: {
                success: true,
                memory_id: `temp-${Date.now()}`,
                message: "thinking...",
            },
            originalText: input,
            timestamp: new Date().toISOString()
        }

        // Add the temporary response immediately
        addMemorySaveResponse(tempSaveResponse)
        const currentInput = input
        setInput("")

        try {
            const result = await saveMemory(currentInput)
            if (result.success && result.response) {
                const realSaveResponse: MemorySaveResponse = {
                    success: true,
                    response: result.response,
                    originalText: currentInput,
                    timestamp: new Date().toISOString()
                }

                // Replace the temporary response with the real one
                const updatedResponses = memorySaveResponses.map(resp =>
                    resp.response?.memory_id === tempSaveResponse.response?.memory_id ? realSaveResponse : resp
                )
                updateMemorySaveResponses(updatedResponses)
            } else {
                // Remove the temporary response on error
                const filteredResponses = memorySaveResponses.filter(resp =>
                    resp.response?.memory_id !== tempSaveResponse.response?.memory_id
                )
                updateMemorySaveResponses(filteredResponses)
            }
        } catch {
            // Remove the temporary response on error
            const filteredResponses = memorySaveResponses.filter(resp =>
                resp.response?.memory_id !== tempSaveResponse.response?.memory_id
            )
            updateMemorySaveResponses(filteredResponses)
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
                            <div className="space-y-6">
                                {memorySaveResponses.map((saveResponse, index) => (
                                    <div key={index} className="space-y-3">
                                        {/* User Input */}
                                        <div className="flex justify-end">
                                            <div className="max-w-[80%] bg-blue-500 text-white rounded-lg px-4 py-2">
                                                <div className="text-sm font-medium mb-1">Add memory:</div>
                                                <div>{saveResponse.originalText}</div>
                                            </div>
                                        </div>

                                        {/* System Response */}
                                        <div className="flex justify-start">
                                            <div className="max-w-[80%] bg-green-100 text-green-800 rounded-lg px-4 py-2">
                                                <div className="text-sm font-medium mb-2">✓ Memory saved successfully</div>
                                                {saveResponse.response && (
                                                    <div className="space-y-2 text-sm">
                                                        <div>
                                                            <strong>Memory ID:</strong> {saveResponse.response.memory_id}
                                                        </div>
                                                        {saveResponse.response.grounding_applied && (
                                                            <div>
                                                                <strong>Contextual grounding applied</strong>
                                                            </div>
                                                        )}
                                                        {saveResponse.response.grounded_text && saveResponse.response.grounded_text !== saveResponse.originalText && (
                                                            <div>
                                                                <strong>Enhanced text:</strong> {saveResponse.response.grounded_text}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
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
                                    Save a new Memory:
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
