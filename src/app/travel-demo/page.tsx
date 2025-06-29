"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Plane, Brain, HelpCircle, Compass, Map, GitBranch } from "lucide-react"
import { PageLayout } from "@/components/PageLayout"
import { ChatBox, ChatMessage } from "@/components/ChatBox"
import { useMemoryAPI } from "@/hooks"
import { useConfiguredAPI } from "@/hooks/useConfiguredAPI"
import { useSettings } from "@/hooks/useSettings"

// Travel agent system prompt
const TRAVEL_AGENT_PROMPT = `You are an expert travel agent helping users plan amazing trips. You provide personalized recommendations for destinations, accommodations, activities, restaurants, and travel logistics. You consider factors like budget, travel style, interests, dietary restrictions, and past travel experiences when making suggestions. Be helpful, enthusiastic, and detailed in your responses.`



// Sample questions that demonstrate memory value for travel planning
const sampleQuestions = [
    "I want to plan a week-long vacation in Europe. What do you recommend?",
    "What are the best restaurants in Tokyo for someone who loves sushi?",
    "I'm planning a family trip with kids. Where should we go?",
    "What's the best time to visit Thailand?",
    "I have a $3000 budget for a romantic getaway. Any suggestions?",
    "What should I pack for a trip to Iceland in winter?",
    "Can you recommend some off-the-beaten-path destinations?",
    "I'm a solo female traveler. Where would be safe and fun to visit?"
]



