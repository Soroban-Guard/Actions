const coreModule = require('@actions/core');

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'];

function getSeverityValue(severity) {
  const idx = SEVERITY_ORDER.indexOf(String(severity || '').toLowerCase());
  return idx === -1 ? SEVERITY_ORDER.length : idx;
}

function annotationLevel(severity) {
  switch (String(severity).toLowerCase()) {
    case 'critical':
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    default:
      return 'notice';
  }
}

function parseLocation(location) {
  const parts = String(location || '').split(':');
  if (parts.length >= 3) {
    const line = parseInt(parts[parts.length - 2], 10) || 1;
    const col = parseInt(parts[parts.length - 1], 10) || 0;
    return { line, col };
  }
  return { line: 1, col: 0 };
}

function createAnnotations(report, minSeverity, core) {
  const reporter = core || coreModule;
  const threshold = getSeverityValue(minSeverity);
  if (!report || !Array.isArray(report.reports)) return;

  for (const entry of report.reports) {
    const file = entry.file || '';
    for (const finding of entry.findings || []) {
      if (getSeverityValue(finding.severity) > threshold) continue;

      const { line, col } = parseLocation(finding.location);
      const annotation = {
        title: `Soroban Guard: ${finding.severity}`,
        file,
        line,
        col,
      };

      const message = `[${finding.rule_id}] ${finding.message}`;

      switch (annotationLevel(finding.severity)) {
        case 'error':
          reporter.error(message, annotation);
          break;
        case 'warning':
          reporter.warning(message, annotation);
          break;
        default:
          reporter.notice(message, annotation);
      }
    }
  }
}

module.exports = { createAnnotations };