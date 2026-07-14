const { formatComment } = require('./post-pr-comment');

function testFormatComment() {
  const results = {
    score: 72,
    breakdown: { critical: 1, high: 2, medium: 3, low: 5, info: 2 },
    findings: [
      {
        rule_id: 'R-01',
        severity: 'critical',
        message: 'Reentrancy in withdraw',
        location: { file: 'vault.rs', line: 42, column: 5 },
      },
    ],
  };

  const comment = formatComment(results);

  const checks = [
    { name: 'contains score', pass: comment.includes('72/100') },
    { name: 'contains critical count', pass: comment.includes('Critical') },
    { name: 'contains finding info', pass: comment.includes('R-01') },
    { name: 'contains reentrancy message', pass: comment.includes('Reentrancy') },
  ];

  let allPassed = true;
  for (const check of checks) {
    const status = check.pass ? 'PASS' : 'FAIL';
    if (!check.pass) allPassed = false;
    console.log(`  [${status}] ${check.name}`);
  }

  console.log(`\n${allPassed ? 'All tests passed' : 'Some tests failed'}`);
  process.exit(allPassed ? 0 : 1);
}

testFormatComment();
