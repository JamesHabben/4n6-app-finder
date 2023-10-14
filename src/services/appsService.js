import { githubService } from 'services/githubService';
import { AuthState  } from 'AuthContext';
import jsonpatch from 'fast-json-patch';

export const appsService = {
    applyPatch: (originalDocument, patchDocument) => {
        try {
            const patchedDocument = jsonpatch.applyPatch(originalDocument, patchDocument).newDocument;
            return patchedDocument;
        } catch (error) {
            console.error('Error applying patch:', error);
            throw error;
        }
    },
    
    handleAdd: (apps, addToAppName, selectedArtifact) => {
        // ... logic for adding
    },

    handleCreate: async (apps, newRecord, authState) => {
        // Validate the record format
        const templateRecord = apps[0];
        if (!appsService.validateRecord(newRecord, templateRecord)) {
            alert('The record format is incorrect.');
            return;
        }
    
        const patch = [];
    
        // Determine if it's an update or a new record
        const existingAppIndex = apps.findIndex(app => app.appName.toLowerCase() === newRecord.appName.toLowerCase());
        if (existingAppIndex !== -1) {
            // It's an update
            const existingApp = apps[existingAppIndex];
            const updatePatch = jsonpatch.compare(existingApp, newRecord);
            patch.push(...updatePatch);
        } else {
            // It's a new record
            const addPatch = { op: "add", path: `/-`, value: newRecord };  
            patch.push(addPatch);
        }
    
        console.log("new record", newRecord)
        console.log('Patch:', patch);
    
        const service = githubService(authState.token, authState.username);
    
        const githubBranchName = 'datacontributions'
    
        const patchJson = JSON.stringify(patch, null, 4);
        const patchFileName = `${newRecord.appName.replace(/\s+/g, '_').toLowerCase()}.json`; 
        const filePath = `queue/${patchFileName}`;
        const commitMessage = 'New app suggestion via WebApp: ' + newRecord.appName;
        console.log("sending commit")
        await service.commitChanges(githubBranchName, patchJson, filePath, commitMessage);
        console.log("commit done")
        
        console.log("finding pr")
        const existingPR = await service.checkExistingPR(githubBranchName);
        console.log("find done")
        if (!existingPR) {
            const prTitle = 'WebApp Data Update from ' + authState.username;
            const prBody = 'Database updates from ' + authState.username;
            console.log("creating pr")
            await service.createPullRequest(githubBranchName, prTitle, prBody);
            console.log("pr done")
        }
    },
    
    validateRecord: (record, templateRecord) => {
        //console.log("new", record)
        //console.log("template", templateRecord)
        const recordKeys = Object.keys(record).sort();
        const templateKeys = Object.keys(templateRecord).sort();
        return JSON.stringify(recordKeys) === JSON.stringify(templateKeys);
    },

    getNewRecord: (apps) => {
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

        return newRecord;
    },
    
    isDupeName: (apps, newAppName) => {
        return apps.some(app => app.appName.toLowerCase() === newAppName.toLowerCase());
    }
}
