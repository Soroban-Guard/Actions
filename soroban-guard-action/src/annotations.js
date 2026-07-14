const core = require('@actions/core');
const fs = require('fs');

function createAnnotations() {
  const resultsPath = process.env.RESULTS_PATH || '/tmp/soroban-guard-results.json';
  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

  if (!results.findings) return;

  for (const finding of results.findings) {
    const level = finding.severity === 'critical' || finding.severity === 'high'
      ? 'error'
      : finding.severity === 'medium'
        ? 'warning'
        : 'notice';

    const file = finding.location?.file || '';
    const line = finding.location?.line || 1;
    const col = finding.location?.column || 0;

    core.notice(
      `[${finding.rule_id}] ${finding.message}`,
      {
        title: `Soroban Guard: ${finding.severity}`,
        file,
        line: parseInt(line),
        col: parseInt(col),
      }
    );
  }
}

createAnnotations();
