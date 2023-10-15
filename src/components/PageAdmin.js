import React, { useState, useContext, useEffect  } from 'react';
import { useDataFetching } from 'services/useDataFetching';
import { AuthContext  } from 'AuthContext';
//import { AuthLogin } from './AuthLogin';
import AuthLoginButton from 'AuthLoginButton';
//import { Button, Modal, Divider, Input } from 'antd';
//import './App.css'
//import { githubService } from 'services/githubService';
//import { appsService } from 'services/appsService';
import AppsListContent from 'components/adminComponents/AppsListContent'
import ToolsListContent from 'components/adminComponents/ToolsListContent'
import ToolsArtifactsListContent from 'components/adminComponents/ToolsArtifactsListContent';
import GitHubFunctionsContent from 'components/adminComponents/GitHubFunctionsContent'


  

function PageAdmin() {
  const { apps, tools } = useDataFetching();
  const [selectedItem, setSelectedItem] = useState(null);
  const { authState} = useContext(AuthContext);

  const items = [
    { id: 1, name: 'Tools List', contentComponent: ToolsListContent },
    { id: 2, name: 'Core Apps List', contentComponent: AppsListContent },
    { id: 3, name: 'Tools Artifacts List', contentComponent: ToolsArtifactsListContent },
    { id: 4, name: '[Priv] GitHub Functions', contentComponent: GitHubFunctionsContent, needPriv: true },
  ];

  const filteredItems = items.filter(item => {
    //console.log(authState)
    return !item.needPriv || (item.needPriv && authState && authState.level !== 'public');
  });

  const onItemClick = (item) => {
    setSelectedItem(item);
  };


  return (
    <div>
        <h1 className='pageTitle'>Admin Page</h1>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginRight: '30px', marginBottom: '10px' }}>
          <AuthLoginButton/></div>
        <div style={{ display: 'flex', border: '1px solid #ccc', textAlign: 'left' }}>
        {/* Left column for items */}
        <div style={{ flex: '0 0 15%', padding: '1rem', borderRight: '1px solid #ccc' }}>
            <h2>Items</h2>
            <ul>
            {filteredItems.map((item) => (
                <li
                key={item.id}
                style={{
                    cursor: 'pointer',
                    textDecoration: selectedItem === item ? 'underline' : 'none',
                }}
                onClick={() => onItemClick(item)}
                >
                {item.name}
                </li>
            ))}
            </ul>
        </div>

        {/* Right column for content */}
        <div style={{ flex: '1', padding: '1rem', overflowY: 'auto', maxHeight: 'calc(100vh - 315px)' }}>
           
            {selectedItem ? (
            <div>
                <h2>{selectedItem.name}</h2>
                {selectedItem.contentComponent && (
                  <selectedItem.contentComponent />
                )}
            </div>
            ) : (
            <p>Select an item to view its content.</p>
            )}
        </div>
        </div>
    </div>
  );
}

export default PageAdmin;
