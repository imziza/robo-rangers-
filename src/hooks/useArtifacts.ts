'use client';

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';

export interface Artifact {
    id: string;
    title: string;
    classification: string | null;
    material: string | null;
    era: string | null;
    status: 'stable' | 'critical' | 'pending';
    confidence_score: number | null;
    created_at: string;
    images?: { image_url: string; is_primary: boolean }[];
    artifact_images?: { image_url: string; is_primary: boolean }[];
}

export function useArtifacts() {
    const supabase = createSupabaseBrowserClient();
    const [artifacts, setArtifacts] = useState<Artifact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadArtifacts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, error: dbError } = await supabase
                .from('artifacts')
                .select('*, artifact_images (image_url, is_primary)')
                .order('created_at', { ascending: false });

            if (dbError) throw dbError;

            const dbArtifacts = (data || []).map(d => ({
                ...d,
                images: d.artifact_images || []
            }));

            // Sync with local storage for session parity
            const localCatalog = JSON.parse(localStorage.getItem('vault_catalog') || '[]');
            const localArtifacts = localCatalog
                .filter((la: Artifact) => !dbArtifacts.find(da => da.id === la.id))
                .map((la: any) => ({
                    ...la,
                    images: la.image_url ? [{ image_url: la.image_url, is_primary: true }] : (la.images || [])
                }));

            const combined = [...localArtifacts, ...dbArtifacts];
            setArtifacts(combined);
        } catch (err: any) {
            console.error('[useArtifacts] Protocol failure:', err);
            setError(err instanceof Error ? err : new Error(err.message || 'Unknown error'));
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        loadArtifacts();

        // Real-time listener
        const channel = supabase
            .channel('artifacts_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'artifacts' }, () => {
                loadArtifacts();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loadArtifacts, supabase]);

    const refresh = () => loadArtifacts();

    return { artifacts, isLoading, error, refresh };
}
