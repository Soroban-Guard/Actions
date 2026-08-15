# Security Policy

## Reporting a vulnerability

Soroban Guard is a security tool: issues can have security impact for the
projects that use it. Please report suspected vulnerabilities privately.

**Do not open a public issue.** Instead, email the maintainers at
`codeenigma112@gmail.com` with:

- A description of the vulnerability and its impact.
- The affected component (`Actions`, `Core`, or `VS`) and version.
- Steps to reproduce, if known.

You should receive an acknowledgement within 72 hours. We will coordinate a
disclosure timeline with you.

## Scope

In scope: the Soroban Guard repositories (`Actions`, `Core`, `VS`) and the
packaged GitHub Action/Docker image.

Out of scope: vulnerabilities in contracts scanned by the tool. Those belong to
the affected project, not Soroban Guard.

## Supported versions

| Version | Supported          |
|---------|--------------------|
| v1.x    | :white_check_mark: |
| < 1.0   | :x:                |