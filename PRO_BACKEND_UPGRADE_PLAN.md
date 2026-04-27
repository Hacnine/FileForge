# Backend Professional Upgrade Plan

## Objective

Raise the backend from feature-complete coursework quality to production-grade SaaS quality: secure by default, observable, testable, operationally predictable, and easier to evolve.

## Phase 1: Runtime Hardening

- [x] Replace insecure environment fallbacks with validated runtime configuration.
- [x] Introduce structured JSON logging with request correlation IDs.
- [x] Replace the shallow health endpoint with liveness and readiness probes backed by database checks.
- [x] Harden startup and shutdown flow with explicit fatal-error handling.
- [x] Document a `.env.example` with required secrets and operational defaults.

## Phase 2: Security Hardening

- [x] Rotate refresh tokens on every refresh and revoke compromised sessions.
- [x] Move auth tokens to secure, httpOnly cookies where browser flows need them.
- [ ] Add stricter upload validation, filename sanitization, and content-type verification.
- [ ] Add role- and organization-aware authorization helpers instead of duplicating checks in controllers.
- [ ] Add audit coverage for all privileged admin and billing actions.

## Phase 3: Architecture Cleanup

- [ ] Extract service-layer business logic from large controllers.
- [ ] Standardize API response envelopes and pagination metadata.
- [ ] Introduce reusable domain error types and validation error mapping.
- [ ] Split infra concerns (mail, storage, billing, auditing) behind explicit interfaces.
- [ ] Add route-level request schemas for params, query, and body consistently.

## Phase 4: Quality Gates

- [ ] Add unit and integration testing with a dedicated test database.
- [ ] Add coverage for auth, subscriptions, uploads, organizations, and billing flows.
- [ ] Add ESLint and formatting enforcement.
- [x] Add a CI pipeline for Prisma validation, build, and backend tests.
- [ ] Add smoke tests for startup, health probes, and migration safety.

## Phase 5: SaaS Operations

- [ ] Add OpenAPI or Swagger documentation for internal and external consumers.
- [ ] Add background job processing for email, cleanup, and deferred file tasks.
- [ ] Add metrics and alert-friendly operational signals.
- [ ] Add storage provider health checks and stronger abstraction around file storage.
- [ ] Add tenant-aware admin reporting for usage, storage, and subscription events.

## Current Iteration

This iteration now covers Phase 1 runtime hardening, the first Phase 4 quality-gate slice, and the first Phase 2 auth-security slice: rotating refresh tokens, hashed refresh-token storage, and httpOnly browser cookies. The next highest-leverage step is upload and file-safety hardening.