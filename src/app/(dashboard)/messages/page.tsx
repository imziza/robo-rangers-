'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
    Send,
    Search,
    Lock,
    History,
    User,
    Users,
    RotateCcw,
    FileText,
    MessageSquare
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './page.module.css';

interface Message {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
    isMe: boolean;
    sender_name?: string;
    artifact_id?: string;
    status?: 'sending' | 'sent' | 'error';
}

interface Chat {
    id: string;
    name: string;
    type: 'Direct' | 'Group';
    lastMessage?: string;
    online?: boolean;
}

interface Profile {
    id: string;
    full_name: string;
    institution: string;
    specialization: string;
}

export default function MessagesPage() {
    return <MessagesContent />;
}

function MessagesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const chatIdFromURL = searchParams.get('chatId');
    const supabase = createSupabaseBrowserClient();
    const scrollRef = useRef<HTMLDivElement>(null);

    const [currentUser, setCurrentUser] = useState<any>(null);
    const [chats, setChats] = useState<Chat[]>([]);
    const [activeChat, setActiveChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageText, setMessageText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Profile[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // "Trusty" Features
    const [isConnected, setIsConnected] = useState(true); // Assume true initially
    const [isAiThinking, setIsAiThinking] = useState(false);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
            if (user) loadChats(user.id);
        };
        init();

        // Monitor network/tab visibility for "Trusty" feel
        const handleVisibilityChange = () => {
            // In a real app we might force specific reconnect logic here
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, []);

    const loadChats = async (userId: string) => {
        setIsLoading(true);
        try {
            // 1. Fetch Groups/Teams
            const { data: groups } = await supabase
                .from('group_members')
                .select(`
                    groups (
                        id,
                        name
                    )
                `)
                .eq('user_id', userId);

            const teamChats: Chat[] = (groups || []).map((g: any) => ({
                id: g.groups.id,
                name: g.groups.name,
                type: 'Group',
                lastMessage: 'Collaborative archive...'
            }));

            // 2. Fetch Direct Message partners (recent)
            const { data: recentMsgs } = await supabase
                .from('messages')
                .select('sender_id, recipient_id')
                .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
                .order('created_at', { ascending: false })
                .limit(20);

            const partnerIds = Array.from(new Set(
                (recentMsgs || []).map(m => m.sender_id === userId ? m.recipient_id : m.sender_id)
            )).filter(id => id !== null && id !== userId);

            const partnerChats: Chat[] = [];
            if (partnerIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .in('id', partnerIds);

                (profiles || []).forEach(p => {
                    partnerChats.push({
                        id: p.id,
                        name: p.full_name || 'Unknown Scholar',
                        type: 'Direct',
                        online: true
                    });
                });
            }

            const allChats = [...teamChats, ...partnerChats];
            setChats(allChats);

            // Auto-select based on URL or first chat
            let initialChat = null;
            if (chatIdFromURL) {
                const targetChat = allChats.find(c => c.id === chatIdFromURL);
                if (targetChat) {
                    initialChat = targetChat;
                } else {
                    // It's a new direct chat (from a notification)
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('id, full_name')
                        .eq('id', chatIdFromURL)
                        .single();

                    if (profile) {
                        initialChat = {
                            id: profile.id,
                            name: profile.full_name || 'Academic Scholar',
                            type: 'Direct' as const,
                            online: true
                        };
                        setChats(prev => [initialChat!, ...prev]);
                    }
                }
            }

            if (initialChat) {
                setActiveChat(initialChat);
            } else if (allChats.length > 0 && !activeChat) {
                setActiveChat(allChats[0]);
            }
        } catch (error) {
            console.error('Error loading chats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (activeChat) {
            loadMessages(activeChat);

            // Clear messages when switching chats
            setMessages([]);

            const channel = supabase
                .channel(`chat-${activeChat.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: activeChat.type === 'Group'
                        ? `group_id=eq.${activeChat.id}`
                        : `or(and(sender_id.eq.${currentUser?.id},recipient_id.eq.${activeChat.id}),and(sender_id.eq.${activeChat.id},recipient_id.eq.${currentUser?.id}))`
                }, (payload) => {
                    const newMessage = payload.new as any;

                    setMessages(prev => {
                        // Check if message is already there (optimistic or duplicate)
                        if (prev.find(m => m.id === newMessage.id)) return prev;

                        // If it's my message, we already have it in local state as 'sending' or 'sent'
                        // but Supabase ID might be different. We'll handle deduplication by content/timestamp if needed,
                        // but for standard teammate messages we just append.
                        if (newMessage.sender_id === currentUser?.id) return prev;

                        return [...prev, {
                            ...newMessage,
                            isMe: false,
                            status: 'sent'
                        }];
                    });
                })
                .subscribe((status) => {
                    setIsConnected(status === 'SUBSCRIBED');
                });

            return () => { supabase.removeChannel(channel); };
        }
    }, [activeChat, currentUser]);


    const loadMessages = async (chat: Chat) => {
        setIsAiThinking(true);
        try {
            let query = supabase.from('messages').select('*');

            if (chat.type === 'Group') {
                query = query.eq('group_id', chat.id);
            } else {
                // Direct message: (Me -> Partner) OR (Partner -> Me)
                query = query.or(`and(sender_id.eq.${currentUser?.id},recipient_id.eq.${chat.id}),and(sender_id.eq.${chat.id},recipient_id.eq.${currentUser?.id})`);
            }

            const { data, error } = await query.order('created_at', { ascending: true });

            if (data) {
                setMessages(data.map((m: any) => ({
                    ...m,
                    isMe: m.sender_id === currentUser?.id,
                    status: 'sent'
                })));
            }
        } finally {
            setIsAiThinking(false);
        }
    };

    const searchArchaeologists = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .ilike('full_name', `%${query}%`)
            .limit(5);

        setSearchResults(data || []);
        setIsSearching(false);
    };

    const startDirectChat = (profile: Profile) => {
        const existing = chats.find(c => c.id === profile.id);
        if (existing) {
            setActiveChat(existing);
        } else {
            const newChat: Chat = {
                id: profile.id,
                name: profile.full_name,
                type: 'Direct',
                lastMessage: 'New scholar connection établie...',
                online: true
            };
            setChats(prev => [newChat, ...prev]);
            setActiveChat(newChat);
        }
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim() || !activeChat || !currentUser) return;

        const text = messageText;
        setMessageText('');

        const tempId = Date.now().toString();
        const newMessage: Message = {
            id: tempId,
            sender_id: currentUser.id,
            content: text,
            created_at: new Date().toISOString(),
            isMe: true,
            status: 'sending'
        };

        setMessages(prev => [...prev, newMessage]);

        try {
            const { error } = await supabase
                .from('messages')
                .insert({
                    sender_id: currentUser.id,
                    content: text,
                    [activeChat.type === 'Group' ? 'group_id' : 'recipient_id']: activeChat.id
                });

            if (error) throw error;

            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'sent' } : m));
        } catch (error) {
            console.error('Send error:', error);
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
        }
    };

    return (
        <div className={styles.container}>
            <aside className={styles.chatList}>
                <div className={styles.listHeader}>
                    <h2 className={styles.listTitle}>SIGNAL CHANNELS</h2>
                    <div className={styles.connectionStatus}>
                        <div className={`${styles.statusDot} ${isConnected ? styles.online : styles.offline}`} />
                        <span>{isConnected ? 'ENCRYPTED' : 'OFFLINE'}</span>
                    </div>
                </div>

                <div className={styles.searchBox}>
                    <Input
                        placeholder="Search researchers..."
                        value={searchQuery}
                        onChange={(e) => searchArchaeologists(e.target.value)}
                        variant="dark"
                        className={styles.searchInput}
                    />
                    {isSearching && <div className={styles.loader}>SCANNING...</div>}
                    {searchResults.length > 0 && (
                        <div className={styles.searchResults}>
                            {searchResults.map(p => (
                                <div key={p.id} className={styles.searchItem} onClick={() => startDirectChat(p)}>
                                    <div className={styles.miniAvatar}>{p.full_name?.charAt(0)}</div>
                                    <div className={styles.searchDetails}>
                                        <span className={styles.searchName}>{p.full_name}</span>
                                        <span className={styles.searchInst}>{p.institution}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.chats}>
                    {isLoading ? (
                        <div className={styles.listLoading}>
                            <RotateCcw className={styles.spin} size={20} />
                            <span>SYNCING CHANNELS...</span>
                        </div>
                    ) : (
                        chats.map((chat) => (
                            <motion.div
                                key={chat.id}
                                layout
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`${styles.chatItem} ${activeChat?.id === chat.id ? styles.active : ''}`}
                                onClick={() => setActiveChat(chat)}
                            >
                                <div className={`${styles.avatar} ${chat.type === 'Group' ? styles.groupAvatar : ''}`}>
                                    {chat.type === 'Group' ? <Users size={16} /> : chat.name.charAt(0)}
                                </div>
                                <div className={styles.chatInfo}>
                                    <div className={styles.chatHeader}>
                                        <span className={styles.chatName}>{chat.name}</span>
                                        <span className={styles.chatType}>{chat.type.toUpperCase()}</span>
                                    </div>
                                    <span className={styles.lastMsg}>{chat.lastMessage}</span>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </aside>

            <main className={styles.chatPanel}>
                {activeChat ? (
                    <>
                        <header className={styles.chatPanelHeader}>
                            <div className={styles.activeUser}>
                                <div className={`${styles.avatar} ${activeChat.type === 'Group' ? styles.groupAvatar : ''}`}>
                                    {activeChat.type === 'Group' ? <Users size={20} /> : activeChat.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className={styles.activeName}>{activeChat.name}</h3>
                                    <span className={styles.activeStatus}>
                                        {activeChat.type === 'Group' ? 'COALITION CHANNEL' : 'DIRECT SCHOLAR LINK'}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.headerActions}>
                                <Button variant="ghost" size="sm" onClick={() => router.push(activeChat.type === 'Direct' ? `/profile/${activeChat.id}` : '/teams')}>
                                    {activeChat.type === 'Direct' ? 'Dossier' : 'Manage'}
                                </Button>
                            </div>
                        </header>

                        <div className={styles.messageHistory} ref={scrollRef}>
                            <div className={styles.encryptionInfo}>
                                <Lock size={12} strokeWidth={2.5} />
                                ARCHIVAL E2EE CHANNEL SECURED
                            </div>

                            <AnimatePresence mode="popLayout">
                                {messages.map((msg, index) => (
                                    <motion.div
                                        key={msg.id || index}
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        layout
                                        className={`${styles.messageWrapper} ${msg.isMe ? styles.isMe : ''}`}
                                    >
                                        <div className={styles.message} style={{ opacity: msg.status === 'sending' ? 0.7 : 1 }}>
                                            <div className={styles.senderName}>
                                                {msg.sender_id === '00000000-0000-0000-0000-000000000000' ? '@ALE (SCHOLAR)' : (msg.isMe ? 'ME' : 'RESEARCHER')}
                                            </div>
                                            <div className={styles.messageContent}>
                                                {msg.content}
                                            </div>
                                            <span className={styles.timestamp}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {isAiThinking && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className={styles.messageWrapper}
                                >
                                    <div className={styles.aiLoading}>
                                        <div className={styles.aiPulse} />
                                        <div className={styles.aiPulse} style={{ animationDelay: '0.2s' }} />
                                        <div className={styles.aiPulse} style={{ animationDelay: '0.4s' }} />
                                        ALE SCANNING ARCHIVES...
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        <footer className={styles.inputBar}>
                            <form className={styles.inputWrapper} onSubmit={handleSendMessage}>
                                <input
                                    type="text"
                                    placeholder="Transmit research data..."
                                    className={styles.msgInput}
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    disabled={!isConnected}
                                />
                                <Button type="submit" variant="primary" size="sm" disabled={!messageText.trim() || !isConnected}>SEND</Button>
                            </form>
                        </footer>
                    </>
                ) : (
                    <div className={styles.emptyState}>
                        <MessageSquare size={64} strokeWidth={0.5} className={styles.emptyIcon} />
                        <h3>COMMUNICATION HUB</h3>
                        <p>Select a coalition member or research group to begin data transmission.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

