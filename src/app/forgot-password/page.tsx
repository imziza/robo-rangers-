'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthLayout } from '@/components/layout/AuthLayout';
import styles from './page.module.css';

export default function ForgotPasswordPage() {
    const supabase = createSupabaseBrowserClient();

    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
            });

            if (resetError) {
                setError(`RECOVERY ERROR: ${resetError.message.toUpperCase()}`);
                return;
            }

            setIsSent(true);
        } catch (err) {
            console.error('Reset error:', err);
            setError('SYSTEM FAILURE: Recovery sequence failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout>
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={styles.card}
            >
                <div className={styles.header}>
                    <h1 className={styles.title}>Recovery Protocol</h1>
                    <p className={styles.subtitle}>RESET ARCHIVAL ACCESS KEY</p>
                </div>

                {!isSent ? (
                    <form className={styles.form} onSubmit={handleReset}>
                        <p className={styles.infoText}>
                            Enter your institutional email to receive a secure recovery link.
                        </p>
                        <Input
                            label="INSTITUTIONAL EMAIL"
                            type="email"
                            placeholder="researcher@institution.edu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            variant="light"
                        />

                        {error && (
                            <div className={styles.error}>{error}</div>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            isLoading={isLoading}
                        >
                            INITIATE RECOVERY
                        </Button>
                    </form>
                ) : (
                    <div className={styles.successWrapper}>
                        <div className={styles.successIcon}>✓</div>
                        <h2 className={styles.successTitle}>Protocol Initiated</h2>
                        <p className={styles.successText}>
                            A secure recovery link has been dispatched to <strong>{email}</strong>.
                            Please check your institutional inbox.
                        </p>
                        <Link href="/login" className={styles.returnLink}>
                            RETURN TO ARCHIVE LOGIN
                        </Link>
                    </div>
                )}

                {!isSent && (
                    <div className={styles.footer}>
                        <Link href="/login" className={styles.backLink}>
                            RETURN TO LOGIN
                        </Link>
                    </div>
                )}
            </motion.div>
        </AuthLayout>
    );
}
