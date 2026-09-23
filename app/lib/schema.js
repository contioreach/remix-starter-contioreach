/* JSON-LD builders. `siteUrl` is passed in rather than imported, because on
   the server it comes from the environment and in a component it comes from
   the root loader — see app/lib/site.js. */

export function breadcrumbSchema(crumbs, siteUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...crumbs].map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${siteUrl}${crumb.path}`,
    })),
  };
}

export function blogPostingSchema(post, siteUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description || post.excerpt,
    image: post.coverImage ? [post.coverImage] : undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${siteUrl}/blog/${post.slug}` },
    author: (post.authors?.length ? post.authors : [{ name: "ContioReach" }]).map((author) => ({
      "@type": "Person",
      name: author.name,
      url: author.website || undefined,
    })),
    publisher: {
      "@type": "Organization",
      name: "ContioReach",
      url: siteUrl,
    },
    keywords:
      [post.primaryKeyword, ...(post.tags?.map((tag) => tag.name) || [])]
        .filter(Boolean)
        .join(", ") || undefined,
  };
}
