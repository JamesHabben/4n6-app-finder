// version.js
const fs = require('fs');
const path = './public/version-build.json';

function formatDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const versionInfo = {
  buildDate: formatDate(new Date()),
};

fs.writeFileSync(path, JSON.stringify(versionInfo, null, 2));
