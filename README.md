# Cedar+Slate website

Public online presence for **Cedar+Slate**, an independent Australian software studio.

This site is intentionally minimal: one clean landing page, a contact form, and a legal centre. It is an online presence, not a marketing funnel — no phone numbers or street address on the presence pages. Entity details (ABN, PO Box) stay in the legal documents only.

Live site: [https://cedarslate.com.au](https://cedarslate.com.au)

## What’s in the repo

```text
index.html                 Landing page + contact modal
assets/cedar-slate.svg     Brand mark
favicon.svg
functions/api/contact.js   Cloudflare Pages Function (contact → email)
legal/                     Privacy Policy, Terms of Service, Legal Centre
```

No package manager, bundler, or database. Static HTML/CSS/JS plus one serverless function.

## Domains

| Host | Role |
|---|---|
| `cedarslate.com.au` | Primary site (and `www` → apex as configured) |
| `cedarslate.au` / `www.cedarslate.au` | 301 redirect to `https://cedarslate.com.au` (Cloudflare Redirect Rule) |

## Stack and delivery

- **Hosting:** Cloudflare Pages (Git-connected to this repo)
- **Functions:** Cloudflare Pages Functions under `functions/`
- **Email:** [Resend](https://resend.com) via `RESEND_API_KEY`
- **Workflow:** edit in Cursor → feature branch → pull request → merge to `main` → Pages deploys

### Required secret (Cloudflare Pages → Settings → Environment variables)

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Send contact-form mail |

Mail is sent from `website@cedarslate.com.au` to `hello@cedarslate.com.au`.

The contact handler only accepts browser requests whose `Origin` is:

- `https://cedarslate.com.au`
- `https://www.cedarslate.com.au`

Preview deployments will show the UI, but contact POST may return 403 unless you temporarily allow the preview origin.

## Local preview

Static pages can be opened with any local static server. The contact API only works under Cloudflare Pages Functions (for example `wrangler pages dev`) with `RESEND_API_KEY` set.

There is no build step: the repo contents are the deploy artifact.

## Presence copy (keep)

- **Headline:** Thoughtful software, made with purpose.
- **Tagline:** Cedar+Slate is an independent Australian studio creating useful, beautifully considered software.

Keep the first viewport to one calm composition. Prefer a single-page, tidy presence in the spirit of Apple’s software sites — spare, clear, and product-led when products appear later.

## Legal

- `/legal/` — Legal Centre
- `/legal/privacy/` — Privacy Policy
- `/legal/terms/` — Terms of Service

Do not rewrite legal copy unless explicitly asked. PO Box and ABN belong in these documents.
