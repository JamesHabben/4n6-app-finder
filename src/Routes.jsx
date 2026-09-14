import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PageSearch from 'components/PageSearch';
import PageDashboard from 'components/PageDashboard';
import PageAppList, { APP_LIST_PATH, ONE_HIT_PATH, WISH_LIST_PATH } from 'components/PageAppList';
import PageAdmin from 'components/PageAdmin';
import PageBlindSpots from 'components/PageBlindSpots';
import PageBlindSpotsResults from 'components/PageBlindSpotsResults';
import ToolsListContent from 'components/adminComponents/ToolsListContent';
import AppsListContent from 'components/adminComponents/AppsListContent';
import ToolsArtifactsListContent from 'components/adminComponents/ToolsArtifactsListContent';

const AppRoutes = () => {
  return(
    <Routes>
      <Route path="/" element={<PageSearch />} />
      <Route path="/dashboard" element={<PageDashboard />} />
      <Route path={APP_LIST_PATH} element={<PageAppList />} />
      <Route path={ONE_HIT_PATH} element={<PageAppList />} />
      <Route path={WISH_LIST_PATH} element={<PageAppList />} />
      <Route path="/blind-spots" element={<PageBlindSpots />} />
      <Route path="/blind-spots/results" element={<PageBlindSpotsResults />} />
      <Route path="/admin" element={<PageAdmin />} >
        <Route path="tools" element={<ToolsListContent />} />
        <Route path="apps" element={<AppsListContent />} />
        <Route path="artifacts" element={<ToolsArtifactsListContent />} />
      </Route>
    </Routes>
  )
};

export default AppRoutes;
