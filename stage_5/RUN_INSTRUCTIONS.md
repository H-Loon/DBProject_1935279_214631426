# Stage 5 – GUI: Installation & Run Instructions

A web application (React + Express + PostgreSQL) for managing the
NexusCommerce e-commerce database and its integrated logistics data.

* **Frontend:** React + TypeScript + Vite + Tailwind CSS (the "NexusCommerce" look)
* **Backend:** Node.js + Express + the `pg` PostgreSQL driver
* **Database:** PostgreSQL / Supabase (local `public` schema + the integrated
  `remote_logistics` schema via `postgres_fdw`)

The browser never talks to PostgreSQL directly. React calls a small Express API
(`/api/*`), and Express talks to the database. This is what lets the app run the
`REF CURSOR` function, `CALL` the procedures, and run the Stage-2 queries
verbatim — and it keeps the database password on the server only.

---

## 1. Prerequisites

* **Node.js 18+** (tested on Node 24). Check with `node --version`.
* Network access to the Supabase / PostgreSQL database.

## 2. Install

From the `stage_5/app` folder:

```bash
npm install
```

## 3. Configure the database connection

Copy the example env file and fill in the credentials of the **integrated**
Supabase project:

```bash
cp .env.example .env       # Windows PowerShell: copy .env.example .env
```

Open `.env` and set the values from the Supabase dashboard
(**Connect → Connection string → "Session pooler"**):

```env
PGHOST=aws-1-<region>.pooler.supabase.com   # use the Session pooler host (IPv4)
PGPORT=5432
PGDATABASE=postgres
PGUSER=postgres.<project-ref>                # pooler user = postgres.<project-ref>
PGPASSWORD=<your-db-password>
PGSSLMODE=require
```

> Why the pooler? The direct host `db.<ref>.supabase.co` is IPv6-only and won't
> resolve on most networks. The Session pooler host is IPv4-friendly.

`.env` also holds the **app login** (`APP_USER` / `APP_PASSWORD`, default
`admin` / `admin`) and the two schema names.

## 4. Run

```bash
npm run dev
```

This starts **both** processes together:
* Express API on `http://localhost:4000`
* React app on `http://localhost:3000` (Vite) — **open this in your browser.**

> The Vite dev server proxies all `/api` calls to the Express backend, so you
> only ever open the one URL it prints.

## 5. Using the app

1. **Login** – default `admin` / `admin`.
2. **Dashboard** – tiles for every table, grouped by area, plus a
   **Queries & Procedures** button. A pill in the top bar shows whether the
   database is connected.
3. **Table screen (CRUD)** – for every table:
   * **Browse / Search** – foreign keys are shown as **names** (e.g. the
     category name, not its id); surrogate ids are never shown.
   * **Add New** – a form whose foreign keys are **dropdowns of names**; the id
     is generated automatically.
   * **Edit** – pick a row → the system **loads its current values** → edit →
     save (matches the "fill the key, system brings the rest" requirement).
   * **Delete** – with confirmation.
   * Remote logistics tables are browse-only (they are changed *indirectly* by
     the Stage-4 procedures).
4. **Queries & Procedures** – run any Stage-2 query, Stage-3 view, or the
   Stage-4 functions / procedures, supplying parameters (foreign-key
   parameters are dropdowns of names). `NOTICE` output from the PL/pgSQL code
   is shown, so you can see exactly what each procedure did.

---

## 6. Project structure

```
stage_5/
├── app/
│   ├── package.json          # one install, one `npm run dev`
│   ├── vite.config.ts        # React dev server + /api proxy
│   ├── .env.example          # *** copy to .env and fill in DB credentials ***
│   ├── server/               # Express + pg backend
│   │   ├── index.ts          #   API entry point
│   │   ├── db.ts             #   connection pool (reads .env)
│   │   ├── schema.ts         #   live schema introspection
│   │   ├── overrides.ts      #   per-table hints (labels, remote PKs)
│   │   ├── crud.ts           #   generic CRUD with FK-name resolution
│   │   ├── queries.ts        #   Stage-2 queries + Stage-3 views
│   │   └── subprograms.ts    #   Stage-4 functions & procedures
│   └── src/                  # React + TypeScript frontend
│       ├── App.tsx           #   shell, sidebar, routing
│       ├── api.ts            #   typed fetch helpers
│       └── components/       #   Login, Dashboard, CrudView, RecordForm, ToolsView, ui
├── images/                   # screenshots of the running app
└── RUN_INSTRUCTIONS.md       # this file
```

---

## 7. Troubleshooting

| Symptom | Fix |
|---|---|
| Top bar shows "Database offline" | Check `.env` (host/user/password). Use the **Session pooler** host, not the direct `db.*` host. |
| `tenant/user ... not found` | Wrong pooler user — it must be `postgres.<project-ref>`, and the project ref must match the integrated project. |
| `ENOTFOUND` on the host | The host string is wrong or still a placeholder (`<region>`). Copy it from the Supabase Session pooler string. |
| A remote-logistics view errors | The `postgres_fdw` link (Stage 3) must be active and pointing at the running remote DB. |
| Stock error when adding an order item | Expected — the Stage-4 `BEFORE INSERT` trigger rejects orders above available stock. |
```
