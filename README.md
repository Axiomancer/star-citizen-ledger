# Game Ledger

> Local game economy tracker for Star Citizen, EVE Online, Elite Dangerous, and any other game with an in-game economy.

Track mining runs, trading routes, crafting chains, contracts, crew payouts, and full accounting — all stored locally on your machine. No accounts, no cloud, no internet required.

---

## Features

| Module | What it tracks |
|---|---|
| **Runs** | Sessions with start/end time, vehicle used, profit-per-hour |
| **Mining** | Raw ore → refinery → refined output → sale pipeline |
| **Trading** | Buy low / sell high routes with margin tracking |
| **Crafting** | Manufacturing chains with material costs and output values |
| **Contracts** | Combat, hauling, escort, refueling missions and their payouts |
| **Crew** | Multi-crew sessions with fixed-fee or % profit allocation |
| **Expenses** | Itemised investments and costs (fuel, repairs, equipment) |
| **Inventory** | Stock levels with average cost basis |
| **Accounting** | Full ledger: income, expenses, crew payouts, net profit per game |

---

## Installation (Windows)

Download the latest release from the [Releases page](../../releases):

- **`Game Ledger-x.x.x-x64-Setup.exe`** — installs to Program Files, adds Start Menu shortcut *(recommended)*
- **`Game Ledger-x.x.x-x64-Portable.exe`** — no install needed, run from anywhere

Your data is stored in `%APPDATA%\Game Ledger\data\` and persists across app updates.

---

## Is it offline?

**Yes, 100%.** Nothing leaves your machine:

- All API calls use relative URLs (`/api/...`) — they go to the embedded Express server running on `127.0.0.1:3001`
- The database is a local SQLite file at `%APPDATA%\Game Ledger\data\game-ledger.db` via `@libsql/client` with a `file:` URL — no `authToken`, no `syncUrl`, no remote connection
- The HTML template has no CDN links, no external fonts, no analytics
- Electron is launched with `--no-proxy-server` and Chrome features `AutoupgradeMixedContent` / `CertificateTransparencyComponentUpdater` disabled
- A `will-navigate` guard in the main process blocks any navigation away from `127.0.0.1` — even if a third-party library somehow tried to redirect the window

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite 5 + Tailwind CSS v3 |
| Backend | Node.js + Express + TypeScript |
| Database | SQLite via `@libsql/client` (prebuilt N-API binary — no compilation needed) |
| Desktop | Electron 28 |
| Packaging | electron-builder (NSIS installer + portable exe) |
| Monorepo | pnpm workspaces |

---

## Development

**Prerequisites:** Node.js 22, pnpm 9

```powershell
# Install workspace deps (server + client)
pnpm install

# Start dev servers (two terminals)
pnpm run dev:server   # Express on :3001
pnpm run dev:client   # Vite on :5173 (proxies /api → :3001)
```

The client proxies all `/api` requests to the server so hot-reload works seamlessly.

### Building locally

```powershell
# Full production build + package to release/
pnpm run package

# Quick test — unpacked directory, no installer (faster)
pnpm run package:dir
```

---

## Releasing to GitHub

Releases are automated via GitHub Actions. Push a version tag and the workflow builds the installer + portable exe and attaches them to a GitHub Release automatically.

```powershell
git tag v1.0.0
git push origin v1.0.0
```

The workflow (`release.yml`) runs on `windows-latest`, compiles the server and client, packages with electron-builder, and publishes the `.exe` files to the release.

Pre-release tags work too: `v1.0.0-beta.1` is automatically marked as a pre-release.

---

## Project structure

```
.
├── client/          React + Vite frontend
│   └── src/
│       ├── components/ui/   Shared UI primitives (Card, Button, Badge, Table, Modal)
│       ├── hooks/           React Query hooks
│       ├── lib/             api.ts (all API calls), utils.ts
│       └── pages/           One file per route (Dashboard, Runs, RunDetail, Mining, …)
├── server/          Express + TypeScript API
│   └── src/
│       ├── db/              @libsql/client wrapper + CREATE TABLE schema + seed data
│       └── routes/          12 route files (games, crew, vehicles, runs, mining, …)
├── electron/        Electron main process + packaging config
│   ├── main.js              Single-instance lock, server startup, BrowserWindow
│   └── package.json         electron-builder config (NSIS + portable, extraResources)
├── scripts/
│   └── prepare-electron.js  Copies server/dist → electron/server-dist before packaging
└── .github/workflows/
    └── release.yml          Tag-triggered CI: build → package → publish release
```

---

## Data location

| Context | Path |
|---|---|
| Packaged app | `%APPDATA%\Game Ledger\data\game-ledger.db` |
| Dev / server | `server/data/game-ledger.db` |

The `data/` directories are in `.gitignore` — your game data is never committed.
