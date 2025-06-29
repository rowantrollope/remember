"use client"

import { useEffect, useState } from "react"

interface ResponseTimerProps {
    startTime?: number
    endTime?: number
    isLoading?: boolean
    className?: string
}

export function ResponseTimer({ 
    startTime, 
    endTime, 
    isLoading = false, 
    className = "" 
}: ResponseTimerProps) {
    const [currentTime, setCurrentTime] = useState(Date.now())

    useEffect(() => {
        if (!isLoading || !startTime) return

        const interval = setInterval(() => {
            setCurrentTime(Date.now())
        }, 10) // Update every 10ms for smooth animation

        return () => clearInterval(interval)
    }, [isLoading, startTime])

    if (!startTime) return null

    const displayTime = endTime 
        ? endTime - startTime 
        : isLoading 
            ? currentTime - startTime 
            : 0

    if (displayTime <= 0) return null

    return (
        <span className={`text-xs text-gray-400 font-mono ${className}`}>
            {displayTime.toLocaleString()}ms
        </span>
    )
}

// Hook to manage response timing
export function useResponseTimer() {
    const [startTime, setStartTime] = useState<number | undefined>()
    const [endTime, setEndTime] = useState<number | undefined>()
    const [isLoading, setIsLoading] = useState(false)

    const startTimer = () => {
        const now = Date.now()
        setStartTime(now)
        setEndTime(undefined)
        setIsLoading(true)
    }

    const endTimer = () => {
        const now = Date.now()
        setEndTime(now)
        setIsLoading(false)
    }

    const resetTimer = () => {
        setStartTime(undefined)
        setEndTime(undefined)
        setIsLoading(false)
    }

    return {
        startTime,
        endTime,
        isLoading,
        startTimer,
        endTimer,
        resetTimer
    }
}
