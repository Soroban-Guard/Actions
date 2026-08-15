# Test fixtures

Fixture contracts used by the test suite and CI to exercise Soroban Guard against
realistic Rust source.

| Path | Purpose |
|------|---------|
| `vulnerable/token.rs` | Unchecked arithmetic, missing auth on `mint`, generic storage keys. |
| `vulnerable/amm_pair.rs` | Checks-effects-interactions violation (state written after external call), division by a variable divisor, unchecked arithmetic. |
| `vulnerable/escrow.rs` | Missing authorization on an admin function, hardcoded address fallback, unchecked arithmetic. |
| `secure/vault.rs` | Security baseline: auth checks, checked arithmetic, typed storage keys, reentrancy guard. Should produce no high-severity findings. |

Run the analyzer against the vulnerable set to confirm detections:

```sh
soroban-guard fixtures/vulnerable --format json --min-severity info
```

Expected findings include: `R-01`/`R-03` (reentrancy), `O-01`/`O-03` (arithmetic),
`A-01`/`A-02`/`A-05` (access control).