# Ticketbooth Frontend

Single-page React + TypeScript client for browsing events, picking seats, and managing ticket orders. This repo only encompasses the UI layer; it expects a Ticketbooth API running separately.

## Tech stack

- React 18 + TypeScript
- Vite for dev server/build tooling
- TailwindCSS for styling
- Axios for HTTP requests
- React Router 6 for routing and navigation

## Features

- Event list and date detail views (GA and seated)
- Ticket tier selector + seat map components with availability hints
- Auth flow (sign up, login) with tokens persisted in localStorage + cookie
- Booking flow that requires a logged-in user and records the attendee name
- Orders index and order confirmation pages that fetch user-specific data

## Getting started

```bash
# Install dependencies
npm install

# Start the Vite dev server (http://localhost:3000)
npm run dev

# Type checking + production build
npm run build

# Lint
npm run lint
```

The frontend proxies `/api/*` calls to `http://localhost:4000` during development (see `vite.config.ts`). Override the base URL by setting `VITE_API_BASE_URL` in `.env` if your backend lives elsewhere.

## Environment

Create an `.env` file if you need to override defaults:

```
VITE_API_BASE_URL=https://your-api.example.com/api
```

If the variable is omitted, Axios targets `/api`, which is proxied to `localhost:4000` in dev and relative to the host in production.

## Auth/session handling

- Successful login/sign-up responses contain `{ token, user }`.
- `src/utils/auth.ts` stores that payload in localStorage (`ticketbooth:auth`) and mirrors the token into a `ticketbooth_token` cookie (SameSite=Lax, 7 days).
- Axios attaches the token as a Bearer header on every request; storage listeners update components like `EventDateDetail` and `Orders` in real time.
- Booking requests now send both `userId` and `customerName`.

## API reference (frontend expectations)

- `GET /api/events` → list of events/dates
- `GET /api/event-dates/:id` + `/availability` → details used by GA tiers / seat map
- `POST /api/bookings` → creates a booking (`userId`, `customerName`, `tiers` or `seats`)
- `GET /api/orders?userId=` → user’s orders (`tickets` array with event info)
- `GET /api/orders/:id` → full order confirmation view
- `POST /api/login`, `POST /api/signup` → returns `{ token, user }`

## Project structure

```
src/
  api/          # Axios client, endpoints, type defs
  components/   # Reusable UI: TicketTierSelector, SeatMap, etc.
  pages/        # Route components (EventsList, EventDateDetail, Orders, ...)
  utils/        # Auth/session helpers
```

## Development notes

- Seat IDs currently fall back to a tier-name → ID map if the API omits `ticketTypeId`.
- Orders page guards access if the user is logged out and shows CTAs.
- This repo does not ship backend code or database migrations—see the API project for those concerns.

## License

MIT (or specify the license that applies to your project). Update this section if a different license is used.
	•	~1,000,000 DAU
	•	Peak ~50,000 concurrent users

Design choices:
	•	Database-first concurrency control:
	•	Avoid complex in-memory locking so we can scale horizontally.
	•	Rely on row-level locking & unique constraints.
	•	Indexes on hot paths:
	•	event_date_has_ticket_type(event_date_id, ticket_type_id)
	•	event_date_has_seat(event_date_id, seat_id)
	•	ticket(event_date_id, seat_id) (unique)
	•	Read-heavy vs write-heavy flows:
	•	Browsing catalog is read-heavy → can be cached via:
	•	API-side in-memory cache, or
	•	CDN / edge caching for /events, /events/:id.
	•	Booking is write-heavy but relatively low volume compared to reads.
	•	Idempotent booking (optional enhancement):
	•	The client can send an idempotency key header (e.g., X-Idempotency-Key).
	•	The backend stores successful bookings keyed by that value and returns the same result for retries.

Performance target: p95 < 500ms
	•	Keep booking logic to:
	•	1–2 queries for inventory
	•	1 insert for order
	•	N inserts for tickets
	•	Use prepared statements or query builders.
	•	Keep payloads small (only send necessary fields).

⸻

API Specification

All endpoints are prefixed with /api.
Requests and responses are JSON.

Common types

type SeatingMode = 'GA' | 'SEATED';

type TicketTierName = 'VIP' | 'FRONT_ROW' | 'GA';


⸻

GET /api/events

List all events.

Response 200:

