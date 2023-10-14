// Routes.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PageSearch from './PageSearch';
import PageStats from './PageStats';
import PageAdmin from './PageAdmin';
import AuthCallbackHandler from './AuthCallbackHandler';

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<PageSearch />} />
    <Route path="/statistics" element={<PageStats />} />
    <Route path="/admin" element={<PageAdmin />} />
    <Route path="/auth/callback" element={<AuthCallbackHandler />} />
  </Routes>
);

export default AppRoutes;
