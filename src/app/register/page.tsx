'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { ShieldCheck, Lock, User, ChevronRight, Fingerprint, Globe, Key } from 'lucide-react';
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

    // Mock Permissions State
    const [permissions, setPermissions] = useState({
        geoAtlas: true,
        apiSync: false,
        encryption: true
    });

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const togglePermission = (key: keyof typeof permissions) => {
        setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleNext = () => {
        if (step === RegisterStep.PROFILE) {
            if (!formData.fullName || !formData.institution) {
                setError('IDENTITY INCOMPLETE: ALL FIELDS REQUIRED.');
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
            setError('SECURITY ALERT: KEY MISMATCH DETECTED.');
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
                setError(`CLEARANCE DENIED: ${authError.message.toUpperCase()}`);
                return;
            }

            if (data.user) {
                // Success animation delay
                await new Promise(resolve => setTimeout(resolve, 800));
                router.push('/vault');
                router.refresh();
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError('SYSTEM CRITICAL: ENCRYPTION PROTOCOL FAILED.');
        } finally {
            setIsLoading(false);
        }
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 50 : -50,
            opacity: 0
        })
    };

    return (
        <div className={styles.container}>
            <div className={styles.overlay} />
            <div className={styles.grid} />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className={styles.card}
            >
                {/* Header Section */}
                <div className={styles.stepperHeader}>
                    <div className={styles.stepper}>
                        <div className={`${styles.step} ${step >= RegisterStep.PROFILE ? styles.active : ''}`}>
                            <div className={styles.stepIcon}>01</div>
                            <span className={styles.stepLabel}>ID</span>
                        </div>
                        <div className={styles.stepLine} />
                        <div className={`${styles.step} ${step >= RegisterStep.PERMISSIONS ? styles.active : ''}`}>
                            <div className={styles.stepIcon}>02</div>
                            <span className={styles.stepLabel}>LEVEL</span>
                        </div>
                        <div className={styles.stepLine} />
                        <div className={`${styles.step} ${step >= RegisterStep.SECURITY ? styles.active : ''}`}>
                            <div className={styles.stepIcon}>03</div>
                            <span className={styles.stepLabel}>KEY</span>
                        </div>
                    </div>

                    <div className={styles.titleArea}>
                        <h2 className={styles.title}>
                            {step === RegisterStep.PROFILE && "Identity Verification"}
                            {step === RegisterStep.PERMISSIONS && "Clearance Level"}
                            {step === RegisterStep.SECURITY && "Key Generation"}
                        </h2>
                        <p className={styles.subtitle}>
                            {step === RegisterStep.PROFILE && "ESTABLISHING ARCHIVAL PROFILE"}
                            {step === RegisterStep.PERMISSIONS && "SETTING ACCESS PARAMETERS"}
                            {step === RegisterStep.SECURITY && "FINALIZING ENCRYPTION"}
                        </p>
                    </div>
                </div>

                {/* Dynamic Content Area */}
                <div className={styles.contentArea}>
                    <form onSubmit={(e) => step === RegisterStep.SECURITY ? handleRegister(e) : e.preventDefault()} className={styles.formContent}>
                        <AnimatePresence mode="wait" custom={step}>
                            {step === RegisterStep.PROFILE && (
                                <motion.div
                                    key="profile"
                                    custom={step}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.3 }}
                                    className={styles.formContent}
                                >
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Full Legal Name</label>
                                        <div className={styles.inputWrapper}>
                                            <input className={styles.input} onChange={e => updateField('fullName', e.target.value)} value={formData.fullName} required />
                                        </div>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Institution</label>
                                        <div className={styles.inputWrapper}>
                                            <input className={styles.input} onChange={e => updateField('institution', e.target.value)} value={formData.institution} required />
                                        </div>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Field of Specialization</label>
                                        <div className={styles.inputWrapper}>
                                            <input className={styles.input} onChange={e => updateField('specialization', e.target.value)} value={formData.specialization} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === RegisterStep.PERMISSIONS && (
                                <motion.div
                                    key="permissions"
                                    custom={step}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.3 }}
                                    className={styles.formContent}
                                >
                                    <div className={styles.permissionItem} onClick={() => togglePermission('geoAtlas')}>
                                        <div className={styles.permText}>
                                            <strong>Geo-Atlas Tracking</strong>
                                            <span>Global positioning for fieldwork verification</span>
                                        </div>
                                        <div className={`${styles.toggle} ${permissions.geoAtlas ? styles.active : ''}`} />
                                    </div>
                                    <div className={styles.permissionItem} onClick={() => togglePermission('apiSync')}>
                                        <div className={styles.permText}>
                                            <strong>Global Archives Sync</strong>
                                            <span>Connect to Smithsonian & British Museum APIs</span>
                                        </div>
                                        <div className={`${styles.toggle} ${permissions.apiSync ? styles.active : ''}`} />
                                    </div>
                                    <div className={styles.permissionItem} onClick={() => togglePermission('encryption')}>
                                        <div className={styles.permText}>
                                            <strong>E2E Encryption</strong>
                                            <span>Military-grade message security protocols</span>
                                        </div>
                                        <div className={`${styles.toggle} ${permissions.encryption ? styles.active : ''}`} />
                                    </div>
                                </motion.div>
                            )}

                            {step === RegisterStep.SECURITY && (
                                <motion.div
                                    key="security"
                                    custom={step}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.3 }}
                                    className={styles.formContent}
                                >
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Secure Email</label>
                                        <div className={styles.inputWrapper}>
                                            <input type="email" className={styles.input} onChange={e => updateField('email', e.target.value)} value={formData.email} required />
                                        </div>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Private Key (Password)</label>
                                        <div className={styles.inputWrapper}>
                                            <input type="password" className={styles.input} onChange={e => updateField('password', e.target.value)} value={formData.password} required />
                                        </div>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Confirm Key</label>
                                        <div className={styles.inputWrapper}>
                                            <input type="password" className={styles.input} onChange={e => updateField('confirmPassword', e.target.value)} value={formData.confirmPassword} required />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {error && <div className={styles.error}>{error}</div>}

                        <div className={styles.actions}>
                            {step > RegisterStep.PROFILE && (
                                <button type="button" className={styles.backBtn} onClick={() => setStep(prev => prev - 1)}>
                                    BACK
                                </button>
                            )}
                            <button
                                type={step === RegisterStep.SECURITY ? "submit" : "button"}
                                className={styles.nextBtn}
                                onClick={step < RegisterStep.SECURITY ? handleNext : undefined}
                                disabled={isLoading}
                            >
                                {isLoading ? 'PROCESSING...' : step === RegisterStep.SECURITY ? 'GRANT CLEARANCE' : 'PROCEED'}
                                {step < RegisterStep.SECURITY && <ChevronRight size={14} />}
                                {step === RegisterStep.SECURITY && !isLoading && <Fingerprint size={14} />}
                            </button>
                        </div>
                    </form>

                    <div className={styles.footer}>
                        <span>ALREADY CLEARED?</span>
                        <Link href="/login" className={styles.loginLink}>ACCESS TERMINAL</Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
