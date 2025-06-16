"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Brain, Code, GitPullRequest, Lightbulb, Database, Zap } from "lucide-react"
import { PageLayout } from "@/components/PageLayout"
import { useMemoryAPI } from "@/hooks"

// Sample code snippets for the demo
const codeSnippets = [
    {
        id: 1,
        title: "React Component",
        language: "typescript",
        code: `function UserProfile({ userId }: { userId: string }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    
    useEffect(() => {
        fetch(\`/api/users/\${userId}\`)
            .then(res => res.json())
            .then(data => {
                setUser(data)
                setLoading(false)
            })
    }, [userId])
    
    if (loading) return <div>Loading...</div>
    
    return (
        <div>
            <h1>{user.name}</h1>
            <p>{user.email}</p>
        </div>
    )
}`
    },
    {
        id: 2,
        title: "API Endpoint",
        language: "python",
        code: `def get_user_orders(user_id):
    orders = []
    for order in db.orders.find({"user_id": user_id}):
        orders.append({
            "id": order["_id"],
            "total": order["total"],
            "items": order["items"]
        })
    return orders`
    },
    {
        id: 3,
        title: "Database Query",
        language: "sql",
        code: `SELECT u.name, u.email, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2024-01-01'
GROUP BY u.id
ORDER BY order_count DESC`
    }
]

// Generic responses (without memory)
const genericResponses = [
    "Consider adding error handling for the API call.",
    "This code looks fine but could use some optimization.",
    "Make sure to handle edge cases and null values.",
    "Consider adding TypeScript types for better type safety.",
    "The logic seems correct but could be more readable."
]

// Memory-enhanced responses (with context)
const memoryResponses = {
    1: {
        response: "Based on your previous feedback about preferring custom hooks for data fetching, I'd suggest extracting this into a `useUser` hook. Also, you mentioned in past reviews that you like to handle loading states with skeleton components rather than simple text - consider using your `UserSkeleton` component here.",
        memories: [
            "User prefers custom hooks for data fetching logic",
            "User likes skeleton loading states over simple text",
            "User has a UserSkeleton component in their codebase"
        ]
    },
    2: {
        response: "I notice this follows the same pattern as the `get_user_products` function you reviewed last week, but you're not using the pagination helper you created. Also, based on your coding standards, you prefer using list comprehensions over manual loops. Consider: `return [{'id': o['_id'], 'total': o['total'], 'items': o['items']} for o in db.orders.find({'user_id': user_id})]`",
        memories: [
            "User created a pagination helper for database queries",
            "User prefers list comprehensions over manual loops",
            "User has consistent patterns for API response formatting"
        ]
    },
    3: {
        response: "This query looks good and follows your team's naming conventions. However, I remember you mentioned performance issues with similar LEFT JOINs on large user tables. Consider adding an index on `users.created_at` if you haven't already, and maybe limit the results since you typically paginate these reports.",
        memories: [
            "User's team has specific SQL naming conventions",
            "User experienced performance issues with LEFT JOINs on user tables",
            "User typically paginates report queries"
        ]
    }
}

// Demo memories that will be injected
const demoMemories = [
    "User prefers custom hooks for data fetching logic instead of inline useEffect calls",
    "User likes skeleton loading states over simple text loading indicators",
    "User has a UserSkeleton component in their codebase for consistent loading states",
    "User created a pagination helper for database queries to avoid repetitive code",
    "User prefers list comprehensions over manual loops in Python code",
    "User has consistent patterns for API response formatting across endpoints",
    "User's team has specific SQL naming conventions that should be followed",
    "User experienced performance issues with LEFT JOINs on large user tables",
    "User typically paginates report queries for better performance",
    "User values code consistency and reusability in their reviews"
]

