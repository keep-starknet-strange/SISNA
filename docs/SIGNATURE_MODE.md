# Session Signature Mode

SISNA supports two signing modes for Dfns-backed session signing.

## Configuration

Set environment variable `SESSION_SIGNATURE_MODE`:

- `v1_hash` (default) - Legacy `kind=Hash` flow
- `v2_snip12` - SNIP-12 typed data flow with `kind=Snip12`

Example:
```
SESSION_SIGNATURE_MODE=v2_snip12
DFNS_API_KEY=...
DFNS_KEY_ID=...
VERIFICATION_KEY=...
```

## v2 SNIP-12 behavior

- Canonical SNIP-12 typed payload is built from session request
- Domain: name=SISNA, version=1, revision=1, chainId normalized
- Dfns is called with `kind=Snip12`
- Returned signature is verified locally against configured verification key
- Structured logs include `signature_mode`, `request_id`, `domain_hash`, `message_hash`
- Fail-closed on unsupported signature kinds

Backward compatibility for v1 is preserved behind the feature flag.
