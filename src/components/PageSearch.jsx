import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input, Row, Col, Modal, AutoComplete } from 'antd';
import { CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { debounce } from 'lodash';

import { DataContext } from 'services/DataContext';
import { trackEvent } from 'services/analytics';
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
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchQuery = params.get('search');
    const appName = params.get('app');
  
    if (searchQuery) {
      const safeSearchQuery = decodeURIComponent(searchQuery).replace(/</g, "&lt;").replace(/>/g, "&gt;");
      if (safeSearchQuery !== searchTerm) {
        //console.log('setting search')
        setSearchTerm(safeSearchQuery);
        //debouncedFilterAppsRef.current(safeSearchQuery);
      }
      //debouncedFilterAppsRef.current(safeSearchQuery);
    }
  
    if (appName) {
      console.log(decodeURIComponent(appName))
      const app = apps.find(a => a.appName.toLowerCase() === decodeURIComponent(appName).toLowerCase());
      console.log(app)
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

  const handleKeyDown = (e) => {
    if (e.key === 'Tab' && suggestions.length > 0) {
      e.preventDefault();
      if (suggestions.length === 1) {
        setSearchTerm(suggestions[0].value);
      } else if (suggestions.length > 1) {
        // Otherwise, select the suggestion at the highlighted index
        const selectedValue = suggestions[highlightedIndex]?.value;
        if (selectedValue) {
          setSearchTerm(selectedValue);
        }
      }
    }
    if (e.key === 'ArrowDown') {
      setHighlightedIndex((prevIndex) => Math.min(prevIndex + 1, suggestions.length - 1));
    }
    if (e.key === 'ArrowUp') {
      setHighlightedIndex((prevIndex) => Math.max(prevIndex - 1, 0));
    }
  };

  const handleSelect = (value) => {
    setSearchTerm(value);
    setSuggestionValues();
    setHighlightedIndex(0)
    inputRef.current.focus();
  };

  const setSuggestionValues = () => {
    const { operator, property, value } = parseSearchTerms(searchTerm);
    if (operator == '-no:' && !value && searchTerm.indexOf(' ') < 0) {
      setSuggestions(Object.keys(apps[0] || {}).filter(key => key !== 'searchHaystack' && key !== 'mappedArtifactNames').map(key => ({ value: '-no:' + key })));
    } else if (operator && !value  && searchTerm.indexOf(' ') < 0) {
      setSuggestions([{ value: '-no:' }]);
    } else {
      setSuggestions([]);
    }
  }

    
  function parseSearchTerms(term) {
    const result = {
      operator: null,
      property: null,
      value: null,
    };
  
    // Check for operator
    const operatorIndex = term.indexOf('-');
    if (operatorIndex !== -1) {
      const colonIndex = term.indexOf(':');
      if (colonIndex !== -1) {
        // Extract operator and property
        result.operator = term.substring(operatorIndex, colonIndex + 1);
        const spaceIndex = term.indexOf(' ', colonIndex);
        if (spaceIndex !== -1) {
          // Extract property and value
          result.property = term.substring(colonIndex + 1, spaceIndex).trim();
          result.value = term.substring(spaceIndex + 1).trim();
        } else {
          // Only property is specified
          result.property = term.substring(colonIndex + 1).trim();
        }
      } else {
        // Operator is specified but no property
        result.operator = term.substring(operatorIndex).trim();
      }
    } else {
      // No operator, so treat entire term as value
      result.value = term.trim();
    }
  
    return result;
  }
  
  const [filteredApps, setFilteredApps] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const debouncedFilterAppsRef = useRef();

  const filterApps = useCallback((search) => {
    const { operator, property, value } = parseSearchTerms(search);

    const filtered = apps.filter(app => {
      let matchesOperator = true;
      if (operator === '-no:' && property) {
        matchesOperator = !app[property];
      }

      if (matchesOperator && value) {
        return (app.searchHaystack || app.appName.toLowerCase()).includes(value.toLowerCase());
      }

      return matchesOperator;
    });

    setFilteredApps(filtered);
    setIsFiltering(false);
    trackEvent('Search', { searchTerm: value });
  }, [apps]);

  useEffect(() => {
    const debounced = debounce(filterApps, 500);
    debouncedFilterAppsRef.current = debounced;
    return () => debounced.cancel();
  }, [filterApps]);

  useEffect(() => {
    if (searchTerm && debouncedFilterAppsRef.current) {
      debouncedFilterAppsRef.current(searchTerm);
    }
  }, [searchTerm, filterApps]);
  
    
  
  const clearSearch = () => {
    setSearchTerm('');
    navigate(`/`);
  };
  
  const suffix = (
    <CloseCircleOutlined
      style={{ cursor: 'pointer' }}
      onClick={clearSearch}
    />
  );

  useEffect(() => {
    setSuggestionValues();
    if (searchTerm) {
      setIsFiltering(true);
      navigate(`/?search=${encodeURIComponent(searchTerm)}`);
      //debouncedFilterAppsRef.current(searchTerm);
    } else {
      setIsFiltering(false);
      setFilteredApps([]);
    }
  }, [searchTerm]); //, debouncedFilterAppsRef]);

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
        <AutoComplete
            className="searchBar"
            options={suggestions}
            value={searchTerm}
            onSearch={setSearchTerm}
            onSelect={handleSelect}
          >
          <Input.Search
            className="searchBar"
            placeholder="Search for an app"
            defaultValue={searchTerm}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyUp={e => { if (e.key === 'Escape') {
              clearSearch()
            }}}
            //onKeyDown={handleKeyDown}
            ref={inputRef}
            autoCorrect="off"
            spellCheck={false}
            suffix={suffix}
          />
        </AutoComplete>
        <div className='searchCount'>
          {isFiltering ? (
            <span>
              <LoadingOutlined /> Searching...
            </span>
          ) : searchTerm ? (
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
