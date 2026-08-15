const { formatComment } = require('./post-pr-comment');
const { createAnnotations } = require('./annotations');

let failures = 0;

function assert(condition, message) {
  if (!condition) {
    failures += 1;
    console.error(`  [FAIL] ${message}`);
  } else {
    console.log(`  [PASS] ${message}`);
  }
}

function testFormatCommentJsonSchema() {
  const report = {
    score: 72,
    breakdown: { critical: 1, high: 2, medium: 3, low: 5, info: 2 },
    findings: [
      {
        rule_id: 'R-01',
        severity: 'critical',
        message: 'Reentrancy in withdraw',
        location: 'Vault:42:5',
      },
    ],
  };

  const comment = formatComment(report);

  assert(comment.includes('72/100'), 'includes score');
  assert(comment.includes('B'), 'includes grade B');
  assert(comment.includes('Critical'), 'includes critical count');
  assert(comment.includes('R-01'), 'includes finding rule ID');
  assert(comment.includes('Reentrancy'), 'includes finding message');

  const empty = formatComment({ score: 'N/A', breakdown: {}, findings: [] });
  assert(empty.includes('N/A/100'), 'handles missing score');
}

function testFormatCommentStringScore() {
  const comment = formatComment({
    score: 'N/A',
    breakdown: { critical: 0, high: 0, medium: 0, low: 0 },
    findings: [],
  });
  assert(comment.includes('N/A/100'), 'string score renders as N/A');
}

function testSeverityFiltering() {
  const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'];

  const valueOf = s => {
    const idx = SEVERITY_ORDER.indexOf(String(s || '').toLowerCase());
    return idx === -1 ? SEVERITY_ORDER.length : idx;
  };

  const filter = (findings, min) => {
    const t = valueOf(min);
    return findings.filter(f => valueOf(f.severity) <= t);
  };

  const findings = [
    { severity: 'critical' },
    { severity: 'high' },
    { severity: 'medium' },
    { severity: 'low' },
    { severity: 'info' },
  ];

  assert(filter(findings, 'high').length === 2, 'min_severity=high keeps critical+high');
  assert(filter(findings, 'medium').length === 3, 'min_severity=medium keeps critical+high+medium');
  assert(filter(findings, 'info').length === 5, 'min_severity=info keeps all');
}

function testAnnotations() {
  const calls = [];
  const fakeCore = {
    error: (msg, ann) => calls.push({ level: 'error', msg, ann }),
    warning: (msg, ann) => calls.push({ level: 'warning', msg, ann }),
    notice: (msg, ann) => calls.push({ level: 'notice', msg, ann }),
  };

  const report = {
    reports: [
      {
        file: 'contracts/vault.rs',
        findings: [
          { severity: 'critical', rule_id: 'R-01', message: 'reentrancy', location: 'Vault:42:5' },
          { severity: 'medium', rule_id: 'O-01', message: 'overflow', location: 'Vault:10:3' },
          { severity: 'low', rule_id: 'S-02', message: 'generic key', location: 'Vault:5:1' },
        ],
      },
    ],
  };

  const original = {};
  for (const k of ['error', 'warning', 'notice']) {
    original[k] = global.core ? global.core[k] : undefined;
  }
  createAnnotations(report, 'medium', fakeCore);

  assert(calls.length === 2, 'min_severity=medium filters to 2 annotations');
  const error = calls.find(c => c.level === 'error');
  assert(error && error.ann.file === 'contracts/vault.rs', 'annotation carries source file');
  assert(error && error.ann.line === 42 && error.ann.col === 5, 'annotation parses line:col');
}

testFormatCommentJsonSchema();
testFormatCommentStringScore();
testSeverityFiltering();
testAnnotations();

if (failures > 0) {
  console.error(`\n${failures} test(s) failed`);
  process.exit(1);
}
console.log('\nAll tests passed');