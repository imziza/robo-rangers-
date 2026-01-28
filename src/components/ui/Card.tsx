'use client';

import { ReactNode } from 'react';
import styles from './Card.module.css';

export interface CardProps {
    children: ReactNode;
    variant?: 'default' | 'elevated' | 'bordered' | 'artifact';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    className?: string;
    onClick?: () => void;
    hoverable?: boolean;
}

export function Card({
    children,
    variant = 'default',
    padding = 'md',
    className = '',
    onClick,
    hoverable = false
}: CardProps) {
    const cardClasses = [
        styles.card,
        styles[variant],
        styles[`padding-${padding}`],
        hoverable || onClick ? styles.hoverable : '',
        onClick ? styles.clickable : '',
        className
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={cardClasses} onClick={onClick} role={onClick ? 'button' : undefined}>
            {children}
        </div>
    );
}

// Artifact Card - specialized for artifact display
export interface ArtifactCardProps {
    id: string;
    title: string;
    imageUrl?: string;
    classification?: string;
    era?: string;
    material?: string;
    status?: 'stable' | 'critical' | 'pending';
    matchScore?: number;
    digitized?: number; // percentage 0-100
    onClick?: () => void;
}

export function ArtifactCard({
    title,
    imageUrl,
    classification,
    era,
    material,
    status = 'stable',
    matchScore,
    digitized,
    onClick
}: ArtifactCardProps) {
    return (
        <Card variant="artifact" padding="none" onClick={onClick} hoverable>
            <div className={styles.artifactImageWrapper}>
                {imageUrl ? (
                    <img src={imageUrl} alt={title} className={styles.artifactImage} />
                ) : (
                    <div className={styles.artifactPlaceholder}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="m21 15-5-5L5 21" />
                        </svg>
                    </div>
                )}

                {status && (
                    <span className={`${styles.statusBadge} ${styles[`status-${status}`]}`}>
                        {status}
                    </span>
                )}

                {matchScore !== undefined && (
                    <span className={styles.matchBadge}>
                        {Math.round(matchScore * 100)}% Match
                    </span>
                )}
            </div>

            <div className={styles.artifactContent}>
                <h4 className={styles.artifactTitle}>{title}</h4>

                <div className={styles.artifactMeta}>
                    {classification && <span className={styles.metaTag}>{classification}</span>}
                    {era && <span className={styles.metaTag}>{era}</span>}
                </div>

                {digitized !== undefined && (
                    <div className={styles.digitizedBar}>
                        <div className={styles.digitizedProgress} style={{ width: `${digitized}%` }} />
                        <span className={styles.digitizedLabel}>{digitized}% Digitized</span>
                    </div>
                )}
            </div>
        </Card>
    );
}
