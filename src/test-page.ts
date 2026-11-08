// Minimal hand-written reproduction of the claude.ai Code session page structure
// used by the tests. It contains only the elements that src/session.ts reads.

export interface RowFixture {
  sessionId: string;
  attention?: "waiting" | "unread";
  statusText?: string;
}

export interface PageFixture {
  /** Session name in the pane header. undefined omits the header element. */
  title?: string;
  /** Value of data-turn-working. undefined omits the working-line element. */
  working?: "true" | "false";
  rows?: RowFixture[];
}

const escapeHtml = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function renderRow(row: RowFixture): string {
  const attention = row.attention ? ` data-attention="${row.attention}"` : "";
  const status = escapeHtml(row.statusText ?? "");
  return `
    <div data-row-key="code:${row.sessionId}">
      <a href="/code/${row.sessionId}">
        <span data-row-label="iconless"><span><span${attention}>Some session<span role="status" data-find-omitted="">${status}</span><span data-find-omitted=""> cloud</span></span></span></span>
      </a>
    </div>`;
}

export function renderPage(doc: Document, page: PageFixture): void {
  const header =
    page.title === undefined
      ? ""
      : `<h2><button type="button" data-pane-title="">${escapeHtml(page.title)}</button></h2>`;
  const workingLine =
    page.working === undefined
      ? ""
      : `<div data-testid="code-working-line" data-turn-working="${page.working}"><div role="status"></div></div>`;
  const rows = (page.rows ?? []).map(renderRow).join("");
  doc.body.innerHTML = `
    <nav data-testid="sidebar">${rows}</nav>
    <main>${header}${workingLine}</main>`;
}
