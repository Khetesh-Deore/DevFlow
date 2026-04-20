require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const listDatabases = async () => {
  try {
    console.log('\n📊 Listing All Databases\n');
    console.log('='.repeat(60));

    // Connect without specifying database
    const uriWithoutDb = process.env.MONGO_URI.replace(/\/[^/?]+\?/, '/?');
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(uriWithoutDb);
    console.log('✅ Connected\n');

    // List all databases
    const adminDb = mongoose.connection.db.admin();
    const { databases } = await adminDb.listDatabases();

    console.log('📦 Available Databases:\n');
    databases.forEach(db => {
      console.log(`   - ${db.name}`);
      console.log(`     Size: ${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB`);
      console.log(`     Empty: ${db.empty ? 'Yes' : 'No'}`);
      console.log();
    });

    console.log('='.repeat(60));
    console.log('\n💡 To use a specific database, update your MONGO_URI:');
    console.log('   mongodb+srv://user:pass@cluster.mongodb.net/DATABASE_NAME?options\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

listDatabases();
