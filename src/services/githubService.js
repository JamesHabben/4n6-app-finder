import { Octokit } from '@octokit/rest';
import { Base64 } from 'js-base64';

const owner = 'JamesHabben';
const repo = '4n6-app-finder';
const patchBranch = 'datacontributions';
const dataBranch = 'data'
const defaultBranch = 'main'

const latestCommitCache = {
    sha: null,
    timestamp: null,
};

export const githubService = (token, username) => {
    const octokit = new Octokit({ auth: token });

    const checkUserElevation = async (username) => {
        try {
          // Check if user is the owner of the repository
          //const repoData = await octokit.repos.get({ owner });
          if (owner === username) {
            return 'owner';
          }
    
          // Check if user is a contributor to the repository
          const contributors = await octokit.repos.listContributors({ owner, repo });
          const isContributor = contributors.data.some(contributor => contributor.login === username);
          if (isContributor) {
            return 'contributor';
          }
    
          return 'public';
        } catch (error) {
          console.error('Error checking user elevation:', error);
          throw error;
        }
    }

    const getFilesInFolder = async (branch, folderPath) => {
        try {
            // First, get the tree SHA for the specified branch
            const { data: branchData } = await octokit.git.getRef({
                owner,
                repo,
                ref: `heads/${branch}`
            });
            const treeSha = branchData.object.sha;
            
            // Now, use the tree SHA to get the tree, which will include the folder
            const { data: treeData } = await octokit.git.getTree({
                owner,
                repo,
                tree_sha: treeSha,
                recursive: 1  // This will get all files in the tree recursively
            });
    
            // Filter out the files that are in the specified folder
            const filesInFolder = treeData.tree.filter(item => {
                return item.path.startsWith(`${folderPath}/`) && item.type === 'blob';
            });
    
            return filesInFolder;
        } catch (error) {
            console.error('Error getting files:', error.message);
            throw error;
        }
    };

    function decodeBase64(data) {
        try {
            // Decode base64 string to bytes
            let bytes = Uint8Array.from(atob(data), c => c.charCodeAt(0));
    
            // Convert bytes to text with proper UTF-8 encoding
            let text = new TextDecoder().decode(bytes);
    
            return text;
        } catch (e) {
            console.error('Failed to decode base64 string:', e);
            return null;
        }
    }

    function base64Decode(str) {
        try {
            // Decode base64 string
            let base64 = atob(str);
    
            // Convert base64 to text with proper UTF-8 encoding
            let text = decodeURIComponent(escape(base64));
    
            return text;
        } catch (e) {
            console.error('Failed to decode base64 string:', e);
            return null;
        }
    }

    const getFileContent = async (branch, filePath) => {
        try {
            const { data: tree } = await octokit.git.getTree({
                owner,
                repo,
                tree_sha: branch,
                recursive: 1
            });
    
            const fileBlob = tree.tree.find(file => file.path === filePath);
            if (!fileBlob) {
                throw new Error('File not found');
            }
    
            const { data: blob } = await octokit.git.getBlob({
                owner,
                repo,
                file_sha: fileBlob.sha
            });
            console.log("blob data ", blob)
            
            const text = Base64.decode(blob.content);
            return text;
            //return decodeBase64(blob.content);  // decode from base64
        } catch (error) {
            console.error('Error getting file content:', error.message);
            throw error;
        }
    };

    async function getRawFileContent(user, repo, branch, filename) {
        const url = `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${filename}`;
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/vnd.github.v3.raw',
                'Accept-Charset': 'utf-8'
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }
        //console.log(response.body)
        const content = await response.text();
        return content;
    }
    

    const moveFile = async (branch, oldPath, newPath) => {
        try {
            // Get the content of the old file
            const { data: oldFile } = await octokit.repos.getContent({
                owner,
                repo,
                path: oldPath,
                ref: branch,
            });
            
            // Create the new file with the old file's content
            await octokit.repos.createOrUpdateFileContents({
                owner,
                repo,
                path: newPath,
                message: `Move ${oldPath} to ${newPath}`,
                content: oldFile.content,
                branch,
            });
            
            // Delete the old file
            await octokit.repos.deleteFile({
                owner,
                repo,
                path: oldPath,
                message: `Delete ${oldPath}`,
                sha: oldFile.sha,
                branch,
            });
        } catch (error) {
            console.error('Error moving file:', error);
            throw error;
        }
    };
    
    
    
    const getBranch = async (branchName) => {
        try {
            const { data } = await octokit.repos.getBranch({
                owner,
                repo,
                branch: branchName,
            });
            return data; 
        } catch (error) {
            //console.error('Error getting branch:', error.message);
            //throw error;
            return null;
        }
    };

    const createBranch_old = async (baseBranch, newBranchName, username = owner) => {
        try {
          const { data: { object: { sha: latestCommitSha } } } = await octokit.git.getRef({
            owner: owner,
            repo,
            ref: `heads/${defaultBranch}`,
          });
          //console.log("before createref")
          await octokit.git.createRef({
            owner: username,
            repo,
            ref: `refs/heads/${newBranchName}`,
            sha: latestCommitSha,
          });
          //console.log("after createref")
        } catch (error) {
          console.error('Error creating branch:', error);
        }
    }

    const createBranch = async (oldBranchName, newBranchName, username = owner) => {
        try {
            // Get the latest commit SHA from the 'datacontributions' branch
            const { data: { object: { sha: latestCommitSha } } } = await octokit.git.getRef({
                owner: owner,  // Use the repository owner's username here
                repo,
                ref: `heads/${oldBranchName}`,
            });
    
            // Create a new branch from the 'datacontributions' branch
            await octokit.git.createRef({
                owner: username,
                repo,
                ref: `refs/heads/${newBranchName}`,
                sha: latestCommitSha,
            });
        } catch (error) {
            console.error('Error creating branch:', error);
            throw error;  // Propagate the error to be handled by the calling code
        }
    }
            

    const checkBranchExists = async (branchName) => {
        try {
            const { data } = await octokit.repos.getBranch({
                owner: username,
                repo: repo,
                branch: branchName,
            });
            return !!data;
        } catch (error) {
            console.error('Error checking branch:', error);
            return false;
        }
    }

    const isBranchUpToDate = async (headBranch, baseBranch) => {
        try {
            const comparison = await octokit.repos.compareCommits({
                owner,
                repo,
                base: baseBranch,
                head: headBranch
            });
            //console.log(comparison)
            // If the behind_by value is 0, the head branch is up-to-date with the base branch
            return comparison.data.behind_by === 0;
        } catch (error) {
            console.error('Error comparing branches:', error.message);
            throw error;
        }
    };

    const compareBranches = async (headBranch, baseBranch) => {
        try {
            const comparison = await octokit.repos.compareCommits({
                owner,
                repo,
                base: baseBranch,
                head: headBranch
            });
            return {
                isUpToDate: comparison.data.behind_by === 0,
                ahead_by: comparison.data.ahead_by,
                behind_by: comparison.data.behind_by,
            };
        } catch (error) {
            console.error('Error comparing branches:', error.message);
            throw error;
        }
    };
    
    const catchUpBranch = async () => {
        //console.log("catch up")
        try {
            await mergeBranches(dataBranch, defaultBranch);
            // Refresh the branch comparison after the merge
            const comparison = await compareBranches(dataBranch, defaultBranch);
            return(comparison.isUpToDate ? 'Up to date' : `Not up to date. Ahead by ${comparison.ahead_by}, behind by ${comparison.behind_by}.`);
        } catch (error) {
            console.error('Error catching up branch:', error.message);
        }
    };

    const mergeBranches = async (baseBranch, headBranch) => {
        try {
            const response = await octokit.repos.merge({
                owner,
                repo,
                base: baseBranch, // the branch you want to merge into
                head: headBranch, // the branch you want to merge
            });
            //console.log('Merge response:', response);
        } catch (error) {
            console.error('Error merging branches:', error.message);
            throw error;
        }
    };
    
    


    const commitChanges = async (branchName, fileContent, filePath, commitMessage, terminal) => {
        return new Promise(async (resolve, reject) => {
            let retries = 0;
            const maxRetries = 6;
            const retryInterval = 11000; 

            const attemptCommit = async () => {
                try {
                    terminal(prevOutput => [...prevOutput, 'Creating blob...']);
                    const { data: { sha: blobSha } } = await octokit.git.createBlob({
                        owner: username,
                        repo: repo,
                        content: fileContent,
                        encoding: 'utf-8',
                    });
                    terminal(prevOutput => [...prevOutput, `Blob created: ${blobSha}`]);

                    terminal(prevOutput => [...prevOutput, 'Fetching latest commit SHA from events...']);
                    // const { data: { object: { sha: latestCommitSha } } } = await octokit.git.getRef({
                    //     owner: username,
                    //     repo: repo,
                    //     ref: `heads/${branchName}`,
                    // });

                    // const { data: commits } = await octokit.repos.listCommits({
                    //     owner: username,
                    //     repo: repo,
                    //     sha: branchName,  // filter by branch
                    //     per_page: 1,  // only need the most recent commit
                    // });
                    // const latestCommitSha = commits[0].sha;

                    // const response = await octokit.activity.listRepoEvents({ owner, repo, per_page: 5 }); 
                    // console.log(response.data);

                    // const { data } = await octokit.repos.getBranch({
                    //     owner: username,
                    //     repo: repo,
                    //     branch: branchName
                    // });
                    // const latestCommitSha = data.commit.sha;
                    let latestCommitSha;
                    const currentTime = new Date().getTime();
                    if (latestCommitCache.sha && (currentTime - latestCommitCache.timestamp) < 60000) {
                        latestCommitSha = latestCommitCache.sha;  // Use cached SHA if it's within the last minute
                        terminal(prevOutput => [...prevOutput, `Using session last commit SHA: ${latestCommitSha}`]);
                    } else {
                        try {
                            const response = await octokit.activity.listRepoEvents({
                                owner: username,
                                repo: repo,
                                per_page: 1
                            });
                            latestCommitSha = response.data[0]?.payload?.head;  // Assuming the latest event is a push event
                        } catch (error) {
                            terminal(prevOutput => [...prevOutput, `Error fetching latest commit SHA from Events API: ${error.message}`]);
                        }
                    

                        if (!latestCommitSha) {
                            terminal(prevOutput => [...prevOutput, 'Fetching latest commit SHA from getRef...']);
                            const { data: { object: { sha } } } = await octokit.git.getRef({
                                owner: username,
                                repo: repo,
                                ref: `heads/${branchName}`,
                            });
                            latestCommitSha = sha;
                        }
                        terminal(prevOutput => [...prevOutput, `Latest commit SHA: ${latestCommitSha}`]);
                    }

                    terminal(prevOutput => [...prevOutput, 'Creating tree...']);
                    const { data: { sha: treeSha } } = await octokit.git.createTree({
                        owner: username,
                        repo: repo,
                        base_tree: latestCommitSha,
                        tree: [
                            {
                                path: filePath,
                                mode: '100644',
                                type: 'blob',
                                sha: blobSha,
                            },
                        ],
                    });
                    terminal(prevOutput => [...prevOutput, `Tree created: ${treeSha}`]);

                    terminal(prevOutput => [...prevOutput, 'Creating commit...']);
                    const { data: commitData } = await octokit.git.createCommit({
                        owner: username,
                        repo: repo,
                        message: commitMessage,
                        tree: treeSha,
                        parents: [latestCommitSha],
                    });
                    terminal(prevOutput => [...prevOutput, `Commit created: ${commitData.sha}`]);

                    terminal(prevOutput => [...prevOutput, 'Updating reference...']);
                    await octokit.git.updateRef({
                        owner: username,
                        repo: repo,
                        ref: `heads/${branchName}`,
                        sha: commitData.sha,
                        force: false,
                    });
                    latestCommitCache.sha = commitData.sha;
                    latestCommitCache.timestamp = currentTime;
                    terminal(prevOutput => [...prevOutput, `Branch updated: ${branchName}`]);
                    resolve();
                } catch (error) {
                    terminal(prevOutput => [...prevOutput, `Error committing changes: ${error.message}`]);
                    if (retries < maxRetries) {
                        retries++;
                        terminal(prevOutput => [...prevOutput, `Retrying in ${retryInterval / 1000} seconds... Retry ${retries}/${maxRetries}`]);
                        setTimeout(attemptCommit, retryInterval);
                    } else {
                        terminal(prevOutput => [...prevOutput, '! Max retries reached. Commit failed.']);
                        reject(error);
                    }
                }
            };

            await attemptCommit();
        });
    }

    const createPullRequest = async (branchName, title, body, baseBranch = patchBranch) => {
        if (username == owner) {
            console.log("owner logged in, no need for PR")
            return;
        }
        try {
            await octokit.pulls.create({
                owner: owner,
                repo: repo,
                title: title,
                body: body,
                head: `${username}:${branchName}`,
                base: branchName,
            });
        } catch (error) {
            console.error('Error creating pull request:', error);
        }
    }

    const createDataPullRequest = async (title, body) => {
        try {
            await octokit.pulls.create({
                owner: owner,
                repo: repo,
                title: title,
                body: body,
                head: dataBranch,
                base: defaultBranch,
            });
        } catch (error) {
            console.error('Error creating pull request:', error);
        }
    }


    const checkExistingPR = async (branchName) => {
        try {
            const { data: prList } = await octokit.pulls.list({
                owner: owner,  // Change from username to owner to check the original repo
                repo: repo,
                state: 'open',
                head: `${username}:${branchName}`
            });
            return prList.find(pr => pr.base.ref === patchBranch && pr.head.ref === branchName) || null;
        } catch (error) {
            console.error('Error checking existing PR:', error);
            throw error;
        }
    };
    
    const checkRepoExists = async () => {
        try {
            const { data } = await octokit.repos.get({
                owner: username,
                repo: repo,
            });
            return !!data;
        } catch (error) {
            console.error('Error checking repository:', error);
            return false;
        }
    }
    
    

    return {
        patchBranch,
        dataBranch,
        defaultBranch,
        owner,
        createBranch,
        commitChanges,
        createPullRequest,
        createDataPullRequest,
        checkExistingPR,
        checkRepoExists,
        checkBranchExists,
        checkUserElevation,
        getFilesInFolder,
        getBranch,
        isBranchUpToDate,
        compareBranches,
        catchUpBranch,
        getFileContent,
        getRawFileContent,
        moveFile,
    }
}
