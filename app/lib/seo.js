/* Remix builds the head from a route's `meta` export, which returns a flat
   array of tag descriptors. This turns the same arguments every other example
   in this set uses into that array, so the routes stay declarative. */
export function buildMeta({
  title,
  description,
  path = "/",
  image,
  alt,
  type = "website",
  keywords = [],
  noIndex = false,
  publishedTime,
  modifiedTime,
  siteUrl,
}) {
  const url = `${siteUrl}${path}`;
  const ogImage = image || `${siteUrl}/og-default.png`;
  const keywordList = keywords.filter(Boolean).join(", ");

  return [
    { title },
    { name: "description", content: description },
    ...(keywordList ? [{ name: "keywords", content: keywordList }] : []),
    { tagName: "link", rel: "canonical", href: url },
    /* Site-wide noindex is applied by the caller passing `noIndex` from the
       root loader's config; individual pages (a missing post, say) can also
       opt out on their own. */
    { name: "robots", content: noIndex ? "noindex, nofollow" : "index, follow" },

    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:type", content: type },
    { property: "og:site_name", content: "ContioReach" },
    { property: "og:image", content: ogImage },
    { property: "og:image:alt", content: alt || title },
    ...(publishedTime ? [{ property: "article:published_time", content: publishedTime }] : []),
    ...(modifiedTime ? [{ property: "article:modified_time", content: modifiedTime }] : []),

    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImage },
  ];
}