export default function AgentDemo() {
    const [selectedSnippet, setSelectedSnippet] = useState(codeSnippets[0])
    const [activeTab, setActiveTab] = useState("without-memory")
    const [isReviewing, setIsReviewing] = useState(false)
    const [currentResponse, setCurrentResponse] = useState("")
    const [showMemories, setShowMemories] = useState(false)
    const [hasSetupMemories, setHasSetupMemories] = useState(false)
    const [showMemoryDialog, setShowMemoryDialog] = useState(false)
    const [isAddingMemories, setIsAddingMemories] = useState(false)
    const { apiStatus, error, clearError, saveMemory, askQuestion } = useMemoryAPI()

    const handleShowMemoryDialog = () => {
        setShowMemoryDialog(true)
    }

    const handleAddMemories = async () => {
        if (hasSetupMemories) return

        setIsAddingMemories(true)

        try {
            for (const memory of demoMemories) {
                await saveMemory(memory)
            }
            setHasSetupMemories(true)
            setShowMemoryDialog(false)
        } catch (error) {
            console.error('Failed to add demo memories:', error)
        } finally {
            setIsAddingMemories(false)
        }
    }

    const handleReview = async () => {
        setIsReviewing(true)
        setCurrentResponse("")
        setShowMemories(false)

        if (activeTab === "without-memory") {
            // Simulate AI thinking time
            await new Promise(resolve => setTimeout(resolve, 1500))
            // Show generic response
            const randomResponse = genericResponses[Math.floor(Math.random() * genericResponses.length)]
            setCurrentResponse(randomResponse)
        } else {
            // Set up demo memories if not already done
            if (!hasSetupMemories) {
                await handleAddMemories()
            }

            // Use real memory API for enhanced response
            const codeContext = `Code review for ${selectedSnippet.title} (${selectedSnippet.language}):\n\n${selectedSnippet.code}`
            const question = `Please review this ${selectedSnippet.language} code and provide feedback based on my coding preferences and past feedback patterns: ${codeContext}`

            const result = await askQuestion(question, 5)
            if (result && typeof result === 'object' && result.success) {
                setCurrentResponse(result.conversation.answer)
            } else {
                // Fallback to demo response if API fails
                const memoryResponse = memoryResponses[selectedSnippet.id]
                setCurrentResponse(memoryResponse.response)
            }
        }

        setIsReviewing(false)
    }

    const currentMemories = activeTab === "with-memory" ? memoryResponses[selectedSnippet.id]?.memories || [] : []

    return (
        <PageLayout
            error={error}
            apiStatus={apiStatus}
            onClearError={clearError}
        >
            <div className="max-w-6xl mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-3">
                        <GitPullRequest className="w-8 h-8 text-blue-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Code Review Assistant Demo</h1>
                    </div>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                        See how memory transforms an AI agent from giving generic feedback to providing 
                        personalized, contextual code reviews that learn from your preferences and past interactions.
                    </p>
                </div>

                {/* Demo Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="without-memory" className="flex items-center gap-2">
                            <Code className="w-4 h-4" />
                            Without Memory
                        </TabsTrigger>
                        <TabsTrigger value="with-memory" className="flex items-center gap-2">
                            <Database className="w-4 h-4" />
                            With Memory
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="without-memory" className="space-y-6">
                        <Card className="border-orange-200 bg-orange-50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-orange-800">
                                    <Zap className="w-5 h-5" />
                                    Stateless Agent (No Memory)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-orange-700">
                                <p>This agent gives generic, one-size-fits-all responses. It doesn't remember your coding style, 
                                past feedback, or project context. Every review starts from scratch.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="with-memory" className="space-y-6">
                        <Card className="border-green-200 bg-green-50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-green-800">
                                    <Database className="w-5 h-5" />
                                    Memory-Enhanced Agent
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-green-700">
                                    This agent remembers your coding preferences, past feedback, team conventions, and project context.
                                    It provides personalized recommendations that improve over time.
                                </p>
                                {!hasSetupMemories && (
                                    <Dialog open={showMemoryDialog} onOpenChange={setShowMemoryDialog}>
                                        <DialogTrigger asChild>
                                            <Button
                                                onClick={handleShowMemoryDialog}
                                                variant="outline"
                                                size="sm"
                                                className="border-green-300 text-green-700 hover:bg-green-100"
                                            >
                                                <Database className="w-4 h-4 mr-2" />
                                                Setup Demo Memories
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle className="flex items-center gap-2">
                                                    <Database className="w-5 h-5" />
                                                    Demo Memories Preview
                                                </DialogTitle>
                                                <DialogDescription>
                                                    These memories will be added to demonstrate how the agent learns your coding preferences and patterns.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-3 py-4">
                                                {demoMemories.map((memory, index) => (
                                                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                                                        <div className="flex items-start gap-2">
                                                            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                                                                {index + 1}
                                                            </span>
                                                            <p className="text-sm text-gray-700">{memory}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <DialogFooter>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setShowMemoryDialog(false)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    onClick={handleAddMemories}
                                                    disabled={isAddingMemories}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    {isAddingMemories ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                            Adding Memories...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Database className="w-4 h-4 mr-2" />
                                                            Add Memories
                                                        </>
                                                    )}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                )}
                                {hasSetupMemories && (
                                    <div className="flex items-center gap-2 text-green-700">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-sm">Demo memories loaded</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Code Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle>Select Code to Review</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {codeSnippets.map((snippet) => (
                                <Button
                                    key={snippet.id}
                                    variant={selectedSnippet.id === snippet.id ? "default" : "outline"}
                                    onClick={() => setSelectedSnippet(snippet)}
                                    className="h-auto p-4 text-left"
                                >
                                    <div>
                                        <div className="font-medium">{snippet.title}</div>
                                        <div className="text-sm text-muted-foreground">{snippet.language}</div>
                                    </div>
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Code Display */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Code className="w-5 h-5" />
                            {selectedSnippet.title}
                            <Badge variant="secondary">{selectedSnippet.language}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                            <code>{selectedSnippet.code}</code>
                        </pre>
                    </CardContent>
                </Card>

                {/* Review Button */}
                <div className="text-center">
                    <Button 
                        onClick={handleReview} 
                        disabled={isReviewing}
                        size="lg"
                        className="px-8"
                    >
                        {isReviewing ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Reviewing Code...
                            </>
                        ) : (
                            <>
                                <GitPullRequest className="w-4 h-4 mr-2" />
                                Get Code Review
                            </>
                        )}
                    </Button>
                </div>

                {/* Review Response */}
                {currentResponse && (
                    <Card className={activeTab === "with-memory" ? "border-green-200" : "border-orange-200"}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lightbulb className="w-5 h-5" />
                                AI Review Feedback
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-gray-700">{currentResponse}</p>
                            
                            {activeTab === "with-memory" && currentMemories.length > 0 && (
                                <div className="space-y-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowMemories(!showMemories)}
                                    >
                                        <Database className="w-4 h-4 mr-2" />
                                        {showMemories ? "Hide" : "Show"} Supporting Memories ({currentMemories.length})
                                    </Button>
                                    
                                    {showMemories && (
                                        <div className="bg-green-50 p-4 rounded-lg space-y-2">
                                            <h4 className="font-medium text-green-800">Memories Used:</h4>
                                            <ul className="space-y-1">
                                                {currentMemories.map((memory, index) => (
                                                    <li key={index} className="text-sm text-green-700 flex items-start gap-2">
                                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                                                        {memory}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Explanation Section */}
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="w-5 h-5" />
                            Why Memory Matters for AI Agents
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold text-orange-800 mb-2">Without Memory</h4>
                                <ul className="space-y-1 text-sm text-gray-600">
                                    <li>• Generic, one-size-fits-all responses</li>
                                    <li>• No learning from past interactions</li>
                                    <li>• Repetitive suggestions</li>
                                    <li>• No awareness of user preferences</li>
                                    <li>• Limited context understanding</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold text-green-800 mb-2">With Memory</h4>
                                <ul className="space-y-1 text-sm text-gray-600">
                                    <li>• Personalized recommendations</li>
                                    <li>• Learns from feedback patterns</li>
                                    <li>• Remembers coding style preferences</li>
                                    <li>• Aware of project context and conventions</li>
                                    <li>• Improves over time with more interactions</li>
                                </ul>
                            </div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-blue-800 text-sm">
                                <strong>Real-world Impact:</strong> Memory-enhanced agents can reduce code review time by 40-60%
                                by providing more relevant, actionable feedback that aligns with team standards and individual preferences.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    )
}
