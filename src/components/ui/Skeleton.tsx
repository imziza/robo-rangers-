'use client';

import React from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
    borderRadius?: string;
    circle?: boolean;
    style?: React.CSSProperties;
}

export function Skeleton({
    className = '',
    width,
    height,
    borderRadius,
    circle,
    style
}: SkeletonProps) {
    return (
        <div
            className={`${styles.skeleton} ${className}`}
            style={{
                width: width || '100%',
                height: height || '20px',
                borderRadius: circle ? '50%' : (borderRadius || 'var(--radius-sm)'),
                ...style
            }}
        >
            <div className={styles.shimmer} />
        </div>
    );
}

export function SkeletonText({ lines = 3, ...props }: SkeletonProps & { lines?: number }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            {Array(lines).fill(0).map((_, i) => (
                <Skeleton
                    key={i}
                    {...props}
                    width={i === lines - 1 ? '60%' : '100%'}
                    height="12px"
                />
            ))}
        </div>
    );
}

export function SkeletonCircle(props: SkeletonProps) {
    return <Skeleton circle {...props} />;
}

export function SkeletonCard({ height = '320px', ...props }: SkeletonProps) {
    return (
        <div className={styles.skeletonCardWrapper} style={{ height }}>
            <Skeleton height="60%" borderRadius="var(--radius-md) var(--radius-md) 0 0" />
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Skeleton height="20px" width="80%" />
                <SkeletonText lines={2} />
            </div>
        </div>
    );
}
