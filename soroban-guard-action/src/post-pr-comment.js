const core = require('@actions/core');
const github = require('@actions/github');

async function postComment() {
  const token = core.getInput('token');
  const octokit = github.getOctokit(token);
  const context = github.context;

  if (!context.payload.pull_request) {
    console.log('Not a PR — skipping comment');
    return;
  }

  const fs = require('fs');
  const resultsPath = process.env.RESULTS_PATH || '/tmp/soroban-guard-results.json';
  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

  const body = formatComment(results);

  const { data: comments } = await octokit.rest.issues.listComments({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.payload.pull_request.number,
  });

  const botComment = comments.find(c =>
    c.user.type === 'Bot' && c.body.includes('Soroban Guard')
  );

  if (botComment) {
    await octokit.rest.issues.updateComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      comment_id: botComment.id,
      body,
    });
  } else {
    await octokit.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.payload.pull_request.number,
      body,
    });
  }
}

function formatComment(results) {
  const score = results.score || results.overall || 'N/A';
  const grade = score >= 90 ? '🟢' : score >= 70 ? '🟡' : score >= 50 ? '🟠' : '🔴';

  let table = `## ${grade} Soroban Guard Report\n\n`;
  table += `| Severity | Count |\n`;
  table += `|----------|------:|\n`;
  table += `| **Score** | **${score}/100** |\n`;

  if (results.breakdown) {
    table += `| Critical | ${results.breakdown.critical} |\n`;
    table += `| High | ${results.breakdown.high} |\n`;
    table += `| Medium | ${results.breakdown.medium} |\n`;
    table += `| Low | ${results.breakdown.low} |\n`;
  }

  if (results.findings && results.findings.length > 0) {
    table += `\n### Top Issues\n\n`;
    table += `| Rule | Severity | Message |\n`;
    table += `|------|----------|---------|\n`;

    results.findings
      .filter(f => ['critical', 'high'].includes(f.severity))
      .slice(0, 10)
      .forEach(f => {
        table += `| ${f.rule_id} | **${f.severity}** | ${f.message} |\n`;
      });
  }

  return table;
}

postComment().catch(err => {
  core.setFailed(err.message);
});
