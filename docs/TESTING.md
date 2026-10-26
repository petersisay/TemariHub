# TemariHub — Quality Assurance & Testing Strategy

**Frameworks:** Vitest, React Testing Library, Supertest, MongoMemoryServer, TypeScript  
**Total Automated Test Coverage:** **125 Passing Tests** (109 Backend Tests + 16 Frontend Tests)  
**Execution Environment:** Isolated in-memory database (`mongodb-memory-server`) with zero external service dependencies.  

---

## 1. Test Architecture & Pyramid

TemariHub implements a multi-tiered test strategy to guarantee data integrity, cryptographic authentication verification, role boundary enforcement, and user privacy:

```
                  / \
                 /   \      E2E & Component Tests (16 tests)
                / RTL \     React Testing Library + Vitest
               /-------\
              /         \   API Integration Tests (109 tests)
             / Supertest \  Supertest + MongoMemoryServer (12 Suites)
            /-------------\
           /               \ Unit & Validation Tests
          /   Zod & Utils   \ Zod Schemas, SSRF Guards, Timezone Helpers
         +-------------------+
```

---

## 2. Test Suite Distribution

### 2.1. Backend API Integration Suites (`server/tests/` — 109 Tests)

| Suite File | Tests | Focus Area & Verified Invariants |
|---|---|---|
| `googleAuth.test.ts` | 16 | Google ID token verification via `google-auth-library`, audience matching, designated email role assignment (`petrossisay1646@gmail.com` as admin, `petrossisay7164@gmail.com` as submitter), session regeneration, and public role escalation refusal. |
| `verifiedSources.test.ts` | 11 | 12 trusted source discovery, SSRF protections (blocking loopback `127.0.0.1`, private RFC 1918 CIDR blocks, and cloud metadata `169.254.169.254`), and invariant that discovered announcements enter `PENDING_REVIEW` & `draft`. |
| `avatar.test.ts` | 10 | Avatar upload validation, file size limits (5MB), MIME type checking, square WebP image normalization, custom avatar deletion, and Google photo fallback across all 3 user roles. |
| `auth.test.ts` | 11 | Session creation, cookie attributes (`HttpOnly`, `SameSite`, `Secure`), session invalidation on logout, `/api/v1/auth/me` user payload sanitization, and 403 retirement responses for legacy password routes. |
| `opportunities.test.ts` | 8 | Public feed visibility invariant (`published` + `VERIFIED` only), full-text search, multi-faceted filtering (type, arrangement, level, location), expired listing exclusion, submitter editing, and user reporting. |
| `tracker.test.ts` | 8 | 7-stage application tracking (*Interested*, *Preparing*, *Applied*, *Interview*, *Accepted*, *Rejected*, *Withdrawn*), bookmarking duplicate prevention, student notes privacy, and cross-student isolation. |
| `admin.test.ts` | 7 | Administrator moderation queue access, approving/rejecting listings, verifying listings with recorded evidence, resolving user reports, and generating immutable audit logs. |
| `csrf.test.ts` | 9 | CSRF defense-in-depth: requirement of `X-Requested-With: XMLHttpRequest` custom header and origin matching against configured `CLIENT_URL`. |
| `env.test.ts` | 10 | Fail-fast production startup validation: strict `SESSION_SECRET` length (>= 32 chars), rejection of development default secrets, and schema typing with Zod. |
| `seedAdmin.test.ts` | 8 | CLI administrator bootstrap: canonical User schema attributes, password hashing, idempotency, and refusal of automatic role escalation for existing accounts. |
| `models.test.ts` | 7 | Mongoose model schema constraints, compound unique indexes, and pre-save hooks. |
| `profile.test.ts` | 4 | Unified profile retrieval, academic details update, username unique constraint, and cross-user profile privacy boundaries. |

### 2.2. Frontend Component & Integration Suites (`client/src/test/` — 16 Tests)

| Suite File | Tests | Focus Area & Verified Invariants |
|---|---|---|
| `components.test.tsx` | 7 | `OpportunityCard` verified badge rendering, deadline status badge, tags display, and keyboard accessibility. |
| `integration.test.tsx` | 7 | Route protection via `ProtectedRoute.tsx`, role navigation redirection, filter state updates, and tracker board interactions. |
| `i18n.test.tsx` | 2 | Zero-flicker synchronous language switching between English (`en`) and Amharic (`am`), key interpolation, and persistent language context. |

---

## 3. Comprehensive Test Matrix & Invariants

| Category | Test Case | Target Invariant & Assertion |
|---|---|---|
| **Google Auth** | Valid Google ID Token | Decodes valid token, matches/creates user, grants session cookie, sets appropriate role. |
| **Google Auth** | Spoofed / Invalid Token | Rejects unverified Google tokens with 401 Unauthorized. |
| **Google Auth** | Privilege Escalation Attempt | Non-designated email requesting `role: 'admin'` receives `role: 'student'`. |
| **Google Auth** | Session Fixation Defense | `req.session.regenerate()` creates a fresh session ID on sign-in. |
| **SSRF Defense** | Localhost / Loopback target | `SourceMonitorService` rejects `http://127.0.0.1` and `http://localhost`. |
| **SSRF Defense** | Cloud Metadata target | Rejects `http://169.254.169.254` (AWS/GCP instance metadata endpoint). |
| **SSRF Defense** | Private RFC 1918 networks | Rejects `10.0.0.0/8`, `172.16.0.0/12`, and `192.168.0.0/16`. |
| **Source Discovery** | Ingest Verification Status | Candidate announcements enter `PENDING_REVIEW` & `draft`; never published automatically. |
| **Profile & Avatar** | Square WebP Upload | Accepts JPEG/PNG/WebP <= 5MB, normalizes to WebP, updates `customAvatarUrl`. |
| **Profile & Avatar** | Avatar Removal | Deletes custom avatar file, restores Google photo or default avatar. |
| **Profile & Avatar** | Unique Username | Enforces 3-30 chars, lowercase alphanumeric, rejects blacklisted system usernames. |
| **Opportunities** | Public Feed Invariant | Returns ONLY listings where `publicationStatus === 'published'` and `verificationStatus === 'VERIFIED'`. |
| **Opportunities** | Submitter Editing | Submitter editing own listing resets status to `draft` and `PENDING_REVIEW`. |
| **Admin Verification**| Verification with Evidence | Admin verifies listing with recorded source link, transitioning to `VERIFIED` and `published`. |
| **Student Tracker** | 7 Status Stages | Allows transitions through *Interested*, *Preparing*, *Applied*, *Interview*, *Accepted*, *Rejected*, *Withdrawn*. |
| **Student Tracker** | Cross-Student Isolation | Student A cannot read or modify Student B's tracker records (403 Forbidden). |
| **Role Guard** | Submitter / Admin Tracker Access| Submitter and Admin accounts are blocked from accessing student application tracker. |

---

## 4. Execution Commands

```bash
# Execute entire 125-test suite across client and server
npm test

# Run backend integration tests with MongoMemoryServer
npm run test:server

# Run frontend component and localization tests
npm run test:client

# Run strict TypeScript compiler verification across client and server
npm run typecheck

# Run ESLint across workspace
npm run lint
```
