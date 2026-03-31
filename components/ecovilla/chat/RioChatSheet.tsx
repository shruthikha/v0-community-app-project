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
import { Send, Loader2, Bot, User, FileText, ExternalLink, ChevronDown } from "lucide-react"
import { RioImage } from "@/components/ecovilla/dashboard/RioImage"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import Link from "next/link"

const InlineCitation = ({ index, annotation, tenantSlug }: { index: number, annotation: any, tenantSlug: string }) => {
    if (!annotation) return <span className="text-slate-400">[{index}]</span>;
    const docId = annotation.documentId || annotation.document_id || annotation.id || annotation.doc_id;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className="inline-flex items-center justify-center rounded-[3px] bg-forest-mist/20 hover:bg-forest-mist/40 border border-forest-mist/50 px-1 text-[10px] font-bold text-forest-deep h-3.5 min-w-3.5 mx-0.5 align-baseline transition-colors relative -top-[2px]">
                    {index}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0 bg-white shadow-2xl border border-slate-200 rounded-xl z-50 overflow-hidden" align="start" side="top">
                <div className="p-3 space-y-2.5">
                    <div className="font-bold text-[13px] text-slate-900 mb-1">
                        {docId ? (
                            <Link
                                href={`/t/${tenantSlug}/dashboard/official/${docId}`}
                                className="flex items-center gap-2 hover:text-primary transition-colors group/link"
                            >
                                <FileText className="h-3.5 w-3.5 text-primary group-hover/link:text-forest-canopy" />
                                <span className="text-primary underline decoration-primary/30 underline-offset-4 group-hover/link:decoration-primary font-bold">{annotation.documentName}</span>
                                <ExternalLink className="h-3 w-3 text-primary opacity-0 group-hover/link:opacity-100 transition-opacity" />
                            </Link>
                        ) : (
                            <div className="flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5 text-forest-deep" />
                                <span>{annotation.documentName}</span>
                            </div>
                        )}
                    </div>
                    {annotation.excerpt && (
                        <div className="text-[12px] text-slate-600 italic leading-snug line-clamp-6 border-l-2 border-slate-200 pl-2 py-0.5">
                            "{annotation.excerpt}"
                        </div>
                    )}
                    {docId && (
                        <Button asChild size="sm" className="w-full h-8 text-[11px] mt-1 gap-1.5 bg-forest-deep hover:bg-forest-canopy text-white font-semibold">
                            <Link href={`/t/${tenantSlug}/dashboard/official/${docId}`}>
                                <ExternalLink className="h-3 w-3" />
                                See Document
                            </Link>
                        </Button>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}

const formatMessage = (content: string, annotations: any[] = [], tenantSlug: string) => {
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
                                <InlineCitation index={index} annotation={annotation} tenantSlug={tenantSlug} />
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

const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes (M9)

export function RioChatSheet({
    tenantId,
    tenantSlug,
    userId,
    userName,
    userAvatarUrl
}: {
    tenantId: string,
    tenantSlug: string,
    userId: string,
    userName?: string,
    userAvatarUrl?: string | null
}) {
    const isMobile = useIsMobile()
    const { isOpen, closeChat, initialQuery, openChat } = useRioChat()

    const [threadId, setThreadId] = React.useState<string>("");
    const [initialMessages, setInitialMessages] = React.useState<UIMessage[]>([]);
    const [isRefreshingThread, setIsRefreshingThread] = React.useState(false);
    const [syncError, setSyncError] = React.useState<string | null>(null);

    // Sync Thread ID and Hydrate Messages (Sprint 12 M1-M3)
    React.useEffect(() => {
        if (!isOpen || !userId || !tenantId) return;

        const syncAndHydrate = async () => {
            const key = `rio-chat-thread-${tenantSlug}-${userId}`;
            const activityKey = `rio-chat-activity-${tenantSlug}-${userId}`;

            // 1. Legacy Purge: Force server-authoritative state for Sprint 12 transition
            const hasPurged = sessionStorage.getItem(`${key}-purged`);
            if (!hasPurged) {
                console.log("[RIO-UI] Purging legacy localStorage thread ID for Sprint 12 transition");
                localStorage.removeItem(key);
                localStorage.removeItem(activityKey);
                sessionStorage.setItem(`${key}-purged`, 'true');
            }

            const lastActivity = localStorage.getItem(activityKey);
            const now = Date.now();

            // 1.5 Session Expiry: If the session has timed out, force a brand-new
            // thread. We set forceNewThread=true so the /threads/active lookup is
            // skipped entirely — we never want to reuse an expired session's thread.
            let forceNewThread = false;
            if (lastActivity) {
                const elapsed = now - parseInt(lastActivity, 10);
                if (elapsed > SESSION_TIMEOUT_MS) {
                    console.log(`[RIO-UI] Session expired (${Math.round(elapsed / 1000 / 60)}m inactive). Forcing new thread.`);
                    localStorage.removeItem(key);
                    localStorage.setItem(activityKey, now.toString()); // Refresh timestamp to prevent re-triggering
                    forceNewThread = true;
                }
            }

            setIsRefreshingThread(true);
            setSyncError(null);
            let currentThreadId: string | null = null;

            try {
                // 2. Resolve the thread ID — server-authoritative (M3).
                // Skip /threads/active when forceNewThread is set (expired session) so
                // we never reuse the previous session's thread after expiry.
                if (!forceNewThread) {
                    const activeRes = await fetch(`/api/v1/ai/threads/active?userId=${encodeURIComponent(userId)}&tenantId=${encodeURIComponent(tenantId)}`);
                    if (activeRes.ok) {
                        const activeData = await activeRes.json();
                        if (activeData.threadId) {
                            currentThreadId = activeData.threadId;
                            console.log(`[RIO-UI] Server confirmed active thread.`);
                        }
                    } else {
                        console.warn("[RIO-UI] Could not fetch active thread:", await activeRes.text());
                    }
                }

                // 3. No valid server-side thread (or forced rotation) — create a fresh one.
                if (!currentThreadId) {
                    const newRes = await fetch(`/api/v1/ai/threads/new`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ tenantId })
                    });
                    if (newRes.ok) {
                        const newData = await newRes.json();
                        currentThreadId = newData.threadId;
                        console.log(`[RIO-UI] Created new thread.`);
                    } else {
                        const errorData = await newRes.json().catch(() => ({}));
                        const errorMsg = errorData.error || errorData.detail || "Failed to create thread";
                        console.error("[RIO-UI] Failed to create new thread:", errorMsg);
                        setSyncError(errorMsg);
                    }
                }

                if (currentThreadId) {
                    // If the thread ID changed (rotation/expiry), clear the transcript
                    // atomically before setting the new ID so no stale messages flash.
                    setThreadId(prev => {
                        if (prev && prev !== currentThreadId) {
                            setMessages([]);
                        }
                        return currentThreadId!;
                    });
                    // Update localStorage for session-timeout tracking only (not as source of truth).
                    localStorage.setItem(key, currentThreadId);
                    localStorage.setItem(activityKey, Date.now().toString());
                }

                // 3. Hydrate History (Server-Authoritative M2)
                if (currentThreadId) {
                    const msgRes = await fetch(`/api/v1/ai/threads/messages?threadId=${encodeURIComponent(currentThreadId)}&tenantId=${encodeURIComponent(tenantId)}`);
                    if (msgRes.ok) {
                        const msgData = await msgRes.json();

                        if (msgData.messages && Array.isArray(msgData.messages)) {
                            const transformed: UIMessage[] = msgData.messages.map((m: any, idx: number) => ({
                                id: m.id || `hist-${idx}`,
                                role: m.role as "user" | "assistant",
                                content: m.content,
                                createdAt: m.createdAt ? new Date(m.createdAt) : undefined
                            }));
                            // Merge with existing messages instead of overwriting (CodeRabbit #3005102650)
                            setMessages(prev => {
                                const seenIds = new Set(transformed.map(msg => msg.id));
                                return [...transformed, ...prev.filter(msg => !seenIds.has(msg.id))];
                            });
                        }
                    }
                }
            } catch (err) {
                console.error("[RIO-UI] Failed to sync/hydrate:", err);
                setSyncError("Connection to Rio timed out or failed.");
            } finally {
                setIsRefreshingThread(false);
            }
        };

        syncAndHydrate();
    }, [isOpen, userId, tenantId, tenantSlug]);

    const [input, setInput] = React.useState("")

    const { messages = [], sendMessage, status, error, setMessages } = useChat({
        id: "rio-chat",
        transport: new DefaultChatTransport({
            api: "/api/v1/ai/chat",
            body: {
                tenantId,
                threadId
            }
        })
    })

    // M2: Final combined message set
    const allMessages = messages;

    // Activity Tracking (Sprint 12 M9): Update lastActivityAt on every interaction
    React.useEffect(() => {
        if (allMessages.length > 0) {
            const activityKey = `rio-chat-activity-${tenantSlug}-${userId}`;
            localStorage.setItem(activityKey, Date.now().toString());
        }
    }, [allMessages.length, tenantSlug, userId]);
    const isLoading = status === 'streaming' || status === 'submitted'

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value)
    }

    // Handle initialization with a query from the store.
    // Guard on !isRefreshingThread && !!threadId so the initial send never fires
    // while thread install/hydration is still in progress.
    React.useEffect(() => {
        if (isOpen && initialQuery && !isRefreshingThread && !!threadId) {
            sendMessage({ text: initialQuery })
            // Clear initial query so it doesn't re-trigger on re-renders
            openChat("")
        }
    }, [isOpen, initialQuery, isRefreshingThread, threadId, sendMessage, openChat])

    // Auto-scroll to bottom of messages
    const messagesEndRef = React.useRef<HTMLDivElement>(null)
    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [allMessages])

    // Custom onSubmit to handle empty spaces.
    // Guard on !isRefreshingThread && !!threadId so no messages can be sent
    // while thread install/hydration is in progress.
    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const trimmed = (input || "").trim()
        if (!trimmed || isLoading || isRefreshingThread || !threadId) return
        sendMessage({ text: trimmed })
        setInput("")
    }

    const renderMessageContent = () => (
        <div className="flex flex-col h-full bg-white">
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {allMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 space-y-4">
                        <div className="w-24 h-24 opacity-60 grayscale-[0.2]">
                            {/* @ts-ignore */}
                            <RioImage pose="general" size="lg" />
                        </div>
                        {syncError ? (
                            <div className="space-y-2">
                                <p className="text-sm font-semibold text-red-500">Connection Error</p>
                                <p className="text-xs px-4 max-w-xs mx-auto text-slate-400">{syncError}</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.location.reload()}
                                    className="mt-4 h-7 text-[10px] border-slate-200"
                                >
                                    Retry Connection
                                </Button>
                            </div>
                        ) : (
                            <p className="text-sm px-4 max-w-xs mx-auto">
                                {!threadId && isRefreshingThread ? "Initializing Rio..." : "Hello! I'm Rio. I can help answer questions about your community, facilities, and rules."}
                            </p>
                        )}
                    </div>
                )}

                {allMessages.map((m: any) => {
                    // Extract citations early
                    const citations = m.parts?.find((p: any) => p.type === 'data-citations')?.data || m.annotations || [];

                    // Usage Filtering Logic: Find which citation indices are actually used in the text
                    const messageText = m.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join(' ') || m.content || "";
                    const usedIndices = new Set<number>();
                    const citationMatches = messageText.matchAll(/\[([\d,\s]+)\]/g);
                    for (const match of citationMatches) {
                        match[1].split(',').map((s: string) => s.trim()).forEach((idxStr: string) => {
                            const idx = parseInt(idxStr);
                            if (!isNaN(idx)) usedIndices.add(idx);
                        });
                    }

                    // Filter citations to only those used in text
                    const filteredCitations = citations.filter((_: any, idx: number) => usedIndices.has(idx + 1));

                    return (
                        <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`flex items-start gap-3 max-w-[90%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                                {/* Avatar */}
                                <div className="shrink-0 pt-1">
                                    {m.role === 'user' ? (
                                        <Avatar className="h-8 w-8 border border-forest-mist/50 shadow-sm">
                                            <AvatarImage src={userAvatarUrl || undefined} />
                                            <AvatarFallback className="bg-forest-mist/20 text-[10px] font-bold text-forest-deep">
                                                {userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                    ) : (
                                        <div className="h-8 w-8 flex items-center justify-center pt-1">
                                            {/* @ts-ignore */}
                                            <RioImage pose="general" size="xs" />
                                        </div>
                                    )}
                                </div>

                                {/* Message Bubble */}
                                <div className={`whitespace-pre-wrap px-4 py-3 rounded-2xl text-sm leading-relaxed ${m.role === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-tr-none shadow-md shadow-forest-mist/20'
                                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                                    }`}>
                                    {(() => {
                                        if (m.parts?.length > 0) {
                                            return m.parts
                                                .filter((p: any) => p.type === 'text')
                                                .map((p: any, i: number) => (
                                                    <React.Fragment key={i}>{formatMessage(p.text, citations, tenantSlug)}</React.Fragment>
                                                ));
                                        }
                                        return formatMessage(m.content, citations, tenantSlug);
                                    })()}
                                </div>
                            </div>

                            {/* Annotations / Source Citations Footer */}
                            {filteredCitations.length > 0 && m.role !== 'user' && (
                                <div className="mt-2 ml-11 w-full max-w-[85%]">
                                    <Collapsible className="group">
                                        <CollapsibleTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-7 text-[10px] text-slate-400 hover:text-slate-600 gap-1 px-1 font-medium transition-colors">
                                                <ChevronDown className="h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                                View {filteredCitations.length} {filteredCitations.length === 1 ? 'Source' : 'Sources'}
                                            </Button>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="space-y-2 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                            <div className="flex flex-wrap gap-2">
                                                {filteredCitations.map((ann: any, idx: number) => {
                                                    const originalIndex = citations.indexOf(ann) + 1;
                                                    const docId = ann.documentId || ann.document_id || ann.id || ann.doc_id;
                                                    if (ann && typeof ann === 'object' && ann.documentName) {
                                                        return (
                                                            <Popover key={idx}>
                                                                <PopoverTrigger asChild>
                                                                    <button className="text-[11px] bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-2 py-1.5 rounded-lg max-w-full transition-all cursor-help flex items-center gap-1.5 shadow-sm active:scale-95">
                                                                        <div className="flex items-center justify-center h-4 w-4 rounded bg-slate-100 text-[9px] font-bold text-slate-500 border border-slate-200 shrink-0">
                                                                            {originalIndex}
                                                                        </div>
                                                                        <span className="font-semibold line-clamp-1"> {ann.documentName}</span>
                                                                    </button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-72 p-0 bg-white shadow-2xl border border-slate-200 rounded-xl z-50 overflow-hidden" align="start" side="top">
                                                                    <div className="p-3 space-y-2.5">
                                                                        <div className="font-bold text-[13px] text-slate-900 mb-1">
                                                                            {docId ? (
                                                                                <Link
                                                                                    href={`/t/${tenantSlug}/dashboard/official/${docId}`}
                                                                                    className="flex items-center gap-2 hover:text-primary transition-colors group/link"
                                                                                >
                                                                                    <FileText className="h-3.5 w-3.5 text-primary group-hover/link:text-forest-canopy" />
                                                                                    <span className="text-primary underline decoration-primary/30 underline-offset-4 group-hover/link:decoration-primary font-bold">{ann.documentName}</span>
                                                                                    <ExternalLink className="h-3 w-3 text-primary opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                                                                </Link>
                                                                            ) : (
                                                                                <div className="flex items-center gap-2">
                                                                                    <FileText className="h-3.5 w-3.5 text-forest-deep" />
                                                                                    <span>{ann.documentName}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        {ann.excerpt && (
                                                                            <div className="text-[12px] text-slate-600 italic leading-snug line-clamp-6 border-l-2 border-slate-200 pl-2 py-0.5">
                                                                                "{ann.excerpt}"
                                                                            </div>
                                                                        )}
                                                                        {(ann.documentId || ann.document_id || ann.id || ann.doc_id) && (
                                                                            <Button asChild size="sm" className="w-full h-8 text-[11px] mt-1 gap-1.5 bg-forest-deep hover:bg-forest-canopy text-white font-semibold">
                                                                                <Link href={`/t/${tenantSlug}/dashboard/official/${ann.documentId || ann.document_id || ann.id || ann.doc_id}`}>
                                                                                    <ExternalLink className="h-3 w-3" />
                                                                                    See Document
                                                                                </Link>
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </PopoverContent>
                                                            </Popover>
                                                        )
                                                    }
                                                    return null
                                                })}
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                </div>
                            )}
                        </div>
                    );
                })}

                {isLoading && (
                    <div className="flex items-end gap-2 max-w-[85%] flex-row">
                        <div className="shrink-0 h-8 w-8 bg-forest-mist/20 rounded-full flex items-center justify-center">
                            <Loader2 className="h-4 w-4 text-primary animate-spin" />
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
                        className="flex-1 rounded-full pl-4 pr-12 py-6 bg-slate-50 border-slate-200 focus-visible:ring-forest-deep"
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="absolute right-2 h-8 w-8 rounded-full bg-primary hover:bg-forest-canopy text-primary-foreground transition-all shadow-sm active:scale-95 disabled:opacity-50"
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
                <DrawerContent className="h-[85vh] flex flex-col p-0 bg-white outline-none">
                    <div className="px-6 py-5 flex items-center justify-center gap-3 bg-white transition-colors">
                        <RioImage pose="general" size="sm" />
                        <DrawerTitle className="text-base font-semibold text-slate-800 tracking-tight">Ask me anything...</DrawerTitle>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        {renderMessageContent()}
                    </div>
                </DrawerContent>
            </Drawer>
        )
    }

    return (
        <Sheet open={isOpen} onOpenChange={closeChat}>
            <SheetContent className="w-full sm:max-w-md flex flex-col p-0 border-l border-slate-200 shadow-xl overflow-hidden bg-white outline-none">
                <div className="px-6 py-5 flex items-center justify-center gap-3 bg-white">
                    <RioImage pose="general" size="sm" />
                    <SheetTitle className="text-base font-semibold text-slate-800 tracking-tight">Ask me anything...</SheetTitle>
                </div>
                <div className="flex-1 overflow-hidden">
                    {renderMessageContent()}
                </div>
            </SheetContent>
        </Sheet>
    )
}
