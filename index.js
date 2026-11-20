import express from "express";
import cors from "cors";
import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

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
    throw err;
  }
}

await connectToMongoDB();

const db = client.db("StyleSync");
const services = db.collection("services");
const bookings = db.collection("bookings");
const users = db.collection("user");
const sessions = db.collection("sessions");
const payments = db.collection("payments");

// ডাবল বুকিং আটকানোর জন্যা
for (const indexName of [
  "serviceId_1_date_1_time_1",
  "serviceId_1_date_1_occupiedSlots_1",
]) {
  try {
    await bookings.dropIndex(indexName);
  } catch (error) {
    if (error?.code !== 27) {
      throw error;
    }
  }
}

await bookings.createIndex(
  { serviceId: 1, date: 1, time: 1 },
  {
    name: "active_service_date_time",
    unique: true,
    partialFilterExpression: {
      serviceId: { $type: "string" },
      date: { $type: "string" },
      time: { $type: "string" },
      status: { $in: ["Pending", "Confirmed"] },
    },
  },
);
await payments.createIndex({ sessionId: 1 }, { unique: true });

await bookings.createIndex(
  { serviceId: 1, date: 1, occupiedSlots: 1 },
  {
    name: "active_service_date_slots",
    unique: true,
    partialFilterExpression: {
      serviceId: { $type: "string" },
      date: { $type: "string" },
      occupiedSlots: { $type: "array" },
      status: { $in: ["Pending", "Confirmed"] },
    },
  },
);

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).send({ message: "Unauthorized" });

    return;
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    res.status(401).send({ message: "Unauthorized" });

    return;
  }

  const query = { token };
  const session = await sessions.findOne(query);

  if (!session) {
    res.status(401).send({ message: "Unauthorized" });
    return;
  }
  const userId = session.userId;
  if (!ObjectId.isValid(userId)) {
    res.status(401).send({ message: "Unauthorized" });
    return;
  }

  const userQuery = { _id: new ObjectId(userId) };
  const user = await users.findOne(userQuery);
  if (!user) {
    res.status(401).send({ message: "Unauthorized" });
    return;
  }

  if (user.isBlocked === true) {
    res.status(403).send({ message: "Account is blocked" });
    return;
  }

  req.user = user;
  next();
};
const verifyCustomer = async (req, res, next) => {
  if (req.user?.role?.toLowerCase() !== "customer") {
    res.status(403).send({ message: "Forbidden" });
    return;
  }
  next();
};

const verifyAdmin = async (req, res, next) => {
  if (req.user?.role?.toLowerCase() !== "admin") {
    res.status(403).send({ message: "Forbidden" });
    return;
  }
  next();
};

const verifyCustomerOrAdmin = async (req, res, next) => {
  const role = req.user?.role?.toLowerCase();
  if (role !== "customer" && role !== "admin") {
    res.status(403).send({ message: "Forbidden" });
    return;
  }
  next();
};

const getAuthenticatedUserId = (user) => user._id.toString();

app.get("/users", verifyToken, verifyAdmin, async (req, res) => {
  const cursor = users.find({});
  const result = await cursor.toArray();

  res.send(result);
});

app.get("/users/:id/premium", verifyToken, async (req, res) => {
  const id = req.params.id;
  if (!ObjectId.isValid(id)) {
    res.status(400).send({ message: "Invalid user ID" });
    return;
  }
  if (
    getAuthenticatedUserId(req.user) !== new ObjectId(id).toString() &&
    req.user.role?.toLowerCase() !== "admin"
  ) {
    res.status(403).send({ message: "Forbidden" });
    return;
  }

  const query = { _id: new ObjectId(id) };
  const result = await users.findOne(query, { projection: { premium: 1 } });
  if (!result) {
    res.status(404).send({ message: "User not found" });
    return;
  }
  res.send(result);
});

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

const serviceFields = [
  "serviceName",
  "description",
  "price",
  "duration",
  "status",
  "image",
];

