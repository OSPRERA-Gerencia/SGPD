const https = require('https');

const email = 'tobitraverso@gmail.com';
const apiToken = 'ATATT3xFfGF09DyVXlMqQ5iX2Y5Jxjrudgg8i5N_hZag1F7K2q-37A8nntYLVeKefjsXOlwByjoHJHz8Vi9_ma-6-QeHnM1ud5xtIT9sHaXHzMNE9lRr66Q54Qh8lVanAkjsgZ2bQOcQjY9EY7FGWbCGQOovHxst_R-rW1QM1zVXSOCp4rAnhrE=534848A0';
const domain = 'o-d.atlassian.net';

const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

const options = {
  hostname: domain,
  path: `/rest/api/3/issue/createmeta?expand=projects.issuetypes.fields`,
  method: 'GET',
  headers: {
    'Authorization': `Basic ${auth}`,
    'Accept': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        const json = JSON.parse(data);
        // console.log('Raw JSON:', JSON.stringify(json, null, 2));
        if (json.projects) {
          console.log('Projects found:', json.projects.map(p => `${p.name} (${p.key})`).join(', '));
          const project = json.projects.find(p => p.key === 'OD');
          if (project) {
            console.log(`\nAnalyzing Project: ${project.name} (${project.key})`);
            const issueType = project.issuetypes.find(it => it.name === 'Task' || it.name === 'Story' || it.name === 'Tarea');
            if (issueType) {
              console.log(`Issue Type: ${issueType.name}`);
              console.log('--- Fields ---');
              Object.values(issueType.fields).forEach(field => {
                if (field.name.includes('Story Points') || field.name.includes('Time') || field.name.includes('Tiempo')) {
                  console.log(`${field.name} (ID: ${field.key})`);
                  if (field.allowedValues) {
                    console.log(`  Allowed Values: ${field.allowedValues.map(v => `${v.value} (ID: ${v.id})`).join(', ')}`);
                  }
                }
              });
            } else {
              console.log('No Task/Story issue type found.');
              console.log('Available types:', project.issuetypes.map(it => it.name).join(', '));
            }
          } else {
            console.log('Project OD not found in the list of createable projects.');
          }
        }
      } catch (e) {
        console.error('Error parsing JSON:', e);
        console.log('Raw data:', data);
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
