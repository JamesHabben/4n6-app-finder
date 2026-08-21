import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input, Row, Col, Modal } from 'antd';

import { DataContext } from 'services/DataContext';
import AppDetails from 'components/AppDetails';
import WhatsNewTile from 'components/searchCompnents/WhatsNewTile';
import RecentAppsCard from 'components/searchCompnents/RecentAppsCard';
import AppTile from 'components/searchCompnents/AppTile';
import 'App.css'

function PageSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const { apps, tools } = useContext(DataContext);
  const [selectedApp, setSelectedApp] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchQuery = params.get('search');
    const appName = params.get('app');

    if (searchQuery) {
      const safeSearchQuery = decodeURIComponent(searchQuery).replace(/</g, "&lt;").replace(/>/g, "&gt;");
      if (safeSearchQuery !== searchTerm) {
        setSearchTerm(safeSearchQuery);
      }
    }

    if (appName) {
      const app = apps.find(a => a.appName.toLowerCase() === decodeURIComponent(appName).toLowerCase());
      if (app) {
        setSelectedApp(app);
        setIsModalVisible(true);
      }
    }
  }, [location, apps]);

  const handleAppClick = (app) => {
    setSelectedApp(app);
    setIsModalVisible(true);
    navigate(`/?app=${encodeURIComponent(app.appName)}`);
  };

  const filteredApps = useMemo(() => {
    const value = searchTerm.trim().toLowerCase();
    if (!value) {
      return [];
    }

    return apps.filter(app =>
      (app.searchHaystack || app.appName.toLowerCase()).includes(value)
    );
  }, [apps, searchTerm]);

  const clearSearch = () => {
    setSearchTerm('');
    navigate(`/`);
  };

  useEffect(() => {
    if (searchTerm) {
      navigate(`/?search=${encodeURIComponent(searchTerm)}`);
    }
  }, [searchTerm]);

  const closeAppModal = () => {
    setIsModalVisible(false);

    if (searchTerm) {
      navigate(`/?search=${encodeURIComponent(searchTerm)}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div style={{ padding: '5vh 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', marginBottom: '1rem', textAlign: 'left' }}>
        <Input
          className="searchBar"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for an app"
          allowClear
          spellCheck={false}
          autoCorrect="off"
          onKeyDown={(e) => {
            if (e.key === 'Escape') clearSearch();
          }}
        />
        <div className='searchCount'>
          {searchTerm ? (
            `${filteredApps.length} matching apps`
          ) : (
            <span>
              {`${apps.length} apps and `}
              <a href="/admin/tools">{`${tools.length} forensic tools`}</a> in the database. You can <a
               href="https://github.com/JamesHabben/4n6-app-finder" target="_blank" rel="noopener noreferrer">contribute</a>!
            </span>
          )}
        </div>
        {!searchTerm && (
          <>
            <WhatsNewTile />
            <RecentAppsCard apps={apps} onAppClick={handleAppClick} />
          </>
        )}
      </div>

      <Row gutter={[16, 16]} justify={'center'}>
        {filteredApps.map((app, index) => (
          <Col key={index} xs={24} sm={12} md={8} lg={6} xl={4}>
            <AppTile app={app} onClick={handleAppClick} />
          </Col>
        ))}
      </Row>
      <Modal
        title="App Details"
        open={isModalVisible}
        onCancel={() => closeAppModal()}
        footer={null}
        width={"80%"}
      >
        {selectedApp && <AppDetails app={selectedApp} tools={tools}/>}
      </Modal>

    </div>
  );

}

export default PageSearch;
