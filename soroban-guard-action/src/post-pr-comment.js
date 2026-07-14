const core = require('@actions/core');
const github = require('@actions/github');

async function postPRComment() {
  try {
    const token = core.getInput('token');
    const octokit = github.getOctokit(token);
    const context = github.context;

    const { owner, repo } = context.repo;
    const issueNumber = context.issue.number;

    if (!issueNumber) {
      console.log('Not a pull request, skipping PR comment.');
      return;
    }

    const score = core.getOutput('score');
    const critical = core.getOutput('critical_count');
    const high = core.getOutput('high_count');

    const body = [
      '## Soroban Guard Security Report',
      '',
      '| Metric | Value |',
      '|--------|-------|',
      `| Security Score | ${score}/100 |`,
      `| Critical Findings | ${critical} |`,
      `| High Findings | ${high} |`,
      '',
      `_Ran on commit ${context.sha}_`,
    ].join('\n');

    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body,
    });

    console.log('PR comment posted successfully.');
  } catch (error) {
    core.warning(`Failed to post PR comment: ${error.message}`);
  }
}

postPRComment();
