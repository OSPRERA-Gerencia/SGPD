const https = require('https');

// SECURITY: Use environment variables instead of hardcoded credentials
// Run with: JIRA_EMAIL=your@email.com JIRA_API_TOKEN=your-token node get-field-ids.js
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
        console.log('=== STORY POINTS FIELD ===');
        const storyPoints = fields.find(f => f.name && (f.name.toLowerCase().includes('story points') || f.name.toLowerCase().includes('story point')));
        if (storyPoints) {
          console.log(`ID: ${storyPoints.id}`);
          console.log(`Name: ${storyPoints.name}`);
          console.log(`Type: ${storyPoints.schema?.type || 'N/A'}`);
        } else {
          console.log('No se encontró el campo Story Points');
        }

        console.log('\n=== TIME FIELD ===');
        const time = fields.find(f => f.name && (f.name.toLowerCase().includes('time') || f.name.toLowerCase().includes('tiempo')));
        if (time) {
          console.log(`ID: ${time.id}`);
          console.log(`Name: ${time.name}`);
          console.log(`Type: ${time.schema?.type || 'N/A'}`);
          console.log(`Custom: ${time.schema?.custom || 'N/A'}`);
        } else {
          console.log('No se encontró el campo Time');
        }
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
