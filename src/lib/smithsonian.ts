// Smithsonian Open Access API integration
// For finding similar artifacts in the Smithsonian collection

const SMITHSONIAN_API_KEY = process.env.SMITHSONIAN_API_KEY;
const SMITHSONIAN_BASE_URL = 'https://api.si.edu/openaccess/api/v1.0';

export interface SmithsonianArtifact {
    id: string;
    title: string;
    unitCode: string;
    type: string;
    url: string;
    content: {
        descriptiveNonRepeating: {
            title: { content: string };
            unit_code: string;
            record_link: string;
            online_media?: {
                media: Array<{
                    content: string;
                    thumbnail: string;
                    idsId: string;
                }>;
            };
        };
        freetext?: {
            physicalDescription?: Array<{ content: string }>;
            date?: Array<{ content: string }>;
            place?: Array<{ content: string }>;
            culture?: Array<{ content: string }>;
            objectType?: Array<{ content: string }>;
        };
        indexedStructured?: {
            date?: string[];
            place?: string[];
            culture?: string[];
            object_type?: string[];
            material?: string[];
        };
    };
}

export interface SearchResult {
    id: string;
    title: string;
    imageUrl: string | null;
    thumbnailUrl: string | null;
    era: string | null;
    region: string | null;
    culture: string | null;
    material: string | null;
    objectType: string | null;
    recordUrl: string;
    matchScore: number;
}

export interface SearchParams {
    material?: string;
    era?: string;
    region?: string;
    culture?: string;
    objectType?: string;
    keywords?: string[];
}

export async function searchSimilarArtifacts(params: SearchParams): Promise<SearchResult[]> {
    if (!SMITHSONIAN_API_KEY) {
        console.warn('Smithsonian API key not configured, returning mock data');
        return getMockResults();
    }

    try {
        // Build search query from parameters
        const queryParts: string[] = [];

        if (params.keywords?.length) {
            queryParts.push(params.keywords.join(' '));
        }
        if (params.material) {
            queryParts.push(`material:${params.material}`);
        }
        if (params.culture) {
            queryParts.push(`culture:${params.culture}`);
        }
        if (params.objectType) {
            queryParts.push(`object_type:${params.objectType}`);
        }
        if (params.region) {
            queryParts.push(`place:${params.region}`);
        }

        const query = queryParts.join(' AND ') || 'archaeology artifact';

        const searchUrl = new URL(`${SMITHSONIAN_BASE_URL}/search`);
        searchUrl.searchParams.set('api_key', SMITHSONIAN_API_KEY);
        searchUrl.searchParams.set('q', query);
        searchUrl.searchParams.set('rows', '20');
        searchUrl.searchParams.set('start', '0');

        const response = await fetch(searchUrl.toString());

        if (!response.ok) {
            throw new Error(`Smithsonian API error: ${response.status}`);
        }

        const data = await response.json();
        const rows = data.response?.rows || [];

        return rows.map((item: SmithsonianArtifact, index: number) =>
            transformToSearchResult(item, index, rows.length)
        );
    } catch (error) {
        console.error('Smithsonian search failed:', error);
        return getMockResults();
    }
}

function transformToSearchResult(
    item: SmithsonianArtifact,
    index: number,
    total: number
): SearchResult {
    const content = item.content;
    const descriptive = content?.descriptiveNonRepeating;
    const freetext = content?.freetext;
    const indexed = content?.indexedStructured;

    // Get media URLs
    let imageUrl: string | null = null;
    let thumbnailUrl: string | null = null;

    if (descriptive?.online_media?.media?.length) {
        const media = descriptive.online_media.media[0];
        imageUrl = media.content || null;
        thumbnailUrl = media.thumbnail || null;
    }

    return {
        id: item.id,
        title: descriptive?.title?.content || item.title || 'Untitled Artifact',
        imageUrl,
        thumbnailUrl,
        era: indexed?.date?.[0] || freetext?.date?.[0]?.content || null,
        region: indexed?.place?.[0] || freetext?.place?.[0]?.content || null,
        culture: indexed?.culture?.[0] || freetext?.culture?.[0]?.content || null,
        material: indexed?.material?.[0] || null,
        objectType: indexed?.object_type?.[0] || freetext?.objectType?.[0]?.content || null,
        recordUrl: descriptive?.record_link || `https://collections.si.edu/search/detail/${item.id}`,
        matchScore: calculateMatchScore(index, total)
    };
}