function getServiceInput(body, isUpdate = false) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const keys = Object.keys(body);
  if (keys.some((key) => !serviceFields.includes(key))) {
    return null;
  }

  if (!isUpdate && (!("price" in body) || !("duration" in body))) {
    return null;
  }
  if (
    ("price" in body &&
      (typeof body.price !== "number" ||
        !Number.isFinite(body.price) ||
        body.price <= 0)) ||
    ("duration" in body &&
      (!Number.isInteger(body.duration) || body.duration <= 0)) ||
    ("status" in body && !["Active", "Inactive"].includes(body.status)) ||
    ("serviceName" in body &&
      (typeof body.serviceName !== "string" || !body.serviceName.trim())) ||
    ("description" in body && typeof body.description !== "string") ||
    ("image" in body && typeof body.image !== "string") ||
    (isUpdate && keys.length === 0)
  ) {
    return null;
  }

  return Object.fromEntries(
    Object.entries(body).map(([key, value]) => [
      key,
      typeof value === "string" ? value.trim() : value,
    ]),
  );
}

app.post("/add-service", verifyToken, verifyAdmin, async (req, res) => {
  const serviceInput = getServiceInput(req.body);
  if (!serviceInput) {
    res.status(400).send({ message: "Invalid service details" });
    return;
  }

  const service = {
    ...serviceInput,
    status: serviceInput.status ?? "Active",
    adminId: getAuthenticatedUserId(req.user),
  };
  const result = await services.insertOne(service);
  res.status(201).send({ insertedId: result.insertedId });
});

app.get("/services", async (req, res) => {
  const cursor = services.find({ status: "Active" });
  const result = await cursor.toArray();
  res.send(result);
});

// একটি নির্দিষ্ট সার্ভিস পাওয়া
app.get("/services/:id", async (req, res) => {
  const id = req.params.id;
  if (!ObjectId.isValid(id)) {
    res.status(400).send({ message: "Invalid service ID" });
    return;
  }

  const query = { _id: new ObjectId(id) };
  const result = await services.findOne({ ...query, status: "Active" });
  if (!result) {
    res.status(404).send({ message: "Service not found" });
    return;
  }
  res.send(result);
});

// সার্ভিস আপডেট
app.patch("/services/:id", verifyToken, verifyAdmin, async (req, res) => {
  const id = req.params.id;
  if (!ObjectId.isValid(id)) {
    res.status(400).send({ message: "Invalid service ID" });
    return;
  }

  const serviceInput = getServiceInput(req.body, true);
  if (!serviceInput) {
    res.status(400).send({ message: "Invalid service update" });
    return;
  }

  const query = { _id: new ObjectId(id) };
  const result = await services.updateOne(query, { $set: serviceInput });
  if (result.matchedCount === 0) {
    res.status(404).send({ message: "Service not found" });
    return;
  }
  res.send(result);
});