export default function TravelDemo() {
    const [activeTab, setActiveTab] = useState("standard")
    const [standardQuestion, setStandardQuestion] = useState("")
    const [memoryQuestion, setMemoryQuestion] = useState("")
    const [langgraphQuestion, setLanggraphQuestion] = useState("")
    const [standardMessages, setStandardMessages] = useState<ChatMessage[]>([])
    const [memoryMessages, setMemoryMessages] = useState<ChatMessage[]>([])
    const [langgraphMessages, setLanggraphMessages] = useState<ChatMessage[]>([])
    const [isStandardLoading, setIsStandardLoading] = useState(false)
    const [isMemoryLoading, setIsMemoryLoading] = useState(false)
    const [isLanggraphLoading, setIsLanggraphLoading] = useState(false)
    const [showHelpDialog, setShowHelpDialog] = useState(false)

    const [standardSessionId, setStandardSessionId] = useState<string | null>(null)
    const [memorySessionId, setMemorySessionId] = useState<string | null>(null)
    const { apiStatus, error, clearError, askQuestion } = useMemoryAPI()
    const { api } = useConfiguredAPI()
    const { settings } = useSettings()



    // Create standard session (no memory)
    const createStandardSession = useCallback(async () => {
        if (standardSessionId) return standardSessionId

        try {
            const standardSessionResponse = await api.createChatSession({
                system_prompt: TRAVEL_AGENT_PROMPT,
                config: {
                    use_memory: false,
                    model: "gpt-3.5-turbo",
                    temperature: 0.7,
                    max_tokens: 1000
                }
            })

            if (standardSessionResponse.success) {
                setStandardSessionId(standardSessionResponse.session_id)
                return standardSessionResponse.session_id
            }
        } catch (error) {
            console.error('Failed to create standard session:', error)
        }
        return null
    }, [api, standardSessionId])

    // Create memory session (with memory retrieval)
    const createMemorySession = useCallback(async () => {
        if (memorySessionId) return memorySessionId

        try {
            const memorySessionResponse = await api.createChatSession({
                system_prompt: TRAVEL_AGENT_PROMPT,
                config: {
                    use_memory: true,
                    model: "gpt-3.5-turbo",
                    temperature: 0.7,
                    max_tokens: 1000,
                    top_k: settings.questionTopK
                }
            })
            if (memorySessionResponse.success) {
                setMemorySessionId(memorySessionResponse.session_id)
                return memorySessionResponse.session_id
            }
        } catch (error) {
            console.error('Failed to create memory session:', error)
        }
        return null
    }, [api, memorySessionId, settings.questionTopK])

    // Create sessions on component mount
    useEffect(() => {
        createStandardSession()
        createMemorySession()
    }, [createStandardSession, createMemorySession])

    // Generate standard travel agent response (no memory) using session-based API
    const generateStandardResponse = async (question: string): Promise<string> => {
        try {
            // Ensure we have a standard session for fallback responses
            if (!standardSessionId) {
                await createStandardSession()
            }

            if (standardSessionId) {
                const response = await api.chatWithSession({
                    session_id: standardSessionId,
                    message: question,
                    min_similarity: settings.minSimilarity
                })

                if (response.success) {
                    return response.message
                } else {
                    return "I'm sorry, I'm having trouble processing your request right now. Please try again."
                }
            } else {
                return "I'm sorry, I'm having trouble processing your request right now. Please try again."
            }
        } catch (error) {
            console.error('Failed to get standard response:', error)
            return "I apologize, but I'm experiencing technical difficulties. Please try again later."
        }
    }

    const handleStandardSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!standardQuestion.trim()) return

        setIsStandardLoading(true)

        try {
            // Ensure session is created
            if (!standardSessionId) {
                await createStandardSession()
            }

            // Use session-based chat API (no memory)
            if (standardSessionId) {
                const response = await api.chatWithSession({
                    session_id: standardSessionId,
                    message: standardQuestion,
                    min_similarity: settings.minSimilarity
                })

                if (response.success) {
                    const newMessage: ChatMessage = {
                        id: Date.now().toString(),
                        question: standardQuestion,
                        answer: response.message,
                        created_at: new Date(),
                        hasMemory: false,
                        session_memories: response.memory_context?.memories || [],
                        excluded_memories: response.memory_context?.excluded_memories || [],
                        filtering_info: response.memory_context?.filtering_info
                    }
                    setStandardMessages(prev => [...prev, newMessage])
                } else {
                    // Fallback to standard response
                    const answer = await generateStandardResponse(standardQuestion)
                    const newMessage: ChatMessage = {
                        id: Date.now().toString(),
                        question: standardQuestion,
                        answer: answer,
                        created_at: new Date(),
                        hasMemory: false
                    }
                    setStandardMessages(prev => [...prev, newMessage])
                }
            } else {
                // Fallback to standard response if session creation failed
                const answer = await generateStandardResponse(standardQuestion)
                const newMessage: ChatMessage = {
                    id: Date.now().toString(),
                    question: standardQuestion,
                    answer: answer,
                    created_at: new Date(),
                    hasMemory: false
                }
                setStandardMessages(prev => [...prev, newMessage])
            }

            setStandardQuestion("")
        } catch (error) {
            console.error('Failed to get session response:', error)
            // Fallback to standard response
            const answer = await generateStandardResponse(standardQuestion)
            const newMessage: ChatMessage = {
                id: Date.now().toString(),
                question: standardQuestion,
                answer: answer,
                created_at: new Date(),
                hasMemory: false
            }
            setStandardMessages(prev => [...prev, newMessage])
            setStandardQuestion("")
        } finally {
            setIsStandardLoading(false)
        }
    }

    const handleMemorySubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!memoryQuestion.trim()) return

        setIsMemoryLoading(true)

        try {
            // Ensure session is created
            if (!memorySessionId) {
                await createMemorySession()
            }

            // Use session-based chat API (with memory)
            if (memorySessionId) {
                const response = await api.chatWithSession({
                    session_id: memorySessionId,
                    message: memoryQuestion,
                    top_k: settings.questionTopK,
                    min_similarity: settings.minSimilarity
                })

                if (response.success) {
                    console.log('Memory session response:', response)
                    console.log('Memory context:', response.memory_context)
                    console.log('Memories:', response.memory_context?.memories)

                    const newMessage: ChatMessage = {
                        id: Date.now().toString(),
                        question: memoryQuestion,
                        answer: response.message,
                        created_at: new Date(),
                        hasMemory: true,
                        session_memories: response.memory_context?.memories || [],
                        excluded_memories: response.memory_context?.excluded_memories || [],
                        filtering_info: response.memory_context?.filtering_info
                    }
                    console.log('New message with memories:', newMessage)
                    setMemoryMessages(prev => [...prev, newMessage])
                } else {
                    // Fallback to memory API approach
                    const memoryResponse = await askQuestion(memoryQuestion, settings.questionTopK)
                    let contextualAnswer = ""
                    let confidence: 'high' | 'medium' | 'low' | undefined
                    let reasoning: string | undefined
                    let supporting_memories: unknown[] | undefined

                    if (memoryResponse && typeof memoryResponse === 'object' && memoryResponse.success) {
                        contextualAnswer = memoryResponse.conversation.answer
                        confidence = memoryResponse.conversation.confidence
                        reasoning = memoryResponse.conversation.reasoning
                        supporting_memories = memoryResponse.conversation.supporting_memories
                    } else {
                        contextualAnswer = await generateStandardResponse(memoryQuestion)
                    }

                    const newMessage: ChatMessage = {
                        id: Date.now().toString(),
                        question: memoryQuestion,
                        answer: contextualAnswer,
                        created_at: new Date(),
                        hasMemory: true,
                        confidence,
                        reasoning,
                        supporting_memories
                    }
                    setMemoryMessages(prev => [...prev, newMessage])
                }
            } else {
                // Fallback to memory API approach if session creation failed
                const memoryResponse = await askQuestion(memoryQuestion, settings.questionTopK)
                let contextualAnswer = ""
                let confidence: 'high' | 'medium' | 'low' | undefined
                let reasoning: string | undefined
                let supporting_memories: unknown[] | undefined

                if (memoryResponse && typeof memoryResponse === 'object' && memoryResponse.success) {
                    contextualAnswer = memoryResponse.conversation.answer
                    confidence = memoryResponse.conversation.confidence
                    reasoning = memoryResponse.conversation.reasoning
                    supporting_memories = memoryResponse.conversation.supporting_memories
                } else {
                    contextualAnswer = await generateStandardResponse(memoryQuestion)
                }

                const newMessage: ChatMessage = {
                    id: Date.now().toString(),
                    question: memoryQuestion,
                    answer: contextualAnswer,
                    created_at: new Date(),
                    hasMemory: true,
                    confidence,
                    reasoning,
                    supporting_memories
                }
                setMemoryMessages(prev => [...prev, newMessage])
            }

            setMemoryQuestion("")
        } catch (error) {
            console.error('Failed to get memory-enhanced response:', error)
            // Fallback to standard response
            const fallbackAnswer = await generateStandardResponse(memoryQuestion)
            const newMessage: ChatMessage = {
                id: Date.now().toString(),
                question: memoryQuestion,
                answer: fallbackAnswer,
                created_at: new Date(),
                hasMemory: false
            }
            setMemoryMessages(prev => [...prev, newMessage])
            setMemoryQuestion("")
        } finally {
            setIsMemoryLoading(false)
        }
    }

    const handleLanggraphSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!langgraphQuestion.trim()) return

        setIsLanggraphLoading(true)

        try {
            const response = await fetch('http://localhost:5001/api/agent/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: langgraphQuestion,
                    system_prompt: "You are a helpful travel assistant"
                })
            })

            if (response.ok) {
                const data = await response.json()
                const newMessage: ChatMessage = {
                    id: Date.now().toString(),
                    question: langgraphQuestion,
                    answer: data.response || data.message || "I received your message but couldn't generate a response.",
                    created_at: new Date(),
                    hasMemory: false
                }
                setLanggraphMessages(prev => [...prev, newMessage])
            } else {
                const newMessage: ChatMessage = {
                    id: Date.now().toString(),
                    question: langgraphQuestion,
                    answer: "I'm sorry, I'm having trouble processing your request right now. Please try again.",
                    created_at: new Date(),
                    hasMemory: false
                }
                setLanggraphMessages(prev => [...prev, newMessage])
            }

            setLanggraphQuestion("")
        } catch (error) {
            console.error('Failed to get Langgraph response:', error)
            const newMessage: ChatMessage = {
                id: Date.now().toString(),
                question: langgraphQuestion,
                answer: "I apologize, but I'm experiencing technical difficulties. Please try again later.",
                created_at: new Date(),
                hasMemory: false
            }
            setLanggraphMessages(prev => [...prev, newMessage])
            setLanggraphQuestion("")
        } finally {
            setIsLanggraphLoading(false)
        }
    }

    const handleSampleQuestion = (question: string) => {
        setStandardQuestion(question)
        setMemoryQuestion(question)
        setLanggraphQuestion(question)
    }

    const clearStandardChat = async () => {
        setStandardMessages([])
        setStandardSessionId(null)
        // Create a new session for fresh conversation
        await createStandardSession()
    }

    const clearMemoryChat = async () => {
        setMemoryMessages([])
        setMemorySessionId(null)
        // Create a new session for fresh conversation
        await createMemorySession()
    }

    const clearLanggraphChat = () => {
        setLanggraphMessages([])
    }

    return (
        <PageLayout
            error={error}
            apiStatus={apiStatus}
            onClearError={clearError}
        >
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-3">
                        <Plane className="w-8 h-8 text-blue-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Travel Agent Demo</h1>
                        <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <HelpCircle className="w-4 h-4 mr-2" />
                                    Sample Questions
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Sample Questions to Try</DialogTitle>
                                    <DialogDescription>
                                        Click any question to populate both travel agent tabs with the same query
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-2 max-h-96 overflow-y-auto">
                                    {sampleQuestions.map((question, index) => (
                                        <Button
                                            key={index}
                                            variant="ghost"
                                            className="justify-start text-left h-auto p-3 whitespace-normal"
                                            onClick={() => {
                                                handleSampleQuestion(question)
                                                setShowHelpDialog(false)
                                            }}
                                        >
                                            {question}
                                        </Button>
                                    ))}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <p className="text-lg text-gray-600 max-w-4xl mx-auto">
                        Compare different travel agent implementations. Switch between tabs to see how the standard agent treats each question independently,
                        the memory-enhanced agent learns your preferences, and the Langgraph agent provides advanced conversational capabilities.
                    </p>
                </div>



                {/* Tabbed Chat Interface */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="standard" className="flex items-center gap-2">
                            <Compass className="w-4 h-4" />
                            Travel Agent (No Memory)
                        </TabsTrigger>
                        <TabsTrigger value="memory" className="flex items-center gap-2">
                            <Brain className="w-4 h-4" />
                            Travel Agent + Remem
                        </TabsTrigger>
                        <TabsTrigger value="langgraph" className="flex items-center gap-2">
                            <GitBranch className="w-4 h-4" />
                            Travel Agent, Langgraph + Remem
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="standard" className="space-y-6">
                        <ChatBox
                            title="Standard Travel Agent"
                            subtitle="Provides general travel advice but doesn't remember your preferences"
                            messages={standardMessages}
                            input={standardQuestion}
                            onInputChange={setStandardQuestion}
                            onSubmit={handleStandardSubmit}
                            onClearChat={clearStandardChat}
                            isLoading={isStandardLoading}
                            placeholder="Ask about travel plans..."
                            headerIcon={<Compass className="w-5 h-5" />}
                            borderColor="border-orange-200"
                            headerBgColor="bg-orange-50 text-orange-800"
                            messageBgColor="bg-orange-100 text-orange-800"
                            buttonColor="bg-orange-600 hover:bg-orange-700"
                            loadingText="Thinking..."
                            showMemoryIndicators={false}
                        />
                    </TabsContent>

                    <TabsContent value="memory" className="space-y-6">
                        <ChatBox
                            title="Travel Agent, with Remem for Memory"
                            subtitle="Learns your preferences and provides personalized recommendations"
                            messages={memoryMessages}
                            input={memoryQuestion}
                            onInputChange={setMemoryQuestion}
                            onSubmit={handleMemorySubmit}
                            onClearChat={clearMemoryChat}
                            isLoading={isMemoryLoading}
                            placeholder="Ask about travel plans..."
                            headerIcon={
                                <>
                                    <Brain className="w-5 h-5" />
                                    <Map className="w-5 h-5" />
                                </>
                            }
                            borderColor="border-green-200"
                            headerBgColor="bg-green-50 text-green-800"
                            messageBgColor="bg-green-100 text-green-800"
                            buttonColor="bg-green-600 hover:bg-green-700"
                            loadingText="Thinking..."
                            showMemoryIndicators={true}
                        />
                    </TabsContent>

                    <TabsContent value="langgraph" className="space-y-6">
                        <ChatBox
                            title="Travel Agent, Langgraph + Remem"
                            subtitle="Powered by Langgraph API + Remem for advanced travel assistance"
                            messages={langgraphMessages}
                            input={langgraphQuestion}
                            onInputChange={setLanggraphQuestion}
                            onSubmit={handleLanggraphSubmit}
                            onClearChat={clearLanggraphChat}
                            isLoading={isLanggraphLoading}
                            placeholder="Ask about travel plans..."
                            headerIcon={<GitBranch className="w-5 h-5" />}
                            borderColor="border-purple-200"
                            headerBgColor="bg-purple-50 text-purple-800"
                            messageBgColor="bg-purple-100 text-purple-800"
                            buttonColor="bg-purple-600 hover:bg-purple-700"
                            loadingText="Processing with Langgraph..."
                            showMemoryIndicators={false}
                        />
                    </TabsContent>
                </Tabs>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Use This Demo</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
                        <div>
                            <h4 className="font-medium mb-2">1. Switch Between Tabs</h4>
                            <p>Use the tabs above to switch between the Standard, Memory-Enhanced, and Langgraph travel agents.</p>
                        </div>
                        <div>
                            <h4 className="font-medium mb-2">2. Ask Similar Questions</h4>
                            <p>Try asking the same questions in all tabs to compare the different response styles and capabilities.</p>
                        </div>
                        <div>
                            <h4 className="font-medium mb-2">3. Share Your Preferences</h4>
                            <p>Tell the memory-enhanced agent about your travel style, budget, or interests.</p>
                        </div>
                        <div>
                            <h4 className="font-medium mb-2">4. Notice the Difference</h4>
                            <p>See how the memory-enhanced agent provides more personalized and contextual recommendations.</p>
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    )
}
