'use client';

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, useId, ReactNode } from 'react';
import { motion } from 'framer-motion';
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
        const generatedId = useId();
        const inputId = id || generatedId;

        return (
            <div className={`${styles.container} ${styles[variant]} ${className}`}>
                {label && (
                    <label htmlFor={inputId} className={styles.label}>
                        {label}
                    </label>
                )}
                <motion.div
                    className={`${styles.inputWrapper} ${error ? styles.hasError : ''}`}
                    whileFocus={{ scale: 1.01 }}
                >
                    {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
                    <input
                        ref={ref}
                        id={inputId}
                        className={`${styles.input} ${leftIcon ? styles.hasLeftIcon : ''} ${rightIcon ? styles.hasRightIcon : ''}`}
                        {...props}
                    />
                    {rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
                </motion.div>
                {error && <span className={styles.error}>{error}</span>}
                {hint && !error && <span className={styles.hint}>{hint}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';

// Textarea variant
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
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
        const generatedId = useId();
        const textareaId = id || generatedId;

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

// Select variant
export interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    hint?: string;
    variant?: 'dark' | 'light';
    options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    (
        {
            label,
            error,
            hint,
            variant = 'dark',
            className = '',
            id,
            options,
            ...props
        },
        ref
    ) => {
        const generatedId = useId();
        const selectId = id || generatedId;

        return (
            <div className={`${styles.container} ${styles[variant]} ${className}`}>
                {label && (
                    <label htmlFor={selectId} className={styles.label}>
                        {label}
                    </label>
                )}
                <div className={`${styles.inputWrapper} ${error ? styles.hasError : ''}`}>
                    <select
                        ref={ref as any}
                        id={selectId}
                        className={styles.select}
                        {...props as any}
                    >
                        {options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
                {error && <span className={styles.error}>{error}</span>}
                {hint && !error && <span className={styles.hint}>{hint}</span>}
            </div>
        );
    }
);

Select.displayName = 'Select';
