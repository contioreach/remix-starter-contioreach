/* Values that do not vary by environment. Everything that does is read from
   the environment in exactly one place per side of the boundary:
   app/lib/config.server.js for the secrets, app/lib/site.js for the four
   public values. */

// ContioReach Public API.
export const API_ENDPOINTS = {
  BLOGS: "/v1/blogs",
  AUTHORS: "/v1/authors",
  TAGS: "/v1/tags",
  CATEGORIES: "/v1/categories",
};

/* The cache tags carried by every cached CMS read and dropped by the publish
   webhook. A post's detail read also carries its own `blog-<slug>` tag, so a
   single article can be invalidated without dropping every listing. */
export const CACHE_TAGS = {
  BLOGS: "blogs",
  CATEGORIES: "categories",
  AUTHORS: "authors",
  TAGS: "tags",
};

export const REVALIDATE_TIME = 3600; // 1 hour
export const POSTS_PER_PAGE = 12;

// Marketing site link used by the CTA's secondary button.
export const CONTACT_URL = "https://contioreach.com/contact-us";

// This repo is a public example, so the demo UI links back to the source.
export const REPO_URL = "https://github.com/contioreach/remix-starter-contioreach";
export const CMS_SITE_URL = "https://contioreach.com";

/* The read-only key of the ContioReach demo workspace, and the default in
   .env.example — so a fresh clone renders real posts before you have an
   account. While it is the key in use, every page shows the demo banner
   (app/components/layout/DemoBanner.jsx). Replacing it is the only switch. */
export const DEMO_API_KEY = "cms_a77631bccba461401bf5fd25b0402acd163623af5a5fc0ca";

export const EMPTY_META = {
  page: 1,
  limit: 12,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
};
