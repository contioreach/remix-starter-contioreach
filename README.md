# Remix Headless CMS Starter

A complete, production-shaped blog built with **Remix v2** and a **headless CMS**, using [ContioReach](https://contioreach.com) as the content backend.

Not a toy. It ships the things a real content site actually needs and most examples skip: cached CMS reads with stale-while-revalidate and real tag invalidation, an on-demand revalidation webhook, category archives, pagination, a table of contents generated from the article body, full SEO metadata, JSON-LD, and a sitemap.

```bash
npx degit contioreach/remix-starter-contioreach my-blog
cd my-blog && npm install
cp .env.example .env   # add your API key
npm run dev
```

> Looking for another stack? See the [Next.js](https://github.com/contioreach/nextjs-starter-contioreach), [Nuxt](https://github.com/contioreach/nuxtjs-starter-contioreach), [Astro](https://github.com/contioreach/astro-starter-contioreach), [SvelteKit](https://github.com/contioreach/sveltekit-starter-contioreach), [React](https://github.com/contioreach/react-starter-contioreach) and [Vue](https://github.com/contioreach/vue-starter-contioreach) examples.

### A note on which Remix this is

This is **Remix v2** (`@remix-run/*` 2.x, React 18) — the stable release, and what "Remix" means to most people today. Worth knowing before you start a long-lived project on it:

- Remix v2 is effectively a maintenance branch. Its development continued as **React Router v7+**, which has the same loader/action model; migrating is a documented, mostly mechanical path.
- **Remix v3** is a separate rewrite, in release candidate at the time of writing.

If you are starting fresh and have no attachment to the Remix name, React Router's framework mode is the more future-proof choice, and nearly everything in this repo transfers to it unchanged.

---

## What's in the box

| Feature | Where |
| --- | --- |
| Blog index with pagination | [`app/routes/blog._index.jsx`](app/routes/blog._index.jsx) |
| Article page | [`app/routes/blog.$slug.jsx`](app/routes/blog.%24slug.jsx) |
| Category archives | [`app/routes/blog.category.$slug.jsx`](app/routes/blog.category.%24slug.jsx) |
| CMS client and transforms | [`app/lib/cms.server.js`](app/lib/cms.server.js) |
| Cache: TTL, SWR, single-flight, tags | [`app/lib/cache.server.js`](app/lib/cache.server.js) |
| …and its tests | [`app/lib/cache.test.js`](app/lib/cache.test.js) |
| On-demand revalidation webhook | [`app/routes/api.revalidate.all.jsx`](app/routes/api.revalidate.all.jsx) |
| Table of contents + stable heading anchors | [`app/lib/content.js`](app/lib/content.js) |
| Metadata, Open Graph, JSON-LD | [`app/lib/seo.js`](app/lib/seo.js), [`app/lib/schema.js`](app/lib/schema.js) |
| Sitemap and robots | [`app/routes/sitemap[.]xml.jsx`](app/routes/sitemap%5B.%5Dxml.jsx), [`app/routes/robots[.]txt.jsx`](app/routes/robots%5B.%5Dtxt.jsx) |
| Article typography (raw CMS HTML) | [`app/styles/tailwind.css`](app/styles/tailwind.css) |

Styling is Tailwind CSS v4. No UI library, no MDX pipeline, no database — the CMS is the only backend.

---

## 1. Environment variables

Copy the template and fill it in:

```bash
cp .env.example .env
```

```env
CMS_API_URL=https://cms-api.contioreach.com
CMS_API_KEY=cms_xxxxxxxxxxxxxxxxxxxxxxxx
REVALIDATION_SECRET=revalidate_xxxxxxxxxxxx
PUBLIC_SITE_URL=http://localhost:3000
PUBLIC_ALLOW_INDEXING=false
PUBLIC_SIGNUP_URL=https://app.contioreach.com/signup
PUBLIC_LOGIN_URL=https://app.contioreach.com/login
```

Get `CMS_API_KEY` and `REVALIDATION_SECRET` from your ContioReach workspace settings (the free plan is enough). Every variable is read in one place — [`app/lib/config.server.js`](app/lib/config.server.js) — which throws a named error when one is missing.

**Remix has no `PUBLIC_` convention and no build-time env inlining for the browser.** That prefix is this repo's own, marking which four values are meant to reach the page. They are read on the server and handed to the client through the **root loader** ([`app/root.jsx`](app/root.jsx)); components read them back with the `useSite()` hook ([`app/lib/site.js`](app/lib/site.js)). The CMS key is never part of that payload.

**The API key cannot leak by construction.** [`cms.server.js`](app/lib/cms.server.js), [`cache.server.js`](app/lib/cache.server.js) and [`config.server.js`](app/lib/config.server.js) use Remix's `.server.js` suffix, so the compiler strips them from the browser bundle. (Checked, not assumed: the built `build/client` contains no trace of the key.)

Running the built server:

```bash
npm run build
node --env-file=.env ./node_modules/.bin/remix-serve ./build/server/index.js
```

---

## 2. Fetching content

Every route reads its data in a `loader`, which only ever runs on the server — including across client-side navigations, where Remix fetches the serialized loader data for the next route rather than letting the browser talk to the CMS.

Components never see the API's shape: a transform layer maps it first, so swapping in Contentful, Sanity or Strapi is `apiRequest` plus two `transform*` functions, without touching a component.

The article body is prepared in the loader ([`app/lib/content.js`](app/lib/content.js)): heading anchors added, and the table of contents built from that same pass so the two cannot drift. The raw body is dropped from the payload afterwards, since shipping both would double it.

---

## 3. Caching and revalidation

Like SvelteKit, Remix gives you nothing here — no data cache, no cache tags. (Next has `revalidateTag`; Astro has a tagged response cache; Nitro has cached function groups.) So [`app/lib/cache.server.js`](app/lib/cache.server.js) writes one out, in about sixty lines:

- a value is **fresh** for `maxAge` seconds;
- after that it is served **stale** for up to `swr` seconds while one refresh runs behind the request, so no visitor waits on the CMS;
- concurrent misses on a cold key **share a single load**, so a burst doesn't stampede the CMS;
- a **failing background refresh keeps the stale value**, so a CMS blip doesn't take the page down;
- every entry carries **tags**, and `invalidate(tags)` drops exactly the entries that match.

Because it is hand-written rather than handed to you, those semantics are pinned by tests — [`cache.test.js`](app/lib/cache.test.js), seven of them, run with `npm test`. No test runner to install; it's `node:test`.

On top of that, each page route exports `headers` with `s-maxage` and `stale-while-revalidate`, so a CDN in front of the app can hold the rendered HTML on the same schedule.

**The webhook.** `POST /api/revalidate/all` is what your CMS calls on publish. It checks the shared secret, then drops every entry carrying one of the tags:

```bash
curl -X POST https://your-site.com/api/revalidate/all \
  -H 'content-type: application/json' \
  -d '{"secret":"revalidate_xxx","post":{"slug":"my-post"}}'
```

Naming a post adds its `blog-<slug>` tag to the purge, so a single article can be invalidated without dropping every listing. The response reports how many entries went. The secret is accepted in the body or as an `X-API-Key` header; anything else gets a 401, and a `GET` gets a 405.

**Before you scale out:** the cache is per-process and in-memory, so a webhook that lands on one instance only invalidates that instance. That is fine for a single server and for CDN-fronted deployments, but with several instances you want either a shared store behind the same `cached()` interface (Redis, say — the module is small and deliberately easy to swap) or a CDN purge on the same webhook.

---

## 4. SEO

- Canonical, Open Graph, Twitter card, robots and keywords come from one helper, [`buildMeta`](app/lib/seo.js), which turns the same arguments every route uses into the flat array Remix's `meta` export expects.
- `BlogPosting` and `BreadcrumbList` JSON-LD from [`app/lib/schema.js`](app/lib/schema.js).
- `/sitemap.xml` is generated from the CMS on request; `/robots.txt` follows the same switch as the meta tags. Both filenames escape the dot (`sitemap[.]xml`) so Remix treats it as a literal rather than a route separator.
- Bots get the fully rendered document rather than a streamed shell — see [`entry.server.jsx`](app/entry.server.jsx).
- Posts fall back to `/og-default.png` when they have no cover image — drop your own into `public/` before launch.
- **Indexing is off by default.** Until `PUBLIC_ALLOW_INDEXING` is exactly `"true"`, every page ships `noindex, nofollow` and `robots.txt` disallows everything — so a demo deployment can't compete with your posts' canonical home.

---

## 5. Project structure

```
app/
  components/blog/     Cards, listing, hero, TOC, share bar, article detail
  components/layout/   Header, footer, JSON-LD
  lib/
    *.server.js        CMS client, config and the cache — stripped from the
                       browser bundle by Remix's .server.js convention
    content.js         Article body prep — anchors + table of contents
    format.js          Dates, initials, reading time
    schema.js          JSON-LD builders
    seo.js             Arguments -> Remix's meta array
    site.js            useSite(), reading the root loader's public config
  routes/              /, /blog, /blog/$slug, /blog/category/$slug,
                       sitemap[.]xml, robots[.]txt, the webhook
  root.jsx             HTML shell, public config loader, error boundary
  constants.js         Values that don't vary by environment
```

---

## 6. Deploying

`npm run build` produces `build/server` and `build/client`; `remix-serve` runs them. Remix also targets Vercel, Netlify, Cloudflare, Fly and any Node host — see [Remix deployment](https://remix.run/docs/en/main/guides/deployment). Set the same environment variables there, with `PUBLIC_SITE_URL` pointing at your real domain, and point the CMS publish webhook at `https://your-domain/api/revalidate/all`.

On a serverless target, the in-memory cache lives only as long as a warm instance. There, lean on the `Cache-Control` headers each route already sets and treat the webhook as a CDN purge trigger.

---

## License

MIT — see [LICENSE](LICENSE). Clone it, strip it back, rebrand it, ship it.
