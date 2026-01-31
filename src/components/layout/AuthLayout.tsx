'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
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
                    <Sparkles size={32} strokeWidth={1.5} color="#C9A227" />
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
