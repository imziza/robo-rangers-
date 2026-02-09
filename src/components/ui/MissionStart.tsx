'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sparkles, Microscope, Globe, ArrowRight, X } from 'lucide-react';
import { Button } from './Button';
import styles from './MissionStart.module.css';

const STEPS = [
    {
        title: "WELCOME TO ALETHEON",
        description: "Your digital gateway to high-fidelity archaeological analysis. Initialize your sensors to begin.",
        icon: Shield,
        color: "var(--gold-primary)"
    },
    {
        title: "THE PRESERVATION VAULT",
        description: "Secure your discoveries in our institucional-grade database. Every specimen is tracked with molecular precision.",
        icon: Sparkles,
        color: "var(--gold-secondary)"
    },
    {
        title: "AI-DRIVEN LABORATORY",
        description: "Leverage DeepSeek R1 for spectrographic mapping and hypothesis generation. Evolve your research beyond theory.",
        icon: Microscope,
        color: "var(--gold-hover)"
    },
    {
        title: "CINEMATIC ARCH-ATLAS",
        description: "Visualize discoveries across time and space. Use the temporal slider to shift through historical eras instantly.",
        icon: Globe,
        color: "var(--gold-primary)"
    }
];

export function MissionStart({ onComplete }: { onComplete: () => void }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem('aletheon_onboarding_complete');
        if (!hasSeenOnboarding) {
            setIsVisible(true);
        }
    }, []);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            complete();
        }
    };

    const complete = () => {
        setIsVisible(false);
        localStorage.setItem('aletheon_onboarding_complete', 'true');
        onComplete?.();
    };

    if (!isVisible) return null;

    const step = STEPS[currentStep];

    return (
        <div className={styles.overlay}>
            <motion.div
                className={styles.modal}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
            >
                <button className={styles.closeBtn} onClick={complete}>
                    <X size={20} />
                </button>

                <div className={styles.progressDots}>
                    {STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={`${styles.dot} ${i === currentStep ? styles.active : ''} ${i < currentStep ? styles.completed : ''}`}
                        />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        className={styles.content}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <div className={styles.iconWrapper} style={{ color: step.color }}>
                            <step.icon size={64} strokeWidth={1} />
                            <div className={styles.iconGlow} style={{ backgroundColor: step.color }} />
                        </div>

                        <h2 className={styles.title}>{step.title}</h2>
                        <p className={styles.description}>{step.description}</p>
                    </motion.div>
                </AnimatePresence>

                <div className={styles.actions}>
                    <Button
                        variant="primary"
                        fullWidth
                        onClick={handleNext}
                        rightIcon={<ArrowRight size={18} />}
                    >
                        {currentStep === STEPS.length - 1 ? "INITIALIZE SYSTEM" : "CONTINUE"}
                    </Button>
                </div>

                <div className={styles.footer}>
                    <span>ALETHEON INTERFACE v4.2 // SECURITY PROTOCOL ACTIVE</span>
                </div>
            </motion.div>
        </div>
    );
}
