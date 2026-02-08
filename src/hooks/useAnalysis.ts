'use client';

import { useState, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';

export const SCAN_PHASES = [
    'Initializing Sensors',
    'Mapping Signature',
    'Identifying Material',
    'Cross-Referencing',
    'Generating Hypothesis',
    'Finalizing Report'
];

export interface AnalysisResult {
    artifactId: string;
    report: any;
}

export function useAnalysis() {
    const supabase = createSupabaseBrowserClient();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentPhase, setCurrentPhase] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const startAnalysis = useCallback(async (images: any[], notes: string, location: any) => {
        if (images.length === 0) return;

        setIsAnalyzing(true);
        setProgress(0);
        setCurrentPhase(0);
        setError(null);

        // Deterministic progress tracking
        const startTime = Date.now();
        const duration = 12000; // 12 seconds total for cinematic feel

        const progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newProgress = Math.min(98, (elapsed / duration) * 100);
            setProgress(newProgress);

            const phaseIndex = Math.min(
                Math.floor((newProgress / 100) * SCAN_PHASES.length),
                SCAN_PHASES.length - 1
            );
            setCurrentPhase(phaseIndex);
        }, 100);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            const imageBase64s = await Promise.all(
                images.map(img => new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve((reader.result as string).split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(img.file);
                }))
            );

            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    images: imageBase64s,
                    notes,
                    location,
                    userId: user?.id
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.details || result.error || 'Analysis failed');
            }

            // Persistence Protocol
            localStorage.setItem(`report_${result.artifactId}`, JSON.stringify(result.report));

            const artifactData = {
                id: result.artifactId,
                title: result.report.title,
                classification: result.report.classification,
                material: result.report.materialAnalysis,
                era: result.report.culturalContext,
                status: 'stable',
                confidence_score: result.report.confidenceScore,
                image_url: result.report.image_url,
                created_at: new Date().toISOString()
            };

            const catalog = JSON.parse(localStorage.getItem('vault_catalog') || '[]');
            localStorage.setItem('vault_catalog', JSON.stringify([artifactData, ...catalog]));

            clearInterval(progressInterval);
            setProgress(100);
            setCurrentPhase(SCAN_PHASES.length - 1);

            return result as AnalysisResult;
        } catch (err: any) {
            clearInterval(progressInterval);
            setError(err.message);
            setIsAnalyzing(false);
            throw err;
        }
    }, [supabase]);

    return {
        isAnalyzing,
        progress,
        currentPhase,
        error,
        startAnalysis,
        phases: SCAN_PHASES
    };
}
