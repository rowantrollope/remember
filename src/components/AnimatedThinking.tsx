"use client"

import { useEffect, useState } from "react"

interface AnimatedThinkingProps {
    text?: string
    className?: string
}

export function AnimatedThinking({ 
    text = "thinking", 
    className = "" 
}: AnimatedThinkingProps) {
    const [dots, setDots] = useState("")

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => {
                if (prev.length >= 3) {
                    return ""
                }
                return prev + "."
            })
        }, 500)

        return () => clearInterval(interval)
    }, [])

    return (
        <span className={`inline-flex items-center ${className}`}>
            {text}
            <span className="inline-block w-6 text-left">{dots}</span>
        </span>
    )
}
