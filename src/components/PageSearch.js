import React, { useState, useEffect, useMemo, useRef  } from 'react';
import { Input, Card, Row, Col, Modal, AutoComplete  } from 'antd';
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
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const inputRef = useRef(null);

  const handleAppClick = (app) => {
    setSelectedApp(app);
    setIsModalVisible(true);
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
      setSuggestions(Object.keys(apps[0] || {}).map(key => ({ value: '-no:' + key })));
    } else if (operator && !value  && searchTerm.indexOf(' ') < 0) {
      setSuggestions([{ value: '-no:' }]);
    } else {
      setSuggestions([]);
    }
  }

  useEffect(() => {
    setSuggestionValues();
  }, [searchTerm, apps]);
    
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
  

  const filteredApps = useMemo(() => {
    if (!searchTerm) return [];
  
    const { operator, property, value } = parseSearchTerms(searchTerm);
  
    return apps.filter(app => {
      // Initial filter based on '-no:' operator
      let matchesOperator = true;
      if (operator === '-no:' && property) {
        matchesOperator = !app[property];  // Check if the property value is falsy
      }
  
      // Further filter the reduced set based on the search term
      if (matchesOperator && value) {
        const lowerValue = value.toLowerCase();
        return (
          app.appName.toLowerCase().includes(lowerValue) ||
          (app.alternateNames && app.alternateNames.some(name => name.toLowerCase().includes(lowerValue)))
        );
      }
  
      return matchesOperator;  // If there's no value, return the result of the operator check
    });
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
