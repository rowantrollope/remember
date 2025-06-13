import { useState, useEffect } from "react"
import { Save } from "lucide-react"
import { GroundingToggle } from "@/components/GroundingToggle"
import { MemoryConfirmationDialog } from "@/components/MemoryConfirmationDialog"
import type { RememberResponse } from "@/lib/api"

interface SaveTabProps {
    groundingEnabled: boolean
    onGroundingToggle: (enabled: boolean) => void
    lastSaveResponse?: { success: boolean; response: RememberResponse | null; originalText: string } | null
}

export function SaveTab({ groundingEnabled, onGroundingToggle, lastSaveResponse }: SaveTabProps) {
    const [showConfirmation, setShowConfirmation] = useState(false)

    // Show confirmation dialog when a new memory is saved
    useEffect(() => {
        if (lastSaveResponse?.success && lastSaveResponse.response) {
            setShowConfirmation(true)
        }
    }, [lastSaveResponse])
    return (
        <>
            <div className="flex flex-col h-full">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Save className="w-16 h-16 text-green-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Add a new Memory</h3>
                        <p className="text-black">Store important moments and information</p>
                        <br />
                        <p className="text-gray-600">Examples:</p>
                        <p className="text-gray-600">&ldquo;I had lunch with John at the Italian restaurant&rdquo;</p>
                        <p className="text-gray-600">&ldquo;I&rsquo;m going to the gym at 5pm&rdquo;</p>
                        <p className="text-gray-600">&ldquo;I&rsquo;m feeling really stressed today&rdquo;</p>
                        <br />
                    </div>
                </div>

                <div className="flex-shrink-0 mb-4">
                    <GroundingToggle
                        enabled={groundingEnabled}
                        onChange={onGroundingToggle}
                    />
                </div>
            </div>

            <MemoryConfirmationDialog
                isOpen={showConfirmation}
                onClose={() => setShowConfirmation(false)}
                response={lastSaveResponse?.response || null}
                originalText={lastSaveResponse?.originalText || ""}
            />
        </>
    )
}
