// All knowledge of the claude.ai DOM lives in this file. The selectors below were
// confirmed against page snapshots taken on 2026-11-08; claude.ai does not offer
// them as a public contract, so update them here when the page structure changes.

export type SessionState = "Running" | "Waiting" | "Error" | "Idle";

export interface ObservedSession {
  /** Trimmed session name shown in the pane header. Never empty. */
  title: string;
  /** null when the state cannot be determined from the page. */
  state: SessionState | null;
}

const PANE_TITLE_SELECTOR = "button[data-pane-title]";
const WORKING_LINE_SELECTOR = '[data-testid="code-working-line"]';
const WORKING_ATTRIBUTE = "data-turn-working";
const WAITING_SELECTOR = '[data-attention="waiting"]';
const ROW_STATUS_SELECTOR = '[role="status"][data-find-omitted]';
// The error row carries no attribute that distinguishes it, so the Japanese UI
// text is the only available signal. Other UI languages fall back to "Idle".
const ERROR_STATUS_TEXT = "エラーが発生しました";

// The ID is restricted to [A-Za-z0-9] so that it can be embedded in a CSS
// attribute selector without escaping.
const SESSION_PATH_PATTERN = /^\/code\/(session_[A-Za-z0-9]+)\/?$/;

const rowSelector = (sessionId: string): string =>
  `[data-row-key="code:${sessionId}"]`;

export function parseSessionId(pathname: string): string | null {
  const match = SESSION_PATH_PATTERN.exec(pathname);
  return match ? match[1] : null;
}

export function readSession(
  doc: Document,
  sessionId: string,
): ObservedSession | null {
  const title = doc.querySelector(PANE_TITLE_SELECTOR)?.textContent?.trim();
  if (!title) {
    return null;
  }

  const row = doc.querySelector(rowSelector(sessionId));
  const working =
    doc.querySelector(WORKING_LINE_SELECTOR)?.getAttribute(WORKING_ATTRIBUTE) ===
    "true";

  return { title, state: decideState(row, working) };
}

// Waiting is checked before Running because the waiting snapshot still showed
// "responding" texts elsewhere on the page. Running is checked before Error
// because data-turn-working does not depend on the UI language and is present
// even when the session has no sidebar row.
function decideState(row: Element | null, working: boolean): SessionState | null {
  if (row?.querySelector(WAITING_SELECTOR)) {
    return "Waiting";
  }
  if (working) {
    return "Running";
  }
  if (row?.querySelector(ROW_STATUS_SELECTOR)?.textContent?.trim() === ERROR_STATUS_TEXT) {
    return "Error";
  }
  if (row) {
    return "Idle";
  }
  return null;
}
