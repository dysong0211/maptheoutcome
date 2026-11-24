# MapToc versions

- **Version 1:** The root app and `app version 1/` now include the program intelligence and assurance revision. The existing capture, program, insights, evidence, finance, risk, and reporting workflows are retained. The public demo at https://maptoc-demo.dysong0211.chatgpt.site is a separate deployment; local revisions are not published automatically.
- **Version 2:** `app version 2/` is the independent minimalist redesign. It has separate browser-storage keys and no copied credentials or deployment identity.

Both copies retain the source, tests, documentation and dependency lockfile. Build artifacts, local uploads and `.env.local` are intentionally excluded. Version 2 reuses the installed dependencies through a local symlink; install from its lockfile when moving it elsewhere.
