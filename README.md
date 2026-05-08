# Train Ticket Graph API

Take-home submission: a **NestJS (TypeScript)** service that loads the Train Ticket microservice graph from JSON, keeps it in memory, and exposes a **REST API** for graph inspection and **filtered route discovery**, suitable for client-side rendering.

---

## Task

The attached JSON file (train-ticket-be.json) represents a full, working graph of Train Ticket microservices
and the relations between them:
https://github.com/FudanSELab/train-ticket

---

## Planned solution (summary)

**Data layer (`GraphModule`):** 

On startup, the app reads a single JSON file, normalizes edges (each `to` may be a string or an array of targets), validates edge endpoints against known nodes, and builds an adjacency list plus a node map. Optional fields on nodes get safe defaults (`publicExposed`, `vulnerabilities`). Unknown node `kind` strings are coerced to `service` with a log warning so the domain model stays a closed union (`NodeKind`).

**Query layer (`QueryModule`):** 

Routes are directed paths of **at least two nodes**, discovered by DFS from **entry nodes only** (nodes with no incoming edges). That removes meaningless one-node “routes” (e.g. isolated services or sinks listed alone). When a sink node still has outgoing edges (hypothetical data), the walker records the prefix ending at the sink and **continues** so longer paths are not lost.

**Filters:** 

Three assignment filters (`startPublic`, `endSink`, `hasVulnerability`) are small classes implementing a shared `RouteFilter` interface. They are registered under a single injection token and applied in sequence when the corresponding query flag is `true`, giving **AND** semantics. Adding a filter means: new class + DTO field + one line in the module factory—no edits to existing filters.

**API surface:** 

`GET /api/graph` (full graph), `GET /api/graph/routes` (routes + optional filters), `GET /api/graph/filters` (self-describing filter list), **`POST /api/graph`** (multipart field `file` — JSON document; replaces the in-memory graph). Input is validated with `class-validator`; unknown query keys return **400**. **OpenAPI** is served at `/api/docs`.

**Graph loading:** 

Startup and HTTP upload both apply data through **`GraphIngestionService.ingest()`** so you can extend validation, auditing, or swap the bundled initial source by changing Nest providers (`GRAPH_INITIAL_SOURCE` → your adapter).

---

## Decisions and assumptions

| Topic | Choice | Rationale |
|--------|--------|------------|
| Persistence | In-memory graph after load | Assignment graph is small and static; no DB required. |
| Sink kinds | `rds`, `sqs`, `sql` (see `SINK_KINDS`) | Task text mentions RDS/SQL; the bundled JSON uses **`sqs`** for `prod-sqs`. All three are included so `endSink` matches real data and the written spec. |
| Route starts | Entry nodes + min length 2 | Avoids noise from every-node enumeration and single-node paths. |
| Broken edges in JSON | Skip + warn | Example: edge to a missing node name; edge dropped, startup continues. |
| Strict TypeScript | `strict: true` in `tsconfig.json` | Stronger guarantees for a TS take-home. |

### Query params and filters (trade-off)

`RouteFilter.isActive(params)` is typed as **`QueryFiltersDto`**. That keeps **one validated, documented query shape** for `class-validator`, `forbidNonWhitelisted`, and **Swagger**. The trade-off: a **new filter usually adds a field to `QueryFiltersDto`**—the HTTP contract is not “closed” in the strict OCP sense. The **filter implementations** and the **`ROUTE_FILTERS` pipeline** stay open: you add a class and register it without editing existing filters. More dynamic shapes (`Record<string, unknown>`, ad-hoc maps) would weaken compile-time checks and generated OpenAPI; for this take-home the explicit DTO is intentional.

---

## Run

```bash
pnpm install
pnpm start:dev
```

## Build

```bash
pnpm build
```

## Use

- REST base: `http://localhost:3000/api/graph`
- Swagger UI: `http://localhost:3000/api/docs`

## Tests

Unit tests live under **`src/**/__tests__/**/*.spec.ts`** next to each feature (`graph`, `query`, `query/filters`). Jest’s default `testRegex` (`.*\\.spec\\.ts$`) with `rootDir: "src"` still discovers them. HTTP integration tests stay in **`test/graph.e2e-spec.ts`** (Jest + Supertest against the real `AppModule`).

```bash
pnpm build
pnpm test
pnpm test:e2e
pnpm lint
```

## Extending filters

1. Add a class under `src/query/filters/` implementing `RouteFilter` from `src/query/filters/route-filter.ts`.
2. Extend `QueryFiltersDto` with validated, optional fields.
3. Register the class in `QueryModule` and add it to the `ROUTE_FILTERS` factory (`ROUTE_FILTERS` is exported from `route-filter.ts`).

## Data file

Bundled graph: `src/graph/data/train-ticket.json` (from `docs/train-ticket-be.json`). `nest-cli.json` copies `*.json` assets next to compiled output for production `dist/` runs.
