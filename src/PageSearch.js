import React, { useState, useEffect, useMemo } from 'react';
import { Input, Card, Row, Col, Modal  } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';

import { useDataFetching } from './useDataFetching';
import AppDetails from './AppDetails';
import './App.css'

function PageSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  //const [apps, setApps] = useState([]);
 // const [tools, setTools] = useState([]);
  const { apps, tools } = useDataFetching();
  const [selectedApp, setSelectedApp] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);


  const handleAppClick = (app) => {
      setSelectedApp(app);
      setIsModalVisible(true);
    };
  

  const filteredApps = useMemo(() => {
    return searchTerm ? apps.filter(app => {
      const lowerSearchTerm = searchTerm.toLowerCase();
      const isMatch = (
        app.appName.toLowerCase().includes(lowerSearchTerm) ||
        (app.alternateNames &&
          app.alternateNames.some(name =>
            name.toLowerCase().includes(lowerSearchTerm)
          ))
      );
      if (isMatch) {
        //console.log('Match found:', app.appName, app.alternateNames);
      }
      return isMatch;
    }) : [];
  }, [searchTerm, apps]);
    
  
  const clearSearch = () => {
    setSearchTerm('');
    
  };
  
  const suffix = (
    <CloseCircleOutlined
      style={{ cursor: 'pointer' }}
      onClick={clearSearch}
    />
  );
  
  return (
    <div style={{ padding: '5vh 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', marginBottom: '1rem' }}>
      <Input//.Search
        className="searchBar"
        placeholder="Search for an app"
        defaultValue={searchTerm}
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        onKeyUp={e => { if (e.key === 'Escape') {
          clearSearch()
        }}}
        autoCorrect="off"
        spellCheck={false}
        suffix={suffix}
      />
      <div className='searchCount'>
  {searchTerm
    ? `${filteredApps.length} matching apps`
    : `${apps.length} apps and ${tools.length} forensic tools in the database. You can `}
    {!searchTerm && <a href="https://github.com/JamesHabben/4n6-app-finder" target="_blank" rel="noopener noreferrer">contribute</a>}!
</div>

      </div>
      <Row gutter={[16, 16]} justify={'center'}>
        {filteredApps.map(app => (
          <Col key={app.appName} xs={24} sm={12} md={8} lg={6} xl={4}>
            <Card bodyStyle={{ padding: '10px' }} onClick={() => handleAppClick(app)}>
              <div style={{ textAlign: 'center' }}>
                <img src="/logo192.png" alt="App Logo" style={{ width: '75px', height: '75px', marginBottom: '1rem' }} />
                <div className="app-name">{app.appName}</div>
                <div>
                  {tools.map(tool =>
                    tool.artifactList.some(toolApp => 
                      toolApp[tool.appNameKey].toLowerCase() === app.appName.toLowerCase() || 
                      (app.alternateNames && app.alternateNames.includes(toolApp[tool.appNameKey]))
                    ) ? (
                      <img src={`/${tool.icon}`} style={{ width: '30px', height: '30px', margin: '0 5px' }} 
                        alt={`${tool.toolLongName} icon`} title={`${tool.toolLongName}`} key={tool.toolShortName} />
                    ) : null
                  )}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
      <Modal
        title="App Details"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={"80%"}
      >
        {selectedApp && <AppDetails app={selectedApp} tools={tools}/>}
      </Modal>

    </div>
  );
  
}

export default PageSearch;
