"use client"

// Components
import { PageLayout } from "@/components/PageLayout"
import { ContextTab } from "@/components/tabs/ContextTab"

// Hooks
import { useMemoryAPI } from "@/hooks"

export default function ContextPage() {
    const {
        isLoading,
        error,
        apiStatus,
        currentContext,
        getContext,
        updateContext,
        clearError,
    } = useMemoryAPI()

    return (
        <PageLayout 
            error={error} 
            apiStatus={apiStatus} 
            onClearError={clearError}
        >
            {/* Context Content */}
            <div className="h-full overflow-y-auto p-4 bg-white">
                <ContextTab
                    currentContext={currentContext}
                    onUpdateContext={updateContext}
                    onGetContext={getContext}
                    isLoading={isLoading}
                />
            </div>
        </PageLayout>
    )
}
