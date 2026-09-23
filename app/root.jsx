import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from "@remix-run/react";
import { json } from "@remix-run/node";
import { SiteFooter } from "~/components/layout/SiteFooter";
import { SiteHeader } from "~/components/layout/SiteHeader";
import { publicConfig } from "~/lib/config.server";
import stylesheet from "~/styles/tailwind.css?url";

export const links = () => [
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
  { rel: "stylesheet", href: stylesheet },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap",
  },
];

/* Remix does not inline environment variables into the browser bundle, so the
   four public values are read once here and every component reads them back
   through useSite() (app/lib/site.js). The CMS key is never part of this. */
export function loader() {
  return json({ site: publicConfig() });
}

function Document({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="flex min-h-full flex-col bg-zinc-950 font-sans text-zinc-100 selection:bg-fuchsia-500/30">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <Document>
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </Document>
  );
}

/* The error boundary renders its own shell: it also catches failures in the
   root loader, in which case there is no `site` data for the header and
   footer to read. */
export function ErrorBoundary() {
  const error = useRouteError();
  const status = isRouteErrorResponse(error) ? error.status : 500;
  const notFound = status === 404;

  return (
    <Document>
      <main className="relative flex flex-1 items-center overflow-hidden">
        <div className="relative mx-auto max-w-xl px-6 py-32 text-center">
          <p className="font-mono text-sm text-zinc-500">{status}</p>
          <h1 className="mt-4 text-4xl font-semibold text-balance text-white sm:text-5xl">
            {notFound ? "We couldn't find that page" : "Something went wrong"}
          </h1>
          <p className="mx-auto mt-5 max-w-md leading-relaxed text-pretty text-zinc-400">
            {notFound
              ? "The article may have been moved or unpublished. The blog index is a good place to pick up again."
              : "The page failed to render. Try again in a moment."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="/blog"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
            >
              Browse the blog
            </a>
            <a
              href="/"
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/50"
            >
              Back home
            </a>
          </div>
        </div>
      </main>
    </Document>
  );
}

// An error page should never be indexed, whatever the site-wide switch says.
export const meta = () => [
  { title: "Page not found | ContioReach" },
  { name: "robots", content: "noindex, nofollow" },
];
