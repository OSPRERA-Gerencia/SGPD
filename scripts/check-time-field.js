const https = require('https');

const email = 'tobitraverso@gmail.com';
const apiToken = 'ATATT3xFfGF0gzGM2eOIIE97oNgmnZW4PLv_gYRgdVlJRztfhrO9J8hATGE94YuYHcH_DDhIbbuiNOVClMAxJd5I86eB9Tb1YsL5N5tc3uf1iv9o9jubSCPmsWVbpcsq0EMbTxB8jBpk8jSmzVhiufO1Eg37di0ZfOOGbL-gCslnlIGTkXIodd0=F245535F';
const domain = 'o-d.atlassian.net';

const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

const options = {
  hostname: domain,
  path: `/rest/api/3/search/jql?jql=project=OD&maxResults=1`,
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
        const json = JSON.parse(data);
        if (json.issues && json.issues.length > 0) {
          const issue = json.issues[0];
          console.log('Issue Key:', issue.key);
          console.log('\n=== customfield_10037 (Time) Value ===');
          const timeValue = issue.fields.customfield_10037;
          console.log(JSON.stringify(timeValue, null, 2));
        } else {
          console.log('No issues found in project OD');
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
