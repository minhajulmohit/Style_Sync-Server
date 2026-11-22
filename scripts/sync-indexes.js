import "dotenv/config";
import { MongoClient } from "mongodb";

// মঙ্গোডিবিতে প্রয়োজনীয় বুকিং ও পেমেন্ট সূচি তৈরি বা আপডেট করে
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

    // পুরোনো বুকিং ইন্ডেক্স সরানো
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

    // একই সেবা, তারিখ ও সময়ে একাধিক সক্রিয় বুকিং হওয়া ঠেকায়
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

    // একই সেবা, তারিখ ও সময়ের দখল করা স্লট অন্য বুকিংয়ে ব্যবহৃত হওয়া ঠেকায়
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

    // একই পেমেন্ট সেশন নম্বর দিয়ে একাধিক লেনদেনের ইনপুট তৈরি হওয়া ঠেকায়
    await payments.createIndex({ sessionId: 1 }, { unique: true });

    // সব সূচি সফলভাবে আপডেট হলে সফলতার বার্তা দেখায়।
    console.log("MongoDB indexes synchronized successfully.");
  } finally {
    // কাজ সফল হোক বা ব্যর্থ, ডেটাবেসের সংযোগ বন্ধ করে।
    await client.close();
  }
}

// সূচি হালনাগাদে ত্রুটি হলে সেটি দেখায় এবং ব্যর্থতার সংকেত দিয়ে প্রক্রিয়াটি শেষ করে।
syncIndexes().catch((error) => {
  console.error("Failed to synchronize MongoDB indexes:", error);
  process.exitCode = 1;
});
