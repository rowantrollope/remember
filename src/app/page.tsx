"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle, Brain, Save, Zap } from "lucide-react"

// Components
import { PageLayout } from "@/components/PageLayout"

// Hooks
import { useMemoryAPI } from "@/hooks"

export default function HomePage() {
    const { apiStatus, error, clearError } = useMemoryAPI()

    const features = [
        {
            title: "Chat Demo",
            description: "Have conversational interactions with your memories using the LangGraph workflow",
            icon: MessageCircle,
            href: "/chat-demo",
            color: "bg-blue-500",
            endpoint: "/api/chat"
        },
        {
            title: "Ask Your Memory",
            description: "Get structured answers with confidence analysis and supporting evidence",
            icon: Brain,
            href: "/ask",
            color: "bg-green-500",
            endpoint: "/api/memory/answer"
        },
        {
            title: "Save Memory",
            description: "Store important moments and information with contextual grounding",
            icon: Save,
            href: "/memory/save",
            color: "bg-purple-500",
            endpoint: "/api/memory"
        },
        {
            title: "Browse Memories",
            description: "Search and explore your stored memories",
            icon: Zap,
            href: "/search",
            color: "bg-orange-500",
            endpoint: "/api/memory/search"
        }
    ]

    return (
        <PageLayout
            error={error}
            apiStatus={apiStatus}
            onClearError={clearError}
        >
            <div className="h-full flex flex-col items-center justify-center p-8 bg-white">
                <div className="max-w-4xl w-full">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            Memory Bank
                        </h1>
                        <p className="text-xl text-gray-600 mb-2">
                            Your AI-powered personal memory assistant
                        </p>
                        <p className="text-gray-500">
                            Choose how you&apos;d like to interact with your memories
                        </p>
                    </div>

                    {/* Feature Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {features.map((feature) => (
                            <Link key={feature.href} href={feature.href}>
                                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-gray-300">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className={`p-2 rounded-lg ${feature.color} text-white`}>
                                                <feature.icon className="w-6 h-6" />
                                            </div>
                                            <CardTitle className="text-xl">{feature.title}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-gray-600 mb-3">{feature.description}</p>
                                        <div className="text-sm text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">
                                            {feature.endpoint}
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>

                    {/* API Status Info */}
                    <div className="mt-12 text-center">
                        <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
                            <div className={`w-2 h-2 rounded-full ${
                                apiStatus === 'ready' ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            <span>
                                API Status: {apiStatus === 'ready' ? 'Connected' : 'Disconnected'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    )
}
