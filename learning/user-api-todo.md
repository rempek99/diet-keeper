# User REST API: Implementation Todo

## Context

`diet-keeper` is a NestJS 11 learning project. `UserModule` and `AuthModule` exist but are stubs:
- [src/user/user.service.ts](../src/user/user.service.ts) returns hardcoded users.
- [src/auth/auth.service.ts](../src/auth/auth.service.ts) returns `{ msg }` placeholders.

There is no database layer, validation, hashing, or guards yet. [docker-compose.yaml](../docker-compose.yaml) runs Postgres 18, and [learning/diet-keeper-todo.md](diet-keeper-todo.md) names Prisma, class-validator, and Swagger as the stack.

**Goal:** real users identified by `username`, a password of at least 8 characters, an optional email, username/password login that returns a **JWT access token**, users stored in **Prisma + PostgreSQL**, and role-based access.

**Decisions made:**
- `Public` means anonymous visitors (no token). It is not stored on users.
- Stored roles are `USER` (the default), `MODERATOR`, and `SUPERADMIN`.
- You write the code. This plan is a step-by-step guide.

---

## Step 0: Fix existing issues

- [ ] [package.json:9](../package.json#L9): the build script says `"nests build"`. Change it to `"nest build"`.
- [ ] Postgres credentials are hardcoded in [docker-compose.yaml](../docker-compose.yaml). Move them to `.env` (ignored by git) and commit a `.env.example` with placeholders.

## Step 1: Infrastructure

- [ ] Install the dependencies:
  - `@nestjs/config`
  - `@prisma/client`, plus `prisma` as a dev dependency
  - `class-validator` and `class-transformer`
  - `argon2` for password hashing (no 72-byte limit like bcrypt)
  - `@nestjs/jwt`, `@nestjs/passport`, `passport`, and `passport-jwt`, plus `@types/passport-jwt` as a dev dependency
  - Optional: `@nestjs/swagger`
- [ ] Add `ConfigModule.forRoot({ isGlobal: true })` to [src/app.module.ts](../src/app.module.ts).
- [ ] Add these to `.env`:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `JWT_EXPIRES_IN` (for example `1h`)
  - `SUPERADMIN_USERNAME` and `SUPERADMIN_PASSWORD` (for the seed)
- [ ] In [src/main.ts](../src/main.ts), add `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))`.
- [ ] Run `npx prisma init`, then create `src/prisma/prisma.module.ts` and `prisma.service.ts`. `PrismaService` extends `PrismaClient` and implements `OnModuleInit` → `$connect()`. Mark the module `@Global()`.
  - Docs: https://docs.nestjs.com/recipes/prisma

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
- [ ] `SignInDto`: `username` and `password`, both `@IsString @IsNotEmpty`.
- [ ] `UpdateMeDto`: optional `email`.
- [ ] `ChangePasswordDto`: `currentPassword`, plus `newPassword` with `@MinLength(8)`.
- [ ] `WarnUserDto`: `reason`. `BlockUserDto`: optional `reason`.
- [ ] Normalize `username` to lowercase, either with `@Transform` or in the service.
- [ ] **Never return `passwordHash`.** Map results to a response shape such as `toPublicUser()` / `toPrivateUser()`, or use Prisma `select` / `omit`.

## Step 4: UserService (replace the stub)

Replace everything in [src/user/user.service.ts](../src/user/user.service.ts). It needs these methods:
- [ ] `create({ username, password, email })`: hash the password with `argon2.hash`. Map Prisma error `P2002` to `ConflictException`.
- [ ] `findByUsername(username)` and `findById(id)`.
- [ ] `updateMe(id, dto)` and `changePassword(id, dto)`. `changePassword` checks the current password with `argon2.verify`.
- [ ] `warn(targetUsername, moderatorId, reason)`: creates a `Warning`.
- [ ] `block` / `unblock(targetUsername, reason?)`: sets or clears `blockedAt`.
- [ ] `grantRole` / `revokeRole(targetUsername, role)`: updates `roles` without duplicates.
- [ ] Export `UserService` from [src/user/user.module.ts](../src/user/user.module.ts) so `AuthModule` can use it.

## Step 5: Authentication (`src/auth`)

- [ ] `AuthService.signUp(dto)`: calls `userService.create`, so new users get `[USER]`.
- [ ] `AuthService.signIn(dto)`:
  - Find the user and run `argon2.verify`.
  - On any failure, throw `UnauthorizedException('Invalid credentials')`. Use the same message whether the username or the password was wrong.
  - If `blockedAt` is set, throw `ForbiddenException`.
  - Return `{ accessToken }` with payload `{ sub: id, username, roles }`.
- [ ] `JwtModule.registerAsync` reads the secret and expiry from `ConfigService`.
- [ ] `JwtStrategy` (`passport-jwt`, Bearer header): `validate()` **reloads the user from the DB**. This lets blocks and role changes take effect immediately. If the user is blocked or no longer exists, reject the request. Return `{ id, username, roles }` as `req.user`.
- [ ] Update [src/auth/auth.controller.ts](../src/auth/auth.controller.ts):
  - `POST /auth/signup` returns 201 and the private user.
  - `POST /auth/signin` returns 200 (`@HttpCode(200)`) and `{ accessToken }`.
- Docs: https://docs.nestjs.com/security/authentication

## Step 6: Authorization (roles)

- [ ] Create `src/auth/decorators`:
  - `@Public()`: `SetMetadata('isPublic', true)`.
  - `@Roles(...roles)`: `SetMetadata('roles', roles)`.
  - `@CurrentUser()`: `createParamDecorator`.
- [ ] `JwtAuthGuard` extends `AuthGuard('jwt')`. If `@Public()` is set, skip the check. Register it **globally** via `APP_GUARD`, so endpoints are protected by default.
- [ ] `RolesGuard`: reads `@Roles`. Treat SUPERADMIN as also having MODERATOR rights, using a hierarchy helper such as `hasRole(user, required)`. Register it globally after `JwtAuthGuard`.
- Docs: https://docs.nestjs.com/security/authorization

## Step 7: User endpoints (rewrite [src/user/user.controller.ts](../src/user/user.controller.ts) as `@Controller('users')`)

| Method & path | Access | Purpose |
|---|---|---|
| `GET /users/:username` | `@Public()` | Public profile (`username`, `createdAt`) |
| `GET /users/me` | any logged-in user | Own profile, including email and roles |
| `PATCH /users/me` | any logged-in user | Update email |
| `PATCH /users/me/password` | any logged-in user | Change password |
| `GET /users` | MODERATOR | List users (simple pagination: `skip`/`take`) |
| `POST /users/:username/warnings` | MODERATOR | Warn a user |
| `GET /users/:username/warnings` | MODERATOR | List a user's warnings |
| `POST /users/:username/block` | MODERATOR | Block a user |
| `DELETE /users/:username/block` | MODERATOR | Unblock a user |
| `PUT /users/:username/roles/:role` | SUPERADMIN | Grant a role |
| `DELETE /users/:username/roles/:role` | SUPERADMIN | Revoke a role |

Declare `/users/me` routes **before** `/:username`. Validate `:role` with `new ParseEnumPipe(Role)`.

**Business rules** (enforce in the service, return 403):
- [ ] Moderators cannot warn or block moderators or superadmins. Nobody can block themselves.
- [ ] A SuperAdmin cannot revoke their own `SUPERADMIN` role, to avoid a lockout.
- [ ] `USER` cannot be revoked. Every account keeps the base role.

## Step 8: Tests

- [ ] Unit tests: rewrite [src/user/user.service.spec.ts](../src/user/user.service.spec.ts) and [src/user/user.controller.spec.ts](../src/user/user.controller.spec.ts) with a mocked `PrismaService`. Add `auth.service.spec.ts` covering wrong password, blocked user, and the token payload. Add `roles.guard.spec.ts` covering the role hierarchy.
- [ ] Remove the stale [src/app.controller.spec.ts](../src/app.controller.spec.ts), which refers to the deleted AppController. Update [test/app.e2e-spec.ts](../test/app.e2e-spec.ts).
- [ ] E2E tests with Supertest against the docker DB, covering signup → signin → `/users/me`, plus 401/403 cases for each role.

## Verification

1. `docker compose up -d`, `npx prisma migrate dev`, `npx prisma db seed`, then `npm run start:dev`.
2. Check signup validation:
   - `POST /auth/signup` with a 7-character password should return 400.
   - A valid signup should return 201, with no `passwordHash` in the response.
   - Signing up again with the same username (any letter case) should return 409.
3. `POST /auth/signin` with a wrong password should return 401. With the correct password it should return a token.
4. `GET /users/me` without a token should return 401. With the token it should return 200.
5. As a normal user, `POST /users/x/block` should return 403. Sign in as the seeded SuperAdmin and grant `MODERATOR` to a user. Have that moderator block someone, then check that the blocked user's signin returns 403 and their old token now gets 401.
6. Run `npm test`, `npm run test:e2e`, and `npm run lint`.

## Later (out of scope)
- Refresh tokens and logout.
- Rate limiting on `/auth/signin` (`@nestjs/throttler`).
- Swagger `@ApiBearerAuth`.
- Email verification and password reset (these need email).
