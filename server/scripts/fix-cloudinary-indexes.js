import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/NewRan';

async function fixCloudinaryIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('cloudinaryaccounts');

    // Drop the existing cloudName index if it exists
    try {
      await collection.dropIndex('cloudName_1');
      console.log('Dropped existing cloudName_1 index');
    } catch (error) {
      console.log('cloudName_1 index does not exist or already dropped');
    }

    // Create the new partial unique index
    await collection.createIndex(
      { cloudName: 1 }, 
      { 
        unique: true, 
        partialFilterExpression: { 
          cloudName: { $ne: null, $ne: '' },
          isDraft: false 
        },
        name: 'cloudName_unique_nondraft'
      }
    );
    console.log('Created new partial unique index for cloudName');

    // Clean up any existing accounts with empty string cloudName and convert to null
    const result = await collection.updateMany(
      { cloudName: '', isDraft: true },
      { $set: { cloudName: null } }
    );
    console.log(`Updated ${result.modifiedCount} draft accounts to have null cloudName`);

    console.log('Index fix completed successfully');
    process.exit(0);

  } catch (error) {
    console.error('Error fixing indexes:', error);
    process.exit(1);
  }
}

// Run the fix
fixCloudinaryIndexes();
