import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MapPin, Users, Activity, Cloud, Thermometer, Smile, Save, Loader2 } from "lucide-react"
import type { ContextInfo } from "@/types"

interface ContextTabProps {
    currentContext: ContextInfo | null
    onUpdateContext: (context: {
        location?: string
        activity?: string
        people_present?: string[]
        weather?: string
        temperature?: string
        mood?: string
        [key: string]: any
    }) => Promise<boolean>
    onGetContext: () => Promise<ContextInfo | null>
    isLoading: boolean
}

export function ContextTab({ currentContext, onUpdateContext, onGetContext, isLoading }: ContextTabProps) {
    const [location, setLocation] = useState("")
    const [activity, setActivity] = useState("")
    const [peoplePresent, setPeoplePresent] = useState("")
    const [weather, setWeather] = useState("")
    const [temperature, setTemperature] = useState("")
    const [mood, setMood] = useState("")
    const [isUpdating, setIsUpdating] = useState(false)
    const [hasInitialized, setHasInitialized] = useState(false)

    // Load current context on mount
    useEffect(() => {
        onGetContext()
    }, [onGetContext])

    // Update form when context changes, but only on initial load
    useEffect(() => {
        if (currentContext && !hasInitialized) {
            setLocation(currentContext.spatial?.location || "")
            setActivity(currentContext.spatial?.activity || "")
            setPeoplePresent(currentContext.social?.people_present?.join(", ") || "")
            setWeather(currentContext.environmental?.weather || "")
            setTemperature(currentContext.environmental?.temperature || "")
            setMood(currentContext.environmental?.mood || "")
            setHasInitialized(true)
        }
    }, [currentContext, hasInitialized])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsUpdating(true)

        const context = {
            location: location.trim() || undefined,
            activity: activity.trim() || undefined,
            people_present: peoplePresent.trim() ? peoplePresent.split(",").map(p => p.trim()).filter(Boolean) : undefined,
            weather: weather.trim() || undefined,
            temperature: temperature.trim() || undefined,
            mood: mood.trim() || undefined,
        }

        const success = await onUpdateContext(context)
        if (success) {
            // Context will be updated via the hook
            // Reset initialization flag so form can be updated with new context
            setHasInitialized(false)
        }
        setIsUpdating(false)
    }

    const formatDateTime = (temporal: any) => {
        if (!temporal) return null
        return `${temporal.date || ''} ${temporal.time || ''}`.trim()
    }

    return (
        <div className="flex flex-col h-full">
            <ScrollArea className="flex-1">
                <div className="space-y-6 p-2">
                    {/* Current Context Display */}
                    {currentContext && (
                        <Card className="border border-blue-200 bg-blue-50/50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-blue-600" />
                                    Current Context
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Temporal Info */}
                                {currentContext.temporal && (
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm text-gray-700">Time</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {formatDateTime(currentContext.temporal) && (
                                                <Badge variant="outline" className="text-xs">
                                                    {formatDateTime(currentContext.temporal)}
                                                </Badge>
                                            )}
                                            {currentContext.temporal.day_of_week && (
                                                <Badge variant="outline" className="text-xs">
                                                    {currentContext.temporal.day_of_week}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Spatial Info */}
                                {currentContext.spatial && (
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm text-gray-700 flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            Location & Activity
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {currentContext.spatial.location && (
                                                <Badge className="text-xs bg-green-100 text-green-800">
                                                    {currentContext.spatial.location}
                                                </Badge>
                                            )}
                                            {currentContext.spatial.activity && (
                                                <Badge className="text-xs bg-purple-100 text-purple-800">
                                                    {currentContext.spatial.activity}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Social Info */}
                                {currentContext.social?.people_present && currentContext.social.people_present.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm text-gray-700 flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            People Present
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {currentContext.social.people_present.map((person, index) => (
                                                <Badge key={index} className="text-xs bg-blue-100 text-blue-800">
                                                    {person}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Environmental Info */}
                                {currentContext.environmental && (
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm text-gray-700 flex items-center gap-1">
                                            <Cloud className="w-4 h-4" />
                                            Environment
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {currentContext.environmental.weather && (
                                                <Badge className="text-xs bg-yellow-100 text-yellow-800">
                                                    {currentContext.environmental.weather}
                                                </Badge>
                                            )}
                                            {currentContext.environmental.temperature && (
                                                <Badge className="text-xs bg-orange-100 text-orange-800">
                                                    {currentContext.environmental.temperature}
                                                </Badge>
                                            )}
                                            {currentContext.environmental.mood && (
                                                <Badge className="text-xs bg-pink-100 text-pink-800">
                                                    {currentContext.environmental.mood}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Context Update Form */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Update Context</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="location" className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            Location
                                        </Label>
                                        <Input
                                            id="location"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            placeholder="e.g., Tokyo, Japan"
                                            disabled={isLoading || isUpdating}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="activity" className="flex items-center gap-1">
                                            <Activity className="w-4 h-4" />
                                            Activity
                                        </Label>
                                        <Input
                                            id="activity"
                                            value={activity}
                                            onChange={(e) => setActivity(e.target.value)}
                                            placeholder="e.g., vacation, work meeting"
                                            disabled={isLoading || isUpdating}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="people" className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            People Present
                                        </Label>
                                        <Input
                                            id="people"
                                            value={peoplePresent}
                                            onChange={(e) => setPeoplePresent(e.target.value)}
                                            placeholder="e.g., Sarah, Mike (comma separated)"
                                            disabled={isLoading || isUpdating}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="weather" className="flex items-center gap-1">
                                            <Cloud className="w-4 h-4" />
                                            Weather
                                        </Label>
                                        <Input
                                            id="weather"
                                            value={weather}
                                            onChange={(e) => setWeather(e.target.value)}
                                            placeholder="e.g., sunny, rainy"
                                            disabled={isLoading || isUpdating}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="temperature" className="flex items-center gap-1">
                                            <Thermometer className="w-4 h-4" />
                                            Temperature
                                        </Label>
                                        <Input
                                            id="temperature"
                                            value={temperature}
                                            onChange={(e) => setTemperature(e.target.value)}
                                            placeholder="e.g., 25°C, hot"
                                            disabled={isLoading || isUpdating}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="mood" className="flex items-center gap-1">
                                            <Smile className="w-4 h-4" />
                                            Mood
                                        </Label>
                                        <Input
                                            id="mood"
                                            value={mood}
                                            onChange={(e) => setMood(e.target.value)}
                                            placeholder="e.g., excited, relaxed"
                                            disabled={isLoading || isUpdating}
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading || isUpdating}
                                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                                >
                                    {isUpdating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Updating Context...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Update Context
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </ScrollArea>
        </div>
    )
}
