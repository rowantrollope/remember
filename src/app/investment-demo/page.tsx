"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { TrendingUp, Brain, Database, HelpCircle, FileText, BarChart3 } from "lucide-react"
import { PageLayout } from "@/components/PageLayout"
import { ChatCard } from "@/components/ChatCard"
import { ChatMessage } from "@/components/ChatBox"
import { useMemoryAPI } from "@/hooks"
import { useSettings } from "@/hooks/useSettings"

// Sample Microsoft 10Q filing content for analysis
const microsoft10Q = `MICROSOFT CORPORATION
FORM 10-Q
For the Quarter Ended September 30, 2024

INCOME STATEMENTS
(In millions, except per share amounts) (Unaudited)

Three Months Ended September 30,
                                    2024        2023
Revenue:
Product                           $15,272     $15,535
Service and other                  50,313      40,982
Total revenue                      65,585      56,517

Cost of revenue:
Product                            3,294       3,531
Service and other                 16,805      12,771
Total cost of revenue             20,099      16,302

Gross margin                      45,486      40,215

Research and development           7,544       6,659
Sales and marketing               5,717       5,187
General and administrative        1,673       1,474

Operating income                  30,552      26,895
Other income (expense), net         (283)        389
Income before income taxes        30,269      27,284
Provision for income taxes         5,602       4,993
Net income                       $24,667     $22,291

Earnings per share:
Basic                             $3.32       $3.00
Diluted                           $3.30       $2.99

BUSINESS HIGHLIGHTS:
- Total revenue increased 16% year-over-year to $65.6 billion
- Operating income increased 14% to $30.6 billion
- Net income increased 11% to $24.7 billion
- Microsoft Cloud revenue increased 22% to $38.9 billion
- Azure and other cloud services revenue increased 33%
- Office 365 Commercial products revenue increased 13%
- Windows Commercial products revenue increased 10%
- Xbox content and services revenue increased 61%

KEY RISKS:
- Intense competition in cloud computing and AI services
- Cybersecurity threats and data breaches
- Regulatory scrutiny under competition laws
- Dependence on third-party suppliers and partners
- Foreign exchange rate fluctuations
- Economic downturns affecting IT spending
- Talent acquisition and retention challenges

FORWARD-LOOKING STATEMENTS:
Microsoft expects continued growth in cloud services, driven by AI and machine learning capabilities. The company is investing heavily in data center infrastructure and AI research to maintain competitive advantages.`

// Demo memories for financial analysis context
const analysisMemories = [
    "Focus on revenue growth trends and year-over-year comparisons",
    "Pay attention to cloud computing and AI business segments",
    "Consider regulatory risks and competition law impacts",
    "Analyze operating margins and cost structure efficiency",
    "Evaluate research and development investment levels",
    "Review cash flow generation and capital allocation",
    "Assess market position in enterprise software and cloud services",
    "Monitor subscription revenue growth and customer retention",
    "Consider geopolitical risks and international exposure",
    "Analyze competitive positioning against other tech giants"
]

// Sample questions that demonstrate memory value for 10Q analysis
const sampleQuestions = [
    "What was Microsoft's revenue growth this quarter?",
    "How did Azure perform compared to last year?",
    "What are the main risks Microsoft is facing?",
    "Should I invest in Microsoft based on this 10Q?",
    "How is Microsoft's cloud business performing?",
    "What are Microsoft's key growth drivers?",
    "How profitable is Microsoft's AI business?",
    "What regulatory challenges is Microsoft facing?"
]



