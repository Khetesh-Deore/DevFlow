require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { MongoClient } = require('mongodb');

async function fix() {
  // Connect directly without dbName to use the one in URI
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  await client.connect();

  // List all databases to find the right one
  const adminDb = client.db('admin');
  const dbs = await adminDb.admin().listDatabases();
  console.log('Available databases:', dbs.databases.map(d => d.name));

  // Try both case variations
  for (const dbName of ['devflow', 'DevFlow', 'fullstack_DevFlow', 'fullstack_devflow']) {
    try {
      const db = client.db(dbName);
      const collections = await db.listCollections().toArray();
      const colNames = collections.map(c => c.name);
      console.log(`\nDB: ${dbName} | Collections:`, colNames);

      if (colNames.includes('contests')) {
        const contests = db.collection('contests');
        const indexes = await contests.indexes();
        console.log('Contest indexes:', indexes.map(i => `${i.name}:${JSON.stringify(i.key)}`));

        for (const idx of indexes) {
          if (idx.name !== '_id_') {
            await contests.dropIndex(idx.name);
            console.log(`✅ Dropped: ${idx.name}`);
          }
        }
        // Recreate only slug index
        await contests.createIndex({ slug: 1 }, { unique: true, sparse: true });
        console.log('✅ Recreated slug index (sparse)');
      }

      if (colNames.includes('users')) {
        const users = db.collection('users');
        const indexes = await users.indexes();
        for (const idx of indexes) {
          if (Object.keys(idx.key).some(k => ['username', 'customUrl'].includes(k))) {
            await users.dropIndex(idx.name);
            console.log(`✅ Dropped users index: ${idx.name}`);
          }
        }
      }
    } catch (e) {
      console.log(`  ${dbName}: ${e.message}`);
    }
  }

  await client.close();
  console.log('\n✅ Done. Restart server.');
  process.exit(0);
}

fix().catch(err => { console.error(err.message); process.exit(1); });
