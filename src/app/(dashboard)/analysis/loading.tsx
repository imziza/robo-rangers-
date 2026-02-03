'use client';

import React from 'react';
import { Skeleton, SkeletonTitle, SkeletonText, SkeletonCircle } from '@/components/ui/Skeleton';
import styles from './page.module.css';

export default function AnalysisLoading() {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <SkeletonTitle width="400px" height="40px" />
                <SkeletonText width="500px" height="14px" />
            </header>

            <div className={styles.content}>
                <div className={styles.mainPanel}>
                    {/* OPTICAL CAPTURE Section Skeleton */}
                    <div className={styles.section} style={{ marginBottom: 'var(--space-8)' }}>
                        <div className={styles.sectionTitle}>
                            <Skeleton width="16px" height="16px" style={{ display: 'inline-block', marginRight: 'var(--space-4)' }} />
                            <SkeletonText width="150px" height="14px" style={{ display: 'inline-block' }} />
                        </div>
                        <div className={styles.uploadArea}>
                            <Skeleton height="200px" borderRadius="var(--radius-lg)" />
                        </div>
                    </div>

                    {/* FIELD OBSERVATIONS Section Skeleton */}
                    <div className={styles.section} style={{ marginBottom: 'var(--space-8)' }}>
                        <div className={styles.sectionTitle}>
                            <Skeleton width="16px" height="16px" style={{ display: 'inline-block', marginRight: 'var(--space-4)' }} />
                            <SkeletonText width="180px" height="14px" style={{ display: 'inline-block' }} />
                        </div>
                        <Skeleton height="120px" borderRadius="4px" />
                        <div className={styles.locationBox} style={{ marginTop: 'var(--space-4)' }}>
                            <Skeleton height="44px" borderRadius="var(--radius-md)" />
                        </div>
                    </div>

                    <Skeleton height="48px" borderRadius="var(--radius-md)" />
                </div>

                <aside className={styles.analysisSidebar}>
                    <div className={styles.analysisCard}>
                        <div className={styles.statusIndicator}>
                            <SkeletonCircle width="8px" height="8px" style={{ marginRight: 'var(--space-3)' }} />
                            <SkeletonText width="120px" height="10px" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <SkeletonText width="100%" height="10px" />
                            <SkeletonText width="95%" height="10px" />
                            <SkeletonText width="100%" height="10px" />
                            <SkeletonText width="80%" height="10px" />
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
