"use client"

import React, { Component, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
    AlertTriangle, 
    RefreshCw, 
    XCircle, 
    Info,
    BarChart3,
    WifiOff,
    Server
} from 'lucide-react'

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
    errorInfo: React.ErrorInfo | null
}

interface PerformanceErrorBoundaryProps {
    children: ReactNode
    fallback?: ReactNode
}

export class PerformanceErrorBoundary extends Component<
    PerformanceErrorBoundaryProps,
    ErrorBoundaryState
> {
    constructor(props: PerformanceErrorBoundaryProps) {
        super(props)
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {
            hasError: true,
            error,
            errorInfo: null
        }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Performance component error:', error, errorInfo)
        this.setState({
            error,
            errorInfo
        })
    }

    handleRetry = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        })
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <Card className="border-red-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-700">
                            <XCircle className="w-5 h-5" />
                            Performance Component Error
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-medium text-red-800">Something went wrong</h4>
                                <p className="text-sm text-red-700 mt-1">
                                    The performance monitoring component encountered an error and couldn't render properly.
                                </p>
                                {this.state.error && (
                                    <details className="mt-2">
                                        <summary className="text-sm text-red-600 cursor-pointer">
                                            Error details
                                        </summary>
                                        <pre className="text-xs text-red-600 mt-2 p-2 bg-red-100 rounded overflow-auto">
                                            {this.state.error.message}
                                        </pre>
                                    </details>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                            <Button
                                onClick={this.handleRetry}
                                className="flex items-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Try Again
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => window.location.reload()}
                                className="flex items-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Reload Page
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )
        }

        return this.props.children
    }
}

// Performance API Error Handler
interface PerformanceApiErrorProps {
    error: Error | string
    onRetry?: () => void
    onDismiss?: () => void
    context?: string
}

export function PerformanceApiError({ 
    error, 
    onRetry, 
    onDismiss, 
    context = "performance operation" 
}: PerformanceApiErrorProps) {
    const errorMessage = typeof error === 'string' ? error : error.message
    
    const getErrorType = (message: string) => {
        if (message.includes('fetch') || message.includes('network')) {
            return { type: 'network', icon: WifiOff, color: 'text-orange-600' }
        }
        if (message.includes('500') || message.includes('server')) {
            return { type: 'server', icon: Server, color: 'text-red-600' }
        }
        if (message.includes('404') || message.includes('not found')) {
            return { type: 'not-found', icon: AlertTriangle, color: 'text-yellow-600' }
        }
        return { type: 'unknown', icon: XCircle, color: 'text-red-600' }
    }

    const { type, icon: Icon, color } = getErrorType(errorMessage)

    const getErrorSuggestion = (errorType: string) => {
        switch (errorType) {
            case 'network':
                return 'Check your internet connection and try again.'
            case 'server':
                return 'The server is experiencing issues. Please try again in a few moments.'
            case 'not-found':
                return 'The performance API endpoint may not be available. Check your configuration.'
            default:
                return 'An unexpected error occurred. Please try again or contact support.'
        }
    }

    return (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <Icon className={`w-5 h-5 ${color} mt-0.5`} />
            <div className="flex-1">
                <h4 className="font-medium text-red-800">
                    Failed to {context}
                </h4>
                <p className="text-sm text-red-700 mt-1">
                    {errorMessage}
                </p>
                <p className="text-sm text-red-600 mt-2">
                    {getErrorSuggestion(type)}
                </p>
                
                <div className="flex gap-2 mt-3">
                    {onRetry && (
                        <Button
                            size="sm"
                            onClick={onRetry}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className="w-3 h-3" />
                            Retry
                        </Button>
                    )}
                    {onDismiss && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onDismiss}
                        >
                            Dismiss
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}

// Performance Feature Unavailable Fallback
interface PerformanceUnavailableProps {
    reason?: string
    onRetry?: () => void
}

export function PerformanceUnavailable({ 
    reason = "Performance monitoring is not available", 
    onRetry 
}: PerformanceUnavailableProps) {
    return (
        <Card className="border-yellow-200">
            <CardContent className="p-8 text-center">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Performance Features Unavailable
                </h3>
                <p className="text-gray-600 mb-4">
                    {reason}
                </p>
                
                <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2">
                        <Info className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-700">
                            This could be due to:
                        </span>
                    </div>
                    
                    <ul className="text-sm text-gray-600 space-y-1 max-w-md mx-auto">
                        <li>• Performance optimization not enabled on the server</li>
                        <li>• API endpoint not available</li>
                        <li>• Insufficient permissions</li>
                        <li>• Server configuration issues</li>
                    </ul>
                    
                    {onRetry && (
                        <Button
                            onClick={onRetry}
                            className="flex items-center gap-2 mt-4"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Check Again
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

// Loading State Component
interface PerformanceLoadingProps {
    message?: string
    size?: 'sm' | 'md' | 'lg'
}

export function PerformanceLoading({ 
    message = "Loading performance data...", 
    size = 'md' 
}: PerformanceLoadingProps) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    }

    const containerClasses = {
        sm: 'p-4',
        md: 'p-8',
        lg: 'p-12'
    }

    return (
        <div className={`flex flex-col items-center justify-center ${containerClasses[size]}`}>
            <RefreshCw className={`${sizeClasses[size]} animate-spin text-blue-600 mb-3`} />
            <p className="text-sm text-gray-600 text-center">{message}</p>
        </div>
    )
}

// Status Badge Component
interface PerformanceStatusBadgeProps {
    status: 'loading' | 'error' | 'success' | 'unavailable'
    message?: string
}

export function PerformanceStatusBadge({ status, message }: PerformanceStatusBadgeProps) {
    const statusConfig = {
        loading: {
            color: 'bg-blue-100 text-blue-800',
            icon: RefreshCw,
            defaultMessage: 'Loading...'
        },
        error: {
            color: 'bg-red-100 text-red-800',
            icon: XCircle,
            defaultMessage: 'Error'
        },
        success: {
            color: 'bg-green-100 text-green-800',
            icon: BarChart3,
            defaultMessage: 'Active'
        },
        unavailable: {
            color: 'bg-yellow-100 text-yellow-800',
            icon: AlertTriangle,
            defaultMessage: 'Unavailable'
        }
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
        <Badge className={`${config.color} flex items-center gap-1`}>
            <Icon className={`w-3 h-3 ${status === 'loading' ? 'animate-spin' : ''}`} />
            {message || config.defaultMessage}
        </Badge>
    )
}
