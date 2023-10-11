// VersionInfo.js
import React, { useState, useEffect } from 'react';

function VersionInfo() {
  const [buildDate, setBuildDate] = useState('');
  const isDevMode = process.env.NODE_ENV === 'development';

  useEffect(() => {
    fetch('/version.json')
      .then(response => response.json())
      .then(data => setBuildDate(data.buildDate));
  }, []);

  return (
    <div style={{fontSize: '12px', marginRight: '5px'}}>
      {isDevMode ? `Development Mode | Build: ${buildDate}` : `Build: ${buildDate}`}
    </div>
  );
}

export default VersionInfo;
