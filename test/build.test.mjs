import { test } from "node:test";
import assert from "node:assert/strict";
import { staleFiles } from "../scripts/build.mjs";

test("committed dist/ and generated docs match a fresh build of src/", async () => {
  assert.deepEqual(await staleFiles(), [], "run `npm run build` and commit the results");
});
