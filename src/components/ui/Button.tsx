'use client';

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import styles from './Button.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            isLoading = false,
            leftIcon,
            rightIcon,
            fullWidth = false,
            disabled,
            children,
            className = '',
            ...props
        },
        ref
    ) => {
        const buttonClasses = [
            styles.button,
            styles[variant],
            styles[size],
            fullWidth ? styles.fullWidth : '',
            isLoading ? styles.loading : '',
            className
        ]
            .filter(Boolean)
            .join(' ');

        // Filter out props that conflict with framer-motion
        const { onAnimationStart, onDragStart, onDragEnd, onDrag, ...safeProps } = props as any;

        return (
            <motion.button
                ref={ref as any}
                className={buttonClasses}
                disabled={disabled || isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                {...safeProps}
            >
                {isLoading && (
                    <span className={styles.spinner}>
                        <Loader2 size={16} />
                    </span>
                )}
                {leftIcon && !isLoading && <span className={styles.icon}>{leftIcon}</span>}
                <span className={styles.label}>{children}</span>
                {rightIcon && !isLoading && <span className={styles.icon}>{rightIcon}</span>}
            </motion.button>
        );
    }
);

Button.displayName = 'Button';
