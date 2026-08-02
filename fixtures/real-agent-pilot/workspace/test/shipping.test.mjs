import assert from "node:assert/strict";
import test from "node:test";

import { totalWithShipping } from "../src/shipping.mjs";

test("adds the fixed synthetic shipping charge", () => {
  assert.equal(totalWithShipping(2_000), 2_500);
});

test("rejects an invalid synthetic subtotal", () => {
  assert.throws(() => totalWithShipping(-1), /non-negative integer/);
});
