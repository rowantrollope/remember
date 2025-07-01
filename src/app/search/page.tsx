"use client"

import { useState, useEffect } from "react"

// Components
import { PageLayout } from "@/components/PageLayout"
import { PageInputForm } from "@/components/PageInputForm"
import { RecallTab } from "@/components/tabs/RecallTab"
import { ApiPageHeader } from "@/components/ApiPageHeader"
// Hooks
import { useMemoryAPI } from "@/hooks"
import { useSettings } from "@/hooks/useSettings"
import { usePersistentChat } from "@/hooks/usePersistentChat"
import type { SearchResponse } from "@/hooks/usePersistentChat"

export default function SearchPage() {
    const [input, setInput] = useState("")
    const [currentSearchQuery, setCurrentSearchQuery] = useState<string | null>(null)
    const [lastSearchQuery, setLastSearchQuery] = useState<string | null>(null)

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

    // Use persistent chat hook for search responses (for persistence)
    const {
        searchResponses: persistentSearchResponses,
        addSearchResponse,
        updateSearchResponses,
    } = usePersistentChat()

    // Restore search state from persistent storage on component mount
    useEffect(() => {
        if (persistentSearchResponses.length > 0) {
            // Get the most recent search response
            const lastSearch = persistentSearchResponses[persistentSearchResponses.length - 1]
            setCurrentSearchQuery(lastSearch.query)
            setLastSearchQuery(lastSearch.query)
            // Note: searchResults are managed by useMemoryAPI hook and will be set when we trigger the search
        }
    }, [persistentSearchResponses])

    // Save search results when they are updated (after a successful search)
    useEffect(() => {
        if (searchResults.length > 0 && currentSearchQuery && currentSearchQuery !== lastSearchQuery) {
            const searchResponse: SearchResponse = {
                success: true,
                query: currentSearchQuery,
                results: searchResults,
                excludedMemories: excludedMemories,
                filteringInfo: filteringInfo || undefined,
                timestamp: new Date().toISOString()
            }
            addSearchResponse(searchResponse)
            setLastSearchQuery(currentSearchQuery)
        }
    }, [searchResults, excludedMemories, filteringInfo, currentSearchQuery, lastSearchQuery, addSearchResponse])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        // Set the current search query immediately to show "thinking" state
        setCurrentSearchQuery(input)
        const currentInput = input
        setInput("")

        try {
            const success = await searchMemories(currentInput, settings.questionTopK, settings.minSimilarity)
            if (success) {
                // Keep the search query to show results
                // setCurrentSearchQuery will remain set to show the query that was searched
                // Search results will be saved by the useEffect hook when they are updated
            } else {
                // Clear the search query on error
                setCurrentSearchQuery(null)
            }
        } catch {
            // Clear the search query on error
            setCurrentSearchQuery(null)
        }
    }

    const clearSearch = () => {
        setCurrentSearchQuery(null)
        setLastSearchQuery(null)
        // Also clear persistent search responses
        updateSearchResponses([])
        // Note: searchResults are managed by useMemoryAPI hook,
        // they will be cleared when a new search is performed
    }

    // Check if there are any search results or if we're currently searching
    const hasSearchResults = searchResults.length > 0
    const isSearching = currentSearchQuery !== null

    return (
        <PageLayout
            error={error}
            apiStatus={apiStatus}
            onClearError={clearError}
        >
            {/* Search Content */}
            <div className="h-full flex flex-col">
                <ApiPageHeader
                    endpoint="(POST) /api/memory/search"
                    hasMessages={isSearching}
                    onClearChat={clearSearch}
                    isLoading={isLoading}
                />
                {isSearching ? (
                    // Layout when searching or have search results - input at bottom
                    <>
                        <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-white">
                            {/* Show current search query */}
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                                <div className="text-sm text-blue-700 font-medium">
                                    Searching for: &ldquo;{currentSearchQuery}&rdquo;
                                </div>
                                {isLoading && (
                                    <div className="text-sm text-blue-600 mt-1">
                                        thinking...
                                    </div>
                                )}
                            </div>

                            {/* Show search results if available */}
                            {hasSearchResults && (
                                <RecallTab
                                    searchResults={searchResults}
                                    excludedMemories={excludedMemories}
                                    filteringInfo={filteringInfo || undefined}
                                    onMemoryDeleted={deleteMemory}
                                />
                            )}
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
