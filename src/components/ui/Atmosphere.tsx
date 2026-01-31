'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';
import styles from './Atmosphere.module.css';

export function Atmosphere() {
    const { theme } = useTheme();

    return (
        <div className={styles.container}>
            <AnimatePresence mode="wait">
                {theme === 'ambient' && (
                    <motion.div
                        key="ambient-atmosphere"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2 }}
                        className={styles.ambientWrapper}
                    >
                        <div className={styles.nebula1} />
                        <div className={styles.nebula2} />
                        <div className={styles.nebula3} />
                        <div className={styles.stars} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Global Grain/Noise Overlay for texture */}
            <div className={styles.noise} />
        </div>
    );
}
