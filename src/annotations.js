const core = require('@actions/core');
const fs = require('fs');

function annotationLevel(severity) {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    default:
      return 'notice';
  }
}

function createAnnotations(resultsPath) {
  if (!fs.existsSync(resultsPath)) return;

  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  if (!results.findings) return;

  for (const finding of results.findings) {
    const file = finding.location?.file || '';
    const line = parseInt(finding.location?.line, 10) || 1;
    const col = parseInt(finding.location?.column, 10) || 0;

    const annotation = {
      title: `Soroban Guard: ${finding.severity}`,
      file,
      line,
      col,
    };

    const message = `[${finding.rule_id}] ${finding.message}`;

    switch (annotationLevel(finding.severity)) {
      case 'error':
        core.error(message, annotation);
        break;
      case 'warning':
        core.warning(message, annotation);
        break;
      default:
        core.notice(message, annotation);
    }
  }
}

module.exports = { createAnnotations };
