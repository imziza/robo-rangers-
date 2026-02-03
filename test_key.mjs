import fs from 'fs';
import https from 'https';

const envContent = fs.readFileSync('.env.local', 'utf8');
const keyMatch = envContent.match(/OPENROUTER_API_KEY\s*=\s*([^\s\r\n#]+)/);
const key = keyMatch ? keyMatch[1] : null;

let log = '=== OPENROUTER DIAGNOSTIC ===\n';
log += `Time: ${new Date().toISOString()}\n`;
log += `Key found: ${!!key}\n`;
log += `Key prefix: ${key?.slice(0, 15)}\n\n`;

const postData = JSON.stringify({
    model: 'tngtech/deepseek-r1t2-chimera:free',
    messages: [{ role: 'user', content: 'Hello' }]
});

const options = {
    hostname: 'openrouter.ai',
    port: 443,
    path: '/api/v1/chat/completions',
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'HTTP-Referer': 'https://aletheon.app'
    }
};

log += 'Attempting HTTPS request to OpenRouter...\n';

const req = https.request(options, (res) => {
    log += `Status Code: ${res.statusCode}\n`;

    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
        log += `Response Body:\n${body.slice(0, 2000)}\n`;
        fs.writeFileSync('diagnostic_output.txt', log);
    });
});

req.on('error', (e) => {
    log += `REQUEST ERROR: ${e.message}\n`;
    log += `Error Code: ${e.code}\n`;
    log += `Full Error: ${JSON.stringify(e, null, 2)}\n`;
    fs.writeFileSync('diagnostic_output.txt', log);
});

req.write(postData);
req.end();
