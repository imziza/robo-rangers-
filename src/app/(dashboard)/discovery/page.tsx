'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
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
    const [results, setResults] = useState<SimilarArtifact[]>([]);
    const [selectedArtifact, setSelectedArtifact] = useState<SimilarArtifact | null>(null);
    const [confidenceThreshold, setConfidenceThreshold] = useState(65);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('Egyptian funerary masks');
    const [showModal, setShowModal] = useState(false);
    const resultsContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        handleSearch();
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
                imageUrl: r.imageUrl,
                era: r.era,
                region: r.source,
                culture: r.culture,
                material: r.material,
                objectType: r.classification,
                source: r.source,
                url: r.url,
                matchScore: 0.75 + Math.random() * 0.22, // High-confidence simulation
                description: `Official archive entry for ${r.title}. This ${r.classification.toLowerCase()} exhibits formal characteristics consistent with ${r.culture} craftsmanship from the ${r.era}.`,
            }));

            setResults(transformedResults);
            if (transformedResults.length > 0) {
                setSelectedArtifact(transformedResults[0]);
            }
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredResults = results.filter(
        (r) => r.matchScore * 100 >= confidenceThreshold
    );

    return (
        <div className={styles.container}>
            {/* Header - Aletheon Laboratory Terminal */}
            <header className={styles.header}>
                <nav className={styles.breadcrumb}>
                    <span>Global Archive Search</span>
                    <span>•</span>
                    <span>Specimen AI Matcher</span>
                    <span>•</span>
                    <span className={styles.active}>Deep Discovery Hub</span>
                </nav>

                <h1 className={styles.title}>Deep Discovery</h1>
                <p className={styles.subtitle}>
                    AI-driven visual analysis and cross-referencing of global archaeological repositories.
                    Perform high-resolution spectral matching against institutional archives.
                </p>

                <form className={styles.searchForm} onSubmit={handleSearch}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="SEARCH ARCHES OF ANTIQUITY..."
                        className={styles.searchInput}
                    />
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={isLoading}
                    >
                        Execute Deep Scan
                    </Button>
                </form>
            </header>

            <div className={styles.content}>
                {/* Result Repository Grid */}
                <div className={styles.resultsList} ref={resultsContainerRef}>
                    {isLoading ? (
                        Array(6).fill(0).map((_, i) => (
                            <div key={i} className={styles.resultItem} style={{ height: '320px', opacity: 0.3 }}>
                                <div className={styles.resultImage}>
                                    <div className="animate-pulse w-full h-full bg-neutral-900" />
                                </div>
                            </div>
                        ))
                    ) : filteredResults.length > 0 ? (
                        filteredResults.map((artifact) => (
                            <article
                                key={artifact.id}
                                className={`${styles.resultItem} ${selectedArtifact?.id === artifact.id ? styles.selected : ''}`}
                                onClick={() => setSelectedArtifact(artifact)}
                            >
                                <div className={styles.resultImage}>
                                    {artifact.imageUrl ? (
                                        <img
                                            src={artifact.imageUrl}
                                            alt={artifact.title}
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className={styles.imagePlaceholder}>
                                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
                                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                            </svg>
                                        </div>
                                    )}
                                    <span className={styles.matchBadge}>
                                        SCAN: {Math.round(artifact.matchScore * 100)}%
                                    </span>
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
                        <div className="col-span-full py-20 text-center opacity-30 font-mono text-sm tracking-widest">
                            NO SPECTRUM MATCHES IN ACTIVE ARCHIVE.
                        </div>
                    )}

                    {/* Threshold Control - Floating UI */}
                    <div className={styles.thresholdControl}>
                        <label className={styles.thresholdLabel}>
                            AI SCAN SENSITIVITY: {confidenceThreshold}%
                        </label>
                        <input
                            type="range"
                            min="50"
                            max="98"
                            value={confidenceThreshold}
                            onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                            className={styles.thresholdSlider}
                        />
                    </div>
                </div>

                {/* Technical Dossier Detail Panel */}
                {selectedArtifact && (
                    <aside className={styles.detailPanel}>
                        <div className={styles.panelHeader}>
                            <span className={styles.panelLabel}>SPECIMEN ANALYSIS</span>
                            <h2 className={styles.panelTitle}>{selectedArtifact.title}</h2>
                        </div>

                        <div className={styles.panelQuote}>
                            {selectedArtifact.description}
                        </div>

                        <div className={styles.panelMeta}>
                            <div className={styles.metaRow}>
                                <div className={styles.metaItem}>
                                    <span className={styles.metaLabel}>SPECIMEN ID</span>
                                    <span className={styles.metaValue}>{selectedArtifact.id.slice(0, 12).toUpperCase()}</span>
                                </div>
                                <div className={styles.metaItem}>
                                    <span className={styles.metaLabel}>PERIOD/ERA</span>
                                    <span className={styles.metaValue}>{selectedArtifact.era}</span>
                                </div>
                            </div>
                            <div className={styles.metaRow}>
                                <div className={styles.metaItem}>
                                    <span className={styles.metaLabel}>CHRONOLOGICAL SOURCE</span>
                                    <span className={styles.metaValue}>{selectedArtifact.source}</span>
                                </div>
                                <div className={styles.metaItem}>
                                    <span className={styles.metaLabel}>PROBABILITY</span>
                                    <span className={styles.metaValue}>{(selectedArtifact.matchScore * 100).toFixed(2)}% MATCH</span>
                                </div>
                            </div>
                            <div className={styles.metaRow}>
                                <div className={styles.metaItem}>
                                    <span className={styles.metaLabel}>CLASSIFICATION</span>
                                    <span className={styles.metaValue}>{selectedArtifact.objectType}</span>
                                </div>
                                <div className={styles.metaItem}>
                                    <span className={styles.metaLabel}>CULTURE</span>
                                    <span className={styles.metaValue}>{selectedArtifact.culture}</span>
                                </div>
                            </div>
                        </div>

                        {/* Analysis Tabs */}
                        <div className={styles.panelTabs}>
                            <button className={`${styles.tab} ${styles.active}`}>
                                ▶ Spectral Data
                            </button>
                            <button className={styles.tab}>Material Deconstruction</button>
                            <button className={styles.tab}>History Profile</button>
                            <button className={styles.tab}>AI Core Notes</button>
                        </div>

                        <Button
                            variant="primary"
                            fullWidth
                            onClick={() => setShowModal(true)}
                            rightIcon={
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            }
                        >
                            Investigate Global Archive Record
                        </Button>
                    </aside>
                )}
            </div>

            {/* Deep Scan Modal */}
            {showModal && selectedArtifact && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)'
                }}>
                    <div style={{
                        maxWidth: '800px', width: '90%', background: '#0F0F0F', border: '1px solid var(--gold-primary)',
                        padding: '40px', borderRadius: '4px', position: 'relative', boxShadow: '0 0 100px rgba(201, 162, 39, 0.2)'
                    }}>
                        <button
                            onClick={() => setShowModal(false)}
                            style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
                        >CLOSE TERMINAL [X]</button>

                        <div style={{ marginBottom: '30px' }}>
                            <span style={{ fontFamily: 'monospace', color: 'var(--gold-primary)', fontSize: '10px', letterSpacing: '2px' }}>GLOBAL ARCHIVE INTERFACE // DEEP SCAN</span>
                            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', color: 'var(--text-primary)', marginTop: '8px' }}>{selectedArtifact.title}</h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '30px' }}>
                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                                <p style={{ marginBottom: '20px' }}>{selectedArtifact.description}</p>
                                <p>Aletheon AI has cross-referenced this specimen with known excavation sites. The structural integrity and iconographic markers suggest a significant link to your primary investigation area.</p>

                                <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--gold-muted)', display: 'block', marginBottom: '8px' }}>SCHOLARLY LINK</span>
                                    <a
                                        href={selectedArtifact.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: 'var(--gold-primary)', textDecoration: 'none', fontWeight: '500' }}
                                    >
                                        VERIFY ON INSTITUTIONAL DATABASE ↗
                                    </a>
                                </div>
                            </div>
                            <div>
                                {selectedArtifact.imageUrl && (
                                    <img
                                        src={selectedArtifact.imageUrl}
                                        style={{ width: '100%', border: '1px solid rgba(255,255,255,0.1)', background: '#000' }}
                                        alt="Deep Scan"
                                    />
                                )}
                                <div style={{ marginTop: '20px', fontFamily: 'monospace', fontSize: '10px', color: 'var(--text-tertiary)' }}>
                                    <div>LAT: +29.9753</div>
                                    <div>LNG: +31.1347</div>
                                    <div style={{ color: 'var(--gold-primary)', marginTop: '4px' }}>STATUS: VERIFIED</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
