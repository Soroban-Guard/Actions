const github = require('@actions/github');

function gradeFor(score) {
  if (typeof score !== 'number' || Number.isNaN(score)) return 'N/A';
  return score >= 90 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : 'D';
}

function formatComment(results) {
  const score = typeof results.score === 'number' ? results.score : 'N/A';
  const grade = gradeFor(results.score);
  const breakdown = results.breakdown || {};

  let body = `## Soroban Guard Report\n\n`;
  body += `| Metric | Value |\n`;
  body += `|--------|------:|\n`;
  body += `| **Score** | **${score}/100 (${grade})** |\n`;
  body += `| Critical | ${breakdown.critical ?? 0} |\n`;
  body += `| High | ${breakdown.high ?? 0} |\n`;
  body += `| Medium | ${breakdown.medium ?? 0} |\n`;
  body += `| Low | ${breakdown.low ?? 0} |\n`;

  const findings = results.findings || [];
  if (findings.length > 0) {
    body += `\n### Top Findings\n\n`;
    body += `| Rule | Severity | Message |\n`;
    body += `|------|----------|---------|\n`;

    findings
      .filter(f => ['critical', 'high'].includes(String(f.severity).toLowerCase()))
      .slice(0, 10)
      .forEach(f => {
        body += `| ${f.rule_id} | **${f.severity}** | ${f.message} |\n`;
      });
  }

  return body;
}

async function postComment(octokit, results) {
  const context = github.context;

  if (!context.payload.pull_request) {
    console.log('Not a PR — skipping comment');
    return;
  }

  const body = formatComment(results);

  const { data: comments } = await octokit.rest.issues.listComments({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.payload.pull_request.number,
  });

  const botComment = comments.find(c =>
    c.user.type === 'Bot' && c.body && c.body.includes('Soroban Guard Report')
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

module.exports = { postComment, formatComment };