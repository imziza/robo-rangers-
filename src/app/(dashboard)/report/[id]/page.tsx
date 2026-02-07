'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { FileText, Search, Share2, Printer, Compass, Shield, MapPin, Clock, Globe, ArrowLeft, Maximize2 } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';

interface AIReport {
    title: string;
    classification: string;
    visualDescription: string;
    materialAnalysis: string;
    structuralInterpretation: string;
    symbolism: string;
    culturalContext: string;
    geographicSignificance: string;
    originHypothesis: string;
    comparativeAnalysis: string;
    confidenceScore: number;
    image_url?: string;
    image_urls?: string[]; // Added supporting plural
}

interface Artifact {
    id: string;
    title: string;
    classification: string | null;
    material: string | null;
    era: string | null;
    region: string | null;
    latitude: number | null;
    longitude: number | null;
    excavation_notes: string | null;
    ai_report: AIReport;
    confidence_score: number | null;
    image_url?: string;
    image_urls?: string[]; // Added supporting plural
    created_at: string;
}

const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

export default function ReportPage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createSupabaseBrowserClient();

    const [artifact, setArtifact] = useState<Artifact | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    useEffect(() => {
        loadArtifact();
    }, [params.id]);

    // Slideshow effect
    useEffect(() => {
        const urls = artifact?.image_urls || [];
        if (urls.length <= 1) return;

        const interval = setInterval(() => {
            setActiveImageIndex(prev => (prev + 1) % urls.length);
        }, 4000); // Cycle every 4 seconds

        return () => clearInterval(interval);
    }, [artifact?.image_urls]);

    const loadArtifact = async () => {
        setIsLoading(true);
        const artifactId = params.id as string;

        try {
            // Priority 1: Supabase (Live Data + All Images)
            const { data, error } = await supabase
                .from('artifacts')
                .select(`*, artifact_images (image_url, is_primary)`)
                .eq('id', artifactId)
                .single();

            if (!error && data) {
                const allUrls = data.artifact_images?.map((img: any) => img.image_url) || [];
                const primaryImage = data.artifact_images?.find((img: any) => img.is_primary)?.image_url || allUrls[0];

                setArtifact({
                    ...data,
                    image_url: primaryImage,
                    image_urls: allUrls.length > 0 ? allUrls : (data.ai_report?.image_urls || [])
                });
                setIsLoading(false);
                return;
            }

            // Priority 2: Local Storage Cache fallback
            const cached = localStorage.getItem(`report_${artifactId}`);
            if (cached) {
                const parsed = JSON.parse(cached);
                const urls = parsed.image_urls || (parsed.image_url ? [parsed.image_url] : []);
                setArtifact({
                    id: artifactId,
                    title: parsed.title,
                    classification: parsed.classification,
                    material: parsed.materialAnalysis,
                    era: parsed.culturalContext,
                    region: parsed.geographicSignificance,
                    latitude: null,
                    longitude: null,
                    excavation_notes: 'Retrieved from laboratory cache.',
                    ai_report: parsed,
                    confidence_score: parsed.confidenceScore,
                    image_url: parsed.image_url || urls[0],
                    image_urls: urls,
                    created_at: new Date().toISOString(),
                });
            }
        } catch (err) {
            console.error('Failed to load artifact:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const shareReport = async () => {
        if (!artifact) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase.from('messages').insert({
            sender_id: user.id,
            group_id: 'e02d6e46-1768-450f-9694-5c9c7f6e0266',
            content: `New scholarly report: ${artifact.ai_report.title}`,
            artifact_id: artifact.id
        });
        router.push('/messages');
    };

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingPulse} />
                <span>SYNCHRONIZING ARCHIVAL DATA...</span>
            </div>
        );
    }

    if (!artifact) {
        return (
            <div className={styles.errorContainer}>
                <h2>SPECIMEN NOT FOUND</h2>
                <Button onClick={() => router.push('/vault')}>Return to Vault</Button>
            </div>
        );
    }

    const report = artifact.ai_report;
    const confidencePercent = Math.round((report.confidenceScore || 0) * 100);

    const containerVariants: Variants = {
        visible: { transition: { staggerChildren: 0.1 } }
    };

    return (
        <motion.div
            className={styles.container}
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <div className={styles.reportBackground} />
            <div className={`${styles.decorativeBracket} ${styles.topLeft}`} />
            <div className={`${styles.decorativeBracket} ${styles.topRight}`} />
            <div className={`${styles.decorativeBracket} ${styles.bottomLeft}`} />
            <div className={`${styles.decorativeBracket} ${styles.bottomRight}`} />

            <header className={styles.header}>
                <motion.div className={styles.headerTop} variants={fadeInUp}>
                    <div className={styles.headerLeft}>
                        <button className={styles.backBtn} onClick={() => router.back()}>
                            <ArrowLeft size={14} /> Back
                        </button>
                        <span className={styles.recordId}>ALETHEON SCHOLARLY ARCHIVE — RECORD ID: {artifact.id}</span>
                    </div>
                    <div className={styles.headerStatus}>
                        <div className={styles.statusPulse} />
                        <span>SYSTEM STATUS: ARCHIVAL FEED ACTIVE</span>
                    </div>
                </motion.div>

                <motion.h1 className={styles.title} variants={fadeInUp}>{report.title}</motion.h1>

                <motion.div className={styles.metadataBar} variants={fadeInUp}>
                    <div className={styles.confidenceContainer}>
                        <div className={styles.confidenceBar}>
                            <motion.div
                                className={styles.confidenceFill}
                                initial={{ width: 0 }}
                                animate={{ width: `${confidencePercent}%` }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                            />
                        </div>
                        <span className={styles.confidenceText}>INTEGRITY: {confidencePercent}%</span>
                    </div>

                    <span className={styles.metaSeptum}>•</span>

                    <div className={styles.headerMetaPoint}>
                        <span className={styles.metaLabel}>PROVENANCE:</span>
                        <span className={styles.metaValue}>{artifact.region || 'UNKNOWN'}</span>
                    </div>

                    <span className={styles.metaSeptum}>•</span>

                    <div className={styles.headerMetaPoint}>
                        <span className={styles.metaLabel}>CHRONOLOGY:</span>
                        <span className={styles.metaValue}>{artifact.era || 'UNDER INVESTIGATION'}</span>
                    </div>
                </motion.div>
            </header>

            <div className={styles.mainLayout}>
                {/* Left Column: Visual Data */}
                <motion.aside className={styles.visualColumn} variants={fadeInUp}>
                    <div className={styles.imageFrame}>
                        {artifact.image_urls && artifact.image_urls.length > 0 ? (
                            <>
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={artifact.image_urls[activeImageIndex]}
                                        src={artifact.image_urls[activeImageIndex]}
                                        alt={report.title}
                                        className={styles.artifactImage}
                                        initial={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                        exit={{ opacity: 0, scale: 0.9, filter: 'blur(5px)' }}
                                        transition={{ duration: 0.8 }}
                                    />
                                </AnimatePresence>
                                <motion.div
                                    className={styles.scanLine}
                                    animate={{ top: ['0%', '100%', '0%'] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                />
                                <div className={styles.imageOverlay} />
                                {artifact.image_urls.length > 1 && (
                                    <div className={styles.imageCount}>
                                        {activeImageIndex + 1} / {artifact.image_urls.length}
                                    </div>
                                )}
                                <button className={styles.expandBtn}><Maximize2 size={16} /></button>
                            </>
                        ) : (
                            <div className={styles.placeholderImage}>
                                <Shield size={80} strokeWidth={0.5} />
                            </div>
                        )}
                        <div className={styles.scanLabel}>OPTICAL SCAN V.4.2 — SPECTRUM: INFRARED/UV</div>
                    </div>

                    <div className={styles.compositionPanel}>
                        <h3 className={styles.panelTitle}>TECHNICAL PROVENANCE</h3>
                        <div className={styles.technicalGrid}>
                            <div className={styles.techPoint}>
                                <span className={styles.techLabel}>Classification</span>
                                <span className={styles.techValue}>{report.classification}</span>
                            </div>
                            <div className={styles.techPoint}>
                                <span className={styles.techLabel}>Material Composition</span>
                                <span className={styles.techValue}>{artifact.material}</span>
                            </div>
                            <div className={styles.techPoint}>
                                <span className={styles.techLabel}>Geospatial Alignment</span>
                                <span className={styles.techValue}>
                                    {artifact.latitude ? `${artifact.latitude.toFixed(4)}°N` : 'N/A'}, {artifact.longitude ? `${artifact.longitude.toFixed(4)}°E` : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.aside>

                {/* Center Column: Analytical Narration */}
                <main className={styles.reportColumn}>
                    <section className={styles.section}>
                        <h2 className={styles.sectionHeading}>VISUAL & PHYSICAL TAXONOMY</h2>
                        <div className={styles.sectionBody}>
                            <span className={styles.dropCap}>{report.visualDescription.charAt(0)}</span>
                            {report.visualDescription.slice(1)}
                        </div>
                    </section>

                    <section className={styles.section}>
                        <h2 className={styles.sectionHeading}>MATERIAL & SCIENTIFIC ANALYSIS</h2>
                        <div className={styles.sectionBody}>{report.materialAnalysis}</div>
                    </section>

                    <section className={styles.section}>
                        <h2 className={styles.sectionHeading}>ICONOGRAPHY & SYMBOLIC SEMIOTICS</h2>
                        <div className={styles.analyticalBlock}>
                            <div className={styles.blockIcon}><Clock size={20} /></div>
                            <div className={styles.blockContent}>
                                <h4 className={styles.blockTitle}>Era Synthesis</h4>
                                <p>{report.culturalContext}</p>
                            </div>
                        </div>
                        <div className={styles.sectionBody}>{report.symbolism}</div>
                    </section>

                    <section className={styles.section}>
                        <h2 className={styles.sectionHeading}>THEORETICAL LIFE-CYCLE HYPOTHESIS</h2>
                        <div className={styles.hypothesisBox}>
                            {report.originHypothesis}
                        </div>
                    </section>

                    <section className={styles.section}>
                        <h2 className={styles.sectionHeading}>SCHOLARLY COMPARISONS</h2>
                        <div className={styles.sectionBody}>{report.comparativeAnalysis}</div>
                    </section>

                    <motion.section
                        className={styles.scholarlyInsights}
                        variants={fadeInUp}
                    >
                        <div className={styles.insightHeader}>
                            <FileText size={16} />
                            <span>AUTOMATED PEER REVIEW FEEDBACK</span>
                        </div>
                        <p className={styles.insightText}>
                            The morphological characteristics of this specimen align with late-period stylistic transitions.
                            Spectral analysis suggests a composite material bonding technique previously undocumented in this sector.
                            High probability of inter-regional trade influence detected in the base ornamentation.
                        </p>
                    </motion.section>
                </main>

                {/* Right Column: Sidebar Actions */}
                <motion.aside className={styles.sidebarColumn} variants={fadeInUp}>
                    <div className={styles.sidebarGroup}>
                        <h3 className={styles.sidebarTitle}>ARCHIVAL MANAGEMENT</h3>
                        <Button
                            variant="primary"
                            fullWidth
                            onClick={() => window.print()}
                            leftIcon={<Printer size={16} />}
                        >
                            EXPORT OFFICIAL DOSSIER
                        </Button>
                        <Button
                            variant="outline"
                            fullWidth
                            onClick={() => router.push('/discovery')}
                            leftIcon={<Compass size={16} />}
                        >
                            FIND SIMILAR ARTIFACTS
                        </Button>
                    </div>

                    <div className={styles.sidebarGroup}>
                        <h3 className={styles.sidebarTitle}>COLLABORATION</h3>
                        <Button
                            variant="secondary"
                            fullWidth
                            onClick={shareReport}
                            leftIcon={<Share2 size={16} />}
                        >
                            SHARE WITH RESEARCH GROUP
                        </Button>
                    </div>

                    <div className={styles.securityTag}>
                        <Shield size={12} />
                        <span>AUTHENTICATED BY ALETHEON AI CORE</span>
                    </div>
                </motion.aside>
            </div>
        </motion.div>
    );
}
