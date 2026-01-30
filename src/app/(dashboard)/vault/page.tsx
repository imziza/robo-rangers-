'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { ArtifactCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';

interface Artifact {
    id: string; title: string; classification: string | null; material: string | null; era: string | null; status: 'stable' | 'critical' | 'pending'; confidence_score: number | null; created_at: string; images?: { image_url: string; is_primary: boolean }[];
}

const MATERIALS = ['All', 'Gold', 'Stone', 'Lapis', 'Clay', 'Bronze', 'Terracotta'];
const STATUSES = ['All Specimens', 'Recently Analyzed', 'High Integrity', 'Critical Care'];

export default function VaultPage() {
    const router = useRouter();
    const supabase = createSupabaseBrowserClient();
    const [artifacts, setArtifacts] = useState<Artifact[]>([]);
    const [selectedMaterial, setSelectedMaterial] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All Specimens');
    const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => { loadArtifacts(); }, []);

    const loadArtifacts = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('artifacts').select('*, artifact_images (image_url, is_primary)').order('created_at', { ascending: false });
            if (error) throw error;
            const dbArtifacts = (data || []).map(d => ({ ...d, images: d.artifact_images || [] }));
            const localCatalog = JSON.parse(localStorage.getItem('vault_catalog') || '[]');
            const localArtifacts = localCatalog.filter((la: Artifact) => !dbArtifacts.find(da => da.id === la.id)).map((la: any) => ({ ...la, images: la.image_url ? [{ image_url: la.image_url, is_primary: true }] : [] }));
            const combined = [...localArtifacts, ...dbArtifacts];
            setArtifacts(combined);
            if (combined.length > 0) setSelectedArtifact(combined[0]);
        } catch (err) { console.error(err); } finally { setIsLoading(false); }
    };

    const filteredArtifacts = artifacts.filter(artifact => {
        if (selectedMaterial !== 'All' && artifact.material?.toLowerCase() !== selectedMaterial.toLowerCase()) return false;
        if (selectedStatus === 'High Integrity' && (artifact.confidence_score || 0) < 0.8) return false;
        if (selectedStatus === 'Critical Care' && artifact.status !== 'critical') return false;
        return true;
    });

    return (
        <div className={styles.container}>
            <aside className={styles.filterSidebar}>
                <div className={styles.sidebarHeader}><h2 className={styles.sidebarTitle}>Preservation Vault</h2><span className={styles.sidebarSubtitle}>ARTIFACT DATABASE v4.2</span></div>
                <nav className={styles.statusNav}>
                    {STATUSES.map(status => (
                        <button key={status} className={`${styles.statusItem} ${selectedStatus === status ? styles.active : ''}`} onClick={() => setSelectedStatus(status)}>{status}</button>
                    ))}
                </nav>
                <div className={styles.filterSection}>
                    <h3 className={styles.filterTitle}>Filter by Material</h3>
                    <div className={styles.materialTags}>
                        {MATERIALS.map(material => (
                            <button key={material} className={`${styles.materialTag} ${selectedMaterial === material ? styles.active : ''}`} onClick={() => setSelectedMaterial(material)}>{material}</button>
                        ))}
                    </div>
                </div>
                <Button variant="primary" fullWidth onClick={() => router.push('/analysis')}>New Analysis</Button>
            </aside>
            <main className={styles.mainContent}>
                <div className={styles.contentHeader}>
                    <div className={styles.activeAnalysis}>
                        {selectedArtifact ? (
                            <h1 className={styles.activeTitle}>{selectedArtifact.id}: {selectedArtifact.title}</h1>
                        ) : (
                            <h1 className={styles.activeTitle}>No Specimen Selected</h1>
                        )}
                    </div>
                    <Button
                        variant="secondary"
                        disabled={!selectedArtifact}
                        onClick={() => selectedArtifact && router.push(`/report/${selectedArtifact.id}`)}
                    >
                        View Report
                    </Button>
                </div>
                <div className={styles.artifactGrid}>
                    <AnimatePresence mode="popLayout">
                        {isLoading ? Array(8).fill(0).map((_, i) => <motion.div key={i} className={styles.skeletonCard} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />)
                        : filteredArtifacts.map(artifact => (
                            <motion.div key={artifact.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`${styles.artifactItem} ${selectedArtifact?.id === artifact.id ? styles.selected : ''}`} onClick={() => setSelectedArtifact(artifact)}>
                                <ArtifactCard id={artifact.id} title={artifact.title} imageUrl={artifact.images?.find(img => img.is_primary)?.image_url} classification={artifact.classification || undefined} era={artifact.era || undefined} status={artifact.status} digitized={Math.round((artifact.confidence_score || 0) * 100)} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
