require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const exportDatabase = async () => {
  try {
    console.log('\n📦 Exporting Database to JSON\n');
    console.log('='.repeat(70));

    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not found in environment variables');
    }

    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const dbName = db.databaseName;
    console.log(`📦 Database: ${dbName}\n`);

    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log(`📚 Found ${collections.length} collections:\n`);

    const exportData = {
      database: dbName,
      exportDate: new Date().toISOString(),
      collections: {}
    };

    let totalDocuments = 0;

    // Export each collection
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`📄 Exporting: ${collectionName}...`);

      const collection = db.collection(collectionName);
      const documents = await collection.find({}).toArray();
      
      exportData.collections[collectionName] = {
        count: documents.length,
        documents: documents
      };

      totalDocuments += documents.length;
      console.log(`   ✅ Exported ${documents.length} documents\n`);
    }

    // Create exports directory if it doesn't exist
    const exportsDir = path.join(__dirname, '..', 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `database-export-${timestamp}.json`;
    const filepath = path.join(exportsDir, filename);

    // Write to file
    console.log('💾 Writing to file...\n');
    fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));

    const fileSize = (fs.statSync(filepath).size / 1024 / 1024).toFixed(2);

    console.log('='.repeat(70));
    console.log('\n✅ Export Complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   Database: ${dbName}`);
    console.log(`   Collections: ${collections.length}`);
    console.log(`   Total Documents: ${totalDocuments}`);
    console.log(`   File Size: ${fileSize} MB`);
    console.log(`   Location: ${filepath}\n`);

    console.log('📋 Collection Breakdown:');
    Object.entries(exportData.collections).forEach(([name, data]) => {
      console.log(`   - ${name}: ${data.count} documents`);
    });

    console.log('\n💡 To import this data later, use:');
    console.log(`   node backend/scripts/importDatabase.js ${filename}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

exportDatabase();
