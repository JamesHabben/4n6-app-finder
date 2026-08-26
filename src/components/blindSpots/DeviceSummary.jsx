import React from 'react';
import { Collapse, Descriptions, Typography } from 'antd';

const { Text } = Typography;

const IDENTIFIER_LABELS = [
  { key: 'serialNumber', label: 'Serial Number' },
  { key: 'uniqueIdentifier', label: 'UDID' },
  { key: 'imei', label: 'IMEI' },
  { key: 'imei2', label: 'IMEI 2' },
  { key: 'meid', label: 'MEID' },
  { key: 'iccid', label: 'ICCID' },
  { key: 'phoneNumber', label: 'Phone Number' },
];

function formatBackupDate(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return '';
  }
  return value.toLocaleString();
}

function deviceHeading(device) {
  const parts = [
    device.productName || device.productType,
    device.productVersion ? `iOS ${device.productVersion}` : '',
  ].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(' · ');
  }
  return device.name || 'Device';
}

function DeviceSummary({ device }) {
  if (!device) {
    return null;
  }

  const identifierItems = IDENTIFIER_LABELS
    .filter(item => device.identifiers?.[item.key])
    .map(item => ({
      key: item.key,
      label: item.label,
      children: device.identifiers[item.key],
    }));

  const summaryItems = [
    { key: 'name', label: 'Device Name', children: device.name },
    { key: 'productType', label: 'Product Type', children: device.productType },
    { key: 'productName', label: 'Product Name', children: device.productName },
    { key: 'productVersion', label: 'iOS Version', children: device.productVersion },
    { key: 'buildVersion', label: 'Build', children: device.buildVersion },
    { key: 'lastBackupDate', label: 'Last Backup', children: formatBackupDate(device.lastBackupDate) },
    { key: 'itunesVersion', label: 'iTunes Version', children: device.itunesVersion },
  ].filter(item => item.children);

  return (
    <Collapse
      className="blind-spots-device"
      defaultActiveKey={[]}
      items={[{
        key: 'device',
        label: deviceHeading(device),
        children: (
          <>
            <Descriptions
              size="small"
              column={{ xs: 1, sm: 2 }}
              items={summaryItems}
            />
            {identifierItems.length > 0 && (
              <Collapse
                className="blind-spots-identifiers"
                items={[{
                  key: 'identifiers',
                  label: 'Identifiers',
                  children: (
                    <>
                      <Text type="secondary">
                        These values can identify the device. Keep this section closed in screenshots
                        or shared reports.
                      </Text>
                      <Descriptions
                        size="small"
                        column={1}
                        style={{ marginTop: '0.75rem' }}
                        items={identifierItems}
                      />
                    </>
                  ),
                }]}
              />
            )}
          </>
        ),
      }]}
    />
  );
}

export default DeviceSummary;
