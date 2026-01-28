'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { ArtifactCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
const STATUSES = ['All Specimens', 'Recently Analyzed', 'High Integrity', 'Critical Care'];

// Mock data for development
const MOCK_ARTIFACTS: Artifact[] = [
    {
        id: 'AL-992-X',
        title: 'Gilded Sarcophagus of Memphis',
        classification: 'Funerary Object',
        material: 'Gold & Lapis',
        era: '323-31 BC',
        status: 'stable',
        confidence_score: 0.964,
        created_at: new Date().toISOString(),
        images: [{ image_url: '/artifacts/sarcophagus.png', is_primary: true }],
    },
    {
        id: 'AL-441-K',
        title: 'Bronze Aegis of the Anatolian Frontier',
        classification: 'Armor / Shield',
        material: 'Bronze',
        era: '1200-1100 BC',
        status: 'stable',
        confidence_score: 0.88,
        created_at: new Date().toISOString(),
        images: [{ image_url: '/artifacts/mask.png', is_primary: true }],
    },
    {
        id: 'AL-187-C',
        title: 'Terracotta Amphora',
        classification: 'Vessel',
        material: 'Terracotta',
        era: '500-400 BC',
        status: 'critical',
        confidence_score: 1.0,
        created_at: new Date().toISOString(),
        images: [{ image_url: '/artifacts/amphora.png', is_primary: true }],
    },
    {
        id: 'AL-093-X',
        title: 'Obsidian Scrying Mirror',
        classification: 'Ritual Object',
        material: 'Obsidian',
        era: '1200-900 BC',
        status: 'stable',
        confidence_score: 0.88,
        created_at: new Date().toISOString(),
        images: [{ image_url: '/artifacts/mirror.png', is_primary: true }],
    },
];

