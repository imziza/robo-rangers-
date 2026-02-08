'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, FileText, Upload, Microscope, Zap, ShieldCheck, Activity } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { useAnalysis } from '@/hooks/useAnalysis';
import styles from './page.module.css';

function AnalysisContent() {
    const router = useRouter();
    const { isAnalyzing, progress, currentPhase, phases, startAnalysis } = useAnalysis();

    const [images, setImages] = useState<any[]>([]);
    const [notes, setNotes] = useState('');
    const [location, setLocation] = useState<any>(null);

    const handleImageUpload = (e: any) => {
        const files = Array.from(e.target.files || []);
        const newImages = files.map((file: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            preview: URL.createObjectURL(file)
        }));
        setImages(prev => [...prev, ...newImages]);
    };

    const removeImage = (id: string) => {
        setImages(prev => prev.filter(img => img.id !== id));
    };

    const requestGPS = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                (error) => {
                    console.error('GPS Error:', error);
                    alert('GEOSPATIAL LINK FAILED: Please ensure location permissions are granted.');
                }
            );
        } else {
            alert('GEOSPATIAL ERROR: This device does not support satellite positioning.');
        }
    };

    const handleExecute = async () => {
        try {
            const result = await startAnalysis(images, notes, location);
            if (result) {
                setTimeout(() => router.push(`/report/${result.artifactId}`), 1000);
            }
        } catch (err: any) {
            console.error(err);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <motion.h1
                    className={styles.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    Artifact Laboratory
                </motion.h1>
                <motion.p
                    className={styles.subtitle}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    HIGH-FIDELITY OPTICAL & SCHOLARLY ANALYSIS SYSTEM
                </motion.p>
            </header>

            <div className={styles.content}>
                <div className={styles.mainPanel}>
                    <AnimatePresence mode="wait">
                        {!isAnalyzing ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={styles.inputStack}
                            >
                                <Panel variant="glass" padding="lg">
                                    <section className={styles.section}>
                                        <h2 className={styles.sectionTitle}>
                                            <Camera size={16} className={styles.inlineIcon} />
                                            01 OPTICAL CAPTURE
                                        </h2>
                                        <div className={styles.uploadArea}>
                                            <input type="file" multiple accept="image/*" onChange={handleImageUpload} className={styles.fileInput} />
                                            <div className={styles.uploadLabel}>
                                                <div className={styles.uploadIcon}>
                                                    <Upload size={32} />
                                                </div>
                                                <span className={styles.uploadText}>INGEST SPECIMEN IMAGERY</span>
                                                <span className={styles.uploadHint}>Drag and drop or click to browse</span>
                                            </div>
                                        </div>

                                        {images.length > 0 && (
                                            <div className={styles.imageGrid}>
                                                {images.map(img => (
                                                    <div key={img.id} className={styles.imageItem}>
                                                        <img src={img.preview} alt="Specimen" />
                                                        <button className={styles.removeBtn} onClick={() => removeImage(img.id)}>×</button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </section>
                                </Panel>

                                <Panel variant="glass" padding="lg">
                                    <section className={styles.section}>
                                        <h2 className={styles.sectionTitle}>
                                            <FileText size={16} className={styles.inlineIcon} />
                                            02 FIELD OBSERVATIONS
                                        </h2>
                                        <Textarea
                                            placeholder="INPUT STRATIGRAPHIC OBSERVATIONS..."
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            variant="dark"
                                        />

                                        <div className={styles.locationBox}>
                                            {location ? (
                                                <div className={styles.locationGranted}>
                                                    <div className={styles.pulse} />
                                                    <div className={styles.locationDetails}>
                                                        <span className={styles.locationLabel}>L-BAND SATELLITE LINK ESTABLISHED</span>
                                                        <span className={styles.locationCoords}>LAT: {location.lat.toFixed(6)}° N | LNG: {location.lng.toFixed(6)}° E</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <Button variant="outline" fullWidth onClick={requestGPS}>
                                                    INITIALIZE GEOSPATIAL LINK
                                                </Button>
                                            )}
                                        </div>
                                    </section>
                                </Panel>

                                <Button
                                    variant="primary"
                                    fullWidth
                                    size="lg"
                                    disabled={images.length === 0}
                                    onClick={handleExecute}
                                    leftIcon={<Microscope size={18} />}
                                >
                                    EXECUTE QUANTUM ANALYSIS
                                </Button>
                            </motion.div>
                        ) : (
                            <Panel variant="void" padding="lg" className={styles.scanningWrapper}>
                                <div className={styles.scannerDisk}>
                                    <div className={styles.scanLine} />
                                    <Microscope size={64} className={styles.scanningIcon} />
                                    <svg className={styles.scannerRing} viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="10 5" />
                                    </svg>
                                </div>
                                <div className={styles.scanningMeta}>
                                    <div className={styles.terminalHeader}>
                                        <Activity size={14} className={styles.terminalIcon} />
                                        <span className={styles.terminalTitle}>ANALYSIS IN PROGRESS</span>
                                    </div>
                                    <h3 className={styles.phaseLabel}>PHASE {currentPhase + 1}: {phases[currentPhase]}</h3>
                                    <div className={styles.progressBar}>
                                        <motion.div
                                            className={styles.progressFill}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
                                        />
                                    </div>
                                    <div className={styles.progressStats}>
                                        <span className={styles.statTag}><ShieldCheck size={10} /> SECURE</span>
                                        <span className={styles.percentage}>{Math.round(progress)}%</span>
                                    </div>
                                    <div className={styles.dataStream}>
                                        {Array(6).fill(0).map((_, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: [0, 1, 0], x: 0 }}
                                                transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                                                className={styles.streamLine}
                                            >
                                                {`> 0x${(Math.random() * 0xFFFFFFFF >>> 0).toString(16).toUpperCase()} - ${phases[currentPhase].toUpperCase()}...`}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </Panel>
                        )}
                    </AnimatePresence>
                </div>

                <aside className={styles.analysisSidebar}>
                    <Panel variant="glass" padding="md" className={styles.analysisCard}>
                        <div className={styles.statusIndicator}>
                            <div className={styles.pulse} />
                            LAB STATUS: ACTIVE
                        </div>
                        <p className={styles.disclaimer}>
                            The Aletheon Laboratory utilizes a multi-spectral approach to artifact analysis.
                            Our deep-learning models evaluate molecular signatures and stratigraphic data to
                            reconstruct historical contexts with 98.4% institutional confidence.
                        </p>
                        <div className={styles.sidebarMeta}>
                            <div className={styles.metaRow}>
                                <Zap size={14} /> <span>CORE: STABLE</span>
                            </div>
                            <div className={styles.metaRow}>
                                <Microscope size={14} /> <span>OPTICS: ALIGNED</span>
                            </div>
                        </div>
                    </Panel>
                </aside>
            </div>
        </div>
    );
}

export default function AnalysisPage() {
    return (
        <Suspense fallback={<div className={styles.loading}>Initializing Lab...</div>}>
            <AnalysisContent />
        </Suspense>
    );
}
