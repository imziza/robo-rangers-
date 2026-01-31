'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, ShieldCheck, ShieldOff } from 'lucide-react';

interface SecurityShieldProps {
    strength: number; // 0 to 4
}

export function SecurityShield({ strength }: SecurityShieldProps) {
    const getStrengthDetails = () => {
        switch (strength) {
            case 0:
                return {
                    icon: <ShieldOff className="w-8 h-8 text-red-500/50" />,
                    message: "That one wouldn't survive a gentle breeze.",
                    color: "text-red-500",
                    glow: "bg-red-500/10"
                };
            case 1:
                return {
                    icon: <ShieldAlert className="w-8 h-8 text-orange-500/50" />,
                    message: "Getting stronger. Not invincible yet.",
                    color: "text-orange-500",
                    glow: "bg-orange-500/10"
                };
            case 2:
                return {
                    icon: <Shield className="w-8 h-8 text-yellow-500/50" />,
                    message: "A solid baseline of protection.",
                    color: "text-yellow-500",
                    glow: "bg-yellow-500/10"
                };
            case 3:
                return {
                    icon: <ShieldCheck className="w-8 h-8 text-gold-500/50" />,
                    message: "Now that's solid protection.",
                    color: "text-gold-500",
                    glow: "bg-gold-500/10"
                };
            case 4:
                return {
                    icon: <ShieldCheck className="w-8 h-8 text-emerald-500" />,
                    message: "Fortress status achieved.",
                    color: "text-emerald-500",
                    glow: "bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                };
            default:
                return {
                    icon: <ShieldOff className="w-8 h-8 text-gray-500" />,
                    message: "Awaiting security parameters...",
                    color: "text-gray-500",
                    glow: "bg-gray-500/5"
                };
        }
    };

    const details = getStrengthDetails();

    return (
        <div className="flex flex-col items-center gap-4 py-6">
            <div className="relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={strength}
                        initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 1.2, opacity: 0, rotate: 10 }}
                        className={`p-4 rounded-full ${details.glow} border border-current/20 transition-all duration-500`}
                    >
                        {details.icon}
                    </motion.div>
                </AnimatePresence>

                {/* Evolution Aura */}
                {strength >= 3 && (
                    <motion.div
                        className="absolute inset-0 rounded-full border border-current/30"
                        animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                )}
            </div>

            <motion.p
                key={details.message}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-[10px] tracking-[0.2em] uppercase font-medium ${details.color} text-center max-w-[200px] leading-relaxed`}
            >
                {details.message}
            </motion.p>
        </div>
    );
}
