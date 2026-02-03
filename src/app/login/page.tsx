'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { AlertCircle, ShieldCheck, Sparkles, Lock } from 'lucide-react';
import styles from './page.module.css';

export default function LoginPage() {
    const router = useRouter();
    const supabase = createSupabaseBrowserClient();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [focusedField, setFocusedField] = useState<string | null>(null);

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
                    setError('ACCESS DENIED: IDENTITY VERIFICATION FAILED.');
                } else {
                    setError(`CREDENTIAL ERROR: ${authError.message.toUpperCase()}`);
                }
                return;
            }

            // Successful login animation delay
            await new Promise(resolve => setTimeout(resolve, 800));
            router.push('/vault');
            router.refresh();
        } catch (err) {
            console.error('Login error:', err);
            setError('SYSTEM FAILURE: UNABLE TO CONTACT AUTH NODE.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* Ambient Background */}
            <div className={styles.overlay} />
            <div className={styles.grid} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className={styles.card}
            >
                <div className={styles.header}>
                    <motion.div
                        className={styles.logoIcon}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Sparkles size={32} strokeWidth={1} />
                    </motion.div>
                    <h1 className={styles.title}>Preservation</h1>
                    <p className={styles.subtitle}>SECURE ARCHIVE ACCESS TERMINAL</p>
                </div>

                <form className={styles.form} onSubmit={handleLogin}>
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Researcher Identity</label>
                        <div className={styles.inputWrapper}>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                                className={styles.input}
                                placeholder="INSTITUTIONAL ID"
                                required
                            />
                            <div className={styles.biometricScan} />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Security Clearance</label>
                        <div className={styles.inputWrapper}>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                                className={styles.input}
                                placeholder="ACCESS KEY"
                                required
                            />
                            <div className={styles.biometricScan} />
                        </div>
                        <Link href="/forgot-password" className={styles.forgotLink}>
                            RESET KEY?
                        </Link>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className={styles.error}
                            >
                                <AlertCircle size={16} />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <motion.span
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            >
                                VERIFYING BIOMETRICS...
                            </motion.span>
                        ) : (
                            'INITIATE SESSION'
                        )}
                    </button>
                </form>

                <div className={styles.footer}>
                    <span>NEW RESEARCHER?</span>
                    <Link href="/register" className={styles.registerLink}>
                        APPLY FOR CLEARANCE
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
