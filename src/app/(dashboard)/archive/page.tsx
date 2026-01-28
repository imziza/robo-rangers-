'use client';

import { useState } from 'react';
import { ArtifactCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';

interface Artifact {
    id: string;
    title: string;
    classification: string;
    material: string;
    era: string;
    status: 'stable' | 'critical' | 'pending';
    confidence_score: number;
}

const MOCK_ARCHIVE: Artifact[] = [
    {
        id: 'AL-992-X',
        title: 'Gilded Sarcophagus',
        classification: 'Funerary Object',
        material: 'Gold',
        era: '323-31 BC',
        status: 'stable',
        confidence_score: 0.964,
    },
    {
        id: 'AL-441-K',
        title: 'Marble Bust Fragment',
        classification: 'Sculpture',
        material: 'Stone',
        era: '100-200 AD',
        status: 'stable',
        confidence_score: 0.41,
    },
    {
        id: 'AL-187-C',
        title: 'Terracotta Amphora',
        classification: 'Vessel',
        material: 'Terracotta',
        era: '500-400 BC',
        status: 'critical',
        confidence_score: 1.0,
    },
    {
        id: 'AL-093-X',
        title: 'Jade Ceremonial Blade',
        classification: 'Ritual Object',
        material: 'Stone',
        era: '1200 BC',
        status: 'stable',
        confidence_score: 0.88,
    },
    {
        id: 'AL-552-M',
        title: 'Imperial Bronze Drachma',
        classification: 'Currency',
        material: 'Bronze',
        era: '27 BC - 14 AD',
        status: 'stable',
        confidence_score: 0.92,
    },
    {
        id: 'AL-301-F',
        title: 'Silk Road Tapestry',
        classification: 'Textile',
        material: 'Fabric',
        era: '200-400 AD',
        status: 'pending',
        confidence_score: 0.16,
    },
];

export default function ArchivePage() {
    const [artifacts, setArtifacts] = useState<Artifact[]>(MOCK_ARCHIVE);
    const [filter, setFilter] = useState('All');

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleArea}>
                    <h1 className={styles.title}>Digital Archive</h1>
                    <p className={styles.subtitle}>Complete repository of all analyzed archaeological specimens.</p>
                </div>

                <div className={styles.actions}>
                    <div className={styles.searchBox}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input type="text" placeholder="Search archive..." className={styles.searchInput} />
                    </div>
                    <Button variant="outline">Filter Repository</Button>
                    <Button variant="primary">Export Archive</Button>
                </div>
            </header>

            <div className={styles.filtersBar}>
                <button className={`${styles.filterTab} ${filter === 'All' ? styles.active : ''}`} onClick={() => setFilter('All')}>All Specimens</button>
                <button className={`${styles.filterTab} ${filter === 'Recent' ? styles.active : ''}`} onClick={() => setFilter('Recent')}>Recently Added</button>
                <button className={`${styles.filterTab} ${filter === 'Flagged' ? styles.active : ''}`} onClick={() => setFilter('Flagged')}>Flagged for Review</button>
                <button className={`${styles.filterTab} ${filter === 'Verified' ? styles.active : ''}`} onClick={() => setFilter('Verified')}>Verified Data</button>
            </div>

            <div className={styles.grid}>
                {artifacts.map((artifact) => (
                    <ArtifactCard
                        key={artifact.id}
                        id={artifact.id}
                        title={artifact.title}
                        classification={artifact.classification}
                        era={artifact.era}
                        material={artifact.material}
                        status={artifact.status}
                        digitized={Math.round(artifact.confidence_score * 100)}
                    />
                ))}
            </div>

            <footer className={styles.footer}>
                <span className={styles.totalLabel}>TOTAL RECORDS: {artifacts.length}</span>
                <div className={styles.pagination}>
                    <Button variant="ghost" size="sm" disabled>Previous</Button>
                    <span className={styles.pageNumber}>Page 1 of 1</span>
                    <Button variant="ghost" size="sm" disabled>Next</Button>
                </div>
            </footer>
        </div>
    );
}
