import React, { useState, useEffect, useMemo } from 'react';
import { Input, Card, Row, Col, Modal  } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';

import { useDataFetching } from 'services/useDataFetching';
import AppDetails from 'components/AppDetails';
import WhatsNewTile from 'components/searchCompnents/WhatsNewTile';
import RecentAppsTile from 'components/searchCompnents/RecentAppsTile';
import AppTile from 'components/searchCompnents/AppTile';
import 'App.css'

function PageSearch() {
  const [searchTerm, setSearchTerm] = useState('');
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
      <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', marginBottom: '1rem', textAlign: 'left' }}>
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
        {!searchTerm && (
          <>
            <WhatsNewTile />
            <RecentAppsTile apps={apps} tools={tools} onAppClick={handleAppClick} />
          </>
        )}
      </div>
      
      <Row gutter={[16, 16]} justify={'center'}>
        {filteredApps.map((app, index) => (
          <Col key={index} xs={24} sm={12} md={8} lg={6} xl={4}>
            <AppTile app={app} tools={tools} onClick={handleAppClick} />
          </Col>
        ))}
      </Row>
      <Modal
        title="App Details"
        open={isModalVisible}
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
