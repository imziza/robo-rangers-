'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
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
    Sparkles
} from 'lucide-react';
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
    const { theme, toggleTheme } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className={styles.container}>
            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
                <div className={styles.sidebarHeader}>
                    <Link href="/vault" className={styles.logo}>
                        <div className={styles.logoIcon}>
                            <Sparkles size={24} strokeWidth={1.5} />
                        </div>
                        <span className={styles.logoText}>ALETHEON</span>
                    </Link>
                </div>

                <nav className={styles.nav}>
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
                            >
                                <span className={styles.navIcon}>
                                    <Icon size={20} strokeWidth={1.5} />
                                </span>
                                <span className={styles.navLabel}>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className={styles.sidebarFooter}>
                    <Link href="/analysis" className={styles.newAnalysisBtn}>
                        <Plus size={20} strokeWidth={2} />
                        New Analysis
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <div className={`${styles.main} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
                {/* Top Bar */}
                <header className={styles.topBar}>
                    <button
                        className={styles.menuToggle}
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        <Menu size={20} strokeWidth={2} />
                    </button>

                    <div className={styles.searchWrapper}>
                        <Search size={18} strokeWidth={2} />
                        <input
                            type="text"
                            placeholder="Search digital specimens..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
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
                        <button className={styles.notificationBtn}>
                            <Bell size={18} strokeWidth={2} />
                        </button>
                        <button className={styles.userBtn}>
                            <div className={styles.userAvatar}>
                                <User size={20} strokeWidth={1.5} />
                            </div>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className={styles.content}>
                    <Breadcrumbs />
                    {children}
                </main>
            </div>
        </div>
    );
}
