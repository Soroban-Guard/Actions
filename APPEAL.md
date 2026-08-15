# Appeal: Soroban-Guard/Actions Repo Application Rejection

**Program:** Stellar Wave Program (Drips Wave)
**Repository:** [Soroban-Guard/Actions](https://github.com/Soroban-Guard/Actions)
**Submitted via:** Maintainers → Orgs and Repos dashboard → Appeal (in-app only)
**Date:** 2026-08-15

---

## 1. Summary

This appeal requests reconsideration of the rejection of the
`Soroban-Guard/Actions` repository application to the Stellar Wave Program.
Since the rejection, we have made substantive changes to the codebase and
project quality. The improvements below address the categories reviewers weigh:
code correctness, project quality, activity, and relevance to the Stellar
ecosystem.

Soroban Guard is a **static analysis and security auditing tool for Soroban
smart contracts**. It ships as a GitHub Action and a Rust CLI that detect
reentrancy, arithmetic overflow, access-control flaws, and storage collisions
before contracts reach production. It is directly relevant to the Stellar
Wave Program: Soroban is Stellar's smart-contract platform, and contract
security is a core concern for every project building on it.

## 2. What has changed since the rejection

### 2.1 Code correctness (critical bug fixes)

- **Fixed SARIF/JSON parsing.** The action previously parsed the analyzer's
  JSON report as though it were SARIF and vice versa, producing a `score` of
  `N/A`, zero findings, no inline annotations, and no PR comment. It now runs
  the analyzer in JSON mode for all outputs and generates a proper SARIF
  artifact for GitHub code scanning. This makes the tool actually function as
  documented.
- **Fixed inline annotations.** Findings are now mapped to the correct source
  file and `line:col`, so `critical`/`high` render as errors, `medium` as
  warnings, and `low`/`info` as notices in the diff view.
- **Decoupled reporting and failure thresholds.** `min_severity` now controls
  what is reported, while `fail_on` independently gates CI failure. Previously
  a `fail_on` below the reporting threshold could never trigger.
- **Reproducible builds.** The Dockerfile now pins the published
  `soroban-guard-core` crate (v0.1.0) instead of an unpinned `git clone`,
  so every build of the action is identical and auditable.

### 2.2 Project quality and maintenance

- **End-to-end CI.** The test workflow now builds the Docker image and scans
  both a vulnerable fixture set (must fail) and a secure baseline (must pass).
  See [.github/workflows/test-action.yml](.github/workflows/test-action.yml).
- **Test fixtures.** Added `fixtures/` with realistic vulnerable contracts
  (`token`, `amm_pair`, `escrow`) and a clean baseline (`vault`), giving
  reviewers concrete evidence the tool detects real issues.
- **Expanded unit tests** from a single formatting check to 13 assertions
  covering the JSON schema, severity filtering, and annotations.
- **Real linting.** Replaced a no-op `lint` script with a genuine syntax check.
- **Documentation.** Added `SECURITY.md`, `CONTRIBUTING.md`, `CHANGELOG.md`,
  issue/PR templates, and Dependabot configuration for automated dependency
  updates.

### 2.3 Relevance to the Stellar ecosystem

Soroban Guard exists specifically to secure Soroban (Stellar's
smart-contract platform). It provides the Stellar ecosystem with:
- Free, automated contract auditing integrated directly into GitHub CI;
- Detection of the highest-impact vulnerability classes for Soroban contracts;
- A security-score (0–100) that lets maintainers track contract health over time.

This aligns directly with the Wave Program's goal of attracting contributors
and accelerating quality work across the Stellar open-source ecosystem. A
well-maintained security tool also creates good-first-issues for Wave
contributors (new detectors, rule tuning, parser coverage), making it a
valuable repository for the program.

## 3. Why the repository belongs in the program

- **It is actionable and self-contained.** Contributors can pick up concrete
  issues (new detection rules, false-positive reduction, fixture expansion)
  with clear acceptance criteria.
- **It has real users and a real security impact.** Contract teams across the
  Soroban ecosystem benefit directly from stronger automated auditing.
- **It is well maintained.** The project has a defined repository layout,
  test fixtures, CI, and contribution guidance — the infrastructure Wave
  contributors need to be productive.

## 4. Request

We respectfully request that the Stellar Wave Program review team re-evaluate
`Soroban-Guard/Actions` in light of the substantive improvements described
above. We are happy to provide additional detail, demo runs, or examples of
the action scanning real contracts.

Thank you for your time and consideration.