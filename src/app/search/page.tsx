"use client"

import { useState } from "react"

// Components
import { PageLayout } from "@/components/PageLayout"
import { PageInputForm } from "@/components/PageInputForm"
import { RecallTab } from "@/components/tabs/RecallTab"
import { RotatingPrompts } from "@/components/RotatingPrompts"

// Hooks
import { useMemoryAPI } from "@/hooks"
import { useSettings } from "@/hooks/useSettings"

// Search-focused prompts for empty state - moved outside component to prevent re-creation
const searchPrompts = [
    "What memories are you looking for?",
    "Search for a specific moment or feeling",
    "Find memories from a particular time or place",
    "Discover forgotten moments from your past",
    "Look for memories about a person or event",
    "Search by mood, location, or activity"
]

export default function SearchPage() {
    const [input, setInput] = useState("")

    const {
        searchResults,
        isLoading,
        error,
        apiStatus,
        searchMemories,
        deleteMemory,
        clearError,
    } = useMemoryAPI()

    // Get settings for search top_k
    const { settings } = useSettings()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        const success = await searchMemories(input, settings.questionTopK)
        if (success) {
            setInput("")
        }
    }

    // Check if there are any search results
    const hasSearchResults = searchResults.length > 0

    return (
        <PageLayout
            error={error}
            apiStatus={apiStatus}
            onClearError={clearError}
        >
            {/* Search Content */}
            <div className="h-full flex flex-col">
                {hasSearchResults ? (
                    // Layout when there are search results - input at bottom
                    <>
                        <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-white">
                            <RecallTab
                                searchResults={searchResults}
                                onMemoryDeleted={deleteMemory}
                            />
                        </div>

                        {/* Input Form at bottom */}
                        <div className="flex-shrink-0 mt-4 p-4 rounded">
                            <PageInputForm
                                input={input}
                                setInput={setInput}
                                pageType="search"
                                isLoading={isLoading}
                                onSubmit={handleSubmit}
                            />
                        </div>
                    </>
                ) : (
                    // Layout when no search results - input centered vertically with prompt
                    <div className="flex-1 flex items-center justify-center -mt-40 bg-white">
                            <div className="w-full">
                                <div className="text-center mb-8">
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">/api/memory/search</h1>
                                    <p className="text-gray-600">
                                        Vector search for relevant memories and return in JSON
                                    </p>
                                </div>

                            <RotatingPrompts prompts={searchPrompts} />
                            <PageInputForm
                                input={input}
                                setInput={setInput}
                                pageType="search"
                                isLoading={isLoading}
                                onSubmit={handleSubmit}
                            />
                        </div>
                    </div>
                )}
            </div>
        </PageLayout>
    )
}
