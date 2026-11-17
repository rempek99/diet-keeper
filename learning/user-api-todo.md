# User REST API: Implementation Todo

## Context

`diet-keeper` is a NestJS 11 learning project. `UserModule` and `AuthModule` exist but are stubs:

- [src/user/user.service.ts](../src/user/user.service.ts) returns hardcoded users.
- [src/auth/auth.service.ts](../src/auth/auth.service.ts) returns `{ msg }` placeholders.

There is no database layer, validation, hashing, or guards yet. [docker-compose.yaml](../docker-compose.yaml) runs Postgres 18, and [learning/diet-keeper-todo.md](diet-keeper-todo.md) names Prisma, class-validator, and Swagger as the stack.

**Goal:** real users identified by `username`, a password of at least 8 characters, an optional email, username/password login that returns a **JWT access token and a refresh token**, users stored in **Prisma + PostgreSQL**, and role-based access.

**Requirements:**

- `Public` means anonymous visitors (no token). It is not stored on users.
- Stored roles are `USER` (the default), `MODERATOR`, and `SUPERADMIN`.
- Passwords must have **at least 8 characters**, not the docs' 12.
- Sign-in returns a short-lived access token (`15m`) and a refresh token. Refresh tokens can be swapped for a new pair and revoked on logout.
- Token lifetimes are written as duration strings such as `'15m'` or `'14d'`. Plain numbers mean **milliseconds**, so `3600` is 3.6 seconds, not an hour.
- Authentication uses the official [`@nestjs/authentication`](https://docs.nestjs.com/security/authentication) package. It replaces Passport, `@nestjs/jwt`, and argon2.
- You write the code. This plan is a step-by-step guide.

> **Heads-up:** `@nestjs/authentication` is new (v0.1.x, first released 2026-09). Its API may change, so check the [docs page](https://docs.nestjs.com/security/authentication) when something here doesn't match. The docs tutorial signs users in by **email**. In this app, you look users up by **username** instead. The package doesn't care, because you write the user repository yourself.

---

## Step 0: Fix existing issues

- [x] [package.json:9](../package.json#L9): the build script says `"nests build"`. Change it to `"nest build"`.
- [x] Postgres credentials are hardcoded in [docker-compose.yaml](../docker-compose.yaml). Move them to `.env` (ignored by git) and commit a `.env.example` with placeholders.

## Step 1: Infrastructure

- [x] Install the dependencies:
  - [x] `@nestjs/config`
  - [x] `@prisma/client`, plus `prisma` as a dev dependency. Prisma 7 also needs `@prisma/adapter-pg`, and `dotenv` for `prisma7.config.ts`.
  - [x] `class-validator` and `class-transformer`
  - [x] `@nestjs/authentication`: the auth framework. It provides a global guard, `@Public()`, `@CurrentUser()`, JWT tokens, refresh tokens, and password hashing.
  - [x] Optional: `@nestjs/swagger`
  - Note: all NestJS packages were upgraded to **v12** together, and TypeScript to **~6.0**, because `@nestjs/authentication` requires NestJS 12.
- [x] Add `ConfigModule.forRoot({ isGlobal: true })` to [src/app.module.ts](../src/app.module.ts).
- [x] Add these to `.env`, with placeholders in [.env.example](../.env.example):
  - [x] `DATABASE_URL`: points at the docker-compose Postgres (`postgresql://...@localhost:5432/...`)
  - [x] `JWT_SECRET`: must be **at least 32 bytes**. Generate one with `openssl rand -base64 32`. If the key is missing, the app won't start.
  - [x] `SUPERADMIN_USERNAME` and `SUPERADMIN_PASSWORD` (for the seed)
- [x] In [src/main.ts](../src/main.ts), add `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))`.
- [x] Run `npx prisma init`, then create [src/prisma/prisma.module.ts](../src/prisma/prisma.module.ts) and [prisma.service.ts](../src/prisma/prisma.service.ts). `PrismaService` extends `PrismaClient` and implements `OnModuleInit` → `$connect()`. Mark the module `@Global()`.
  - Prisma 7 specifics:
    - The client is generated into `src/generated/prisma` (git-ignored), with `moduleFormat = "cjs"` so it matches the CommonJS build.
    - Import `PrismaClient` from `../generated/prisma/client`, not from `@prisma/client`.
    - Connect through the `PrismaPg` adapter, built from `DATABASE_URL`.
  - Re-run `npx prisma generate` after every schema change.
  - Docs: https://docs.nestjs.com/recipes/prisma (older Prisma). For Prisma 7, also see https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7
- [ ] **Verify the DB connection** once Docker is installed: `docker compose up -d`, then `npm run start:dev`. Nest should start with no Prisma connection error.

## Step 2: Data model (`prisma/schema.prisma`)

```prisma
enum Role { USER  MODERATOR  SUPERADMIN }

model User {
  id            String    @id @default(uuid())
  username      String    @unique          // store lowercase, so uniqueness ignores case
  email         String?   @unique
  passwordHash  String
  roles         Role[]    @default([USER])
  blockedAt     DateTime?
  blockedReason String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  warnings      Warning[] @relation("warned")
  issuedWarnings Warning[] @relation("issuedBy")
}

model Warning {
  id          String   @id @default(uuid())
  reason      String
  user        User     @relation("warned", fields: [userId], references: [id], onDelete: Cascade)
  userId      String
  issuedBy    User     @relation("issuedBy", fields: [issuedById], references: [id])
  issuedById  String
  createdAt   DateTime @default(now())
}
```

- [ ] Run `npx prisma migrate dev --name users`.
- [ ] Create a seed script (`prisma/seed.ts`) that upserts the first SuperAdmin from the env vars. Without it, nobody can grant roles.

## Step 3: DTOs (`src/user/dto`, `src/auth/dto`)

- [ ] `SignUpDto`:
  - `username`: `@IsString @Length(3, 30) @Matches(/^[a-zA-Z0-9_]+$/)`
  - `password`: `@IsString @MinLength(8) @MaxLength(128)`
  - `email`: `@IsOptional @IsEmail`
  - The docs use `@MinLength(12)`. The requirement here is 8, so keep 8 unless you decide to raise it.
- [ ] `SignInDto`: `username` and `password`, both `@IsString @IsNotEmpty`. Don't add length rules on sign-in.
- [ ] `UpdateMeDto`: optional `email`.
- [ ] `ChangePasswordDto`: `currentPassword`, plus `newPassword` with `@MinLength(8)`.
- [ ] `WarnUserDto`: `reason`. `BlockUserDto`: optional `reason`.
- [ ] Normalize `username` to lowercase, either with `@Transform` or in the service.
- [ ] **Never return `passwordHash`.** Map results to a response shape such as `toPublicUser()` / `toPrivateUser()`, or use Prisma `select` / `omit`.

## Step 4: User repository and UserService (replace the stub)

The package never touches your database. You give it a repository, and it calls that repository to find users.

- [ ] `UsersRepository` (Prisma-backed). The docs tutorial has an in-memory version; replace its bodies with Prisma calls and use `username` where the docs use `email`:
  - `create(username, { passwordHash, email? })`: new users get `[USER]` from the schema default. Map Prisma error `P2002` to `ConflictException`.
  - `findById(id)` and `findByUsername(username)`.
  - `findCredentials(username)`: returns `{ user, passwordHash }`, or null.
  - `updatePasswordHash(id, hash)` and `updateEmail(id, email)`.
- [ ] Find out where `PasswordHasher` is registered. The docs inject it but never show its registration. Check whether `AuthenticationModule` provides it, or whether you add it to `providers` yourself.
- [ ] `CredentialsService`, following the docs. Inject `UsersRepository` and `PasswordHasher` (from `@nestjs/authentication`; it uses scrypt):
  - `register(username, password, email?)`: `passwordHasher.hash(password)`, then `create`.
  - `verify(username, password)`:
    - Call `passwordHasher.verify(password, found?.passwordHash)`. It is safe to call even when the user doesn't exist, which avoids leaking which usernames exist.
    - If `passwordHasher.needsRehash(hash)` is true, upgrade the stored hash.
    - Return the user, or null.
  - `changePassword(id, currentPassword, newPassword)`.
- [ ] `UserService`, for the app features:
  - `warn(targetUsername, moderatorId, reason)`: creates a `Warning`.
  - `block` / `unblock(targetUsername, reason?)`: sets or clears `blockedAt`. On block, also call the package's `signOutEverywhere()` so the user's refresh tokens stop working.
  - `grantRole` / `revokeRole(targetUsername, role)`: updates `roles` without duplicates.
- [ ] Export `UsersRepository` and `UserService` from [src/user/user.module.ts](../src/user/user.module.ts) so `AuthModule` can use them.

## Step 5: Authentication (`src/auth`) with `@nestjs/authentication`

- [ ] Register the module in [src/app.module.ts](../src/app.module.ts) with `AuthenticationModule.forRootAsync({ useFactory })`. Read the secret from `ConfigService`:
  ```ts
  accessToken: { key: config.get('JWT_SECRET'), issuer: 'diet-keeper', audience: 'diet-keeper-web', ttl: '15m' }
  ```
  - Lifetimes are strings like `'15m'`, or **milliseconds**. `@nestjs/jwt` counted seconds, so `3600` here means 3.6 seconds, not an hour.
  - Refresh tokens are on by default: they are single-use, and the DB stores only their hash. Keep them. Set `refreshToken: false` only if you really want access tokens alone.
- [ ] This registers a **global guard**, so every route needs a valid token unless it is marked `@Public()`. You don't write your own `JwtAuthGuard`.
- [ ] `JwtAuth extends JwtBearerProvider<User>`:
  - `validate({ sub })` loads the user with `usersRepository.findById(sub)`.
  - **Return `null` if the user is gone or `blockedAt` is set.** The package then rejects the token.
  - Because of this DB lookup, blocks and role changes take effect on the next request.
  - Follow the docs for the `super({ realm })` and `registry.registerProvider(this, { order: 1 })` setup.
  - You don't need the docs' `SessionAuth` (cookie sessions), because this API uses Bearer tokens.
- [ ] Rewrite [src/auth/auth.controller.ts](../src/auth/auth.controller.ts) as `@Public()`:
  - `POST /auth/signup` calls `credentialsService.register(...)` and returns 201 with the private user.
  - `POST /auth/token` signs in:
    - Call `credentialsService.verify(...)`. If it returns null, throw `UnauthorizedException('Invalid username or password')`. Use the same message whether the username or the password was wrong.
    - If the user is blocked, throw `ForbiddenException`.
    - Otherwise call `tokenService.issue(user.id, { method: 'password', claims: { amr: ['pwd'] } })` and return `{ accessToken, refreshToken, expiresIn }`. `expiresIn` is in seconds.
  - `POST /auth/token/refresh` calls `tokenService.refresh(refreshToken)`. If a spent token is reused, its whole family is revoked and the client gets 401.
  - `POST /auth/token/revoke` calls `tokenService.revoke(refreshToken)`. This is logout.
- [ ] Don't put roles in token claims. The docs advise keeping facts that can change out of claims. `validate()` already loads fresh roles from the DB.
- [ ] Get the current user in controllers with `@CurrentUser()` or `@CurrentUser('id')`. In services, use `AuthenticationContext.requireUser()`. All of these come from `@nestjs/authentication`.
- Docs: https://docs.nestjs.com/security/authentication

## Step 6: Authorization (roles), which you build yourself

The package handles *who you are*, not *what you may do*. It has no roles guard.

- [ ] `hasRole(user, required)`: a hierarchy helper. SUPERADMIN also has MODERATOR rights, and every account has USER rights.
- [ ] `RolesGuard`: reads the `@Roles` metadata with `Reflector`, gets the user from the request, and throws `ForbiddenException` if `hasRole` fails.
- [ ] Combine both into a `@Roles(...roles)` decorator with `applyDecorators(SetMetadata('roles', roles), UseGuards(RolesGuard))`.
  - This puts `RolesGuard` on the route, so it always runs **after** the package's global guard has set the user.
  - Registering it as another `APP_GUARD` could make it run first, before the user is known.
- [ ] Find out how the package exposes the user inside a guard. Either read the request object, or inject `AuthenticationContext` and call `requireUser()`.
- Docs: https://docs.nestjs.com/security/authorization

## Step 7: User endpoints (rewrite [src/user/user.controller.ts](../src/user/user.controller.ts) as `@Controller('users')`)

| Method & path                         | Access             | Purpose                                       |
| ------------------------------------- | ------------------ | --------------------------------------------- |
| `GET /users/:username`                | `@Public()`        | Public profile (`username`, `createdAt`)      |
| `GET /users/me`                       | any logged-in user | Own profile, including email and roles        |
| `PATCH /users/me`                     | any logged-in user | Update email                                  |
| `PATCH /users/me/password`            | any logged-in user | Change password                               |
| `GET /users`                          | MODERATOR          | List users (simple pagination: `skip`/`take`) |
| `POST /users/:username/warnings`      | MODERATOR          | Warn a user                                   |
| `GET /users/:username/warnings`       | MODERATOR          | List a user's warnings                        |
| `POST /users/:username/block`         | MODERATOR          | Block a user                                  |
| `DELETE /users/:username/block`       | MODERATOR          | Unblock a user                                |
| `PUT /users/:username/roles/:role`    | SUPERADMIN         | Grant a role                                  |
| `DELETE /users/:username/roles/:role` | SUPERADMIN         | Revoke a role                                 |

Declare `/users/me` routes **before** `/:username`. Validate `:role` with `new ParseEnumPipe(Role)`.

**Business rules** (enforce in the service, return 403):

- [ ] Moderators cannot warn or block moderators or superadmins. Nobody can block themselves.
- [ ] A SuperAdmin cannot revoke their own `SUPERADMIN` role, to avoid a lockout.
- [ ] `USER` cannot be revoked. Every account keeps the base role.

## Step 8: Tests

- [ ] Unit tests: rewrite [src/user/user.service.spec.ts](../src/user/user.service.spec.ts) and [src/user/user.controller.spec.ts](../src/user/user.controller.spec.ts) with a mocked `PrismaService`. Add `credentials.service.spec.ts` covering wrong password, unknown username, and duplicate username. Add `jwt-auth.spec.ts` checking that `validate()` returns null for a blocked user. Add `roles.guard.spec.ts` covering the role hierarchy.
- [ ] Remove the stale [src/app.controller.spec.ts](../src/app.controller.spec.ts), which refers to the deleted AppController. Update [test/app.e2e-spec.ts](../test/app.e2e-spec.ts).
- [ ] E2E tests with Supertest against the docker DB. Cover signup → `/auth/token` → `/users/me` → refresh → revoke, plus 401/403 cases for each role.

## Verification

1. `docker compose up -d`, `npx prisma migrate dev`, `npx prisma db seed`, then `npm run start:dev`.
2. Check signup validation:
   - `POST /auth/signup` with a 7-character password should return 400.
   - A valid signup should return 201, with no `passwordHash` in the response.
   - Signing up again with the same username (any letter case) should return 409.
3. Check sign-in and refresh tokens:
   - `POST /auth/token` with a wrong password should return 401. With the correct password it should return `accessToken` and `refreshToken`.
   - `POST /auth/token/refresh` should return a new pair.
   - Reusing the old refresh token should return 401.
4. `GET /users/me` without a token should return 401. With the token it should return 200.
5. Check roles and blocking:
   - As a normal user, `POST /users/x/block` should return 403.
   - Sign in as the seeded SuperAdmin and grant `MODERATOR` to a user.
   - Have that moderator block someone. The blocked user's sign-in should return 403, their old access token should get 401, and their refresh token should get 401.
6. Run `npm test`, `npm run test:e2e`, and `npm run lint`.

## Later (out of scope)

- Rate limiting on `/auth/token` (`npm i --save @nestjs/throttler`; the auth docs have a section on it).
- Swagger `@ApiBearerAuth`.
- Email verification (`EmailVerificationService` with `@nestjs/mail`) and password reset. Both need email.
- Two-factor sign-in. The package supports TOTP.
