import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { analyzeArtifact } from '@/lib/ai';
import { searchSimilarArtifacts, buildSearchParamsFromReport } from '@/lib/smithsonian';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { images, notes, location, userId } = body;
        if (!images || images.length === 0) return NextResponse.json({ error: 'No images provided' }, { status: 400 });

        // Single multimodal call to DeepSeek
        const report = await analyzeArtifact({
            images,
            excavationNotes: notes,
            location: location ? { latitude: location.lat, longitude: location.lng } : undefined
        });
        const searchParams = buildSearchParamsFromReport({
            material: report.materialAnalysis,
            era: report.culturalContext,
            classification: report.classification,
            culturalContext: report.culturalContext,
            geographicSignificance: report.geographicSignificance
        });
        const similarArtifacts = await searchSimilarArtifacts(searchParams);
        const { data: artifact, error: artifactError } = await supabaseAdmin
            .from('artifacts')
            .insert({
                user_id: userId || '00000000-0000-0000-0000-000000000000',
                title: report.title,
                classification: report.classification,
                description: report.visualDescription,
                material: report.materialAnalysis,
                era: report.culturalContext,
                region: report.geographicSignificance,
                latitude: location?.lat,
                longitude: location?.lng,
                excavation_notes: notes,
                ai_report: { ...report, similarArtifacts },
                confidence_score: report.confidenceScore,
                status: 'stable'
            })
            .select().single();
        if (artifactError) throw artifactError;
        const imageUrls = [];
        console.log(`[STORAGE_PREP] Processing ${images.length} images for artifact ${artifact.id}`);

        for (let i = 0; i < images.length; i++) {
            try {
                const base64Data = images[i];
                const buffer = Buffer.from(base64Data, 'base64');
                const fileName = `${artifact.id}/${i}.jpg`;

                console.log(`[STORAGE_UPLOAD] Attempting upload: ${fileName}`);
                const { error: uploadError } = await supabaseAdmin.storage
                    .from('artifacts')
                    .upload(fileName, buffer, {
                        contentType: 'image/jpeg',
                        upsert: true
                    });

                if (uploadError) {
                    console.error(`[STORAGE_ERROR] Upload failed for ${fileName}:`, uploadError.message);
                    continue;
                }

                const { data: { publicUrl } } = supabaseAdmin.storage
                    .from('artifacts')
                    .getPublicUrl(fileName);

                console.log(`[STORAGE_SUCCESS] Public URL generated: ${publicUrl}`);
                imageUrls.push(publicUrl);

                const { error: dbError } = await supabaseAdmin
                    .from('artifact_images')
                    .insert({
                        artifact_id: artifact.id,
                        image_url: publicUrl,
                        is_primary: i === 0
                    });

                if (dbError) {
                    console.error('[DATABASE_ERROR] Failed to link image to artifact:', dbError.message);
                } else {
                    console.log(`[DATABASE_SUCCESS] Image ${i} linked to artifact ${artifact.id}`);
                }
            } catch (err: any) {
                console.error(`[INTERNAL_IMAGE_ERROR] Unexpected error processing image ${i}:`, err.message);
            }
        }
        return NextResponse.json({
            success: true,
            artifactId: artifact.id,
            report: {
                ...report,
                image_url: imageUrls[0],
                image_urls: imageUrls
            }
        });
    } catch (error: any) {
        console.error('ANALYSIS_FAILURE_PROTOCOL:', error);
        return NextResponse.json({
            error: 'Analysis Protocol Failed',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