function calculateMatchScore(index: number, total: number): number {
    // Higher rank = higher score (1.0 to 0.5 range)
    return Math.round((1 - (index / total) * 0.5) * 100) / 100;
}

function getMockResults(): SearchResult[] {
    // Mock data for development/fallback
    return [
        {
            id: 'mock-1',
            title: 'Tutankhamun-Era Funerary Mask',
            imageUrl: null,
            thumbnailUrl: null,
            era: '1323 BCE',
            region: 'Egypt',
            culture: 'Ancient Egyptian',
            material: '22k Gold, Lapis Lazuli',
            objectType: 'Funerary Mask',
            recordUrl: '#',
            matchScore: 0.92
        },
        {
            id: 'mock-2',
            title: 'Mycenaean Terracotta Kylix',
            imageUrl: null,
            thumbnailUrl: null,
            era: '1400 BCE',
            region: 'Greece',
            culture: 'Mycenaean',
            material: 'Terracotta',
            objectType: 'Drinking Vessel',
            recordUrl: '#',
            matchScore: 0.85
        },
        {
            id: 'mock-3',
            title: 'Sumerian Ledger Tablet',
            imageUrl: null,
            thumbnailUrl: null,
            era: '2100 BCE',
            region: 'Mesopotamia',
            culture: 'Sumerian',
            material: 'Clay',
            objectType: 'Cuneiform Tablet',
            recordUrl: '#',
            matchScore: 0.78
        }
    ];
}

// Build search vector from AI analysis for finding similar artifacts
export function buildSearchParamsFromReport(report: {
    material?: string;
    era?: string;
    classification?: string;
    culturalContext?: string;
    geographicSignificance?: string;
}): SearchParams {
    const keywords: string[] = [];

    // Extract meaningful keywords from the report
    if (report.classification) {
        keywords.push(...extractKeywords(report.classification));
    }

    return {
        material: report.material,
        era: extractEra(report.era),
        region: extractRegion(report.geographicSignificance),
        culture: extractCulture(report.culturalContext),
        keywords
    };
}

function extractKeywords(text: string): string[] {
    // Extract significant archaeological terms
    const terms = text.toLowerCase().split(/\s+/);
    const significantTerms = terms.filter(term =>
        term.length > 4 &&
        !['about', 'these', 'their', 'which', 'would', 'could'].includes(term)
    );
    return significantTerms.slice(0, 5);
}

function extractEra(era?: string): string | undefined {
    if (!era) return undefined;
    // Normalize era formats
    const match = era.match(/(\d+)\s*(BCE|BC|CE|AD)/i);
    if (match) {
        return `${match[1]} ${match[2].toUpperCase()}`;
    }
    return era;
}

function extractRegion(text?: string): string | undefined {
    if (!text) return undefined;
    // Common archaeological regions
    const regions = ['Egypt', 'Greece', 'Rome', 'Mesopotamia', 'Persia', 'China', 'Maya', 'Aztec', 'Inca'];
    for (const region of regions) {
        if (text.toLowerCase().includes(region.toLowerCase())) {
            return region;
        }
    }
    return undefined;
}

function extractCulture(text?: string): string | undefined {
    if (!text) return undefined;
    // Common cultures
    const cultures = ['Egyptian', 'Greek', 'Roman', 'Sumerian', 'Babylonian', 'Persian', 'Celtic', 'Viking', 'Mayan'];
    for (const culture of cultures) {
        if (text.toLowerCase().includes(culture.toLowerCase())) {
            return culture;
        }
    }
    return undefined;
}
