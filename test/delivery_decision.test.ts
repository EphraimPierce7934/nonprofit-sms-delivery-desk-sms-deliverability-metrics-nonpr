import assert from "node:assert/strict";
import { test } from "node:test";
import { deliveryDecision } from "../src/delivery_decision.ts";

test("a failed receipt requires attention even when an earlier event says delivered", () => {
  assert.equal(deliveryDecision([{ status: "delivered" }, { type: "failed" }]), "needs_attention");
  assert.equal(deliveryDecision([{ status: "delivered" }]), "delivered");
  assert.equal(deliveryDecision([]), "pending");
});
