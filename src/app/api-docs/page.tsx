'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Database, MessageSquare, Brain, Zap } from "lucide-react"
import { Navbar } from "@/components/Navbar"

export default function ApiDocsPage() {
  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">REMEM API Documentation</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Complete API reference for building memory-enhanced AI agents
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm">
              <strong>Base URL:</strong> <code className="bg-blue-100 px-2 py-1 rounded">http://localhost:5001</code>
            </p>
          </div>
        </div>

        <Tabs defaultValue="remem" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="remem">REMEM API</TabsTrigger>
            <TabsTrigger value="demo">DEMO API</TabsTrigger>
          </TabsList>

          <TabsContent value="remem" className="space-y-6">
            <div className="grid gap-6">

              {/* NEME API */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Atomic Memory Operations
                  </CardTitle>
                  <CardDescription>
                    Store, search, and manage individual memories
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                  {/* Create Memory */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="default">POST</Badge>
                      <code className="text-sm">/api/memory</code>
                      <span className="text-sm text-muted-foreground">Create a memory</span>
                    </div>
                    <div className="bg-gray-50 rounded p-3 text-sm">
                      <strong>Request:</strong>
                      <pre className="mt-1 text-xs">{`{
  "text": "I went to Mario's Italian Restaurant",
  "apply_grounding": true
}`}</pre>
                      <strong className="block mt-2">Response:</strong>
                      <pre className="mt-1 text-xs">{`{
  "success": true,
  "memory_id": "memory:550e8400-e29b-41d4...",
  "message": "Memory stored successfully"
}`}</pre>
                    </div>
                  </div>

                  {/* Search Memories */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="default">POST</Badge>
                      <code className="text-sm">/api/memory/search</code>
                      <span className="text-sm text-muted-foreground">Search for memories</span>
                    </div>
                    <div className="bg-gray-50 rounded p-3 text-sm">
                      <strong>Request:</strong>
                      <pre className="mt-1 text-xs">{`{
  "query": "Italian restaurant food",
  "top_k": 5,
  "min_similarity": 0.7
}`}</pre>
                      <strong className="block mt-2">Response:</strong>
                      <pre className="mt-1 text-xs">{`{
  "success": true,
  "memories": [...],
  "count": 3,
  "excluded_memories": [...]
}`}</pre>
                    </div>
                  </div>

                </CardContent>
              </Card>

              {/* K-LINE API */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    K-LINE API - Reasoning Operations
                  </CardTitle>
                  <CardDescription>
                    Reconstruct mental state, ask questions, and higher level memory reasoning
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                  {/* Recall Mental State */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="default">POST</Badge>
                      <code className="text-sm">/api/klines/recall</code>
                      <span className="text-sm text-muted-foreground">Recall a mental state (multiple memories)</span>
                    </div>
                    <div className="bg-gray-50 rounded p-3 text-sm">
                      <strong>Request:</strong>
                      <pre className="mt-1 text-xs">{`{
  "query": "my restaurant experiences",
  "top_k": 5,
  "min_similarity": 0.7
}`}</pre>
                      <strong className="block mt-2">Response:</strong>
                      <pre className="mt-1 text-xs">{`{
  "success": true,
  "mental_state": "Based on your memories...",
  "memories": [...],
  "memory_count": 5
}`}</pre>
                    </div>
                  </div>

                  {/* Ask Question */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="default">POST</Badge>
                      <code className="text-sm">/api/klines/ask</code>
                      <span className="text-sm text-muted-foreground">Ask a question with reasoning</span>
                    </div>
                    <div className="bg-gray-50 rounded p-3 text-sm">
                      <strong>Request:</strong>
                      <pre className="mt-1 text-xs">{`{
  "question": "What restaurants do I like?",
  "top_k": 5
}`}</pre>
                      <strong className="block mt-2">Response:</strong>
                      <pre className="mt-1 text-xs">{`{
  "success": true,
  "answer": "Based on your memories...",
  "confidence": "high",
  "reasoning": "...",
  "supporting_memories": [...]
}`}</pre>
                    </div>
                  </div>

                  {/* Extract Memories */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="default">POST</Badge>
                      <code className="text-sm">/api/klines/extract</code>
                      <span className="text-sm text-muted-foreground">Extract memories from raw text</span>
                    </div>
                    <div className="bg-gray-50 rounded p-3 text-sm">
                      <strong>Request:</strong>
                      <pre className="mt-1 text-xs">{`{
  "raw_input": "Had lunch at Joe's Diner...",
  "context_prompt": "Extract dining experiences",
  "apply_grounding": true
}`}</pre>
                    </div>
                  </div>

                </CardContent>
              </Card>

            </div>
          </TabsContent>

          <TabsContent value="demo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Chat Session API
                </CardTitle>
                <CardDescription>
                  Conversational interface with session management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Create Session */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default">POST</Badge>
                    <code className="text-sm">/api/agent/session</code>
                    <span className="text-sm text-muted-foreground">Create a chat session</span>
                  </div>
                  <div className="bg-gray-50 rounded p-3 text-sm">
                    <strong>Request:</strong>
                    <pre className="mt-1 text-xs">{`{
  "system_prompt": "You are a helpful assistant",
  "session_id": "optional-custom-id",
  "config": {
    "use_memory": true,
    "model": "gpt-4",
    "temperature": 0.7,
    "max_tokens": 1000
  }
}`}</pre>
                    <strong className="block mt-2">Response:</strong>
                    <pre className="mt-1 text-xs">{`{
  "success": true,
  "session_id": "session-uuid",
  "created_at": "2024-01-15T18:30:00Z",
  "use_memory": true
}`}</pre>
                  </div>
                </div>

                {/* Chat with Session */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default">POST</Badge>
                    <code className="text-sm">/api/agent/session/{`{session_id}`}</code>
                    <span className="text-sm text-muted-foreground">Chat with session</span>
                  </div>
                  <div className="bg-gray-50 rounded p-3 text-sm">
                    <strong>Request:</strong>
                    <pre className="mt-1 text-xs">{`{
  "message": "What restaurants have I been to?",
  "top_k": 5,
  "min_similarity": 0.7
}`}</pre>
                    <strong className="block mt-2">Response:</strong>
                    <pre className="mt-1 text-xs">{`{
  "success": true,
  "message": "Based on your memories...",
  "session_id": "session-uuid",
  "memory_context": {
    "memories_used": 3,
    "memories": [...],
    "excluded_memories": [...]
  }
}`}</pre>
                  </div>
                </div>

                {/* Session Management */}
                <div className="border rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">GET</Badge>
                      <code className="text-sm">/api/agent/session/{`{session_id}`}</code>
                      <span className="text-sm text-muted-foreground">Get session info</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">GET</Badge>
                      <code className="text-sm">/api/agent/sessions</code>
                      <span className="text-sm text-muted-foreground">List all sessions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">DELETE</Badge>
                      <code className="text-sm">/api/agent/session/{`{session_id}`}</code>
                      <span className="text-sm text-muted-foreground">Delete session</span>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Start */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Start
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded p-4">
              <h4 className="font-semibold mb-2">Basic Memory Flow:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Store memories: <code>POST /api/memory</code></li>
                <li>Search memories: <code>POST /api/memory/search</code></li>
                <li>Ask questions: <code>POST /api/klines/ask</code></li>
                <li>Create chat session: <code>POST /api/agent/session</code></li>
                <li>Chat with memory: <code>POST /api/agent/session/{`{id}`}</code></li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
