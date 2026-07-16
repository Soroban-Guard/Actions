const core = require('@actions/core');
const { exec } = require('@actions/exec');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');
const { createAnnotations } = require('./annotations');
const { postComment } = require('./post-pr-comment');

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'];

function getSeverityValue(severity) {
  const idx = SEVERITY_ORDER.indexOf(severity);
  return idx === -1 ? SEVERITY_ORDER.length : idx;
}

function shouldFail(failOn, findings) {
  const threshold = getSeverityValue(failOn);
  return findings.some(f => getSeverityValue(f.severity) <= threshold);
}

async function uploadSarif(octokit, owner, repo, sarifPath, commitSha, ref) {
  if (!fs.existsSync(sarifPath)) return;

  const sarif = fs.readFileSync(sarifPath, 'base64');
  await octokit.rest.codeScanning.uploadSarif({
    owner,
    repo,
    commit_sha: commitSha,
    ref,
    sarif,
    tool_name: 'Soroban Guard',
  });
}

async function run() {
  try {
    const inputPath = core.getInput('path', { required: true });
    const format = core.getInput('format') || 'sarif';
    const minSeverity = core.getInput('min_severity') || 'high';
    const exclude = core.getInput('exclude') || '';
    const failOn = core.getInput('fail_on') || 'high';
    const token = core.getInput('token') || process.env.GITHUB_TOKEN || '';
    const uploadSarifFlag = core.getBooleanInput('upload_sarif');

    const ext = format === 'sarif' ? '.sarif' : '.json';
    const resultsPath = `/tmp/soroban-guard-results${ext}`;

    const args = ['--min-severity', minSeverity, '--format', format, '--output', resultsPath];
    if (exclude) args.push('--exclude', exclude);

    core.info(`Running Soroban Guard on ${inputPath}...`);
    const exitCode = await exec('soroban-guard', [inputPath, ...args], { ignoreReturnCode: true });

    if (!fs.existsSync(resultsPath)) {
      core.setFailed('Soroban Guard did not produce output');
      return;
    }

    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    const score = results.score ?? 'N/A';
    const critical = results.breakdown?.critical ?? 0;
    const high = results.breakdown?.high ?? 0;

    core.setOutput('score', score);
    core.setOutput('critical_count', critical);
    core.setOutput('high_count', high);
    core.setOutput('report_path', resultsPath);

    const findings = results.findings || [];
    createAnnotations(resultsPath);

    const octokit = token ? github.getOctokit(token) : null;
    if (octokit && github.context.payload.pull_request) {
      await postComment(octokit, results);
    }

    if (octokit && uploadSarifFlag && format === 'sarif') {
      const { owner, repo } = github.context.repo;
      await uploadSarif(octokit, owner, repo, resultsPath, github.context.sha, github.context.ref);
    }

    if (shouldFail(failOn, findings)) {
      core.setFailed(
        `Soroban Guard found ${findings.length} issues at or above severity "${failOn}". Score: ${score}`
      );
    } else if (exitCode !== 0) {
      process.exit(exitCode);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
