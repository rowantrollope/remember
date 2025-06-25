"use client"

import { useState } from "react"

// Components
import { PageLayout } from "@/components/PageLayout"
import { PageInputForm } from "@/components/PageInputForm"
import { RecallTab } from "@/components/tabs/RecallTab"
// Hooks
import { useMemoryAPI } from "@/hooks"
import { useSettings } from "@/hooks/useSettings"

export default function SearchPage() {
    const [input, setInput] = useState("")

    const {
        searchResults,
        excludedMemories,
        filteringInfo,
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

        const success = await searchMemories(input, settings.questionTopK, settings.minSimilarity)
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
            <div className="relative h-full flex flex-col">
                <div className="absolute w-full bg-white/75 backdrop-blur-sm -top-0 flex-shrink-0 flex justify-between items-center">
                    <div className="grow"></div>
                    <div className="font-mono text-muted-foreground">
                        (POST) /api/memory/search
                    </div>
                </div>

                {hasSearchResults ? (
                    // Layout when there are search results - input at bottom
                    <>
                        <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-white">
                            <RecallTab
                                searchResults={searchResults}
                                excludedMemories={excludedMemories}
                                filteringInfo={filteringInfo || undefined}
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
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Memories</h1>
                                <p className="text-gray-600">
                                        Vector search for relevant nemes and return in JSON
                                    </p>
                                </div>

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
