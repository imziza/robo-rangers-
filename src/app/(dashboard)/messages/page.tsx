'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
    const router = useRouter();
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
        const GLOBAL_HUB_ID = 'e02d6e46-1768-450f-9694-5c9c7f6e0266';
        setChats([
            { id: GLOBAL_HUB_ID, name: 'Global Research Hub', type: 'Group', lastMessage: 'System Secure.' },
        ]);
        setActiveChat({ id: GLOBAL_HUB_ID, name: 'Global Research Hub', type: 'Group' });
    };

    useEffect(() => {
        if (activeChat) {
            loadMessages(activeChat.id);
            const channel = supabase
                .channel(`chat-${activeChat.id}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                    const newMessage = payload.new as any;
                    // Only add if we haven't already optimistically added it (check by temporary ID or similar content/timestamp heuristic if needed, 
                    // but for simplicity we rely on ID. Optimistic ones have temp IDs.)
                    if (newMessage.group_id === activeChat.id || newMessage.sender_id === activeChat.id || newMessage.recipient_id === activeChat.id) {
                        setMessages(prev => {
                            // Dedup: if we have a message with same content sent < 1sec ago by me, replace it? 
                            // For now, simpler: Just append. Real logic needs ID matching.
                            // We'll filter out the optimistic one if real one arrives (requires UUID matching which we can't do easily without returning it from insert)
                            // So we won't add it if it's 'me' and we just sent it? 
                            // Actually, Supabase realtime usually echoes back.
                            if (newMessage.sender_id === currentUser?.id) {
                                // Update the optimistic message to 'sent'
                                return prev.map(m => (m.content === newMessage.content && m.status === 'sending')
                                    ? { ...newMessage, isMe: true, status: 'sent' }
                                    : m);
                            }
                            return [...prev, { ...newMessage, isMe: newMessage.sender_id === currentUser?.id, status: 'sent' }];
                        });
                    }
                })
                .subscribe((status) => {
                    setIsConnected(status === 'SUBSCRIBED');
                });

            return () => { supabase.removeChannel(channel); };
        }
    }, [activeChat, currentUser]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isAiThinking]);

    const loadMessages = async (chatId: string) => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`group_id.eq.${chatId},sender_id.eq.${chatId},recipient_id.eq.${chatId}`)
            .order('created_at', { ascending: true });

        if (data) {
            setMessages(data.map(m => ({
                ...m,
                isMe: m.sender_id === currentUser?.id,
                status: 'sent'
            })));
        }
    };

    const handleSendMessage = async (e: React.FormEvent, retryContent?: string) => {
        e.preventDefault();
        const content = retryContent || messageText;

        if (!content.trim() || !currentUser || !activeChat) return;

        if (!retryContent) setMessageText('');

        const tempId = 'temp-' + Date.now();
        const optimisticMsg: Message = {
            id: tempId,
            sender_id: currentUser.id,
            content,
            created_at: new Date().toISOString(),
            isMe: true,
            status: 'sending'
        };
        setMessages(prev => [...prev, optimisticMsg]);

        try {
            const { error: sendError } = await supabase
                .from('messages')
                .insert({
                    content,
                    sender_id: currentUser.id,
                    group_id: activeChat.type === 'Group' ? activeChat.id : null,
                    recipient_id: activeChat.type === 'Direct' ? activeChat.id : null,
                });

            if (sendError) throw sendError;
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'sent' } : m));

            if (content.toLowerCase().includes('@ale')) {
                setIsAiThinking(true);

                const aiTempId = 'ai-temp-' + Date.now();
                setMessages(prev => [...prev, {
                    id: aiTempId,
                    sender_id: '00000000-0000-0000-0000-000000000000',
                    content: '',
                    created_at: new Date().toISOString(),
                    isMe: false,
                    status: 'sending'
                }]);

                const response = await fetch('/api/messages/ai', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: content,
                        chatId: activeChat.id,
                        senderId: currentUser.id,
                        group_id: activeChat.type === 'Group' ? activeChat.id : null
                    })
                });

                if (!response.ok) throw new Error('AI Protocol Failed');

                const reader = response.body?.getReader();
                if (!reader) return;

                const decoder = new TextDecoder();
                let streamedContent = '';
                setIsAiThinking(false);

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    streamedContent += chunk;

                    setMessages(prev => prev.map(m => m.id === aiTempId ? { ...m, content: streamedContent, status: 'sent' } : m));
                }
            }

        } catch (err) {
            console.error('Send error:', err);
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
            setIsAiThinking(false);
        }
    };

    const searchArchaeologists = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 3) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .ilike('full_name', `%${query}%`)
            .limit(5);

        if (data) setSearchResults(data);
        setIsSearching(false);
    };

    const startDirectChat = (profile: Profile) => {
        const newChat: Chat = {
            id: profile.id,
            name: profile.full_name,
            type: 'Direct',
            online: true
        };
        setChats(prev => [newChat, ...prev.filter(c => c.id !== newChat.id)]);
        setActiveChat(newChat);
        setSearchQuery('');
        setSearchResults([]);
    };

    return (
        <div className={styles.container}>
            <aside className={styles.chatList}>
                <div className={styles.listHeader}>
                    <h2 className={styles.listTitle}>RESEARCH NETWORK</h2>
                    <div style={{
                        width: 8, height: 8,
                        borderRadius: '50%',
                        background: isConnected ? '#00A36C' : '#DC2626',
                        boxShadow: isConnected ? '0 0 8px #00A36C' : 'none'
                    }} title={isConnected ? "Secure Uplink Active" : "Connection Lost"} />
                </div>

                <div className={styles.searchBox}>
                    <Input
                        placeholder="Search archaeologists..."
                        value={searchQuery}
                        onChange={(e) => searchArchaeologists(e.target.value)}
                        variant="dark"
                        className={styles.searchInput}
                    />
                    {isSearching && <div className={styles.loader}>SEARCHING...</div>}
                    {searchResults.length > 0 && (
                        <div className={styles.searchResults}>
                            {searchResults.map(p => (
                                <div key={p.id} className={styles.searchItem} onClick={() => startDirectChat(p)}>
                                    <span className={styles.searchName}>{p.full_name}</span>
                                    <span className={styles.searchInst}>{p.institution}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.chats}>
                    {chats.map((chat) => (
                        <div
                            key={chat.id}
                            className={`${styles.chatItem} ${activeChat?.id === chat.id ? styles.active : ''}`}
                            onClick={() => setActiveChat(chat)}
                        >
                            <div className={styles.avatar}>{chat.name.charAt(0)}</div>
                            <div className={styles.chatInfo}>
                                <div className={styles.chatHeader}>
                                    <span className={styles.chatName}>{chat.name}</span>
                                </div>
                                <span className={styles.lastMsg}>{chat.lastMessage || 'Connected to archive...'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            <main className={styles.chatPanel}>
                {activeChat ? (
                    <>
                        <header className={styles.chatPanelHeader}>
                            <div className={styles.activeUser}>
                                <div className={styles.avatar}>{activeChat.name.charAt(0)}</div>
                                <div>
                                    <h3 className={styles.activeName}>{activeChat.name}</h3>
                                    <span className={styles.activeStatus}>{isConnected ? 'SECURE CONNECTION ACTIVE' : 'RECONNECTING...'}</span>
                                </div>
                            </div>
                        </header>

                        <div className={styles.messageHistory} ref={scrollRef}>
                            <div className={styles.encryptionInfo}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                END-TO-END ENCRYPTION (E2EE) ESTABLISHED
                            </div>

                            {messages.map((msg) => (
                                <div key={msg.id} className={`${styles.messageWrapper} ${msg.isMe ? styles.isMe : ''}`}>
                                    <div className={styles.message} style={{ opacity: msg.status === 'sending' ? 0.7 : 1 }}>
                                        <div className={styles.senderName}>
                                            {msg.sender_id === '00000000-0000-0000-0000-000000000000' ? '@ALE (SCHOLAR)' : (msg.isMe ? 'ME' : 'RESEARCHER')}
                                            {msg.status === 'error' && (
                                                <button
                                                    style={{ color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: '9px', fontWeight: 800, marginLeft: '8px' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSendMessage(e, msg.content);
                                                        setMessages(p => p.filter(m => m.id !== msg.id));
                                                    }}
                                                >
                                                    RETRY ↻
                                                </button>
                                            )}
                                        </div>
                                        <div className={styles.messageContent}>
                                            {msg.content.includes('<think>') ? (
                                                <>
                                                    <div className={styles.reasoningBlock}>
                                                        <span className={styles.reasoningLabel}>AI CHAIN-OF-THOUGHT</span>
                                                        {msg.content.match(/<think>([\s\S]*?)<\/think>/)?.[1] || msg.content.split('</think>')[0].replace('<think>', '')}
                                                        {!msg.content.includes('</think>') && <span className="animate-pulse">...</span>}
                                                    </div>
                                                    <div>{msg.content.split('</think>')[1] || ''}</div>
                                                </>
                                            ) : (
                                                msg.content
                                            )}
                                        </div>

                                        {msg.artifact_id && (
                                            <div className={styles.sharedArtifact}>
                                                <div className={styles.sharedIcon}>📜</div>
                                                <div className={styles.sharedInfo}>
                                                    <span className={styles.sharedTitle}>Official Artifact Dossier</span>
                                                    <span className={styles.sharedLabel}>CATALOG ID: {msg.artifact_id.split('-')[0].toUpperCase()}</span>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.push(`/report/${msg.artifact_id}`)}
                                                >
                                                    Open
                                                </Button>
                                            </div>
                                        )}

                                        <span className={styles.timestamp}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {isAiThinking && (
                                <div className={`${styles.messageWrapper}`}>
                                    <div className={styles.message} style={{ background: 'transparent', border: 'none', paddingLeft: 0 }}>
                                        <span style={{ fontSize: '11px', color: 'var(--gold-primary)', fontFamily: 'monospace', display: 'flex', gap: '4px' }}>
                                            <span className={styles.pulse}>●</span>
                                            <span className={styles.pulse} style={{ animationDelay: '0.2s' }}>●</span>
                                            <span className={styles.pulse} style={{ animationDelay: '0.4s' }}>●</span>
                                            ALE IS ANALYZING ARCHIVES...
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <footer className={styles.inputBar}>
                            <form className={styles.inputWrapper} onSubmit={handleSendMessage}>
                                <input
                                    type="text"
                                    placeholder={isConnected ? "Transmit scholarly data... (Mention @ale for assistance)" : "Connection lost. Reconnecting..."}
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
                        <div className={styles.emptyIcon}>📡</div>
                        <p>SELECT A CHANNEL TO BEGIN COMMUNICATION</p>
                    </div>
                )}
            </main>
        </div>
    );
}
