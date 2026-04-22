require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const importDatabase = async () => {
  try {
    console.log('\n📥 Importing Database from JSON\n');
    console.log('='.repeat(70));

    // Get filename from command line argument
    const filename = process.argv[2];
    if (!filename) {
      console.log('❌ Please provide a filename to import');
      console.log('   Usage: node backend/scripts/importDatabase.js <filename>\n');
      process.exit(1);
    }

    const filepath = path.join(__dirname, '..', 'exports', filename);
    
    if (!fs.existsSync(filepath)) {
      console.log(`❌ File not found: ${filepath}\n`);
      process.exit(1);
    }

    console.log(`📄 Reading file: ${filename}...`);
    const fileContent = fs.readFileSync(filepath, 'utf8');
    const importData = JSON.parse(fileContent);

    console.log(`✅ File loaded successfully\n`);
    console.log(`📊 Import Info:`);
    console.log(`   Source Database: ${importData.database}`);
    console.log(`   Export Date: ${new Date(importData.exportDate).toLocaleString()}`);
    console.log(`   Collections: ${Object.keys(importData.collections).length}\n`);

    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not found in environment variables');
    }

    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const currentDbName = db.databaseName;
    console.log(`📦 Target Database: ${currentDbName}\n`);

    console.log('⚠️  WARNING: This will replace existing data in the target database!');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    let totalImported = 0;

    // Import each collection
    for (const [collectionName, collectionData] of Object.entries(importData.collections)) {
      console.log(`📄 Importing: ${collectionName}...`);
      
      const collection = db.collection(collectionName);
      
      // Clear existing data
      const deleteResult = await collection.deleteMany({});
      console.log(`   🗑️  Deleted ${deleteResult.deletedCount} existing documents`);

      // Insert new data
      if (collectionData.documents.length > 0) {
        await collection.insertMany(collectionData.documents);
        console.log(`   ✅ Imported ${collectionData.documents.length} documents\n`);
        totalImported += collectionData.documents.length;
      } else {
        console.log(`   ⚪ No documents to import\n`);
      }
    }

    console.log('='.repeat(70));
    console.log('\n✅ Import Complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   Collections Imported: ${Object.keys(importData.collections).length}`);
    console.log(`   Total Documents: ${totalImported}\n`);

    console.log('💡 Database has been restored from backup!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

importDatabase();
