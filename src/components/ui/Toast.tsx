'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import styles from './Toast.module.css';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info', duration = 5000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type, duration }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className={styles.toastContainer}>
                <AnimatePresence>
                    {toasts.map(toast => (
                        <motion.div
                            key={toast.id}
                            layout
                            initial={{ opacity: 0, y: 50, scale: 0.3 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                            className={`${styles.toast} ${styles[toast.type]}`}
                        >
                            <div className={styles.icon}>
                                {toast.type === 'success' && <CheckCircle size={18} />}
                                {toast.type === 'error' && <AlertCircle size={18} />}
                                {toast.type === 'info' && <Info size={18} />}
                                {toast.type === 'warning' && <AlertTriangle size={18} />}
                            </div>
                            <span className={styles.message}>{toast.message}</span>
                            <button onClick={() => removeToast(toast.id)} className={styles.closeBtn}>
                                <X size={14} />
                            </button>
                            <motion.div
                                className={styles.progress}
                                initial={{ width: '100%' }}
                                animate={{ width: 0 }}
                                transition={{ duration: (toast.duration || 5000) / 1000, ease: 'linear' }}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
}
