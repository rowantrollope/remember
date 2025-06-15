import { useState, useEffect, useRef } from "react"

interface RotatingPromptsProps {
    prompts: string[]
    className?: string
}

export function RotatingPrompts({ prompts, className = "" }: RotatingPromptsProps) {
    const [currentPrompt, setCurrentPrompt] = useState("")
    const hasInitialized = useRef(false)

    useEffect(() => {
        // Only initialize once when component first mounts
        if (prompts.length > 0 && !hasInitialized.current) {
            // Randomly select a prompt on mount
            const randomIndex = Math.floor(Math.random() * prompts.length)
            setCurrentPrompt(prompts[randomIndex])
            hasInitialized.current = true
        }
    }, [prompts])

    if (!currentPrompt) {
        return null
    }

    return (
        <div className={`text-center mb-8 ${className}`}>
            <p className="text-3xl text-gray-800 font-light leading-relaxed max-w-md mx-auto">
                {currentPrompt}
            </p>
        </div>
    )
}
