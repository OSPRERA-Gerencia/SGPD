const https = require('https');

// SECURITY: Use environment variables instead of hardcoded credentials
// Run with: JIRA_EMAIL=your@email.com JIRA_API_TOKEN=your-token node check-myself.js
const email = process.env.JIRA_EMAIL || '';
const apiToken = process.env.JIRA_API_TOKEN || '';
const domain = process.env.JIRA_DOMAIN || 'o-d.atlassian.net';

const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

const options = {
  hostname: domain,
  path: `/rest/api/3/myself`,
  method: 'GET',
  headers: {
    'Authorization': `Basic ${auth}`,
    'Accept': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log('Body:', data);
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

req.end();
