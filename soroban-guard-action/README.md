# Soroban Guard GitHub Action

Run [Soroban Guard](https://github.com/your-org/soroban-guard) static analysis on your Soroban smart contracts in CI/CD.

## Features

- 🔍 **Automated security scanning** on every PR
- 📝 **PR comments** with formatted results summary
- 🏷️ **Check run annotations** inline in your diffs
- 📊 **Security score** tracking over time
- 🔗 **Code scanning** via SARIF upload
- 🚫 **Fail CI** on configurable severity thresholds

## Usage

### Basic

```yaml
name: Security Audit
on: [pull_request]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: your-org/soroban-guard-action@v1
        with:
          path: contracts/
```

### Full configuration

```yaml
name: Security Audit
on: [pull_request, push]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: your-org/soroban-guard-action@v1
        id: guard
        with:
          path: |
            contracts/
            src/
          exclude: '**/test_*,**/fixtures/*'
          format: sarif
          min_severity: medium
          fail_on: high
          upload_sarif: true
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Check score
        run: |
          echo "Security score: ${{ steps.guard.outputs.score }}"
          if [[ "${{ steps.guard.outputs.score }}" -lt 70 ]]; then
            echo "Score below threshold!"
            exit 1
          fi
```

### Monorepo setup

```yaml
name: Security Audit
on: [pull_request]
jobs:
  audit:
    strategy:
      matrix:
        contract-path: [contracts/vault, contracts/nft, contracts/amm]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: your-org/soroban-guard-action@v1
        with:
          path: ${{ matrix.contract-path }}
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `path` | Yes | `.` | Contract source path(s) |
| `format` | No | `sarif` | Output format |
| `min_severity` | No | `high` | Minimum severity to report |
| `exclude` | No | `''` | Exclusion glob patterns |
| `upload_sarif` | No | `true` | Upload to code scanning |
| `fail_on` | No | `high` | Severity that fails CI |
| `token` | No | `github.token` | GitHub token |

## Outputs

| Output | Description |
|--------|-------------|
| `score` | Overall security score (0-100) |
| `critical_count` | Number of critical findings |
| `high_count` | Number of high findings |
| `report_path` | Path to SARIF report |

## Code scanning integration

When `upload_sarif: true`, results appear in GitHub's **Security > Code scanning** tab.

## License

MIT
