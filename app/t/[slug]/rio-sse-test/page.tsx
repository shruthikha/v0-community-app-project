'use client'

import { use } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertCircle, User, Bot, Send } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useState, useEffect } from 'react'

export default function RioSseTestPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params)
    const [tenantId, setTenantId] = useState(slug || 'demo-tenant-id') // Initialize with URL slug
    const [threadId] = useState(() => {
        if (typeof window !== 'undefined') {
            const key = `rio-test-thread-${slug || 'demo-tenant-id'}`
            const saved = localStorage.getItem(key)
            if (saved) return saved

            const newId = `thread-${Date.now()}-${Math.random().toString(36).slice(2)}`
            localStorage.setItem(key, newId)
            return newId
        }
        return ''
    })

    const [inputValue, setInputValue] = useState('')

    const chatHelpers = useChat({
        transport: new DefaultChatTransport({
            api: '/api/v1/ai/chat',
            body: {
                tenantId,
                threadId,
            }
        }),
        onError: (err: any) => {
            console.error('Chat error:', err)
        }
    })
    const { messages, sendMessage, status, error } = chatHelpers
    const isLoading = status === 'streaming' || status === 'submitted'

    const onSubmit = async (e: any) => {
        e.preventDefault()
        if (!inputValue.trim()) return

        const userMessage = inputValue
        setInputValue('')

        sendMessage({ text: userMessage })
    }

    return (
        <div className="container max-w-4xl mx-auto p-4 py-8" >
            <Card className="h-[800px] flex flex-col">
                <CardHeader className="border-b">
                    <CardTitle>Río AI Assistant Test</CardTitle>
                    <CardDescription>
                        Validating SSE Pipeline: browser (useChat) <kbd>→</kbd> Vercel BFF <kbd>→</kbd> Railway (Mastra)
                    </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                    {/* Config bar */}
                    <div className="p-4 border-b bg-muted/30 flex gap-4 items-center">
                        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Testing as Tenant:</span>
                        <Input
                            value={tenantId}
                            onChange={(e) => setTenantId(e.target.value)}
                            className="max-w-[200px] h-8"
                            placeholder="Tenant ID"
                        />
                    </div>

                    {/* Messages Area */}
                    <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4">
                            {messages.length === 0 ? (
                                <div className="text-center text-muted-foreground mt-8">
                                    Send a message to start streaming from Río...
                                </div>
                            ) : (
                                messages.map((m: any) => (
                                    <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {m.role !== 'user' && (
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Bot className="w-5 h-5 text-primary" />
                                            </div>
                                        )}

                                        <div className={`rounded-xl px-4 py-3 max-w-[80%] ${m.role === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted'
                                            }`}>
                                            <div className="whitespace-pre-wrap">
                                                {m.parts?.length > 0
                                                    ? m.parts.filter((p: any) => p.type === 'text').map((p: any, i: number) => (
                                                        <span key={i}>{p.text}</span>
                                                    ))
                                                    : m.content
                                                }
                                            </div>
                                        </div>

                                        {m.role === 'user' && (
                                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                                                <User className="w-5 h-5" />
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}

                            {isLoading && (
                                <div className="flex gap-3 justify-start">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="rounded-lg px-4 py-2 bg-muted text-muted-foreground flex items-center gap-1">
                                        <span className="animate-bounce">.</span>
                                        <span className="animate-bounce delay-100">.</span>
                                        <span className="animate-bounce delay-200">.</span>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <Alert variant="destructive" className="mt-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        Failed to send message: {error.message}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Input Area */}
                    <div className="p-4 border-t bg-background">
                        <form onSubmit={onSubmit} className="flex gap-2">
                            <Input
                                value={inputValue}
                                onChange={(e: any) => setInputValue(e.target.value)}
                                placeholder="Type a message to Río..."
                                disabled={isLoading}
                                className="flex-1"
                            />
                            <Button type="submit" disabled={isLoading || !inputValue.trim()}>
                                <Send className="w-4 h-4 mr-2" />
                                Send
                            </Button>
                        </form>
                    </div>
                </CardContent>
            </Card>
        </div >
    )
}
