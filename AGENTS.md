# Project Overview
This repository is a NestJS 11 backend API for a Taekwondo federation platform.
It uses TypeScript, Prisma 6 with PostgreSQL, JWT auth, cookie-based refresh tokens, Swagger, MinIO/S3, and Nodemailer/Pug mail templates.
Before changing code, inspect the real module/service/controller/DTO patterns near the feature you are touching; do not rely on generic NestJS assumptions.
The app starts from `src/main.ts`, uses global prefix `api`, listens on `PORT`, and exposes Swagger at `/api-docs`.

# Structure
Main source code is under `src`.
Domain modules are organized as `*.module.ts`, `*.controller.ts`, `*.service.ts`, and `dto/*` where the domain needs DTOs.
Observed domains include `auth`, `user`, `role`, `team`, `tournament`, `belt`, `belt-attestation`, `sport-rank`, `file`, `s3`, categories, `invite-token`, `mail`, `code`, and `admin`.
Admin controllers live under `src/admin/**` and reuse domain modules/services such as `UserModule`, `RoleModule`, `AgeCategoryModule`, and `WeightCategoryModule`.
Shared DTOs and enums live under `src/shared`, including pagination DTOs and `RoleEnum`.
Path aliases are configured in `tsconfig.json`; prefer existing aliases such as `@auth/*`, `@user/*`, `@shared/*`, `@prisma/*`, `@s3/*`, and `@prisma-client`.

# Development Commands
Install dependencies: `npm install`.
Use `npm` only when running package-manager commands; do not use `yarn` or `pnpm`.
Start/build scripts: `npm run start`, `npm run start:dev`, `npm run start:debug`, `npm run start:prod`, `npm run build`.
Format: `npm run format` writes Prettier changes to `src/**/*.ts` and `test/**/*.ts`.
Lint: `npm run lint` runs ESLint with `--fix`; expect it to modify files and check the working tree afterward.
Unit tests: `npm test`, `npm run test:watch`, `npm run test:cov`, `npm run test:debug`.
E2E tests: `npm run test:e2e`.
Prisma: `npx prisma migrate deploy`, `npx prisma migrate dev --name <migration_name>`.
Seed: `npm run seed` (`ts-node prisma/seed.ts`).

# Architectural Rules
Keep changes scoped to the relevant domain module and follow the existing controller/service/DTO split.
Controllers should stay thin: validate/parse request data through DTOs and Nest pipes, then delegate business logic to services.
Services return the repository's existing response shapes, commonly wrapper objects such as `{ user: ... }`, `{ team: ... }`, `{ tournament: ... }`, `{ files: ... }`, or `PaginationDto`.
Use existing `createDto`/`createSignedDto` style mapping methods when exposing Prisma records; avoid returning raw entities with hidden fields such as passwords or internal foreign keys.
Use Nest exceptions already used in the codebase (`BadRequestException`, `NotFoundException`, `ForbiddenException`, `UnauthorizedException`, etc.) instead of ad hoc response objects.
Do not perform broad refactors, route renames, or response-shape changes unless the task explicitly requires them.
Russian strings and comments currently include mojibake in many places; do not mass-fix encoding unless that is the explicit task.

# NestJS Conventions
Global validation is configured in `src/main.ts` with `transform: true`, `whitelist: true`, and `forbidNonWhitelisted: true`.
New endpoints that accept body/query data must use DTOs with existing `class-validator` and `class-transformer` patterns.
DTOs use `@nestjs/swagger` decorators such as `@ApiProperty` and `@ApiPropertyOptional`; keep Swagger metadata current when adding or changing API inputs/outputs.
Numeric route params generally use `ParseIntPipe`; query DTO numeric fields use `@Type(() => Number)`, `@IsInt()`, and `@Min(...)`.
Paginated endpoints commonly use `PaginationQueryDto`, return `PaginationDto`, and document arrays with `@ApiExtraModels`, `getSchemaPath`, and `PaginationResponseDto`.
Authenticated endpoints generally include `@ApiBearerAuth()` and `@ApiOkResponse(...)` or the appropriate Swagger response decorator.
File upload endpoints use `FilesInterceptor` with `memoryStorage()` and multipart Swagger decorators.
No global interceptors were found; do not introduce one without checking the wider impact.

