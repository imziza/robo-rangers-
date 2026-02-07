'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Filter, Download, Archive as ArchiveIcon, LayoutGrid, List, X } from 'lucide-react';
import { ArtifactCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
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
    artifact_images?: { image_url: string; is_primary: boolean }[];
}

function ArchiveContent() {
    const searchParams = useSearchParams();
    const teamId = searchParams.get('teamId');
    const supabase = createSupabaseBrowserClient();
    const { showToast } = useToast();

    const [artifacts, setArtifacts] = useState<Artifact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [advancedFilters, setAdvancedFilters] = useState({
        material: 'All',
        era: 'All',
        classification: 'All'
    });

    useEffect(() => {
        const loadArtifacts = async () => {
            setIsLoading(true);
            try {
                let query = supabase
                    .from('artifacts')
                    .select('*, artifact_images(image_url, is_primary)');

                if (teamId) {
                    const { data: members } = await supabase
                        .from('group_members')
                        .select('user_id')
                        .eq('group_id', teamId);

                    if (members && members.length > 0) {
                        const memberIds = members.map(m => m.user_id);
                        query = query.in('user_id', memberIds);
                    } else {
                        setArtifacts([]);
                        setIsLoading(false);
                        return;
                    }
                }

                const { data, error } = await query.order('created_at', { ascending: false }).limit(100);

                if (error) throw error;
                setArtifacts(data || []);
            } catch (error: any) {
                console.error('Archive retrieval protocol failure:', error);
                showToast(`Sync Error: ${error.message}`, 'error');
            } finally {
                setIsLoading(false);
            }
        };

        loadArtifacts();
    }, [supabase, teamId, showToast]);

    const filteredArtifacts = artifacts.filter(art => {
        const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            art.classification?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            art.id.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (filter === 'Recent') {
            const fiveDaysAgo = new Date();
            fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
            return new Date(art.created_at) > fiveDaysAgo;
        }
        if (filter === 'Flagged') return art.status === 'critical';
        if (filter === 'Verified') return (art.confidence_score || 0) > 0.9;

        if (advancedFilters.material !== 'All' && art.material !== advancedFilters.material) return false;
        if (advancedFilters.era !== 'All' && art.era !== advancedFilters.era) return false;
        if (advancedFilters.classification !== 'All' && art.classification !== advancedFilters.classification) return false;

        return true;
    });

    const materials = ['All', ...Array.from(new Set(artifacts.map(a => a.material).filter(Boolean)))];
    const eras = ['All', ...Array.from(new Set(artifacts.map(a => a.era).filter(Boolean)))];
    const classifications = ['All', ...Array.from(new Set(artifacts.map(a => a.classification).filter(Boolean)))];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleArea}>
                    <h1 className={styles.title}>
                        {teamId ? 'Team Repository' : 'Digital Archive'}
                    </h1>
                    <p className={styles.subtitle}>
                        {teamId ? 'Displaying collective findings for the selected research group.' : 'Complete repository of all analyzed archaeological specimens.'}
                    </p>
                </div>

                <div className={styles.actions}>
                    <div className={styles.viewToggles}>
                        <button
                            className={`${styles.viewToggle} ${viewMode === 'grid' ? styles.active : ''}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            className={`${styles.viewToggle} ${viewMode === 'table' ? styles.active : ''}`}
                            onClick={() => setViewMode('table')}
                        >
                            <List size={16} />
                        </button>
                    </div>
                    <div className={styles.searchBox}>
                        <Search size={18} strokeWidth={2} />
                        <input
                            type="text"
                            placeholder="Search archive..."
                            className={styles.searchInput}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button
                        variant={showAdvancedFilters ? "primary" : "outline"}
                        leftIcon={<Filter size={16} />}
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    >
                        Filter Repository
                    </Button>
                    <Button
                        variant="primary"
                        leftIcon={<Download size={16} />}
                        onClick={() => {
                            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredArtifacts));
                            const downloadAnchorNode = document.createElement('a');
                            downloadAnchorNode.setAttribute("href",     dataStr);
                            downloadAnchorNode.setAttribute("download", "aletheon_archive_export.json");
                            document.body.appendChild(downloadAnchorNode);
                            downloadAnchorNode.click();
                            downloadAnchorNode.remove();
                            showToast('Archive records exported successfully.', 'success');
                        }}
                    >
                        Export Archive
                    </Button>
                </div>
            </header>

            {showAdvancedFilters && (
                <div className={styles.advancedFiltersPanel}>
                    <div className={styles.advancedFiltersHeader}>
                        <h3 className={styles.advancedFiltersTitle}>Advanced Archival Search</h3>
                        <button onClick={() => setShowAdvancedFilters(false)} className={styles.closeFilters}>
                            <X size={16} />
                        </button>
                    </div>
                    <div className={styles.advancedFiltersGrid}>
                        <Select
                            label="Material"
                            options={materials.map(m => ({ value: m!, label: m! }))}
                            value={advancedFilters.material}
                            onChange={(e) => setAdvancedFilters({...advancedFilters, material: e.target.value})}
                        />
                        <Select
                            label="Era / Period"
                            options={eras.map(e => ({ value: e!, label: e! }))}
                            value={advancedFilters.era}
                            onChange={(e) => setAdvancedFilters({...advancedFilters, era: e.target.value})}
                        />
                        <Select
                            label="Classification"
                            options={classifications.map(c => ({ value: c!, label: c! }))}
                            value={advancedFilters.classification}
                            onChange={(e) => setAdvancedFilters({...advancedFilters, classification: e.target.value})}
                        />
                    </div>
                </div>
            )}

            <div className={styles.filtersBar}>
                <button className={`${styles.filterTab} ${filter === 'All' ? styles.active : ''}`} onClick={() => setFilter('All')}>All Specimens</button>
                <button className={`${styles.filterTab} ${filter === 'Recent' ? styles.active : ''}`} onClick={() => setFilter('Recent')}>Recently Added</button>
                <button className={`${styles.filterTab} ${filter === 'Flagged' ? styles.active : ''}`} onClick={() => setFilter('Flagged')}>Flagged for Review</button>
                <button className={`${styles.filterTab} ${filter === 'Verified' ? styles.active : ''}`} onClick={() => setFilter('Verified')}>Verified Data</button>
            </div>

            {isLoading ? (
                <div className={styles.grid}>
                    {Array(6).fill(0).map((_, i) => (
                        <SkeletonCard key={i} height="320px" />
                    ))}
                </div>
            ) : viewMode === 'grid' ? (
                <div className={styles.grid}>
                    {filteredArtifacts.map((artifact) => (
                        <ArtifactCard
                            key={artifact.id}
                            id={artifact.id}
                            title={artifact.title}
                            classification={artifact.classification || 'Unclassified'}
                            era={artifact.era || 'Unknown'}
                            material={artifact.material || 'Mixed'}
                            status={artifact.status}
                            digitized={Math.round((artifact.confidence_score || 0) * 100)}
                            imageUrl={artifact.artifact_images?.find(img => img.is_primary)?.image_url}
                        />
                    ))}
                    {filteredArtifacts.length === 0 && (
                        <div className={styles.emptyState}>
                            <ArchiveIcon size={48} strokeWidth={0.5} />
                            <h3>No specimens found</h3>
                            <p>Try adjusting your search or filters.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className={styles.tableView}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Specimen Title</th>
                                <th>Classification</th>
                                <th>Material</th>
                                <th>Era</th>
                                <th>Confidence</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredArtifacts.map(art => (
                                <tr key={art.id} onClick={() => window.location.href = `/report/${art.id}`}>
                                    <td className={styles.mono}>{art.id.slice(0, 8)}</td>
                                    <td>{art.title}</td>
                                    <td>{art.classification}</td>
                                    <td>{art.material}</td>
                                    <td>{art.era}</td>
                                    <td>
                                        <div className={styles.confCell}>
                                            <div className={styles.confBar}>
                                                <div
                                                    className={styles.confFill}
                                                    style={{ width: `${Math.round((art.confidence_score || 0) * 100)}%` }}
                                                />
                                            </div>
                                            {Math.round((art.confidence_score || 0) * 100)}%
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${styles[art.status]}`}>
                                            {art.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <footer className={styles.footer}>
                <span className={styles.totalLabel}>TOTAL RECORDS: {filteredArtifacts.length}</span>
                <div className={styles.pagination}>
                    <Button variant="ghost" size="sm" disabled>Previous</Button>
                    <span className={styles.pageNumber}>Page 1 of 1</span>
                    <Button variant="ghost" size="sm" disabled>Next</Button>
                </div>
            </footer>
        </div>
    );
}

export default function ArchivePage() {
    return (
        <Suspense fallback={
            <div className={styles.container}>
                <div className={styles.grid}>
                    {Array(6).fill(0).map((_, i) => (
                        <SkeletonCard key={i} height="320px" />
                    ))}
                </div>
            </div>
        }>
            <ArchiveContent />
        </Suspense>
    );
}
