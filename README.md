# StyleSync Backend API Server

Backend API for the StyleSync salon booking platform.

## Important Features

- Server-side role-based access control for customers and administrators.
- Revalidates user roles and blocked status from MongoDB on protected requests;
  blocked users receive `403 Forbidden`.
- Blocking an account revokes active Better Auth sessions.
- Booking validation checks customer appointment overlaps and occupied
  service slots.
- Signature-verified, idempotent Stripe webhook updates `paymentStatus` to
  `Paid`. Payment record insertion and booking update are separate database
  operations, not a multi-document transaction.
- Database indexes are synchronized separately, not on API startup.

## Technology Stack

![Node.js](https://img.shields.io/badge/Node.js-runtime-339933?logo=nodedotjs)
![Express.js 5](https://img.shields.io/badge/Express-5-000000?logo=express)
![MongoDB Native Driver](https://img.shields.io/badge/MongoDB-native_driver-47A248?logo=mongodb)
![Better Auth JWT](https://img.shields.io/badge/Better_Auth-JWT%20%2B%20JWKS-333333)
![Stripe SDK](https://img.shields.io/badge/Stripe-SDK-635bff?logo=stripe)
![CORS](https://img.shields.io/badge/CORS-enabled-555555)
![Dotenv](https://img.shields.io/badge/Dotenv-configured-ECD53F)

The API uses the MongoDB native driver, not Mongoose. Better Auth is configured
in the client; this server verifies its JWTs using the client's JWKS endpoint
and reads shared MongoDB user/session records.

## Installation Instructions

```bash
git clone https://github.com/minhajulmohit/Style_Sync-Server.git
cd Style_Sync-Server
npm install
```

Create `.env` and add the environment variable names listed below. Never
commit secret values.

## How to Run the Project Locally

Synchronize indexes once per database environment, and again only when index
definitions change:

```bash
npm run db:sync-indexes
```

Then start the API:

```bash
node index.js
```

The API listens on port `8000` by default. This repository does not define
`npm start` or `npm run dev`.

## Required Environment Variables

Required:

- `MONGODB_URL`
- `BETTER_AUTH_URL` (the public base URL of the client that serves Better Auth)

Optional or feature-dependent:

- `PORT`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Live Website Link

- Client: [StyleSync Client](https://stylesyncclient.vercel.app)
- Server API: [StyleSync Server](https://style-sync-server.vercel.app)

## Client and Server Repository Links

- Client: [Style_Sync-Client](https://github.com/minhajulmohit/Style_Sync-Client)
- Server: [Style_Sync-Server](https://github.com/minhajulmohit/Style_Sync-Server)
