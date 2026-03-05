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

The remote is GitHub (`sk20039/ClaudeCodeTest`). After every meaningful change:

```bash
git add <file>
git commit -m "concise description of what changed and why"
git push
```

The PAT is embedded in the remote URL, so `git push` works without additional auth prompts.

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
