import { Octokit } from '@octokit/rest';

const owner = 'JamesHabben';
const repo = '4n6-app-finder';
const baseBranch = 'main';

export const githubService = (token) => {
    const octokit = new Octokit({ auth: token });

    const createBranch = async (newBranchName) => {
        try {
          const { data: { object: { sha: latestCommitSha } } } = await octokit.git.getRef({
            owner,
            repo,
            ref: `heads/${baseBranch}`,
          });
    
          await octokit.git.createRef({
            owner,
            repo,
            ref: `refs/heads/${newBranchName}`,
            sha: latestCommitSha,
          });
        } catch (error) {
          console.error('Error creating branch:', error);
        }
    }

    const commitChanges = async (branchName, fileContent, filePath, commitMessage) => {
        try {
            const { data: { sha: blobSha } } = await octokit.git.createBlob({
                owner: owner,
                repo: repo,
                content: fileContent,
                encoding: 'utf-8',
            });
            console.log('Blob created:', blobSha);

            const { data: { object: { sha: latestCommitSha } } } = await octokit.git.getRef({
                owner: owner,
                repo: repo,
                ref: `heads/${branchName}`,
            });
            console.log('Latest commit SHA:', latestCommitSha);

            const { data: { sha: treeSha } } = await octokit.git.createTree({
                owner: owner,
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
            console.log('Tree created:', treeSha);

            const { data: commitData } = await octokit.git.createCommit({
                owner: owner,
                repo: repo,
                message: commitMessage,
                tree: treeSha,
                parents: [latestCommitSha],
            });
            console.log('Commit created:', commitData);

            await octokit.git.updateRef({
                owner: owner,
                repo: repo,
                ref: `heads/${branchName}`,
                sha: commitData.sha,
                force: false,  
            });
            console.log('Branch updated:', branchName);

        } catch (error) {
            console.error('Error committing changes:', error);
        }
    }

    const createPullRequest = async (newBranchName, title, body) => {
        try {
            await octokit.pulls.create({
                owner: owner,
                repo: repo,
                title: title,
                body: body,
                head: newBranchName,
                base: baseBranch,
            });
        } catch (error) {
            console.error('Error creating pull request:', error);
        }
    }

    const checkExistingPR = async (branchName) => {
        const { data } = await octokit.pulls.list({
            owner: owner,
            repo: repo,
            state: 'open',
            head: `${owner}:${branchName}`
        });
        return data.some(pr => pr.head.ref === branchName);
    }

    return {
        createBranch,
        commitChanges,
        createPullRequest,
        checkExistingPR
    }
}
