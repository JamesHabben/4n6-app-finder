// Routes.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PageSearch from 'components/PageSearch';
import PageDashboard from 'components/PageDashboard';
import PageAdmin from 'components/PageAdmin';
import ToolsListContent from 'components/adminComponents/ToolsListContent';
import AppsListContent from 'components/adminComponents/AppsListContent';
import ToolsArtifactsListContent from 'components/adminComponents/ToolsArtifactsListContent';
import GitHubFunctionsContent from 'components/adminComponents/GitHubFunctionsContent';
import AuthCallbackHandler from 'AuthCallbackHandler';

const AppRoutes = () => {
  return(
    <Routes>
      <Route path="/" element={<PageSearch />} />
      <Route path="/auth/callback" element={<AuthCallbackHandler />} />
      <Route path="/dashboard" element={<PageDashboard />} />
      <Route path="/admin" element={<PageAdmin />} >
        <Route path="tools" element={<ToolsListContent />} />
        <Route path="apps" element={<AppsListContent />} />
        <Route path="artifacts" element={<ToolsArtifactsListContent />} />
        <Route path="github" element={<GitHubFunctionsContent />} />
      </Route>
    </Routes>
  )
};

export default AppRoutes;
