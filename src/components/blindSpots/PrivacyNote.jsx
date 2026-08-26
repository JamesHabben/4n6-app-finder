import React, { useState } from 'react';
import { Button, Modal, Typography } from 'antd';
import { LockOutlined } from '@ant-design/icons';

const { Paragraph, Title } = Typography;

function PrivacyNote() {
  const [open, setOpen] = useState(false);

  return (
    <div className="blind-spots-privacy">
      <Button
        type="link"
        icon={<LockOutlined />}
        onClick={() => setOpen(true)}
        className="blind-spots-privacy-trigger"
      >
        Processed in this browser. The file is not uploaded.
      </Button>
      <Modal
        title="Client-side processing"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width={640}
      >
        <Paragraph>
          Blind Spots reads the file you choose with this browser tab. The file is not posted
          to 4n6 App Finder or to any other server.
        </Paragraph>
        <Paragraph>
          This site is a static app. Search already loads the public catalog into the page.
          Blind Spots keeps the extraction file in memory only. Closing the tab or refreshing
          this page drops it.
        </Paragraph>
        <Title level={5}>How to verify</Title>
        <ol className="blind-spots-privacy-steps">
          <li>Open DevTools (F12, or Cmd+Option+I on macOS).</li>
          <li>Open the Network tab and enable Preserve log.</li>
          <li>Choose the Info.plist file.</li>
          <li>
            Confirm there is no request whose payload is the plist (no POST, PUT, or PATCH of
            the file). You will still see normal GETs for this site&apos;s JavaScript, CSS, and
            catalog JSON when the page first loads. Process or Download on a sample is also a
            GET of that hosted file.
          </li>
        </ol>
        <Paragraph type="secondary">
          Vercel Analytics may record that the Blind Spots page was visited. That is a page
          view, not the backup file.
        </Paragraph>
      </Modal>
    </div>
  );
}

export default PrivacyNote;
