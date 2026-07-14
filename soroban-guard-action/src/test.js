function testFormatComment() {
  const results = {
    overall: 72,
    breakdown: { critical: 1, high: 2, medium: 3, low: 5, info: 2 },
    findings: [
      { rule_id: 'R-01', severity: 'critical', message: 'Reentrancy in withdraw', location: { file: 'vault.rs', line: 42, column: 5 } }
    ]
  };

  const annotations = [];
  for (const finding of results.findings) {
    annotations.push({
      path: finding.location.file,
      start_line: finding.location.line,
      end_line: finding.location.line,
      annotation_level: 'failure',
      message: `[${finding.rule_id}] ${finding.message}`,
    });
  }

  console.log('Test passed:', annotations.length === 1);
  console.log(JSON.stringify(annotations, null, 2));
}

testFormatComment();
