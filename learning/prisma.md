# Prisma

## Introduction

This project uses **Prisma 8** (CLI `prisma@8.0.0-rc.28` + the Postgres facade `@prisma/orm-postgres`). Prisma 8 is contract-based: the data model is authored in PSL (Prisma Schema Language) as a _contract_, artifacts are emitted from it, and the runtime client is created from the emitted `contract.json` — there is no `@prisma/client` package anymore.

## Packages

```json
"dependencies": {
  "@prisma/orm-postgres": "^8.0.0-rc.21", // Postgres target: config, runtime client, emit
  "dotenv": "^18.0.9",                    // loads .env in config and db.ts
  "temporal-polyfill": "^1.0.6"           // peer dep, temporal field types
},
"devDependencies": {
  "prisma": "^8.0.0-rc.28"                // the CLI
}
```

## Configuration

### prisma.config.ts

One config file at the project root configures the CLI and every product it runs. Each top-level key is a section; the CLI recognizes `orm`, `composer`, and `skills`.

```typescript
import 'dotenv/config';
import { definePrismaConfig } from 'prisma/config';
import { defineConfig as ormConfig } from '@prisma/orm-postgres/config';

export default definePrismaConfig({
  orm: ormConfig({
    contract: './src/prisma/contract.prisma',
    db: {
      connection: process.env['DATABASE_URL']!,
    },
  }),
  skills: {
    agents: ['claude', 'cursor', 'agents', 'devin'],
  },
});
```

### .env

The connection string must match the database container defined in `docker-compose.yaml`:

```
DATABASE_URL="postgresql://nestjs_user:nestjs_password@localhost:5432/nestjs_db?schema=public"
```

## Contract

The contract is the declarative source of the data model, authored at `src/prisma/contract.prisma`:

```prisma
// use prisma-8

model User {
  id        Int               @id @default(autoincrement())
  email     String            @unique
  name      String?
  createdAt TimestamptzString @default(now())
  updatedAt temporal.UpdatedAtString
}
```

Notes:

- The `// use prisma-8` header selects the Prisma 8 PSL grammar.
- Field presets were removed: write `temporal.UpdatedAtString` as a bare type. The `prisma init` starter template still emits the old `temporal.updatedAtString()` call form, which fails with `PSL_UNRESOLVED_REFERENCE`.

### Emitting artifacts

```bash
npx prisma contract emit
```

generates `contract.json` and `contract.d.ts` next to the contract source. Re-run it after every contract change.

## Database client

`src/prisma/db.ts` builds the typed, lazy client from the emitted artifacts:

```typescript
import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import { contractFromJson } from '@prisma/orm-postgres/static';
import type { Contract } from './contract.d';
import contractJson from './contract.json';

export const contract = contractFromJson<Contract>(contractJson);

export const db = postgres({
  contract,
  url: process.env['DATABASE_URL']!,
});
```

The pool is created lazily on the first query or `connect()`; `close()` shuts it down.

## NestJS integration

A global module exposes the client through dependency injection.

### prisma.module.ts

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### prisma.service.ts

```typescript
import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { db } from './db';

@Injectable()
export class PrismaService implements OnApplicationShutdown {
  readonly client: typeof db = db;

  async onApplicationShutdown(): Promise<void> {
    await this.client.close();
  }
}
```

Import `PrismaModule` once in `app.module.ts`, then inject `PrismaService` anywhere and query through `prisma.client`.

## Using the database in the app

Inject `PrismaService` into any service or controller — `PrismaModule` is global, so no per-module imports are needed. The client lives on `prisma.client` and exposes two query lanes:

- **ORM lane** — `client.orm.<namespace>.<Model>`, e.g. `client.orm.public.User`. Default for CRUD. Models land in the `public` namespace unless the contract declares a `namespace { }` block (the namespace is the Postgres schema). There is no flat `client.orm.User`.
- **SQL builder lane** — `client.sql.<namespace>.<table>`, e.g. `client.sql.public.user`. For shapes the ORM cannot express (explicit joins, computed projections, window functions). It builds a *plan* you run with `client.query(plan)` (rows) or `client.execute(plan)` (`{ affectedRows }`).

