# StyleSync Server

Express and MongoDB API for the StyleSync salon booking client.

## Local development

Install dependencies and start the server:

```bash
npm install
node index.js
```

The API uses port `8000` by default. Set `PORT` to use another port.

## Environment variables

Set these in a local `.env` file. Do not commit credentials.

| Variable | Purpose |
| --- | --- |
| `MONGODB_URL` | MongoDB connection string |
| `API_JWT_SECRET` | Shared HS256 signing secret (at least 32 bytes); set the same value in the client and server deployments |
| `PORT` | Optional Express port; defaults to `8000` |
| `STRIPE_SECRET_KEY` | Stripe API secret used for checkout verification |
| `STRIPE_WEBHOOK_SECRET` | Stripe endpoint signing secret for `/webhooks/stripe` |

Configure Stripe to send `checkout.session.completed` events to the deployed
server's `/webhooks/stripe` endpoint. The webhook returns `503` until
`STRIPE_WEBHOOK_SECRET` is configured.

## Main API routes

- `PATCH /users/:id/block` — block or unblock a user (admin only); blocking revokes active sessions
- `GET /services` — active services
- `GET /admin/services` — all services (admin only)
- `POST /add-service` — create a service (admin only)
- `PATCH` and `DELETE /services/:id` — update or delete a service (admin only)
- `POST /bookings` — create a customer booking
- `GET /bookings` — list the authenticated customer's bookings or all bookings
  for an admin
- `PATCH /bookings/:id` — cancel or update a booking
- `GET /payments` — verified payments (admin only)
- `POST /payment/success-verify` — verify a Stripe Checkout return
- `POST /webhooks/stripe` — verify Stripe webhook events

Protected API routes require a short-lived HS256 JWT in the
`Authorization: Bearer <token>` header. The client signs this JWT after
validating the user's Better Auth session; the API reloads the user from
MongoDB on each request so current roles and blocked status take effect.
