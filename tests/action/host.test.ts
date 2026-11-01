import { test } from "node:test";
import assert from "node:assert/strict";
import { parseLevelParam } from "../../src/action/host";
import { MISSIONS } from "../../src/action/campaign";

test("?level=N opens authored board N (1-based); anything else is ignored", () => {
  const n = MISSIONS.length;
  assert.equal(n, 24);
  assert.equal(parseLevelParam("?level=1", n), 0);
  assert.equal(parseLevelParam("?level=24", n), 23);
  assert.equal(MISSIONS[parseLevelParam("?level=10", n)!].id, 10);
  for (const bad of ["", "?level=0", "?level=25", "?level=-2", "?level=2.5", "?level=abc", "?stage=3"])
    assert.equal(parseLevelParam(bad, n), null, bad);
});
