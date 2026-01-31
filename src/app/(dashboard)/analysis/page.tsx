'use client';
import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, FileText, Upload, Microscope } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import styles from './page.module.css';

const SCAN_PHASES = ['Initializing Sensors', 'Mapping Signature', 'Identifying Material', 'Cross-Referencing', 'Generating Hypothesis', 'Finalizing Report'];

export default function AnalysisPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createSupabaseBrowserClient();
    const [images, setImages] = useState<any[]>([]);
    const [notes, setNotes] = useState('');
    const [location, setLocation] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [currentPhase, setCurrentPhase] = useState(0);

    useEffect(() => {
        if (isAnalyzing) setCurrentPhase(Math.min(Math.floor((analysisProgress / 100) * SCAN_PHASES.length), SCAN_PHASES.length - 1));
    }, [analysisProgress, isAnalyzing]);

    const handleImageUpload = (e: any) => {
        const files = Array.from(e.target.files || []);
        const newImages = files.map((file: any) => ({ id: Math.random().toString(36).substr(2, 9), file, preview: URL.createObjectURL(file) }));
        setImages(prev => [...prev, ...newImages]);
    };

    const startAnalysis = async () => {
        if (images.length === 0) return;
        setIsAnalyzing(true); setAnalysisProgress(0);
        const progressInterval = setInterval(() => setAnalysisProgress(prev => prev >= 98 ? prev : prev + Math.random() * 2), 1000);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const imageBase64s = await Promise.all(images.map(img => new Promise<string>((resolve, reject) => {
                const reader = new FileReader(); reader.onload = () => resolve((reader.result as string).split(',')[1]); reader.onerror = reject; reader.readAsDataURL(img.file);
            })));
            const response = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ images: imageBase64s, notes, location, userId: user?.id }) });
            const result = await response.json();
            if (response.ok) {
                localStorage.setItem(`report_${result.artifactId}`, JSON.stringify(result.report));
                const artifactData = { id: result.artifactId, title: result.report.title, classification: result.report.classification, material: result.report.materialAnalysis, era: result.report.culturalContext, status: 'stable', confidence_score: result.report.confidenceScore, image_url: result.report.image_url, created_at: new Date().toISOString() };
                const catalog = JSON.parse(localStorage.getItem('vault_catalog') || '[]');
                localStorage.setItem('vault_catalog', JSON.stringify([artifactData, ...catalog]));
                clearInterval(progressInterval); setAnalysisProgress(100);
                setTimeout(() => router.push(`/report/${result.artifactId}`), 1000);
            } else throw new Error(result.error);
        } catch (error: any) { alert(`Analysis Failed: ${error.message}`); setIsAnalyzing(false); clearInterval(progressInterval); }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}><h1 className={styles.title}>Artifact Laboratory</h1><p className={styles.subtitle}>HIGH-FIDELITY OPTICAL & SCHOLARLY ANALYSIS SYSTEM</p></header>
            <div className={styles.content}>
                <div className={styles.mainPanel}>
                    <AnimatePresence mode="wait">
                        {!isAnalyzing ? (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className={styles.inputStack}>
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
                                </section>
                                <section className={styles.section}>
                                    <h2 className={styles.sectionTitle}>
                                        <FileText size={16} className={styles.inlineIcon} />
                                        02 FIELD OBSERVATIONS
                                    </h2>
                                    <Textarea placeholder="INPUT STRATIGRAPHIC OBSERVATIONS..." value={notes} onChange={(e) => setNotes(e.target.value)} variant="dark" />
                                </section>
                                <Button
                                    variant="primary"
                                    fullWidth
                                    disabled={images.length === 0}
                                    onClick={startAnalysis}
                                    leftIcon={<Microscope size={18} />}
                                >
                                    EXECUTE ANALYSIS
                                </Button>
                            </motion.div>
                        ) : (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.scanningWrapper}>
                                <div className={styles.scannerDisk}>
                                    <div className={styles.scanLine} />
                                    <Microscope size={48} className={styles.scanningIcon} />
                                    <svg className={styles.scannerRing} viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="10 5" />
                                    </svg>
                                </div>
                                <div className={styles.scanningMeta}>
                                    <div className={styles.terminalHeader}>
                                        <span className={styles.terminalDot} />
                                        <span className={styles.terminalTitle}>ANALYSIS IN PROGRESS</span>
                                    </div>
                                    <h3 className={styles.phaseLabel}>PHASE {currentPhase + 1}: {SCAN_PHASES[currentPhase]}</h3>
                                    <div className={styles.progressBar}>
                                        <motion.div
                                            className={styles.progressFill}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${analysisProgress}%` }}
                                        />
                                    </div>
                                    <div className={styles.progressStats}>
                                        <span>SIGNAL: SECURE</span>
                                        <span>{Math.round(analysisProgress)}% COMPLETE</span>
                                    </div>
                                    <div className={styles.dataStream}>
                                        {Array(5).fill(0).map((_, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: [0, 1, 0], x: 0 }}
                                                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                                                className={styles.streamLine}
                                            >
                                                {`> 0x${Math.random().toString(16).slice(2, 10).toUpperCase()} - EXTRACTING METADATA...`}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
