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
                        key="ambient"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2 }}
                        className={styles.ambientWrapper}
                    >
                        <div className={styles.nebula1} />
                        <div className={styles.nebula2} />
                        <div className={styles.nebula3} />
                    </motion.div>
                )}

                {theme === 'aurora' && (
                    <motion.div
                        key="aurora"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 3 }}
                        className={styles.auroraWrapper}
                    >
                        <div className={styles.aurora1} />
                        <div className={styles.aurora2} />
                    </motion.div>
                )}

                {theme === 'midnight' && (
                    <motion.div
                        key="midnight"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2 }}
                        className={styles.midnightWrapper}
                    >
                        <div className={styles.voidStars} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Global Grain/Noise Overlay */}
            <div className={styles.noise} />
        </div>
    );
}
