const https = require('https');

// SECURITY: Use environment variables instead of hardcoded credentials
// Run with: JIRA_EMAIL=your@email.com JIRA_API_TOKEN=your-token node get-time-options.js
const email = process.env.JIRA_EMAIL || '';
const apiToken = process.env.JIRA_API_TOKEN || '';
const domain = process.env.JIRA_DOMAIN || 'o-d.atlassian.net';

const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

const options = {
  hostname: domain,
  path: `/rest/api/3/field/customfield_10037/option`,
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
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        const json = JSON.parse(data);
        console.log('=== Time Field Options ===');
        console.log(JSON.stringify(json, null, 2));
      } catch (e) {
        console.error('Error parsing JSON:', e);
      }
    } else {
      console.log('Response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

req.end();
