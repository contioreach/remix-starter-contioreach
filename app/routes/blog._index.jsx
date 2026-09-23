import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { BlogHero } from "~/components/blog/BlogHero";
import { BlogListing } from "~/components/blog/BlogListing";
import { CategoryPills } from "~/components/blog/CategoryPills";
import { CTASection } from "~/components/blog/CTASection";
import { Pagination } from "~/components/blog/Pagination";
import { JsonLd } from "~/components/layout/JsonLd";
import { POSTS_PER_PAGE, REVALIDATE_TIME } from "~/constants";
import { loadListing } from "~/lib/cms.server";
import { publicConfig } from "~/lib/config.server";
import { breadcrumbSchema } from "~/lib/schema";
import { buildMeta } from "~/lib/seo";

export async function loader({ request }) {
  const url = new URL(request.url);
  const currentPage = Math.max(1, Number.parseInt(url.searchParams.get("page"), 10) || 1);

  const listing = await loadListing({ page: currentPage, limit: POSTS_PER_PAGE });
  return json({ ...listing, currentPage, site: publicConfig() });
}

export const headers = () => ({
  "Cache-Control": `public, max-age=0, s-maxage=${REVALIDATE_TIME}, stale-while-revalidate=86400`,
});

export const meta = ({ data }) =>
  buildMeta({
    title: "Blog | Headless CMS, SEO & Content Strategy | ContioReach",
    description:
      "Practical guides on headless CMS, SEO, AI search, blogging, and the workflows behind content that gets discovered, read, and cited.",
    path: "/blog",
    alt: "The ContioReach blog",
    keywords: [
      "headless cms blog",
      "content marketing",
      "seo tips",
      "ai search optimization",
      "blogging workflow",
      "content strategy",
    ],
    noIndex: data?.site?.noIndex,
    siteUrl: data?.site?.siteUrl,
  });

export default function BlogIndex() {
  const { posts, meta, categories, currentPage, site } = useLoaderData();

  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: "Blog", path: "/blog" }], site.siteUrl)} />

      <BlogHero
        heading={
          <>
            Writing about the craft of{" "}
            <span className="bg-gradient-to-r from-fuchsia-400 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
              publishing well
            </span>
          </>
        }
        paragraph="Headless CMS, SEO, AI search, and the workflows behind content that gets discovered, read, and cited."
        stat={meta.total ? `${meta.total} articles and counting` : null}
      />

      <div className="mx-auto max-w-7xl space-y-12 px-6 py-14">
        <CategoryPills categories={categories} />
        <BlogListing posts={posts} featureFirst={currentPage === 1} />
        <Pagination meta={meta} basePath="/blog" />
      </div>

      <CTASection />
    </>
  );
}
