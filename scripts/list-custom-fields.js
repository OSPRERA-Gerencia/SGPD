const https = require('https');

const email = 'tobitraverso@gmail.com';
const apiToken = 'ATATT3xFfGF0gzGM2eOIIE97oNgmnZW4PLv_gYRgdVlJRztfhrO9J8hATGE94YuYHcH_DDhIbbuiNOVClMAxJd5I86eB9Tb1YsL5N5tc3uf1iv9o9jubSCPmsWVbpcsq0EMbTxB8jBpk8jSmzVhiufO1Eg37di0ZfOOGbL-gCslnlIGTkXIodd0=F245535F';
const domain = 'o-d.atlassian.net';

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
