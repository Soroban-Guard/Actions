const core = require('@actions/core');
const github = require('@actions/github');
const { readFileSync } = require('fs');

async function createAnnotations() {
  try {
    const token = core.getInput('token');
    const octokit = github.getOctokit(token);
    const context = github.context;

    const resultsPath = '/tmp/soroban-guard-results.json';
    const results = JSON.parse(readFileSync(resultsPath, 'utf8'));

    if (!results.findings || results.findings.length === 0) {
      console.log('No findings to annotate.');
      return;
    }

    const annotations = results.findings.map((finding) => ({
      path: finding.path || context.payload?.pull_request?.head?.repo?.name || '.',
      start_line: finding.line || 1,
      end_line: finding.line || 1,
      annotation_level: finding.severity === 'critical' ? 'failure'
        : finding.severity === 'high' ? 'failure'
        : finding.severity === 'medium' ? 'warning'
        : 'notice',
      message: `[${finding.severity.toUpperCase()}] ${finding.rule_id || 'SG-000'}: ${finding.message}`,
      title: 'Soroban Guard',
    }));

    const { owner, repo } = context.repo;

    const checkRun = await octokit.checks.create({
      owner,
      repo,
      name: 'Soroban Guard',
      head_sha: context.sha,
      status: 'completed',
      conclusion: results.score >= 80 ? 'success' : 'neutral',
      output: {
        title: 'Soroban Guard Security Analysis',
        summary: `Score: ${results.score}/100 — ${results.findings.length} finding(s)`,
        annotations,
      },
    });

    console.log(`Check run created: ${checkRun.data.html_url}`);
  } catch (error) {
    core.warning(`Failed to create annotations: ${error.message}`);
  }
}

createAnnotations();
