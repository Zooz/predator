# CLAUDE.md

Guidance for working in this repository.

## What Predator is

A load-testing control plane. It stores test definitions, schedules them, launches
**predator-runner** containers on an external platform (Kubernetes, Docker, Metronome or
AWS Fargate) to generate the load, collects the stats those runners report back, and serves
reports through a REST API and a React UI.

Predator itself never generates load. It only orchestrates runners and aggregates what they
send to `POST /v1/tests/:test_id/reports/:report_id/stats`.

## Commands

```bash
npm start                     # run the server (needs a DB; see Configuration)
npm run start-local           # same, loading .env via dotenv
npm run lint                  # eslint (flat config, see eslint.config.js)
npm run unit-tests            # mocha + c8 coverage gate
npm run local-integration-tests   # spins up DBs in docker, runs every db/platform combo
npm test                      # lint + unit tests + local integration tests
npm run setup-local-env       # interactive .env generator (setup-env.js)

cd ui && npm run build        # webpack production build into ui/dist
cd ui && npm start            # webpack dev server on :8080
cd ui && npx tsc --noEmit -p tsconfig.json   # typecheck (no npm script for this)
```

Integration tests take a while: `local-integration-tests` runs the suite five times, once per
database/platform combination, and each run starts real containers via
`tests/configurations/dockerRun.sh`.

## Layout

`src/` is split by domain, and each domain repeats the same four layers:

```
src/<domain>/
  routes/       express routers, request validation via express-ajv-swagger-validation
  controllers/  thin — call the manager, map the result to a response
  models/       the actual logic ("manager") plus its persistence layer
  models/database/sequelize/sequelizeConnector.js   all SQL for that domain
```

Domains: `tests` (definitions + DSL), `jobs` (scheduling + launching runners), `reports`
(results, aggregation, email/webhook notification), `processors` (user-supplied JS attached to
tests), `files` (CSV payloads), `webhooks`, `configManager` (runtime config), `chaos-experiments`
(Chaos Mesh integration), `streaming` (optional Kafka event stream).

Cross-cutting pieces:

- `src/app.js` — builds the express app, mounts every router, runs DB init and job reload.
- `src/server.js` — listens, then verifies `INTERNAL_ADDRESS` is reachable so runners can call back.
- `src/database/sequlize-handler/` — one shared Sequelize client, plus `migrations/` run by umzug
  at boot. Note the misspelled directory name (`sequlize-handler`); it is load-bearing in requires.
- `src/common/requestSender.js` — the single outbound HTTP helper. Uses `node:http`/`node:https`
  with `rejectUnauthorized: false`, because every caller talks to a cluster API over a self-signed
  cert. Returns the parsed body; pass `resolveWithFullResponse: true` for `{ statusCode, headers, body }`.
  Non-2xx rejects with an error carrying `.statusCode`, which callers branch on (e.g. metronome
  treats 404 as "job does not exist yet").
- `src/jobs/models/<platform>/jobConnector.js` — one per platform, all exposing the same
  `runJob / stopRun / getLogs / deleteAllContainers` shape. New platform = new directory here.

`docs/openapi3.yaml` is the API contract and is enforced at runtime by the swagger validator, so
adding or changing an endpoint means editing that file too.

## Configuration

Two separate mechanisms, and it matters which one you reach for:

