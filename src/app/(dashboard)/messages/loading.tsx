'use client';

import React from 'react';
import { Skeleton, SkeletonCircle, SkeletonText } from '@/components/ui/Skeleton';
import styles from './page.module.css';

export default function MessagesLoading() {
    return (
        <div className={styles.container}>
            {/* Sidebar Skeleton */}
            <aside className={styles.chatList}>
                <div className={styles.listHeader}>
                    <SkeletonText width="120px" height="11px" />
                </div>
                <div className={styles.searchBox}>
                    <Skeleton height="32px" borderRadius="var(--radius-md)" />
                </div>
                <div className={styles.chats}>
                    {Array(8).fill(0).map((_, i) => (
                        <div key={i} className={styles.chatItem}>
                            <Skeleton width="32px" height="32px" borderRadius="4px" />
                            <div className={styles.chatInfo}>
                                <div className={styles.chatHeader}>
                                    <SkeletonText width="100px" height="13px" />
                                    <SkeletonText width="40px" height="9px" />
                                </div>
                                <SkeletonText width="140px" height="12px" />
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Main Panel Skeleton */}
            <main className={styles.chatPanel}>
                <header className={styles.chatPanelHeader}>
                    <div className={styles.activeUser}>
                        <Skeleton width="32px" height="32px" borderRadius="4px" />
                        <div>
                            <SkeletonText width="120px" height="14px" />
                            <SkeletonText width="80px" height="10px" />
                        </div>
                    </div>
                    <Skeleton width="80px" height="32px" borderRadius="var(--radius-md)" />
                </header>

                <div className={styles.messageHistory}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
                        {Array(5).fill(0).map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    alignSelf: i % 2 === 0 ? 'flex-start' : 'flex-end',
                                    maxWidth: '60%'
                                }}
                            >
                                <SkeletonText width="80px" height="10px" className={styles.senderName} />
                                <Skeleton height="60px" width="280px" borderRadius="4px" />
                            </div>
                        ))}
                    </div>
                </div>

                <footer className={styles.inputBar}>
                    <div className={styles.inputWrapper}>
                        <Skeleton height="36px" width="100%" borderRadius="4px" />
                    </div>
                </footer>
            </main>
        </div>
    );
}
