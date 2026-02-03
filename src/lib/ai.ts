/**
 * @file src/lib/ai.ts
 * @description Production-grade Archaeological Analysis Engine
 * SERVER-SIDE ONLY. Do not import in client components.
 */

// --- CONFIGURATION ---
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const PRIMARY_MODEL = process.env.OPENROUTER_MODEL || 'google/gemma-3-27b-it:free';
const FALLBACK_MODEL = 'nvidia/nemotron-nano-12b-v2-vl:free';
const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 1000;

// --- INTERFACES ---
export interface AIReport {
    title: string;
    classification: string;
    visualDescription: string;
    materialAnalysis: string;
    structuralInterpretation: string;
    symbolism: string;
    culturalContext: string;
    geographicSignificance: string;
    originHypothesis: string;
    comparativeAnalysis: string;
    confidenceScore: number;
}

export interface AnalysisInput {
    images: string[];
    excavationNotes?: string;
    location?: {
        latitude: number;
        longitude: number;
    };
}

// --- UTILITIES ---

function getMimeType(base64: string): string {
    const firstChar = base64.charAt(0);
    if (firstChar === '/') return 'image/jpeg';
    if (firstChar === 'i') return 'image/png';
    if (firstChar === 'R') return 'image/gif';
    if (firstChar === 'U') return 'image/webp';
    return 'image/jpeg';
}

function computeConfidence(report: Partial<AIReport>): number {
    const fields: (keyof AIReport)[] = [
        'materialAnalysis', 'culturalContext', 'symbolism',
        'structuralInterpretation', 'geographicSignificance'
    ];
    let score = 0.4;
    fields.forEach(f => {
        const val = report[f];
        if (typeof val === 'string' && val.length > 100) score += 0.1;
        else if (typeof val === 'string' && val.length > 30) score += 0.05;
    });
    return Math.min(0.98, score);
}

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
    try {
        const response = await fetch(url, options);
        if (response.ok) return response;

        if ((response.status === 429 || response.status >= 500) && retries > 0) {
            const delay = INITIAL_BACKOFF * Math.pow(2, MAX_RETRIES - retries);
            console.log(`[AI_RETRY] Status ${response.status}. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(url, options, retries - 1);
        }
        return response;
    } catch (error) {
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, INITIAL_BACKOFF));
            return fetchWithRetry(url, options, retries - 1);
        }
        throw error;
    }
}

function robustParseJSON(content: string): any {
    let cleaned = content.trim();

    // Extract JSON block if wrapped in markdown
    const jsonMatch = cleaned.match(/```json\n?([\s\S]*?)\n?```/) || cleaned.match(/```\n?([\s\S]*?)\n?```/);
    if (jsonMatch) cleaned = jsonMatch[1].trim();

    // Try to find JSON object in text
    const objectMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objectMatch) cleaned = objectMatch[0];

    try {
        return JSON.parse(cleaned);
    } catch (e) {
        console.warn('[AI_PARSE_WARNING] Standard JSON parse failed, attempting recovery...');
        const recovered = cleaned
            .replace(/\n/g, ' ')
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']')
            .replace(/'/g, '"');
        return JSON.parse(recovered);
    }
}

const ANALYSIS_PROMPT = `You are a world-class archaeological analysis engine. Analyze the provided image(s) of a digital specimen and return a detailed report in JSON format.
The report MUST include:
{
  "title": "Evocative title",
  "classification": "Scientific classification",
  "visualDescription": "Detailed visual analysis",
  "materialAnalysis": "Probable material composition",
  "structuralInterpretation": "How it was built or formed",
  "symbolism": "Iconographic or symbolic meaning",
  "culturalContext": "Likely cultural origin",
  "geographicSignificance": "Where it might have been found",
  "originHypothesis": "Theory of how it arrived here",
  "comparativeAnalysis": "Similar known artifacts",
  "confidenceScore": 0.0-1.0
}`;

export async function analyzeArtifact(input: AnalysisInput): Promise<AIReport> {
    if (typeof window !== 'undefined') {
        throw new Error('AI Analysis Engine is server-only. Do not call from client.');
    }

    if (!OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY is not configured in environment.');
    }

    const prompt = ANALYSIS_PROMPT + (input.excavationNotes ? `\n\nAdditional Field Notes: ${input.excavationNotes}` : "") +
        (input.location ? `\n\nCoordinates: ${input.location.latitude}, ${input.location.longitude}` : "");

    return await executeAnalysis(prompt, input.images);
}

async function executeAnalysis(prompt: string, images: string[], useFallback = false): Promise<AIReport> {
    try {
        const modelToUse = useFallback ? FALLBACK_MODEL : PRIMARY_MODEL;
        console.log(`[AI_ATTEMPT] Using model: ${modelToUse}`);

        const response = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://aletheon.app',
                'X-Title': 'Aletheon Archaeological Core'
            },
            body: JSON.stringify({
                model: modelToUse,
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            ...images.map(img => ({
                                type: 'image_url',
                                image_url: { url: `data:${getMimeType(img)};base64,${img}` }
                            }))
                        ]
                    }
                ],
                temperature: 0.3
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`OpenRouter Error (${response.status}): ${errorData}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) throw new Error('AI returned empty response.');

        console.log(`[AI_SUCCESS] Analysis complete via ${modelToUse}. Tokens: ${data.usage?.total_tokens || 'unknown'}`);

        const rawReport = robustParseJSON(content);

        const report: AIReport = {
            title: rawReport.title || 'Unknown Specimen',
            classification: rawReport.classification || 'Unclassified',
            visualDescription: rawReport.visualDescription || 'No description provided.',
            materialAnalysis: rawReport.materialAnalysis || 'Pending laboratory analysis.',
            structuralInterpretation: rawReport.structuralInterpretation || 'Analysis in progress.',
            symbolism: rawReport.symbolism || 'No significant iconography detected.',
            culturalContext: rawReport.culturalContext || 'Origin under investigation.',
            geographicSignificance: rawReport.geographicSignificance || 'Regional data pending.',
            originHypothesis: rawReport.originHypothesis || 'Hypothesis formation incomplete.',
            comparativeAnalysis: rawReport.comparativeAnalysis || 'No direct parallels found.',
            confidenceScore: computeConfidence(rawReport)
        };

        return report;
    } catch (error: any) {
        if (!useFallback) {
            console.warn(`[AI_FALLBACK] Primary model failed (${error.message}). Attempting with ${FALLBACK_MODEL}...`);
            return executeAnalysis(prompt, images, true);
        }
        console.error('[AI_FATAL_ERROR]', error.message);
        throw error;
    }
}
