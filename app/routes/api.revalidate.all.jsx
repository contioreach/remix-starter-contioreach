import { json } from "@remix-run/node";
import { CACHE_TAGS } from "~/constants";
import { invalidate } from "~/lib/cache.server";
import { revalidationSecret } from "~/lib/config.server";

/* Publish webhook from ContioReach. Fired when a post is published, scheduled,
   deleted, or a published post is edited. Body: { secret, post }; the same
   secret is also accepted as the X-API-Key header.

   Remix has no revalidateTag, so the tags come from the cache in
   app/lib/cache.server.js: every cached read carries them, and invalidate()
   drops exactly the entries that match.

   This route has an `action` and no `default` export, which is Remix's way of
   writing an endpoint that only answers non-GET requests. */
export async function action({ request }) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const secret = body?.secret || request.headers.get("x-api-key");

    if (secret !== revalidationSecret()) {
      return json({ error: "Invalid token" }, { status: 401 });
    }

    const tags = Object.values(CACHE_TAGS);

    /* When the webhook names a post, its own tag goes too — the listings are
       dropped by the shared tags either way. */
    if (body?.post?.slug) tags.push(`blog-${body.post.slug}`);

    const entries = invalidate(tags);

    console.log("Blog cache revalidated", {
      slug: body?.post?.slug ?? null,
      entries,
      timestamp: new Date().toISOString(),
    });

    return json({
      success: true,
      message: "All blog cache revalidated successfully",
      revalidated: { tags, entries },
    });
  } catch (error) {
    console.error("Full revalidation error:", error);
    return json(
      { success: false, error: "Failed to revalidate blog cache", details: error.message },
      { status: 500 },
    );
  }
}

// A GET here is a mistake worth naming rather than a 404.
export const loader = () =>
  json({ error: "Use POST to revalidate" }, { status: 405 });
