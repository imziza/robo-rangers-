// OpenRouter AI integration for artifact analysis
// Uses DeepSeek model for archaeological analysis

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.OPENROUTER_MODEL || 'tngtech/deepseek-r1t2-chimera:free';

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
    images: string[]; // Base64 encoded images
    excavationNotes?: string;
    location?: {
        latitude: number;
        longitude: number;
    };
}

const ARCHAEOLOGICAL_SYSTEM_PROMPT = `You are an expert archaeological analyst with deep knowledge of ancient civilizations, materials science, art history, and cultural anthropology. Your role is to analyze artifact images and provide scholarly, museum-grade analysis.

You must analyze artifacts across these dimensions:
1. Material detection and composition analysis
2. Shape and functional interpretation
3. Tool/crafting method detection
4. Symbol and inscription recognition
5. Pattern recognition and decorative analysis
6. Cultural classification
7. Historical placement estimation
8. Geographic-historical reasoning
9. Hypothesis generation

Your output must be structured, formal, and academic in tone. Provide confidence levels for your assessments.`;

export async function analyzeArtifact(input: AnalysisInput): Promise<AIReport> {
    if (!OPENROUTER_API_KEY) {
        throw new Error('OpenRouter API key not configured');
    }

    const userPrompt = buildAnalysisPrompt(input);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://aletheon.app',
            'X-Title': 'Aletheon Archaeological Analysis'
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: 'system', content: ARCHAEOLOGICAL_SYSTEM_PROMPT },
                { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3, // Lower temperature for more consistent scholarly output
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`AI analysis failed: ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
        throw new Error('No analysis content received from AI');
    }

    try {
        const report = JSON.parse(content) as AIReport;
        return validateAndNormalizeReport(report);
    } catch {
        // If JSON parsing fails, attempt to extract structured data
        return parseUnstructuredResponse(content);
    }
}

function buildAnalysisPrompt(input: AnalysisInput): string {
    let prompt = `Analyze the following archaeological artifact and provide a structured academic report.

Please respond with a JSON object containing these exact fields:
{
  "title": "Descriptive title for the artifact",
  "classification": "Archaeological classification (e.g., 'Ceremonial Object', 'Tool', 'Ornament')",
  "visualDescription": "Detailed visual description of the artifact",
  "materialAnalysis": "Analysis of materials, composition, and manufacturing techniques",
  "structuralInterpretation": "Structural and functional interpretation",
  "symbolism": "Analysis of any symbols, iconography, or decorative elements",
  "culturalContext": "Cultural and historical context assessment",
  "geographicSignificance": "Geographic and regional significance",
  "originHypothesis": "Hypothesis about origin, usage, and historical significance",
  "comparativeAnalysis": "Comparison with known artifacts from similar periods/regions",
  "confidenceScore": 0.85 (number between 0 and 1)
}`;

    if (input.excavationNotes) {
        prompt += `\n\nExcavation Notes: ${input.excavationNotes}`;
    }

    if (input.location) {
        prompt += `\n\nDiscovery Location: Latitude ${input.location.latitude}, Longitude ${input.location.longitude}`;
    }

    prompt += '\n\nProvide scholarly, museum-grade analysis with formal academic tone.';

    return prompt;
}

function validateAndNormalizeReport(report: Partial<AIReport>): AIReport {
    return {
        title: report.title || 'Unidentified Artifact',
        classification: report.classification || 'Pending Classification',
        visualDescription: report.visualDescription || 'Visual analysis pending',
        materialAnalysis: report.materialAnalysis || 'Material analysis pending',
        structuralInterpretation: report.structuralInterpretation || 'Structural analysis pending',
        symbolism: report.symbolism || 'No symbols or iconography detected',
        culturalContext: report.culturalContext || 'Cultural context under investigation',
        geographicSignificance: report.geographicSignificance || 'Geographic analysis pending',
        originHypothesis: report.originHypothesis || 'Origin hypothesis under development',
        comparativeAnalysis: report.comparativeAnalysis || 'Comparative analysis pending',
        confidenceScore: typeof report.confidenceScore === 'number'
            ? Math.min(1, Math.max(0, report.confidenceScore))
            : 0.5
    };
}

function parseUnstructuredResponse(content: string): AIReport {
    // Fallback parser for unstructured responses
    return {
        title: extractSection(content, 'title') || 'Archaeological Specimen',
        classification: extractSection(content, 'classification') || 'Under Investigation',
        visualDescription: extractSection(content, 'description') || content.slice(0, 500),
        materialAnalysis: extractSection(content, 'material') || 'Analysis required',
        structuralInterpretation: extractSection(content, 'structural') || 'Analysis required',
        symbolism: extractSection(content, 'symbol') || 'No symbols detected',
        culturalContext: extractSection(content, 'cultural') || 'Context under review',
        geographicSignificance: extractSection(content, 'geographic') || 'Location analysis pending',
        originHypothesis: extractSection(content, 'origin') || 'Hypothesis pending',
        comparativeAnalysis: extractSection(content, 'comparative') || 'Comparison pending',
        confidenceScore: 0.5
    };
}

function extractSection(content: string, keyword: string): string | null {
    const regex = new RegExp(`${keyword}[:\\s]+([^\\n]+)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : null;
}

// Vision analysis for image content
export async function analyzeWithVision(imageBase64: string): Promise<string> {
    if (!OPENROUTER_API_KEY) {
        throw new Error('OpenRouter API key not configured');
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://aletheon.app',
            'X-Title': 'Aletheon Vision Analysis'
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'Describe this archaeological artifact in detail. Focus on: material composition, crafting techniques, decorative elements, symbols, condition, and any identifying features.'
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:image/jpeg;base64,${imageBase64}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 1000
        })
    });

    if (!response.ok) {
        throw new Error('Vision analysis failed');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
}
