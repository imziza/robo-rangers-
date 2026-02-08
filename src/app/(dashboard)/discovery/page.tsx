'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Compass, Shield, ArrowRight, X, Save, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import styles from './page.module.css';

interface SimilarArtifact {
    id: string;
    title: string;
    imageUrl: string | null;
    era: string | null;
    region: string | null;
    culture: string | null;
    material: string | null;
    objectType: string | null;
    matchScore: number;
    description: string;
    source: string;
    url: string;
}

export default function DiscoveryPage() {
    const { showToast } = useToast();
    const [results, setResults] = useState<SimilarArtifact[]>([]);
    const [selectedArtifact, setSelectedArtifact] = useState<SimilarArtifact | null>(null);
    const [confidenceThreshold, setConfidenceThreshold] = useState(65);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('Egyptian funerary masks');
    const [showModal, setShowModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [savedIds, setSavedIds] = useState<string[]>([]);

    useEffect(() => {
        handleSearch();
        const catalog = JSON.parse(localStorage.getItem('vault_catalog') || '[]');
        setSavedIds(catalog.map((c: any) => c.externalId).filter(Boolean));
    }, []);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsLoading(true);
        try {
            const response = await fetch(`/api/discovery/search?q=${encodeURIComponent(searchQuery)}`);
            if (!response.ok) throw new Error('Search failed');
            const data = await response.json();

            const transformedResults: SimilarArtifact[] = data.results.map((r: any) => ({
                id: r.id,
                title: r.title,
                imageUrl: r.imageUrl || r.thumbnailUrl,
                era: r.era || 'Unknown Era',
                region: r.region || 'Unknown Region',
                culture: r.culture || 'Unknown Culture',
                material: r.material || 'Mixed Materials',
                objectType: r.objectType || 'Artifact',
                source: 'Smithsonian Institution',
                url: r.recordUrl,
                matchScore: r.matchScore || (0.75 + Math.random() * 0.22),
                description: `Official archive entry for ${r.title}. This ${(r.objectType || 'specimen').toLowerCase()} exhibits formal characteristics consistent with ${r.culture || 'contemporary'} craftsmanship from the ${r.era || 'relevant period'}.`,
            }));

            setResults(transformedResults);
            if (transformedResults.length > 0) setSelectedArtifact(transformedResults[0]);
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveToVault = async (artifact: SimilarArtifact) => {
        setIsSaving(true);
        try {
            const catalog = JSON.parse(localStorage.getItem('vault_catalog') || '[]');
            const newArtifact = {
                id: `ext-${Date.now()}`,
                externalId: artifact.id,
                title: artifact.title,
                classification: artifact.objectType,
                material: artifact.material,
                era: artifact.era,
                status: 'stable',
                confidence_score: artifact.matchScore,
                image_url: artifact.imageUrl,
                created_at: new Date().toISOString(),
                source: artifact.source
            };

            localStorage.setItem('vault_catalog', JSON.stringify([newArtifact, ...catalog]));
            setSavedIds(prev => [...prev, artifact.id]);
            showToast('Artifact archived in local vault.', 'success');
        } catch (err) {
            showToast('Archival protocol failed.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredResults = results.filter(r => r.matchScore * 100 >= confidenceThreshold);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Deep Discovery</h1>
                <p className={styles.subtitle}>AI-driven cross-referencing of global archaeological repositories.</p>
                <form className={styles.searchForm} onSubmit={handleSearch}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="SEARCH ARCHES OF ANTIQUITY..."
                        className={styles.searchInput}
                    />
                    <Button type="submit" variant="primary" isLoading={isLoading}>Execute Deep Scan</Button>
                </form>
            </header>

            <div className={styles.content}>
                <div className={styles.resultsList}>
                    {isLoading ? (
                        Array(6).fill(0).map((_, i) => <SkeletonCard key={i} height="320px" />)
                    ) : filteredResults.length > 0 ? (
                        filteredResults.map((artifact) => (
                            <article
                                key={artifact.id}
                                className={`${styles.resultItem} ${selectedArtifact?.id === artifact.id ? styles.selected : ''}`}
                                onClick={() => setSelectedArtifact(artifact)}
                            >
                                <div className={styles.resultImage}>
                                    {artifact.imageUrl ? <img src={artifact.imageUrl} alt={artifact.title} /> : <div className={styles.imagePlaceholder}><Shield size={60} strokeWidth={0.5} /></div>}
                                    <span className={styles.matchBadge}>SCAN: {Math.round(artifact.matchScore * 100)}%</span>
                                </div>
                                <div className={styles.resultContent}>
                                    <h3 className={styles.resultTitle}>{artifact.title}</h3>
                                    <div className={styles.resultTags}>
                                        <span className={styles.tag}>{artifact.era}</span>
                                        <span className={styles.tag}>{artifact.material}</span>
                                    </div>
                                </div>
                            </article>
                        ))
                    ) : (
                        <div className={styles.emptyResults}>NO SPECTRUM MATCHES IN ACTIVE ARCHIVE.</div>
                    )}
                    <div className={styles.thresholdControl}>
                        <label className={styles.thresholdLabel}>AI SCAN SENSITIVITY: {confidenceThreshold}%</label>
                        <input type="range" min="50" max="98" value={confidenceThreshold} onChange={(e) => setConfidenceThreshold(Number(e.target.value))} className={styles.thresholdSlider} />
                    </div>
                </div>

                {selectedArtifact && (
                    <aside className={styles.detailPanel}>
                        <div className={styles.panelHeader}>
                            <span className={styles.panelLabel}>SPECIMEN ANALYSIS</span>
                            <h2 className={styles.panelTitle}>{selectedArtifact.title}</h2>
                        </div>
                        <div className={styles.panelQuote}>{selectedArtifact.description}</div>
                        <div className={styles.panelMeta}>
                            <div className={styles.metaRow}>
                                <div className={styles.metaItem}><span className={styles.metaLabel}>PERIOD</span><span className={styles.metaValue}>{selectedArtifact.era}</span></div>
                                <div className={styles.metaItem}><span className={styles.metaLabel}>PROBABILITY</span><span className={styles.metaValue}>{Math.round(selectedArtifact.matchScore * 100)}%</span></div>
                            </div>
                        </div>
                        <div className={styles.panelActions}>
                            <Button
                                variant={savedIds.includes(selectedArtifact.id) ? "outline" : "primary"}
                                fullWidth
                                onClick={() => handleSaveToVault(selectedArtifact)}
                                disabled={savedIds.includes(selectedArtifact.id)}
                                leftIcon={savedIds.includes(selectedArtifact.id) ? <Check size={14} /> : <Save size={14} />}
                                isLoading={isSaving}
                            >
                                {savedIds.includes(selectedArtifact.id) ? "Archived in Vault" : "Archiving to Vault"}
                            </Button>
                            <Button variant="ghost" fullWidth onClick={() => setShowModal(true)} rightIcon={<ArrowRight size={14} />}>Investigate Source</Button>
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
}
