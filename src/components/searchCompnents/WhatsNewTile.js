import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, Modal } from 'antd';
//import './WhatsNewTile.css';  // Import the CSS file

function WhatsNewTile() {
  const [markdown, setMarkdown] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [previewContent, setPreviewContent] = useState('');

  useEffect(() => {
    fetch('/whatsnew.md')
      .then(response => response.text())
      .then(text => {
        setMarkdown(text);
        const sections = text.split('## ');
        const preview = '## ' + sections.slice(1, 3).join('## ');
        setPreviewContent(preview);
      });
  }, []);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <div style={{ marginBottom:'20px'}}>
      <Card bodyStyle={{ padding: '10px', textAlign: 'left' }} className="whats-new-card" onClick={showModal}>
        <ReactMarkdown className="whats-new-content">{previewContent}</ReactMarkdown>
        <a onClick={showModal} style={{ cursor: 'pointer' }}>Show More</a>
      </Card>
      <Modal
        title="What's New"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={"80%"}
      >
        <ReactMarkdown className="whats-new-content">{markdown}</ReactMarkdown>
      </Modal>
    </div>
  );
}

export default WhatsNewTile;
