'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './DashboardLayout.module.css';

interface DashboardLayoutProps {
    children: ReactNode;
}

const NAV_ITEMS = [
    { href: '/vault', label: 'Vault', icon: 'vault' },
    { href: '/atlas', label: 'Arch-Atlas', icon: 'map' },
    { href: '/analysis', label: 'Analysis', icon: 'analysis' },
    { href: '/discovery', label: 'Discovery', icon: 'discovery' },
    { href: '/archive', label: 'Archive', icon: 'archive' },
    { href: '/teams', label: 'Teams', icon: 'teams' },
    { href: '/messages', label: 'Messages', icon: 'messages' },
];

function NavIcon({ name }: { name: string }) {
    switch (name) {
        case 'vault':
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                </svg>
            );
        case 'map':
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                    <line x1="8" y1="2" x2="8" y2="18" />
                    <line x1="16" y1="6" x2="16" y2="22" />
                </svg>
            );
        case 'analysis':
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                    <path d="M11 8v6M8 11h6" />
                </svg>
            );
        case 'discovery':
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                </svg>
            );
        case 'archive':
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                    <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
                </svg>
            );
        case 'teams':
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
            );
        case 'messages':
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
            );
        default:
            return null;
    }
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const pathname = usePathname();
    const [searchQuery, setSearchQuery] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className={styles.container}>
            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
                <div className={styles.sidebarHeader}>
                    <Link href="/vault" className={styles.logo}>
                        <div className={styles.logoIcon}>
                            <svg viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                                <circle cx="12" cy="12" r="4" fill="currentColor" />
                            </svg>
                        </div>
                        <span className={styles.logoText}>ALETHEON</span>
                    </Link>
                </div>

                <nav className={styles.nav}>
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
                        >
                            <span className={styles.navIcon}>
                                <NavIcon name={item.icon} />
                            </span>
                            <span className={styles.navLabel}>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className={styles.sidebarFooter}>
                    <Link href="/analysis" className={styles.newAnalysisBtn}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
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
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>

                    <div className={styles.searchWrapper}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
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
                        <button className={styles.notificationBtn}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 01-3.46 0" />
                            </svg>
                        </button>
                        <button className={styles.userBtn}>
                            <div className={styles.userAvatar}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </div>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className={styles.content}>
                    {children}
                </main>
            </div>
        </div>
    );
}
