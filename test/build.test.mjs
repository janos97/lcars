import { test } from "node:test";
import assert from "node:assert/strict";
import { staleFiles } from "../scripts/build.mjs";

test("committed dist/ matches a fresh build of src/", () => {
  assert.deepEqual(staleFiles(), [], "run `npm run build` and commit dist/");
});
