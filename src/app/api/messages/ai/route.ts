import { NextRequest } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.OPENROUTER_MODEL || 'tngtech/deepseek-r1t2-chimera:free';

export async function POST(req: NextRequest) {
    if (!OPENROUTER_API_KEY) return new Response('AI Configuration Missing', { status: 500 });
    try {
        const { message } = await req.json();
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://aletheon.app',
                'X-Title': 'Aletheon AI Assistant'
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'system', content: 'You are ALE (Archaeological Logical Engine), an AI scholarly assistant. Wrap reasoning in <think></think> tags.' },
                    { role: 'user', content: message }
                ],
                stream: true,
            })
        });
        if (!response.ok) throw new Error('OpenRouter API failure');
        return new Response(response.body, {
            headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
