import React, { useContext } from 'react';
import { Modal } from 'antd';
import AppDetails from 'components/AppDetails';
import { DataContext } from 'services/DataContext';

function AppDetailsModal({ app, open, onCancel }) {
  const { tools } = useContext(DataContext);

  return (
    <Modal
      title="App Details"
      open={open}
      onCancel={onCancel}
      footer={null}
      width="80%"
      destroyOnHidden
    >
      {app && <AppDetails app={app} tools={tools} />}
    </Modal>
  );
}

export default AppDetailsModal;