[
  {
    "id": 1,
    "slug": "rock-festival-2025",
    "title": "Rock Festival 2025",
    "description": "Two days of live music.",
    "dates": [
      {
        "id": 10,
        "date": "2025-07-15T20:00:00Z",
        "venueName": "Main Arena",
        "seatingMode": "GA"
      },
      {
        "id": 11,
        "date": "2025-07-16T20:00:00Z",
        "venueName": "Main Arena",
        "seatingMode": "SEATED"
      }
    ]
  }
]


⸻

GET /api/event-dates/:id

Get details for a single event_date (one show).

Response 200:

{
  "id": 10,
  "event": {
    "id": 1,
    "title": "Rock Festival 2025",
    "description": "Two days of live music."
  },
  "date": "2025-07-15T20:00:00Z",
  "venue": {
    "id": 5,
    "name": "Main Arena",
    "capacity": 10000
  },
  "seatingMode": "GA"
}


⸻

GET /api/event-dates/:id/availability

Returns availability depending on seating_mode.

GA example

{
  "seatingMode": "GA",
  "tiers": [
    { "id": 1, "name": "VIP", "price": 100, "remaining": 50 },
    { "id": 2, "name": "FRONT_ROW", "price": 50, "remaining": 200 },
    { "id": 3, "name": "GA", "price": 10, "remaining": 500 }
  ]
}

Seated example

{
  "seatingMode": "SEATED",
  "sections": [
    {
      "section": "A",
      "rows": [
        {
          "row": "1",
          "seats": [
            { "seatId": 101, "label": "A1", "ticketType": "VIP", "price": 100, "available": true },
            { "seatId": 102, "label": "A2", "ticketType": "VIP", "price": 100, "available": false }
          ]
        }
      ]
    }
  ]
}

Availability for seated events can be computed either from:
	•	event_date_has_seat + joined ticket table, or
	•	a materialized view / precomputed cache.

⸻

POST /api/bookings

Create a booking (order + tickets).

This endpoint supports both GA and seated bookings.
The backend branches on the seatingMode of the event_date.

GA request

{
  "eventDateId": 10,
  "customerName": "Alice Example",
  "paymentSource": "test-card-4242",
  "tiers": [
    { "ticketTypeId": 1, "quantity": 2 },   // 2 VIP
    { "ticketTypeId": 3, "quantity": 3 }    // 3 GA
  ]
}

GA success response (201)

{
  "orderId": 123,
  "totalAmount": 230,
  "tickets": [
    {
      "id": 1001,
      "ticketType": "VIP",
      "seatLabel": null,
      "toName": "Alice Example"
    },
    {
      "id": 1002,
      "ticketType": "VIP",
      "seatLabel": null,
      "toName": "Alice Example"
    },
    {
      "id": 1003,
      "ticketType": "GA",
      "seatLabel": null,
      "toName": "Alice Example"
    }
  ]
}

If inventory is insufficient for any tier:

Response 409 (Conflict):

{
  "error": "INSUFFICIENT_INVENTORY",
  "message": "Not enough tickets left for VIP."
}


⸻

Seated request

{
  "eventDateId": 11,
  "customerName": "Bob Example",
  "paymentSource": "test-card-4242",
  "seats": [
    { "seatId": 201, "ticketTypeId": 1 },
    { "seatId": 202, "ticketTypeId": 1 }
  ]
}

Seated success response (201)

{
  "orderId": 124,
  "totalAmount": 200,
  "tickets": [
    {
      "id": 1010,
      "ticketType": "VIP",
      "seatLabel": "A1",
      "toName": "Bob Example"
    },
    {
      "id": 1011,
      "ticketType": "VIP",
      "seatLabel": "A2",
      "toName": "Bob Example"
    }
  ]
}

If any seat was already taken due to concurrency and the unique constraint fails:

Response 409 (Conflict):

{
  "error": "SEAT_ALREADY_TAKEN",
  "message": "One or more selected seats are no longer available."
}


⸻

GET /api/orders/:id

Fetch a specific order with its tickets (useful for confirmation page).

Response 200:

{
  "id": 124,
  "createdAt": "2025-07-15T21:00:00Z",
  "customerName": "Bob Example",
  "totalAmount": 200,
  "tickets": [
    {
      "id": 1010,
      "eventTitle": "Rock Festival 2025",
      "eventDate": "2025-07-16T20:00:00Z",
      "ticketType": "VIP",
      "seatLabel": "A1"
    }
  ]
}


⸻

Local Development

Adjust this section to match your actual implementation (Node or Go).
Here’s a Node.js + TypeScript oriented example.

