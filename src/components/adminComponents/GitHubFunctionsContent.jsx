import React, { useState, useEffect, useContext } from "react";
import { Modal, Button  } from 'antd';

import { githubService } from "services/githubService";
import { appsService } from "services/appsService";
import { AuthContext } from "AuthContext";


function GitHubFunctionsContent () {
    const {authState} = useContext(AuthContext);
    const [queueFilesCount, setQueueFilesCount] = useState(null);
    const [queueFilesList, setQueueFilesList] = useState(null);
    const [archiveFilesCount, setArchiveFilesCount] = useState(null);
    const [dataBranchStatus, setDataBranchStatus] = useState(null);
    const [dataBranchExists, setDataBranchExists] = useState(false);
    const [dataBranchUrl, setDataBranchUrl] = useState(null);
    const [dataPullRequest, setDataPullRequest] = useState(null);
    const [otherPullRequests, setOtherPullRequests] = useState([]);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
    const [terminalOutput, setTerminalOutput] = useState([]);
    const [isPerformingUpdate, setIsPerformingUpdate] = useState(false);

    useEffect(() => {
        if (authState && authState.token) {
            fetchData();
        }
        
    }, [authState]);

    const handleShowQueueListClick = () => {
        setIsQueueModalOpen(true);
    };

    const handleCloseQueueModal = () => {
        setIsQueueModalOpen(false);
    };

    const fetchData = async () => {
        try {
            const service = githubService(authState.token, authState.username);
            const queueFiles = await service.getFilesInFolder(service.patchBranch, 'queue');
            const archiveFiles = await service.getFilesInFolder(service.patchBranch, 'archive');
            const filteredQueueFiles = queueFiles.filter(file => !file.path.split('/').pop().startsWith('.'));
            const filteredArchiveFiles = archiveFiles.filter(file => !file.path.split('/').pop().startsWith('.'));
            setQueueFilesCount(filteredQueueFiles.length);
            setArchiveFilesCount(filteredArchiveFiles.length);
            setQueueFilesList(filteredQueueFiles)

            try {
                const dataBranch = await service.getBranch(service.dataBranch);
                if (dataBranch) {
                    setDataBranchExists(true);
                    setDataBranchUrl(service.getRepoWebUrl(`/tree/${service.dataBranch}`));

                    const comparison = await service.compareBranches(service.dataBranch, service.defaultBranch);
                    let statusElement;
                    if (comparison.isUpToDate) {
                        statusElement = 'Up to date';
                    } else {
                        statusElement = (
                            <>
                                <span>Not up to date. Ahead by {comparison.ahead_by}, behind by {comparison.behind_by}. </span>
                                {comparison.behind_by > 0 && <Button onClick={service.catchUpBranch}>Catch Up</Button>}
                            </>
                        );
                    }
                    setDataBranchStatus(statusElement);

                    const openPrs = await service.listOpenPullRequests();
                    const dataPr = openPrs.find(
                        (pr) => pr.head.ref === service.dataBranch && pr.base.ref === service.defaultBranch
                    ) || null;
                    const others = openPrs.filter((pr) => pr.id !== dataPr?.id);
                    setDataPullRequest(dataPr);
                    setOtherPullRequests(others);

                    if (dataPr?.number) {
                        const url = await service.getPreviewUrl(dataPr.number);
                        setPreviewUrl(url);
                    } else {
                        setPreviewUrl(null);
                    }
                } else {
                    setDataBranchExists(false);
                    setDataBranchUrl(null);
                    setDataPullRequest(null);
                    setOtherPullRequests([]);
                    setPreviewUrl(null);
                    setDataBranchStatus(
                        <>
                            <span>Data branch does not exist. </span>
                            <Button onClick={createDataBranch}>Create it now</Button>
                        </>
                    );
                }
            } catch (error) {
                
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    async function createDataBranch () {
        const service = githubService(authState.token, authState.username);
        await service.createBranch(service.defaultBranch, service.dataBranch);
        fetchData()
    }

    const handlePerformUpdateClick = async () => {
        setIsPerformingUpdate(true);
        await performUpdate();
        fetchData();
        setIsPerformingUpdate(false);
    };

    const performUpdate = async () => {
        setTerminalOutput(prevOutput => [...prevOutput, 'Starting data update...']);
        
        try {
            const service = githubService(authState.token, authState.username);
            
            //const appsCoreContent = await service.getFileContent(service.dataBranch, 'public/apps-core.json');
            const appsCoreContent = await service.getRawFileContent(service.owner, '4n6-app-finder', service.dataBranch, 'public/apps-core.json');
            console.log("get from gh ", appsCoreContent)
            let appsUpdate = JSON.parse(appsCoreContent);
            setTerminalOutput(prevOutput => [...prevOutput, `Fetched apps-core.json with ${Object.keys(appsUpdate.appsList).length} records.`]);
            
            for (let file of queueFilesList) {
                const patchContent = await service.getFileContent(service.patchBranch, file.path);
                const patchFile = JSON.parse(patchContent);
            
                const { action, appName, patch } = patchFile; 
            
                setTerminalOutput(prevOutput => [...prevOutput, `Applying ${action} ${file.path} patch...`]);
            
                if (action === 'edit') {
                    const appIndex = appsUpdate.appsList.findIndex(app => app.appName.toLowerCase() === appName.toLowerCase());
                    if (appIndex === -1) {
                        setTerminalOutput(prevOutput => [...prevOutput, `! No matching record found for appName: ${appName}. Skipping patch.`]);
                        continue;  // Skip to the next iteration of the loop
                    }
                    appsUpdate.appsList = appsService().applyPatch(appsUpdate.appsList, patchFile);
                } else if (action === 'new') {
                    appsUpdate.appsList = appsService().applyPatch(appsUpdate.appsList, patchFile);
                } else {
                    setTerminalOutput(prevOutput => [...prevOutput, `! Unknown action: ${action}. Skipping patch.`]);
                    continue;  // Skip to the next iteration of the loop
                }
            }
            //console.log("new apps", appsUpdate)
            setTerminalOutput(prevOutput => [...prevOutput, `Applied patches. AppsUpdate now has ${appsUpdate.appsList.length} records.`]);  // Use appsUpdate.length instead of Object.keys(appsUpdate).length
                        
            appsUpdate.appsList.sort((a, b) => {
                const nameA = a.appName.toUpperCase();
                const nameB = b.appName.toUpperCase();
                if (nameA < nameB) return -1;
                if (nameA > nameB) return 1;
                return 0;
            });
            // console.log(appsUpdate)
            // return;
            
            // Commit to dataBranch and create a pull request to the defaultBranch
            setTerminalOutput(prevOutput => [...prevOutput, `Committing apps-core.json on ${service.dataBranch} branch`]);
            await service.commitChanges(service.dataBranch, JSON.stringify(appsUpdate, null, 4), 'public/apps-core.json', 
                'Updated apps-core.json', setTerminalOutput);

            const today = new Date();
            const dataDate = [
                today.getFullYear(),
                String(today.getMonth() + 1).padStart(2, '0'),
                String(today.getDate()).padStart(2, '0'),
            ].join('-');
            const versionData = JSON.stringify({ dataDate }, null, 4);
            setTerminalOutput(prevOutput => [...prevOutput, `Updating version-data.json to ${dataDate}`]);
            await service.commitChanges(
                service.dataBranch,
                versionData,
                'public/version-data.json',
                `Updated version-data.json to ${dataDate}`,
                setTerminalOutput
            );
            
            setTerminalOutput(prevOutput => [...prevOutput, `Creating Pull Request from ${service.dataBranch} to ${service.defaultBranch}`]);
            const pullRequest = await service.createDataPullRequest('Update apps-core.json', 'Updated apps-core.json with new data');
            if (pullRequest?.html_url) {
                setTerminalOutput(prevOutput => [...prevOutput, `Pull request: ${pullRequest.html_url}`]);
            } else {
                setTerminalOutput(prevOutput => [...prevOutput, 'Committed updated apps-core.json and created pull request.']);
            }
            
            // move the files from queue to archive
            for (let file of queueFilesList) {
                setTerminalOutput(prevOutput => [...prevOutput, `Moving ${file.path} to archive...`]);
                await service.moveFile(service.patchBranch, file.path, file.path.replace('queue', 'archive'));
            }
            setTerminalOutput(prevOutput => [...prevOutput, 'Done moving processed files to archive folder.']);

            if (pullRequest?.number) {
                setTerminalOutput(prevOutput => [...prevOutput, 'Waiting for Vercel preview URL...']);
                const previewUrl = await service.waitForPreviewUrl(pullRequest.number, {
                    onAttempt: (attempt, maxAttempts) => {
                        if (attempt === 1 || attempt % 3 === 0) {
                            setTerminalOutput(prevOutput => [
                                ...prevOutput,
                                `Checking for preview deployment (${attempt}/${maxAttempts})...`,
                            ]);
                        }
                    },
                });
                if (previewUrl) {
                    setPreviewUrl(previewUrl);
                    setTerminalOutput(prevOutput => [...prevOutput, `Preview URL: ${previewUrl}`]);
                } else {
                    setTerminalOutput(prevOutput => [
                        ...prevOutput,
                        'Preview URL not found yet. Check the PR once the Vercel build finishes.',
                    ]);
                }
            }
    
        } catch (error) {
            console.error('Error performing update:', error.message);
            setTerminalOutput(prevOutput => [...prevOutput, `Error: ${error.message}`]);
        } finally {
            setIsPerformingUpdate(false);
        }
    };
    

    return (
        <div>
            <Button onClick={fetchData}>Refresh Data</Button>
            <div style={{ marginTop: '12px', marginBottom: '12px' }}>
                <p style={{ marginBottom: '6px' }}>
                    Data branch:{' '}
                    {dataBranchExists && dataBranchUrl ? (
                        <a href={dataBranchUrl} target="_blank" rel="noopener noreferrer">
                            {dataBranchUrl.split('/').pop()}
                        </a>
                    ) : (
                        'not found'
                    )}
                </p>
                <p style={{ marginBottom: '6px' }}>
                    Data PR:{' '}
                    {dataPullRequest ? (
                        <a href={dataPullRequest.html_url} target="_blank" rel="noopener noreferrer">
                            #{dataPullRequest.number} {dataPullRequest.title}
                        </a>
                    ) : (
                        'none open'
                    )}
                </p>
                <p style={{ marginBottom: '6px' }}>
                    Preview URL:{' '}
                    {previewUrl ? (
                        <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                            {previewUrl}
                        </a>
                    ) : dataPullRequest ? (
                        'not available yet'
                    ) : (
                        'none'
                    )}
                </p>
                <p style={{ marginBottom: '6px' }}>
                    Other open PRs:{' '}
                    {otherPullRequests.length === 0 ? (
                        'none'
                    ) : (
                        otherPullRequests.map((pr, index) => (
                            <span key={pr.id}>
                                {index > 0 && ', '}
                                <a href={pr.html_url} target="_blank" rel="noopener noreferrer">
                                    #{pr.number} {pr.title}
                                </a>
                            </span>
                        ))
                    )}
                </p>
            </div>
            <p>
                Queue files count: {queueFilesCount}{' '}
                {queueFilesCount > 0 && <Button onClick={handleShowQueueListClick} 
                    >Show List</Button>}
            </p>
            <p>Archive files count: {archiveFilesCount}</p>
            <p>Data branch status: {dataBranchStatus}</p>
            <h3>Data Update</h3>
            <Button 
                type="primary" 
                onClick={handlePerformUpdateClick} 
                disabled={!(queueFilesCount > 0 && dataBranchStatus === 'Up to date')}
                loading={isPerformingUpdate}
            >
                Perform Data Update and Create Pull Request
            </Button>
            <div style={{ border: '1px solid #ccc', padding: '10px', marginTop: '10px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                {terminalOutput.length ? terminalOutput.map((line, index) => {
                    const urlMatch = typeof line === 'string' && line.match(/https:\/\/[^\s]+/);
                    if (urlMatch) {
                        const url = urlMatch[0];
                        const [before] = line.split(url);
                        return (
                            <div key={index}>
                                {before}
                                <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
                            </div>
                        );
                    }
                    return <div key={index}>{line}</div>;
                }) : ''}
            </div>
            
            
            <Modal
                title="Patch Queue Files List"
                open={isQueueModalOpen}
                onCancel={() => setIsQueueModalOpen(false)}
                footer={null}
                //width={"80%"}
            >
                <ul>
                    {queueFilesCount ? queueFilesList.map(file => (
                        <li key={file.path}>{file.path.split('/').pop()}</li>
                    )) : ''}
                </ul>

            </Modal>
            
        </div>
    );}

export default GitHubFunctionsContent;