- **Environment variables** — infrastructure-level, read at boot only. `DATABASE_TYPE`
  (`SQLITE`/`MYSQL`/`POSTGRES`/`MSSQL`), `DATABASE_ADDRESS`, `DATABASE_PORT`,
  `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `SQLITE_STORAGE`, `PORT`, `STREAMING_PLATFORM`.
  See `src/config/`.
- **Runtime config** — everything a user can change without a restart, stored in the DB and read
  through `configHandler.getConfigValue(CONFIG.X)`. Keys are listed in `src/common/consts.js`
  under `CONFIG` (`job_platform`, `runner_docker_image`, `internal_address`, `chaos_mesh_enabled`, …).
  Environment variables of the same name act as defaults.

If you are adding a knob a user should be able to change, it belongs in runtime config, not env.

## Conventions

- CommonJS throughout `src/` (`require`, not `import`). The UI is ESM.
- 4-space indent, semicolons, single quotes — enforced by `eslint.config.js` (neostandard).
  `camelcase` is a warning, not an error: database columns and API fields are snake_case
  (`test_id`, `report_id`, `arrival_rate`) and flow through the code unchanged.
- Managers throw errors with a `.statusCode` property; `src/app.js`'s error middleware turns that
  into the HTTP status. Use `src/common/generateError.js`.
- `uuid` is imported as the module and called as `uuid.v4()`. Do not import `uuid/v4` — that path
  was removed in uuid 7.

## Testing notes

Things that will bite you, all of which cost time to rediscover:

- **`rewire` isolates module globals.** A module loaded with `rewire()` does not see
  `sinon.useFakeTimers()`. Stub `Date.now` directly instead — see
  `tests/unit-tests/tests/models/sequelizeConnector-test.js`.
- **`uuid`'s CJS export exposes `v4` as a getter**, so `sinon.stub(uuid, 'v4')` silently does
  nothing. Replace the getter: `sandbox.stub(uuid, 'v4').get(() => stub)`.
- Coverage runs on **c8**, not nyc. nyc's instrumentation (via `spawn-wrap`) does not work on
  current Node and silently reported ~16%. The `--lines 65` threshold in `npm run unit-tests` is
  c8's measured baseline; it reads lower than a nyc number would because `rewire`d modules get
  attributed as uncovered.
- Integration tests hit a real database and real containers. They are not runnable in isolation
  without `tests/configurations/*` sourced first — go through `run.sh`. A single suite cannot be
  run on its own: app startup resolves the job-platform host, so it needs the full env.
- The suite is **not idempotent against a dirty database**. Several suites insert fixed-name rows
  (`processors-test.js` inserts 101 processors named `0`..`100`), so a reused database produces
  name-collision failures that look like real bugs. Each run gets its own sqlite file.
- **A green `npm run build` says nothing about whether the UI works.** Both times the UI was
  broken end-to-end during the Node 24 upgrade, webpack exited 0 and served a valid HTML shell
  with a white page behind it. Load a route in a real browser and assert `#root` has content.

## Deliberate dependency choices

- **No `artillery` dependency.** It was only ever required for one JSON schema file, which is now
  vendored at `src/tests/helpers/artillery-test-script.schema.json`. Refresh it from
  `artillery@1.x`'s `core/lib/schemas/artillery_test_script.json` if the test-script format changes.
- **No HTTP client library.** `request`/`request-promise-native` are deprecated and unpatched;
  outbound calls use `node:http(s)` (`requestSender`) or `fetch` directly.
- **`@aws-sdk/client-ecs` v3**, not `aws-sdk` v2.
- **`archiver` v8 has no callable default export.** Runner-log zipping uses
  `new ZipArchive()` from `require('archiver')`; `archiver('zip')` throws.
- **UI uses dart-sass (`sass`), not `node-sass`.** node-sass has no arm64 prebuilds and cannot
  compile against modern Node — it was the reason the image would not build on ARM.
- **`css-loader` is pinned to `modules.namedExport: false` + `exportLocalsConvention: 'as-is'`**
  in `ui/config/rules.js`. css-loader 7 flipped both defaults; with the defaults on, every
  `import css from './x.scss'` is `undefined` and the whole app white-screens on load. 30 files
  do default imports and look classes up as kebab-case, including SCSS `:export` blocks.
- **There must be exactly one copy of `monaco-editor` in `ui/node_modules`.**
  `monaco-editor-webpack-plugin` only rewrites the copy it resolves, so a second nested copy
  crashes at load with `Cannot set properties of undefined (setting 'apex')`. `monaco-editor` is
  therefore held at `^0.44.0` to match what `@uiw/react-monacoeditor` depends on. Before bumping
  monaco, check `find ui/node_modules -name monaco-editor -maxdepth 3` returns one path.
- `package.json` `overrides` blocks (root and `ui/`) pin patched transitive versions. Removing them
  reintroduces known advisories; check `npm audit --omit=dev` before touching them.

## UI design system

Direction is **"Instrument"**: Predator measures systems under load, so the chrome is
deliberately neutral and colour is spent only where it reports a measurement. That
restraint is the whole point — a red pill means something because nothing else is red.

- **`ui/src/styles/_tokens.scss` is the single source of truth.** Colour, spacing,
  radius, type, elevation and motion are CSS custom properties, with light and dark
  defined together. Never hardcode a hex in a component.
- **`ui/src/components/styles/_colors.scss` maps the legacy `$variables` onto tokens.**
  ~35 stylesheets import it, which is how the system reaches the whole app without
  editing every file. Adding a token is cheaper than adding a variable here.
- **Three roles carry state and nothing else may use them:** `--held-*` (within
  threshold), `--strain-*` (approaching), `--breach-*` (exceeded). Status is always
  colour *plus* a glyph or label, never colour alone.
- **Type has three roles.** `--font-readout` (Archivo Expanded) for measured values
  only, `--font-ui` (Archivo) for interface text, `--font-mono` (IBM Plex Mono) for
  data cells, ids and timestamps. `font-variant-numeric: tabular-nums` is global so
  figures don't jitter as a run updates.
- **Labels are ink, never the accent.** `TitleInput.scss` and the table header supply
  most labels in the product; both previously used the link blue, which made forms
  and table heads look like lists of links.
- **`--fg-muted` is for decoration and disabled states only** — it does not clear
  4.5:1 at 11px. Informational text uses `--fg-secondary` or stronger.
- **Page-level buttons go in `Page`'s `actions` prop**, never as a loose `<Button>`
  above the table. One solid primary per view; siblings use `inverted`.
- **The top bar renders only below 900px** (it carries the hamburger). On desktop the
  theme toggle lives in the rail foot, so content runs full height — don't put
  anything in the top bar expecting desktop users to see it.
- **Table cells:** timestamps use `dateFormatter` (one mono line, full date on
  `title`), durations `shortDuration` ("2m 45s"), absent values a muted `–`, and
  free text `.ellipsis-cell` — never a hard clip. `getColumns` resolves ids by first
  match, which is why chaos uses `experiment_duration` next to reports' `duration`.

### Charts

- The series palette lives in tokens (`--series-1` … `--series-6`) and is **assigned by
  slot, never cycled**. The breach red is deliberately not in it, so status hues stay
  reserved.
- Both modes were verified with the dataviz skill's validator (lightness band, chroma
  floor, adjacent-pair CVD separation, normal-vision floor, 3:1 contrast). **Re-run it
  if you change a series colour** — don't eyeball colourblind safety:
  `node scripts/validate_palette.js "<hex,…>" --mode dark --surface "#0d1220"`
- recharts reads colours as SVG presentation attributes, and `var()` resolves there,
  so theme switching repaints every series with no JS. Chart furniture comes from
  `AXIS_PROPS` / `GRID_PROPS` / `TOOLTIP_PROPS` in `Report/Charts.js`.
- **The load spine** (`Report/LoadSpine`) is the signature element: the run's p95
  latency as one trace, with the *benchmark run's p95 latency* as the dashed
  reference. It is deliberately not the benchmark **score** — that's a 0–100 composite
  and drawing it on a millisecond axis would make the chart lie.

### Verifying UI work

`ui/` has no test suite, so changes are verified by driving the built app:

1. Build, serve it through the real server (the UI is served from `/ui`), and load
   routes in a headless browser asserting `#root` has content and no `pageerror`.
2. Check **both themes** with `localStorage.setItem('predator-theme', …)` and measure
   contrast on rendered text. Composite translucent backgrounds before computing a
   ratio, or elements with `rgba(...)` fills report nonsense against themselves.
3. Check 390px width for horizontal overflow and that the nav overlay opens.

## Known rough edges

- The ~70 Sass deprecation warnings during `ui` builds are real: 83 `.scss` files still use
  `@import` and global `darken()`, both slated for removal in Dart Sass 3.
- `ui/` pins `material-ui@0.20` (the pre-1.0 library) alongside `@material-ui/core@1.x`, plus
  `recharts@1`, `react-redux@5` and React 16. These are app-level migrations, not dependency bumps.
