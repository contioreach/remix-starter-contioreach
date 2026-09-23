import { useRouteLoaderData } from "@remix-run/react";

/* The public half of the configuration, read in components.

   Unlike the other examples in this set, Remix does not inline environment
   variables into the browser bundle. The root loader reads them once on the
   server (app/lib/config.server.js) and every component reads them back from
   the root route's data — which is why this is a hook rather than a plain
   import, and why the CMS key has no way to reach the client. */
export function useSite() {
  const data = useRouteLoaderData("root");
  return data.site;
}
