'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
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

        return (
            <button
                ref={ref}
                className={buttonClasses}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && (
                    <span className={styles.spinner}>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeDasharray="31.416"
                                strokeDashoffset="10"
                            />
                        </svg>
                    </span>
                )}
                {leftIcon && !isLoading && <span className={styles.icon}>{leftIcon}</span>}
                <span className={styles.label}>{children}</span>
                {rightIcon && !isLoading && <span className={styles.icon}>{rightIcon}</span>}
            </button>
        );
    }
);

Button.displayName = 'Button';
