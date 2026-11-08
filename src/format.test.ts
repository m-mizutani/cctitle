import { describe, expect, it } from "vitest";
import { formatTabTitle } from "./format";
import type { SessionState } from "./session";

describe("formatTabTitle", () => {
  it.each<SessionState>(["Running", "Waiting", "Error", "Idle"])(
    "puts the %s state in brackets before the title",
    (state) => {
      expect(formatTabTitle({ title: "検索APIの設計", state })).toBe(`CC [${state}] 検索APIの設計`);
    },
  );

  it("omits the brackets when the state is unknown", () => {
    expect(formatTabTitle({ title: "検索APIの設計", state: null })).toBe("CC 検索APIの設計");
  });
});
