# First Things

A minimalist, keyboard-first TODO app that organises tasks on a four-quadrant
importance/urgency matrix (the Randy Pausch / Eisenhower matrix), instead of a
flat list. Important quadrants are on top; urgent quadrants are on the right
by default:

| Priority | Position     | Title     | Meaning                      |
|----------|--------------|-----------|------------------------------|
| 1        | top-right    | Do        | Urgent and important         |
| 2        | top-left     | Plan      | Important but not urgent     |
| 3        | bottom-right | Delegate  | Urgent but not important     |
| 4        | bottom-left  | Eliminate | Not urgent and not important |

**Live app:** https://lucijanblagonic.github.io/first-things/

Prefer the classic Eisenhower layout with **Do** in the top-left? Open
**Settings** (gear icon, `?`, or `⌘/Ctrl + ,`) and set *Urgent column* to
**Left**. Only the columns swap; the important row always stays on top, and
the `1`–`4` keys still follow priority.

The first time you open it in a browser, the board starts with three example
tasks that show due dates and notes. They are ordinary tasks: delete them and
they stay gone.

## Header and Settings

The header holds the title and two icon buttons (hover or focus them for a
tooltip):

- **Theme** (monitor / sun / moon): cycles System → Light → Dark. System
  follows your OS setting.
- **Settings** (gear): *Layout* (urgent column right or left), *Appearance*
  (High contrast: darker borders, a stronger focus ring and outlined buttons;
  on by default if your OS asks for increased contrast), *Keyboard*
  (turn single-key shortcuts on or off), *Data* (Export file, Import file,
  Copy and Paste, see [Back up or move your board](#back-up-or-move-your-board)),
  and a grouped *Shortcuts* reference.

It's a static site: no build step, no framework, no runtime dependencies.
Data is stored in the browser only, via `localStorage`.

## Install as an app

The live app can be installed so it opens in its own window, like a native app:

- **Chrome or Edge:** open the live URL and click the install icon in the
  address bar.
- **Safari on macOS:** File → Add to Dock.
- **iPhone or iPad:** Share → Add to Home Screen.

Once installed it works offline after the first visit, and new versions arrive
automatically the next time it is opened online. On a desktop browser the
installed app and the browser tab share the same board; on iOS the Home Screen
app keeps its own board, separate from Safari's.

## Running locally

```sh
nvm use          # Node >= 20 (repo pins 22 via .nvmrc)
npm install
npm run serve     # serves the repo root at http://localhost:4173
```

Then open http://localhost:4173/ in a browser.

> **Note:** opening `index.html` directly via `file://` does **not** work —
> the app is built from native ES modules, which browsers only load over
> HTTP(S). Always use `npm run serve` (or any other static file server).

## Testing

```sh
npm test           # unit tests (node:test) for src/core/*
npm run test:e2e    # Playwright end-to-end tests (Chromium, Firefox, WebKit)
```

The PNG icons in `icons/` are rendered from the SVGs next to them with
`node scripts/render-icons.mjs` and committed; re-run it after editing an SVG.

`test:e2e` starts its own local server automatically (see
`playwright.config.js`), so you don't need `npm run serve` running first.

## Keyboard shortcuts

Buttons show their shortcut as a keycap (for example "Add task `N`"). Press
`?`, `⌘/Ctrl + ,`, or use the gear button to open Settings, which lists every
shortcut (it's generated from the same table the app uses, so it can't drift).
Single-key shortcuts (digits, letters, `?`) can be turned off in Settings if they conflict with assistive technology or voice control; Escape,
Enter, arrow keys, Space, and all Ctrl/⌘ combinations keep working either way.

| Keys | Action |
|------|--------|
| `1` `2` `3` `4` | Focus the quadrant with that priority |
| `↑` / `↓` (also `k` / `j`) | Focus previous / next task in the current quadrant |
| `←` / `→` (also `h` / `l`) | Focus the quadrant to the left / right (follows the layout setting) |
| `n` or `c` | Open the add input in the current quadrant |
| `Enter` or `e` | Open the edit dialog for the focused task |
| `x` or `Space` | Toggle completion of the focused task |
| `Backspace` or `Delete` | Delete the focused task (with undo) |
| `Ctrl`/`⌘` + `z` | Undo the last delete |
| `Ctrl`/`⌘` + `↑` / `↓` | Move the focused task up / down within its quadrant |
| `Ctrl`/`⌘` + `←` / `→` | Move the focused task to the quadrant to the left / right |
| `Shift` + `1`–`4` | Move the focused task to that quadrant |
| `?` | Open Settings |
| `Ctrl`/`⌘` + `,` | Open Settings (also while typing) |
| `Escape` | Close a dialog or tooltip, cancel the add input, or collapse a completed list |

Tasks are also fully operable with a mouse, including drag & drop to reorder
or move between quadrants.

## Data storage

Tasks and preferences are stored in your browser's `localStorage`, scoped to
this site's origin. This means:

- Data is **per browser, per device** — there is no account or sync.
- Everyone who opens the live URL gets their own separate, private board;
  nobody can see anyone else's tasks.
- The installed app and the browser tab on the same browser profile share the
  same board.
- Clearing your browser's site data for this page **deletes your tasks**.
- Private/incognito windows and browsers with `localStorage` disabled fall
  back to in-memory storage for the session (with a banner warning that
  changes won't be saved).

### Back up or move your board

Settings → **Data** takes your tasks out and brings them back in:

- **Export file** saves all tasks as a JSON file
  (`first-things-YYYY-MM-DD.json`). **Import file**, on any computer,
  replaces that board with the file's tasks after a confirmation that shows
  how many tasks will be replaced and how many will be loaded.
- **Copy** and **Paste** do the same through the clipboard. With Apple's
  Universal Clipboard that means Copy on an iPhone and Paste on a Mac (or the
  other way round): both devices need to be signed in to the same Apple
  account with Handoff on, and the paste has to happen within about two
  minutes. If the browser won't let the app read the clipboard, a text field
  appears to paste into instead.

Import and Paste **replace** the board; they do not merge. Tasks only: theme,
layout and shortcut preferences are not included. The board that was replaced
is kept as a `decision-matrix:backup-…` entry in the browser's `localStorage`
(the app was called Decision Matrix before it was First Things; storage keys
keep the old prefix so existing boards carry over).
Files or text that aren't a First Things board, or that come from a newer
version of the app, are rejected and change nothing.

Storage is implemented behind a small adapter interface
(`src/core/storage/adapter.js`), so a future change could add a synced
backend (e.g. a Gist-based adapter) without touching the rest of the app.

## Project docs

See [`openspec/`](./openspec) for the proposal, specs, and design decisions
behind this app.

## Credits

Icons from [Lucide](https://lucide.dev) (ISC license).
