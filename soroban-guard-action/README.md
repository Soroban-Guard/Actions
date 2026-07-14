# Soroban Guard GitHub Action

Static analysis and security auditing for Soroban smart contracts. This action wraps the `soroban-guard` CLI tool in a Docker container and provides inline feedback on pull requests.

## Usage

```yaml
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: your-org/soroban-guard-action@v1
        with:
          path: contracts/
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `path` | Path(s) to Soroban contract source files or directories | yes | `.` |
| `format` | Output format (human, json, sarif) | no | `sarif` |
| `min_severity` | Minimum severity to report | no | `high` |
| `exclude` | Comma-separated glob patterns to exclude | no | `""` |
| `upload_sarif` | Upload SARIF results to GitHub code scanning | no | `true` |
| `token` | GitHub token for PR comments and code scanning | no | `${{ github.token }}` |
| `fail_on` | Severity level that causes workflow failure | no | `high` |

## Outputs

| Output | Description |
|--------|-------------|
| `score` | Overall security score (0-100) |
| `critical_count` | Number of critical findings |
| `high_count` | Number of high findings |
| `report_path` | Path to the generated SARIF report |

## Examples

See [examples/basic.yml](examples/basic.yml) and [examples/full.yml](examples/full.yml).
