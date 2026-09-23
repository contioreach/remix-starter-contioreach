/* Remix has no data cache and no cache tags, so this is the one piece the
   other examples in this set get from their framework: Next has
   `revalidateTag`, Astro has a tagged response cache, Nitro has cached
   function groups. Here it is about sixty lines.

   The `.server.js` suffix is Remix's marker for server-only code: the
   compiler strips this module out of the browser bundle entirely.

   Semantics, chosen to match the Next.js example:
     - a value is fresh for `maxAge` seconds
     - after that it is served stale for up to `swr` seconds while a single
       refresh runs behind the request, so no visitor waits on the CMS
     - every entry carries tags, and invalidate(tags) drops exactly those

   It is per-process and in-memory. That is honest for one instance and for
   the CDN-fronted deployments most people use; see the README before you
   scale out. */

const store = new Map();
/* Tracks the refresh in flight for a key, so a burst of requests hitting a
   stale entry triggers one CMS call rather than one each. */
const inFlight = new Map();

const now = () => Date.now() / 1000;

export function invalidate(tags) {
  const wanted = new Set(Array.isArray(tags) ? tags : [tags]);
  let dropped = 0;

  for (const [key, entry] of store) {
    if (entry.tags.some((tag) => wanted.has(tag))) {
      store.delete(key);
      dropped += 1;
    }
  }

  return dropped;
}

export function clear() {
  store.clear();
}

/** Number of live entries — used by the tests and the README's walkthrough. */
export function size() {
  return store.size;
}

/**
 * @param {string} key      cache key; include every argument that changes the result
 * @param {object} options  { tags, maxAge, swr }
 * @param {() => Promise<any>} load  fetches the value on a miss
 */
export async function cached(key, { tags = [], maxAge = 3600, swr = 86400 }, load) {
  const entry = store.get(key);
  const age = entry ? now() - entry.storedAt : Infinity;

  if (entry && age <= maxAge) return entry.value;

  if (entry && age <= maxAge + swr) {
    // Stale but usable: refresh behind this request and serve what we have.
    if (!inFlight.has(key)) {
      const refresh = load()
        .then((value) => {
          store.set(key, { value, tags, storedAt: now() });
          return value;
        })
        .catch((error) => {
          // Keep serving the stale value rather than propagating a CMS blip.
          console.error(`Background revalidation failed for ${key}:`, error);
        })
        .finally(() => inFlight.delete(key));

      inFlight.set(key, refresh);
    }
    return entry.value;
  }

  /* Cold or fully expired: the caller has to wait. Sharing the in-flight
     promise keeps a thundering herd on a cold key down to one CMS call. */
  if (inFlight.has(key)) return inFlight.get(key);

  const pending = load()
    .then((value) => {
      store.set(key, { value, tags, storedAt: now() });
      return value;
    })
    .finally(() => inFlight.delete(key));

  inFlight.set(key, pending);
  return pending;
}
