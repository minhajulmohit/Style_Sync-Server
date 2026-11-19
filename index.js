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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
