'use client';

import React from 'react';
import { Skeleton, SkeletonCard, SkeletonTitle, SkeletonText } from '@/components/ui/Skeleton';
import styles from './page.module.css';

export default function DiscoveryLoading() {
    return (
        <div className={styles.container}>
            {/* Header Skeleton */}
            <header className={styles.header}>
                <SkeletonTitle width="300px" height="40px" />
                <div style={{ marginBottom: 'var(--space-8)' }}>
                    <SkeletonText width="100%" height="14px" />
                    <SkeletonText width="90%" height="14px" style={{ marginTop: '8px' }} />
                </div>
                <div className={styles.searchForm}>
                    <Skeleton width="100%" height="40px" borderRadius="4px" />
                    <Skeleton width="160px" height="40px" borderRadius="4px" />
                </div>
            </header>

            <div className={styles.content}>
                {/* Result Repository Grid Skeleton */}
                <div className={styles.resultsList}>
                    {Array(6).fill(0).map((_, i) => (
                        <div key={i} className={styles.resultItem}>
                            <Skeleton width="100%" style={{ aspectRatio: '1' }} borderRadius="0" />
                            <div className={styles.resultContent}>
                                <SkeletonText width="150px" height="14px" />
                                <div className={styles.resultTags} style={{ marginTop: 'var(--space-2)' }}>
                                    <Skeleton width="60px" height="18px" />
                                    <Skeleton width="60px" height="18px" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Detail Panel Skeleton */}
                <aside className={styles.detailPanel}>
                    <div className={styles.panelHeader}>
                        <SkeletonText width="100px" height="9px" />
                        <SkeletonTitle width="200px" height="24px" style={{ marginTop: '4px' }} />
                    </div>
                    <Skeleton height="100px" />
                    <div className={styles.panelMeta}>
                        <div className={styles.metaRow}>
                            <div className={styles.metaItem}>
                                <SkeletonText width="60px" height="9px" />
                                <SkeletonText width="100px" height="12px" />
                            </div>
                            <div className={styles.metaItem}>
                                <SkeletonText width="60px" height="9px" />
                                <SkeletonText width="100px" height="12px" />
                            </div>
                        </div>
                        {/* Repeat meta rows as needed or just use one for skeleton */}
                    </div>
                    <div className={styles.panelTabs}>
                        {Array(4).fill(0).map((_, i) => (
                            <Skeleton key={i} height="36px" style={{ marginBottom: '1px' }} />
                        ))}
                    </div>
                    <Skeleton height="44px" borderRadius="4px" />
                </aside>
            </div>
        </div>
    );
}
