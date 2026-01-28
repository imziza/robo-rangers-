'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import styles from './page.module.css';

interface UploadedImage {
    id: string;
    file: File;
    preview: string;
}

const SCAN_PHASES = [
    'Initializing Optical Sensors',
    'Spectrographic Signature Mapping',
    'Material Composition Identification',
    'Cross-Referencing Global Antiquity Database',
    'Generating Scholarly Hypothesis',
    'Finalizing Archival Report'
];

export default function AnalysisPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [images, setImages] = useState<UploadedImage[]>([]);
    const [notes, setNotes] = useState('');
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [currentPhase, setCurrentPhase] = useState(0);
    const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');

    useEffect(() => {
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');
        if (lat && lng) {
            setLocation({ lat: parseFloat(lat), lng: parseFloat(lng) });
            setLocationStatus('granted');
        }
    }, [searchParams]);

    useEffect(() => {
        if (isAnalyzing) {
            const phaseIndex = Math.min(
                Math.floor((analysisProgress / 100) * SCAN_PHASES.length),
                SCAN_PHASES.length - 1
            );
            setCurrentPhase(phaseIndex);
        }
    }, [analysisProgress, isAnalyzing]);

    const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (images.length + files.length > 10) {
            alert('Laboratory maximum limit reached (10 images)');
            return;
        }

        const newImages = files.map((file) => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            preview: URL.createObjectURL(file),
        }));

        setImages((prev) => [...prev, ...newImages]);
    }, [images.length]);

    const removeImage = (id: string) => {
        setImages((prev) => {
            const removed = prev.find((img) => img.id === id);
            if (removed) URL.revokeObjectURL(removed.preview);
            return prev.filter((img) => img.id !== id);
        });
    };

    const requestLocation = async () => {
        setLocationStatus('requesting');
        try {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setLocationStatus('granted');
                },
                () => setLocationStatus('denied'),
                { enableHighAccuracy: true }
            );
        } catch {
            setLocationStatus('denied');
        }
    };

    const startAnalysis = async () => {
        if (images.length === 0) return;

        setIsAnalyzing(true);
        setAnalysisProgress(0);

        const progressInterval = setInterval(() => {
            setAnalysisProgress((prev) => {
                if (prev >= 98) {
                    clearInterval(progressInterval);
                    return prev;
                }
                return prev + Math.random() * 5;
            });
        }, 1000);

        try {
            const imageBase64s = await Promise.all(
                images.map(async (img) => {
                    const buffer = await img.file.arrayBuffer();
                    return btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
                })
            );

            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ images: imageBase64s, notes, location }),
            });

            if (response.ok) {
                const result = await response.json();

                // Save to localStorage for immediate retrieval (handles database lag or failures)
                if (result.report) {
                    const artifactData = {
                        id: result.artifactId,
                        title: result.report.title,
                        classification: result.report.classification,
                        material: result.report.materialAnalysis, // Simplified for vault metadata
                        era: result.report.culturalContext,
                        status: 'stable',
                        confidence_score: result.report.confidenceScore,
                        image_url: images[0]?.preview,
                        created_at: new Date().toISOString(),
                        is_local: true
                    };

                    // 1. Store full report
                    localStorage.setItem(`report_${result.artifactId}`, JSON.stringify({
                        ...result.report,
                        image_url: images[0]?.preview
                    }));

                    // 2. Append to vault catalog
                    const existingCatalog = JSON.parse(localStorage.getItem('vault_catalog') || '[]');
                    localStorage.setItem('vault_catalog', JSON.stringify([artifactData, ...existingCatalog]));
                }

                setAnalysisProgress(100);
                setTimeout(() => router.push(`/report/${result.artifactId}`), 1000);
            } else {
                throw new Error('Analysis Protocol Interrupted');
            }
        } catch (error) {
            console.error(error);
            alert('Analysis Protocol Execution Failed.');
            setIsAnalyzing(false);
            clearInterval(progressInterval);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Artifact Laboratory</h1>
                <p className={styles.subtitle}>HIGH-FIDELITY OPTICAL & SCHOLARLY ANALYSIS SYSTEM</p>
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
                                <section className={styles.section}>
                                    <h2 className={styles.sectionTitle}>
                                        <span className={styles.stepNumber}>01</span> OPTICAL CAPTURE
                                    </h2>
                                    <div className={styles.uploadArea}>
                                        <input type="file" multiple accept="image/*" onChange={handleImageUpload} className={styles.fileInput} />
                                        <div className={styles.uploadLabel}>
                                            <div className={styles.uploadIcon}>📸</div>
                                            <span className={styles.uploadText}>INGEST SPECIMEN IMAGERY</span>
                                            <span className={styles.uploadHint}>MULTIX-ANGLE HIGH RESOLUTION (UP TO 10)</span>
                                        </div>
                                    </div>
                                    <div className={styles.imageGrid}>
                                        {images.map((img) => (
                                            <div key={img.id} className={styles.imageItem}>
                                                <img src={img.preview} alt="Specimen" />
                                                <button onClick={() => removeImage(img.id)} className={styles.removeBtn}>×</button>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className={styles.section} style={{ marginTop: '24px' }}>
                                    <h2 className={styles.sectionTitle}>
                                        <span className={styles.stepNumber}>02</span> FIELD OBSERVATIONS
                                    </h2>
                                    <Textarea
                                        placeholder="INPUT STRATIGRAPHIC OBSERVATIONS OR SITE CONTEXT..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        variant="dark"
                                    />
                                </section>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={styles.scanningWrapper}
                            >
                                <div className={styles.scannerDisk}>
                                    <div className={styles.scanLine} />
                                    <div className={styles.artifactPreview}>
                                        <img src={images[0]?.preview} alt="Analyzing Catalog" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', opacity: 0.5 }} />
                                    </div>
                                </div>

                                <div className={styles.scanningMeta}>
                                    <h3 className={styles.phaseLabel}>{SCAN_PHASES[currentPhase]}</h3>
                                    <div className={styles.progressBar}>
                                        <div className={styles.progressFill} style={{ width: `${analysisProgress}%` }} />
                                    </div>
                                    <div className={styles.progressCounter}>
                                        SIGNAL STRENGTH: 98.4% | {Math.round(analysisProgress)}% COMPLETE
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <aside className={styles.analysisSidebar}>
                    <div className={styles.analysisCard}>
                        <div className={styles.statusIndicator}>
                            <div className={styles.pulse} />
                            SYSTEM READY
                        </div>

                        <div className={styles.locationSection}>
                            <h4 className={styles.smallHeading}>PROVENANCE DATA</h4>
                            {location ? (
                                <div className={styles.locationGranted}>
                                    <div className={styles.locationDetails}>
                                        <span className={styles.locationLabel}>FIX CAPTURED</span>
                                        <span className={styles.locationCoords}>{location.lat.toFixed(4)}N {location.lng.toFixed(4)}E</span>
                                    </div>
                                </div>
                            ) : (
                                <Button variant="outline" size="sm" fullWidth onClick={requestLocation} isLoading={locationStatus === 'requesting'}>
                                    LINK SATELLITE GPS
                                </Button>
                            )}
                        </div>

                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            disabled={images.length === 0 || isAnalyzing}
                            onClick={startAnalysis}
                        >
                            EXECUTE ANALYSIS
                        </Button>

                        <p className={styles.disclaimer}>
                            NOTICE: THIS INTERFACE UTILIZES DEEP-NEURAL ARCHAEOLOGICAL MODELS. ALL DATA IS CATEGORIZED UNDER SECURE INSTITUTIONAL PROTOCOLS.
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    );
}
