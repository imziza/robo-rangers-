'use client';

import React from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
    borderRadius?: string;
    style?: React.CSSProperties;
}

export function Skeleton({ className = '', width, height, borderRadius, style }: SkeletonProps) {
    return (
        <div
            className={`${styles.skeleton} ${className}`}
            style={{
                width,
                height,
                borderRadius,
                ...style
            }}
        />
    );
}

export function SkeletonText({ className = '', ...props }: SkeletonProps) {
    return <Skeleton className={`${styles.skeletonText} ${className}`} {...props} />;
}

export function SkeletonTitle({ className = '', ...props }: SkeletonProps) {
    return <Skeleton className={`${styles.skeletonTitle} ${className}`} {...props} />;
}

export function SkeletonCircle({ className = '', ...props }: SkeletonProps) {
    return <Skeleton className={`${styles.skeletonCircle} ${className}`} {...props} />;
}

export function SkeletonCard({ className = '', ...props }: SkeletonProps) {
    return <Skeleton className={`${styles.skeletonCard} ${className}`} {...props} />;
}