Prerequisites
	•	Node.js >= 20
	•	npm or pnpm
	•	MySQL or Postgres running locally (or via Docker)

Backend

Stack
	•	Language: Go (1.21+)
	•	Router: github.com/go-chi/chi/v5 (lightweight, nice)
	•	DB: MySQL with github.com/go-sql-driver/mysql
	•	DB helper (optional but nice): github.com/jmoiron/sqlx for nicer scanning

folder structure 
```
backend/
  cmd/
    api/
      main.go            # wire up HTTP server, routes, DB connection
  internal/
    http/
      router.go          # route registrations
      handlers.go        # HTTP handlers (events, bookings, etc.)
    db/
      db.go              # DB connection, helpers, tx helper
    tickets/
      service.go         # booking logic (GA + seated)
      models.go          # Go structs for ticket/order/event_date, etc.
```

Frontend
## Frontend

### Stack

- React + TypeScript (SPA)
- React Router for client-side routing
- Fetch API or Axios for HTTP calls to `/api/*`
- Optional: React Query (TanStack Query) for data fetching / caching / loading states
- Styling: simple CSS modules or a utility-first framework like Tailwind (no design library required)

### Screens

1. **Events list**
   - **Route:** `/`
   - Lists all events with title, short description, and upcoming dates.
   - Each event date links to its details page.

2. **Event date detail**
   - **Route:** `/event-dates/:id`
   - Fetches:
     - `GET /api/event-dates/:id`
     - `GET /api/event-dates/:id/availability`
   - Shows:
     - Event info (title, description)
     - Date/time
     - Venue name + capacity
     - `seatingMode` (`"GA"` or `"SEATED"`)

   - If `seatingMode === "GA"`:
     - Render available tiers (VIP / Front Row / GA) with:
       - name, price, remaining tickets
     - Quantity input per tier (0–N, default 0).
     - Show running total price.

   - If `seatingMode === "SEATED"`:
     - Render a simple seat map:
       - Grouped by section → row → seats
       - Seat buttons / chips, color-coded:
         - Available
         - Taken
         - Selected
     - Clicking a seat toggles selection.
     - Optionally show ticket type + price for that seat.

3. **Booking confirmation**
   - **Route:** `/orders/:id`
   - Fetches `GET /api/orders/:id`.
   - Shows:
     - Customer name
     - Total amount
     - Per-ticket info:
       - Event title
       - Event date
       - Ticket type
       - Seat label (for seated) or “GA”
   - Used as the redirect target after a successful booking.

### Booking flow (frontend)

- User lands on `/event-dates/:id`.
- User enters **Customer name**.
- For **GA**:
  - Selects quantities per tier.
  - Payload matches the README’s GA example for `POST /api/bookings`.
- For **SEATED**:
  - Selects one or more seats (and implicitly their ticket types).
  - Payload matches the seated example for `POST /api/bookings`.

**On submit:**

1. Disable the submit button and show a loading indicator.
2. Call `POST /api/bookings`.
3. On success:
   - Navigate to `/orders/:orderId`.
4. On error:
   - `409` with `INSUFFICIENT_INVENTORY` or `SEAT_ALREADY_TAKEN`:
     - Show a friendly message (“Some of your seats/tickets are no longer available, please review availability.”).
     - Refetch `/availability` and update the screen.
   - `5xx` or network errors:
     - Show a generic error + “Try again” button.

### State management

- Local component state is enough for form values and seat selection.
- If using **React Query**:
  - Cache:
    - `events` list
    - `event-dates/:id`
    - `event-dates/:id/availability`
  - Invalidate `event-dates/:id/availability` after:
    - A failed booking due to concurrency
    - A successful booking

### Validation & UX

- Required:
  - Customer name
  - At least one ticket (GA) **or** at least one seat selected (seated).
- Disable submit when the form is invalid or while a request is pending.
- Show clear inline error messages (e.g., “Please select at least one ticket”).
- Layout priority:
  1. Event + date + venue header
  2. Availability (tiers or seat map)
  3. Booking form (name, selections, submit)

The aim of the frontend is to keep the flow simple and transparent so reviewers can easily see how the booking API is used and how concurrency errors are surfaced to the user.


## Conclusion

This project focuses on:
	•	Clear domain modeling for events, venues, and tickets
	•	Correct handling of concurrency and double-booking
	•	A straightforward React UI for booking
	•	A backend API that can be implemented in either Node.js + TypeScript or Go, while preserving the same data model and guarantees.
