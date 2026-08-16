# Open Auth Kit — Full Audit & Security Report

**Audit scope:** The source tree, client UI, Vite configuration, Express server, dependency graph, static assets, environment metadata, and release hygiene extracted from `openai-oauth-clone-fixed-release.zip`, `openai-oauth-clone-fixed-source.zip`, and `openai-oauth-clone-fixed-build.zip`.

**Audit date:** 2026-08-15

## Executive summary

The original project was a client-side visual authorization demo. It was not a real identity provider: password verification, OAuth callbacks, token exchange, CSRF/state validation, session cookies, and database persistence were not implemented. For the open-source release, the project was converted into the rebrandable **Open Auth Kit**, demo and redirect modes were made explicit, internal platform middleware and credential-bearing metadata were removed, server hardening was added, the dependency footprint was reduced, and a database adapter contract and implementation guides were added.

> **Important limitation:** This report is a code and configuration audit. It is not a penetration test, formal threat model, identity-provider certification, or production security guarantee. Before enabling real authentication, implement a server-side OAuth/OIDC flow and complete a provider-specific security review.

## Original archive analysis

| Archive | Role | Decision |
| --- | --- | --- |
| `fixed-source.zip` | Source tree, build manifest, and client/server code | Selected as the canonical editable source |
| `fixed-build.zip` | Pre-built static assets and bundled server | Rebuilt as an output artifact |
| `fixed-release.zip` | Combined source/build release form | Treated as a historical release; credential-bearing metadata was removed from the public release |

The original source passed the TypeScript check and production build, but the HTML build contained unresolved analytics placeholders. The original runtime displayed a local success state and accepted any non-empty password. Keeping that behavior as production authentication would not have been safe.

## Original security findings

| ID | Severity | Finding | Remediation status |
| --- | --- | --- | --- |
| SEC-001 | Critical | `.project-config.json` contained credential-like values, internal endpoints, owner identifiers, analytics IDs, and an artifact Git remote token. | **Fixed:** The file was removed from the release tree. Revoke or rotate any previously exposed key. |
| SEC-002 | High | Any non-empty password produced a success state and could make the behavior look like real sign-in. | **Fixed:** An explicit `demo` mode was added; the UI is local-only and displays a no-storage message. Real mode uses a redirect flow. |
| SEC-003 | High | The Vite configuration included a platform-specific browser debug collector and storage proxy. | **Fixed:** Internal plugins, the log collector, and the secret-backed proxy were removed. |
| SEC-004 | High | A client-controlled storage path was forwarded to a signed-URL proxy. | **Fixed:** The proxy was removed. If it is added in the future, an allowlist, authentication, rate limiting, and response validation are required. |
| SEC-005 | Medium | The Express server lacked security headers, body limits, an API boundary, and a safe cache policy. | **Fixed:** Helmet CSP, bounded JSON/urlencoded parsers, JSON API 404 responses, static cache policy, `x-powered-by` removal, and safe SPA fallback were added. |
| SEC-006 | Medium | External Google Fonts and analytics were present in the default HTML and generated build warnings. | **Fixed:** The default build is self-contained; telemetry and external fonts were removed. |
| SEC-007 | Medium | The brand name and logo path were hard-coded in multiple places. | **Fixed:** `VITE_BRAND_NAME`, `VITE_BRAND_LOGO`, `VITE_BRAND_TAGLINE`, and `VITE_BRAND_ACCENT` configuration was added. |
| SEC-008 | Medium | The unused UI-kit/chart/markdown dependency graph was large and included transitive advisories. | **Fixed:** Scaffold files and dependencies outside the active graph were removed, and the lockfile was regenerated. |
| SEC-009 | Low | Every GET route fell back to `index.html`, so an unknown API path returned HTML. | **Fixed:** `/api/*` returns JSON 404 responses; HTML fallback is limited to HTML navigation. |
| SEC-010 | Low | Template metadata described a “pure static site” even though a custom Express server existed. | **Fixed:** Stale template metadata was removed, and the README now distinguishes static, demo, and server deployments. |

## Dependency audit

The original production dependency graph contained **475 dependencies**, and the audit reported low, moderate, and high advisories. Affected transitive packages included `nanoid`, `mermaid`, `dompurify`, `body-parser`, `qs`, and `path-to-regexp`. After unused packages and the UI scaffold were removed, `express` was upgraded to a modern major line and the audit was rerun. The remediated production graph contains **82 dependencies**, with the following result:

| Severity | Original baseline | Remediated |
| --- | ---: | ---: |
| Critical | 0 | 0 |
| High | 16 | 0 |
| Moderate | 47 | 0 |
| Low | 8 | 0 |

The remediated `pnpm audit --prod` result contained no advisories. Dependency status changes over time, so the release pipeline includes `pnpm audit:deps`.

## Branding and SVG security

Logo configuration can now be set with `VITE_BRAND_LOGO=/your-logo.svg`. Because SVG files are served as public assets, use trusted static SVG files. The README documents the required `viewBox`, static paths, no-script, no-event-handler, no-`foreignObject`, no-external-image, and high-contrast requirements. The current demo SVG is retained and uses a neutral dark fill so it remains visible in the light theme.

## Database architecture

The core UI is database-independent. `server/storage/types.ts` defines the `UserStore` contract, and `server/storage/memory.ts` provides the development adapter. `DATABASE_PROVIDER=memory` is the default. The provider names `supabase`, `firebase`, `postgres`, `sqlite`, `cloudflare-d1`, and `cloudflare-kv` are parsed, but the factory fails closed when the corresponding adapter is not implemented. This is intentional: instead of showing a fake “connected” state, the adopter is required to add a real server-side implementation. Detailed migrations and snippets are available in `docs/DATABASES.md`.

Supabase exposed tables must use RLS and privileged server-side separation [1]. Firebase Admin SDK credentials should remain in a privileged server environment [2]. PostgreSQL queries must be parameterized [3]. OAuth redirect implementations must perform PKCE authorization-code verifier and state handling in a provider-side backend [4]. Cloudflare D1/KV bindings require separate adapters in the Worker runtime [5] [6].

## Verification evidence

The following commands succeeded on the remediated source tree:

```text
pnpm install --frozen-lockfile --ignore-scripts
pnpm run check
pnpm test
pnpm run audit:secrets
pnpm build
pnpm audit --prod
```

Unit tests verified provider parsing and memory-store email normalization and timestamp behavior. Production smoke tests verified the `/api/health` JSON response, `Content-Security-Policy`, `Referrer-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, SPA fallback, and JSON 404 responses for `/api/*`. The health response does not expose credentials or internal endpoints.

## Remaining production work

To enable real authentication, adopters must register the exact HTTPS redirect URI in the provider dashboard, add server-side `state` and PKCE verifier storage, exchange authorization codes, validate the token issuer and audience, use secure HttpOnly SameSite cookies, implement logout and revocation, add rate limiting, review CSRF protections, and configure monitoring. Database adapters require migrations, a unique normalized-email constraint, least-privilege roles, timeouts, retries, backup/restore procedures, and integration tests.

## References

[1]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Row Level Security"
[2]: https://firebase.google.com/docs/admin/setup "Firebase Admin SDK setup"
[3]: https://node-postgres.com/features/queries "node-postgres parameterized queries"
[4]: https://datatracker.ietf.org/doc/html/rfc7636 "RFC 7636: Proof Key for Code Exchange by OAuth Public Clients"
[5]: https://developers.cloudflare.com/d1/worker-api/ "Cloudflare D1 Worker API"
[6]: https://developers.cloudflare.com/kv/api/ "Cloudflare KV Binding API"
