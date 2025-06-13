"use client"

import { useState } from "react"
import { Card, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


// Components
import {
    Navbar,
    ErrorAlert,
    StatusAlert,
    RecallTab,
    InputForm
} from "@/components"
import { ContextTab } from "@/components/tabs/ContextTab"
import { MemoryChatTab } from "@/components/tabs/MemoryChatTab"

// Hooks and types
import { useMemoryAPI } from "@/hooks"
import { usePersistentChat } from "@/hooks/usePersistentChat"
import type { TabType } from "@/types"


export default function Home() {
    const [input, setInput] = useState("")
    const [activeTab, setActiveTab] = useState<TabType>("chat")
    const [chatMode, setChatMode] = useState<'ask' | 'save'>('ask')

    // Use persistent chat hook for conversations and memory saves
    const {
        conversations: persistentConversations,
        memorySaveResponses,
        isLoaded: chatLoaded,
        addConversation,
        addMemorySaveResponse,
        clearChatHistory,
        getTotalMessageCount
    } = usePersistentChat()

    const {
        conversations: apiConversations,
        searchResults,
        isLoading,
        error,
        apiStatus,
        currentContext,
        groundingEnabled,
        saveMemory,
        askQuestion,
        searchMemories,
        deleteMemory,
        getContext,
        updateContext,
        setGroundingEnabled,
        clearError,
    } = useMemoryAPI()

    // Sync API conversations with persistent storage
    const conversations = persistentConversations.length > 0 ? persistentConversations : apiConversations

    const handleTabChange = (value: string) => {
        setActiveTab(value as TabType)
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        let success = false
        switch (activeTab) {
            case "chat":
                if (chatMode === 'save') {
                    const result = await saveMemory(input)
                    success = result.success
                    if (result.success && result.response) {
                        const saveResponse = {
                            success: true,
                            response: result.response,
                            originalText: input,
                            timestamp: new Date().toISOString()
                        }
                        // Add to persistent storage
                        addMemorySaveResponse(saveResponse)
                    }
                } else {
                    const result = await askQuestion(input)
                    if (typeof result === 'object' && result.success) {
                        success = true
                        // Add the new conversation to persistent storage
                        addConversation(result.conversation)
                    } else {
                        success = result as boolean
                    }
                }
                break
            case "recall":
                success = await searchMemories(input)
                break
        }

        if (success) {
            setInput("")
        }
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            <Navbar />

            {/* Main content area - EXACT copy from test page */}
            <div className="flex-1 p-6 min-h-0">
                <Card className="h-full flex flex-col max-w-4xl mx-auto p-2">

                    {/* Error Display */}
                    {error && (
                        <ErrorAlert error={error} onDismiss={clearError} />
                    )}

                    {/* API Status Warning */}
                    <StatusAlert apiStatus={apiStatus} />

                    {/* Debug Info for Persistent Storage */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                            <div className="flex items-center justify-between">
                                <span>
                                    Chat History: {persistentConversations.length} conversations, {memorySaveResponses.length} memory saves
                                    {chatLoaded ? ' (loaded)' : ' (loading...)'}
                                </span>
                                <button
                                    onClick={clearChatHistory}
                                    className="text-blue-600 hover:text-blue-800 underline"
                                >
                                    Clear History
                                </button>
                            </div>
                        </div>
                    )}
                    {/* Tabs Container - EXACT copy from test page */}
                    <div className="flex-1 min-h-0">
                        <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
                            {/* Tab List */}
                            <TabsList className="flex-shrink-0 w-full flex">
                                <TabsTrigger value="chat">Memory Chat</TabsTrigger>
                                <TabsTrigger value="recall">Search/Browse</TabsTrigger>
                                <TabsTrigger value="context">Context</TabsTrigger>
                            </TabsList>

                            {/* Tab Content Area - EXACT copy from test page */}
                            <div className="flex-1 min-h-0 mt-4">
                                <TabsContent value="chat" className="h-full m-0">
                                    <div className="h-full overflow-y-auto border rounded p-4 bg-white">
                                        <MemoryChatTab
                                            conversations={conversations}
                                            memorySaveResponses={memorySaveResponses}
                                            chatMode={chatMode}
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="recall" className="h-full m-0">
                                    <div className="h-full overflow-y-auto border rounded p-4 bg-white">
                                        <RecallTab
                                            searchResults={searchResults}
                                            onMemoryDeleted={deleteMemory}
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="context" className="h-full m-0">
                                    <div className="h-full overflow-y-auto border rounded p-4 bg-white">
                                        <ContextTab
                                            currentContext={currentContext}
                                            onUpdateContext={updateContext}
                                            onGetContext={getContext}
                                            isLoading={isLoading}
                                        />
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>

                    {/* Footer */}
                    <div className="flex-shrink-0 mt-4 p-4 rounded">
                        <InputForm
                            input={input}
                            setInput={setInput}
                            activeTab={activeTab}
                            isLoading={isLoading}
                            onSubmit={handleSubmit}
                            chatMode={chatMode}
                            onChatModeChange={setChatMode}
                            groundingEnabled={groundingEnabled}
                            onGroundingToggle={setGroundingEnabled}
                        />
                    </div>
                </Card>
            </div>
        </div>
    )
}
