# Contributing

Open Auth Kit-এ contribution করার আগে repository clone করে `.env.example` থেকে `.env` তৈরি করুন। কোনো real credential, customer data, internal endpoint বা proprietary logo commit করবেন না।

```bash
pnpm install
pnpm check
pnpm test
pnpm audit:secrets
pnpm build
```

UI পরিবর্তনে keyboard navigation, reduced motion, mobile layout এবং screen-reader label পরীক্ষা করুন। Brand asset পরিবর্তন করলে SVG-এর নিরাপত্তা নিয়ম `README.md`-এর SVG section অনুসরণ করুন।

নতুন database adapter যোগ করলে `UserStore` contract মেনে server-only implementation, migration, unique email rule, parameterized query, timeout এবং integration test দিন। Provider credential `.env.example`-এ কেবল variable name হিসেবে রাখুন; কোনো real value দেবেন না। `DATABASE_PROVIDER` configure করা থাকলেও adapter না থাকলে fail-closed behavior বজায় রাখুন।

Pull request-এ পরিবর্তনের security impact, test commands, dependency changes এবং migration notes লিখুন। Vulnerability public issue-এ প্রকাশ না করে `SECURITY.md` অনুসরণ করুন।
