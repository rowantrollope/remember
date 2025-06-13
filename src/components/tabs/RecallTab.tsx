import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Clock, MapPin, Trash2, Loader2, Anchor } from "lucide-react"
import type { Memory } from "@/types"
import { formatTimestamp } from "@/utils/formatters"
import { GroundingInfo } from "@/components/GroundingInfo"

interface RecallTabProps {
    searchResults: Memory[]
    onMemoryDeleted: (memoryId: string) => Promise<boolean>
}

export function RecallTab({ searchResults, onMemoryDeleted }: RecallTabProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleDelete = async (memoryId: string) => {
        if (!confirm('Are you sure you want to delete this memory?')) {
            return
        }

        setDeletingId(memoryId)
        try {
            const success = await onMemoryDeleted(memoryId)
            if (!success) {
                console.error('Failed to delete memory')
            }
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <ScrollArea className="overflow-hidden h-fit">
            <div className="space-y-3 p-2 overflow-hidden">
                {searchResults.length > 0 ? (
                    searchResults.map((memory) => (
                        <Card key={memory.id} className="border border-gray-200 hover:shadow-md transition-shadow group relative">
                            <CardContent className="p-4">
                                {/* Delete button - appears on hover */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDelete(memory.id)}
                                    disabled={deletingId === memory.id}
                                >
                                    {deletingId === memory.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                </Button>

                                <p className="text-gray-800 mb-2 pr-10">{memory.content}</p>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3 h-3" />
                                        {formatTimestamp(memory.timestamp)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {memory.metadata?.score && (
                                            <div className="flex items-center gap-1">
                                                <span className="text-blue-600">
                                                    {(memory.metadata.score * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                        )}
                                        {memory.metadata?.location && (
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {memory.metadata.location}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {memory.metadata?.tags && (
                                    <div className="flex gap-1 mt-2">
                                        {memory.metadata.tags.map((tag) => (
                                            <Badge key={tag} variant="secondary" className="text-xs">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {/* Grounding Information */}
                                <div className="flex gap-2 mt-3">
                                    {memory.grounding_applied && (
                                        <Badge className="text-xs bg-blue-100 text-blue-800">
                                            <Anchor className="w-3 h-3 mr-1" />
                                            Grounded
                                        </Badge>
                                    )}
                                    {memory.grounding_applied && memory.grounding_info && (
                                        <GroundingInfo memory={memory} />
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="flex-1 flex items-center justify-center h-full">
                        <div className="text-center text-gray-500">
                            <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Enter a search query to find memories</p>
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>
    )
}
