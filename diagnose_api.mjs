import fs from 'fs';

// Manual .env.local parsing
const envContent = fs.readFileSync('.env.local', 'utf8');
const keyMatch = envContent.match(/OPENROUTER_API_KEY\s*=\s*([^\s#]+)/);
const modelMatch = envContent.match(/OPENROUTER_MODEL\s*=\s*([^\s#]+)/);

const key = keyMatch ? keyMatch[1] : null;
const model = modelMatch ? modelMatch[1] : 'tngtech/deepseek-r1t2-chimera:free';

async function test() {
    console.log('Testing OpenRouter Connectivity...');
    console.log('Model:', model);
    console.log('Key (prefix):', key?.slice(0, 10) + '...');

    if (!key) {
        console.error('ERROR: OPENROUTER_API_KEY is not defined in .env.local');
        return;
    }

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://aletheon.app',
                'X-Title': 'Aletheon Diagnostics'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'user', content: 'Hello, are you operational?' }
                ]
            })
        });

        const data = await response.json();
        if (response.ok) {
            console.log('SUCCESS: API is operational.');
            console.log('Response:', data.choices?.[0]?.message?.content || 'No content returned');
        } else {
            console.error('FAILURE: API returned an error.');
            console.error('Status:', response.status);
            console.error('Error Body:', JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error('CRITICAL: Fetch failed.');
        console.error(err);
    }
}

test();

