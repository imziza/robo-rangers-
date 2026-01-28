'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthLayout } from '@/components/layout/AuthLayout';
import styles from './page.module.css';

enum RegisterStep {
    PROFILE = 1,
    PERMISSIONS = 2,
    SECURITY = 3,
}

export default function RegisterPage() {
    const router = useRouter();
    const supabase = createSupabaseBrowserClient();

    const [step, setStep] = useState<RegisterStep>(RegisterStep.PROFILE);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        fullName: '',
        institution: '',
        specialization: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNext = () => {
        if (step === RegisterStep.PROFILE) {
            if (!formData.fullName || !formData.institution) {
                setError('Please provide your full identity and institutional affiliation.');
                return;
            }
            setError(null);
            setStep(RegisterStep.PERMISSIONS);
        } else if (step === RegisterStep.PERMISSIONS) {
            setStep(RegisterStep.SECURITY);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError('Access Keys do not match. Integrity check failed.');
            setIsLoading(false);
            return;
        }

        try {
            const { data, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        institution: formData.institution,
                        specialization: formData.specialization,
                    }
                }
            });

            if (authError) {
                setError(`AUTHORIZATION FAILED: ${authError.message.toUpperCase()}`);
                return;
            }

            if (data.user) {
                // Success - redirect to vault
                router.push('/vault');
                router.refresh();
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError('SYSTEM CRITICAL: Protocol execution failed.');
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
                {/* Stepper Header */}
                <div className={styles.stepper}>
                    <div className={`${styles.step} ${step >= RegisterStep.PROFILE ? styles.active : ''}`}>
                        <span className={styles.stepNum}>01</span>
                        <span className={styles.stepLabel}>PROFILE</span>
                    </div>
                    <div className={styles.stepLine} />
                    <div className={`${styles.step} ${step >= RegisterStep.PERMISSIONS ? styles.active : ''}`}>
                        <span className={styles.stepNum}>02</span>
                        <span className={styles.stepLabel}>ACCESS</span>
                    </div>
                    <div className={styles.stepLine} />
                    <div className={`${styles.step} ${step >= RegisterStep.SECURITY ? styles.active : ''}`}>
                        <span className={styles.stepNum}>03</span>
                        <span className={styles.stepLabel}>SECURITY</span>
                    </div>
                </div>

                <div className={styles.header}>
                    <h1 className={styles.title}>
                        {step === RegisterStep.PROFILE && "Researcher Identity"}
                        {step === RegisterStep.PERMISSIONS && "Institutional Clearance"}
                        {step === RegisterStep.SECURITY && "Account Encryption"}
                    </h1>
                    <p className={styles.subtitle}>
                        {step === RegisterStep.PROFILE && "ESTABLISHING ARCHIVAL CREDENTIALS"}
                        {step === RegisterStep.PERMISSIONS && "SELECTING CLEARANCE PARAMETERS"}
                        {step === RegisterStep.SECURITY && "LOCKING SECURE ACCESS PROTOCOLS"}
                    </p>
                </div>

                <form onSubmit={(e) => step === RegisterStep.SECURITY ? handleRegister(e) : e.preventDefault()}>
                    <AnimatePresence mode="wait">
                        {step === RegisterStep.PROFILE && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className={styles.stepContent}
                            >
                                <Input
                                    label="FULL LEGAL NAME"
                                    value={formData.fullName}
                                    onChange={(e) => updateField('fullName', e.target.value)}
                                    placeholder="DR. JULIAN THORNE"
                                    variant="dark"
                                    required
                                />
                                <Input
                                    label="PRIMARY INSTITUTION"
                                    value={formData.institution}
                                    onChange={(e) => updateField('institution', e.target.value)}
                                    placeholder="INSTITUTE OF CLASSICAL ARCHAEOLOGY"
                                    variant="dark"
                                    required
                                />
                                <Input
                                    label="CORE SPECIALIZATION"
                                    value={formData.specialization}
                                    onChange={(e) => updateField('specialization', e.target.value)}
                                    placeholder="BRONZE AGE METALLURGY"
                                    variant="dark"
                                />
                            </motion.div>
                        )}

                        {step === RegisterStep.PERMISSIONS && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className={styles.stepContent}
                            >
                                <div className={styles.permissionItem}>
                                    <div className={styles.permText}>
                                        <strong>Geo-Atlas Access</strong>
                                        <span>Allow GPS pinpointing for discovery verification.</span>
                                    </div>
                                    <div className={styles.toggle} />
                                </div>
                                <div className={styles.permissionItem}>
                                    <div className={styles.permText}>
                                        <strong>Smithsonian Search API</strong>
                                        <span>Link global archives for semantic comparative matching.</span>
                                    </div>
                                    <div className={styles.toggle} />
                                </div>
                                <div className={styles.permissionItem}>
                                    <div className={styles.permText}>
                                        <strong>E2EE Messaging</strong>
                                        <span>Initialize end-to-end encryption for team collaboration.</span>
                                    </div>
                                    <div className={styles.toggle} />
                                </div>
                            </motion.div>
                        )}

                        {step === RegisterStep.SECURITY && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className={styles.stepContent}
                            >
                                <Input
                                    label="INSTITUTIONAL EMAIL"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => updateField('email', e.target.value)}
                                    placeholder="j.thorne@ica.edu"
                                    variant="dark"
                                    required
                                />
                                <Input
                                    label="NEW ACCESS KEY"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => updateField('password', e.target.value)}
                                    placeholder="••••••••"
                                    variant="dark"
                                    required
                                />
                                <Input
                                    label="CONFIRM ACCESS KEY"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                                    placeholder="••••••••"
                                    variant="dark"
                                    required
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {error && (
                        <div className={styles.error}>{error}</div>
                    )}

                    <div className={styles.actions}>
                        {step > RegisterStep.PROFILE && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setStep(prev => prev - 1)}
                                className={styles.backBtn}
                            >
                                PREVIOUS
                            </Button>
                        )}
                        <Button
                            type={step === RegisterStep.SECURITY ? "submit" : "button"}
                            variant="primary"
                            fullWidth={step === RegisterStep.PROFILE}
                            onClick={step < RegisterStep.SECURITY ? handleNext : undefined}
                            isLoading={isLoading}
                            className={styles.nextBtn}
                        >
                            {step === RegisterStep.SECURITY ? "SUBMIT ARCHIVAL CLEARANCE" : "CONTINUE"}
                        </Button>
                    </div>
                </form>

                <div className={styles.footer}>
                    <span>Already authorized?</span>
                    <Link href="/login" className={styles.loginLink}>LOGIN</Link>
                </div>
            </motion.div>
        </AuthLayout>
    );
}
