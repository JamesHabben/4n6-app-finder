import React from 'react';
import { Button, Tooltip } from 'antd';
import { MATCH_METHOD_LABELS } from 'services/blindSpots/matchCatalogApps';

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

export default TrackedAppName;
