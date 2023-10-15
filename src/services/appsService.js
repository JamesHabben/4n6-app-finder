import { githubService } from 'services/githubService';
import { AuthState  } from 'AuthContext';
import jsonpatch from 'fast-json-patch';

export const appsService = () => {
    const applyPatch = (appsArray, patchFile) => {
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
                const patchedApp = jsonpatch.applyPatch(appsArray[appIndex], patchFile.patch).newDocument;
                // Replace the original app with the patched app in the array
                const updatedAppsArray = [...appsArray];
                updatedAppsArray[appIndex] = patchedApp;
                return updatedAppsArray;  // Return the updated array
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
            
    const handleAdd = async (apps, addToAppName, selectedArtifact, authState) => {
        if (!Array.isArray(apps)) {
            console.error('apps is not an array');
            return;
        }
    
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
            await handleGithubPush(addToAppName, patchFile, authState);  // Assume this is async
            return 'Patch submitted successfully for addition.';
        } catch (error) {
            console.error('Error submitting patch:', error);
            throw new Error('Error submitting patch for addition.');
        }
    }

    const handleCreate = async (apps, newRecord, authState) => {
        const currentDate = new Date().toISOString().split('T')[0];
        newRecord.dateAdded = currentDate;

        const templateRecord = apps[0];
        if (!validateRecord(newRecord, templateRecord)) {
            alert('The record format is incorrect.');
            return;
        }
    
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

        //console.log("new record", newRecord)
        //console.log('Patch:', patch);
        //handleGithubPush(newRecord.appName, patchJson, authState)
        try {
            await handleGithubPush(newRecord.appName, patchFile, authState);  // Assume this is async
            return 'Patch submitted successfully for creation.';
        } catch (error) {
            console.error('Error submitting patch:', error);
            throw new Error('Error submitting patch for creation.');
        }
    }

    const handleGithubPush = async (appName, patch, authState) => {
        const service = githubService(authState.token, authState.username);
    
        const githubBranchName = 'datacontributions'
    
        const patchJson = JSON.stringify(patch, null, 4);
        const patchFileName = `${appName.replace(/\s+/g, '_').toLowerCase()}.json`; 
        const filePath = `queue/${patchFileName}`;
        const commitMessage = 'New app suggestion via WebApp: ' + appName;
        //console.log("sending commit")
        await service.commitChanges(githubBranchName, patchJson, filePath, commitMessage);
        //console.log("commit done")
        
        //console.log("finding pr")
        const existingPR = await service.checkExistingPR(githubBranchName);
        //console.log("find done")
        if (!existingPR) {
            const prTitle = 'WebApp Data Update from ' + authState.username;
            const prBody = 'Database updates from ' + authState.username;
            console.log("creating pr")
            await service.createPullRequest(githubBranchName, prTitle, prBody);
            console.log("pr done")
        }
    }
    
    const validateRecord = (record, templateRecord) => {
        //console.log("new", record)
        //console.log("template", templateRecord)
        const recordKeys = Object.keys(record).sort();
        const templateKeys = Object.keys(templateRecord).sort();
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

        keys.forEach(key => {
            if (Array.isArray(templateRecord[key])) {
                newRecord[key] = [];
            } else {
                newRecord[key] = "";
            }
        });

        console.log(newRecord)
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
