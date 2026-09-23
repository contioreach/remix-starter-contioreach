import { publicConfig } from "~/lib/config.server";

export function loader() {
  const { siteUrl, noIndex } = publicConfig();

  /* Belt and braces with the per-page `noindex` tags: while the site is closed
     off, crawlers are turned away at the door too. */
  const body = noIndex
    ? "User-agent: *\nDisallow: /\n"
    : `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
