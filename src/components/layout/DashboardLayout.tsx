'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import {
    Database,
    Map as MapIcon,
    Microscope,
    Compass,
    Archive,
    Users,
    MessageSquare,
    Plus,
    Menu,
    Search,
    Bell,
    User,
    Sun,
    Moon,
    Sparkles,
    LogOut as LucideLogOut
} from 'lucide-react';
import { NeuralSidebar } from './NeuralSidebar';
import { CommandPalette } from '@/components/ui/CommandPalette';
import styles from './DashboardLayout.module.css';

interface DashboardLayoutProps {
    children: ReactNode;
}

const NAV_ITEMS = [
    { href: '/vault', label: 'Vault', icon: Database },
    { href: '/atlas', label: 'Arch-Atlas', icon: MapIcon },
    { href: '/analysis', label: 'Analysis', icon: Microscope },
    { href: '/discovery', label: 'Discovery', icon: Compass },
    { href: '/archive', label: 'Archive', icon: Archive },
    { href: '/teams', label: 'Teams', icon: Users },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const supabase = createSupabaseBrowserClient();

    const [searchQuery, setSearchQuery] = useState('');
    // sidebarOpen state removed as NeuralSidebar is persistent
    const [unreadCount, setUnreadCount] = useState(0);

    const loadUnreadCount = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        setUnreadCount(count || 0);
    };

    useEffect(() => {
        loadUnreadCount();

        const channel = supabase
            .channel('layout_notifications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
                setUnreadCount(prev => prev + 1);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    return (
        <div className={styles.container}>
            <CommandPalette />
            {/* Sidebar */}
            {/* Neural Ribbon Sidebar */}
            <NeuralSidebar />

            {/* Main Content */}
            {/* Adjusted main margin logic to account for NeuralSidebar's new behavior if needed, 
                though NeuralSidebar is fixed position so main content might need a fixed left margin 
                or we keep the existing .main styles if they align with the new width (80px) */}

            {/* Main Content */}
            <div className={`${styles.main} ${styles.sidebarOpen}`}>
                {/* Top Bar */}
                <header className={styles.topBar}>
                    {/* Menu toggle removed for Neural Sidebar */}

                    <div
                        className={styles.searchWrapper}
                        onClick={() => {
                            const event = new KeyboardEvent('keydown', {
                                key: 'k',
                                ctrlKey: true,
                                metaKey: true,
                                bubbles: true
                            });
                            window.dispatchEvent(event);
                        }}
                    >
                        <Search size={18} strokeWidth={2} />
                        <span className={styles.searchPlaceholder}>Search specimens... (Ctrl+K)</span>
                    </div>

                    <nav className={styles.topNav}>
                        <Link href="/vault" className={styles.topNavLink}>Dashboard</Link>
                        <Link href="/atlas" className={styles.topNavLink}>Arch-Atlas</Link>
                        <Link href="/archive" className={styles.topNavLink}>Archive</Link>
                        <Link href="/teams" className={styles.topNavLink}>Teams</Link>
                    </nav>

                    <div className={styles.topBarRight}>
                        <button onClick={toggleTheme} className={styles.notificationBtn} title="Toggle Theme">
                            {theme === 'dark' ? <Moon size={18} /> : theme === 'light' ? <Sun size={18} /> : <Sparkles size={18} />}
                        </button>

                        <Link href="/notifications" className={styles.notificationBtn}>
                            <Bell size={18} strokeWidth={2} />
                            {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
                        </Link>

                        <Link
                            href="/profile"
                            className={styles.userBtn}
                            onMouseEnter={() => router.prefetch('/profile')}
                        >
                            <div className={styles.userAvatar}>
                                <User size={20} strokeWidth={1.5} />
                            </div>
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main className={styles.content}>
                    <Breadcrumbs />
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            style={{ height: '100%' }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
