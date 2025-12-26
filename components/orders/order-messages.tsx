'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Message } from '@/lib/types'
import { Send, MessageSquare } from 'lucide-react'

interface OrderMessagesProps {
  orderId: string
  currentUserId: string
}

function getRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

export function OrderMessages({ orderId, currentUserId }: OrderMessagesProps) {
  const [messages, setMessages] = useState<(Message & { sender?: { full_name: string; role: string } })[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    loadMessages()

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel(`messages:${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `order_id=eq.${orderId}`,
        },
        async (payload) => {
          // Fetch sender info for the new message
          const { data: sender } = await supabase
            .from('users')
            .select('full_name, role')
            .eq('id', payload.new.sender_id)
            .single()

          const newMsg = {
            ...payload.new as Message,
            sender: sender || undefined
          }

          setMessages((prev) => [...prev, newMsg as any])

          // Mark as read if not sent by current user
          if (payload.new.sender_id !== currentUserId) {
            await markMessageAsRead(payload.new.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId, currentUserId])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function loadMessages() {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(full_name, role)
        `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setMessages(data || [])

      // Mark all unread messages as read
      const unreadMessages = data?.filter(
        (msg) => msg.sender_id !== currentUserId && !msg.read_by.includes(currentUserId)
      ) || []

      for (const msg of unreadMessages) {
        await markMessageAsRead(msg.id)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  async function markMessageAsRead(messageId: string) {
    try {
      await supabase.rpc('mark_message_read', {
        p_message_id: messageId,
        p_user_id: currentUserId
      })
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          order_id: orderId,
          sender_id: currentUserId,
          content: newMessage.trim(),
          attachments: [],
          read_by: [currentUserId] // Sender has already "read" their own message
        })

      if (error) throw error

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  function getRoleBadgeColor(role: string): string {
    switch (role) {
      case 'customer':
        return 'bg-blue-100 text-blue-800'
      case 'runner':
        return 'bg-green-100 text-green-800'
      case 'tailor':
        return 'bg-purple-100 text-purple-800'
      case 'admin':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" />
          Messages
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Messages List */}
        <ScrollArea className="h-[400px] px-4" ref={scrollRef}>
          {loading ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground gap-2">
              <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
              <p>No messages yet</p>
              <p className="text-xs">Start a conversation about this order</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {messages.map((message) => {
                const isOwnMessage = message.sender_id === currentUserId
                const isRead = message.read_by.length > 1 // More than just the sender

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className={`text-xs ${getRoleBadgeColor(message.sender?.role || 'customer')}`}>
                        {getInitials(message.sender?.full_name || 'U')}
                      </AvatarFallback>
                    </Avatar>

                    <div className={`flex-1 ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                          {isOwnMessage ? 'You' : message.sender?.full_name}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(message.sender?.role || 'customer')} ${isOwnMessage ? 'order-1' : 'order-2'}`}>
                          {message.sender?.role}
                        </span>
                      </div>

                      <div
                        className={`rounded-lg px-4 py-2 max-w-[80%] ${
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{getRelativeTime(new Date(message.created_at))}</span>
                        {isOwnMessage && (
                          <span className="text-xs">
                            {isRead ? '✓✓ Read' : '✓ Sent'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message... (Press Enter to send)"
              className="min-h-[60px] resize-none"
              disabled={sending}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              size="icon"
              className="h-[60px] w-[60px] flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Messages are visible to all parties involved in this order
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
