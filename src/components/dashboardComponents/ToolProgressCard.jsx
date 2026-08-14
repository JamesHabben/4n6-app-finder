import React from 'react';
import { Card, Progress } from 'antd';
import { useQueries } from '@tanstack/react-query';
import { mappedAppsFor } from 'services/DataContext';

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

const ProgressBarCard = ({ tools }) => {
  const artifactQueries = useQueries({
    queries: tools.map(tool => ({
      queryKey: ['tool-artifacts', tool.toolShortName],
      queryFn: () => fetchJson(`/${tool.artifactListFile}`),
      staleTime: Infinity,
      enabled: Boolean(tool.artifactListFile),
    })),
  });

  return (
    <Card title="Artifact Mapping Progress" style={{ width: '450px' }}>
      {tools.map((tool, index) => {
        const artifactList = artifactQueries[index]?.data;
        const totalArtifacts = artifactList?.length;
        const mappedArtifacts = artifactList
          ? artifactList.filter(artifact => mappedAppsFor(tool.artifactMap?.[artifact[tool.appNameKey]]).length > 0).length
          : tool.mappedNameCount;
        const percentMapped = totalArtifacts
          ? ((mappedArtifacts / totalArtifacts) * 100).toFixed(2)
          : 0;

        return (
          <div key={tool.toolShortName} style={{ marginBottom: '0rem' }}>
            <div style={{display:'flex', alignItems:'center'}}>
                <h3 style={{marginBottom: '0rem', marginTop: '0rem', marginRight: '0.5rem'}}>{tool.toolLongName}</h3>
                <span>
                  {artifactQueries[index]?.isPending
                    ? `(${tool.mappedNameCount} mapped names)`
                    : `(${totalArtifacts} total artifacts)`}
                </span>
            </div>
            <Progress
              percent={parseFloat(percentMapped)}
              status="active"
              showInfo={true}
            />
          </div>
        );
      })}
    </Card>
  );
};

export default ProgressBarCard;
