import express from "express";
import cors from "cors";
import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";
// import Stripe from "stripe";

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();

const port = process.env.PORT || 8000;

app.use(express.json());
app.use(cors());

//

const client = new MongoClient(process.env.MONGODB_URL);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const connectToClient = await connectToMongoDB();

const db = client.db("StyleSync");
const services = db.collection("services");
const bookings = db.collection("bookings");

// ডাবল বুকিং আটকানোর জন্যা
await bookings.createIndex(
  { serviceId: 1, date: 1, time: 1 },
  {
    unique: true,
    partialFilterExpression: {
      serviceId: { $type: "string" },
      date: { $type: "string" },
      time: { $type: "string" },
    },
  },
);

await bookings.createIndex(
  { serviceId: 1, date: 1, occupiedSlots: 1 },
  {
    unique: true,
    partialFilterExpression: {
      serviceId: { $type: "string" },
      date: { $type: "string" },
      occupiedSlots: { $type: "array" },
    },
  },
);

// Test
app.get("/", (req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#f5f7ff">
    <title>StyleSync</title>
    <style>
      * { box-sizing: border-box; }
      body {
        min-height: 100vh;
        margin: 0;
        display: grid;
        place-items: center;
        padding: 24px;
        color: #17213d;
        background:
          radial-gradient(ellipse at 15% 15%, #dce8ff 0, transparent 38%),
          radial-gradient(ellipse at 85% 85%, #e8ddff 0, transparent 38%),
          #f5f7ff;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      main {
        width: min(100%, 760px);
        padding: clamp(40px, 8vw, 88px) 24px;
        text-align: center;
        background: rgba(255, 255, 255, 0.88);
        border: 1px solid rgba(255, 255, 255, 0.9);
        border-radius: 32px;
        box-shadow: 0 28px 80px rgba(37, 52, 97, 0.14);
      }
      .mark {
        display: grid;
        width: 76px;
        height: 76px;
        margin: 0 auto 24px;
        place-items: center;
        color: white;
        background: linear-gradient(135deg, #5865f2, #8b5cf6);
        border-radius: 24px;
        box-shadow: 0 12px 28px rgba(99, 91, 235, 0.3);
        font-size: 36px;
        font-weight: 750;
      }
      h1 {
        margin: 0;
        font-size: clamp(42px, 9vw, 72px);
        letter-spacing: -0.06em;
        line-height: 1;
      }
      p {
        margin: 18px 0 30px;
        color: #64708b;
        font-size: clamp(16px, 3vw, 20px);
      }
      .status {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 12px 18px;
        color: #18794e;
        background: #e9f8f0;
        border: 1px solid #d2f0df;
        border-radius: 999px;
        font-size: 15px;
        font-weight: 650;
      }
      .status::before {
        width: 9px;
        height: 9px;
        content: "";
        background: #20b26b;
        border-radius: 50%;
        box-shadow: 0 0 0 4px rgba(32, 178, 107, 0.14);
      }
    </style>
  </head>
  <body>
    <main>
      <div class="mark" aria-hidden="true">S</div>
      <h1>StyleSync</h1>
      <p>Your StyleSync workspace is ready.</p>
      <div class="status" role="status">Server is running</div>
    </main>
  </body>
</html>`);
});

// services api

// একটা সার্ভিস পোস্ট করার জন্য
app.post("/add-service", async (req, res) => {
  const service = req.body;
  const result = await services.insertOne(service);
  if (result.acknowledged) {
    res.status(200).send({ message: "Service added to server" });
  }
});

// সার্ভিস গুলো পাওয়ার জন্য
app.get("/services", async (req, res) => {
  const query = {};
  const cursor = services.find(query);
  const result = await cursor.toArray();
  res.send(result);
});

// একটি নির্দিষ্ট সার্ভিস পাওয়া
app.get("/services/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await services.findOne(query);
  res.send(result);
});

// সার্ভিস আপডেট
app.patch("/services/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const updatedData = {
    $set: req.body,
  };

  const result = await services.updateOne(query, updatedData);

  res.send(result);
});

// সার্ভিস ডিলেট
app.delete("/services/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await services.deleteOne(query);
  res.send(result);
});

// booking related

function isValidBookingDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === date
  );
}

function timeToMinutes(time) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

// বুক করা
app.post("/bookings", async (req, res) => {
  const { userId, serviceId, date, time, message = "" } = req.body ?? {};
  const startMinute =
    typeof time === "string" ? timeToMinutes(time) : null;

  if (
    typeof userId !== "string" ||
    !userId ||
    typeof serviceId !== "string" ||
    !ObjectId.isValid(serviceId) ||
    typeof date !== "string" ||
    !isValidBookingDate(date) ||
    startMinute === null ||
    startMinute % 30 !== 0 ||
    typeof message !== "string" ||
    message.length > 500
  ) {
    res.status(400).send({ message: "Invalid booking details" });
    return;
  }

  const service = await services.findOne({ _id: new ObjectId(serviceId) });
  if (!service || service.status !== "Active") {
    res.status(404).send({ message: "Service not found or unavailable" });
    return;
  }

  const duration = Number(service.duration);
  if (!Number.isInteger(duration) || duration <= 0) {
    res.status(422).send({ message: "Service duration is invalid" });
    return;
  }

  if (startMinute + duration > 24 * 60) {
    res.status(400).send({ message: "Booking does not fit within this day" });
    return;
  }

  const existingBookings = await bookings
    .find({ serviceId, date })
    .project({ _id: 0, time: 1, duration: 1 })
    .toArray();
  const hasOverlap = existingBookings.some((existingBooking) => {
    const existingStart = timeToMinutes(existingBooking.time);
    if (existingStart === null) {
      return false;
    }

    const existingDuration =
      Number.isInteger(existingBooking.duration) &&
      existingBooking.duration > 0
        ? existingBooking.duration
        : duration;
    return (
      startMinute < existingStart + existingDuration &&
      existingStart < startMinute + duration
    );
  });

  if (hasOverlap) {
    res.status(409).send({ message: "This time overlaps an existing booking" });
    return;
  }

  const occupiedSlots = Array.from(
    { length: Math.ceil(duration / 30) },
    (_, index) => startMinute + index * 30,
  );
  const booking = {
    userId,
    serviceId,
    serviceName: service.serviceName,
    date,
    time,
    duration,
    occupiedSlots,
    message: message.trim(),
    status: "Pending",
  };

  try {
    const result = await bookings.insertOne(booking);
    res.status(201).send(result);
  } catch (error) {
    if (error?.code === 11000) {
      res.status(409).send({ message: "This time is already booked" });
      return;
    }
    throw error;
  }
});

app.get("/bookings/availability", async (req, res) => {
  const { serviceId, date } = req.query;

  if (
    typeof serviceId !== "string" ||
    !ObjectId.isValid(serviceId) ||
    typeof date !== "string" ||
    !isValidBookingDate(date)
  ) {
    res.status(400).send({ message: "Invalid service or date" });
    return;
  }

  const service = await services.findOne({ _id: new ObjectId(serviceId) });
  if (!service) {
    res.status(404).send({ message: "Service not found" });
    return;
  }

  const serviceDuration = Number(service.duration);
  const bookingsForDate = await bookings
    .find({ serviceId, date })
    .project({ _id: 0, time: 1, duration: 1 })
    .toArray();
  const bookedSlots = bookingsForDate
    .map((booking) => ({
      time: booking.time,
      duration:
        Number.isInteger(booking.duration) && booking.duration > 0
          ? booking.duration
          : serviceDuration,
    }))
    .filter(
      (booking) =>
        timeToMinutes(booking.time) !== null &&
        Number.isInteger(booking.duration) &&
        booking.duration > 0,
    )
    .sort((first, second) => first.time.localeCompare(second.time));

  res.send({ bookedSlots });
});

// বুকিং খোজা
app.get("/bookings", async (req, res) => {
  const query = {};

  if (req.query.userId) {
    query.userId = req.query.userId;
  }
  if (req.query.serviceId) {
    if (!req.user) {
      res.status(401).send({ message: "Unauthorized" });
      return;
    }

    if (!ObjectId.isValid(req.query.serviceId)) {
      res.status(404).send({ message: "Service not found" });
      return;
    }

    const serviceQuery = { _id: new ObjectId(req.query.serviceId) };

    const service = await services.findOne(serviceQuery);

    if (!service) {
      res.status(404).send({ message: "Service not found" });
      return;
    }

    if (
      service.adminId !== (req.user._id?.toString() || req.user.id) &&
      req.user.role !== "admin"
    ) {
      res.status(403).send({ message: "Forbidden" });
      return;
    }

    query.serviceId = req.query.serviceId;
  }

  const cursor = bookings.find(query);
  const result = await cursor.toArray();
  res.send(result);
});

// কাস্টমার অনুযায়ী বুকিং খোজা
app.get("/bookings/count", async (req, res) => {
  const query = {};

  if (req.query.userId) {
    query.userId = req.query.userId;
  }

  const result = await bookings.countDocuments(query);
  res.send({ count: result });
});

// স্ট্যাটাস আপডেট এর জন্য
app.patch("/bookings/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const updatedDoc = { $set: { status: req.body.status } };

  const result = await bookings.updateOne(query, updatedDoc);
  res.send(result);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
