import React, { useMemo } from 'react';
import { Typography } from 'antd';
import TrackedAppName from 'components/blindSpots/TrackedAppName';
import { coverageRows } from 'services/blindSpots/summarizeInventory';

const { Paragraph } = Typography;

function ToolCoverageMatrix({ summary, platformLabel, onOpenApp }) {
  const { trackedApps, toolCounts, tracked } = summary;
  const rows = useMemo(
    () => coverageRows(trackedApps, toolCounts),
    [trackedApps, toolCounts],
  );

  return (
    <div>
      <Paragraph type="secondary">
        {tracked} tracked app{tracked === 1 ? '' : 's'} across {toolCounts.length} tools
        {platformLabel ? ` on ${platformLabel}` : ''}.
        A filled dot means that tool parses the app on this file&apos;s platform.
        Columns include tools with zero hits on this device. Sorted by tool count.
      </Paragraph>
      <div className="blind-spots-coverage-wrap">
        <table className="blind-spots-coverage">
          <thead>
            <tr>
              <th className="coverage-app">App</th>
              {toolCounts.map(tool => (
                <th key={tool.shortName} title={tool.longName}>
                  <img
                    src={`/images/${tool.icon}`}
                    alt={tool.longName}
                    title={tool.longName}
                  />
                </th>
              ))}
              <th className="coverage-count">Count</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.bundleId}>
                <td className="coverage-app">
                  <TrackedAppName row={row} onOpen={onOpenApp} />
                </td>
                {row.toolHits.map((hit, index) => (
                  <td key={toolCounts[index].shortName}>
                    <span
                      className={hit ? 'coverage-dot on' : 'coverage-dot off'}
                      title={
                        hit
                          ? `${toolCounts[index].longName} parses this app`
                          : `${toolCounts[index].longName} does not parse this app`
                      }
                    />
                  </td>
                ))}
                <td className="coverage-count">{row.toolCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ToolCoverageMatrix;
