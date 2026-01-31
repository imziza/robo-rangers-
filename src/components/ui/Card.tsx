'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon } from 'lucide-react';
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
        <motion.div
            className={cardClasses}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            whileHover={hoverable || onClick ? { y: -4, transition: { duration: 0.2 } } : {}}
            initial={variant === 'artifact' ? { opacity: 0, scale: 0.95 } : {}}
            animate={{ opacity: 1, scale: 1 }}
        >
            {children}
        </motion.div>
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
                        <ImageIcon size={40} strokeWidth={1} />
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
