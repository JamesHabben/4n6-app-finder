import { githubService } from 'services/githubService';
import { AuthState  } from 'AuthContext';
import jsonpatch from 'fast-json-patch';

const excludeNewRecordProperties = ["artifactCount","mappedTools"]

export const appsService = () => {
    const applyPatch = (appsArray, patchFile) => {
        console.log(patchFile)
        const { action, appName, patch } = patchFile;  // Destructure the action and patch properties from the patchFile
        
        if (action === 'edit') {
            // Find the index of the app to be patched
            const appIndex = appsArray.findIndex(app => app.appName.toLowerCase() === appName.toLowerCase());
            if (appIndex === -1) {
                console.error(`No matching record found for appName: ${appName}`);
                return appsArray;  // Return the original array unmodified
            }
    
            try {
                // Apply the patch to the specific app
                //const patchedApp = jsonpatch.applyPatch(appsArray[appIndex], patch).newDocument;
                const appClone = JSON.parse(JSON.stringify(appsArray[appIndex]));
                const currentDate = new Date().toISOString().split('T')[0];
                appClone.dateUpdated = currentDate;
                console.log("app ", appClone)
                jsonpatch.applyPatch(appClone, patch)
                const updatedAppsArray = [...appsArray];
                updatedAppsArray[appIndex] = appClone;
                return updatedAppsArray; //updatedAppsArray;  // Return the updated array
                
            } catch (error) {
                console.error('Error applying patch:', error);
                throw error;
            }
    
        } else if (action === 'new') {
            // Handle the case for adding a new app
            try {
                const updatedAppsArray = jsonpatch.applyPatch(appsArray, patchFile.patch).newDocument;
                return updatedAppsArray;
            } catch (error) {
                console.error('Error applying new patch:', error);
                throw error;
            }
        } else {
            console.error(`Unknown action: ${action}`);
            return appsArray;  // Return the original array unmodified
        }
    };
            
    const handleAdd = async (apps, addToAppName, selectedArtifact, authState, terminal) => {
        if (!Array.isArray(apps)) {
            console.error('apps is not an array');
            return;
        }

        terminal(prevOutput => [...prevOutput, `Preparing patch file`]);
    
        const appIndex = apps.findIndex(app => app.appName.toLowerCase() === addToAppName.toLowerCase());
        
        if (appIndex === -1) {
            console.error('No matching record found for:', addToAppName);
            return;
        }
        
        const existingApp = apps[appIndex];
        const updatedApp = { ...existingApp, alternateNames: [...existingApp.alternateNames, selectedArtifact] };
        
        const patchDocument = jsonpatch.compare(existingApp, updatedApp);
        const patchFile = {
            action: 'edit', 
            appName: addToAppName, 
            patch: patchDocument  
        };
        //console.log('new record: ', updatedApp)
        //console.log('Patch Document:', JSON.stringify(patchDocument, null, 4));
        
        
        try {
            await handleGithubPush(addToAppName, patchFile, authState, terminal);
            return 'Patch submitted successfully for addition.';
        } catch (error) {
            console.error('Error submitting patch:', error);
            throw new Error('Error submitting patch for addition.');
        }
    }

    const handleCreate = async (apps, newRecord, artifactName, authState, terminal) => {
        const currentDate = new Date().toISOString().split('T')[0];
        newRecord.dateAdded = currentDate;

        terminal(prevOutput => [...prevOutput, `Preparing patch file`]);

        const templateRecord = apps[0];
        if (!validateRecord(newRecord, templateRecord)) {
            alert('The record format is incorrect.');
            return;
        }

        if (newRecord.appName !== artifactName && !newRecord.alternateNames.includes(artifactName)) {
            newRecord.alternateNames.push(artifactName);
        }
        //console.log(newRecord)
        //return;
    
        const patch = [];
        let patchFile;
    
        // Determine if it's an update or a new record
        const existingAppIndex = apps.findIndex(app => app.appName.toLowerCase() === newRecord.appName.toLowerCase());
        if (existingAppIndex !== -1) {
            // It's an update
            const existingApp = apps[existingAppIndex];
            const updatePatch = jsonpatch.compare(existingApp, newRecord);
            patch.push(...updatePatch);

            patchFile = {
                action: 'edit', 
                appName: newRecord.appName, 
                patch  
            };
        } else {
            // It's a new record
            const addPatch = { op: "add", path: `/-`, value: newRecord };  
            patch.push(addPatch);

            patchFile = {
                action: 'new',
                patch
            };
        }

        //console.log("new record: ", newRecord)
        //console.log('Patch:', patch);
        //return;
        try {
            await handleGithubPush(newRecord.appName, patchFile, authState, terminal);  // Assume this is async
            return 'Patch submitted successfully for creation.';
        } catch (error) {
            console.error('Error submitting patch:', error);
            throw new Error('Error submitting patch for creation.');
        }
    }

    const handleGithubPush = async (appName, patch, authState, terminal) => {
        const service = githubService(authState.token, authState.username);
    
        const now = new Date();
        const timestamp = Math.floor(now.getTime() / 100);

        const patchJson = JSON.stringify(patch, null, 4);
        const patchFileName = `${appName.replace(/[\s\/\\]+/g, '_').toLowerCase()}.${authState.username}.${timestamp}.json`; 
        terminal(prevOutput => [...prevOutput, `Patch filename: ${patchFileName}`]);
        const filePath = `queue/${patchFileName}`;
        const commitMessage = 'New app suggestion via WebApp: ' + appName;
        //console.log("sending commit")
        //await new Promise(resolve => setTimeout(resolve, 4000));
        //return;

        //console.log("auth ", authState.username, " own ", service.owner)
        if (authState.username == service.owner) {
            terminal(prevOutput => [...prevOutput, `Owner logged in. Preparing commit.`]);
            await service.commitChanges(service.patchBranch, patchJson, filePath, commitMessage, terminal);
            //terminal(prevOutput => [...prevOutput, `Commit Done`]);
        } else {
            // check for any existing PR to origin branch
            terminal(prevOutput => [...prevOutput, `Checking for existing pull request`]);
            const existingPR = await service.checkExistingPR(service.patchBranch);

            // get branch name from existing PR or create new branch name
            let branchName;
            if (existingPR) {
                // Existing PR found, extract the branch name
                branchName = existingPR.head.ref;
                terminal(prevOutput => [...prevOutput, `Existing pull request found, using branch: ${branchName}`]);
            } else {
                // No existing PR, create a new branch
                const timestamp = Date.now();
                branchName = `${authState.username}-${service.patchBranch}-${timestamp}`;
                terminal(prevOutput => [...prevOutput, `No existing pull request found, creating new branch: ${branchName}`]);
                await service.createBranch(service.patchBranch, branchName, authState.username);
            }

            terminal(prevOutput => [...prevOutput, `Preparing commit`]);
            await service.commitChanges(service.patchBranch, patchJson, filePath, commitMessage, terminal);
            //terminal(prevOutput => [...prevOutput, `Commit Done`]);
            
            //terminal(prevOutput => [...prevOutput, `Checking for existing pull request`]);
            //const existingPR = await service.checkExistingPR(service.patchBranch);
            //console.log("find done")
            if (!existingPR) {
                const prTitle = 'WebApp Data Update from ' + authState.username;
                const prBody = 'Database updates from ' + authState.username;
                terminal(prevOutput => [...prevOutput, `Preparing pull request`]);
                await service.createPullRequest(service.patchBranch, prTitle, prBody);
                terminal(prevOutput => [...prevOutput, `Pull request done`]);
            } else {
                terminal(prevOutput => [...prevOutput, `Pull request already exists, all done`]);
            }
        }
    }
    
    const validateRecord = (record, templateRecord) => {
        //console.log("new", record)
        //console.log("template", templateRecord)
        const recordKeys = Object.keys(record).filter(key => !excludeNewRecordProperties.includes(key)).sort();
        const templateKeys = Object.keys(templateRecord).filter(key => !excludeNewRecordProperties.includes(key)).sort();
        return JSON.stringify(recordKeys) === JSON.stringify(templateKeys);
    }

    const getNewRecord = async (apps) => {
        //console.log("creating new record")
        if (!apps || apps.length === 0) {
            console.log('Apps is null or undefined in getNewRecord');
            return;
        }
        //console.log(apps)
        const templateRecord = apps[0];
        const newRecord = {};
        const keys = Object.keys(templateRecord);
        const excludedKeys = new Set(excludeNewRecordProperties);
        const filteredKeys = keys.filter(key => !excludedKeys.has(key));

        filteredKeys.forEach(key => {
            if (Array.isArray(templateRecord[key])) {
                newRecord[key] = [];
            } else {
                newRecord[key] = "";
            }
        });

        //console.log(newRecord)
        return newRecord;
    }
    
    const isDupeName = (apps, newAppName) => {
        return apps.some(app => app.appName.toLowerCase() === newAppName.toLowerCase());
    }

    return {
        getNewRecord,
        applyPatch,
        isDupeName,
        handleAdd,
        handleCreate,
        validateRecord,
    }

}
