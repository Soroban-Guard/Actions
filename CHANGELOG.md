# Changelog

All notable changes to Soroban Guard Actions are documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Correct SARIF/JSON parsing: the action previously parsed the analyzer's JSON
  report as if it were SARIF (and vice versa), yielding a `score` of `N/A`, zero
  findings, and no annotations or PR comment. The action now always runs the
  analyzer in JSON mode for outputs/annotations/comments and generates a
  separate SARIF artifact for code-scanning upload. (#SARIF-schema)
- Inline annotations now point at the real source file and `line:col` for each
  finding, parsed from the analyzer's `Contract:line:col` locations.
- `min_severity` is now a reporting threshold and `fail_on` an independent
  failure threshold, matching the README. The analyzer is invoked with
  `--min-severity info` so lower-severity findings are available for
  `fail_on` decisions.
- Pinned the analyzer build to the published `soroban-guard-core` crate
  (v0.1.0) instead of an unpinned `git clone`, making builds reproducible.

### Added

- `fixtures/` with vulnerable (`token`, `amm_pair`, `escrow`) and secure
  (`vault`) sample contracts used by unit and end-to-end tests.
- End-to-end CI: the `test-action.yml` workflow now builds the Docker image and
  scans both fixture sets, asserting the vulnerable set fails and the secure
  baseline passes.
- `SECURITY.md`, `CONTRIBUTING.md`, issue/PR templates, and Dependabot
  configuration.
- Real syntax linting via `npm run lint` (replacing the previous no-op script).

## [0.1.0] - 2026-07-16

Initial release.

[Unreleased]: https://github.com/Soroban-Guard/Actions/compare/v1.0.0...HEAD
[0.1.0]: https://github.com/Soroban-Guard/Actions/releases/tag/v1.0.0