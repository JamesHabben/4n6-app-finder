// VersionInfo.jsx
import React, { useState, useEffect } from 'react';

function VersionInfo() {
  const [buildDate, setBuildDate] = useState('');
  const isDevMode = import.meta.env.DEV;

  useEffect(() => {
    fetch('/version-build.json')
      .then(response => response.json())
      .then(data => {
        setBuildDate(data.buildDate);
      });
  }, []);

  return (
    <div style={{fontSize: '12px', marginRight: '5px'}}>
      {/*isDevMode ? `Development Mode | Build: ${buildDate}` : `Build: ${buildDate}`*/}
      {isDevMode && <div>Development Mode</div>}
      <div>Build: {buildDate}</div>
    </div>
  );
}

export default VersionInfo;
