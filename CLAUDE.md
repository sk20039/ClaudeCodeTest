# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A collection of single-file web apps. Each app is fully self-contained in one `.html` file — no build step, no dependencies, no package manager. Open any file directly in a browser.

## Running Apps

```bash
# Windows — open in default browser
start distribution-log.html
start tictactoe.html
```

## Git Workflow

**Commit and push after every meaningful unit of work.** This ensures no progress is ever lost and the GitHub repo always reflects the current state.

The remote is GitHub (`sk20039/ClaudeCodeTest`). The PAT is embedded in the remote URL, so `git push` works without additional auth prompts.

```bash
git add <file>
git commit -m "concise description of what changed and why"
git push
```

### When to commit
- After completing a feature or fix — even a small one.
- Before and after any significant refactor.
- Whenever the app is in a working state worth preserving.

### Commit message format
- Short imperative subject line: `Add export button to distribution log`
- If more context is needed, add a blank line then a brief body.
- Always append: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`

## Architecture Pattern

Every app follows the same pattern:

- **Single `.html` file** — styles in `<style>`, logic in `<script>`, no external assets.
- **Dark navy theme** — `#1a1a2e` body background, `#16213e` card/surface, `#0f3460` borders, `#e94560` accent red, `#a8dadc` secondary accent.
- **No backend** — persistence via `localStorage` (survives page refresh) or `sessionStorage` (cleared on tab close).

### distribution-log.html

Three views toggled by JS (`login-view` / `app-view`):
- Login checks hardcoded credentials (`admin` / `1234`), sets `sessionStorage.loggedIn`.
- Form submits records as JSON into `localStorage` key `distro-log` (array, newest-first).
- History table re-renders from `localStorage` on every submit or page load.
- All user strings rendered into the table are HTML-escaped via `escapeHtml()`.

### tictactoe.html

- Board state is a flat 9-element array; win conditions are hardcoded index triples.
- Scores tracked in a plain JS object `{ X, O, T }` (in-memory only, reset on refresh).
