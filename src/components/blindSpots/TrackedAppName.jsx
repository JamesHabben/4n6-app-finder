import React from 'react';
import { Button, Tooltip, Typography } from 'antd';
import { MATCH_METHOD_LABELS } from 'services/blindSpots/matchCatalogApps';

const { Text } = Typography;

function MatchTooltipTitle({ row }) {
  return (
    <div className="blind-spots-match-tooltip">
      <div>
        <strong>Provided file:</strong> {row.name || '—'}
      </div>
      <div>
        <strong>Tracked as:</strong> {row.catalogApp?.appName || '—'}
      </div>
      <div>
        <strong>Matched by:</strong> {MATCH_METHOD_LABELS[row.matchMethod] || row.matchMethod}
      </div>
    </div>
  );
}

function CatalogAppIcon({ row }) {
  const icon = row.catalogApp?.icon;
  if (icon) {
    return (
      <img
        className="blind-spots-app-icon"
        src={`/app-icons/${icon}`}
        alt=""
      />
    );
  }
  return <span className="blind-spots-app-icon-slot" aria-hidden />;
}

function TrackedAppName({ row, onOpen }) {
  const label = row.name || row.bundleId;

  return (
    <Tooltip title={<MatchTooltipTitle row={row} />}>
      <Button
        type="link"
        className="blind-spots-app-link"
        onClick={() => onOpen(row.catalogApp)}
      >
        {label}
      </Button>
    </Tooltip>
  );
}

export function AppNameCell({ row, onOpen }) {
  return (
    <span className="blind-spots-app-cell">
      <CatalogAppIcon row={row} />
      {row.tracked
        ? <TrackedAppName row={row} onOpen={onOpen} />
        : (
          <span className="blind-spots-app-label">
            {row.name || <Text type="secondary">{row.bundleId}</Text>}
          </span>
        )}
    </span>
  );
}

export default TrackedAppName;
