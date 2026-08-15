const core = require('@actions/core');
const { exec } = require('@actions/exec');
const github = require('@actions/github');
const fs = require('fs');
const { createAnnotations } = require('./annotations');
const { postComment } = require('./post-pr-comment');

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'];

function getSeverityValue(severity) {
  const idx = SEVERITY_ORDER.indexOf(String(severity || '').toLowerCase());
  return idx === -1 ? SEVERITY_ORDER.length : idx;
}

function filterBySeverity(findings, minSeverity) {
  const threshold = getSeverityValue(minSeverity);
  return findings.filter(f => getSeverityValue(f.severity) <= threshold);
}

function shouldFail(failOn, findings) {
  return filterBySeverity(findings, failOn).length > 0;
}

function normalizeReport(raw) {
  const breakdown = raw.total_score?.breakdown ?? raw.breakdown ?? {};
  return {
    score: raw.total_score?.overall ?? raw.score ?? 'N/A',
    grade: raw.total_score?.grade ?? raw.grade ?? 'N/A',
    breakdown,
    findings: raw.all_findings ?? raw.findings ?? [],
    reports: raw.reports ?? [],
    summary: raw.summary ?? '',
  };
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

    const jsonPath = '/tmp/soroban-guard-results.json';
    const args = ['--min-severity', 'info'];
    if (exclude) args.push('--exclude', exclude);

    core.info(`Running Soroban Guard on ${inputPath}...`);
    await exec('soroban-guard', [inputPath, ...args, '--format', 'json', '--output', jsonPath], {
      ignoreReturnCode: true,
    });

    if (!fs.existsSync(jsonPath)) {
      core.setFailed('Soroban Guard did not produce output');
      return;
    }

    const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const report = normalizeReport(raw);

    core.setOutput('score', report.score);
    core.setOutput('critical_count', report.breakdown.critical ?? 0);
    core.setOutput('high_count', report.breakdown.high ?? 0);

    let reportPath = jsonPath;
    let sarifPath = null;

    if (format === 'sarif') {
      sarifPath = '/tmp/soroban-guard-results.sarif';
      await exec('soroban-guard', [inputPath, ...args, '--sarif', '--output', sarifPath], {
        ignoreReturnCode: true,
      });
      reportPath = sarifPath;
    } else if (format === 'human') {
      const humanPath = '/tmp/soroban-guard-results.txt';
      await exec('soroban-guard', [inputPath, ...args, '--format', 'human', '--output', humanPath], {
        ignoreReturnCode: true,
      });
      reportPath = humanPath;
    }

    if (uploadSarifFlag && !sarifPath) {
      sarifPath = '/tmp/soroban-guard-results.sarif';
      await exec('soroban-guard', [inputPath, ...args, '--sarif', '--output', sarifPath], {
        ignoreReturnCode: true,
      });
    }

    core.setOutput('report_path', reportPath);

    createAnnotations(raw, minSeverity);

    const octokit = token ? github.getOctokit(token) : null;
    if (octokit && github.context.payload.pull_request) {
      await postComment(octokit, report);
    }

    if (octokit && uploadSarifFlag && sarifPath) {
      const { owner, repo } = github.context.repo;
      await uploadSarif(octokit, owner, repo, sarifPath, github.context.sha, github.context.ref);
    }

    if (shouldFail(failOn, report.findings)) {
      const count = filterBySeverity(report.findings, failOn).length;
      core.setFailed(
        `Soroban Guard found ${count} issue(s) at or above severity "${failOn}". Score: ${report.score}`
      );
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();