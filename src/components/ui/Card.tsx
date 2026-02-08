'use client';

import { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Image as ImageIcon } from 'lucide-react';
import styles from './Card.module.css';

export interface CardProps extends HTMLMotionProps<'div'> {
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
    hoverable = false,
    ...props
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

    const {
        initial, animate, exit, transition, variants,
        whileHover, whileTap, whileFocus, whileDrag, whileInView,
        onAnimationStart, onAnimationComplete, onUpdate,
        ...safeProps
    } = props as any;

    return (
        <motion.div
            className={cardClasses}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            whileHover={whileHover || (hoverable || onClick ? { y: -4, transition: { duration: 0.2 } } : {})}
            whileTap={whileTap}
            initial={initial || (variant === 'artifact' ? { opacity: 0, scale: 0.95 } : {})}
            animate={animate || { opacity: 1, scale: 1 }}
            transition={transition}
            exit={exit}
            variants={variants}
            {...safeProps}
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
    image_urls?: string[]; // Supporting multiple images
    classification?: string;
    era?: string;
    material?: string;
    status?: 'stable' | 'critical' | 'pending';
    matchScore?: number;
    digitized?: number; // percentage 0-100
    onClick?: () => void;
}

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';

export function ArtifactCard({
    title,
    imageUrl,
    image_urls = [],
    classification,
    era,
    material,
    status = 'stable',
    matchScore,
    digitized,
    onClick
}: ArtifactCardProps) {
    const urls = image_urls.length > 0 ? image_urls : (imageUrl ? [imageUrl] : []);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (urls.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % urls.length);
        }, 3000 + Math.random() * 2000); // Varied timing for more natural feel
        return () => clearInterval(interval);
    }, [urls.length]);

    return (
        <Card variant="artifact" padding="none" onClick={onClick} hoverable>
            <div className={styles.artifactImageWrapper}>
                {urls.length > 0 ? (
                    <AnimatePresence mode="wait">
                        <motion.img
                            key={urls[currentIndex]}
                            src={urls[currentIndex]}
                            alt={title}
                            className={styles.artifactImage}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                        />
                    </AnimatePresence>
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
