// VersionInfo.js
import React, { useState, useEffect } from 'react';

function VersionInfo() {
  const [buildDate, setBuildDate] = useState('');
  const [dataDate, setDataDate] = useState('')
  const isDevMode = process.env.NODE_ENV === 'development';

  useEffect(() => {
    fetch('/version.json')
      .then(response => response.json())
      .then(data => {
        setBuildDate(data.buildDate);
        setDataDate(data.dataDate);
      });
  }, []);

  return (
    <div style={{fontSize: '12px', marginRight: '5px'}}>
      {/*isDevMode ? `Development Mode | Build: ${buildDate}` : `Build: ${buildDate}`*/}
      {isDevMode && <div>Development Mode</div>}
      <div>Build: {buildDate}</div>
      <div>Data: {dataDate}</div>
    </div>
  );
}

export default VersionInfo;
