# Security Policy

## Scope

Open Auth Kit একটি authorization UI এবং integration starter। এটি নিজে identity provider নয়। Demo mode-এ কোনো password বা OAuth token verify করা হয় না, কোনো user database-এ লেখা হয় না, এবং কোনো session cookie তৈরি হয় না। Production security-এর জন্য adopter-কে real OAuth/OIDC provider, callback endpoint, session handling, database policy এবং deployment secret manager যোগ করতে হবে।

## Remediated audit items

| Area                         | Remediation                                                                                                                                           |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository secrets           | Internal metadata, artifact URLs, owner identifiers এবং credential-like values public package থেকে বাদ দেওয়া হয়েছে। `audit:secrets` scan যুক্ত হয়েছে। |
| Browser credential exposure  | `VITE_*`-এর public nature README-তে স্পষ্ট করা হয়েছে; demo-only fake values ছাড়া real secret config রাখা হয়নি।                                        |
| Debug and storage collection | Platform-specific debug collector ও secret-backed storage proxy সরানো হয়েছে।                                                                          |
| Static server                | Helmet security headers, CSP, bounded body parsing, `x-powered-by` removal, API 404 boundary এবং safe SPA fallback যোগ করা হয়েছে।                     |
| Dependency surface           | Active UI graph ছাড়া scaffold dependency ও unused component সরানো হয়েছে।                                                                              |
| Auth semantics               | UI-তে demo বনাম redirect mode স্পষ্ট করা হয়েছে; redirect mode-এ browser password পাঠায় না।                                                            |

## Production checklist

Production-এ যাওয়ার আগে exact HTTPS redirect URI allowlist করুন এবং OAuth authorization-code flow-এ state, PKCE verifier, nonce যেখানে প্রযোজ্য, code exchange, issuer validation, audience validation ও token expiry যাচাই করুন। Session নিজস্ব signed, Secure, HttpOnly, SameSite cookie-তে রাখুন এবং refresh token browser local storage-এ রাখবেন না। Password আপনার application database-এ plaintext বা ad-hoc hash হিসেবে রাখবেন না; established identity provider ব্যবহার করুন।

Database adapter-এ normalized email-এর unique constraint, parameterized query, least-privilege role, timeout, retry policy, migration এবং audit logging যোগ করুন। Supabase exposed table-এ RLS চালু রাখুন; service-role credential কেবল server-side রাখুন। Cloudflare D1/KV binding ব্যবহার করলে Worker runtime-এর binding এবং permission model অনুযায়ী adapter লিখুন।

Deployment-এ TLS, rate limiting, request-size limit, structured log redaction, dependency audit, secret rotation, backup/restore drill এবং monitoring যোগ করুন। `DATABASE_PROVIDER` non-memory করার আগে corresponding adapter code review ও integration test আবশ্যক।

## Reporting a vulnerability

বাস্তব vulnerability পেলে public issue-এ credential বা exploit detail দেবেন না। Maintainer-এর private security contact থাকলে সেটি ব্যবহার করুন; না থাকলে repository owner-কে private channel-এ minimal reproduction, affected version, impact এবং suggested mitigation পাঠান। Secret leak হলে প্রথম পদক্ষেপ হলো সংশ্লিষ্ট provider dashboard থেকে token revoke/rotate করা, তারপর Git history ও deployment logs পরীক্ষা করা।

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
