import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { renderPage } from "./test-page";
import { startTitleSync } from "./title-sync";

const SESSION = "session_01ABC";
const TITLE = "検索APIの設計";

// MutationObserver callbacks run as microtasks after the mutation; waiting for
// a macrotask guarantees they have been delivered.
const flushMutations = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe("startTitleSync", () => {
  let pathname: string;
  let stop: (() => void) | undefined;

  const start = () => {
    stop = startTitleSync(document, () => pathname);
  };

  const workingLine = () =>
    document.querySelector('[data-testid="code-working-line"]') as HTMLElement;

  beforeEach(() => {
    pathname = `/code/${SESSION}`;
    document.title = "Claude Code";
    renderPage(document, {
      title: TITLE,
      working: "false",
      rows: [{ sessionId: SESSION, statusText: "" }],
    });
  });

  afterEach(() => {
    stop?.();
    stop = undefined;
  });

  it("sets the title right after starting", () => {
    start();
    expect(document.title).toBe(`CC [Idle] ${TITLE}`);
  });

  it("updates the title when the turn starts working", async () => {
    start();
    workingLine().setAttribute("data-turn-working", "true");
    await flushMutations();
    expect(document.title).toBe(`CC [Running] ${TITLE}`);
  });

  it("updates the title when the session is renamed", async () => {
    start();
    workingLine().setAttribute("data-turn-working", "true");
    document.querySelector("button[data-pane-title]")!.textContent = "検索APIの実装";
    await flushMutations();
    expect(document.title).toBe("CC [Running] 検索APIの実装");
  });

  it("writes the title again after the page resets it", async () => {
    start();
    document.title = "Claude Code";
    await flushMutations();
    expect(document.title).toBe(`CC [Idle] ${TITLE}`);
  });

  it("restores the page's title after leaving the session page", async () => {
    start();
    pathname = "/code";
    document.body.innerHTML = "<main>new session</main>";
    await flushMutations();
    expect(document.title).toBe("Claude Code");
  });

  it("restores the latest title the page set while the session was shown", async () => {
    start();
    document.title = "Claude";
    await flushMutations();
    pathname = "/code";
    document.body.innerHTML = "<main>new session</main>";
    await flushMutations();
    expect(document.title).toBe("Claude");
  });

  it("does not change the title of a non-session page", async () => {
    pathname = "/";
    document.title = "Claude";
    start();
    document.body.innerHTML = "<main>home</main>";
    await flushMutations();
    expect(document.title).toBe("Claude");
  });

  it("waits until the pane title is rendered", async () => {
    renderPage(document, { working: "false", rows: [{ sessionId: SESSION }] });
    start();
    expect(document.title).toBe("Claude Code");

    const header = document.createElement("button");
    header.setAttribute("data-pane-title", "");
    header.textContent = TITLE;
    document.querySelector("main")!.append(header);
    await flushMutations();
    expect(document.title).toBe(`CC [Idle] ${TITLE}`);
  });

  it("switches the title when navigating to another session", async () => {
    start();
    pathname = "/code/session_02DEF";
    renderPage(document, {
      title: "検索APIの実装",
      working: "true",
      rows: [
        { sessionId: SESSION, statusText: "" },
        { sessionId: "session_02DEF", statusText: " 実行中" },
      ],
    });
    await flushMutations();
    expect(document.title).toBe("CC [Running] 検索APIの実装");
  });

  it("sets the title when navigating from a non-session page to a session page", async () => {
    pathname = "/";
    document.body.innerHTML = "<main>home</main>";
    start();
    expect(document.title).toBe("Claude Code");

    pathname = `/code/${SESSION}`;
    renderPage(document, {
      title: TITLE,
      working: "false",
      rows: [{ sessionId: SESSION, attention: "waiting", statusText: " 入力待ち" }],
    });
    await flushMutations();
    expect(document.title).toBe(`CC [Waiting] ${TITLE}`);
  });

  it("settles on one write when the session name contains repeated whitespace", async () => {
    renderPage(document, {
      title: "検索API  の\n設計",
      working: "false",
      rows: [{ sessionId: SESSION, statusText: "" }],
    });
    start();
    expect(document.title).toBe("CC [Idle] 検索API の 設計");

    let titleMutations = 0;
    const counter = new MutationObserver((records) => {
      titleMutations += records.length;
    });
    counter.observe(document.head, { subtree: true, childList: true, characterData: true });
    document.querySelector("main")!.append(document.createElement("span"));
    await flushMutations();
    await flushMutations();
    counter.disconnect();
    expect(titleMutations).toBe(0);

    pathname = "/code";
    document.body.innerHTML = "<main>new session</main>";
    await flushMutations();
    expect(document.title).toBe("Claude Code");
  });

  it("stops updating after the returned function is called", async () => {
    start();
    stop!();
    workingLine().setAttribute("data-turn-working", "true");
    await flushMutations();
    expect(document.title).toBe(`CC [Idle] ${TITLE}`);
  });
});
