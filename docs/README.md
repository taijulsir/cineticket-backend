# CineTicket Backend API

> Production-ready NestJS REST API for a cinema ticket booking platform.  
> Handles event management, show scheduling, seat reservation, payment lifecycle, and admin operations.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Seat Reservation Lifecycle](#seat-reservation-lifecycle)
4. [Folder Structure](#folder-structure)
5. [Environment Variables](#environment-variables)
6. [Local Setup](#local-setup)
7. [Database Overview](#database-overview)
8. [Authentication System](#authentication-system)
9. [Seat Reservation System](#seat-reservation-system)
10. [Queues and Workers](#queues-and-workers)
11. [Admin APIs](#admin-apis)
12. [Public APIs](#public-apis)
13. [Error Handling](#error-handling)
14. [Swagger Documentation](#swagger-documentation)
15. [Testing / cURL Examples](#testing--curl-examples)

---

## Overview

The **CineTicket Backend** is a NestJS REST API that powers a full-featured cinema ticketing platform.

Key responsibilities:
- **Cinema event management** — Create, update, and publish events (movies, special screenings).
- **Show scheduling** — Schedule multiple shows per event across theaters and halls.
- **Seat reservation** — Redis-backed distributed seat locking with automatic expiry via BullMQ.
- **Ticket ordering** — Atomic transactional order creation with seat booking confirmation.
- **Payment lifecycle** — Pluggable payment abstraction with mock start/confirm/fail endpoints.
- **Admin management** — Full CRUD for events, shows, theaters, halls, seat layouts, and promo codes.
- **Analytics & audit** — Audit logs for all admin actions, stats endpoint, reservation monitoring.

---

## Architecture

```
┌─────────────────────────┐      ┌──────────────────────────────────┐
│   Client Applications   │      │         CineTicket Backend        │
│                         │      │           (NestJS / Node)         │
│  ┌───────────────────┐  │      │  ┌────────────────────────────┐  │
│  │  Admin Dashboard  │──┼──────┼─▶│  REST API (port 5000/5011) │  │
│  │    (Next.js)      │  │      │  └──────────────┬─────────────┘  │
│  └───────────────────┘  │      │                 │                 │
│                         │      │  ┌──────────────▼─────────────┐  │
│  ┌───────────────────┐  │      │  │   Business Modules          │  │
│  │  Customer App     │──┼──────┼─▶│   auth / events / shows /  │  │
│  │ (Next.js Landing) │  │      │  │   orders / payments /       │  │
│  └───────────────────┘  │      │  │   admin / theaters …        │  │
└─────────────────────────┘      │  └──────────────┬─────────────┘  │
                                 │                 │                 │
                          ┌──────┴──────┐   ┌──────┴──────┐        │
                          │ PostgreSQL  │   │    Redis     │        │
                          │  (Prisma)   │   │ (seat locks) │        │
                          └─────────────┘   └──────┬──────┘        │
                                                    │               │
                                          ┌─────────▼─────────┐    │
                                          │  BullMQ Workers   │    │
                                          │  reservation-expiry│    │
                                          │  payment-verify   │    │
                                          └───────────────────┘    │
                                 └─────────────────────────────────┘
```

---

## Seat Reservation Lifecycle

```
Customer selects seats
        │
        ▼
[POST /api/orders]
        │
        ├─▶ 1. LOCK  — Redis key `seat:<showId>:<seatId>` set with TTL
        │
        ├─▶ 2. RESERVE — ShowSeat row status = RESERVED, reservedUntil = now + TTL
        │
        ├─▶ 3. Order row created with state = PENDING
        │
        ├─▶ 4. BullMQ job enqueued (reservation-expiry queue, delay = TTL)
        │
        ▼
[POST /api/payments/mock/start]
        │
        ├─▶ External payment gateway / mock session created
        │
        ▼
[POST /api/payments/mock/confirm]
        │
        ├─▶ 5. CONFIRM — ShowSeat status = BOOKED, Order state = CONFIRMED
        │              Redis lock released
        │
[POST /api/payments/mock/fail]   OR   BullMQ job fires on expiry
        │
        └─▶ 6. RELEASE — ShowSeat status = AVAILABLE, Order state = EXPIRED
                         Redis lock deleted
```

---

## Folder Structure

```
cineticket-backend-nest/
├── prisma/
│   ├── schema.prisma          # Prisma data model (all tables & enums)
│   ├── seed.ts                # Database seeder
│   └── migrations/            # Auto-generated SQL migrations
├── src/
│   ├── app.module.ts          # Root module — wires all feature modules
│   ├── main.ts                # Bootstrap: Helmet, CORS, Swagger, rate-limit
│   ├── worker-main.ts         # Separate entry point for BullMQ workers
│   ├── worker.module.ts       # Worker module
│   │
│   ├── common/
│   │   ├── decorators/        # @CurrentUser, @Roles
│   │   ├── filters/           # HttpExceptionFilter — uniform error responses
│   │   ├── guards/            # JwtAuthGuard, RolesGuard
│   │   ├── interceptors/      # RequestLoggingInterceptor, ResponseInterceptor
│   │   └── types/             # AuthUser type
│   │
│   ├── config/
│   │   ├── configuration.ts   # Environment configuration factory
│   │   └── env.validation.ts  # Joi / class-validator env schema
│   │
│   ├── database/
│   │   └── prisma/            # PrismaModule, PrismaService
│   │
│   ├── infrastructure/
│   │   ├── queue/             # BullMQ QueueModule
│   │   ├── redis/             # RedisModule, RedisService
│   │   └── storage/           # StorageModule, StorageService (file uploads)
│   │
│   ├── modules/
│   │   ├── admin/             # Admin CRUD (events, shows, theaters, halls, promos)
│   │   ├── ads/               # Advertisements
│   │   ├── auth/              # JWT login, refresh, logout, profile
│   │   ├── cities/            # City lookup
│   │   ├── countries/         # Country lookup
│   │   ├── crews/             # Event crew management
│   │   ├── customers/         # Customer accounts
│   │   ├── employees/         # Employee accounts
│   │   ├── events/            # Public event listing
│   │   ├── hall-seats/        # Hall seat definitions
│   │   ├── halls/             # Hall management
│   │   ├── health/            # Health check endpoint
│   │   ├── hero-sliders/      # Homepage hero slider
│   │   ├── orders/            # Order creation and listing
│   │   ├── payments/          # Payment lifecycle (mock + abstraction)
│   │   ├── producers/         # Event producer management
│   │   ├── promo-codes/       # Promo code service stub
│   │   ├── promocodes/        # Promo code service stub (legacy path)
│   │   ├── seats/             # Seat service stub
│   │   ├── settings/          # App settings
│   │   ├── show-seats/        # Show seat layout retrieval
│   │   ├── shows/             # Show listing + seat map
│   │   ├── states/            # State/region lookup
│   │   ├── theaters/          # Theater management
│   │   ├── ticket-categories/ # Ticket category lookup
│   │   └── toofan/            # Special event handler
│   │
│   ├── queues/
│   │   ├── reservation-expiry.queue.ts   # Queue name + job type definitions
│   │   └── payment-verification.queue.ts
│   │
│   ├── utils/
│   │   ├── date.util.ts
│   │   ├── pagination.util.ts
│   │   └── response.util.ts
│   │
│   └── workers/
│       ├── reservation-expiry.worker.ts  # Expires overdue reservations
│       └── payment-verification.worker.ts # Times out unconfirmed payments
│
└── test/
    └── auth.e2e-spec.ts       # End-to-end auth test suite
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values.

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | No | `development` | Runtime environment (`development` / `production`) |
| `PORT` | No | `5011` | HTTP server port |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string (`postgresql://user:pass@host:5432/db`) |
| `JWT_ACCESS_SECRET` | **Yes** | — | Secret used to sign JWT access tokens |
| `JWT_REFRESH_SECRET` | **Yes** | — | Secret used to sign JWT refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` | No | `15m` | Access token lifetime (e.g. `15m`, `1h`) |
| `JWT_REFRESH_EXPIRES_IN` | No | `30d` | Refresh token lifetime (e.g. `30d`) |
| `REDIS_URL` | **Yes** | `redis://localhost:6379` | Redis connection URL (used for seat locking and BullMQ) |

> **Note:** The current codebase uses a mock payment layer. If you integrate Stripe or another provider, add the relevant keys (e.g. `STRIPE_SECRET_KEY`) here and update the `PaymentsService`.

---

## Local Setup

### Prerequisites

- Node.js ≥ 20
- PostgreSQL ≥ 15
- Redis ≥ 7
- `pnpm` or `npm`

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Copy and configure environment variables
cp .env.example .env
# Edit .env and set DATABASE_URL, JWT secrets, REDIS_URL

# 3. Run database migrations
npx prisma migrate dev

# 4. Generate Prisma client
npx prisma generate

# 5. Seed the database (optional but recommended for dev)
npx prisma db seed

# 6. Start the API server
npm run start:dev

# 7. Start the BullMQ worker process (separate terminal)
npm run start:worker
```

The API will be available at: `http://localhost:5011/api`  
Swagger UI will be available at: `http://localhost:5011/api/docs`

---

## Database Overview

All tables are defined in `prisma/schema.prisma`.

| Table | Description |
|---|---|
| `customers` | Registered customer accounts with auth, profile, and order history |
| `employees` | Staff and admin accounts |
| `employee_invites` | Pending invitations to join as employees |
| `events` | Cinema events (movies, special screenings) with status, imagery, and metadata |
| `crews` | Cast and crew linked to events |
| `event_prices` | Pricing tiers per event |
| `event_upvotes` | Customer upvotes for "vote to bring" events |
| `event_producers` | Employee-to-event producer associations |
| `shows` | Scheduled screenings — links event + hall + theater + time |
| `show_seats` | Per-show seat instances copied from `hall_seats`; tracks status and reservation expiry |
| `show_prices` | Per-show pricing per seat category |
| `theaters` | Physical cinema locations |
| `halls` | Halls/screens within a theater |
| `hall_seats` | Master seat layout for a hall (row, column, category) |
| `orders` | Confirmed or pending ticket orders |
| `order_items` | Individual seat entries within an order |
| `pending_orders` | Pre-payment order snapshots (holds seats until payment or expiry) |
| `promocodes` | Discount codes (percentage, fixed amount, or free ticket) |
| `hero_sliders` | Events featured in the homepage hero carousel |
| `ads` | Advertisement banners |
| `app_settings` | Global app configuration |
| `social_links` | Social media links for display |
| `ticket_categories` | Named ticket categories with color coding |
| `refresh_tokens` | Hashed refresh tokens with device, IP, and expiry metadata |
| `audit_logs` | Admin action log (userId, action, resource, metadata) |
| `toofan_at_hoyts_in_australia` | Special event interest registration |

### Key Enums

| Enum | Values |
|---|---|
| `Role` | `Admin`, `Employee`, `Customer` |
| `EventStatus` | `NOW_SELLING`, `UPCOMING`, `VOTE_TO_BRING`, `PAST` |
| `EventType` | `MOVIE`, `OTHERS` |
| `EventReleaseType` | `PRIVATE_SCREEN`, `THEATRICAL` |
| `SeatCategory` | `KIDS`, `WHEELCHAIR`, `STANDARD`, `RECLINER`, `PREMIUM`, `STAIR`, `UNAVAILABLE` |
| `SeatStatus` | `AVAILABLE`, `RESERVED`, `BOOKED`, `BLOCKED` |
| `OrderState` | `PENDING`, `CONFIRMED`, `CANCELLED`, `ARCHIVED`, `EXPIRED` |
| `PromoDiscountType` | `PERCENTAGE`, `AMOUNT`, `FREE_TICKET` |

---

## Authentication System

The auth system uses dual JWT tokens with server-side token tracking.

### Flow

```
POST /api/auth/login
  → validates credentials
  → issues accessToken (short-lived, signed with JWT_ACCESS_SECRET)
  → issues refreshToken (long-lived, signed with JWT_REFRESH_SECRET)
  → stores hashed refreshToken in `refresh_tokens` table with device + IP metadata
  → returns { accessToken, refreshToken }

POST /api/auth/refresh
  → validates refreshToken signature
  → checks token hash in DB (reuse detection — if revoked, all sessions killed)
  → rotates: old token revoked, new pair issued

POST /api/auth/logout
  → revokes the provided refreshToken in DB

GET /api/auth/profile  [Bearer token required]
  → returns decoded JWT payload
```

### Key security properties

- **Token hashing** — Refresh tokens are stored as bcrypt hashes; raw tokens never persist in the DB.
- **Reuse detection** — If a refresh token that has already been revoked is presented, all tokens for that user are invalidated.
- **Session metadata** — Device ID (`x-device-id` header), User-Agent, and IP address are stored per token for auditability.
- **Role-based authorization** — `JwtAuthGuard` + `RolesGuard` + `@Roles(Role.Admin)` decorators enforce endpoint access.
- **Rate limiting** — Login endpoint limited to 10 requests per 60 seconds via `ThrottlerGuard`.

---

## Seat Reservation System

Seat reservation is a two-layer system: Redis for speed, PostgreSQL for durability.

### How it works

1. **Seat lock (Redis)** — When a customer initiates checkout, each selected seat acquires a Redis key:
   ```
   seat:<showId>:<hallSeatId>  →  TTL = reservation window (e.g. 10 minutes)
   ```
   Atomic `SET NX EX` ensures no two customers can lock the same seat simultaneously.

2. **Database reservation** — Simultaneously, `ShowSeat.status` is set to `RESERVED` and `ShowSeat.reservedUntil` is written. This is the ground truth.

3. **BullMQ expiry job** — A delayed job is enqueued in the `reservation-expiry` queue with the same TTL. When it fires, it releases any seats whose `reservedUntil` has passed and transitions the order to `EXPIRED`.

4. **Payment confirmation** — On successful payment, seats are transitioned to `BOOKED` and the order to `CONFIRMED`. Redis lock is released.

5. **Expiry scan** — A recurring scan job (`reservation-scan-scheduler`) also runs periodically to catch any seats missed by individual jobs.

---

## Queues and Workers

The project runs two BullMQ queues, each processed by a dedicated worker. Start them with `npm run start:worker`.

### `reservation-expiry` queue

| Job Name | Trigger | Action |
|---|---|---|
| `reservation-expire` | Delayed — fires after reservation TTL | Expires a specific order and releases its seats |
| `reservation-scan-scheduler` | Periodic scheduler | Scans all overdue reservations and bulk-releases them |

### `payment-verification` queue

| Job Name | Trigger | Action |
|---|---|---|
| `payment-verify` | Delayed — fires after payment timeout | Transitions unconfirmed order to EXPIRED, releases seats |

---

## Admin APIs

All admin endpoints require a valid **Admin** JWT (`Authorization: Bearer <token>`).

| Category | Endpoints |
|---|---|
| **Reservations** | `GET /api/admin/reservations/active` — list all currently RESERVED seats |
| **Orders** | `GET /api/admin/orders/pending` — list all PENDING orders |
| **Stats** | `GET /api/admin/stats` — platform-wide booking statistics |
| **Audit Logs** | `GET /api/admin/audit-logs?page=1&limit=50` — paginated admin action log |
| **Events** | `POST /api/admin/events` · `PATCH /api/admin/events/:id` · `DELETE /api/admin/events/:id` |
| **Event Poster** | `POST /api/admin/events/upload-poster` — multipart file upload |
| **Shows** | `POST /api/admin/shows` · `PATCH /api/admin/shows/:id` |
| **Theaters** | `POST /api/admin/theaters` |
| **Halls** | `POST /api/admin/halls` |
| **Hall Seats** | `POST /api/admin/hall-seats` — add individual seats to a hall layout |
| **Promo Codes** | `POST /api/admin/promo-codes` · `PATCH /api/admin/promo-codes/:id` · `DELETE /api/admin/promo-codes/:id` |

---

## Public APIs

No authentication required unless specified.

| Module | Endpoint | Description |
|---|---|---|
| **Health** | `GET /api/health` | Service health check (DB connectivity, timestamp) |
| **Auth** | `POST /api/auth/login` | Login and receive token pair |
| **Auth** | `POST /api/auth/refresh` | Rotate refresh token |
| **Auth** | `POST /api/auth/logout` | Revoke refresh token |
| **Auth** | `GET /api/auth/profile` *(protected)* | Get current user profile |
| **Events** | `GET /api/events` | List/filter events (query params: status, type, page, limit) |
| **Shows** | `GET /api/shows` | List/filter shows |
| **Shows** | `GET /api/shows/:id/seats` | Full seat list with live status for a show |
| **Shows** | `GET /api/shows/:id/seat-map` | Seat map grouped by rows |
| **Show Seats** | `GET /api/show-seats/layout/:showId` | Raw show seat layout |
| **Orders** | `POST /api/orders` | Create order (books seats transactionally) |
| **Orders** | `GET /api/orders/:orderId` | Get order by ID |
| **Orders** | `GET /api/orders` | List orders (filter by customerId, page, limit) |
| **Payments** | `GET /api/payments/health` | Payment subsystem health |
| **Payments** | `POST /api/payments/mock/start` | Start mock payment session |
| **Payments** | `POST /api/payments/mock/confirm` | Confirm mock payment |
| **Payments** | `POST /api/payments/mock/fail` | Fail / expire mock payment |

---

## Error Handling

All responses are normalized by `ResponseInterceptor` and `HttpExceptionFilter`.

### Success response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error response

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed: seats must not be empty",
  "requestId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

The `requestId` is injected from the `x-request-id` header (or auto-generated UUID) and is included in every response header and error body for tracing.

---

## Swagger Documentation

Interactive API documentation is available at:

```
http://localhost:5011/api/docs
```

All tagged modules (`auth`, `admin`, `events`, `shows`, `orders`, `payments`, `health`) are documented. Click **Authorize** in the Swagger UI to set your Bearer token and test protected endpoints directly.

---

## Testing / cURL Examples

### 1. Login

```bash
curl -X POST http://localhost:5011/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Password@123",
    "role": "Admin"
  }'
```

### 2. Get Profile (protected)

```bash
curl http://localhost:5011/api/auth/profile \
  -H "Authorization: Bearer <accessToken>"
```

### 3. Create Event (Admin)

```bash
curl -X POST http://localhost:5011/api/admin/events \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "The Dark Knight",
    "slug": "the-dark-knight",
    "releaseType": "THEATRICAL",
    "trailerVideoLink": "https://youtube.com/watch?v=example",
    "status": "NOW_SELLING",
    "description": "When the menace known as the Joker wreaks havoc on Gotham...",
    "location": "Sydney",
    "organizer": "Warner Bros",
    "type": "MOVIE",
    "cardImage": "/uploads/events/dark-knight-card.jpg",
    "bannerImage": "/uploads/events/dark-knight-banner.jpg",
    "releaseDate": "2026-04-01T00:00:00.000Z",
    "duration": "152 min",
    "eventCurrency": "AUD"
  }'
```

### 4. Create Show (Admin)

```bash
curl -X POST http://localhost:5011/api/admin/shows \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "<eventId>",
    "hallId": "<hallId>",
    "theaterId": "<theaterId>",
    "cityId": "<cityId>",
    "stateId": "<stateId>",
    "countryId": "<countryId>",
    "date": "2026-04-05T00:00:00.000Z",
    "startTime": "19:30",
    "endTime": "22:00"
  }'
```

### 5. Get Seat Map

```bash
curl http://localhost:5011/api/shows/<showId>/seat-map
```

### 6. Create Order

```bash
curl -X POST http://localhost:5011/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "mobileNumber": "+61400000000",
    "eventId": "<eventId>",
    "showId": "<showId>",
    "seatIds": ["<showSeatId1>", "<showSeatId2>"],
    "total": 45.00
  }'
```

### 7. Start Payment

```bash
curl -X POST http://localhost:5011/api/payments/mock/start \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "<orderId>"
  }'
```

### 8. Confirm Payment

```bash
curl -X POST http://localhost:5011/api/payments/mock/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "<orderId>",
    "transactionId": "txn_abc123"
  }'
```

### 9. Refresh Token

```bash
curl -X POST http://localhost:5011/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<refreshToken>"
  }'
```

### 10. List Admin Audit Logs

```bash
curl "http://localhost:5011/api/admin/audit-logs?page=1&limit=20" \
  -H "Authorization: Bearer <accessToken>"
```

---

## License

MIT — see `LICENSE` file.
