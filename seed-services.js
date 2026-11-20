import dotenv from "dotenv";
dotenv.config();

import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URL;

if (!uri) {
  console.error("MONGODB_URL is missing in .env");
  process.exit(1);
}

const client = new MongoClient(uri);

const sampleServices = [
  {
    serviceName: "Classic Fade & Precision Haircut",
    category: "Haircut & Styling",
    description: "Custom precision haircut tailored to your head shape, complete with a clean fade, invigorating wash, and blow-dry styling.",
    price: 35,
    duration: 45,
    status: "Active",
    image: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=800&q=80",
  },
  {
    serviceName: "Luxury Blowout & Volumizing Style",
    category: "Haircut & Styling",
    description: "Volumizing hair wash, deep conditioning scalp treatment, and our signature bouncy blowout for silky, camera-ready finish.",
    price: 45,
    duration: 50,
    status: "Active",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
  },
  {
    serviceName: "Beard Grooming & Royal Hot Towel Shave",
    category: "Haircut & Styling",
    description: "Traditional straight-razor shave with warm herbal towels, essential pre-shave oils, precision beard sculpting, and cooling balm.",
    price: 30,
    duration: 35,
    status: "Active",
    image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80",
  },
  {
    serviceName: "Balayage & Custom Hair Glossing",
    category: "Hair Coloring",
    description: "Hand-painted sun-kissed balayage highlights seamlessly blended and sealed with a custom toning gloss for high-dimensional shine.",
    price: 130,
    duration: 150,
    status: "Active",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
  },
  {
    serviceName: "Full Foil Highlights & Color Refresh",
    category: "Hair Coloring",
    description: "Full head foil highlights with rich tone blending, bond-repairing wash, hydrating mask, and sleek blow-dry finish.",
    price: 110,
    duration: 120,
    status: "Active",
    image: "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=800&q=80",
  },
  {
    serviceName: "Deep Keratin Smoothing Treatment",
    category: "Hair Treatment",
    description: "Intensive keratin protein therapy formulated to eliminate frizz, seal cuticles, and leave hair lustrous and smooth for up to 12 weeks.",
    price: 95,
    duration: 90,
    status: "Active",
    image: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80",
  },
  {
    serviceName: "Nourishing Argan Scalp & Hair Therapy",
    category: "Hair Treatment",
    description: "Deep restorative organic argan oil scalp massage, steam treatment, and hot towel wrap designed to strengthen roots and restore shine.",
    price: 55,
    duration: 45,
    status: "Active",
    image: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80",
  },
  {
    serviceName: "Hydra-Glow Deep Cleansing Facial",
    category: "Facial & Skincare",
    description: "Ultrasonic blackhead extraction, micro-exfoliation, pure hyaluronic acid infusion, and LED phototherapy for an instant, radiant glow.",
    price: 75,
    duration: 60,
    status: "Active",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80",
  },
  {
    serviceName: "Anti-Aging Collagen Rejuvenating Facial",
    category: "Facial & Skincare",
    description: "Peptide-rich firming treatment designed to stimulate collagen production, lift facial contours, and deeply hydrate mature skin.",
    price: 85,
    duration: 75,
    status: "Active",
    image: "https://images.unsplash.com/photo-1512290900672-1f02e09ff7bb?auto=format&fit=crop&w=800&q=80",
  },
  {
    serviceName: "Red Carpet Evening Glam Makeup",
    category: "Makeup",
    description: "Full-face editorial makeover featuring flawless contouring, bespoke smokey or cut-crease eyes, luxury lashes, and 16-hour lock mist.",
    price: 80,
    duration: 60,
    status: "Active",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80",
  },
  {
    serviceName: "Signature Bridal Elegance & Styling",
    category: "Makeup",
    description: "Comprehensive HD bridal makeup service including skin priming, bespoke eye artistry, mink lashes, touch-up kit, and veil setting.",
    price: 150,
    duration: 90,
    status: "Active",
    image: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80",
  },
  {
    serviceName: "Deluxe Gel Manicure & Hand Therapy",
    category: "Manicure & Pedicure",
    description: "Precision nail shaping, gentle cuticle care, exfoliating sugar scrub, soothing hand massage, and long-lasting UV-cured gel polish.",
    price: 40,
    duration: 45,
    status: "Active",
    image: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80",
  },
  {
    serviceName: "Botanical Spa Pedicure & Callus Treatment",
    category: "Manicure & Pedicure",
    description: "Aromatic lavender foot soak, thorough callus reduction, sea salt scrub, warm herbal paraffin mask, and chip-resistant polish finish.",
    price: 50,
    duration: 60,
    status: "Active",
    image: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=800&q=80",
  },
  {
    serviceName: "Swedish Relaxing Full Body Massage",
    category: "Spa & Massage",
    description: "Therapeutic full body massage utilizing warm organic oils and gentle, rhythmic gliding strokes to release muscle tension and reduce stress.",
    price: 90,
    duration: 60,
    status: "Active",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80",
  },
  {
    serviceName: "Therapeutic Hot Stone & Aromatherapy Massage",
    category: "Spa & Massage",
    description: "Smooth volcanic basalt stones paired with pure eucalyptus and lavender oils to melt away deep-seated knots and restore physical harmony.",
    price: 115,
    duration: 75,
    status: "Active",
    image: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=800&q=80",
  },
];

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB successfully!");
    const db = client.db("StyleSync");
    const usersCollection = db.collection("user");
    const servicesCollection = db.collection("services");

    // Find an admin user to link adminId
    const adminUser = await usersCollection.findOne({ role: "admin" }) || await usersCollection.findOne({});
    const adminId = adminUser ? (adminUser.id ?? String(adminUser._id)) : "admin_seed";

    console.log(`Using admin ID: ${adminId} (${adminUser?.email || "default"})`);

    const servicesWithAdmin = sampleServices.map((service) => ({
      ...service,
      adminId,
      createdAt: new Date(),
    }));

    const result = await servicesCollection.insertMany(servicesWithAdmin);
    console.log(`Successfully inserted ${result.insertedCount} services into StyleSync database!`);

    const totalCount = await servicesCollection.countDocuments();
    console.log(`Total services in collection: ${totalCount}`);
  } catch (error) {
    console.error("Error inserting services:", error);
  } finally {
    await client.close();
  }
}

run();
