# Sportz WebSocket 🏆

A real-time sports match tracking API built with **Node.js**, **Express 5**, **WebSockets** (`ws`), **PostgreSQL**, and **Drizzle ORM**. Matches are created via a REST API and immediately broadcast to all connected WebSocket clients. Security is handled by [Arcjet](https://arcjet.com) — rate limiting and shield protection on both HTTP and WebSocket layers.

---

## 📁 Project Structure

```
Sportz_Websocket-main/
├── package.json
├── drizzle.config.js               # Drizzle Kit config (schema path, DB dialect, migrations folder)
├── drizzle/
│   ├── 0000_gifted_nightmare.sql   # Initial migration — creates matches, commentary tables & enum
│   └── meta/
│       ├── 0000_snapshot.json      # Drizzle schema snapshot
│       └── _journal.json           # Migration journal
└── src/
    ├── index.js                    # App entry point — wires Express, HTTP server, WebSocket
    ├── arcjet.js                   # Arcjet security (HTTP middleware + WS guard)
    ├── db/
    │   ├── db.js                   # Drizzle + pg Pool connection
    │   └── schema.js               # DB schema: matches table, commentary table, match_status enum
    ├── routes/
    │   └── matches.js              # REST routes: POST /matches, GET /matches
    ├── utils/
    │   └── match-status.js         # Auto-derive match status from startTime/endTime
    ├── validation/
    │   └── matches.js              # Zod schemas: createMatch, listMatches, updateScore, matchId
    └── ws/
        └── server.js               # WebSocket server — connection lifecycle, heartbeat, broadcast
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher (ESM support required)
- PostgreSQL database
- [Arcjet](https://arcjet.com) account & API key

### Installation

```bash
git clone https://github.com/your-username/Sportz_Websocket.git
cd Sportz_Websocket
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/sportz
ARCJET_KEY=your_arcjet_api_key_here
ARCJET_MODE=DRY_RUN       # Use LIVE to enforce rules, DRY_RUN to observe only
PORT=8000                  # Optional, defaults to 8000
HOST=0.0.0.0               # Optional, defaults to 0.0.0.0
```

> ⚠️ `ARCJET_KEY` is **required** — the server will throw on startup if it is missing.

### Database Setup

Run the Drizzle migration to create the tables:

```bash
npx drizzle-kit migrate
```

Or push the schema directly (no migration files):

```bash
npx drizzle-kit push
```

### Running the Server

```bash
# Production
npm start

# Development (auto-restart on file changes)
npm run dev
```

The server starts on port `8000` by default:

```
server listens at http://localhost:8000
ws running on ws://localhost:8000/ws
```

---

## 🔌 REST API

All routes are prefixed with `/matches`. Request bodies must be `application/json`.

### `POST /matches` — Create a match

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `sport` | string | ✅ | e.g. `"football"`, `"basketball"` |
| `homeTeam` | string | ✅ | Home team name |
| `awayTeam` | string | ✅ | Away team name |
| `startTime` | ISO 8601 string | ✅ | e.g. `"2025-06-01T15:00:00.000Z"` |
| `endTime` | ISO 8601 string | ✅ | Must be after `startTime` |
| `homeScore` | integer ≥ 0 | ❌ | Defaults to `0` |
| `awayScore` | integer ≥ 0 | ❌ | Defaults to `0` |

**Status is auto-derived:**
- `startTime` in the future → `scheduled`
- Between `startTime` and `endTime` → `live`
- Past `endTime` → `finished`

**Response `201`:**
```json
{
  "data": {
    "id": 1,
    "sport": "football",
    "homeTeam": "Arsenal",
    "awayTeam": "Chelsea",
    "status": "scheduled",
    "startTime": "2025-06-01T15:00:00.000Z",
    "endTime": "2025-06-01T17:00:00.000Z",
    "homeScore": 0,
    "awayScore": 0,
    "createdAt": "2025-04-21T10:00:00.000Z"
  }
}
```

On success, the new match is **broadcast to all WebSocket clients** as:
```json
{ "type": "match created", "data": { ...match } }
```

---

### `GET /matches` — List matches

**Query parameters:**

| Param | Type | Description |
|---|---|---|
| `limit` | integer 1–100 | Max records to return (default: 50) |

**Response `200`:** Array of match objects, ordered by `createdAt` descending.

---

## 🔄 WebSocket API

Connect to:
```
ws://localhost:8000/ws
```

### Server → Client messages

| `type` | When | Payload |
|---|---|---|
| `welcome` | On connection | `{ "type": "welcome" }` |
| `match created` | When a new match is POSTed | `{ "type": "match created", "data": { ...match } }` |

### Heartbeat

The server pings all clients every **30 seconds**. Clients that do not respond with a `pong` are automatically terminated. This keeps stale connections from accumulating.

### Max payload

WebSocket messages are capped at **1 MB** (`maxPayload: 1024 * 1024`).

---

## 🛡️ Security (Arcjet)

Security is applied at two layers, both configurable via `ARCJET_MODE` (`LIVE` or `DRY_RUN`).

### HTTP (`/matches` routes)
- **Shield** — blocks common web attacks (SQL injection, XSS, etc.)
- **Sliding window rate limit** — max **500 requests per 10 seconds**
- Returns `429` on rate limit, `403` on shield block

### WebSocket (upgrade handshake)
- **Shield** — same attack protection
- **Sliding window rate limit** — max **5 connections per 2 seconds** (tighter to prevent connection flooding)
- Destroys the raw socket before the WebSocket handshake completes if denied

> Bot detection (`detectBot`) is configured in the code but currently **commented out** on both layers — easy to enable.

---

## 🗄️ Database Schema

### `match_status` enum
```
scheduled | live | finished
```

### `matches` table

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | Auto-increment |
| `sport` | text | Required |
| `home_team` | text | Required |
| `away_team` | text | Required |
| `status` | match_status | Default: `scheduled` |
| `start_time` | timestamptz | Optional |
| `end_time` | timestamptz | Optional |
| `home_score` | integer | Default: `0` |
| `away_score` | integer | Default: `0` |
| `created_at` | timestamptz | Default: `now()` |

### `commentary` table

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `match_id` | integer FK | References `matches.id`, cascade delete |
| `minute` | integer | Match minute |
| `sequence` | integer | Order within a minute |
| `period` | text | e.g. `"1st Half"`, `"2nd Quarter"` |
| `event_type` | text | e.g. `"goal"`, `"foul"`, `"timeout"` |
| `actor` | text | Player involved |
| `team` | text | Team involved |
| `message` | text | Required |
| `metadata` | jsonb | Default: `{}` |
| `tags` | text[] | Array of tags |
| `created_at` | timestamptz | Default: `now()` |

---

## 📦 Dependencies

| Package | Purpose |
|---|---|
| `express` | HTTP server & routing (v5) |
| `ws` | WebSocket server |
| `drizzle-orm` | Type-safe ORM for PostgreSQL |
| `pg` | PostgreSQL client (connection pool) |
| `zod` | Input validation schemas |
| `dotenv` | `.env` file loading |
| `@arcjet/node` | Security — rate limiting, shield, bot detection |
| `@arcjet/inspect` | Arcjet decision inspection helpers |
| `drizzle-kit` | CLI for migrations and schema push (dev) |

---

## ✅ What's Complete

- ✅ REST API: create and list matches
- ✅ Auto-derived match status from `startTime` / `endTime`
- ✅ WebSocket server with welcome message on connect
- ✅ Real-time broadcast of new matches to all WS clients
- ✅ WebSocket heartbeat (ping/pong every 30s, dead client cleanup)
- ✅ Arcjet HTTP middleware (rate limiting + shield)
- ✅ Arcjet WebSocket guard at upgrade stage
- ✅ Zod validation for all inputs
- ✅ Drizzle ORM schema with migration

## 🔧 Known Gaps / Potential Improvements

- [ ] **Commentary routes** — the `commentary` table is defined in the schema and migration, but no REST or WS endpoints exist for it yet
- [ ] **`updateScoreSchema` and `matchIdParamSchema`** — defined in `validation/matches.js` but not used anywhere (no PATCH/PUT route implemented)
- [ ] **No `GET /matches/:id`** — single-match fetch is missing
- [ ] **WS clients cannot send messages** — the server only broadcasts; no inbound WS message handling is implemented
- [ ] **No `.env.example`** — the `.gitignore` whitelists it (`!.env.example`) but the file doesn't exist in the repo
- [ ] **Bot detection commented out** — `detectBot` is present in `arcjet.js` but disabled on both HTTP and WS layers
- [ ] **No authentication** — any client can connect to the WS endpoint or call the REST API (beyond Arcjet rate limiting)
- [ ] **`wcat` dependency** — listed in `package.json` but not used anywhere in the source code

---

## Work in Progress
