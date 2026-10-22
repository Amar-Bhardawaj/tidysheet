# Deployment Guide — TidySheet

**Status:** Phase Nine deliverable (per mission §9)
**Date:** 2026-10-22

## 1. Recommended distribution: static site on GitHub Pages

- **Free to develop:** yes (Node + Vite, all open source).
- **Free to host:** yes, GitHub Pages is free for public repositories (subject to
  GitHub's own terms; not guaranteed permanent).
- **Free to distribute:** yes (a URL is the product; no installer, no signing).
- **Free to operate at scale:** GitHub Pages has bandwidth/soft limits; for a
  small static tool this is not a concern. Re-evaluate if traffic grows.

This is the only option that satisfies all of: zero capital, no backend, no
secrets, verifiable privacy, and trivial updates.

## 2. Alternatives considered

| Option | Verdict |
| --- | --- |
| GitHub Pages (static) | **Recommended.** Free, HTTPS, custom domain optional later. |
| Netlify / Vercel free tier | Viable fallback; both have free tiers for static sites today. Vendor terms change — re-verify. |
| Cloudflare Pages | Viable fallback; free tier for static sites. |
| Downloadable desktop (Tauri/Electron) | Deferred to v2; needs code-signing for trust on Windows/macOS, which costs money. |
| Local-only (user runs `npm run dev`) | Not acceptable for non-technical users; documented only as a developer path. |

## 3. Exact deployment procedure (GitHub Pages)

Prerequisites: owner authorization to create/publish a public repository and to
enable Pages. Do not publish without authorization.

```bash
# 1. Create the repo on GitHub (owner action), then:
git remote add origin https://github.com/<owner>/tidysheet.git
git branch -M main
git push -u origin main

# 2. In the repo settings:
#    Settings → Pages → Source: "GitHub Actions"
# 3. Add the workflow below as .github/workflows/pages.yml (already in repo)
#    and push. Pages will build + deploy on every push to main.
```

Workflow (already present at `.github/workflows/pages.yml`):

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

The `base: "./"` setting in vite.config.ts makes the build work under any
sub-path (e.g. `https://<owner>.github.io/tidysheet/`).

## 4. Local run (developer path)

```bash
npm ci
npm run dev        # http://localhost:5173
npm test
npm run build      # outputs dist/
npx vite preview   # serve dist/ locally
```

## 5. Rollback

Revert the commit and push; Pages redeploys the previous build automatically.
No database, no migrations, no state to roll back.

## 6. What is required from the owner before public launch

- Authorization to make the repository public.
- Authorization to enable GitHub Pages.
- (Optional, later) A custom domain and DNS setup — not needed for launch.
- Decision on the MIT license (currently stated as MIT in README; confirm).
- Review of SECURITY.md / privacy claims against the actual shipped build.
