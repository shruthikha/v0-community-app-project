"use client"

import React, { useState, useRef, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { Send, User, Shield, MessageCircle, MoreVertical, Edit2, Trash2, X, Check } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import type { Comment } from "@/types/requests"
import { addRequestComment, updateRequestComment, deleteRequestComment } from "@/app/actions/resident-requests"
import { toast } from "sonner"

interface RequestCommentsProps {
    requestId: string
    tenantId: string
    tenantSlug: string
    initialComments: Comment[]
    currentUserId: string
    isAdmin?: boolean
}

export function RequestComments({
    requestId,
    tenantId,
    tenantSlug,
    initialComments = [],
    currentUserId,
    isAdmin = false,
}: RequestCommentsProps) {
    const [comments, setComments] = useState<Comment[]>(initialComments)
    const [newComment, setNewComment] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValue, setEditValue] = useState("")
    const [isEditing, setIsEditing] = useState(false)

    // Delete state
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Auto-scroll to bottom when new comments arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [comments])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim() || isSubmitting) return

        setIsSubmitting(true)
        try {
            const result = await addRequestComment(requestId, tenantId, tenantSlug, newComment)

            if (result.success && result.comment) {
                setComments((prev) => [...prev, result.comment as Comment])
                setNewComment("")
                toast.success("Comment added")
            } else {
                toast.error(result.error || "Failed to add comment")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleUpdate = async () => {
        if (!editingId || !editValue.trim() || isEditing) return

        setIsEditing(true)
        try {
            const result = await updateRequestComment(editingId, requestId, tenantId, tenantSlug, editValue)
            if (result.success) {
                setComments(prev => prev.map(c => c.id === editingId ? { ...c, content: editValue, updated_at: new Date().toISOString() } : c))
                setEditingId(null)
                setEditValue("")
                toast.success("Comment updated")
            } else {
                toast.error(result.error || "Failed to update comment")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setIsEditing(false)
        }
    }

    const handleDelete = async () => {
        if (!deletingId || isDeleting) return

        setIsDeleting(true)
        try {
            const result = await deleteRequestComment(deletingId, requestId, tenantId, tenantSlug)
            if (result.success) {
                setComments(prev => prev.filter(c => c.id !== deletingId))
                setDeletingId(null)
                toast.success("Comment deleted")
            } else {
                toast.error(result.error || "Failed to delete comment")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
            setDeletingId(null)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Card className="flex flex-col min-h-[300px] max-h-[600px] border shadow-sm mt-4">
            <CardHeader className="px-4 py-3 border-b bg-muted/20 shrink-0">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <MessageCircle className="w-4 h-4 text-primary" />
                    Conversation Thread
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden bg-muted/5">
                <ScrollArea className="h-full">
                    <div className="flex flex-col gap-4 p-4">
                        {comments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center">
                                <MessageCircle className="w-10 h-10 mb-3 text-muted/60" />
                                <p className="text-foreground font-medium">No messages yet</p>
                                <p className="text-sm">Start the conversation below.</p>
                            </div>
                        ) : (
                            <AnimatePresence initial={false}>
                                {comments.map((comment, index) => {
                                    const isMe = comment.author_id === currentUserId
                                    const isAuthorStaff = comment.author?.role === 'tenant_admin' ||
                                        comment.author?.role === 'super_admin' ||
                                        comment.author?.is_tenant_admin === true

                                    return (
                                        <motion.div
                                            key={comment.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex gap-3 group ${isMe ? "flex-row-reverse" : "flex-row"}`}
                                        >
                                            <Avatar className="w-8 h-8 border shadow-sm shrink-0">
                                                <AvatarImage src={comment.author?.profile_picture_url || ""} />
                                                <AvatarFallback>
                                                    <User className="w-4 h-4" />
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className={`flex flex-col max-w-[80%] ${isMe ? "items-end" : "items-start"}`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-semibold">
                                                        {isMe ? "You" : `${comment.author?.first_name} ${comment.author?.last_name}`}
                                                    </span>
                                                    {isAuthorStaff && (
                                                        <Badge variant="secondary" className="px-1 py-0 text-[10px] uppercase tracking-wider">
                                                            Staff
                                                        </Badge>
                                                    )}
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                                    </span>
                                                </div>

                                                <div className={`relative flex items-start gap-2 w-full ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                                    {editingId === comment.id ? (
                                                        <div className={`flex flex-col gap-2 w-full ${isMe ? "items-end" : "items-start"}`}>
                                                            <Textarea
                                                                autoFocus
                                                                value={editValue}
                                                                onChange={(e) => {
                                                                    setEditValue(e.target.value)
                                                                    e.target.style.height = 'inherit'
                                                                    e.target.style.height = `${e.target.scrollHeight}px`
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                                        e.preventDefault()
                                                                        handleUpdate()
                                                                    } else if (e.key === 'Escape') {
                                                                        e.preventDefault()
                                                                        setEditingId(null)
                                                                    }
                                                                }}
                                                                className="resize-none min-h-[60px] md:min-w-[300px] w-full text-foreground bg-background text-sm p-3 border shadow-sm rounded-xl focus-visible:ring-1"
                                                            />
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setEditingId(null)} disabled={isEditing}>
                                                                    Cancel
                                                                </Button>
                                                                <Button size="sm" className="h-8 text-xs" onClick={handleUpdate} disabled={isEditing || !editValue.trim() || editValue === comment.content}>
                                                                    Save changes
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className={`rounded-2xl px-4 py-2 text-sm shadow-sm whitespace-pre-wrap break-words ${isMe
                                                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                                                : "bg-muted text-foreground rounded-tl-none"
                                                                }`}
                                                        >
                                                            {comment.content}
                                                        </div>
                                                    )}

                                                    {!editingId && (isMe || isAdmin) && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 md:opacity-0 group-hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100 transition-opacity">
                                                                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align={isMe ? "end" : "start"} className="w-40">
                                                                {isMe && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setEditingId(comment.id)
                                                                            setEditValue(comment.content)
                                                                        }}
                                                                    >
                                                                        <Edit2 className="h-4 w-4 mr-2" />
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {isMe && <DropdownMenuSeparator />}
                                                                {(isMe || isAdmin) && (
                                                                    <DropdownMenuItem
                                                                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                                                        onClick={() => setDeletingId(comment.id)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </AnimatePresence>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>
            </CardContent>

            <CardFooter className="p-3 border-t bg-background mt-auto">
                <form onSubmit={handleSubmit} className="flex flex-col w-full gap-2">
                    <div className="relative">
                        <Textarea
                            placeholder="Write a message..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="resize-none min-h-[80px] pr-12 focus-visible:ring-primary/20 transition-all border-muted"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSubmit(e)
                                }
                            }}
                        />
                        <Button
                            size="icon"
                            type="submit"
                            disabled={isSubmitting || !newComment.trim()}
                            className="absolute right-2 bottom-2 rounded-full h-8 w-8 transition-transform active:scale-95"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground px-1">
                        Press Enter to send, Shift + Enter for new line.
                    </p>
                </form>
            </CardFooter>

            <AlertDialog open={!!deletingId} onOpenChange={(open) => {
                if (!open && !isDeleting) setDeletingId(null)
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this comment? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                handleDelete()
                            }}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    )
}
