import { beforeEach, describe, expect, it } from "vitest";
import { parseSessionId, readSession } from "./session";
import { renderPage } from "./test-page";

const SESSION = "session_01ABC";
const OTHER_SESSION = "session_09XYZ";
const TITLE = "検索APIの設計";

describe("parseSessionId", () => {
  it("returns the session ID of a session page", () => {
    expect(parseSessionId("/code/session_01ABC")).toBe("session_01ABC");
  });

  it("accepts a trailing slash", () => {
    expect(parseSessionId("/code/session_01ABC/")).toBe("session_01ABC");
  });

  it.each(["/code", "/code/", "/code/routines/trig_01X", "/cowork/cse_01X", "/"])(
    "returns null for the non-session path %s",
    (pathname) => {
      expect(parseSessionId(pathname)).toBeNull();
    },
  );

  it("returns null when the ID contains characters outside [A-Za-z0-9]", () => {
    expect(parseSessionId('/code/session_01"]x')).toBeNull();
  });
});

describe("readSession", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("returns Waiting when the row has data-attention=waiting", () => {
    renderPage(document, {
      title: TITLE,
      working: "false",
      rows: [{ sessionId: SESSION, attention: "waiting", statusText: " 入力待ち" }],
    });
    expect(readSession(document, SESSION)).toEqual({ title: TITLE, state: "Waiting" });
  });

  it("prefers Waiting over Running", () => {
    renderPage(document, {
      title: TITLE,
      working: "true",
      rows: [{ sessionId: SESSION, attention: "waiting", statusText: " 入力待ち" }],
    });
    expect(readSession(document, SESSION)?.state).toBe("Waiting");
  });

  it("returns Running when data-turn-working is true", () => {
    renderPage(document, {
      title: TITLE,
      working: "true",
      rows: [{ sessionId: SESSION, statusText: " 実行中" }],
    });
    expect(readSession(document, SESSION)?.state).toBe("Running");
  });

  it("returns Running when the session has no row", () => {
    renderPage(document, { title: TITLE, working: "true", rows: [] });
    expect(readSession(document, SESSION)?.state).toBe("Running");
  });

  it("returns Error for the error status text, ignoring surrounding spaces", () => {
    renderPage(document, {
      title: TITLE,
      working: "false",
      rows: [{ sessionId: SESSION, statusText: " エラーが発生しました" }],
    });
    expect(readSession(document, SESSION)?.state).toBe("Error");
  });

  it("prefers Running over Error", () => {
    renderPage(document, {
      title: TITLE,
      working: "true",
      rows: [{ sessionId: SESSION, statusText: " エラーが発生しました" }],
    });
    expect(readSession(document, SESSION)?.state).toBe("Running");
  });

  it.each([
    { name: "empty status text", row: { sessionId: SESSION, statusText: "" } },
    {
      name: "unread reply",
      row: { sessionId: SESSION, attention: "unread" as const, statusText: " 未読の返答" },
    },
    { name: "unknown status text", row: { sessionId: SESSION, statusText: " 完了" } },
  ])("returns Idle for $name", ({ row }) => {
    renderPage(document, { title: TITLE, working: "false", rows: [row] });
    expect(readSession(document, SESSION)?.state).toBe("Idle");
  });

  it("returns a null state when there is no row and the turn is not working", () => {
    renderPage(document, { title: TITLE, working: "false", rows: [] });
    expect(readSession(document, SESSION)).toEqual({ title: TITLE, state: null });
  });

  it("returns a null state when neither the row nor the working line exists", () => {
    renderPage(document, { title: TITLE, rows: [] });
    expect(readSession(document, SESSION)?.state).toBeNull();
  });

  it("reads only the row of the current session", () => {
    renderPage(document, {
      title: TITLE,
      working: "false",
      rows: [
        { sessionId: OTHER_SESSION, attention: "waiting", statusText: " 入力待ち" },
        { sessionId: SESSION, statusText: "" },
      ],
    });
    expect(readSession(document, SESSION)?.state).toBe("Idle");
  });

  it("returns null when the pane title element is missing", () => {
    renderPage(document, { working: "true", rows: [{ sessionId: SESSION }] });
    expect(readSession(document, SESSION)).toBeNull();
  });

  it("returns null when the pane title is only whitespace", () => {
    renderPage(document, { title: "   ", working: "true" });
    expect(readSession(document, SESSION)).toBeNull();
  });

  it("trims the pane title", () => {
    renderPage(document, { title: `  ${TITLE} `, working: "false", rows: [{ sessionId: SESSION }] });
    expect(readSession(document, SESSION)?.title).toBe(TITLE);
  });
});
