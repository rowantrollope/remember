import { ScrollArea } from "@/components/ui/scroll-area"
import { ConfidencePill } from "@/components/ConfidencePill"
import { SupportingMemoriesDialog } from "@/components/SupportingMemoriesDialog"
import { MessageCircle } from "lucide-react"
import type { Conversation } from "@/types"
import { formatTimestamp } from "@/utils/formatters"

interface AskTabProps {
    conversations: Conversation[]
}

export function AskTab({ conversations }: AskTabProps) {
    return (
        <div className="flex flex-col h-full overflow-hidden">
            <ScrollArea className="flex-1 overflow-hidden">
                <div className="space-y-4 p-2 h-full">
                    {conversations.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center h-full">
                            <div className="text-center text-gray-500">
                                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>Start a conversation by asking a question about your memories</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {conversations.map((conv) => (
                                <div key={conv.id} className="space-y-3">
                                    <div className="flex justify-end">
                                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-2xl rounded-br-sm max-w-xs">
                                            <p className="text-sm">{conv.question}</p>
                                            <p className="text-xs text-purple-200 mt-1">{formatTimestamp(conv.timestamp)}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-start">
                                        <div className="bg-gray-100 p-3 rounded-2xl rounded-bl-sm max-w-md">
                                            <p className="text-sm text-gray-800 mb-3">{conv.answer}</p>

                                            {/* Confidence and reasoning */}
                                            <div className="space-y-2">
                                                {conv.confidence && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-500">Confidence:</span>
                                                        <ConfidencePill confidence={conv.confidence} />
                                                    </div>
                                                )}

                                                {conv.reasoning && (
                                                    <div className="text-xs text-gray-600 italic leading-relaxed">
                                                        <span className="font-medium">Reasoning:</span> {conv.reasoning}
                                                    </div>
                                                )}

                                                {conv.supporting_memories && conv.supporting_memories.length > 0 && (
                                                    <div className="pt-1">
                                                        <SupportingMemoriesDialog
                                                            memories={conv.supporting_memories}
                                                            excludedMemories={conv.excluded_memories}
                                                            filteringInfo={conv.filtering_info}
                                                            className="text-xs"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}
