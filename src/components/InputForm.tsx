import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, Save, Search } from "lucide-react"
import { GroundingToggle } from "@/components/GroundingToggle"
import type { TabType } from "@/types"

interface InputFormProps {
    input: string
    setInput: (value: string) => void
    activeTab: TabType
    isLoading: boolean
    onSubmit: (e: React.FormEvent) => void
    chatMode?: 'ask' | 'save'
    onChatModeChange?: (mode: 'ask' | 'save') => void
    groundingEnabled?: boolean
    onGroundingToggle?: (enabled: boolean) => void
}

export function InputForm({ input, setInput, activeTab, isLoading, onSubmit, chatMode, onChatModeChange, groundingEnabled, onGroundingToggle }: InputFormProps) {
    const getPlaceholder = () => {
        switch (activeTab) {
            case "chat":
                return chatMode === 'save'
                    ? "Remember that I..."
                    : "Remember anything..."
            case "recall":
                return "Search memories..."
            case "context":
                return "Update context..."
            default:
                return "Type something..."
        }
    }

    const getIcon = () => {
        switch (activeTab) {
            case "chat":
                return chatMode === 'save'
                    ? <Save className="w-4 h-4" />
                    : <MessageCircle className="w-4 h-4" />
            case "recall":
                return <Search className="w-4 h-4" />
            default:
                return <MessageCircle className="w-4 h-4" />
        }
    }

    return (
        <div className="space-y-3 border p-4 rounded-xl shadow-md">
            {/* Mode Selector for Chat Tab */}
            {activeTab === 'chat' && onChatModeChange && (
                <div className="space-y-3 p-3">
                    <div className="flex items-center gap-2 w-full">
                        <div className="text-sm font-medium text-gray-700">Mode:</div>
                        <div className="flex gap-2">
                            <Button
                                variant={chatMode === 'ask' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => onChatModeChange('ask')}
                                className="flex items-center gap-2"
                                type="button"
                            >
                                <MessageCircle className="w-4 h-4" />
                                Ask your memory
                            </Button>
                            <Button
                                variant={chatMode === 'save' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => onChatModeChange('save')}
                                className="flex items-center gap-2"
                                type="button"
                            >
                                <Save className="w-4 h-4" />
                                Add new memory
                            </Button>
                        </div>
                        <div className="grow"></div>
                        {chatMode === 'save' && groundingEnabled !== undefined && onGroundingToggle && (
                            <GroundingToggle
                                enabled={groundingEnabled}
                                onChange={onGroundingToggle}
                            />
                        )}
                    </div>

                    {/* Grounding Toggle for Save Mode */}
                    
                </div>
            )}

            {/* Input Form */}
            <form onSubmit={onSubmit} className="flex gap-2">
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={getPlaceholder()}
                    className="flex-1"
                    disabled={isLoading}
                />
                <Button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                    {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        getIcon()
                    )}
                </Button>
            </form>
        </div>
    )
}
