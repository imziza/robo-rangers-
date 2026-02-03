'use client';

import React from 'react';
import { Skeleton, SkeletonCard, SkeletonTitle, SkeletonText } from '@/components/ui/Skeleton';
import styles from './page.module.css';

export default function VaultLoading() {
    return (
        <div className={styles.container}>
            {/* Archival Sidebar Skeleton */}
            <aside className={styles.filterSidebar}>
                <div className={styles.sidebarHeader}>
                    <SkeletonTitle width="120px" height="24px" />
                    <SkeletonText width="100px" height="10px" />
                </div>

                <div className={styles.statusNav}>
                    {Array(4).fill(0).map((_, i) => (
                        <Skeleton key={i} height="40px" borderRadius="var(--radius-lg)" />
                    ))}
                </div>

                <div className={styles.filterSection}>
                    <SkeletonText width="80px" height="10px" />
                    <div className={styles.materialTags} style={{ marginTop: ' var(--space-2)' }}>
                        {Array(6).fill(0).map((_, i) => (
                            <Skeleton key={i} width="60px" height="28px" borderRadius="var(--radius-md)" />
                        ))}
                    </div>
                </div>

                <Skeleton height="44px" borderRadius="var(--radius-md)" />
            </aside>

            {/* Main Content Skeleton */}
            <main className={styles.mainContent}>
                <div className={styles.contentHeader}>
                    <div className={styles.activeAnalysis}>
                        <div className={styles.activeHeaderTop}>
                            <SkeletonText width="150px" height="10px" />
                        </div>
                        <SkeletonTitle width="300px" height="36px" />
                        <div className={styles.activeHeaderMeta}>
                            <SkeletonText width="300px" height="14px" />
                        </div>
                    </div>
                    <Skeleton width="180px" height="44px" borderRadius="var(--radius-md)" />
                </div>

                <div className={styles.artifactGrid}>
                    {Array(8).fill(0).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            </main>
        </div>
    );
}
