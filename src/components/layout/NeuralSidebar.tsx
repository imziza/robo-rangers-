'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import {
    Database, Map as MapIcon, Microscope, Compass, Archive,
    Users, MessageSquare, Plus, LogOut, Sparkles
} from 'lucide-react';
import styles from './NeuralSidebar.module.css';

// --- Configuration ---
const NAV_ITEMS = [
    { id: 'vault', href: '/vault', label: 'Vault', icon: Database },
    { id: 'atlas', href: '/atlas', label: 'Arch-Atlas', icon: MapIcon },
    { id: 'analysis', href: '/analysis', label: 'Analysis', icon: Microscope },
    { id: 'discovery', href: '/discovery', label: 'Discovery', icon: Compass },
    { id: 'archive', href: '/archive', label: 'Archive', icon: Archive },
    { id: 'teams', href: '/teams', label: 'Teams', icon: Users },
    { id: 'messages', href: '/messages', label: 'Messages', icon: MessageSquare },
];

export function NeuralSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createSupabaseBrowserClient();
    const containerRef = useRef<HTMLDivElement>(null);

    // --- State: Chrono-Stack (Recency) ---
    // Initialize with default order, but update as user clicks
    const [stackOrder, setStackOrder] = useState(NAV_ITEMS.map(i => i.id));

    // --- State: Breathing Dock ---
    const [isIdle, setIsIdle] = useState(false);

    // --- Physics: Gravity Wells ---
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Handle interaction to update Chrono-Stack
    const handleInteraction = (id: string) => {
        setStackOrder(prev => {
            const newOrder = prev.filter(item => item !== id);
            return [id, ...newOrder]; // Move clicked to top
        });
    };

    // Idle Timer for Breathing Effect
    useEffect(() => {
        let timeout: NodeJS.Timeout;
        const resetIdle = () => {
            setIsIdle(false);
            clearTimeout(timeout);
            timeout = setTimeout(() => setIsIdle(true), 3000); // 3s interaction -> Breathe
        };

        window.addEventListener('mousemove', resetIdle);
        window.addEventListener('keypress', resetIdle);
        return () => {
            window.removeEventListener('mousemove', resetIdle);
            window.removeEventListener('keypress', resetIdle);
        };
    }, []);

    // Mouse Tracking for Gravity
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);

    return (
        <motion.aside
            ref={containerRef}
            className={styles.ribbonContainer}
            initial={false}
            animate={{ width: 80 }} // Base width
        >
            <div className={`${styles.ribbonBody} ${isIdle ? styles.breathing : ''}`}>
                <div className={styles.amoebaContainer}>
                    {/* Logo (Static Anchor) */}
                    <div className={styles.logo}>
                        <Sparkles size={28} strokeWidth={1.5} />
                    </div>

                    {/* Nav Items with Chrono-Stack & Gravity Logic */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {NAV_ITEMS.map((item) => {
                            const index = stackOrder.indexOf(item.id);
                            // Only apply dramatic stack usage if recently interacted. 
                            // For usability, we keep visual order but change Z-depth/Scale.

                            // Visual Weight calculation based on simple index for now
                            // In a real full impl, we'd actually reorder the DOM or use layout animations
                            // Here we simulate the "3D Stack" visual effect without rearranging DOM to keep navigation consistent
                            const isTop = index === 0;
                            const isBottom = index > 4;

                            return (
                                <GravityItem
                                    key={item.id}
                                    item={item}
                                    isActive={pathname === item.href}
                                    isTop={isTop}
                                    isBottom={isBottom}
                                    mouseX={mouseX}
                                    mouseY={mouseY}
                                    onClick={() => handleInteraction(item.id)}
                                />
                            );
                        })}
                    </div>

                    {/* Footer Actions */}
                    <div className={styles.footer}>
                        <Link href="/analysis" className={styles.navItem} title="New Analysis">
                            <Plus size={20} />
                        </Link>
                        <button
                            onClick={async () => {
                                await supabase.auth.signOut();
                                router.push('/login');
                            }}
                            className={styles.navItem}
                            title="Sign Out"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* SVG Filter for Gooey Effect (Amoeba Edge) if we wanted to push it further */}
            {/* <svg style={{ position: 'absolute', width: 0, height: 0 }}> ... </svg> */}
        </motion.aside>
    );
}

// --- Sub-Component: Gravity Item ---
function GravityItem({ item, isActive, isTop, isBottom, mouseX, mouseY, onClick }: any) {
    const ref = useRef<HTMLAnchorElement>(null);

    // Magnetic Pull Logic
    // Calculate distance from mouse to center of this item
    const x = useTransform(mouseX, (val: number) => {
        if (!ref.current) return 0;
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        // @ts-ignore
        const dist = Math.sqrt(Math.pow(val - centerX, 2) + Math.pow(mouseY.get() - centerY, 2));

        if (dist < 150) { // Gravity Radius
            return (val - centerX) * 0.2; // Pull Strength
        }
        return 0;
    });

    const y = useTransform(mouseY, (val: number) => {
        if (!ref.current) return 0;
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        // @ts-ignore
        const dist = Math.sqrt(Math.pow(mouseX.get() - centerX, 2) + Math.pow(val - centerY, 2));

        if (dist < 150) {
            return (val - centerY) * 0.2;
        }
        return 0;
    });

    const springConfig = { damping: 15, stiffness: 150, mass: 0.1 };
    const springX = useSpring(x, springConfig);
    const springY = useSpring(y, springConfig);

    let stackClass = styles.stackMid;
    if (isActive || isTop) stackClass = styles.stackTop;
    else if (isBottom) stackClass = styles.stackBottom;

    return (
        <motion.div style={{ x: springX, y: springY, zIndex: isActive ? 50 : 1 }}>
            <Link
                ref={ref}
                href={item.href}
                className={`${styles.navItem} ${stackClass} ${isActive ? styles.active : ''}`}
                onClick={onClick}
            >
                <item.icon size={20} strokeWidth={1.5} />
                <div className={styles.gravityRing} />
                <span className={styles.label}>{item.label}</span>

                {/* Ghost Thread Origin Point (Visual only for now) */}
                {isActive && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute right-0 top-1/2 w-8 h-[1px] bg-gold-500/50"
                        style={{ transform: 'translateX(100%)' }}
                    />
                )}
            </Link>
        </motion.div>
    );
}
