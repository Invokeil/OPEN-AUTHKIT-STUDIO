# Security Policy

## Scope

Open Auth Kit is an authorization UI and integration starter. It is not an identity provider. In demo mode, it does not verify passwords or OAuth tokens, write to a user database, or create session cookies. For production security, adopters must add a real OAuth/OIDC provider, callback endpoint, session handling, database policy, and deployment secret manager.

## Remediated audit items

| Area | Remediation |
| --- | --- |
| Repository secrets | Internal metadata, artifact URLs, owner identifiers, and credential-like values were removed from the public package. An `audit:secrets` scan was added. |
| Browser credential exposure | The public nature of `VITE_*` variables is clearly documented in the README; no real secret configuration is included beyond fake demo-only values. |
| Debug and storage collection | The platform-specific debug collector and secret-backed storage proxy were removed. |
| Static server | Helmet security headers, CSP, bounded body parsing, `x-powered-by` removal, an API 404 boundary, and safe SPA fallback were added. |
| Dependency surface | Scaffold dependencies and unused components outside the active UI graph were removed. |
| Auth semantics | Demo and redirect modes are explicit in the UI; redirect mode does not send a browser password. |

## Production checklist

Before going to production, allowlist the exact HTTPS redirect URI and validate `state`, the PKCE verifier, the nonce where applicable, code exchange, issuer, audience, and token expiry in the OAuth authorization-code flow. Store sessions in your own signed, Secure, HttpOnly, SameSite cookie, and never store refresh tokens in browser local storage. Do not store passwords in plaintext or in an ad-hoc hash in your application database; use an established identity provider.

Database adapters must include a normalized-email unique constraint, parameterized queries, a least-privilege role, timeouts, a retry policy, migrations, and audit logging. Keep RLS enabled on exposed Supabase tables and keep the service-role credential server-side only. When using Cloudflare D1/KV bindings, implement the adapter according to the Worker runtime's binding and permission model.

Deployment should include TLS, rate limiting, request-size limits, structured log redaction, dependency audits, secret rotation, backup/restore drills, and monitoring. Before setting `DATABASE_PROVIDER` to a non-memory value, review the corresponding adapter code and run integration tests.

## Reporting a vulnerability

When you find a real vulnerability, do not disclose credentials or exploit details in a public issue. Use the maintainer's private security contact when one is available; otherwise, send the repository owner a private message containing a minimal reproduction, affected version, impact, and suggested mitigation. If a secret has leaked, first revoke or rotate the token in the relevant provider dashboard, then inspect Git history and deployment logs.

## Test commands

```bash
pnpm check
pnpm test
pnpm audit:secrets
pnpm audit:deps
pnpm build
```

## References

[1]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Row Level Security"
[2]: https://firebase.google.com/docs/admin/setup "Firebase Admin SDK setup"
[3]: https://node-postgres.com/features/queries "node-postgres parameterized queries"
[4]: https://datatracker.ietf.org/doc/html/rfc7636 "RFC 7636: Proof Key for Code Exchange by OAuth Public Clients"
[5]: https://developers.cloudflare.com/d1/worker-api/ "Cloudflare D1 Worker API"
[6]: https://developers.cloudflare.com/kv/api/ "Cloudflare KV Binding API"
