import mongoose from 'mongoose';
import Product from '../src/model/Product.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function migrateProductPricing() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/newran');
    console.log('Connected to MongoDB');

    // Find all products that don't have originalPrice or currentPrice
    const products = await Product.find({
      $or: [
        { originalPrice: { $exists: false } },
        { currentPrice: { $exists: false } },
        { originalPrice: null },
        { currentPrice: null }
      ]
    });

    console.log(`Found ${products.length} products to migrate`);

    let migrated = 0;
    for (const product of products) {
      let updated = false;

      // Set originalPrice and currentPrice based on existing price
      if (product.price && (!product.originalPrice || !product.currentPrice)) {
        if (!product.originalPrice) {
          product.originalPrice = product.price;
          updated = true;
        }
        if (!product.currentPrice) {
          product.currentPrice = product.price;
          updated = true;
        }
      }

      // If no price fields exist, set defaults
      if (!product.price && !product.originalPrice && !product.currentPrice) {
        product.price = 0;
        product.originalPrice = 0;
        product.currentPrice = 0;
        updated = true;
      }

      if (updated) {
        await product.save();
        migrated++;
        console.log(`Migrated product: ${product.name} (${product._id})`);
      }
    }

    console.log(`Successfully migrated ${migrated} products`);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateProductPricing();
