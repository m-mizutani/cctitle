import { formatTabTitle } from "./format";
import { parseSessionId, readSession } from "./session";

// The document.title getter strips and collapses ASCII whitespace (HTML Standard).
// Comparing an unnormalized value with it would never match, so every write
// would trigger another mutation and another write.
const normalizeDocumentTitle = (title: string): string =>
  title.replace(/[\t\n\f\r ]+/g, " ").trim();

export function startTitleSync(
  doc: Document,
  getPathname: () => string,
): () => void {
  // The latest title set by claude.ai itself, restored when leaving a session page.
  let pageTitle = doc.title;
  // The title this extension last wrote, or null while the page's own title is shown.
  let writtenTitle: string | null = null;

  const sync = (): void => {
    if (doc.title !== writtenTitle) {
      pageTitle = doc.title;
    }

    const sessionId = parseSessionId(getPathname());
    const session = sessionId ? readSession(doc, sessionId) : null;

    let next: string;
    if (session) {
      next = normalizeDocumentTitle(formatTabTitle(session));
      // Recorded before writing so that the mutation caused by our own write is
      // not mistaken for a title change made by claude.ai.
      writtenTitle = next;
    } else {
      next = pageTitle;
      writtenTitle = null;
    }

    if (doc.title !== next) {
      doc.title = next;
    }
  };

  sync();

  // A MutationObserver is used instead of a timer because Chrome throttles
  // timers in background tabs, which would delay updates for exactly the tabs
  // this extension is meant to label.
  const observer = new MutationObserver(sync);
  observer.observe(doc.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["data-turn-working", "data-attention"],
  });

  return () => observer.disconnect();
}
