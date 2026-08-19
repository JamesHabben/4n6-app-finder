import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';

function PageAdmin() {
  const [selectedItem, setSelectedItem] = useState(null);

  const items = [
    { path: 'tools', name: 'Tools List' },
    { path: 'apps', name: 'Core Apps List' },
    { path: 'artifacts', name: 'Tools Artifacts List' },
  ];

  return (
    <div className="admin-page">
        <div style={{ display: 'flex', border: '1px solid #ccc', textAlign: 'left', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <div style={{ flex: '0 0 15%', padding: '1rem', borderRight: '1px solid #ccc', overflow: 'auto' }}>
                <h2>Pages</h2>
                <ul>
                    {items.map((item) => (
                        <li key={item.path}>
                            <Link to={`/admin/${item.path}`} onClick={() => setSelectedItem(item)}>{item.name}</Link>
                        </li>
                    ))}
                </ul>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, minHeight: 0, overflow: 'auto', padding: '1rem' }}>
                <Outlet />
            </div>
        </div>
    </div>
  );
}

export default PageAdmin;
