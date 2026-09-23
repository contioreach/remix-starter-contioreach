/* What this example actually demonstrates — the reason a developer landed here
   from a search result. Each item points at the file that implements it. */
const features = [
  {
    title: "Cached reads with real tags",
    body: "Remix ships no data cache, so this one is written out in full: TTL, stale-while-revalidate, single-flight refresh, and tag invalidation in about sixty lines.",
    file: "app/lib/cache.server.js",
  },
  {
    title: "On-demand revalidation",
    body: "A signed webhook from the CMS drops exactly the entries carrying a tag, so a published post goes live immediately without a redeploy.",
    file: "app/routes/api.revalidate.all.jsx",
  },
  {
    title: "Server-only by suffix",
    body: "The CMS client is a .server.js module, so the Remix compiler strips it from the browser bundle. The API key cannot leak through an import.",
    file: "app/lib/cms.server.js",
  },
  {
    title: "Loaders, not client fetching",
    body: "Every route reads its data in a loader on the server, including across client-side navigations, so the browser never talks to the CMS.",
    file: "app/routes/blog.$slug.jsx",
  },
  {
    title: "SEO, done properly",
    body: "Canonicals, Open Graph, BlogPosting and BreadcrumbList JSON-LD, a generated sitemap, and a single switch that gates indexing.",
    file: "app/lib/seo.js",
  },
  {
    title: "One CMS boundary",
    body: "Two functions stand between your components and the API. Swap in Contentful, Sanity or Strapi without touching a component.",
    file: "app/lib/cms.server.js",
  },
];

export function FeatureGrid() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
      <h2 className="text-3xl font-semibold text-white sm:text-4xl">
        What this example demonstrates
      </h2>
      <p className="mt-2 max-w-2xl text-zinc-400">
        The parts most headless CMS tutorials leave out — and where to find each one in the repo.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/20"
          >
            <h3 className="font-semibold text-white">{feature.title}</h3>
            <p className="mt-2.5 text-sm leading-relaxed text-zinc-400">{feature.body}</p>
            <code className="mt-4 block font-mono text-xs break-all text-cyan-300/80">
              {feature.file}
            </code>
          </div>
        ))}
      </div>
    </section>
  );
}
