const core = require('@actions/core');
const { exec } = require('@actions/exec');
const { readFileSync } = require('fs');

async function run() {
  try {
    const path = core.getInput('path', { required: true });
    const format = core.getInput('format') || 'sarif';
    const minSeverity = core.getInput('min_severity') || 'high';
    const exclude = core.getInput('exclude') || '';
    const failOn = core.getInput('fail_on') || 'high';

    const args = [];

    if (exclude) {
      args.push('--exclude', exclude);
    }
    args.push('--min-severity', minSeverity);
    args.push('--format', format);
    args.push('--output', '/tmp/soroban-guard-results.json');

    console.log(`Running Soroban Guard on ${path}...`);
    const exitCode = await exec('soroban-guard', [path, ...args]);

    const resultsPath = '/tmp/soroban-guard-results.json';
    const results = JSON.parse(readFileSync(resultsPath, 'utf8'));

    const score = results.score ?? 'N/A';
    const critical = results.breakdown?.critical ?? 0;
    const high = results.breakdown?.high ?? 0;

    core.setOutput('score', score);
    core.setOutput('critical_count', critical);
    core.setOutput('high_count', high);
    core.setOutput('report_path', resultsPath);

    if (failOn === 'critical' && critical > 0) {
      core.setFailed(`Critical vulnerabilities found! Score: ${score}`);
    } else if (failOn === 'high' && high > 0) {
      core.setFailed(`High severity vulnerabilities found! Score: ${score}`);
    }

    process.exit(exitCode);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
