// Routes.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import PageSearch from './components/PageSearch';
import PageDashboard from './components/PageDashboard';
import PageAdmin from './components/PageAdmin';
import AuthCallbackHandler from './AuthCallbackHandler';

const AppRoutes = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const code = params.get('code');

  return(
    <Routes>
      <Route path="/" element={code ? <AuthCallbackHandler /> : <PageSearch />} />
      <Route path="/dashboard" element={<PageDashboard />} />
      <Route path="/admin" element={<PageAdmin />} />
      {/*<Route path="/auth/callback" element={<AuthCallbackHandler />} />*/}
    </Routes>
  )
};

export default AppRoutes;
