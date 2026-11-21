import "dotenv/config";
import { MongoClient } from "mongodb";

async function syncIndexes() {
  const mongoUrl = process.env.MONGODB_URL;
  if (!mongoUrl) {
    throw new Error("MONGODB_URL must be configured to sync database indexes.");
  }

  const client = new MongoClient(mongoUrl);

  try {
    await client.connect();
    const db = client.db("StyleSync");
    const bookings = db.collection("appointments");
    const payments = db.collection("transactions");

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
    await payments.createIndex({ sessionId: 1 }, { unique: true });

    console.log("MongoDB indexes synchronized successfully.");
  } finally {
    await client.close();
  }
}

syncIndexes().catch((error) => {
  console.error("Failed to synchronize MongoDB indexes:", error);
  process.exitCode = 1;
});
