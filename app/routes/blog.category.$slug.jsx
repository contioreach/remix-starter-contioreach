import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { BlogHero } from "~/components/blog/BlogHero";
import { BlogListing } from "~/components/blog/BlogListing";
import { CategoryPills } from "~/components/blog/CategoryPills";
import { CTASection } from "~/components/blog/CTASection";
import { Pagination } from "~/components/blog/Pagination";
import { JsonLd } from "~/components/layout/JsonLd";
import { POSTS_PER_PAGE, REVALIDATE_TIME } from "~/constants";
import { getCategory, loadListing } from "~/lib/cms.server";
import { publicConfig } from "~/lib/config.server";
import { breadcrumbSchema } from "~/lib/schema";
import { buildMeta } from "~/lib/seo";

export async function loader({ params, request }) {
  const url = new URL(request.url);
  const currentPage = Math.max(1, Number.parseInt(url.searchParams.get("page"), 10) || 1);

  const category = await getCategory(params.slug);
  if (!category) {
    throw new Response("Category not found", { status: 404 });
  }

  const listing = await loadListing({
    page: currentPage,
    limit: POSTS_PER_PAGE,
    category: params.slug,
  });

  return json({
    ...listing,
    category,
    currentPage,
    slug: params.slug,
    site: publicConfig(),
  });
}

export const headers = () => ({
  "Cache-Control": `public, max-age=0, s-maxage=${REVALIDATE_TIME}, stale-while-revalidate=86400`,
});

export const meta = ({ data }) => {
  if (!data?.category) {
    return [{ title: "Category Not Found | ContioReach Blog" }, { name: "robots", content: "noindex, nofollow" }];
  }

  const { category, slug, site } = data;
  const lower = category.name.toLowerCase();

  return buildMeta({
    title: `${category.name} Articles | ContioReach Blog`,
    description:
      category.description ||
      `Expert insights, strategies, and guides on ${lower}. Browse every ${lower} article on the ContioReach blog.`,
    path: `/blog/category/${slug}`,
    alt: `${category.name} articles on the ContioReach blog`,
    keywords: [lower, slug, "headless cms", "content marketing", "blog"],
    noIndex: site.noIndex,
    siteUrl: site.siteUrl,
  });
};

export default function CategoryPage() {
  const { posts, meta, categories, category, currentPage, slug, site } = useLoaderData();
  const lower = category.name.toLowerCase();

  return (
    <>
      {/* Built from the loaded category so the crumb uses its display name. */}
      <JsonLd
        data={breadcrumbSchema(
          [
            { name: "Blog", path: "/blog" },
            { name: category.name, path: `/blog/category/${slug}` },
          ],
          site.siteUrl,
        )}
      />

      <BlogHero
        eyebrow={category.name}
        heading={
          <>
            Everything on{" "}
            <span className="bg-gradient-to-r from-fuchsia-400 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
              {category.name}
            </span>
          </>
        }
        paragraph={
          category.description ||
          `Expert insights, strategies, and guides on ${lower}, plus what we're learning building ContioReach.`
        }
        stat={meta.total ? `${meta.total} articles in this category` : null}
      />

      <div className="mx-auto max-w-7xl space-y-12 px-6 py-14">
        <CategoryPills categories={categories} active={slug} />
        <BlogListing posts={posts} featureFirst={currentPage === 1} />
        <Pagination meta={meta} basePath={`/blog/category/${slug}`} />
      </div>

      <CTASection />
    </>
  );
}
