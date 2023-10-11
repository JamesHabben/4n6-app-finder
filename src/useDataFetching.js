import { useEffect, useState } from 'react';

export function useDataFetching() {
  const [apps, setApps] = useState([]);
  const [tools, setTools] = useState([]);
  const [artifacts, setArtifacts] = useState({})
  const [isLoadingTools, setIsLoadingTools] = useState(true);

  const fetchArtifacts =  (appName, toolsData, appsData) => {
    console.log('toolsData', toolsData)
    console.log('apps data:', apps)
    const toolArtifacts = toolsData.flatMap(tool =>
      tool.artifactList.filter(toolApp =>
        appName === toolApp[tool.appNameKey] ||
        (appsData.find(app => app.appName === appName)?.alternateNames || []).includes(toolApp[tool.appNameKey])
      )
      .map(toolApp => ({ ...toolApp, toolName: tool.toolLongName, toolIcon: tool.icon, toolWebsite: tool.website }))
    );
    console.log('Tool Artifacts for', appName, toolArtifacts);
    return toolArtifacts;
  };

  useEffect(() => {
    fetch('/apps-core.json')
      .then((response) => response.json())
      .then((data) => {
        setApps(data.sort((a, b) => a.appName.localeCompare(b.appName)));
      });

    fetch('/tools.json')
      .then((response) => response.json())
      .then((data) => {
        console.log('Fetched tools.json');
        const promises = data.map((tool) =>
          fetch(`/${tool.artifactListFile}`)
            .then((response) => response.json())
            .then((artifactList) => ({ ...tool, artifactList }))
        );
        Promise.all(promises).then(toolsData => {
          setTools(toolsData.sort((a, b) => a.toolLongName.localeCompare(b.toolLongName)));
          console.log('Set tools data');
          setIsLoadingTools(false);
        });
      });
  }, []);

  return { apps, tools, fetchArtifacts };
}