export default function VaultPage() {
    const router = useRouter();
    const supabase = createSupabaseBrowserClient();

    const [artifacts, setArtifacts] = useState<Artifact[]>(MOCK_ARTIFACTS);
    const [selectedMaterial, setSelectedMaterial] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All Specimens');
    const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(MOCK_ARTIFACTS[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [vaultStats, setVaultStats] = useState({
        totalSites: 42,
        vaultCapacity: '4,278',
        supportProtocol: '76%',
        syncStatus: '100%',
    });

    useEffect(() => {
        loadArtifacts();
    }, []);

    const loadArtifacts = async () => {
        setIsLoading(true);
        try {
            // 1. Load Local Discoveries (cached from Laboratory)
            const localCatalog = JSON.parse(localStorage.getItem('vault_catalog') || '[]');
            const localArtifacts: Artifact[] = localCatalog.map((la: any) => ({
                ...la,
                images: la.image_url ? [{ image_url: la.image_url, is_primary: true }] : []
            }));

            // 2. Load DB Records
            const { data, error } = await supabase
                .from('artifacts')
                .select(`
                    *,
                    artifact_images (image_url, is_primary)
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error loading artifacts:', error);
                // Combine Local + Mock
                const combined = [...localArtifacts, ...MOCK_ARTIFACTS];
                setArtifacts(combined);
                if (combined.length > 0) setSelectedArtifact(combined[0]);
                return;
            }

            // 3. Combine All (Local > DB > Mock)
            // Filter out mock data if DB artifacts match IDs or if we have enough real data
            const dbArtifacts = (data || []).map(d => ({
                ...d,
                images: d.artifact_images || []
            }));

            const combined = [...localArtifacts, ...dbArtifacts, ...MOCK_ARTIFACTS];

            // Deduplicate by ID
            const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());

            setArtifacts(unique);
            if (unique.length > 0) setSelectedArtifact(unique[0]);
        } catch (err) {
            console.error('Failed to load artifacts:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredArtifacts = artifacts.filter(artifact => {
        if (selectedMaterial !== 'All' && artifact.material?.toLowerCase() !== selectedMaterial.toLowerCase()) {
            return false;
        }
        if (selectedStatus === 'High Integrity' && (artifact.confidence_score || 0) < 0.8) {
            return false;
        }
        if (selectedStatus === 'Critical Care' && artifact.status !== 'critical') {
            return false;
        }
        return true;
    });

    return (
        <div className={styles.container}>
            {/* Left Sidebar - Filters */}
            <aside className={styles.filterSidebar}>
                <div className={styles.sidebarHeader}>
                    <h2 className={styles.sidebarTitle}>Preservation Vault</h2>
                    <span className={styles.sidebarSubtitle}>ARTIFACT DATABASE v4.2</span>
                </div>

                {/* Status Filters */}
                <nav className={styles.statusNav}>
                    {STATUSES.map((status) => (
                        <button
                            key={status}
                            className={`${styles.statusItem} ${selectedStatus === status ? styles.active : ''}`}
                            onClick={() => setSelectedStatus(status)}
                        >
                            <span className={styles.statusIcon}>
                                {status === 'All Specimens' && '📦'}
                                {status === 'Recently Analyzed' && '🔬'}
                                {status === 'High Integrity' && '✓'}
                                {status === 'Critical Care' && '⚠'}
                            </span>
                            {status}
                        </button>
                    ))}
                </nav>

                {/* Material Filters */}
                <div className={styles.filterSection}>
                    <h3 className={styles.filterTitle}>Filter by Material</h3>
                    <div className={styles.materialTags}>
                        {MATERIALS.map((material) => (
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
                    onClick={() => router.push('/analysis')}
                    leftIcon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                    }
                >
                    New Analysis
                </Button>
            </aside>

            {/* Main Content - Artifact Grid */}
            <main className={styles.mainContent}>
                <div className={styles.contentHeader}>
                    <div className={styles.activeAnalysis}>
                        <span className={styles.activeLabel}>ACTIVE ANALYSIS</span>
                        <h1 className={styles.activeTitle}>
                            {selectedArtifact?.id}: {selectedArtifact?.title}
                        </h1>
                        <p className={styles.activeMeta}>
                            Classical Era • Hellenistic Origin • {Math.round((selectedArtifact?.confidence_score || 0.96) * 100)}% Integrity
                        </p>
                    </div>

                    <Button
                        variant="secondary"
                        onClick={() => selectedArtifact && router.push(`/report/${selectedArtifact.id}`)}
                    >
                        View Scholarly Report
                    </Button>
                </div>

                <div className={styles.filterBar}>
                    <span className={styles.filterTag}>Era: Ancient ×</span>
                    <select className={styles.filterSelect}>
                        <option>Status: High Priority</option>
                        <option>Status: All</option>
                        <option>Status: Critical</option>
                    </select>
                    <select className={styles.filterSelect}>
                        <option>Source: Mediterranean</option>
                        <option>Source: All Regions</option>
                    </select>
                </div>

                {/* Artifact Grid */}
                <div className={styles.artifactGrid}>
                    {filteredArtifacts.map((artifact) => (
                        <div
                            key={artifact.id}
                            className={`${styles.artifactItem} ${selectedArtifact?.id === artifact.id ? styles.selected : ''}`}
                            onClick={() => setSelectedArtifact(artifact)}
                            onDoubleClick={() => router.push(`/report/${artifact.id}`)}
                            title="Double-click to view full scholarly report"
                        >
                            <ArtifactCard
                                id={artifact.id}
                                title={artifact.title}
                                imageUrl={artifact.images?.find(img => img.is_primary)?.image_url}
                                classification={artifact.classification || undefined}
                                era={artifact.era || undefined}
                                material={artifact.material || undefined}
                                status={artifact.status}
                                digitized={Math.round((artifact.confidence_score || 0) * 100)}
                            />
                        </div>
                    ))}
                </div>

                {/* Stats Bar */}
                <div className={styles.statsBar}>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Node Active</span>
                        <span className={styles.statValue}>Alexandria-1</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Sync Status</span>
                        <span className={styles.statValue}>{vaultStats.syncStatus}</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Vault Capacity</span>
                        <span className={styles.statValue}>{vaultStats.vaultCapacity}</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Support Protocol</span>
                        <span className={styles.statValue}>{vaultStats.supportProtocol}</span>
                    </div>
                </div>
            </main>

            {/* Right Panel - Detail View */}
            <aside className={styles.detailPanel}>
                <div className={styles.detailHeader}>
                    <span className={styles.detailLabel}>DETAILED SPECIMEN REPORT // {selectedArtifact?.id.slice(-2).toUpperCase() || '01-A'}</span>
                    <div className={styles.detailStars}>★</div>
                </div>

                <h2 className={styles.detailTitle}>Technical Composition</h2>

                <blockquote className={styles.detailQuote}>
                    "The {selectedArtifact?.id} specimen exhibits a unique molecular signature consistent
                    with {selectedArtifact?.era || 'mid-period Classical'} craftsmanship. AI analysis suggests a high concentration
                    of {selectedArtifact?.material?.toLowerCase() || 'primary material'} compounds characteristic of high-integrity archaeological finds."
                </blockquote>

                <div className={styles.specGrid}>
                    <div className={styles.specItem}>
                        <span className={styles.specLabel}>ERA</span>
                        <span className={styles.specValue}>{selectedArtifact?.era || 'UNKNOWN'}</span>
                    </div>
                    <div className={styles.specItem}>
                        <span className={styles.specLabel}>WEIGHT</span>
                        <span className={styles.specValue}>{(Math.random() * 5 + 1).toFixed(1)} kg</span>
                    </div>
                    <div className={styles.specItem}>
                        <span className={styles.specLabel}>MATERIAL</span>
                        <span className={styles.specValue}>{selectedArtifact?.material || 'UNIDENTIFIED'}</span>
                    </div>
                    <div className={styles.specItem}>
                        <span className={styles.specLabel}>PH LEVEL</span>
                        <span className={styles.specValue}>{(Math.random() * 2 + 6).toFixed(1)} (Stable)</span>
                    </div>
                </div>

                {/* Chemical Breakdown */}
                <div className={styles.chemSection}>
                    <h3 className={styles.chemTitle}>
                        <span className={styles.chemIcon}>⚠</span>
                        Chemical Breakdown
                    </h3>

                    <div className={styles.chemBar}>
                        <div className={styles.chemBarLabel}>{selectedArtifact?.material || 'Base Matrix'}</div>
                        <div className={styles.chemBarTrack}>
                            <div className={styles.chemBarFill} style={{ width: '82%' }}></div>
                        </div>
                        <span className={styles.chemBarValue}>82%</span>
                    </div>

                    <div className={styles.chemBar}>
                        <div className={styles.chemBarLabel}>Trace Oxides</div>
                        <div className={styles.chemBarTrack}>
                            <div className={styles.chemBarFill} style={{ width: '12%' }}></div>
                        </div>
                        <span className={styles.chemBarValue}>12%</span>
                    </div>

                    <div className={styles.chemBar}>
                        <div className={styles.chemBarLabel}>Moisture</div>
                        <div className={styles.chemBarTrack}>
                            <div className={styles.chemBarFill} style={{ width: '6%' }}></div>
                        </div>
                        <span className={styles.chemBarValue}>6%</span>
                    </div>
                </div>

                <div className={styles.detailActions}>
                    <Button
                        variant="primary"
                        fullWidth
                        onClick={() => selectedArtifact && router.push(`/report/${selectedArtifact.id}`)}
                    >
                        Access Scholarly Report
                    </Button>
                    <Button variant="outline" fullWidth>
                        Run Full Spectroscopy
                    </Button>
                </div>

                {/* Cross-section Images */}
                <div className={styles.crossSection}>
                    <div className={styles.crossImage} style={selectedArtifact?.images?.[0] ? { backgroundImage: `url(${selectedArtifact.images[0].image_url})`, backgroundSize: 'cover' } : {}}></div>
                    <div className={styles.crossImage}></div>
                    <div className={styles.crossImage}></div>
                    <div className={styles.crossImage}></div>
                </div>
            </aside>
        </div>
    );
}
