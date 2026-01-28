'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import styles from './AuthLayout.module.css';

interface AuthLayoutProps {
    children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/" className={styles.logo}>
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="14" stroke="#C9A227" strokeWidth="2" />
                        <circle cx="16" cy="16" r="6" fill="#C9A227" />
                    </svg>
                    <span className={styles.logoText}>ALETHEON</span>
                </Link>

                <div className={styles.headerRight}>
                    <span className={styles.headerLink}>Already a member?</span>
                    <Link href="/login" className={styles.loginLink}>LOG IN</Link>
                </div>
            </header>

            {/* Main Content */}
            <main className={styles.main}>
                {children}
            </main>

            {/* Footer */}
            <footer className={styles.footer}>
                <p className={styles.copyright}>
                    © 2024 Aletheon Platform. All rights reserved.
                </p>
                <nav className={styles.footerNav}>
                    <Link href="/privacy">Privacy Policy</Link>
                    <Link href="/terms">Terms of Service</Link>
                    <Link href="/support">Contact Support</Link>
                </nav>
            </footer>
        </div>
    );
}
