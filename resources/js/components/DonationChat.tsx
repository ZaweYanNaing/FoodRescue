import { useEffect, useState, useRef, FormEvent } from 'react';
import { Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { getStoredUser } from '@/lib/auth';

export type Message = {
    id: number;
    donation_id: number;
    sender_id: number;
    content: string;
    created_at: string;
    sender?: {
        id: number;
        name: string;
    };
};

interface DonationChatProps {
    donationId: number;
}

export default function DonationChat({ donationId }: DonationChatProps) {
    const user = getStoredUser();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fetchMessages = async () => {
        try {
            const { data } = await api.get<Message[]>(`/donations/${donationId}/messages`);
            setMessages(data);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchMessages();

        // Polling every 3 seconds
        const intervalId = setInterval(fetchMessages, 3000);

        return () => {
            clearInterval(intervalId);
        };
    }, [donationId]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault();
        
        if (!newMessage.trim() || !user) return;

        const messageText = newMessage.trim();
        setNewMessage('');
        setIsSending(true);

        // Optimistic update
        const tempId = Date.now();
        const optimisticMessage: Message = {
            id: tempId,
            donation_id: donationId,
            sender_id: user.id,
            content: messageText,
            created_at: new Date().toISOString(),
            sender: {
                id: user.id,
                name: user.name,
            },
        };

        setMessages((prev) => [...prev, optimisticMessage]);

        try {
            const { data } = await api.post<Message>(`/donations/${donationId}/messages`, {
                content: messageText,
            });
            
            // Replace the optimistic message with the real one from the server
            setMessages((prev) => prev.map((msg) => (msg.id === tempId ? data : msg)));
        } catch (error) {
            console.error('Failed to send message:', error);
            // Revert optimistic update on failure
            setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex h-[400px] flex-col rounded-xl border border-sidebar-border/70 bg-card shadow-sm dark:border-sidebar-border">
            {/* Header */}
            <div className="border-b border-sidebar-border/70 p-4">
                <h3 className="font-semibold">Chat</h3>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        No messages yet. Send a message to start the conversation!
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMine = msg.sender_id === user?.id;
                        return (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                            >
                                <div
                                    className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                                        isMine
                                            ? 'bg-blue-600 text-white rounded-br-sm'
                                            : 'bg-muted text-foreground rounded-bl-sm'
                                    }`}
                                >
                                    {msg.content}
                                </div>
                                <span className="mt-1 text-[10px] text-muted-foreground">
                                    {isMine ? 'You' : msg.sender?.name || 'Unknown'} •{' '}
                                    {new Date(msg.created_at).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-sidebar-border/70 p-4">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={isSending}
                        className="flex-1"
                    />
                    <Button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        size="icon"
                        className="shrink-0 rounded-full"
                    >
                        <Send className="size-4" />
                        <span className="sr-only">Send</span>
                    </Button>
                </form>
            </div>
        </div>
    );
}
