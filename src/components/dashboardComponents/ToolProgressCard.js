import React from 'react';
import { Card, Progress } from 'antd';
import { inline } from '@rc-component/portal/es/mock';

const ProgressBarCard = ({ tools }) => {
  return (
    <Card title="Artifact Mapping Progress" style={{ width: '450px' }}>
      {tools.map((tool, index) => {
        const totalArtifacts = tool.artifactList.length;
        const mappedArtifacts = tool.artifactList.filter(artifact => artifact.isMapped === 'true').length;
        const percentMapped = ((mappedArtifacts / totalArtifacts) * 100).toFixed(2);

        return (
          <div key={index} style={{ marginBottom: '0rem' }}>
            <div style={{display:'flex', alignItems:'center'}}>
                <h3 style={{marginBottom: '0rem', marginTop: '0rem', marginRight: '0.5rem'}}>{tool.toolLongName}</h3> 
                <span>({tool.artifactList.length} total artifacts)</span>
            </div>
            <Progress 
              percent={parseFloat(percentMapped)} 
              status="active" 
              showInfo={true} 
              //format={percent} //=> `${percent}% Mapped`} 
            />
          </div>
        );
      })}
    </Card>
  );
};

export default ProgressBarCard;
