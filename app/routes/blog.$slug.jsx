import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { BlogDetail } from "~/components/blog/BlogDetail";
import { CTASection } from "~/components/blog/CTASection";
import { JsonLd } from "~/components/layout/JsonLd";
import { REVALIDATE_TIME } from "~/constants";
import { getPost, getRelated } from "~/lib/cms.server";
import { publicConfig } from "~/lib/config.server";
import { prepareContent } from "~/lib/content";
import { blogPostingSchema, breadcrumbSchema } from "~/lib/schema";
import { buildMeta } from "~/lib/seo";

export async function loader({ params }) {
  const post = await getPost(params.slug);

  if (!post) {
    throw new Response("Blog post not found", { status: 404 });
  }

  /* One pass produces the anchored HTML and the table of contents together, so
     the two cannot drift — and it happens here, not in the component, so the
     browser never re-parses the article. */
  const { html, toc } = prepareContent(post.content);
  const related = await getRelated(post.categorySlug, post.id);

  // The raw body is dropped: the prepared html replaces it, and shipping both
  // would double the payload for no gain.
  const { content, ...rest } = post;

  return json({ post: { ...rest, html, toc }, related, site: publicConfig() });
}

export const headers = () => ({
  "Cache-Control": `public, max-age=0, s-maxage=${REVALIDATE_TIME}, stale-while-revalidate=86400`,
});

export const meta = ({ data }) => {
  // A post that 404s renders the error boundary; the root's meta applies there.
  if (!data?.post) {
    return [{ title: "Blog Post Not Found | ContioReach" }, { name: "robots", content: "noindex, nofollow" }];
  }

  const { post, site } = data;

  return buildMeta({
    title: `${post.title} | ContioReach`,
    description: post.description || post.excerpt,
    path: `/blog/${post.slug}`,
    image: post.coverImage || undefined,
    alt: post.title,
    type: "article",
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    keywords: [
      post.category?.toLowerCase(),
      post.primaryKeyword,
      ...(post.tags?.map((tag) => tag.name?.toLowerCase()) || []),
      "headless cms",
      "content marketing",
      "blog",
    ],
    noIndex: site.noIndex,
    siteUrl: site.siteUrl,
  });
};

export default function BlogPost() {
  const { post, related, site } = useLoaderData();

  return (
    <>
      {/* Home > Blog > Article — the leaf uses the post's own title rather than
          the SEO title with its site suffix. */}
      <JsonLd
        data={breadcrumbSchema(
          [
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ],
          site.siteUrl,
        )}
      />
      <JsonLd data={blogPostingSchema(post, site.siteUrl)} />

      <BlogDetail post={post} relatedBlogs={related} />
      <CTASection />
    </>
  );
}
