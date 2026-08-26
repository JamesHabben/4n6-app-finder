import React from 'react';
import { Table, Tag, Typography } from 'antd';

const { Paragraph, Text } = Typography;

const supportedFiles = [
  {
    key: 'itunes-info-plist',
    file: 'Info.plist',
    source: 'iTunes / Finder / Apple Devices backup root',
    status: 'supported',
    locations: [
      'Same folder as Manifest.plist and Status.plist',
      'macOS: ~/Library/Application Support/MobileSync/Backup/<UDID>/Info.plist',
      'Windows iTunes (older): %APPDATA%\\Apple Computer\\MobileSync\\Backup\\<UDID>\\Info.plist',
      'Windows Apple Devices / Microsoft Store iTunes: %USERPROFILE%\\Apple\\MobileSync\\Backup\\<UDID>\\Info.plist',
      'Forensic case: the root of an iTunes-style backup added as evidence',
    ],
  },
  {
    key: 'ileapp-installed',
    file: 'Installed apps export',
    source: 'iLEAPP / ALEAPP',
    status: 'coming',
    locations: ['Installed Apps / App.InstalledApp CSV or similar'],
  },
  {
    key: 'android-packages',
    file: 'packages.xml / packages.list',
    source: 'Android',
    status: 'coming',
    locations: ['/data/system/'],
  },
  {
    key: 'tool-exports',
    file: 'Tool-specific app lists',
    source: 'Cellebrite / Magnet / others',
    status: 'coming',
    locations: ['Per-tool export; format TBD'],
  },
];

const columns = [
  {
    title: 'File',
    dataIndex: 'file',
    key: 'file',
    width: 220,
    render: (file, row) => (
      <span>
        <Text strong={row.status === 'supported'}>{file}</Text>
        {' '}
        {row.status === 'supported' ? (
          <Tag color="blue">Supported</Tag>
        ) : (
          <Tag>Coming next</Tag>
        )}
      </span>
    ),
  },
  {
    title: 'Source',
    dataIndex: 'source',
    key: 'source',
    width: 280,
  },
  {
    title: 'Where to find it',
    dataIndex: 'locations',
    key: 'locations',
    render: locations => (
      <ul className="blind-spots-location-list">
        {locations.map(location => (
          <li key={location}>{location}</li>
        ))}
      </ul>
    ),
  },
];

function SupportedFilesTable() {
  return (
    <div className="blind-spots-files">
      <h2>Supported files</h2>
      <Paragraph type="secondary">
        Choose the Info.plist at the <Text strong>backup folder root</Text>, sitting next to
        Manifest.plist. Do not pick an app bundle&apos;s own Info.plist. This file is created
        by the backup, so it is usually absent from a live filesystem dump of the phone.
        Info.plist is plaintext even when the backup itself is encrypted.
      </Paragraph>
      <Table
        rowKey="key"
        columns={columns}
        dataSource={supportedFiles}
        pagination={false}
        size="middle"
      />
    </div>
  );
}

export default SupportedFilesTable;
