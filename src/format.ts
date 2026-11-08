import type { ObservedSession } from "./session";

export function formatTabTitle(session: ObservedSession): string {
  return session.state
    ? `CC [${session.state}] ${session.title}`
    : `CC ${session.title}`;
}
