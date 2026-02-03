'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { ArtifactCard } from '@/components/ui/Card';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { Shield, Sparkles, Database, History, Zap, Filter, ChevronRight, Plus } from 'lucide-react';
import styles from './page.module.css';

interface Artifact {
    id: string;
    title: string;
    classification: string | null;
    material: string | null;
    era: string | null;
    status: 'stable' | 'critical' | 'pending';
    confidence_score: number | null;
    created_at: string;
    images?: { image_url: string; is_primary: boolean }[];
}

const MATERIALS = ['All', 'Gold', 'Stone', 'Lapis', 'Clay', 'Bronze', 'Terracotta'];

const STATUS_FILTERS = [
    { id: 'All Specimens', label: 'All Specimens', icon: Database },
    { id: 'Recently Analyzed', label: 'Recent Scans', icon: History },
    { id: 'High Integrity', label: 'High Fidelity', icon: Sparkles },
    { id: 'Critical Care', label: 'Restoration', icon: Zap },
];

const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
};

export default function VaultPage() {
    const router = useRouter();
    const supabase = createSupabaseBrowserClient();
    const [artifacts, setArtifacts] = useState<Artifact[]>([]);
    const [selectedMaterial, setSelectedMaterial] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All Specimens');
    const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadArtifacts();
    }, []);

    const loadArtifacts = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('artifacts')
                .select('*, artifact_images (image_url, is_primary)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const dbArtifacts = (data || []).map(d => ({
                ...d,
                images: d.artifact_images || []
            }));

            // Sync with local storage for session parity
            const localCatalog = JSON.parse(localStorage.getItem('vault_catalog') || '[]');
            const localArtifacts = localCatalog
                .filter((la: Artifact) => !dbArtifacts.find(da => da.id === la.id))
                .map((la: Artifact & { image_url?: string }) => ({
                    ...la,
                    images: la.image_url ? [{ image_url: la.image_url, is_primary: true }] : []
                }));

            const combined = [...localArtifacts, ...dbArtifacts];
            setArtifacts(combined);
            if (combined.length > 0) setSelectedArtifact(combined[0]);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredArtifacts = artifacts.filter(artifact => {
        if (selectedMaterial !== 'All' && artifact.material?.toLowerCase() !== selectedMaterial.toLowerCase()) return false;
        if (selectedStatus === 'High Integrity' && (artifact.confidence_score || 0) < 0.8) return false;
        if (selectedStatus === 'Critical Care' && artifact.status !== 'critical') return false;
        if (selectedStatus === 'Recently Analyzed') {
            const fiveDaysAgo = new Date();
            fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
            return new Date(artifact.created_at) > fiveDaysAgo;
        }
        return true;
    });

    return (
        <div className={styles.container}>
            {/* Archival Sidebar */}
            <aside className={styles.filterSidebar}>
                <div className={styles.sidebarHeader}>
                    <h2 className={styles.sidebarTitle}>Vault</h2>
                    <span className={styles.sidebarSubtitle}>ARTIFACT DATABASE v4.2</span>
                </div>

                <nav className={styles.statusNav}>
                    {STATUS_FILTERS.map(status => (
                        <button
                            key={status.id}
                            className={`${styles.statusItem} ${selectedStatus === status.id ? styles.active : ''}`}
                            onClick={() => setSelectedStatus(status.id)}
                        >
                            <status.icon size={18} />
                            <span>{status.label}</span>
                        </button>
                    ))}
                </nav>

                <div className={styles.filterSection}>
                    <div className={styles.filterTitle}>
                        <Filter size={12} style={{ marginRight: 8 }} />
                        <span>Filter by Material</span>
                    </div>
                    <div className={styles.materialTags}>
                        {MATERIALS.map(material => (
                            <button
                                key={material}
                                className={`${styles.materialTag} ${selectedMaterial === material ? styles.active : ''}`}
                                onClick={() => setSelectedMaterial(material)}
                            >
                                {material}
                            </button>
                        ))}
                    </div>
                </div>

                <Button
                    variant="primary"
                    fullWidth
                    leftIcon={<Plus size={18} />}
                    onClick={() => router.push('/analysis')}
                    onMouseEnter={() => router.prefetch('/analysis')}
                >
                    Initiate Analysis
                </Button>
            </aside>

            {/* Main Content */}
            <main className={styles.mainContent}>
                <Panel
                    variant="glass"
                    padding="lg"
                    elevation={2}
                    className={styles.contentHeader}
                >
                    <div className={styles.activeAnalysis}>
                        {selectedArtifact ? (
                            <>
                                <div className={styles.activeHeaderTop}>
                                    <span className={styles.activeLabel}>Selected Specimen</span>
                                    <span className={styles.headerDots}></span>
                                    <div className={styles.headerIntegrity}>
                                        <div className={styles.integrityBar}>
                                            <motion.div
                                                className={styles.integrityFill}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.round((selectedArtifact.confidence_score || 0) * 100)}%` }}
                                            />
                                        </div>
                                        <span className={styles.integrityText}>{Math.round((selectedArtifact.confidence_score || 0) * 100)}% Integrity</span>
                                    </div>
                                </div>
                                <h1 className={styles.activeTitle}>{selectedArtifact.title}</h1>

                                <div className={styles.activeHeaderMeta}>
                                    <div className={styles.metaGroup}>
                                        <span className={styles.metaLabel}>ID</span>
                                        <span className={styles.metaValue}>{selectedArtifact.id.slice(0, 8)}</span>
                                    </div>
                                    <div className={styles.metaDivider} />
                                    <div className={styles.metaGroup}>
                                        <span className={styles.metaLabel}>Era</span>
                                        <span className={styles.metaValue}>{selectedArtifact.era || 'Pending Analysis'}</span>
                                    </div>
                                    <div className={styles.metaDivider} />
                                    <div className={styles.metaGroup}>
                                        <span className={styles.metaLabel}>Domain</span>
                                        <span className={styles.metaValue}>{selectedArtifact.material || 'Unclassified'}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className={styles.emptyHeader}>
                                <h1 className={styles.activeTitle}>Select an Artifact</h1>
                                <p className={styles.emptySub}>Choose a specimen from the grid to view details.</p>
                            </div>
                        )}
                    </div>
                    <Button
                        variant="primary"
                        disabled={!selectedArtifact}
                        onClick={() => selectedArtifact && router.push(`/report/${selectedArtifact.id}`)}
                        onMouseEnter={() => selectedArtifact && router.prefetch(`/report/${selectedArtifact.id}`)}
                        rightIcon={<ChevronRight size={16} />}
                        className={styles.viewDossierBtn}
                    >
                        View Dossier
                    </Button>
                </Panel>

                <motion.div
                    className={styles.artifactGrid}
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                >
                    <AnimatePresence mode="popLayout">
                        {isLoading ? (
                            Array(8).fill(0).map((_, i) => (
                                <motion.div key={`skeleton-${i}`} className={styles.skeletonCard} variants={itemVariants} />
                            ))
                        ) : filteredArtifacts.length > 0 ? (
                            filteredArtifacts.map(artifact => (
                                <motion.div
                                    key={artifact.id}
                                    variants={itemVariants}
                                    layout
                                    className={`${styles.artifactItem} ${selectedArtifact?.id === artifact.id ? styles.selected : ''}`}
                                    onClick={() => setSelectedArtifact(artifact)}
                                    whileHover={{ y: -4 }}
                                >
                                    <ArtifactCard
                                        id={artifact.id}
                                        title={artifact.title}
                                        imageUrl={artifact.images?.find(img => img.is_primary)?.image_url}
                                        image_urls={artifact.images?.map(img => img.image_url)}
                                        classification={artifact.classification || undefined}
                                        era={artifact.era || undefined}
                                        status={artifact.status}
                                        digitized={Math.round((artifact.confidence_score || 0) * 100)}
                                    />
                                </motion.div>
                            ))
                        ) : (
                            <motion.div
                                className={styles.emptyState}
                                variants={itemVariants}
                            >
                                <Shield size={48} strokeWidth={0.5} />
                                <h3>No Artifacts Found</h3>
                                <p>Adjust your archival filters to locate specific specimens.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </main>
        </div>
    );
}
