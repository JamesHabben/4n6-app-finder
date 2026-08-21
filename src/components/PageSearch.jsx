import React, { useState, useEffect, useContext, useMemo, useDeferredValue, useCallback, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input, Row, Col, Modal } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import { DataContext } from 'services/DataContext';
import AppDetails from 'components/AppDetails';
import WhatsNewTile from 'components/searchCompnents/WhatsNewTile';
import RecentAppsCard from 'components/searchCompnents/RecentAppsCard';
import AppTile from 'components/searchCompnents/AppTile';
import 'App.css'

const SearchResults = memo(function SearchResults({ apps, onAppClick }) {
  return (
    <Row gutter={[16, 16]} justify={'center'}>
      {apps.map((app, index) => (
        <Col key={index} xs={24} sm={12} md={8} lg={6} xl={4}>
          <AppTile app={app} onClick={onAppClick} />
        </Col>
      ))}
    </Row>
  );
});

function PageSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const isSearchStale = searchTerm !== deferredSearchTerm;
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

  const handleAppClick = useCallback((app) => {
    setSelectedApp(app);
    setIsModalVisible(true);
    navigate(`/?app=${encodeURIComponent(app.appName)}`);
  }, [navigate]);

  const filteredApps = useMemo(() => {
    const value = deferredSearchTerm.trim().toLowerCase();
    if (!value) {
      return [];
    }

    return apps.filter(app =>
      (app.searchHaystack || app.appName.toLowerCase()).includes(value)
    );
  }, [apps, deferredSearchTerm]);

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
            isSearchStale ? (
              <span>
                <LoadingOutlined /> Searching...
              </span>
            ) : (
              `${filteredApps.length} matching apps`
            )
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

      <div style={{ opacity: isSearchStale ? 0.6 : 1 }}>
        <SearchResults apps={filteredApps} onAppClick={handleAppClick} />
      </div>
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
