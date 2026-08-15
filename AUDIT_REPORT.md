# Open Auth Kit — Full Audit ও Security Report

**Audit scope:** `openai-oauth-clone-fixed-release.zip`, `openai-oauth-clone-fixed-source.zip` এবং `openai-oauth-clone-fixed-build.zip` থেকে পাওয়া source tree, client UI, Vite configuration, Express server, dependency graph, static assets, environment metadata এবং release hygiene।

**Audit date:** 2026-08-15

## Executive summary

মূল project-টি একটি client-side visual authorization demo ছিল। এটি real identity provider নয়; password verification, OAuth callback, token exchange, CSRF/state validation, session cookie বা database persistence কোনোটি implemented ছিল না। Open-source release-এর জন্য project-টিকে rebrandable **Open Auth Kit** করা হয়েছে, demo বনাম redirect mode স্পষ্ট করা হয়েছে, internal platform middleware ও credential-bearing metadata সরানো হয়েছে, server hardening যোগ করা হয়েছে, dependency footprint কমানো হয়েছে এবং database adapter contract/docs যুক্ত হয়েছে।

> **গুরুত্বপূর্ণ সীমা:** এই report code/configuration audit। এটি penetration test, formal threat model, identity-provider certification বা production security guarantee নয়। Real authentication চালু করার আগে server-side OAuth/OIDC implementation এবং provider-specific security review প্রয়োজন।

## মূল archive analysis

| Archive             | ভূমিকা                                          | সিদ্ধান্ত                                                               |
| ------------------- | ----------------------------------------------- | ----------------------------------------------------------------------- |
| `fixed-source.zip`  | Source tree, build manifest, client/server code | Canonical editable source হিসেবে নেওয়া হয়েছে                            |
| `fixed-build.zip`   | Pre-built static assets ও bundled server        | Output artifact হিসেবে পুনর্নির্মাণ করা হয়েছে                           |
| `fixed-release.zip` | Source/build-এর combined release form           | Historical release; credential-bearing metadata public release থেকে বাদ |

Original source TypeScript check ও production build পাস করলেও HTML build-এ unresolved analytics placeholders ছিল। মূল runtime-এ UI local success দেখাত এবং যেকোনো non-empty password গ্রহণ করত। এই behavior-কে production auth হিসেবে রাখা নিরাপদ ছিল না।

## Original security findings

| ID      | Severity | সমস্যা                                                                                                                                   | Remediation status                                                                                                                                |
| ------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEC-001 | Critical | `.project-config.json`-এ credential-like values, internal endpoints, owner identifiers, analytics IDs এবং artifact Git remote token ছিল। | **Fixed:** file release tree থেকে বাদ; any previously exposed key revoke/rotate করতে হবে।                                                         |
| SEC-002 | High     | যে কোনো non-empty password-এ success state দেখাত এবং behavior real sign-in-এর মতো দেখাতে পারত।                                           | **Fixed:** explicit `demo` mode; UI local-only এবং no-storage message দেখায়। Real mode-এ redirect flow ব্যবহার করা হয়েছে।                         |
| SEC-003 | High     | Vite config-এ platform-specific browser debug collector ও storage proxy ছিল।                                                             | **Fixed:** internal plugins, log collector এবং secret-backed proxy সরানো হয়েছে।                                                                   |
| SEC-004 | High     | Client-controlled storage path signed URL proxy-তে পাঠানো হতো।                                                                           | **Fixed:** proxy সরানো হয়েছে। ভবিষ্যতে যোগ করলে allowlist/auth/rate-limit/response validation আবশ্যক।                                             |
| SEC-005 | Medium   | Express server-এ security headers, body limit, API boundary এবং safe cache policy ছিল না।                                                | **Fixed:** Helmet CSP, bounded JSON/urlencoded parser, API JSON 404, static cache policy, `x-powered-by` removal এবং safe SPA fallback যোগ হয়েছে। |
| SEC-006 | Medium   | External Google Fonts ও analytics default HTML-এ ছিল; build warning তৈরি হতো।                                                            | **Fixed:** default build self-contained; telemetry ও external font removed।                                                                       |
| SEC-007 | Medium   | Brand name ও logo path অনেক জায়গায় hard-coded ছিল।                                                                                       | **Fixed:** `VITE_BRAND_NAME`, `VITE_BRAND_LOGO`, `VITE_BRAND_TAGLINE`, `VITE_BRAND_ACCENT` config যোগ হয়েছে।                                      |
| SEC-008 | Medium   | Unused UI-kit/chart/markdown dependency graph বড় ছিল এবং transitive advisories ছিল।                                                      | **Fixed:** active graph-এর বাইরে scaffold files/dependencies সরানো হয়েছে; lockfile regenerated।                                                   |
| SEC-009 | Low      | সব GET route-এ `index.html` fallback হতো, ফলে unknown API path HTML পেত।                                                                 | **Fixed:** `/api/*` JSON 404; HTML fallback কেবল HTML navigation-এর জন্য।                                                                         |
| SEC-010 | Low      | Template metadata “pure static site” বললেও custom Express server ছিল।                                                                    | **Fixed:** stale template metadata বাদ; README-তে static/demo/server distinction স্পষ্ট।                                                          |

