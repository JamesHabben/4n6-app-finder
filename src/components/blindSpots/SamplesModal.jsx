import React, { useEffect, useState } from 'react';
import { Button, Collapse, Modal, Space, Typography } from 'antd';

const { Paragraph, Text } = Typography;

function sampleUrl(file) {
  return `/samples/${file}`;
}

function sampleFileName(file) {
  return file.split('/').pop() || 'sample';
}

function SamplesModal({ open, onClose, onProcessFile, loading }) {
  const [manifest, setManifest] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [processingId, setProcessingId] = useState('');
  const [processError, setProcessError] = useState('');

  useEffect(() => {
    if (!open || manifest) {
      return;
    }

    let cancelled = false;
    fetch('/samples/manifest.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Could not load the sample list.');
        }
        return response.json();
      })
      .then(data => {
        if (!cancelled) {
          setManifest(data);
          setLoadError('');
        }
      })
      .catch(err => {
        if (!cancelled) {
          setLoadError(err?.message || 'Could not load the sample list.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, manifest]);

  useEffect(() => {
    if (open) {
      setProcessError('');
    }
  }, [open]);

  const processSample = async (sample) => {
    setProcessError('');
    setProcessingId(sample.id);

    try {
      const response = await fetch(sampleUrl(sample.file));
      if (!response.ok) {
        throw new Error('Could not load that sample.');
      }
      const blob = await response.blob();
      const file = new File([blob], sampleFileName(sample.file), {
        type: blob.type || 'application/octet-stream',
      });
      onClose();
      await onProcessFile(file);
    } catch (err) {
      setProcessError(err?.message || 'Could not process that sample.');
    } finally {
      setProcessingId('');
    }
  };

  const types = manifest?.types || [];

  return (
    <Modal
      title="Sample files"
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
    >
      <Paragraph>
        Try Blind Spots with a public research image before you use a file from a real device.
      </Paragraph>
      <Paragraph>
        Process or Download fetches that sample from this site with a GET. You will see that
        request in the Network tab. It is not an upload of your case file.
      </Paragraph>
      {manifest?.evidenceLockerUrl && (
        <Paragraph>
          Public images are catalogued on{' '}
          <a href={manifest.evidenceLockerUrl} target="_blank" rel="noopener noreferrer">
            The Evidence Locker
          </a>.
        </Paragraph>
      )}

      {loadError && <Paragraph type="danger">{loadError}</Paragraph>}
      {processError && <Paragraph type="danger">{processError}</Paragraph>}

      {types.length > 0 && (
        <Collapse
          defaultActiveKey={[types[0].id]}
          items={types.map(type => ({
            key: type.id,
            label: type.label,
            children: (type.samples || []).map(sample => (
              <div key={sample.id} className="blind-spots-sample-row">
                <Text>
                  {sample.year} · {sample.author} · {sample.imageName}
                </Text>
                <Space wrap>
                  <Button
                    type="primary"
                    size="small"
                    loading={processingId === sample.id || loading}
                    disabled={Boolean(processingId) || loading}
                    onClick={() => processSample(sample)}
                  >
                    Process sample
                  </Button>
                  <Button
                    size="small"
                    href={sampleUrl(sample.file)}
                    download={sampleFileName(sample.file)}
                  >
                    Download
                  </Button>
                </Space>
              </div>
            )),
          }))}
        />
      )}
    </Modal>
  );
}

export default SamplesModal;
