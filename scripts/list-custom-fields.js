const https = require('https');

// SECURITY: Use environment variables instead of hardcoded credentials
// Run with: JIRA_EMAIL=your@email.com JIRA_API_TOKEN=your-token node list-custom-fields.js
const email = process.env.JIRA_EMAIL || '';
const apiToken = process.env.JIRA_API_TOKEN || '';
const domain = process.env.JIRA_DOMAIN || 'o-d.atlassian.net';

const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

const options = {
  hostname: domain,
  path: `/rest/api/3/field`,
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
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        const fields = JSON.parse(data);
        console.log('=== ALL CUSTOM FIELDS ===');
        fields.filter(f => f.id.startsWith('customfield_')).forEach(f => {
          console.log(`ID: ${f.id} | Name: ${f.name} | Type: ${f.schema?.type || 'N/A'} | Custom: ${f.schema?.custom || 'N/A'}`);
        });
      } catch (e) {
        console.error('Error parsing JSON:', e);
      }
    } else {
      console.error(`Request failed with status code: ${res.statusCode}`);
      console.log('Response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

req.end();