## Dependency audit

Original production dependency graph-এ **475 dependencies** ছিল এবং audit-এ low, moderate ও high advisory report হয়েছিল; প্রভাবিত transitive packages-এর মধ্যে `nanoid`, `mermaid`, `dompurify`, `body-parser`, `qs` এবং `path-to-regexp` ছিল। Unused package ও UI scaffold সরানোর পর `express`-কে modern major line-এ upgrade করে audit পুনরায় চালানো হয়েছে। Remediated production graph-এ **82 dependencies** এবং audit result হলো:

| Severity | Original baseline | Remediated |
| -------- | ----------------: | ---------: |
| Critical |                 0 |          0 |
| High     |                16 |          0 |
| Moderate |                47 |          0 |
| Low      |                 8 |          0 |

`pnpm audit --prod`-এর remediated result-এ কোনো advisory নেই। Dependency status সময়ের সঙ্গে বদলাতে পারে, তাই release pipeline-এ `pnpm audit:deps` রাখা হয়েছে।

## Branding ও SVG security

Logo configuration এখন `VITE_BRAND_LOGO=/your-logo.svg` দিয়ে করা যায়। SVG public asset হিসেবে serve হয়, তাই trusted static SVG ব্যবহার করতে হবে। README-তে `viewBox`, static path, no-script, no-event-handler, no-foreignObject, no-external-image এবং high-contrast requirement লিখে দেওয়া হয়েছে। বর্তমান demo SVG retained আছে এবং light theme-এ দৃশ্যমান করার জন্য neutral dark fill ব্যবহার করছে।

## Database architecture

Core UI database-independent। `server/storage/types.ts`-এ `UserStore` contract এবং `server/storage/memory.ts`-এ development adapter আছে। `DATABASE_PROVIDER=memory` default। `supabase`, `firebase`, `postgres`, `sqlite`, `cloudflare-d1` ও `cloudflare-kv` provider নাম parse হয়, কিন্তু corresponding adapter না থাকলে factory fail-closed error করে। এটি গুরুত্বপূর্ণ—কারণ fake “connected” state দেখানোর বদলে adopter-কে real server-side implementation বসাতে বাধ্য করে। বিস্তারিত migration ও snippets `docs/DATABASES.md`-এ আছে।

Supabase exposed table-এ RLS এবং privileged server-side separation রাখতে হবে [1]। Firebase Admin SDK privileged environment-এর জন্য server-side রাখা উচিত [2]। PostgreSQL-এ parameterized query ব্যবহার করতে হবে [3]। OAuth redirect implementation-এ PKCE authorization-code flow-এর verifier/state handling provider-side backend-এ করতে হবে [4]। Cloudflare D1/KV binding Worker runtime-এ আলাদা adapter চায় [5] [6]।

## Verification evidence

নিচের command-গুলো remediated source tree-তে সফল হয়েছে:

```text
pnpm install --frozen-lockfile --ignore-scripts
pnpm run check
pnpm test
pnpm run audit:secrets
pnpm build
pnpm audit --prod
```

Unit test-এ provider parsing এবং memory store email normalization/timestamp behavior যাচাই হয়েছে। Production smoke test-এ `/api/health` JSON response, `Content-Security-Policy`, `Referrer-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, SPA fallback এবং `/api/*` JSON 404 যাচাই হয়েছে। Health response-এ কোনো credential বা internal endpoint প্রকাশ হয় না।

## Remaining production work

Real authentication চালু করার জন্য adopter-কে provider dashboard-এ exact HTTPS redirect URI register, server-side `state` ও PKCE verifier storage, authorization code exchange, token issuer/audience validation, secure HttpOnly SameSite cookie, logout/revocation, rate limiting, CSRF review এবং monitoring যোগ করতে হবে। Database adapter-এ migration, unique normalized email, least-privilege role, timeout, retry, backup/restore এবং integration test আবশ্যক।

## References

[1]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Row Level Security"
[2]: https://firebase.google.com/docs/admin/setup "Firebase Admin SDK setup"
[3]: https://node-postgres.com/features/queries "node-postgres parameterized queries"
[4]: https://datatracker.ietf.org/doc/html/rfc7636 "RFC 7636: Proof Key for Code Exchange by OAuth Public Clients"
[5]: https://developers.cloudflare.com/d1/worker-api/ "Cloudflare D1 Worker API"
[6]: https://developers.cloudflare.com/kv/api/ "Cloudflare KV Binding API"
