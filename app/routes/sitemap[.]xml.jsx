import { getAllBlogSlugs, getAllCategorySlugs } from "~/lib/cms.server";
import { publicConfig } from "~/lib/config.server";
import { REVALIDATE_TIME } from "~/constants";

function entry(loc, lastmod, priority) {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <priority>${priority}</priority>\n  </url>`;
}

/* The filename escapes the dot — `sitemap[.]xml` — so Remix treats it as a
   literal rather than a route segment separator. */
export async function loader() {
  const { siteUrl } = publicConfig();
  const [posts, categories] = await Promise.all([getAllBlogSlugs(), getAllCategorySlugs()]);
  const now = new Date().toISOString();

  const urls = [
    entry(`${siteUrl}/`, now, 1),
    entry(`${siteUrl}/blog`, now, 0.9),
    ...categories.map((c) => entry(`${siteUrl}/blog/category/${c.slug}`, now, 0.7)),
    ...posts.map((p) => entry(`${siteUrl}/blog/${p.slug}`, now, 0.8)),
  ];

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`,
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": `public, max-age=0, s-maxage=${REVALIDATE_TIME}`,
      },
    },
  );
}
