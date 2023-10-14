const fs = require('fs');
const path = require('path');
const simpleGit = require('simple-git');

const git = simpleGit();

// Directory paths
const queueDir = path.join(__dirname, 'queue');
const archiveDir = path.join(__dirname, 'archive');

async function applyPatches() {
  try {
    // Check out the datacontributions branch
    await git.checkout('datacontributions');

    // Get the list of patch files
    const patchFiles = fs.readdirSync(queueDir);

    // Check out the data branch
    await git.checkout('data');

    // Load the current apps-core.json file
    const appsCorePath = path.join(__dirname, 'apps-core.json');
    const appsCoreData = JSON.parse(fs.readFileSync(appsCorePath, 'utf-8'));

    // Apply each patch
    for (const patchFile of patchFiles) {
      const patchPath = path.join(queueDir, patchFile);
      const patchData = JSON.parse(fs.readFileSync(patchPath, 'utf-8'));

      // TODO: Apply the patch data to appsCoreData

      // Delete the patch file from the queue folder
      fs.unlinkSync(patchPath);

      // Move the patch file to the archive folder
      const archivePath = path.join(archiveDir, patchFile);
      fs.renameSync(patchPath, archivePath);
    }

    // Write the updated apps-core.json file
    fs.writeFileSync(appsCorePath, JSON.stringify(appsCoreData, null, 4));

    // Commit the changes to the data branch
    await git.add('./*');
    await git.commit('Apply patches');

    // Check out the datacontributions branch again
    await git.checkout('datacontributions');

    // Commit the changes to the datacontributions branch
    await git.add('./*');
    await git.commit('Move patches to archive');

  } catch (error) {
    console.error('Error applying patches:', error.message);
  }
}

// Run the script
applyPatches();
