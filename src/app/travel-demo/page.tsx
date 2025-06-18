"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Plane, Brain, HelpCircle, Compass, Map } from "lucide-react"
import { PageLayout } from "@/components/PageLayout"
import { ChatBox, ChatMessage } from "@/components/ChatBox"
import { useMemoryAPI } from "@/hooks"
import { useConfiguredAPI } from "@/hooks/useConfiguredAPI"

// Travel agent system prompt
const TRAVEL_AGENT_PROMPT = `You are an expert travel agent helping users plan amazing trips. You provide personalized recommendations for destinations, accommodations, activities, restaurants, and travel logistics. You consider factors like budget, travel style, interests, dietary restrictions, and past travel experiences when making suggestions. Be helpful, enthusiastic, and detailed in your responses.`

// Sample travel memories to demonstrate memory functionality
const travelMemories = [
    "User prefers boutique hotels over chain hotels for a more authentic experience",
    "User loves trying local street food and authentic cuisine when traveling",
    "User has a moderate budget of around $2000-4000 for week-long trips",
    "User enjoys cultural experiences like museums, historical sites, and local festivals",
    "User prefers destinations with good public transportation to avoid renting cars",
    "User is interested in sustainable and eco-friendly travel options",
    "User likes to travel during shoulder seasons to avoid crowds and save money",
    "User has dietary restrictions - vegetarian and avoids spicy food"
]

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
    const [leftQuestion, setLeftQuestion] = useState("")
    const [rightQuestion, setRightQuestion] = useState("")
    const [leftMessages, setLeftMessages] = useState<ChatMessage[]>([])
    const [rightMessages, setRightMessages] = useState<ChatMessage[]>([])
    const [isLeftLoading, setIsLeftLoading] = useState(false)
    const [isRightLoading, setIsRightLoading] = useState(false)
    const [showHelpDialog, setShowHelpDialog] = useState(false)
    const [hasSetupMemories, setHasSetupMemories] = useState(false)
    const [leftSessionId, setLeftSessionId] = useState<string | null>(null)
    const [rightSessionId, setRightSessionId] = useState<string | null>(null)
    const { apiStatus, error, clearError, saveMemory, askQuestion } = useMemoryAPI()
    const { api } = useConfiguredAPI()

    const setupTravelMemories = async () => {
        if (hasSetupMemories) return

        try {
            // Save travel preference memories for enhanced recommendations
            for (const memory of travelMemories) {
                await saveMemory(memory)
            }
            setHasSetupMemories(true)
        } catch (error) {
            console.error('Failed to setup travel memories:', error)
        }
    }

    // Create left session (no memory)
    const createLeftSession = useCallback(async () => {
        if (leftSessionId) return leftSessionId

        try {
            const leftSessionResponse = await api.createChatSession({
                system_prompt: TRAVEL_AGENT_PROMPT,
                config: {
                    model: "gpt-3.5-turbo",
                    temperature: 0.7,
                    max_tokens: 4000,
                    use_memory: false,
                    save_memory: false
                }
            })
            if (leftSessionResponse.success) {
                setLeftSessionId(leftSessionResponse.session_id)
                return leftSessionResponse.session_id
            }
        } catch (error) {
            console.error('Failed to create left session:', error)
        }
        return null
    }, [api, leftSessionId])

    // Create right session (with memory retrieval but no automatic saving)
    const createRightSession = useCallback(async () => {
        if (rightSessionId) return rightSessionId

        try {
            const rightSessionResponse = await api.createChatSession({
                system_prompt: TRAVEL_AGENT_PROMPT,
                config: {
                    model: "gpt-3.5-turbo",
                    temperature: 0.7,
                    max_tokens: 4000,
                    use_memory: true,
                    save_memory: false // Don't automatically save memories
                }
            })
            if (rightSessionResponse.success) {
                setRightSessionId(rightSessionResponse.session_id)
                return rightSessionResponse.session_id
            }
        } catch (error) {
            console.error('Failed to create right session:', error)
        }
        return null
    }, [api, rightSessionId])

    // Create sessions on component mount
    useEffect(() => {
        createLeftSession()
        createRightSession()
    }, [createLeftSession, createRightSession])

    // Generate standard travel agent response (no memory) using session-based API
    const generateStandardResponse = async (question: string): Promise<string> => {
        try {
            // Ensure we have a left session for fallback responses
            if (!leftSessionId) {
                await createLeftSession()
            }

            if (leftSessionId) {
                const response = await api.chatWithSession({
                    session_id: leftSessionId,
                    message: question
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

    const handleLeftSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!leftQuestion.trim()) return

        setIsLeftLoading(true)

        try {
            // Ensure session is created
            if (!leftSessionId) {
                await createLeftSession()
            }

            // Use session-based chat API (no memory)
            if (leftSessionId) {
                const response = await api.chatWithSession({
                    session_id: leftSessionId,
                    message: leftQuestion
                })

                if (response.success) {
                    const newMessage: ChatMessage = {
                        id: Date.now().toString(),
                        question: leftQuestion,
                        answer: response.message,
                        timestamp: new Date(),
                        hasMemory: false,
                        session_memories: response.memory_context?.memories || []
                    }
                    setLeftMessages(prev => [...prev, newMessage])
                } else {
                    // Fallback to standard response
                    const answer = await generateStandardResponse(leftQuestion)
                    const newMessage: ChatMessage = {
                        id: Date.now().toString(),
                        question: leftQuestion,
                        answer: answer,
                        timestamp: new Date(),
                        hasMemory: false
                    }
                    setLeftMessages(prev => [...prev, newMessage])
                }
            } else {
                // Fallback to standard response if session creation failed
                const answer = await generateStandardResponse(leftQuestion)
                const newMessage: ChatMessage = {
                    id: Date.now().toString(),
                    question: leftQuestion,
                    answer: answer,
                    timestamp: new Date(),
                    hasMemory: false
                }
                setLeftMessages(prev => [...prev, newMessage])
            }

            setLeftQuestion("")
        } catch (error) {
            console.error('Failed to get session response:', error)
            // Fallback to standard response
            const answer = await generateStandardResponse(leftQuestion)
            const newMessage: ChatMessage = {
                id: Date.now().toString(),
                question: leftQuestion,
                answer: answer,
                timestamp: new Date(),
                hasMemory: false
            }
            setLeftMessages(prev => [...prev, newMessage])
            setLeftQuestion("")
        } finally {
            setIsLeftLoading(false)
        }
    }

    const handleRightSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!rightQuestion.trim()) return

        setIsRightLoading(true)

        try {
            // Setup memories if not already done
            // if (!hasSetupMemories) {
            //     await setupTravelMemories()
            // }

            // Ensure session is created
            if (!rightSessionId) {
                await createRightSession()
            }

            // Use session-based chat API (with memory)
            if (rightSessionId) {
                const response = await api.chatWithSession({
                    session_id: rightSessionId,
                    message: rightQuestion
                })

                if (response.success) {
                    console.log('Right session response:', response)
                    console.log('Memory context:', response.memory_context)
                    console.log('Memories:', response.memory_context?.memories)

                    const newMessage: ChatMessage = {
                        id: Date.now().toString(),
                        question: rightQuestion,
                        answer: response.message,
                        timestamp: new Date(),
                        hasMemory: true,
                        session_memories: response.memory_context?.memories || []
                    }
                    console.log('New message with memories:', newMessage)
                    setRightMessages(prev => [...prev, newMessage])
                } else {
                    // Fallback to memory API approach
                    const memoryResponse = await askQuestion(rightQuestion)
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
                        contextualAnswer = await generateStandardResponse(rightQuestion)
                    }

                    const newMessage: ChatMessage = {
                        id: Date.now().toString(),
                        question: rightQuestion,
                        answer: contextualAnswer,
                        timestamp: new Date(),
                        hasMemory: true,
                        confidence,
                        reasoning,
                        supporting_memories
                    }
                    setRightMessages(prev => [...prev, newMessage])
                }
            } else {
                // Fallback to memory API approach if session creation failed
                const memoryResponse = await askQuestion(rightQuestion)
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
                    contextualAnswer = await generateStandardResponse(rightQuestion)
                }

                const newMessage: ChatMessage = {
                    id: Date.now().toString(),
                    question: rightQuestion,
                    answer: contextualAnswer,
                    timestamp: new Date(),
                    hasMemory: true,
                    confidence,
                    reasoning,
                    supporting_memories
                }
                setRightMessages(prev => [...prev, newMessage])
            }

            setRightQuestion("")
        } catch (error) {
            console.error('Failed to get memory-enhanced response:', error)
            // Fallback to standard response
            const fallbackAnswer = await generateStandardResponse(rightQuestion)
            const newMessage: ChatMessage = {
                id: Date.now().toString(),
                question: rightQuestion,
                answer: fallbackAnswer,
                timestamp: new Date(),
                hasMemory: false
            }
            setRightMessages(prev => [...prev, newMessage])
            setRightQuestion("")
        } finally {
            setIsRightLoading(false)
        }
    }

    const handleSampleQuestion = (question: string) => {
        setLeftQuestion(question)
        setRightQuestion(question)
    }

    const clearLeftChat = async () => {
        setLeftMessages([])
        setLeftSessionId(null)
        // Create a new session for fresh conversation
        await createLeftSession()
    }

    const clearRightChat = async () => {
        setRightMessages([])
        setRightSessionId(null)
        // Create a new session for fresh conversation
        await createRightSession()
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
                                        Click any question to test both travel agents with the same query
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
                        Compare how memory transforms travel planning. The standard agent treats each question independently,
                        while the memory-enhanced agent learns your preferences and provides increasingly personalized recommendations.
                    </p>
                </div>

                {/* Setup Memory Button */}
                {!hasSetupMemories && (
                    <div className="text-center">
                        <Button
                            onClick={setupTravelMemories}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <Brain className="w-4 h-4 mr-2" />
                            Load Travel Preferences into Memory
                        </Button>
                        <p className="text-sm text-gray-600 mt-2">
                            This will load sample travel preferences into memory for personalized recommendations
                        </p>
                    </div>
                )}

                {/* Side by Side Chat Interface */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Side - Without Memory */}
                    <ChatBox
                        title="Standard Travel Agent"
                        subtitle="Provides general travel advice but doesn't remember your preferences"
                        messages={leftMessages}
                        input={leftQuestion}
                        onInputChange={setLeftQuestion}
                        onSubmit={handleLeftSubmit}
                        onClearChat={clearLeftChat}
                        isLoading={isLeftLoading}
                        placeholder="Ask about travel plans..."
                        headerIcon={<Compass className="w-5 h-5" />}
                        borderColor="border-orange-200"
                        headerBgColor="bg-orange-50 text-orange-800"
                        messageBgColor="bg-orange-100 text-orange-800"
                        buttonColor="bg-orange-600 hover:bg-orange-700"
                        loadingText="Thinking..."
                        showMemoryIndicators={false}
                    />

                    {/* Right Side - With Memory */}
                    <ChatBox
                        title="Memory-Enhanced Travel Agent"
                        subtitle="Learns your preferences and provides personalized recommendations"
                        messages={rightMessages}
                        input={rightQuestion}
                        onInputChange={setRightQuestion}
                        onSubmit={handleRightSubmit}
                        onClearChat={clearRightChat}
                        isLoading={isRightLoading}
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
                        loadingText="Checking my memory and thinking..."
                        showMemoryIndicators={true}
                    />
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Use This Demo</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
                        <div>
                            <h4 className="font-medium mb-2">1. Start with Basic Questions</h4>
                            <p>Ask both agents the same travel questions to see initial responses.</p>
                        </div>
                        <div>
                            <h4 className="font-medium mb-2">2. Share Your Preferences</h4>
                            <p>Tell the memory-enhanced agent about your travel style, budget, or interests.</p>
                        </div>
                        <div>
                            <h4 className="font-medium mb-2">3. Ask Follow-up Questions</h4>
                            <p>Notice how the memory-enhanced agent remembers your preferences in subsequent responses.</p>
                        </div>
                        <div>
                            <h4 className="font-medium mb-2">4. Compare Responses</h4>
                            <p>See how memory makes recommendations more personalized and contextual over time.</p>
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    )
}
