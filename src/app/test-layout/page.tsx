"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TestLayout() {
    const [activeTab, setActiveTab] = useState("abc")

    // Generate lots of content to test scrolling
    const generateContent = (count: number) => {
        return Array.from({ length: count }, (_, i) => (
            <div key={i} className="p-2 border-b">
                Content item {i + 1} - This is some test content to demonstrate scrolling behavior
            </div>
        ))
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 flex-shrink-0">
                <h1>Test Layout - Proper Scrolling Demo</h1>
            </div>

            {/* Main content area */}
            <div className="flex-1 p-6 min-h-0">
                <Card className="h-full flex flex-col">
                    {/* Card Header */}
                    <CardHeader className="flex-shrink-0 pb-4">
                        <h2 className="text-lg font-semibold">Content Tabs</h2>
                    </CardHeader>

                    {/* Tabs Container */}
                    <div className="flex-1 min-h-0">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                            {/* Tab List */}
                            <TabsList className="flex-shrink-0 grid w-full grid-cols-3">
                                <TabsTrigger value="abc">ABC Content</TabsTrigger>
                                <TabsTrigger value="short">Short Content</TabsTrigger>
                                <TabsTrigger value="long">Long Content</TabsTrigger>
                            </TabsList>

                            {/* Tab Content Area */}
                            <div className="flex-1 min-h-0 mt-4">
                                <TabsContent value="abc" className="h-full m-0">
                                    <div className="h-full overflow-y-auto border rounded p-4 bg-white">
                                        {generateContent(50)}
                                    </div>
                                </TabsContent>

                                <TabsContent value="short" className="h-full m-0">
                                    <div className="h-full overflow-y-auto border rounded p-4 bg-white">
                                        <div className="p-4">
                                            <h3 className="font-semibold mb-2">Short Content</h3>
                                            <p>This is just a small amount of content that doesn't need scrolling.</p>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="long" className="h-full m-0">
                                    <div className="h-full overflow-y-auto border rounded p-4 bg-white">
                                        {generateContent(100)}
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>

                    {/* Footer */}
                    <div className="flex-shrink-0 mt-4 p-4 bg-gray-100 rounded">
                        <p className="text-sm text-gray-600">
                            This footer stays at the bottom. The content above should scroll when it overflows.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    )
}
