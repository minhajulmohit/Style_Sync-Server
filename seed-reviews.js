import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const client = new MongoClient(process.env.MONGODB_URL);

const reviewsData = [
  {
    name: "Rafiqul Islam",
    avatar: "RI",
    rating: 5,
    review: "Absolutely loved the haircut! The stylist was professional and knew exactly what I wanted. Will definitely come back.",
    service: "Hair Cut & Style",
    date: "2024-10-15T10:30:00.000Z",
  },
  {
    name: "Nusrat Jahan",
    avatar: "NJ",
    rating: 5,
    review: "The bridal makeup was stunning. Everyone at my wedding kept complimenting me. So happy with the results!",
    service: "Bridal Makeup",
    date: "2024-10-20T14:00:00.000Z",
  },
  {
    name: "Tanvir Ahmed",
    avatar: "TA",
    rating: 4,
    review: "Great facial treatment. My skin felt so refreshed afterwards. The staff was very friendly and welcoming.",
    service: "Facial Treatment",
    date: "2024-10-25T11:00:00.000Z",
  },
  {
    name: "Sumaiya Akter",
    avatar: "SA",
    rating: 5,
    review: "Had a full spa day package and it was worth every penny. So relaxing and rejuvenating. Highly recommend!",
    service: "Spa & Wellness",
    date: "2024-11-01T09:00:00.000Z",
  },
  {
    name: "Mehedi Hassan",
    avatar: "MH",
    rating: 4,
    review: "The beard grooming service was top notch. Very precise work and the products they used smelled amazing.",
    service: "Beard Grooming",
    date: "2024-11-05T16:00:00.000Z",
  },
  {
    name: "Fatema Begum",
    avatar: "FB",
    rating: 5,
    review: "My hair color came out exactly as I wanted. The colorist was very skilled and gave great advice on aftercare.",
    service: "Hair Color",
    date: "2024-11-08T13:00:00.000Z",
  },
  {
    name: "Sabbir Hossain",
    avatar: "SH",
    rating: 4,
    review: "Really enjoyed the massage session. I came in with a stiff neck and left feeling completely relaxed.",
    service: "Body Massage",
    date: "2024-11-10T15:30:00.000Z",
  },
  {
    name: "Riya Chowdhury",
    avatar: "RC",
    rating: 5,
    review: "The nail art was beautiful! The technician was patient and creative. Got exactly the design I showed in the picture.",
    service: "Nail Care",
    date: "2024-11-12T12:00:00.000Z",
  },
  {
    name: "Arif Hossain",
    avatar: "AH",
    rating: 5,
    review: "Very professional environment and excellent service. Booked online which was super easy. Came on time and left satisfied.",
    service: "Hair Cut & Style",
    date: "2024-11-14T10:00:00.000Z",
  },
  {
    name: "Lamia Sultana",
    avatar: "LS",
    rating: 4,
    review: "Love this salon! The staff is always warm and the results are consistently great. My go-to place for self-care.",
    service: "Facial Treatment",
    date: "2024-11-16T11:30:00.000Z",
  },
];

async function seedReviews() {
  try {
    await client.connect();
    const db = client.db("StyleSync");
    const reviews = db.collection("reviews");

    // Clear existing reviews
    await reviews.deleteMany({});
    console.log("Cleared old reviews.");

    const result = await reviews.insertMany(reviewsData);
    console.log(`Successfully inserted ${result.insertedCount} reviews!`);
  } catch (error) {
    console.error("Error seeding reviews:", error);
  } finally {
    await client.close();
  }
}

seedReviews();
