/**
 * migrateToAtlas.js
 * Copies ALL data from local MongoDB → MongoDB Atlas.
 * Run: node backend/scripts/migrateToAtlas.js
 */

const { MongoClient } = require('mongodb');

// ── CONFIG ───────────────────────────────────────────────────────────────────
const LOCAL_URI = 'mongodb://localhost:27017';
const ATLAS_URI = '';
const DB_NAME   = 'devflow';
// ─────────────────────────────────────────────────────────────────────────────

// family:4 forces IPv4 — fixes ECONNREFUSED / ETIMEOUT on Windows DNS SRV lookups
const ATLAS_OPTS = {
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 30000,
  family: 4
};

async function migrate() {
  const localClient = new MongoClient(LOCAL_URI);
  const atlasClient = new MongoClient(ATLAS_URI, ATLAS_OPTS);

  try {
    console.log('\n🔌 Connecting to Local MongoDB and Atlas...');
    await localClient.connect();
    await atlasClient.connect();
    console.log('✅ Connected to both databases\n');

    const localDb = localClient.db(DB_NAME);
    const atlasDb = atlasClient.db(DB_NAME);

    const collections = await localDb.listCollections().toArray();
    console.log(`📦 Found ${collections.length} collections in local DB: ${DB_NAME}\n`);
    console.log('─'.repeat(60));

    let totalDocs = 0;

    for (const colInfo of collections) {
      const colName = colInfo.name;
      if (colName.startsWith('system.')) continue;

      console.log(`\n📄 Collection: "${colName}"`);

      const localCol = localClient.db(DB_NAME).collection(colName);
      const atlasCol = atlasClient.db(DB_NAME).collection(colName);

      const documents = await localCol.find({}).toArray();

      if (documents.length === 0) {
        console.log(`   ⚠️  Empty — skipping`);
        continue;
      }

      // Clear Atlas collection to avoid duplicate key errors
      const deleted = await atlasCol.deleteMany({});
      console.log(`   🗑️  Cleared ${deleted.deletedCount} existing Atlas documents`);

      // Insert all local documents
      const result = await atlasCol.insertMany(documents);
      console.log(`   ✅ Inserted ${result.insertedCount} documents`);
      totalDocs += result.insertedCount;

      // Recreate indexes
      const indexes = await localCol.indexes();
      for (const index of indexes) {
        if (index.name === '_id_') continue;
        try {
          const { key, name, v, ns, ...options } = index;
          await atlasCol.createIndex(key, { name, ...options });
          console.log(`   📑 Index: "${name}"`);
        } catch (e) {
          console.log(`   ⚠️  Index "${index.name}" skipped: ${e.message}`);
        }
      }
    }

    console.log('\n' + '─'.repeat(60));
    console.log('\n🎉 Migration complete!');
    console.log(`   Documents migrated: ${totalDocs}\n`);

  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await localClient.close();
    await atlasClient.close();
    console.log('🔌 Connections closed\n');
  }
}

migrate();
