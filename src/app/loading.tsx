'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function Loading() {
    const [progress, setProgress] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const controls = useAnimation();

    const handleInteraction = useCallback(() => {
        if (isComplete) return;

        setProgress(prev => {
            const next = Math.min(prev + 5, 100);
            if (next === 100) {
                setTimeout(() => setIsComplete(true), 500);
            }
            return next;
        });
    }, [isComplete]);

    // Auto-progress slowly if user doesn't interact
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => Math.min(prev + 0.5, 95));
        }, 200);
        return () => clearInterval(interval);
    }, []);

    return (
        <div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0a] overflow-hidden cursor-crosshair"
            onMouseMove={handleInteraction}
            onClick={handleInteraction}
            onTouchMove={handleInteraction}
        >
            {/* Ambient Background Glows */}
            <motion.div
                className="absolute inset-0 opacity-20"
                animate={{
                    background: `radial-gradient(circle at 50% 50%, rgba(201, 162, 39, ${progress / 200}) 0%, transparent 70%)`
                }}
            />

            {/* Background Stars - activating based on progress */}
            <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 50 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full"
                        style={{
                            top: `${(i * 13 + 7) % 100}%`,
                            left: `${(i * 7 + 13) % 100}%`,
                        }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                            opacity: progress > (i * 2) ? 0.4 : 0,
                            scale: progress > (i * 2) ? 1 : 0,
                        }}
                    />
                ))}
            </div>

            {/* Central Logo Experience */}
            <div className="relative group">
                {/* Logo Outline (Sleeping) */}
                <motion.div
                    animate={{
                        scale: [1, 1.05, 1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                    <Sparkles className="w-24 h-24 text-gold-500/20" strokeWidth={1} />
                </motion.div>

                {/* Logo Filling with Glow */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                            height: `${progress}%`,
                            opacity: progress / 100
                        }}
                        className="overflow-hidden absolute bottom-0"
                    >
                        <Sparkles className="w-24 h-24 text-gold-400 fill-gold-400/20" strokeWidth={1.5} />
                    </motion.div>
                </div>

                {/* Interaction Pulses */}
                <AnimatePresence>
                    {progress > 0 && progress < 100 && (
                        <motion.div
                            key={progress}
                            initial={{ scale: 0.8, opacity: 0.5 }}
                            animate={{ scale: 2, opacity: 0 }}
                            className="absolute inset-0 border border-gold-500/30 rounded-full pointer-events-none"
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Status Text */}
            <motion.div
                className="mt-12 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <p className="text-gold-500/40 text-xs tracking-[0.4em] uppercase font-light mb-2">
                    {progress < 100 ? "Initializing World State" : "Arrival Confirmed"}
                </p>
                <div className="h-px w-48 bg-white/5 relative mx-auto">
                    <motion.div
                        className="absolute inset-0 bg-gold-500/50"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                    />
                </div>
                {progress < 100 && (
                    <p className="mt-4 text-white/20 text-[10px] italic">
                        Touch to accelerate awakening
                    </p>
                )}
            </motion.div>

            {/* Interactive Particles (Trailing effect) */}
            <InteractiveParticles progress={progress} />
        </div>
    );
}

function InteractiveParticles({ progress }: { progress: number }) {
    const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);

    useEffect(() => {
        const handleMove = (e: MouseEvent | TouchEvent) => {
            const x = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
            const y = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

            const id = Date.now();
            setParticles(prev => [...prev.slice(-15), { id, x, y }]);
            setTimeout(() => {
                setParticles(prev => prev.filter(p => p.id !== id));
            }, 1000);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleMove);
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('touchmove', handleMove);
        };
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {particles.map(p => (
                <motion.div
                    key={p.id}
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 0, opacity: 0 }}
                    className="absolute w-1 h-1 bg-gold-300 rounded-full blur-[1px]"
                    style={{ left: p.x, top: p.y }}
                />
            ))}
        </div>
    );
}
