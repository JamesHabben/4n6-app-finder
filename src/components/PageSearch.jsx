import React, { useState, useEffect, useLayoutEffect, useContext, useMemo, useDeferredValue, useCallback, memo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input, Row, Col } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import { DataContext } from 'services/DataContext';
import AppDetailsModal from 'components/AppDetailsModal';
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

function isTouchPrimaryDevice() {
  return window.matchMedia('(pointer: coarse)').matches;
}

function readSearchTermFromQuery(search) {
  const searchQuery = new URLSearchParams(search).get('search');
  if (!searchQuery) {
    return '';
  }
  return decodeURIComponent(searchQuery).replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function PageSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState(() => readSearchTermFromQuery(window.location.search));
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const isSearchStale = searchTerm !== deferredSearchTerm;
  const { apps, tools } = useContext(DataContext);
  const [selectedApp, setSelectedApp] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const searchInputRef = useRef(null);

  useLayoutEffect(() => {
    if (isTouchPrimaryDevice() || new URLSearchParams(window.location.search).has('app')) {
      return;
    }

    const focusBox = () => {
      const input = searchInputRef.current;
      input?.focus({ preventScroll: true });
      input?.input?.focus({ preventScroll: true });
    };

    focusBox();
    const frame = window.requestAnimationFrame(focusBox);
    const timeoutId = window.setTimeout(focusBox, 50);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchQuery = params.get('search');
    const appName = params.get('app');

    if (searchQuery) {
      const safeSearchQuery = readSearchTermFromQuery(location.search);
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
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.has('app')) {
      return;
    }

    if (searchTerm) {
      if (readSearchTermFromQuery(location.search) !== searchTerm) {
        navigate(`/?search=${encodeURIComponent(searchTerm)}`, { replace: true });
      }
      return;
    }

    if (params.has('search')) {
      navigate('/', { replace: true });
    }
  }, [searchTerm, navigate, location.search]);

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
          ref={searchInputRef}
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
      <AppDetailsModal
        app={selectedApp}
        open={isModalVisible}
        onCancel={closeAppModal}
      />

    </div>
  );

}

export default PageSearch;
