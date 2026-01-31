'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileText, Search, Share2, Printer, Compass, Shield } from 'lucide-react';
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
    created_at: string;
}

const MOCK_ARTIFACTS: Record<string, Artifact> = {
    'AL-992-X': {
        id: 'AL-992-X',
        title: 'Gilded Sarcophagus of the Memphis Necropolis',
        classification: 'Funerary Object',
        material: 'Aurum (Gold) & Lapis Lazuli',
        era: '323-31 BC (Hellenistic)',
        region: 'Lower Egypt',
        latitude: 29.8500,
        longitude: 31.2500,
        excavation_notes: 'Recovered from a private tomb at the edge of the Saqqara plateau. Exceptional preservation of gold leaf.',
        confidence_score: 0.964,
        image_url: '/artifacts/sarcophagus.png',
        created_at: new Date().toISOString(),
        ai_report: {
            title: 'Royal Funerary Apparatus: The Gilded Sarcophagus of Saqqara',
            classification: 'Hellenistic Egyptian Anthropoid Sarcophagus',
            visualDescription: 'Exhaustive analysis reveals a multi-layered gold foil application over a sycamore wood base. The headpiece exhibits exceptionally fine relief work, depicting the deceased in idealized Pharaoh-ic form, though with distinctly Ptolemaic stylistic influences in the pupil rendering and lip curvature. Micro-scoring suggests the use of specialized bronze burnishing tools.',
            materialAnalysis: 'Spectroscopy indicates 22-karat gold alloy containing traces of silver and copper, characteristic of Late Period Egyptian mining. The blue inlays are authentic Lapis Lazuli sourced from the Sar-i Sang mines, indicating active trade routes with the Bactrian regions. Pigment analysis on the base identifies Egyptian Blue (cuproivaite) and madder-root rouge.',
            structuralInterpretation: 'The anthropoid design serves as both a physical protective shell and a spiritual vessel for the Ka. Structural load-bearing analysis of the sycamore frame indicates it was constructed to withstand significant subterranean pressure, utilizing complex tenon-and-mortise joints sealed with bitumen.',
            symbolism: 'The central pectoral area features a finely etched Nut goddess with wings outstretched, symbolizing eternal protection. The sides are inscribed with Chapter 151 of the Book of the Dead, utilizing a cursive hieroglyph style transitionary to Demotic. Every geometric motif aligns with celestial orientations observed in the Memphis latitude.',
            culturalContext: 'This specimen originates from the intersection of Pharaonic tradition and Ptolemaic Greek administration. It represents the "Elite Synthesis" of the Memphis administrative class, combining ancestral Egyptian afterlife security with the material luxury and artistic naturalism of the Hellenistic world.',
            geographicSignificance: 'Located at the exact stratigraphic intersection of the Old Kingdom necropolis and the burgeoning Ptolemaic settlement. Its placement suggests a deliberate attempt by the owner to associate themselves with the divine antiquity of the Pyramid Age.',
            originHypothesis: 'Commissioned circa 250 BCE by a high-ranking tax administrator. The object was likely part of a grand funerary procession before being interred in a family vault. It remained undisturbed until seismic shifts exposed the chamber entrance in the late 20th century.',
            comparativeAnalysis: 'Shows profound parallels with the Sarcophagus of Nedjemankh (Metropolitan Museum) and similar high-status burials found in the Al-Faiyum region. The gold-foil methodology is near-identical to specimens recovered from the mid-Ptolemaic stratum at Mendes.',
            confidenceScore: 0.98
        }
    },
    'AL-441-K': {
        id: 'AL-441-K',
        title: 'Bronze Aegis of the Anatolian Frontier',
        classification: 'Armor / Ritual Protective Object',
        material: 'Weathered Bronze / Verdigris',
        era: '1200-1100 BC (Late Bronze)',
        region: 'Central Anatolia',
        latitude: 39.9334,
        longitude: 32.8647,
        excavation_notes: 'Surface find near the Hattusa defensive perimeter. Exhibits high-temperature scarring.',
        confidence_score: 0.88,
        image_url: '/artifacts/mask.png',
        created_at: new Date().toISOString(),
        ai_report: {
            title: 'The Hattusa Protectorate: Bronze Aegis Specimen',
            classification: 'Late Hittite Ceremonial Shield Fragment',
            visualDescription: 'The specimen is dominated by a heavy verdigris patina (malachite/azurite). Underneath, deep hammer marks reveal a sophisticated forging process. The central facial motif, though weathered, displays the characteristic almond-shaped eyes and strong nasal bridge found in Late Hittite iconography.',
            materialAnalysis: 'Chemical assay reveals a tin-bronze composition with an unusually high tin content (12%), providing extreme hardness. Trace arsenic presence indicates the use of sulphide ores from the Taurus Mountains. The corrosion layer has protected the internal crystalline structure of the metal.',
            structuralInterpretation: 'While stylistically a shield (aegis), the lack of heavy mounting points on the reverse suggests a ritual or temple-display function. It was likely bolted to a wooden core or stone pillar. The thermal scarring suggests it was present during a major fire event, possibly the fall of the city.',
            symbolism: 'Deconstruction of the central relief identifies the Storm God Tarhunz. The radiating lines symbolize divine lightning. The concentric circles on the perimeter represent the four corners of the world, a common motif in Hittite state-religion artifacts.',
            culturalContext: 'Originates from the final decades of the Hittite Empire. It reflects a society under extreme military and spiritual stress, relying on grand protective symbols to ward off the encroaching "Sea Peoples" or internal collapse.',
            geographicSignificance: 'The find location near the Lion Gate of Hattusa suggests it was part of the primary defensive or ceremonial gate-apparatus. It connects directly to the regional metallurgy of the central plateau.',
            originHypothesis: 'Forged in the Royal Workshops of Hattusa. Held in the Great Temple until the total abandonment of the city, at which point it fell and was buried beneath structural collapse.',
            comparativeAnalysis: 'Matches fragments found at the Yazılıkaya sanctuary. The metallurgy is consistent with high-status bronze artifacts recovered from the Ulu Burun shipwreck.',
            confidenceScore: 0.92
        }
    }
};

