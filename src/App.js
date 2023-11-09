import React, { useEffect, useState} from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import AppRoutes from './Routes';
import PageSearch from 'components/PageSearch';
import PageDashboard from 'components/PageDashboard';
import PageAdmin from 'components/PageAdmin';
import VersionInfo from 'components/VersionInfo';
import { DataProvider } from 'services/DataContext';
import { AuthProvider } from './AuthContext';

import './App.css';

/* global heap */

function App() {
  const [showScroll, setShowScroll] = useState(false);
  
  const loadHeap = (heapId) => {
    window.heap = window.heap || [];
    window.heap.load = function (e, t) {
      window.heap.appid = e;
      window.heap.config = t = t || {};
      const r = document.createElement("script");
      r.type = "text/javascript";
      r.async = true;
      r.src = `https://cdn.heapanalytics.com/js/heap-${e}.js`;
      const a = document.getElementsByTagName("script")[0];
      a.parentNode.insertBefore(r, a);
      for (const o of ["addEventProperties", "addUserProperties", "clearEventProperties", "identify", "resetIdentity", "removeEventProperty", "setEventProperties", "track", "unsetEventProperty"]) {
        window.heap[o] = (...args) => {
          window.heap.push([o].concat(args));
        };
      }
    };
    window.heap.load(heapId);
  };

  useEffect(() => {
    const heapId = process.env.NODE_ENV === 'development' 
      ? process.env.REACT_APP_HEAP_ID 
      : process.env.REACT_APP_HEAP_ID;
    
    if (document.title && process.env.NODE_ENV === 'development') {
      document.title += ' (Dev Mode)';
    }

    if (heapId) {
      console.log('Heap ID:', heapId);
      loadHeap(heapId);
    }
  }, []);
  
  const [activeTab, setActiveTab] = React.useState(window.location.pathname);

  const checkScrollTop = () => {
    if (!showScroll && window.pageYOffset > 400){
      setShowScroll(true);
    } else if (showScroll && window.pageYOffset <= 400){
      setShowScroll(false);
    }
  };

  const scrollTop = () =>{
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  useEffect(() => {
    window.addEventListener('scroll', checkScrollTop);
    return () => window.removeEventListener('scroll', checkScrollTop);
  });

  return (
    <Router>
      <AuthProvider>
        <DataProvider>
          <AppContent />
          <div 
            className="scrollTop" 
            onClick={scrollTop} 
            style={{height: 40, display: showScroll ? 'flex' : 'none'}}>
              <span>^</span>  {/* You can replace this with an icon */}
          </div>
        </DataProvider>
      </AuthProvider>
    </Router>
  );
}

function AppContent() {
  const location = useLocation();
  const activeTab = location.pathname;

  return (
      
      <div className="app-container">
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0rem' }}>
          <img src="/4af-logo.png" alt="Logo" width={'200px'} height={'200px'} 
            style={{ position: 'absolute', left: '0px', top: '0px', zIndex:'-1' }} />
          <h1>4n6 App Finder</h1>
        </header>
        <ul className="nav">
          <li className={activeTab === "/" ? "active" : ""}>
            <Link to="/">Search</Link>
          </li>
          <li className={activeTab === "/dashboard" ? "active" : ""}>
            <Link to="/dashboard">Dashboard</Link>
          </li>
          <li className={activeTab === "/admin" ? "active" : ""}>
            <Link to="/admin">Admin</Link>
          </li>
        </ul>
        <VersionInfo />
        <AppRoutes />

      </div>
  );
}

export default App;