// সার্ভিস ডিলেট
app.delete("/services/:id", verifyToken, verifyAdmin, async (req, res) => {
  const id = req.params.id;
  if (!ObjectId.isValid(id)) {
    res.status(400).send({ message: "Invalid service ID" });
    return;
  }

  const query = { _id: new ObjectId(id) };
  const result = await services.deleteOne(query);
  if (result.deletedCount === 0) {
    res.status(404).send({ message: "Service not found" });
    return;
  }
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
app.post("/bookings", verifyToken, verifyCustomer, async (req, res) => {
  const { serviceId, date, time, message = "" } = req.body ?? {};
  const startMinute = typeof time === "string" ? timeToMinutes(time) : null;

  if (
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
    .find({
      serviceId,
      date,
      status: { $in: ["Pending", "Confirmed"] },
    })
    .project({ _id: 0, time: 1, duration: 1 })
    .toArray();
  const hasOverlap = existingBookings.some((existingBooking) => {
    const existingStart = timeToMinutes(existingBooking.time);
    if (existingStart === null) {
      return false;
    }

    const existingDuration =
      Number.isInteger(existingBooking.duration) && existingBooking.duration > 0
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
    userId: getAuthenticatedUserId(req.user),
    serviceId,
    serviceName: service.serviceName,
    date,
    time,
    duration,
    occupiedSlots,
    message: message.trim(),
    status: "Pending",
    paymentStatus: "Unpaid",
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
  if (!service || service.status !== "Active") {
    res.status(404).send({ message: "Service not found or unavailable" });
    return;
  }

  const serviceDuration = Number(service.duration);
  const bookingsForDate = await bookings
    .find({
      serviceId,
      date,
      status: { $in: ["Pending", "Confirmed"] },
    })
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
app.get("/bookings", verifyToken, verifyCustomerOrAdmin, async (req, res) => {
  const query = {};
  const isAdmin = req.user.role?.toLowerCase() === "admin";

  if (isAdmin) {
    if (typeof req.query.userId === "string") {
      query.userId = req.query.userId;
    }
  } else {
    query.userId = getAuthenticatedUserId(req.user);
    if (
      req.query.userId &&
      req.query.userId !== getAuthenticatedUserId(req.user)
    ) {
      res.status(403).send({ message: "Forbidden" });
      return;
    }
  }
  if (req.query.serviceId) {
    if (
      typeof req.query.serviceId !== "string" ||
      !ObjectId.isValid(req.query.serviceId)
    ) {
      res.status(400).send({ message: "Invalid service ID" });
      return;
    }

    query.serviceId = req.query.serviceId;
  }

  const cursor = bookings.find(query);
  const result = await cursor.toArray();
  res.send(result);
});

// কাস্টমার অনুযায়ী বুকিং খোজা
app.get(
  "/bookings/count",
  verifyToken,
  verifyCustomerOrAdmin,
  async (req, res) => {
    const query = {};
    const isAdmin = req.user.role?.toLowerCase() === "admin";

    if (isAdmin && typeof req.query.userId === "string") {
      query.userId = req.query.userId;
    } else {
      query.userId = getAuthenticatedUserId(req.user);
      if (
        req.query.userId &&
        req.query.userId !== getAuthenticatedUserId(req.user)
      ) {
        res.status(403).send({ message: "Forbidden" });
        return;
      }
    }

    const result = await bookings.countDocuments(query);
    res.send({ count: result });
  },
);

// স্ট্যাটাস আপডেট এর জন্য
app.patch(
  "/bookings/:id",
  verifyToken,
  verifyCustomerOrAdmin,
  async (req, res) => {
    const id = req.params.id;
    const { status } = req.body ?? {};

    if (!ObjectId.isValid(id) || !["Confirmed", "Cancelled"].includes(status)) {
      res.status(400).send({ message: "Invalid booking update" });
      return;
    }

    const query = { _id: new ObjectId(id) };
    const fieldsToUpdate = { status };
    const isAdmin = req.user.role?.toLowerCase() === "admin";

    if (isAdmin) {
      if (status === "Cancelled") {
        fieldsToUpdate.cancelledBy = "admin";
      }
    } else {
      if (status !== "Cancelled") {
        res.status(403).send({ message: "Only admins can confirm bookings" });
        return;
      }
      query.userId = getAuthenticatedUserId(req.user);
      query.status = "Pending";
      fieldsToUpdate.cancelledBy = "user";
    }

    const result = await bookings.updateOne(query, { $set: fieldsToUpdate });
    if (result.matchedCount === 0) {
      res
        .status(404)
        .send({ message: "Booking not found or cannot be updated" });
      return;
    }
    res.send(result);
  },
);

// payment related api

app.post("/payment/success-verify", verifyToken, async (req, res) => {
  const { sessionId } = req.body ?? {};
  if (typeof sessionId !== "string" || !sessionId.trim()) {
    res.status(400).send({ success: false, message: "Session ID is required" });
    return;
  }
  if (!stripe) {
    res
      .status(503)
      .send({ success: false, message: "Payment service is unavailable" });
    return;
  }

  const { status, customer_email, metadata, payment_intent, payment_status } =
    await stripe.checkout.sessions.retrieve(sessionId);

  if (
    status !== "complete" ||
    payment_status !== "paid" ||
    !ObjectId.isValid(metadata?.userId)
  ) {
    res
      .status(400)
      .send({ success: false, message: "Payment verification failed" });
    return;
  }
  if (
    metadata.userId !== getAuthenticatedUserId(req.user) &&
    req.user.role?.toLowerCase() !== "admin"
  ) {
    res.status(403).send({ message: "Forbidden" });
    return;
  }

  const paymentRecord = {
    sessionId,
    status,
    customer_email,
    userId: metadata.userId,
    payment_intent,
    payment_status,
    payment_date: new Date(),
  };

  try {
    await payments.insertOne(paymentRecord);
  } catch (error) {
    if (error?.code === 11000) {
      res
        .status(409)
        .send({ success: false, message: "Payment already verified" });
      return;
    }
    throw error;
  }

  const updatedResult = await users.updateOne(
    { _id: new ObjectId(metadata.userId) },
    { $set: { premium: true } },
  );
  res.send({ success: true, updatedResult });
});

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) {
    next(error);
    return;
  }
  res.status(500).send({ message: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
