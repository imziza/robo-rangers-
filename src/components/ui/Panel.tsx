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
        const {
            initial, animate, exit, transition, variants,
            whileHover, whileTap, whileFocus, whileDrag, whileInView,
            onAnimationStart, onAnimationComplete, onUpdate,
            ...safeProps
        } = props as any;

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
                initial={initial || { opacity: 0, y: 10 }}
                animate={animate || { opacity: 1, y: 0 }}
                transition={transition || { duration: 0.4, ease: "easeOut" }}
                exit={exit}
                variants={variants}
                whileHover={whileHover}
                whileTap={whileTap}
                {...safeProps}
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
