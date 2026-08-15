# Contributing

Thanks for your interest in contributing to Soroban Guard. This document covers
the `Actions` repository. See also the [Core](https://github.com/Soroban-Guard/Core)
repository for the Rust analyzer engine.

## Getting started

1. Fork the repository and clone your fork.
2. Install Node.js 20+ and run `npm install`.
3. Run the tests: `node src/test.js` and the linter: `npm run lint`.

## Project layout

- `src/main.js` — action entry point; runs the analyzer, sets outputs, posts
  annotations and comments, uploads SARIF.
- `src/annotations.js` — maps findings to check-run annotations.
- `src/post-pr-comment.js` — formats and posts the PR summary comment.
- `src/test.js` — unit tests (no framework required).
- `fixtures/` — sample contracts used to exercise the action in CI.
- `Dockerfile` — builds the action image and the bundled analyzer binary.

## Making changes

1. Create a feature branch: `git checkout -b feat/my-change`.
2. Make your change. Keep it focused; match the existing code style (2-space
   indent, no semicolon-free style changes, arrow functions).
3. Add or update tests in `src/test.js`. If you change fixtures, keep the
   "secure" baseline genuinely clean.
4. Run `node src/test.js` and `npm run lint`.
5. Commit with a concise, descriptive message and open a pull request.

## Verifying the action end-to-end

The `test-action.yml` workflow builds the Docker image and scans both the
vulnerable and secure fixture sets. You can reproduce locally:

```sh
docker build -t soroban-guard-action .
docker run --rm -e INPUT_PATH=/github/workspace/fixtures/secure \
  -e INPUT_FORMAT=json -e INPUT_UPLOAD_SARIF=false \
  -v "$PWD":/github/workspace soroban-guard-action
```

## Reporting issues

Use the issue templates in `.github/ISSUE_TEMPLATE/`. For security issues,
follow [SECURITY.md](SECURITY.md).

## Code of conduct

Be respectful and constructive. Harassment or discrimination of any kind is not
tolerated.