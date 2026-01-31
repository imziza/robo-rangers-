'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimationFrame, useMotionValue, useSpring } from 'framer-motion';

interface Trail {
    id: number;
    x: number;
    y: number;
    age: number;
}

export function LivingLightBackground() {
    const [trails, setTrails] = useState<Trail[]>([]);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Parallax stars
    const springConfig = { damping: 25, stiffness: 150 };
    const starX = useSpring(useMotionValue(0), springConfig);
    const starY = useSpring(useMotionValue(0), springConfig);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);

            // Move stars in parallax
            const moveX = (e.clientX - window.innerWidth / 2) / 50;
            const moveY = (e.clientY - window.innerHeight / 2) / 50;
            starX.set(moveX);
            starY.set(moveY);

            // Add trail
            const id = Date.now() + Math.random();
            setTrails(prev => [...prev.slice(-20), { id, x: e.clientX, y: e.clientY, age: 0 }]);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY, starX, starY]);

    useAnimationFrame(() => {
        setTrails(prev =>
            prev
                .map(t => ({ ...t, age: t.age + 0.05 }))
                .filter(t => t.age < 1)
        );
    });

    return (
        <div className="fixed inset-0 z-[-1] bg-[#050505] overflow-hidden pointer-events-none">
            {/* Base Atmosphere */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(201,162,39,0.03)_0%,transparent_70%)]" />

            {/* Stars with Parallax */}
            <motion.div
                className="absolute inset-[-50px] opacity-10"
                style={{ x: starX, y: starY }}
            >
                <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] bg-repeat" />
            </motion.div>

            {/* Mouse Glow */}
            <motion.div
                className="absolute w-[400px] h-[400px] rounded-full bg-gold-500/5 blur-[100px]"
                style={{
                    left: mouseX,
                    top: mouseY,
                    x: '-50%',
                    y: '-50%'
                }}
            />

            {/* Trails */}
            <svg className="absolute inset-0 w-full h-full">
                {trails.map((t, i) => {
                    const next = trails[i + 1];
                    if (!next) return null;
                    return (
                        <motion.line
                            key={t.id}
                            x1={t.x}
                            y1={t.y}
                            x2={next.x}
                            y2={next.y}
                            stroke="rgba(201, 162, 39, 0.2)"
                            strokeWidth={2 * (1 - t.age)}
                            initial={{ opacity: 0.5 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 1 }}
                        />
                    );
                })}
            </svg>

            {/* Subtle Fog/Smoke effect */}
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/foggy-birds.png')] animate-[pulse_10s_ease-in-out_infinite]" />
            </div>
        </div>
    );
}
