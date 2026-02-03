'use client';

import { ReactNode, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import styles from './Panel.module.css';

interface PanelProps extends HTMLMotionProps<'div'> {
    children: ReactNode;
    variant?: 'glass' | 'void' | 'metal' | 'outline';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    elevation?: 0 | 1 | 2 | 3;
    className?: string;
}

export const Panel = forwardRef<HTMLDivElement, PanelProps>(
    ({ children, variant = 'glass', padding = 'md', elevation = 0, className = '', ...props }, ref) => {
        return (
            <motion.div
                ref={ref}
                className={`
                    ${styles.panel} 
                    ${styles[variant]} 
                    ${styles[`padding-${padding}`]} 
                    ${styles[`elevation-${elevation}`]} 
                    ${className}
                `}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                {...props}
            >
                {/* Texture Overlay for Metal/Noise */}
                {variant !== 'outline' && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: 'var(--texture-noise)',
                        opacity: 0.05,
                        pointerEvents: 'none',
                        mixBlendMode: 'overlay'
                    }} />
                )}

                <div style={{ position: 'relative', zIndex: 2 }}>
                    {children}
                </div>
            </motion.div>
        );
    }
);

Panel.displayName = 'Panel';
