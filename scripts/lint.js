const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const srcDir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.js'));

let failed = 0;
for (const file of files) {
  const res = spawnSync(process.execPath, ['--check', path.join(srcDir, file)], {
    stdio: 'inherit',
  });
  if (res.status !== 0) failed += 1;
}

if (failed > 0) {
  console.error(`\n${failed} file(s) failed syntax check`);
  process.exit(1);
}
console.log(`Lint OK (${files.length} file(s) checked)`);