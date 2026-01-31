'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { SecurityShield } from '@/components/ui/SecurityShield';
import { LivingLightBackground } from '@/components/ui/LivingLightBackground';
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
    const [isTyping, setIsTyping] = useState(false);

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 1000);
    };

    const getPasswordStrength = (pass: string) => {
        if (!pass) return -1;
        let strength = 0;
        if (pass.length > 6) strength++;
        if (pass.length > 10) strength++;
        if (/[A-Z]/.test(pass)) strength++;
        if (/[0-9!@#$%^&*]/.test(pass)) strength++;
        return strength as 0 | 1 | 2 | 3 | 4;
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
            <LivingLightBackground />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
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
                                <SecurityShield strength={getPasswordStrength(formData.password)} />

                                <Input
                                    label="INSTITUTIONAL EMAIL"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => updateField('email', e.target.value)}
                                    placeholder="j.thorne@ica.edu"
                                    variant="dark"
                                    required
                                />
                                <div className="relative">
                                    <Input
                                        label="NEW ACCESS KEY"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => updateField('password', e.target.value)}
                                        placeholder="••••••••"
                                        variant="dark"
                                        required
                                    />
                                    {isTyping && (
                                        <motion.div
                                            className="absolute bottom-0 left-0 h-0.5 bg-gold-500/50"
                                            initial={{ width: 0 }}
                                            animate={{ width: '100%' }}
                                            transition={{ duration: 0.2 }}
                                        />
                                    )}
                                </div>
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
