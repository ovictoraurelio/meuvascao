import { describe, expect, it } from "vitest";

import { findUnpinned } from "../../scripts/check-actions-pinned.mjs";

describe("gate: actions fixadas por SHA", () => {
  it("aceita SHA completo e ações locais", () => {
    const yaml = [
      "steps:",
      "  - uses: actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803 # v6",
      "  - uses: ./.github/actions/local",
    ].join("\n");
    expect(findUnpinned(yaml)).toEqual([]);
  });

  it("rejeita tag, branch e SHA curto", () => {
    const yaml = [
      "  - uses: actions/checkout@v4",
      "  - uses: actions/setup-node@main",
      "  - uses: actions/upload-artifact@b7c566a7",
    ].join("\n");
    expect(findUnpinned(yaml).map((u) => u.ref)).toEqual([
      "actions/checkout@v4",
      "actions/setup-node@main",
      "actions/upload-artifact@b7c566a7",
    ]);
  });
});
