---
title: Sitemap Operations
unlisted: true
description: Internal runbook for documentation sitemap generation and Google submission.
---

# Sitemap Operations

HexaJS documentation uses the standard Docusaurus classic preset sitemap generation, so each production build emits a sitemap XML file automatically.

## Build and Output

- Build command: `pnpm --filter @hexajs-dev/documentation run build`
- Build output file: `documentation/build/sitemap.xml`
- Production URL: `https://hexajs.dev/sitemap.xml`
- Discovery path: `https://hexajs.dev/robots.txt` includes the sitemap reference

## Manual Submission in Google Search Console

Submit the sitemap manually in Google Search Console for the `https://hexajs.dev` property:

1. Open **Search Console** and select the `https://hexajs.dev` property.
2. Open **Indexing -> Sitemaps**.
3. Submit `sitemap.xml` (or full URL `https://hexajs.dev/sitemap.xml`).
4. Confirm status shows the sitemap can be fetched and parsed.
5. Re-submit after major docs structure changes if needed.
