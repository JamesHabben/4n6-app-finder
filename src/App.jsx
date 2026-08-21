import React, { useState} from 'react';
import { BrowserRouter as Router, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRoutes from './Routes';
import VersionInfo from 'components/VersionInfo';
import { DataProvider } from 'services/DataContext';
import { Analytics } from '@vercel/analytics/react';

import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const [showScroll, setShowScroll] = useState(false);

  React.useEffect(() => {
    if (document.title && import.meta.env.DEV) {
      document.title += ' (Dev Mode)';
    }
  }, []);

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

  React.useEffect(() => {
    window.addEventListener('scroll', checkScrollTop);
    return () => window.removeEventListener('scroll', checkScrollTop);
  });

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <DataProvider>
          <AppContent />
          <div
            className="scrollTop"
            onClick={scrollTop}
            style={{height: 40, display: showScroll ? 'flex' : 'none'}}>
              <span>^</span>
          </div>
          <Analytics />
        </DataProvider>
      </Router>
    </QueryClientProvider>
  );
}

function AppContent() {
  const location = useLocation();
  const activeTab = location.pathname;

  return (
      <div className={activeTab.startsWith('/admin') ? 'app-container admin-layout' : 'app-container'}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0rem' }}>
          <img src="/images/4af-logo.png" alt="Logo" width={'200px'} height={'200px'}
            style={{ position: 'absolute', left: '0px', top: '0px', zIndex:'-1' }} />
          <h1>4n6 App Finder</h1>
        </header>
        <ul className="nav">
          <li className={activeTab === "/" ? "active" : ""}>
            <Link to="/">Search</Link>
          </li>
          <li className={activeTab.startsWith("/dashboard") ? "active" : ""}>
            <Link to="/dashboard">Dashboard</Link>
          </li>
          <li className={activeTab.startsWith("/admin") ? "active" : ""}>
            <Link to="/admin">Admin</Link>
          </li>
        </ul>
        <VersionInfo />
        <AppRoutes />
      </div>
  );
}

export default App;
