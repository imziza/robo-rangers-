'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { LivingLightBackground } from '@/components/ui/LivingLightBackground';
import styles from './page.module.css';

export default function LoginPage() {
    const router = useRouter();
    const supabase = createSupabaseBrowserClient();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isTyping, setIsTyping] = useState(false);

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
            <LivingLightBackground />

            {/* Typing Reaction Pulse */}
            <AnimatePresence>
                {isTyping && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 pointer-events-none z-[-1] bg-gold-500/5 transition-colors duration-1000"
                    />
                )}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={styles.card}
            >
                <div className={styles.header}>
                    <h1 className={styles.title}>Secure Archive Access</h1>
                    <p className={styles.subtitle}>LOGIN TO THE ALETHEON PRESERVATION NETWORK</p>
                </div>

                <form className={styles.form} onSubmit={handleLogin}>
                    <div className="relative">
                        <Input
                            label="INSTITUTIONAL EMAIL"
                            type="email"
                            placeholder="researcher@institution.edu"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setIsTyping(true);
                                setTimeout(() => setIsTyping(false), 1000);
                            }}
                            onFocus={() => setIsTyping(true)}
                            onBlur={() => setIsTyping(false)}
                            required
                            variant="dark"
                            className={styles.input}
                        />
                        {isTyping && (
                            <motion.div
                                layoutId="pulse"
                                className="absolute -inset-1 border border-gold-500/20 rounded-lg pointer-events-none"
                                animate={{ opacity: [0, 0.5, 0], scale: [1, 1.05, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        )}
                    </div>

                    <div className={styles.passwordWrapper}>
                        <div className="relative">
                            <Input
                                label="ACCESS KEY"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setIsTyping(true);
                                    setTimeout(() => setIsTyping(false), 1000);
                                }}
                                onFocus={() => setIsTyping(true)}
                                onBlur={() => setIsTyping(false)}
                                required
                                variant="dark"
                                className={styles.input}
                            />
                            {isTyping && (
                                <motion.div
                                    layoutId="pulse"
                                    className="absolute -inset-1 border border-gold-500/20 rounded-lg pointer-events-none"
                                    animate={{ opacity: [0, 0.5, 0], scale: [1, 1.05, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            )}
                        </div>
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
                            <AlertCircle size={16} className={styles.errorIcon} />
                            {error}
                        </motion.div>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        isLoading={isLoading}
                        className={styles.submitBtn}
                        leftIcon={<ShieldCheck size={18} />}
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
