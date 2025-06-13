import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    FileText,
    Anchor,
    MapPin,
    Users,
    Cloud,
    Calendar,
    Clock,
    Eye,
    EyeOff
} from "lucide-react"
import type { Memory } from "@/types"
import { formatTimestamp } from "@/utils/formatters"
import { GroundingInfo } from "@/components/GroundingInfo"

interface SupportingMemoriesDialogProps {
    memories: Memory[]
    className?: string
}

export function SupportingMemoriesDialog({ memories, className }: SupportingMemoriesDialogProps) {
    const [open, setOpen] = useState(false)
    const [expandedMemories, setExpandedMemories] = useState<Set<string>>(new Set())
    const [showOriginalText, setShowOriginalText] = useState<Set<string>>(new Set())

    if (!memories || memories.length === 0) {
        return null
    }

    const toggleMemoryExpansion = (memoryId: string) => {
        const newExpanded = new Set(expandedMemories)
        if (newExpanded.has(memoryId)) {
            newExpanded.delete(memoryId)
        } else {
            newExpanded.add(memoryId)
        }
        setExpandedMemories(newExpanded)
    }

    const toggleTextView = (memoryId: string) => {
        const newShowOriginal = new Set(showOriginalText)
        if (newShowOriginal.has(memoryId)) {
            newShowOriginal.delete(memoryId)
        } else {
            newShowOriginal.add(memoryId)
        }
        setShowOriginalText(newShowOriginal)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={className}
                >
                    <FileText className="w-3 h-3 mr-1" />
                    Relevant memories ({memories.length})
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-600" />
                        Supporting Memories
                        <span className="text-sm text-gray-500 font-normal">({memories.length})</span>
                    </DialogTitle>
                </DialogHeader>
                
                <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-[70vh] pr-4">
                        <div className="space-y-4">
                            {memories.map((memory, index) => {
                                const isExpanded = expandedMemories.has(memory.id)
                                const showOriginal = showOriginalText.has(memory.id)
                                const displayText = memory.original_text && memory.grounded_text
                                    ? (showOriginal ? memory.original_text : memory.grounded_text)
                                    : memory.content

                                return (
                                    <Card key={memory.id} className="border border-gray-200">
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex flex-col">
                                                    <CardTitle className="text-sm font-medium">
                                                        Memory #{index + 1}
                                                    </CardTitle>
                                                    <span className="text-xs text-gray-400 font-mono">
                                                        ID: {memory.id}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {memory.metadata?.score && (
                                                        <Badge variant="outline" className="text-xs">
                                                            Score: {memory.metadata.score.toFixed(3)}
                                                        </Badge>
                                                    )}
                                                    {memory.metadata?.relevance_score && (
                                                        <Badge variant="outline" className="text-xs">
                                                            Relevance: {memory.metadata.relevance_score.toFixed(1)}%
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="space-y-3">
                                            {/* Memory Text with Original/Grounded Toggle */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-sm font-medium text-gray-700">Memory Text</h4>
                                                    {memory.original_text && memory.grounded_text && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => toggleTextView(memory.id)}
                                                            className="text-xs h-6"
                                                        >
                                                            {showOriginal ? (
                                                                <>
                                                                    <EyeOff className="w-3 h-3 mr-1" />
                                                                    Show Grounded
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Eye className="w-3 h-3 mr-1" />
                                                                    Show Original
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                                <div className="p-3 bg-gray-50 rounded-lg">
                                                    <p className="text-sm text-gray-800 leading-relaxed">
                                                        {displayText}
                                                    </p>
                                                    {memory.original_text && memory.grounded_text && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {showOriginal ? "Original text" : "Contextually grounded text"}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Timestamp */}
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Clock className="w-3 h-3" />
                                                <span>{memory.formatted_time || formatTimestamp(memory.timestamp)}</span>
                                            </div>

                                            {/* Tags */}
                                            {memory.metadata?.tags && memory.metadata.tags.length > 0 && (
                                                <div className="space-y-1">
                                                    <h4 className="text-xs font-medium text-gray-700">Tags</h4>
                                                    <div className="flex flex-wrap gap-1">
                                                        {memory.metadata.tags.map((tag, tagIndex) => (
                                                            <Badge key={tagIndex} variant="secondary" className="text-xs">
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Grounding Status */}
                                            <div className="flex items-center gap-2">
                                                {memory.grounding_applied && (
                                                    <Badge className="text-xs bg-blue-100 text-blue-800">
                                                        <Anchor className="w-3 h-3 mr-1" />
                                                        Grounded
                                                    </Badge>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => toggleMemoryExpansion(memory.id)}
                                                    className="text-xs h-6"
                                                >
                                                    {isExpanded ? "Hide Details" : "Show Details"}
                                                </Button>
                                            </div>

                                            {/* Expanded Context Information */}
                                            {isExpanded && (
                                                <div className="space-y-4 pt-3 border-t border-gray-200">
                                                    {/* Context Snapshot */}
                                                    {memory.context_snapshot && (
                                                        <div className="space-y-3">
                                                            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                                                <MapPin className="w-4 h-4" />
                                                                Context Snapshot
                                                            </h4>

                                                            {/* Temporal Context */}
                                                            {memory.context_snapshot.temporal && (
                                                                <div className="space-y-2">
                                                                    <h5 className="text-xs font-medium text-gray-600 flex items-center gap-1">
                                                                        <Calendar className="w-3 h-3" />
                                                                        Time Context
                                                                    </h5>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {memory.context_snapshot.temporal.date && (
                                                                            <Badge variant="outline" className="text-xs">
                                                                                {memory.context_snapshot.temporal.date}
                                                                            </Badge>
                                                                        )}
                                                                        {memory.context_snapshot.temporal.time && (
                                                                            <Badge variant="outline" className="text-xs">
                                                                                {memory.context_snapshot.temporal.time}
                                                                            </Badge>
                                                                        )}
                                                                        {memory.context_snapshot.temporal.day_of_week && (
                                                                            <Badge variant="outline" className="text-xs">
                                                                                {memory.context_snapshot.temporal.day_of_week}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Spatial Context */}
                                                            {memory.context_snapshot.spatial && (
                                                                <div className="space-y-2">
                                                                    <h5 className="text-xs font-medium text-gray-600 flex items-center gap-1">
                                                                        <MapPin className="w-3 h-3" />
                                                                        Location & Activity
                                                                    </h5>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {memory.context_snapshot.spatial.location && (
                                                                            <Badge className="text-xs bg-green-100 text-green-800">
                                                                                📍 {memory.context_snapshot.spatial.location}
                                                                            </Badge>
                                                                        )}
                                                                        {memory.context_snapshot.spatial.activity && (
                                                                            <Badge className="text-xs bg-purple-100 text-purple-800">
                                                                                🎯 {memory.context_snapshot.spatial.activity}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Social Context */}
                                                            {memory.context_snapshot.social?.people_present &&
                                                             memory.context_snapshot.social.people_present.length > 0 && (
                                                                <div className="space-y-2">
                                                                    <h5 className="text-xs font-medium text-gray-600 flex items-center gap-1">
                                                                        <Users className="w-3 h-3" />
                                                                        People Present
                                                                    </h5>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {memory.context_snapshot.social.people_present.map((person, personIndex) => (
                                                                            <Badge key={personIndex} className="text-xs bg-blue-100 text-blue-800">
                                                                                👤 {person}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Environmental Context */}
                                                            {memory.context_snapshot.environmental && (
                                                                <div className="space-y-2">
                                                                    <h5 className="text-xs font-medium text-gray-600 flex items-center gap-1">
                                                                        <Cloud className="w-3 h-3" />
                                                                        Environment
                                                                    </h5>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {Object.entries(memory.context_snapshot.environmental).map(([key, value], envIndex) => (
                                                                            value && (
                                                                                <Badge key={envIndex} className="text-xs bg-yellow-100 text-yellow-800">
                                                                                    {key === 'weather' && '🌤️'}
                                                                                    {key === 'temperature' && '🌡️'}
                                                                                    {key === 'mood' && '😊'}
                                                                                    {key}: {value}
                                                                                </Badge>
                                                                            )
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Grounding Information */}
                                                    {memory.grounding_applied && memory.grounding_info && (
                                                        <div className="space-y-3">
                                                            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                                                <Anchor className="w-4 h-4" />
                                                                Grounding Details
                                                            </h4>
                                                            <GroundingInfo memory={memory} />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    )
}
