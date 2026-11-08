# cctitle

A Chrome extension that shows the state and name of a Claude Code session in the browser tab title on claude.ai.

On a Claude Code session page (`https://claude.ai/code/session_...`), every tab is titled `Claude Code`. This extension rewrites the title of each session tab as follows and keeps it up to date while the page changes:

```
CC [Running] Design the search API
```

## States

| State | Meaning |
| --- | --- |
| `Running` | The agent is working on the current turn. |
| `Waiting` | The session needs your input, such as a tool permission or an answer to a question. |
| `Error` | The session stopped with an error, for example after reaching the usage limit. |
| `Idle` | The turn has finished and the session is waiting for the next instruction. |

When the state cannot be determined (for example, an older session that is not listed in the sidebar), the title is `CC <session name>` without a state.

Limitations:

- `Error` is detected from the Japanese UI text `エラーが発生しました`. With other UI languages, an errored session is shown as `Idle`.
- The extension reads the claude.ai page structure, which is not a public interface. If claude.ai changes it, states or titles may stop updating. The selectors are kept in `src/session.ts`.
- Pages other than session pages keep the title set by claude.ai.

The extension requests no Chrome permissions. It reads the session name and state from the page and does not store or send them anywhere.

## Install

Requirements: Node.js and pnpm (the version is pinned in the `packageManager` field of `package.json`).

```sh
pnpm install
pnpm build
```

`pnpm build` writes `extension/content.js`. Then load the extension in Chrome:

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select the `extension/` directory.
4. Reload the Claude Code session pages that are already open. The extension takes effect only on pages loaded after it is installed.

After changing the source, run `pnpm build` again, click the reload button of the extension in `chrome://extensions`, and reload the open Claude Code session pages.

## Development

```sh
pnpm typecheck  # type check
pnpm test       # unit tests (vitest + jsdom)
pnpm build      # bundle src/content.ts into extension/content.js
```
