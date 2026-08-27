import React, { useState } from 'react';
import { Alert, Button, Typography, Upload } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import PrivacyNote from 'components/blindSpots/PrivacyNote';
import SamplesModal from 'components/blindSpots/SamplesModal';
import SupportedFilesTable from 'components/blindSpots/SupportedFilesTable';
import { useBlindSpots } from 'services/blindSpots/BlindSpotsContext';
import { parseItunesInfoPlist } from 'services/blindSpots/parseItunesInfoPlist';

const { Dragger } = Upload;
const { Paragraph, Title } = Typography;

function PageBlindSpots() {
  const { analysis, setAnalysis } = useBlindSpots();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [samplesOpen, setSamplesOpen] = useState(false);

  const processFile = async (file) => {
    setError('');
    setLoading(true);

    try {
      const buffer = await file.arrayBuffer();
      const result = parseItunesInfoPlist(buffer, file.name);
      setAnalysis(result);
      navigate('/blind-spots/results');
    } catch (err) {
      setError(err?.message || 'Could not read that file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="blind-spots-page">
      <div className="blind-spots-inner">
        <Title level={1} style={{ marginBottom: 0 }}>Blind Spots</Title>
        <Paragraph type="secondary">
          Check an extraction&apos;s installed apps without sending the file anywhere.
        </Paragraph>
        <div className="blind-spots-toolbar">
          <PrivacyNote />
          <Button onClick={() => setSamplesOpen(true)}>View sample files</Button>
        </div>

        {analysis && (
          <Alert
            type="info"
            showIcon
            className="blind-spots-resume"
            title={
              <Link to="/blind-spots/results">
                View last results for {analysis.device?.name || analysis.source?.fileName}
              </Link>
            }
          />
        )}

        <Dragger
          className="blind-spots-upload"
          accept=".plist,.xml,application/xml,text/xml,application/x-plist"
          maxCount={1}
          multiple={false}
          showUploadList={false}
          disabled={loading}
          beforeUpload={(file) => {
            processFile(file);
            return false;
          }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            {loading ? 'Reading Info.plist…' : 'Drop an iTunes backup Info.plist here, or click to choose'}
          </p>
          <p className="ant-upload-hint">
            Processed in this browser. The file stays on this machine.
          </p>
        </Dragger>

        {error && (
          <Alert type="error" showIcon message={error} style={{ marginBottom: '1.5rem' }} />
        )}

        <SamplesModal
          open={samplesOpen}
          onClose={() => setSamplesOpen(false)}
          onProcessFile={processFile}
          loading={loading}
        />

        <SupportedFilesTable />
      </div>
    </div>
  );
}

export default PageBlindSpots;
