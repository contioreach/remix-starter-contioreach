/* Every server-side environment variable is read here and nowhere else. The
   `.server.js` suffix is Remix's marker for server-only code — the compiler
   keeps this module out of the browser bundle, so the API key cannot leak
   through an accidental import.

   A missing variable fails loudly instead of quietly shipping a site that
   401s against the CMS. */
function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. See .env.example.`);
  }
  return value;
}

export const cmsApiUrl = () => required("CMS_API_URL");
export const cmsApiKey = () => required("CMS_API_KEY");
export const revalidationSecret = () => required("REVALIDATION_SECRET");

/* The public four. Remix has no PUBLIC_ prefix convention and no build-time
   env inlining for the browser, so these are read on the server and handed to
   the client through the root loader — see app/root.jsx and app/lib/site.js. */
export function publicConfig() {
  return {
    siteUrl: required("PUBLIC_SITE_URL"),
    signupUrl: required("PUBLIC_SIGNUP_URL"),
    loginUrl: required("PUBLIC_LOGIN_URL"),
    /* Site-wide noindex. Every page ships `noindex, nofollow` until
       PUBLIC_ALLOW_INDEXING is exactly "true". Flip that one env var to let
       search engines back in. */
    noIndex: process.env.PUBLIC_ALLOW_INDEXING !== "true",
  };
}
