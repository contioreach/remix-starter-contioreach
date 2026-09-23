import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { cached, clear, invalidate, size } from "./cache.server.js";

/* This cache is hand-written rather than supplied by the framework, so its
   semantics are pinned here. Run with `npm test` — no test runner to install,
   this is node:test. */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** A loader that counts its calls, so the tests can assert on cache misses. */
function counter(value, delay = 10) {
  const fn = async () => {
    fn.calls += 1;
    await sleep(delay);
    return typeof value === "function" ? value() : value;
  };
  fn.calls = 0;
  return fn;
}

beforeEach(() => clear());

test("a fresh entry is served without calling the loader again", async () => {
  const load = counter("v1");

  assert.equal(await cached("k", { tags: ["t"], maxAge: 10 }, load), "v1");
  assert.equal(await cached("k", { tags: ["t"], maxAge: 10 }, load), "v1");
  assert.equal(load.calls, 1);
});

test("concurrent misses on a cold key share one load", async () => {
  const load = counter("x", 30);

  const results = await Promise.all(
    Array.from({ length: 5 }, () => cached("s", { tags: ["t"], maxAge: 10 }, load)),
  );

  assert.deepEqual(results, ["x", "x", "x", "x", "x"]);
  assert.equal(load.calls, 1, "a burst on a cold key must not stampede the CMS");
});

test("a stale entry is served immediately and refreshed behind the request", async () => {
  let value = "old";
  const load = counter(() => value);

  await cached("w", { tags: ["t"], maxAge: 0.05, swr: 5 }, load);
  await sleep(120); // past maxAge, inside swr

  value = "new";
  assert.equal(
    await cached("w", { tags: ["t"], maxAge: 0.05, swr: 5 }, load),
    "old",
    "the caller gets the stale value rather than waiting",
  );

  await sleep(80); // let the background refresh land
  assert.equal(await cached("w", { tags: ["t"], maxAge: 0.05, swr: 5 }, load), "new");
});

test("past the stale window the caller waits for a fresh value", async () => {
  await cached("e", { tags: ["t"], maxAge: 0.05, swr: 0.05 }, counter("old"));
  await sleep(200);

  assert.equal(await cached("e", { tags: ["t"], maxAge: 0.05, swr: 0.05 }, counter("fresh")), "fresh");
});

test("a failing background refresh keeps serving the stale value", async () => {
  await cached("f", { tags: ["t"], maxAge: 0.05, swr: 5 }, counter("good"));
  await sleep(120);

  const failing = async () => {
    throw new Error("CMS down");
  };

  assert.equal(await cached("f", { tags: ["t"], maxAge: 0.05, swr: 5 }, failing), "good");
  await sleep(50);
  assert.equal(
    await cached("f", { tags: ["t"], maxAge: 0.05, swr: 5 }, failing),
    "good",
    "a CMS blip must not take the page down",
  );
});

test("invalidate drops only the entries carrying a tag", async () => {
  await cached("p1", { tags: ["blogs", "blog-a"], maxAge: 99 }, counter(1));
  await cached("p2", { tags: ["blogs"], maxAge: 99 }, counter(2));
  await cached("c1", { tags: ["categories"], maxAge: 99 }, counter(3));

  assert.equal(invalidate(["blog-a"]), 1, "one post, not the listings");
  assert.equal(size(), 2);

  assert.equal(invalidate(["blogs", "categories"]), 2);
  assert.equal(size(), 0);
});

test("invalidate accepts a single tag as well as a list", async () => {
  await cached("p1", { tags: ["blogs"], maxAge: 99 }, counter(1));

  assert.equal(invalidate("blogs"), 1);
  assert.equal(size(), 0);
});