# Prisma Conventions
Access the database through the global `PrismaService` from `src/prisma/prisma.service.ts`; do not instantiate `PrismaClient` in application services.
Application imports Prisma types/client via `@prisma-client`, which maps to `generated/prisma/client`.
Prisma is configured with `prisma.config.ts` using `schema: "prisma"`; root `prisma/schema.prisma` defines datasource/generator and models are split under `prisma/models/*.prisma`.
The Prisma Client generator outputs to `generated/prisma`; never edit generated client files manually.
Migrations live in `prisma/migrations`.
If you change Prisma schema files, create/update the matching migration and run `npx prisma generate` afterward.
Use `$transaction([queryA, queryB])` for related read/count pagination when matching existing code.
Use `$transaction(async tx => { ... })` for multi-step mutations that must commit together; pass `tx` to helper methods that accept `Prisma.TransactionClient`, such as `FileService.delete`.
Seed data is in `prisma/seed.ts` and is run with `npm run seed`; it currently imports the generated client by relative path.

# Auth/RBAC
JWT auth is global via `APP_GUARD` and `JwtAuthGuard` in `src/app.module.ts`.
Endpoints are protected by default; public endpoints must be explicitly marked with `@Public()`.
JWTs are read from the Bearer Authorization header by `JwtStrategy`.
Refresh tokens are stored in the `refresh-token` cookie by `AuthController`; cookie options include `httpOnly`, `sameSite: 'lax'`, production-only `secure`, and `path: '/'`.
Use existing auth decorators from `src/auth/decorators`: `@CurrentUser()`, `@Public()`, `@Role(...)`, `@Cookie(...)`, and `@UserAgent()`.
RBAC is not global: protected role checks use `@UseGuards(RoleGuard)` plus `@Role(RoleEnum...)`.
For public endpoints that can optionally use the current user, follow the existing `@Public()` plus `@UseGuards(OptionalJwtAuthGuard)` pattern.
Use `RoleEnum` values from `src/shared/enums/role.enum.ts`; do not hard-code role strings in new authorization logic.

# Files/S3
Use `FileService` for file records and DTOs, and `S3Service` for object storage operations.
`S3Service` initializes an AWS SDK `S3Client` on module init, creates the bucket if needed, and applies a public-read bucket policy.
S3 configuration comes from `S3_URL`, `S3_PUBLIC_URL`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, and `S3_BUCKET`.
`FileController` accepts up to 10 files under field name `files`, limits each file to 10 MB, and rejects empty uploads or total uploads over 30 MB.
`FileService.save` uploads objects first, then creates DB records in a Prisma transaction.
If DB persistence fails after S3 upload, preserve the cleanup pattern that deletes already uploaded objects with `Promise.allSettled`.
When deleting/replacing DB-linked files inside another transaction, use the existing `FileService.delete(id, tx?)` pattern so DB changes share the transaction.
MinIO is defined in `docker-compose.yml` and persists data under `./minio_data`.

# Tests And Checks
Jest unit tests are configured in `package.json` with `rootDir: "src"` and `*.spec.ts`, but no current `src/**/*.spec.ts` files were found.
E2E tests live under `test` and use `test/jest-e2e.json`.
The current scaffold e2e test targets `GET /` and `Hello World!`, while the actual app exposes `GET /api/health`; treat e2e coverage as stale until updated.
Run the narrowest useful checks for your change and relevant Jest commands before handoff.
Do not run the application build or `prisma validate` after changes unless the user explicitly asks for those checks.
Remember that `npm run lint` and `npm run format` intentionally rewrite files.

# What Not To Touch Without An Explicit Task
Do not commit `.env`, secrets, credentials, or local machine configuration.
Do not commit or manually edit `node_modules`, `dist`, `generated/prisma`, `minio_data`, `db`, `coverage`, logs, or other generated/runtime artifacts ignored by `.gitignore`.
Do not manually edit Prisma generated client output; change schema and regenerate instead.
Do not change global auth, CORS, validation, Swagger setup, route prefix, or cookie behavior as incidental cleanup.
Do not change `git safe.directory` or global git config unless the user explicitly asks.
Do not mass-correct mojibake strings/comments unless the task is specifically about encoding/content cleanup.
No prior `AGENTS.md`, `CLAUDE.md`, `.cursor/rules`, or `.github/copilot-instructions.md` were found during repository inspection.

# Before Handoff
Check `git diff` and ensure you did not rewrite unrelated files, especially after lint/format.
For API changes, verify DTO validation, Swagger decorators, auth/public/role behavior, and response wrapper shape.
For Prisma changes, verify schema, migration, generated client, and any seed implications.
For file/S3 changes, verify partial-failure cleanup and avoid leaking uploaded objects when DB work fails.
Run the relevant tests when feasible; explicitly report any check you could not run.
Do not run `npm run build` or `prisma validate` unless the user explicitly asks for them.
