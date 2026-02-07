'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell,
    MessageSquare,
    Users,
    Shield,
    Trash2,
    CheckCircle,
    Clock,
    ArrowRight,
    Search,
    UserPlus,
    UserMinus
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import styles from './page.module.css';

interface Notification {
    id: string;
    type: 'team_invite' | 'message' | 'artifact_shared' | 'system' | 'mention';
    title: string;
    body: string | null;
    link: string | null;
    is_read: boolean;
    created_at: string;
    metadata: any;
}

export default function NotificationsPage() {
    const router = useRouter();
    const supabase = createSupabaseBrowserClient();
    const { showToast } = useToast();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        loadNotifications();

        // Subscribe to real-time notifications
        const channel = supabase
            .channel('realtime_notifications')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                (payload) => {
                    const newNotif = payload.new as Notification;
                    setNotifications(prev => [newNotif, ...prev]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const loadNotifications = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let query = supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (filter === 'unread') {
                query = query.eq('is_read', false);
            }

            const { data, error } = await query;
            if (data) setNotifications(data);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllRead = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await supabase
                .from('notifications')
                .delete()
                .eq('id', id);

            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const handleInviteResponse = async (notif: Notification, status: 'accepted' | 'declined') => {
        try {
            const { team_id, invite_id } = notif.metadata;
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Update invite status
            await supabase
                .from('team_invites')
                .update({ status, responded_at: new Date().toISOString() })
                .eq('id', invite_id);

            // 2. If accepted, join group
            if (status === 'accepted') {
                await supabase
                    .from('group_members')
                    .insert({ group_id: team_id, user_id: user.id, role: 'member' });
            }

            // 3. Mark notification as read and delete it (or keep as history)
            await markAsRead(notif.id);
            showToast(status === 'accepted' ? 'Successfully joined the coalition.' : 'Invitation declined.', status === 'accepted' ? 'success' : 'info');
        } catch (error: any) {
            console.error('Invite response protocol failure:', error);
            showToast(`Protocol Failure: ${error.message}`, 'error');
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'team_invite': return <Users size={18} />;
            case 'message': return <MessageSquare size={18} />;
            case 'artifact_shared': return <Shield size={18} />;
            default: return <Bell size={18} />;
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleArea}>
                    <h1 className={styles.title}>Signal Archives</h1>
                    <p className={styles.subtitle}>COMMUNICATIONS & SYSTEM ALERTS</p>
                </div>

                <div className={styles.headerActions}>
                    <div className={styles.filterTabs}>
                        <button
                            className={`${styles.filterTab} ${filter === 'all' ? styles.active : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            History
                        </button>
                        <button
                            className={`${styles.filterTab} ${filter === 'unread' ? styles.active : ''}`}
                            onClick={() => setFilter('unread')}
                        >
                            Unread
                        </button>
                    </div>
                    <Button variant="outline" size="sm" onClick={markAllRead}>
                        Clear All Signals
                    </Button>
                </div>
            </header>

            <div className={styles.content}>
                <AnimatePresence mode="popLayout">
                    {notifications.length > 0 ? (
                        notifications.map((notif, index) => (
                            <motion.div
                                key={notif.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.05 }}
                                className={`${styles.notifItem} ${!notif.is_read ? styles.unread : ''}`}
                                onClick={() => {
                                    markAsRead(notif.id);
                                    if (notif.link) router.push(notif.link);
                                }}
                            >
                                <div className={styles.notifIcon}>
                                    {getIcon(notif.type)}
                                </div>

                                <div className={styles.notifBody}>
                                    <div className={styles.notifHeader}>
                                        <h3 className={styles.notifTitle}>{notif.title}</h3>
                                        <span className={styles.notifTime}>
                                            <Clock size={10} strokeWidth={3} />
                                            {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className={styles.notifText}>{notif.body}</p>

                                    {notif.link && (
                                        <a href={notif.link} className={styles.notifLink}>
                                            Navigate to Source <ArrowRight size={14} />
                                        </a>
                                    )}

                                    {notif.type === 'team_invite' && !notif.is_read && (
                                        <div className={styles.inviteActions}>
                                            <Button
                                                size="sm"
                                                variant="primary"
                                                leftIcon={<UserPlus size={14} />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleInviteResponse(notif, 'accepted');
                                                }}
                                            >
                                                Accept
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                leftIcon={<UserMinus size={14} />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleInviteResponse(notif, 'declined');
                                                }}
                                            >
                                                Decline
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <div className={styles.notifActions}>
                                    {!notif.is_read && <div className={styles.unreadPulse} />}
                                    <button
                                        className={styles.deleteBtn}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteNotification(notif.id);
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <motion.div
                            className={styles.emptyState}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className={styles.emptyCircle}>
                                <CheckCircle size={40} strokeWidth={1} />
                            </div>
                            <h3>NO ACTIVE BROADCASTS</h3>
                            <p>All laboratory channels are currently silent.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
