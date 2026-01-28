'use client';

import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import styles from './Input.module.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    variant?: 'dark' | 'light';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            hint,
            leftIcon,
            rightIcon,
            variant = 'dark',
            className = '',
            id,
            ...props
        },
        ref
    ) => {
        const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

        return (
            <div className={`${styles.container} ${styles[variant]} ${className}`}>
                {label && (
                    <label htmlFor={inputId} className={styles.label}>
                        {label}
                    </label>
                )}
                <div className={`${styles.inputWrapper} ${error ? styles.hasError : ''}`}>
                    {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
                    <input
                        ref={ref}
                        id={inputId}
                        className={`${styles.input} ${leftIcon ? styles.hasLeftIcon : ''} ${rightIcon ? styles.hasRightIcon : ''}`}
                        {...props}
                    />
                    {rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
                </div>
                {error && <span className={styles.error}>{error}</span>}
                {hint && !error && <span className={styles.hint}>{hint}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';

// Textarea variant
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    hint?: string;
    variant?: 'dark' | 'light';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    (
        {
            label,
            error,
            hint,
            variant = 'dark',
            className = '',
            id,
            ...props
        },
        ref
    ) => {
        const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

        return (
            <div className={`${styles.container} ${styles[variant]} ${className}`}>
                {label && (
                    <label htmlFor={textareaId} className={styles.label}>
                        {label}
                    </label>
                )}
                <div className={`${styles.inputWrapper} ${error ? styles.hasError : ''}`}>
                    <textarea
                        ref={ref}
                        id={textareaId}
                        className={styles.textarea}
                        {...props}
                    />
                </div>
                {error && <span className={styles.error}>{error}</span>}
                {hint && !error && <span className={styles.hint}>{hint}</span>}
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';
