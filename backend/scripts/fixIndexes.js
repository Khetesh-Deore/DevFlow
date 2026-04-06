require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { MongoClient } = require('mongodb');

async function fix() {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  await client.connect();

  const adminDb = client.db('admin');
  const { databases } = await adminDb.admin().listDatabases();
  console.log('Databases:', databases.map(d => d.name));

  for (const { name: dbName } of databases) {
    if (['admin', 'local', 'config'].includes(dbName)) continue;
    const db = client.db(dbName);
    const cols = (await db.listCollections().toArray()).map(c => c.name);
    if (!cols.includes('contests') && !cols.includes('users')) continue;

    console.log(`\nFixing DB: ${dbName}`);

    for (const colName of ['contests', 'users', 'problems']) {
      if (!cols.includes(colName)) continue;
      const col = db.collection(colName);
      const indexes = await col.indexes();
      for (const idx of indexes) {
        if (idx.name === '_id_') continue;
        const keys = Object.keys(idx.key);
        if (keys.some(k => ['customUrl', 'username', 'slug'].includes(k))) {
          try {
            await col.dropIndex(idx.name);
            console.log(`  ✅ ${colName}: dropped ${idx.name}`);
          } catch (e) {
            console.log(`  ⚠️  ${colName}: ${e.message}`);
          }
        }
      }
      // Recreate slug as sparse unique
      if (['contests', 'problems'].includes(colName)) {
        await col.createIndex({ slug: 1 }, { unique: true, sparse: true });
        console.log(`  ✅ ${colName}: recreated slug index (sparse)`);
      }
    }
  }

  await client.close();
  console.log('\n✅ Done. Restart server now.');
  process.exit(0);
}

fix().catch(err => { console.error(err.message); process.exit(1); });
