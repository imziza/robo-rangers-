import { NextRequest, NextResponse } from 'next/server';
import { searchSimilarArtifacts } from '@/lib/smithsonian';

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q') || 'archaeology';
    const material = searchParams.get('material');
    const culture = searchParams.get('culture');
    try {
        const results = await searchSimilarArtifacts({
            keywords: [query],
            material: material || undefined,
            culture: culture || undefined
        });
        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        return NextResponse.json({ error: 'Discovery Protocol Failed', details: error.message }, { status: 500 });
    }
}