export default function ReportPage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createSupabaseBrowserClient();

    const [artifact, setArtifact] = useState<Artifact | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadArtifact();
    }, [params.id]);

    const loadArtifact = async () => {
        setIsLoading(true);
        const artifactId = params.id as string;

        try {
            // 1. First check mock data for demo parity
            if (MOCK_ARTIFACTS[artifactId]) {
                setArtifact(MOCK_ARTIFACTS[artifactId]);
                setIsLoading(false);
                return;
            }

            // 2. Check localStorage for recently generated results (fallback for DB lag)
            const cached = localStorage.getItem(`report_${artifactId}`);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    setArtifact({
                        id: artifactId,
                        title: parsed.title,
                        classification: parsed.classification,
                        material: parsed.materialAnalysis,
                        era: parsed.culturalContext,
                        region: parsed.geographicSignificance,
                        latitude: null,
                        longitude: null,
                        excavation_notes: 'Retrieved from local laboratory cache.',
                        ai_report: parsed,
                        confidence_score: parsed.confidenceScore,
                        image_url: parsed.image_url,
                        created_at: new Date().toISOString(),
                    });
                    setIsLoading(false);
                    return;
                } catch (ce) {
                    console.error('Cache parse error:', ce);
                }
            }

            // 3. Final fallback: Supabase
            const { data, error } = await supabase
                .from('artifacts')
                .select(`
                    *,
                    artifact_images (image_url, is_primary)
                `)
                .eq('id', artifactId)
                .single();

            if (!error && data) {
                const primaryImage = data.artifact_images?.find((img: any) => img.is_primary)?.image_url;
                setArtifact({
                    ...data,
                    image_url: primaryImage
                });
            }
        } catch (err) {
            console.error('Failed to load artifact:', err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loaderLine} />
                <span>Synchronizing Archival Records...</span>
            </div>
        );
    }

    if (!artifact) {
        return (
            <div className={styles.errorContainer}>
                <h2>SPECIMEN NOT FOUND</h2>
                <Button onClick={() => router.push('/vault')}>Return to Archive</Button>
            </div>
        );
    }

    const report = artifact.ai_report;

    const shareReport = async () => {
        if (!artifact || !report) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('messages').insert({
            sender_id: user.id,
            group_id: 'global-research', // Shared with the global hub
            content: `I've shared a new scholarly report: ${report.title}`,
            artifact_id: artifact.id
        });

        if (error) {
            alert('Failed to share report with the research group.');
        } else {
            alert('Official dossier shared with Global Research Hub.');
            router.push('/messages');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={styles.container}
        >
            <header className={styles.header}>
                <span className={styles.recordId}>ALETHEON SCHOLARLY ARCHIVE — OFFICAL RECORD</span>
                <h1 className={styles.title}>{report.title}</h1>

                <div className={styles.metadata}>
                    <span className={styles.confidenceBadge}>{Math.round((report.confidenceScore || 0) * 100)}% CONFIDENCE</span>
                    <span>•</span>
                    <span>ORIGIN: {artifact.region || 'UNKNOWN'}</span>
                    <span>•</span>
                    <span>ERA: {artifact.era || 'UNDER INVESTIGATION'}</span>
                </div>
            </header>

            <div className={styles.content}>
                <aside className={styles.visualColumn}>
                    <div className={styles.artifactImage}>
                        {artifact.image_url ? (
                            <img src={artifact.image_url} alt={report.title} />
                        ) : (
                            <>
                                <Shield size={120} strokeWidth={0.5} style={{ opacity: 0.1 }} />
                                <div style={{ position: 'absolute', bottom: '20px', fontSize: '10px', color: 'var(--gold-muted)', letterSpacing: '2px' }}>OPTICAL SCAN V.4.2</div>
                            </>
                        )}
                    </div>

                    <div className={styles.compositionPanel}>
                        <span className={styles.panelTitle}>TECHNICAL DATA</span>
                        <div className={styles.metaGrid}>
                            <div className={styles.metaPoint}>
                                <span className={styles.metaLabel}>Specimen Maturity</span>
                                <span className={styles.metaValue}>{artifact.era}</span>
                            </div>
                            <div className={styles.metaPoint}>
                                <span className={styles.metaLabel}>Material Base</span>
                                <span className={styles.metaValue}>{artifact.material}</span>
                            </div>
                            <div className={styles.metaPoint}>
                                <span className={styles.metaLabel}>GPS Provenance</span>
                                <span className={styles.metaValue}>
                                    {artifact.latitude ? `${artifact.latitude.toFixed(4)}N` : 'N/A'}, {artifact.longitude ? `${artifact.longitude.toFixed(4)}E` : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                </aside>

                <main className={styles.reportColumn}>
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Visual & Physical Taxonomy</h2>
                        <div className={styles.sectionText}>
                            <span className={styles.dropCap}>{report.visualDescription.charAt(0)}</span>
                            {report.visualDescription.slice(1)}
                        </div>
                    </section>

                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Material & Scientific Analysis</h2>
                        <div className={styles.sectionText}>{report.materialAnalysis}</div>

                        <div className={styles.dataGrid}>
                            <div className={styles.dataCard}>
                                <span className={styles.dataLabel}>TYPOLOGY</span>
                                <span className={styles.dataValue}>{report.classification}</span>
                            </div>
                            <div className={styles.dataCard}>
                                <span className={styles.dataLabel}>STRUCTURAL LOGIC</span>
                                <span className={styles.dataValue}>{report.structuralInterpretation}</span>
                            </div>
                        </div>
                    </section>

                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Iconography & Symbolic Semiotics</h2>
                        <div className={styles.quote}>{report.symbolism}</div>
                        <div className={styles.sectionText}>{report.culturalContext}</div>
                    </section>

                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Regional & Geographic Provenance</h2>
                        <div className={styles.sectionText}>{report.geographicSignificance}</div>
                    </section>

                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Theoretical Life-Cycle Hypothesis</h2>
                        <div className={styles.sectionText}>{report.originHypothesis}</div>
                    </section>

                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Scholarly Comparisons</h2>
                        <div className={styles.sectionText}>{report.comparativeAnalysis}</div>
                    </section>
                </main>
            </div>

            <aside className={styles.sidebar}>
                <div className={styles.sidebarAction}>
                    <span className={styles.sidebarHeading}>ARCHIVAL MANAGEMENT</span>
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

                <div className={styles.sidebarAction}>
                    <span className={styles.sidebarHeading}>COLLABORATION</span>
                    <Button
                        variant="secondary"
                        fullWidth
                        onClick={shareReport}
                        leftIcon={<Share2 size={16} />}
                    >
                        SHARE WITH RESEARCH GROUP
                    </Button>
                </div>
            </aside>
        </motion.div>
    );
}
