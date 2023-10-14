import { githubService } from 'services/githubService';
import { AuthState  } from 'AuthContext';

export const appsService = {
    handleAdd: (apps, addToAppName, selectedArtifact) => {
        // ... logic for adding
    },

    handleCreate: async (apps, newRecord, authState) => {
        const appsCopy = JSON.parse(JSON.stringify(apps));

        // Validate the record format
        const templateRecord = apps[0];
        if (!appsService.validateRecord(newRecord, templateRecord)) {
            alert('The record format is incorrect.');
            return;
        }

        const insertIndex = appsCopy.findIndex(app => app.appName.toLowerCase() > newRecord.appName.toLowerCase());
        if (insertIndex === -1) {
            appsCopy.push(newRecord);
        } else {
            appsCopy.splice(insertIndex, 0, newRecord);
        }

        console.log("new record", newRecord)
        console.log('copy of apps:', appsCopy);

        const service = githubService(authState.token);

        const githubBranchName = 'data'

        const updatedJson = JSON.stringify(appsCopy, null, 4);
        const filePath = 'public/apps-core.json';
        const commitMessage = 'New app suggestion via WebApp: ' + newRecord.appName;
        console.log("sending commit")
        await service.commitChanges(githubBranchName, updatedJson, filePath, commitMessage);
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
        console.log("new", record)
        console.log("template", templateRecord)
        const recordKeys = Object.keys(record).sort();
        const templateKeys = Object.keys(templateRecord).sort();
        return JSON.stringify(recordKeys) === JSON.stringify(templateKeys);
    },

    getNewRecord: (apps) => {
        console.log("creating new record")
        if (!apps || apps.length === 0) {
            console.error('Apps is null or undefined in getNewRecord');
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
