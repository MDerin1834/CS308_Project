/* Seed products from TeknoSU_try/src/products.json into MongoDB */
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Product = require("../src/models/Product");
const connectDB = require("../src/config/db");

// Ensure .env in backend/ is loaded
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const dataPath = path.join(__dirname, "..", "..", "frontend", "src", "products.json");

async function seed() {
  try {
    await connectDB(process.env.MONGO_URI);

    const raw = fs.readFileSync(dataPath, "utf8");
    const products = JSON.parse(raw);

    if (!Array.isArray(products) || products.length === 0) {
      throw new Error("products.json empty or invalid");
    }

    const ops = products.map((p) => ({
      updateOne: {
        filter: { id: p.id },
        update: {
          $set: {
            id: p.id,
            name: p.name,
            price: p.price,
            category: p.category,
            seller: p.seller || "TeknoSU",
            stock: p.stock ?? 0,
            quantity: p.quantity ?? 0,
            ratings: p.ratings ?? 0,
            ratingsCount: p.ratingsCount ?? 0,
            shipping: p.shipping ?? 0,
            imageURL: p.img || p.imageURL || "",
            img: p.img || p.imageURL || "",
            description: p.description || "",
            tag: p.tag || "",
            model: p.model || "",
            serialNumber: p.serialNumber || "",
            warranty: p.warranty || "",
            distributor: p.distributor || "",
            specs: p.specs || undefined,
          },
        },
        upsert: true,
      },
    }));

    const result = await Product.bulkWrite(ops, { ordered: false });
    const inserted = result.upsertedCount || 0;
    const updated = result.modifiedCount || 0;
    console.log(`✅ Seed completed: ${inserted} inserted, ${updated} updated`);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seed();
