# Contributing

Before contributing to Open Auth Kit, clone the repository and create `.env` from `.env.example`. Never commit real credentials, customer data, internal endpoints, or proprietary logos.

```bash
pnpm install
pnpm check
pnpm test
pnpm audit:secrets
pnpm build
```

For UI changes, test keyboard navigation, reduced-motion behavior, mobile layouts, and screen-reader labels. When changing brand assets, follow the SVG security requirements in the SVG section of `README.md`.

When adding a database adapter, follow the `UserStore` contract and provide a server-only implementation, migration, unique-email rule, parameterized queries, timeouts, and integration tests. Keep provider credentials in `.env.example` only as variable names; never add real values. Even when `DATABASE_PROVIDER` is configured, preserve fail-closed behavior when the adapter is not implemented.

In pull requests, describe the security impact, test commands, dependency changes, and migration notes. Do not disclose vulnerabilities in public issues; follow `SECURITY.md` instead.