### Example: UserService backed by the database

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  private get users() {
    return this.prisma.client.orm.public.User;
  }

  getUserById(id: number) {
    return this.users.first({ id }); // primary-key shorthand, LIMIT 1, row or null
  }

  getAllUsers() {
    return this.users.orderBy((u) => u.createdAt.desc()).all();
  }

  createUser(email: string, name?: string) {
    return this.users.create({ email, name }); // returns the inserted row
  }

  updateUser(id: number, name: string) {
    return this.users.where({ id }).update({ name });
  }

  deleteUser(id: number) {
    return this.users.where({ id }).delete();
  }
}
```

Controller route params arrive as strings — use `ParseIntPipe` (`@Param('id', ParseIntPipe) id: number`) to match the `Int` id from the contract.

### Reading

A collection is composed method-by-method (immutable chaining); the terminal verb issues the query:

```typescript
// one row matching a predicate
const user = await this.users.where((u) => u.email.eq('alice@example.com')).first();

// many rows with projection, sort, limit
const recent = await this.users
  .select('id', 'email', 'createdAt')
  .orderBy((u) => u.createdAt.desc())
  .limit(10)
  .all();
```

- `.where(...)` takes a lambda (`(u) => u.email.eq('x')` — operators `.eq`, `.neq`, `.lt`, `.lte`, `.gt`, `.gte`, `.like`, `.ilike`, `.in([...])`, `.isNull()`, …) or an object shorthand for equality: `.where({ email: 'x' })`. Chained `.where()` calls AND-compose.
- `.all()` resolves to a plain array with `await` — do **not** wrap it in `collect()` / `toArray()` helpers. The result is single-consumption: awaiting or iterating it twice throws `RUNTIME.ITERATOR_CONSUMED`; buffer into a variable and reuse that.
- `.first()` / `.firstOrThrow()` for one row (issues `LIMIT 1`); `firstOrThrow` rejects with `RUNTIME.NO_ROWS` when empty. `.all()` has no implicit limit — use it only for genuine many-row reads.
- Eager-load relations with `.include('posts', (posts) => posts.select(...).limit(5))`.

### Writing

```typescript
await this.users.create({ email, name }); // INSERT, returns the row
await this.users.where({ id }).update({ name }); // UPDATE filtered row
await this.users.where({ id }).delete(); // DELETE filtered row
await this.users.upsert({ create: { email, name }, update: { name } });
```

A write requires a filter on **every** code path — `update` / `delete` / `deleteAll` only compile on a filtered collection, so build the write inside the `if` that applied the `.where(...)`, not on a conditionally filtered variable.

### Transactions

`client.transaction(...)` passes a `tx` context with the same query surface; the callback's result passes through after commit:

```typescript
const user = await this.prisma.client.transaction(async (tx) => {
  const created = await tx.orm.public.User.create({ email, name });
  // ...more writes through tx.orm / tx.sql
  return created;
});
```

### Naming result types

From the emitted `contract.d.ts` and the facade:

```typescript
import type { Models } from '../prisma/contract';
import type { ResultType } from '@prisma/orm-postgres/components/runtime';

type User = Models.public_User; // full row incl. relations
type UserRow = ResultType<typeof this.users>; // what a default fetch returns
```

## TypeScript settings

- `tsconfig.json` needs `"resolveJsonModule": true` because `db.ts` imports `contract.json`. With `module: nodenext` and a CommonJS package, the JSON import compiles to a plain `require` and `tsc` copies the JSON into `dist/`.
- `tsconfig.build.json` must exclude `prisma.config.ts`. Otherwise the root config file joins the build program, `rootDir` inference shifts to the project root, and output lands in `dist/src/` — breaking `start:prod` (`node dist/main`).

```json
"exclude": ["node_modules", "test", "dist", "**/*spec.ts", "prisma.config.ts"]
```

## CLI commands

```bash
npx prisma init             # one-time repo setup: config file, dev dependency, agent skills
npx prisma contract emit    # emit contract.json + contract.d.ts from the PSL source
npx prisma contract format  # normalize the PSL source
npx prisma contract print   # print the loaded contract as PSL
npx prisma db verify        # check the live database against the contract
npx prisma db sign          # sign the database (first-time marker)
npx prisma migration        # plan/inspect on-disk migrations from contract changes
npx prisma skills sync      # sync agent skill files (runs on postinstall)
```

## Troubleshooting

- `CONTRACT.SOURCE_LOAD_FAILED` / `PSL_UNRESOLVED_REFERENCE` — a diagnostic points at the exact contract line; fix the source and re-run `emit`.
- `CONTRACT.MARKER_MISSING` on `db verify` — the database has never been signed; run `npx prisma db sign` or plan a migration.
- "Prisma agent skills are out of date" after installing/upgrading Prisma packages — run `npx prisma skills sync`.
