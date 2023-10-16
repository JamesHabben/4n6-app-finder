import React, { useEffect, useState} from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import AppRoutes from './Routes';
import PageSearch from 'components/PageSearch';
import PageStats from 'components/PageStats';
import PageAdmin from 'components/PageAdmin';
import VersionInfo from 'components/VersionInfo';
import { AuthProvider } from './AuthContext';

import './App.css';

function App() {
  const [showScroll, setShowScroll] = useState(false);
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      document.title = document.title + ' (Dev Mode)';
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
      
      <div className="app-container">
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0rem' }}>
          <img src="/4af-logo.png" alt="Logo" width={'200px'} height={'200px'} 
            style={{ position: 'absolute', left: '0px', top: '0px', zIndex:'-1' }} />
          <h1>4n6 App Finder</h1>
        </header>
        <ul className="nav">
          <Link to="/" onClick={() => setActiveTab("/")}>
            <li className={activeTab === "/" ? "active" : ""}>Search</li>
          </Link>
          <Link to="/statistics" onClick={() => setActiveTab("/statistics")}>
            <li className={activeTab === "/statistics" ? "active" : ""}>Statistics</li>
          </Link>
          <Link to="/admin" onClick={() => setActiveTab("/admin")}>
            <li className={activeTab === "/admin" ? "active" : ""}>Admin</li>
          </Link>
        </ul>
        <VersionInfo />
        <AppRoutes />
        <div 
          className="scrollTop" 
          onClick={scrollTop} 
          style={{height: 40, display: showScroll ? 'flex' : 'none'}}>
            <span>^</span>  {/* You can replace this with an icon */}
        </div>
      </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
