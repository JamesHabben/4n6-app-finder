import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PageSearch from 'components/PageSearch';
import PageDashboard from 'components/PageDashboard';
import PageOneHitWonders from 'components/PageOneHitWonders';
import PageAdmin from 'components/PageAdmin';
import ToolsListContent from 'components/adminComponents/ToolsListContent';
import AppsListContent from 'components/adminComponents/AppsListContent';
import ToolsArtifactsListContent from 'components/adminComponents/ToolsArtifactsListContent';

const AppRoutes = () => {
  return(
    <Routes>
      <Route path="/" element={<PageSearch />} />
      <Route path="/dashboard" element={<PageDashboard />} />
      <Route path="/dashboard/one-hit-wonders" element={<PageOneHitWonders />} />
      <Route path="/admin" element={<PageAdmin />} >
        <Route path="tools" element={<ToolsListContent />} />
        <Route path="apps" element={<AppsListContent />} />
        <Route path="artifacts" element={<ToolsArtifactsListContent />} />
      </Route>
    </Routes>
  )
};

export default AppRoutes;
