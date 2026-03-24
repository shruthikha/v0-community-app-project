"use client"

import * as React from "react"
import { useChat, UIMessage } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useRioChat } from "@/hooks/use-rio-chat"
import { useIsMobile } from "@/hooks/use-mobile"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, Loader2, Bot, User, FileText } from "lucide-react"
import { RioImage } from "@/components/ecovilla/dashboard/RioImage"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const InlineCitation = ({ index, annotation }: { index: number, annotation: any }) => {
    if (!annotation) return <span className="text-slate-400">[{index}]</span>;
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className="inline-flex items-center justify-center rounded-[3px] bg-slate-100 hover:bg-slate-200 border border-slate-300 px-1 text-[10px] font-bold text-slate-600 h-3.5 min-w-3.5 mx-0.5 align-baseline transition-colors relative -top-[2px]">
                    {index}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3 bg-white shadow-2xl border border-slate-200 rounded-xl z-50 pointer-events-auto" align="start" side="top">
                <div className="space-y-2">
                    <div className="font-semibold text-[13px] text-slate-900 flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-blue-500" />
                        <span className="line-clamp-1">{annotation.documentName}</span>
                    </div>
                    {annotation.excerpt && (
                        <div className="text-[12px] text-slate-600 italic leading-snug line-clamp-5 border-l-2 border-slate-200 pl-2 py-0.5">
                            "{annotation.excerpt}"
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}

const formatMessage = (content: string, annotations: any[] = []) => {
    if (!content) return null;

    // Pattern for [1], [2], [1, 2], [1, 2, 3] etc.
    // We match the whole bracketed group including commas and spaces
    if (!content.includes('[')) return [content];
    const parts = content.split(/(\[[\d,\s]+\])/g);

    return parts.map((part, i) => {
        const match = part.match(/\[([\d,\s]+)\]/);
        if (match) {
            // Split by comma and trim to get individual indices
            const indices = match[1].split(',').map(s => s.trim()).filter(Boolean);
            return (
                <span key={i} className="inline-flex items-center">
                    {indices.map((idxStr, j) => {
                        const index = parseInt(idxStr);
                        const annotation = annotations[index - 1];
                        return (
                            <React.Fragment key={j}>
                                <InlineCitation index={index} annotation={annotation} />
                                {j < indices.length - 1 && <span className="text-slate-400 mr-0.5 text-[10px] -top-[2px] relative">,</span>}
                            </React.Fragment>
                        );
                    })}
                </span>
            );
        }
        return <span key={i}>{part}</span>;
    });
};

export function RioChatSheet({
    tenantId,
    tenantSlug,
    userId
}: {
    tenantId: string,
    tenantSlug: string,
    userId: string
}) {
    const isMobile = useIsMobile()
    const { isOpen, closeChat, initialQuery, openChat } = useRioChat()

    const [threadId, setThreadId] = React.useState<string>("");
    const [isRefreshingThread, setIsRefreshingThread] = React.useState(false);

    // Sync Thread ID across devices
    React.useEffect(() => {
        if (!isOpen || !userId || !tenantId) return;

        const syncThread = async () => {
            const key = `rio-chat-thread-${tenantSlug}-${userId}`;
            const local = localStorage.getItem(key);

            if (local) {
                setThreadId(local);
                return;
            }

            setIsRefreshingThread(true);
            try {
                // Fetch last active thread from backend
                const res = await fetch(`/api/v1/ai/threads/active?userId=${userId}&tenantId=${tenantId}`);
                const data = await res.json();

                if (data.threadId) {
                    setThreadId(data.threadId);
                    localStorage.setItem(key, data.threadId);
                } else {
                    // Generate new if none exists
                    const newId = `thread-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                    setThreadId(newId);
                    localStorage.setItem(key, newId);
                }
            } catch (err) {
                console.error("RioChatSheet: Failed to sync thread", err);
            } finally {
                setIsRefreshingThread(false);
            }
        };

        syncThread();
    }, [isOpen, userId, tenantId, tenantSlug]);

    const [input, setInput] = React.useState("")

    const { messages = [], sendMessage, status, error } = useChat({
        id: "rio-chat",
        transport: new DefaultChatTransport({
            api: "/api/v1/ai/chat",
            body: {
                tenantId,
                threadId
            }
        })
    })

    const isLoading = status === 'streaming' || status === 'submitted'

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value)
    }

    // Handle initialization with a query from the store
    React.useEffect(() => {
        if (isOpen && initialQuery) {
            sendMessage({ text: initialQuery })
            // Clear initial query so it doesn't re-trigger on re-renders
            openChat("")
        }
    }, [isOpen, initialQuery, sendMessage, openChat])

    // Auto-scroll to bottom of messages
    const messagesEndRef = React.useRef<HTMLDivElement>(null)
    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // Custom onSubmit to handle empty spaces
    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const trimmed = (input || "").trim()
        if (!trimmed || isLoading) return
        sendMessage({ text: trimmed })
        setInput("")
    }

    const renderMessageContent = () => (
        <div className="flex flex-col h-full bg-slate-50/50">
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 space-y-4">
                        <div className="w-24 h-24">
                            {/* @ts-ignore */}
                            <RioImage pose="general" size="lg" />
                        </div>
                        <p className="text-sm px-4">Hello! I'm Rio. I can help answer questions about your community, facilities, and rules.</p>
                    </div>
                )}

                {messages.map((m: any) => (
                    <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`flex items-end gap-2 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                            {/* Avatar */}
                            <div className="shrink-0">
                                {m.role === 'user' ? (
                                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <User className="h-4 w-4 text-blue-600" />
                                    </div>
                                ) : (
                                    <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                                        <Bot className="h-4 w-4 text-orange-600" />
                                    </div>
                                )}
                            </div>

                            {/* Message Bubble */}
                            <div className={`whitespace-pre-wrap px-4 py-2 rounded-2xl text-sm leading-relaxed ${m.role === 'user'
                                ? 'bg-orange-500 text-white rounded-br-sm'
                                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
                                }`}>
                                {(() => {
                                    // #197 Remediation: Extract citations from parts (data-citations)
                                    // DefaultChatTransport in AI SDK v6+ populates m.parts instead of m.annotations for data chunks
                                    const citations = m.parts?.find((p: any) => p.type === 'data-citations')?.data || m.annotations || [];

                                    if (m.parts?.length > 0) {
                                        return m.parts
                                            .filter((p: any) => p.type === 'text')
                                            .map((p: any, i: number) => (
                                                <React.Fragment key={i}>{formatMessage(p.text, citations)}</React.Fragment>
                                            ));
                                    }
                                    return formatMessage(m.content, citations);
                                })()}
                            </div>
                        </div>

                        {/* Annotations / Source Citations (#197) */}
                        {(() => {
                            const citations = m.parts?.find((p: any) => p.type === 'data-citations')?.data || m.annotations || [];

                            if (citations.length > 0 && m.role !== 'user') {
                                return (
                                    <div className="mt-2 ml-10 flex flex-wrap gap-2 max-w-[80%]">
                                        {citations.map((ann: any, idx: number) => {
                                            if (ann && typeof ann === 'object' && ann.documentName) {
                                                return (
                                                    <Popover key={idx}>
                                                        <PopoverTrigger asChild>
                                                            <button className="text-[11px] bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 px-2 py-1 rounded-md max-w-full transition-colors cursor-help flex items-center gap-1.5">
                                                                <FileText className="h-3 w-3 text-blue-500 shrink-0" />
                                                                <span className="font-medium line-clamp-1"> {ann.documentName}</span>
                                                            </button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-72 p-3 bg-white shadow-2xl border border-slate-200 rounded-xl z-50" align="start" side="top">
                                                            <div className="space-y-2">
                                                                <div className="font-semibold text-[13px] text-slate-900 flex items-center gap-2">
                                                                    <FileText className="h-3.5 w-3.5 text-blue-500" />
                                                                    <span className="line-clamp-1">{ann.documentName}</span>
                                                                </div>
                                                                {ann.excerpt && (
                                                                    <div className="text-[12px] text-slate-600 italic leading-snug line-clamp-6 border-l-2 border-slate-200 pl-2 py-0.5">
                                                                        "{ann.excerpt}"
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                )
                                            }
                                            return null
                                        })}
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex items-end gap-2 max-w-[85%] flex-row">
                        <div className="shrink-0 h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <Loader2 className="h-4 w-4 text-orange-600 animate-spin" />
                        </div>
                        <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-500 rounded-bl-sm shadow-sm">
                            <span className="inline-flex gap-1">
                                <span className="animate-bounce">.</span>
                                <span className="animate-bounce delay-75">.</span>
                                <span className="animate-bounce delay-150">.</span>
                            </span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {error && (
                <div className="mx-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm mb-2">
                    Failed to send: {error.message}
                </div>
            )}

            <div className="p-3 bg-white border-t border-slate-200">
                <form onSubmit={onSubmit} className="flex items-center gap-2 relative">
                    <Input
                        value={input || ""}
                        onChange={handleInputChange}
                        placeholder="Ask Rio anything..."
                        className="flex-1 rounded-full pl-4 pr-12 py-6 bg-slate-50 border-slate-200 focus-visible:ring-orange-500"
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="absolute right-2 h-8 w-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white transition-opacity disabled:opacity-50"
                        disabled={isLoading || !input?.trim()}
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 -ml-0.5" />}
                        <span className="sr-only">Send message</span>
                    </Button>
                </form>
            </div>
        </div>
    )

    if (isMobile) {
        return (
            <Drawer open={isOpen} onOpenChange={closeChat}>
                <DrawerContent className="h-[85vh] flex flex-col p-0">
                    <DrawerHeader className="border-b px-4 py-3 text-left">
                        <DrawerTitle className="text-lg font-semibold flex items-center gap-2">
                            <span className="text-2xl">🦜</span> Chat with Rio
                        </DrawerTitle>
                    </DrawerHeader>
                    <div className="flex-1 overflow-hidden">
                        {renderMessageContent()}
                    </div>
                </DrawerContent>
            </Drawer>
        )
    }

    return (
        <Sheet open={isOpen} onOpenChange={closeChat}>
            <SheetContent className="w-full sm:max-w-md flex flex-col p-0 border-l border-slate-200 shadow-xl overflow-hidden">
                <SheetHeader className="border-b px-6 py-4 bg-white z-10">
                    <SheetTitle className="text-lg font-semibold flex items-center gap-2">
                        <span className="text-2xl">🦜</span> Chat with Rio
                    </SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-hidden">
                    {renderMessageContent()}
                </div>
            </SheetContent>
        </Sheet>
    )
}
