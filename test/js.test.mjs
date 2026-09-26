import { test } from "node:test";
import assert from "node:assert/strict";
import LCARS, { stardate, clock, randomReadout } from "../src/js/lcars.js";

test("module imports without a DOM and exposes its API", () => {
  for (const fn of ["init", "setTheme", "setAlert", "beep", "stardate", "clock", "randomReadout"]) {
    assert.equal(typeof LCARS[fn], "function", fn);
  }
});

test("stardate is YYYY.DDD", () => {
  assert.equal(stardate(new Date(2026, 0, 1)), "2026.001");
  assert.equal(stardate(new Date(2026, 8, 26)), "2026.269");
  assert.equal(stardate(new Date(2024, 11, 31)), "2024.366");
});

test("clock pads to HH:MM:SS and can drop seconds", () => {
  const d = new Date(2026, 0, 1, 7, 5, 9);
  assert.equal(clock(d), "07:05:09");
  assert.equal(clock(d, { seconds: false }), "07:05");
});

test("randomReadout produces LCARS-style numbers", () => {
  let seed = 1;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < 200; i++) {
    assert.match(randomReadout(rand), /^(\d{1,4}|\d{2}-\d{4}|\d\.\d{3})$/);
  }
});
