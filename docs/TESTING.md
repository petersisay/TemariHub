# TemariHub — Quality Assurance & Testing Strategy

**Frameworks:** Vitest, React Testing Library, Supertest, MongoMemoryServer, ESLint, TypeScript  
**Goal:** Verify reliability, boundary isolation, permission enforcement, and data persistence across the full stack.

---

## 1. Test Pyramid & Scope

```
              / \
             /   \      E2E User Flow Tests
            / E2E \     (Core Journeys: Discovery -> Save -> Track)
           /-------\
          /         \   API Integration Tests (Supertest + MongoMemoryServer)
         /   Integ   \  (Auth, RBAC, Filters, Duplicate Prevention, Tracker Privacy)
        /-------------\
       /               \ Unit Tests (Vitest)
      /      Unit       \ (Zod Schemas, Utils, Date Helpers, i18n Dictionary)
     +-------------------+
```

---

## 2. API Integration Test Matrix

Integration tests run against an isolated `MongoMemoryServer` instance to ensure tests are deterministic, fast, and require no pre-existing external database service.

| Suite | Test Case | Target Assertion |
|---|---|---|
| **Auth** | Register with valid student data | Returns 201 Created, sets session cookie, returns sanitized user. |
| **Auth** | Attempt duplicate email registration | Returns 409 Conflict with meaningful message. |
| **Auth** | Attempt public registration as `role: 'admin'` | Returns 403 Forbidden. Privileges not escalated. |
| **Auth** | Login with incorrect password | Returns 401 Unauthorized without leaking account existence. |
| **Auth** | Invalidate session on logout | Destroys server session, clears cookie, subsequent access rejected (401). |
| **Security / Env** | Production startup without session secret | Fails fast with clear error when `SESSION_SECRET` is missing. |
| **Security / Env** | Production secret length validation | Rejects session secrets under 32 characters in production. |
| **Security / Env** | Production placeholder secret rejection | Rejects default development secret and known `.env.example` placeholders. |
| **Security / CSRF** | Mutating request with valid custom header | Allows state change when `X-Requested-With: XMLHttpRequest` present. |
| **Security / CSRF** | Production Origin header matching | Verifies `Origin` against `CLIENT_URL`; rejects unauthorized or spoofed origins (403). |
| **Admin Provision** | CLI provision new administrator | Creates admin with canonical `name` field, hashed password, and audit log. |
| **Admin Provision** | CLI idempotent second execution | Exits safely without creating duplicate administrators. |
| **Admin Provision** | Refusal of automatic role promotion | Prohibits automatic role escalation of existing `student` or `submitter` accounts. |
| **Opportunities** | List opportunities (Public) | Returns only `published` & `approved` listings. Drafts omitted. |
| **Opportunities** | Filter opportunities by field/type | Matches exact criteria; returns pagination metadata. |
| **Opportunities** | Expired listings exclusion | Listings past deadline excluded from active feed by default. |
| **Submissions** | Submitter submits opportunity | Created with `moderationStatus: 'pending'`. Not in public feed. |
| **Saved** | Student saves opportunity | Returns 201. Subsequent duplicate save returns 200 idempotent. |
| **Saved** | Student unsaves opportunity | Removes bookmark successfully. |
| **Tracker** | Student adds opportunity to tracker | Saved with valid initial stage (`Interested` or `Preparing`). |
| **Tracker** | Student updates status stage | Successfully transitions through all 7 stages (*Applied*, *Interview*, etc.). |
| **Tracker** | Student updates private notes | Notes persisted accurately. |
| **Tracker** | Cross-student tracker isolation | Student A cannot read, update, or delete Student B's tracker records (403 Forbidden). |
| **Moderation** | Non-admin accesses moderation queue | Returns 403 Forbidden. |
| **Moderation** | Admin approves submitted listing | Listing transitions to `approved` & `published`. Visible in public feed. |
| **Moderation** | Audit log recording | Admin approval logs actor, target, and timestamp into `audit_logs`. |

---

## 3. Frontend & Component Test Strategy

- **Component Tests (React Testing Library):**
  - OpportunityCard: Renders title, organization, tags, deadline badge, and verified indicator.
  - TrackerBoard: Displays 7 status columns, drag/select status transitions, and notes modal.
  - SearchBar & Filters: Emits debounced search queries and updates query string filters.
  - LanguageSwitcher: Switches between English (`en`) and Amharic (`am`), updates UI text without page reload or loss of route state.

---

## 4. Acceptance Criteria Verification Checklist

### 4.1. Authentication & Security
- [ ] Student registration, login, logout works with secure cookies.
- [ ] Passwords stored using bcrypt with 12 rounds.
- [ ] Public registration rejects `admin` role elevation.
- [ ] Protected routes reject unauthorized requests with 401/403.
- [ ] No private student notes or emails leaked in public payloads.

### 4.2. Opportunity Discovery
- [ ] Search query filters by title, organization, skills, and description.
- [ ] Multi-select filters by category, level, field of study, and location work.
- [ ] Sorting by newest and deadline functions accurately.
- [ ] Expired opportunities marked and excluded from active feed by default.
- [ ] Detail page renders verified badge, original source link, and application URL.

### 4.3. Student Tracker & Bookmarks
- [ ] Save/unsave opportunity functions with duplicate prevention.
- [ ] Application tracker supports all 7 stages (*Interested*, *Preparing*, *Applied*, *Interview*, *Accepted*, *Rejected*, *Withdrawn*).
- [ ] Private notes and applied dates save and persist accurately.
- [ ] Application isolation verified: Student B cannot access Student A's records.
- [ ] Clear disclaimer displayed that tracker is a personal planning tool.

### 4.4. Moderation & Trust
- [ ] Submitter flow creates pending listing; does not appear on public feed.
- [ ] Admin moderation dashboard lists pending listings with source URLs.
- [ ] Admin approval publishes listing to public feed.
- [ ] Admin rejection updates listing with review feedback.
- [ ] Audit log records admin actions.
- [ ] Reporting modal allows users to flag suspicious/expired listings.

### 4.5. Bilingual Localization
- [ ] English is the default language.
- [ ] Amharic dictionary covers navigation, forms, buttons, tracker stages, and empty states.
- [ ] Switching languages preserves current page state and route.
- [ ] Amharic typography renders with suitable line-height and font support.

---

## 5. Execution Commands

```bash
# Run all automated tests
npm test

# Run backend API integration tests with in-memory DB
npm run test:server

# Run frontend unit & component tests
npm run test:client

# Run strict TypeScript type verification across entire workspace
npm run typecheck

# Run linter
npm run lint
```
