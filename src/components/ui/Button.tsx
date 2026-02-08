'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
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

        // Filter out props that conflict with framer-motion if they were to be passed to a regular DOM element
        // Since we are using motion.button, we should only filter them if we were passing to a regular 'button'
        // But the memory says "filter out motion-specific props ... before spreading to underlying HTML elements"
        // motion.button IS the element here. If we pass 'initial' to Button, it should go to motion.button.

        // However, if some props are NOT meant for motion but are passed anyway, we should clean them.
        // The real issue usually happens when we spread motion props to a standard div/button.

        // To be safe and follow the directive:
        const {
            initial, animate, exit, transition, variants,
            whileHover, whileTap, whileFocus, whileDrag, whileInView,
            onAnimationStart, onAnimationComplete, onUpdate,
            ...safeProps
        } = props as any;

        return (
            <motion.button
                ref={ref as any}
                className={buttonClasses}
                disabled={disabled || isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={initial}
                animate={animate}
                exit={exit}
                transition={transition}
                variants={variants}
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
