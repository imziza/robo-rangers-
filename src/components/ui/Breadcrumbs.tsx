'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import styles from './Breadcrumbs.module.css';

export function Breadcrumbs() {
    const pathname = usePathname();
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length === 0) return null;

    return (
        <nav className={styles.container}>
            <Link href="/vault" className={styles.item}>
                <Home size={14} />
            </Link>

            {segments.map((segment, index) => {
                const href = `/${segments.slice(0, index + 1).join('/')}`;
                const isLast = index === segments.length - 1;
                const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

                return (
                    <div key={href} className={styles.segment}>
                        <ChevronRight size={14} className={styles.separator} />
                        {isLast ? (
                            <span className={styles.active}>{label}</span>
                        ) : (
                            <Link href={href} className={styles.link}>
                                {label}
                            </Link>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
