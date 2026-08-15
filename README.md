# Soroban Guard GitHub Action

[![GitHub release](https://img.shields.io/github/v/release/Soroban-Guard/Actions)](https://github.com/Soroban-Guard/Actions/releases)
[![Test](https://github.com/Soroban-Guard/Actions/actions/workflows/test-action.yml/badge.svg)](https://github.com/Soroban-Guard/Actions/actions/workflows/test-action.yml)
[![MIT License](https://img.shields.io/github/license/Soroban-Guard/Actions)](LICENSE)

Static analysis and security auditing for Soroban smart contracts. Integrates into GitHub Actions to detect reentrancy, arithmetic overflow, access control flaws, storage collisions, and other vulnerabilities before they reach production.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Usage](#usage)
- [Inputs](#inputs)
- [Outputs](#outputs)
- [Architecture](#architecture)
- [Severity levels](#severity-levels)
- [Integrations](#integrations)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Automated scanning** — runs on every push or pull request with no configuration beyond a workflow file.
- **Inline annotations** — findings are annotated directly on the affected lines in the diff view.
- **PR summaries** — a formatted comment with score, severity breakdown, and top findings is posted on each pull request.
- **Security score (0–100)** — quantifies overall contract health and tracks regressions over time.
- **SARIF upload** — feeds results into GitHub's Security > Code Scanning tab for historical tracking.
- **Configurable thresholds** — CI failure can be gated on severity level or score value.
- **Monorepo support** — multiple contract workspaces can be scanned in parallel using a build matrix.
- **Exclusion rules** — test fixtures, generated code, and third-party contracts can be skipped via glob patterns.
- **Multi-format output** — results can be produced in human-readable, JSON, or SARIF format.

## Prerequisites

- A GitHub repository containing Soroban smart contracts written in Rust.
- GitHub Actions enabled on the repository.

## Quick start

Create `.github/workflows/audit.yml`:

```yaml
name: Security Audit
on: [pull_request]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Soroban-Guard/Actions@v1
        with:
          path: contracts/
```

On every pull request, Soroban Guard scans `contracts/` and fails the check if high-severity findings are present.

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
      - uses: Soroban-Guard/Actions@v1
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
      - uses: Soroban-Guard/Actions@v1
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
      - uses: Soroban-Guard/Actions@v1
        with:
          path: ${{ matrix.contract-path }}
```

### Pre-commit scan

```yaml
name: Pre-commit Security Scan
on:
  pull_request:
    types: [opened, synchronize, reopened]
jobs:
  precommit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: Soroban-Guard/Actions@v1
        id: guard
        with:
          path: contracts/
          format: json
          fail_on: critical

      - name: Post summary
        if: always()
        run: |
          echo "## Soroban Guard Summary" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "- **Score**: ${{ steps.guard.outputs.score }}/100" >> $GITHUB_STEP_SUMMARY
          echo "- **Critical**: ${{ steps.guard.outputs.critical_count }}" >> $GITHUB_STEP_SUMMARY
          echo "- **High**: ${{ steps.guard.outputs.high_count }}" >> $GITHUB_STEP_SUMMARY
```

### Fail conditions

| `fail_on` value | CI fails when |
|-----------------|---------------|
| `critical`      | One or more critical findings exist |
| `high`          | One or more high findings exist (default) |
| `medium`        | One or more medium or higher findings exist |
| `low`           | Any finding exists |

Score-based gating can be added as a post-step:

```yaml
- name: Enforce score threshold
  if: always()
  run: |
    SCORE=${{ steps.guard.outputs.score }}
    if [ "$SCORE" -lt 80 ]; then
      echo "Score $SCORE is below minimum 80"
      exit 1
    fi
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `path` | Yes | `.` | Path(s) to Soroban contract source files or directories. Supports newline-separated list for multiple paths. |
| `format` | No | `sarif` | Output format for `report_path`: `human`, `json`, or `sarif`. `sarif` is uploaded to code scanning when `upload_sarif` is enabled. |
| `min_severity` | No | `high` | Minimum severity to report: `critical`, `high`, `medium`, `low`, `info`. Findings below this threshold are omitted from annotations and comments. |
| `exclude` | No | `''` | Comma-separated glob patterns of files to skip (e.g. `**/test_*,**/fixtures/*`). |
| `upload_sarif` | No | `true` | Upload SARIF results to GitHub code scanning. |
| `token` | No | `github.token` | GitHub token for SARIF upload and PR comment posting. |
| `fail_on` | No | `high` | Severity level that causes the action to fail: `critical`, `high`, `medium`, `low`. Independent of `min_severity`. |

## Outputs

| Output | Description |
|--------|-------------|
| `score` | Overall security score (0–100). Higher values indicate fewer or less severe findings. |
| `critical_count` | Number of critical-severity findings. |
| `high_count` | Number of high-severity findings. |
| `report_path` | Filesystem path to the generated SARIF or JSON report. |

## Architecture

Soroban Guard is a Docker-based action built in two stages:

1. **Builder stage** — installs the published [`soroban-guard-core`](https://crates.io/crates/soroban-guard-core) crate (v0.1.0) and copies the compiled Rust analyzer binary into a `node:20-slim` image alongside the Node.js orchestrator (`src/main.js`).
2. **Runtime stage** — `entrypoint.sh` invokes `node src/main.js`, which runs the analyzer in JSON mode to compute the score and findings, sets outputs, posts PR comments, creates inline annotations, generates a SARIF artifact for code scanning, and enforces the `fail_on` threshold.

The Node.js layer uses `@actions/core`, `@actions/exec`, and `@actions/github` for all GitHub API interactions.

### Test fixtures

The `fixtures/` directory contains sample Soroban contracts used by the test suite and CI: vulnerable contracts (`token`, `amm_pair`, `escrow`) that should produce findings, and a secure baseline (`vault`) that should pass. See [fixtures/README.md](fixtures/README.md).

## Project ecosystem

Soroban Guard consists of three repositories that work together:

| Repo | Description |
|------|-------------|
| [Soroban-Guard/Actions](https://github.com/Soroban-Guard/Actions) | GitHub Action for CI/CD integration (this repo) |
| [Soroban-Guard/Core](https://github.com/Soroban-Guard/Core) | Rust static analyzer engine and CLI |
| [Soroban-Guard/VS](https://github.com/Soroban-Guard/VS) | VS Code extension for inline analysis |

## Severity levels

| Level | Description |
|-------|-------------|
| **critical** | Exploitable vulnerabilities that can lead to loss of funds or contract compromise (e.g. reentrancy, missing access control). |
| **high** | Bugs likely exploitable or violating core security assumptions (e.g. arithmetic overflow, unsafe unwraps). |
| **medium** | Logic errors or design issues exploitable in edge cases. |
| **low** | Code quality or best-practice violations with limited security impact. |
| **info** | Suggestions and observations with no direct security impact. |

## Integrations

### Code scanning

When `upload_sarif: true` (default), results are uploaded to GitHub's Security > Code Scanning tab, providing historical tracking and regression detection across branches.

### PR comments

In pull request contexts, a summary comment containing the security score, severity breakdown, and top 10 findings is posted and updated on subsequent pushes.

### Check annotations

Each finding is mapped to a GitHub check annotation on the affected file and line:

- `critical` / `high` &rarr; error
- `medium` &rarr; warning
- `low` / `info` &rarr; notice

Annotations appear directly in the Files changed tab of a pull request.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, style, and testing guidance.
Source files for the action logic are in `src/`. The Rust analyzer source is
maintained in the [Soroban-Guard/Core](https://github.com/Soroban-Guard/Core)
repository.

## License

MIT
