require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function fix() {
  await mongoose.connect(process.env.MONGO_URI, { dbName: 'devflow' });
  console.log('Connected');

  const db = mongoose.connection.db;
  const collection = db.collection('users');

  const indexes = await collection.indexes();
  console.log('Current indexes:', indexes.map(i => i.name));

  // Drop the bad username index if it exists
  for (const idx of indexes) {
    if (idx.key && idx.key.username !== undefined) {
      await collection.dropIndex(idx.name);
      console.log(`✅ Dropped index: ${idx.name}`);
    }
  }

  console.log('Done');
  process.exit(0);
}

fix().catch(err => { console.error(err.message); process.exit(1); });
