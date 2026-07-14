# Soroban Guard — Explained Like You're 10

Imagine you build a treehouse. You want to make sure it's safe before your friends climb in. You check the wood, the nails, the rope ladder — everything.

**Soroban Guard** is like a safety inspector for code that runs on the Stellar blockchain (called "smart contracts"). It checks for problems before the code goes live so nobody gets hurt (or loses money).

## What this repo does

This repo is a **GitHub Action**. Think of a GitHub Action like a robot assistant that does a chore automatically whenever you push code to GitHub. This particular robot:

1. **Looks at your smart contract code** — code that runs on the Stellar blockchain
2. **Checks it for bugs and security holes** — things like "can someone steal money?" or "can someone crash the program?"
3. **Tells you what it found** — it posts a report right on your pull request so you can fix things before merging

## How it works (the simple version)

```
You push code  →  GitHub wakes up the robot  →  Robot inspects your code
                                                        ↓
                              Robot writes a report and posts it on your PR
```

## The three repos

This project is split into three parts that work together:

1. **Actions** (this repo) — the GitHub robot that runs automatically when you push code
2. **Core** — the Rust brain that does the actual security analysis (the smart inspector)
3. **VS** — a VS Code extension so you can check contracts without leaving your editor

## The different parts of this repo

- **`action.yml`** — the robot's instruction manual. Tells GitHub what inputs the robot needs (like which folder to scan).
- **`Dockerfile`** — the recipe for building the robot. It gets the Rust compiler and Node.js runtime and puts them together in one package.
- **`entrypoint.sh`** — the script that runs when the robot starts. It calls the actual security checker program.
- **`src/`** — JavaScript files that help the robot talk to GitHub (post comments, create annotations, upload reports).
- **`examples/`** — sample YAML files showing how to use the robot in different ways.
- **`marketplace.json`** — a description file for the GitHub Marketplace so people can find this action.

## What it checks for

- **Reentrancy** — like a shopping cart bug where someone can buy the same item twice without paying
- **Overflow** — like a score counter that wraps back to zero instead of stopping at the max
- **Access control** — like a clubhouse door that lets anyone in, not just members
- **Storage collisions** — like two people writing in the same notebook page at the same time

## Who should use it

Anyone building Soroban smart contracts on Stellar who wants to catch bugs before they become disasters.

## Why it exists

Blockchain code can't be easily fixed after it's deployed — it's like launching a rocket. Once it's up there, you can't go back and tighten a screw. Soroban Guard checks everything *before* launch.
