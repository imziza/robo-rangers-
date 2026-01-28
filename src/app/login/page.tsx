'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthLayout } from '@/components/layout/AuthLayout';
import styles from './page.module.css';

export default function LoginPage() {
    const router = useRouter();
    const supabase = createSupabaseBrowserClient();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                if (authError.message === 'Invalid login credentials') {
                    setError('ACCESS DENIED: The credentials provided do not match our archival records.');
                } else {
                    setError(`CREDENTIAL ERROR: ${authError.message.toUpperCase()}`);
                }
                return;
            }

            // Successful login
            router.push('/vault');
            router.refresh();
        } catch (err) {
            console.error('Login error:', err);
            setError('SYSTEM FAILURE: Unable to establish secure connection with Auth Node.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={styles.card}
            >
                <div className={styles.header}>
                    <h1 className={styles.title}>Secure Archive Access</h1>
                    <p className={styles.subtitle}>LOGIN TO THE ALETHEON PRESERVATION NETWORK</p>
                </div>

                <form className={styles.form} onSubmit={handleLogin}>
                    <Input
                        label="INSTITUTIONAL EMAIL"
                        type="email"
                        placeholder="researcher@institution.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        variant="dark"
                        className={styles.input}
                    />

                    <div className={styles.passwordWrapper}>
                        <Input
                            label="ACCESS KEY"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            variant="dark"
                            className={styles.input}
                        />
                        <Link href="/forgot-password" className={styles.forgotLink}>
                            FORGOT ACCESS KEY?
                        </Link>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={styles.error}
                        >
                            <span className={styles.errorIcon}>⚠</span>
                            {error}
                        </motion.div>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        isLoading={isLoading}
                        className={styles.submitBtn}
                    >
                        AUTHORIZE ACCESS
                    </Button>
                </form>

                <div className={styles.footer}>
                    <span>New to the archives?</span>
                    <Link href="/register" className={styles.registerLink}>
                        REQUEST CLEARANCE
                    </Link>
                </div>
            </motion.div>
        </AuthLayout>
    );
}
