"use client"

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Brain, Zap, Shield, Globe } from "lucide-react"

export function InfoCards() {
    return (
        <div className="space-y-6">
            <div className="text-center lg:text-left">
                <h2 className="text-2xl font-bold mb-4">
                    Why Choose Remem?
                </h2>
                <p className="text-muted-foreground">
                    Built for developers who need intelligent memory capabilities in their applications.
                </p>
            </div>
            
            <div className="grid gap-4 grid-cols-2 md:grid-cols-2">
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <Brain className="h-5 w-5 text-blue-500" />
                            <CardTitle className="text-lg">Contextual Grounding</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Automatically enriches memories with spatial, temporal, and social context. 
                            Your memories become more meaningful and searchable.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            <CardTitle className="text-lg">Vector-Powered Search</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Semantic search using Redis vector capabilities. Find memories by meaning, 
                            not just keywords.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-green-500" />
                            <CardTitle className="text-lg">Confidence Scoring</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Every answer comes with confidence levels and supporting evidence. 
                            Know when to trust the results.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-purple-500" />
                            <CardTitle className="text-lg">RESTful API</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Simple HTTP endpoints that work with any programming language. 
                            No complex SDKs required.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
