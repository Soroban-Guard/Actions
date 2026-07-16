const { formatComment } = require('./post-pr-comment');

function assert(condition, message) {
  if (!condition) {
    console.error(`  [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`  [PASS] ${message}`);
}

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

  assert(comment.includes('72/100'), 'includes score');
  assert(comment.includes('Critical'), 'includes critical count');
  assert(comment.includes('R-01'), 'includes finding rule ID');
  assert(comment.includes('Reentrancy'), 'includes finding message');

  console.log('\nAll tests passed');
}

testFormatComment();
