import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { analyzeArtifact, analyzeWithVision } from '@/lib/ai';
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
        const visionDescription = await analyzeWithVision(images[0]);
        const report = await analyzeArtifact({ images, excavationNotes: notes, location });
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
                description: report.visualDescription + '\n\n' + visionDescription,
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
        for (let i = 0; i < images.length; i++) {
            const base64Data = images[i];
            const buffer = Buffer.from(base64Data, 'base64');
            const fileName = `${artifact.id}/${i}.jpg`;
            const { error: uploadError } = await supabaseAdmin.storage.from('artifacts').upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true });
            if (uploadError) continue;
            const { data: { publicUrl } } = supabaseAdmin.storage.from('artifacts').getPublicUrl(fileName);
            imageUrls.push(publicUrl);
            await supabaseAdmin.from('artifact_images').insert({ artifact_id: artifact.id, image_url: publicUrl, is_primary: i === 0 });
        }
        return NextResponse.json({ success: true, artifactId: artifact.id, report: { ...report, image_url: imageUrls[0] } });
    } catch (error: any) {
        return NextResponse.json({ error: 'Analysis Protocol Failed', details: error.message }, { status: 500 });
    }
}