export default function InvestmentDemo() {
    const [activeTab, setActiveTab] = useState("standard")
    const [standardQuestion, setStandardQuestion] = useState("")
    const [memoryQuestion, setMemoryQuestion] = useState("")
    const [standardMessages, setStandardMessages] = useState<ChatMessage[]>([])
    const [memoryMessages, setMemoryMessages] = useState<ChatMessage[]>([])
    const [isStandardLoading, setIsStandardLoading] = useState(false)
    const [isMemoryLoading, setIsMemoryLoading] = useState(false)
    const [hasSetupMemories, setHasSetupMemories] = useState(false)
    const [showHelpDialog, setShowHelpDialog] = useState(false)
    const [documentContent, setDocumentContent] = useState(microsoft10Q)
    const { apiStatus, error, clearError, saveMemory, askQuestion } = useMemoryAPI()
    const { settings } = useSettings()



    const setupDocumentMemories = async () => {
        if (hasSetupMemories) return

        try {
            // Save the document content as memory for analysis
            await saveMemory(`Microsoft 10Q Financial Document: ${documentContent}`)

            // Save some context about the document
            for (const memory of analysisMemories) {
                await saveMemory(memory)
            }
            setHasSetupMemories(true)
        } catch (error) {
            console.error('Failed to setup document memories:', error)
        }
    }

    const generateDocumentBasedResponse = async (question: string): Promise<string> => {
        try {
            // Use the memory API but don't save the conversation to memory
            // This gives access to the document but no conversation history
            const result = await askQuestion(`Based on the Microsoft 10Q filing, please answer: ${question}`, settings.questionTopK, settings.minSimilarity)

            if (result && typeof result === 'object' && result.success) {
                return result.conversation.answer
            }
        } catch (error) {
            console.error('Failed to get document-based response:', error)
        }

        // Fallback to generic response if API fails
        const responses = [
            "Based on the financial document, this requires careful analysis of the quarterly metrics and performance indicators.",
            "The 10Q filing contains relevant information, but I'd need to examine the specific financial statements more closely.",
            "This question relates to the company's quarterly performance. Key metrics like revenue growth and profitability are important factors.",
            "The quarterly report provides insights into this topic. Consider reviewing the income statement and cash flow data.",
            "This analysis would benefit from examining the specific financial data and year-over-year comparisons in the filing."
        ]
        return responses[Math.floor(Math.random() * responses.length)]
    }

    const handleStandardSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!standardQuestion.trim()) return

        setIsStandardLoading(true)

        // Get document-based response but without conversation memory
        const answer = await generateDocumentBasedResponse(standardQuestion)

        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            question: standardQuestion,
            answer: answer,
            timestamp: new Date(),
            hasMemory: false
        }

        setStandardMessages(prev => [...prev, newMessage])
        setStandardQuestion("")
        setIsStandardLoading(false)
    }

    const handleMemorySubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!memoryQuestion.trim()) return

        setIsMemoryLoading(true)

        // Setup memories if not already done
        if (!hasSetupMemories) {
            await setupDocumentMemories()
        }

        try {
            // Use memory-enhanced analysis that builds conversation context
            const contextualQuestion = `As a financial analyst with access to Microsoft's 10Q filing and previous conversation history, please analyze and answer: ${memoryQuestion}`

            const result = await askQuestion(contextualQuestion, settings.questionTopK, settings.minSimilarity)

            let answer = "I'd be happy to help with your financial analysis question based on the Microsoft 10Q filing."

            if (result && typeof result === 'object' && result.success) {
                answer = result.conversation.answer

                // Save this conversation to memory for future context
                await saveMemory(`User asked: "${memoryQuestion}" and I responded: "${answer}"`)
            }

            const newMessage: ChatMessage = {
                id: Date.now().toString(),
                question: memoryQuestion,
                answer: answer,
                created_at: new Date(),
                hasMemory: true
            }

            setMemoryMessages(prev => [...prev, newMessage])
            setMemoryQuestion("")
        } catch (error) {
            console.error('Failed to get memory-enhanced response:', error)
        } finally {
            setIsMemoryLoading(false)
        }
    }

    const handleSampleQuestion = (question: string) => {
        setStandardQuestion(question)
        setMemoryQuestion(question)
    }

    const clearStandardChat = () => {
        setStandardMessages([])
    }

    const clearMemoryChat = () => {
        setMemoryMessages([])
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
                        <TrendingUp className="w-8 h-8 text-green-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Financial Document Analysis Demo</h1>
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
                                        These questions demonstrate how memory helps provide detailed financial document analysis
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-3 py-4">
                                    {sampleQuestions.map((question, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <span className="text-sm">{question}</span>
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => {
                                                    handleSampleQuestion(question)
                                                    setShowHelpDialog(false)
                                                }}
                                            >
                                                Use This
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <p className="text-lg text-gray-600 max-w-4xl mx-auto">
                        Compare how a financial analyst performs with and without conversation memory when analyzing company documents.
                        Switch between tabs to see how both can analyze the Microsoft 10Q filing, but the memory-enhanced version
                        remembers previous questions and builds context over time, enabling more sophisticated follow-up analysis.
                    </p>
                </div>

                {/* Document Analysis Section */}
                <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-green-600" />
                            Microsoft 10Q Filing - Q1 2024
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                            Analyze this quarterly report and ask questions to see how memory improves financial analysis
                        </p>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={documentContent}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDocumentContent(e.target.value)}
                            className="min-h-[200px] font-mono text-xs"
                            placeholder="Paste a company's 10Q filing or earnings transcript here..."
                        />
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                                <p className="text-lg font-bold text-green-600">$65.6B</p>
                                <p className="text-sm text-gray-600">Q1 Revenue</p>
                            </div>
                            <div>
                                <p className="text-lg font-bold text-green-600">+16%</p>
                                <p className="text-sm text-gray-600">YoY Growth</p>
                            </div>
                            <div>
                                <p className="text-lg font-bold text-blue-600">$24.7B</p>
                                <p className="text-sm text-gray-600">Net Income</p>
                            </div>
                            <div>
                                <p className="text-lg font-bold text-purple-600">+33%</p>
                                <p className="text-sm text-gray-600">Azure Growth</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Setup Memory Button */}
                {!hasSetupMemories && (
                    <div className="text-center">
                        <Button
                            onClick={setupDocumentMemories}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <Database className="w-4 h-4 mr-2" />
                            Load Document into Memory
                        </Button>
                        <p className="text-sm text-gray-600 mt-2">
                            This will load the 10Q document into memory for enhanced financial analysis
                        </p>
                    </div>
                )}

                {/* Tabbed Chat Interface */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="standard" className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Document Analyst (No Conversation Memory)
                        </TabsTrigger>
                        <TabsTrigger value="memory" className="flex items-center gap-2">
                            <Brain className="w-4 h-4" />
                            Memory-Enhanced Analyst
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="standard" className="space-y-6">
                        <ChatCard
                            title="Document Analyst (No Conversation Memory)"
                            subtitle="Analyzes the 10Q document but treats each question independently"
                            messages={standardMessages}
                            input={standardQuestion}
                            onInputChange={setStandardQuestion}
                            onSubmit={handleStandardSubmit}
                            onClearChat={clearStandardChat}
                            isLoading={isStandardLoading}
                            placeholder="Ask about Microsoft's financials..."
                            headerIcon={<BarChart3 className="w-5 h-5" />}
                            borderColor="border-orange-200"
                            headerBgColor="bg-orange-50 text-orange-800"
                            messageBgColor="bg-gray-100 text-gray-800"
                            buttonColor="bg-orange-600 hover:bg-orange-700"
                            loadingText="Thinking..."
                            showMemoryIndicators={false}
                        />
                    </TabsContent>

                    <TabsContent value="memory" className="space-y-6">
                        <ChatCard
                            title="Memory-Enhanced Analyst"
                            subtitle="Analyzes the 10Q document AND remembers conversation history for context"
                            messages={memoryMessages}
                            input={memoryQuestion}
                            onInputChange={setMemoryQuestion}
                            onSubmit={handleMemorySubmit}
                            onClearChat={clearMemoryChat}
                            isLoading={isMemoryLoading}
                            placeholder="Ask about Microsoft's financials..."
                            headerIcon={<Brain className="w-5 h-5" />}
                            borderColor="border-green-200"
                            headerBgColor="bg-green-50 text-green-800"
                            messageBgColor="bg-green-100 text-green-800"
                            buttonColor="bg-green-600 hover:bg-green-700"
                            loadingText="Analyzing with document + conversation history..."
                            showMemoryIndicators={false}
                            badge={hasSetupMemories && (
                                <Badge variant="secondary" className="bg-green-100 text-green-700">
                                    Document + History Loaded
                                </Badge>
                            )}
                        />
                    </TabsContent>
                </Tabs>

                {/* Explanation Section */}
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Brain className="w-5 h-5" />
                            Why Memory Matters for Financial Document Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold text-orange-800 mb-2">Without Conversation Memory</h4>
                                <ul className="space-y-1 text-sm text-gray-600">
                                    <li>• Can analyze the 10Q document content</li>
                                    <li>• Treats each question independently</li>
                                    <li>• Cannot build on previous analysis</li>
                                    <li>• No awareness of conversation context</li>
                                    <li>• Repeats similar analysis for related questions</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold text-green-800 mb-2">With Conversation Memory</h4>
                                <ul className="space-y-1 text-sm text-gray-600">
                                    <li>• Analyzes 10Q document with full context</li>
                                    <li>• Remembers previous questions and answers</li>
                                    <li>• Builds sophisticated follow-up analysis</li>
                                    <li>• References earlier conversation points</li>
                                    <li>• Provides deeper, contextual insights over time</li>
                                </ul>
                            </div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-blue-800 text-sm">
                                <strong>For Investors:</strong> Conversation memory enables sophisticated financial analysis
                                that builds context over multiple questions, leading to deeper insights and more nuanced understanding.
                            </p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-green-800 text-sm">
                                <strong>For Developers:</strong> This demonstrates how conversation memory transforms document analysis
                                from isolated Q&A into intelligent, context-aware financial advisory systems.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    )
}
