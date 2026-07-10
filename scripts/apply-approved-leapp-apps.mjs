import fs from 'node:fs/promises';

const appsPath = new URL('../public/apps-core.json', import.meta.url);
const raw = await fs.readFile(appsPath, 'utf8');
const data = JSON.parse(raw);

if (!Object.prototype.hasOwnProperty.call(data.template, 'category')) {
  const nextTemplate = {};
  for (const [key, value] of Object.entries(data.template)) {
    nextTemplate[key] = value;
    if (key === 'isActiveOnPlayStore') nextTemplate.category = '';
  }
  data.template = nextTemplate;
}

const