const mongoose = require('./backend/node_modules/mongoose');
const dotenv = require('./backend/node_modules/dotenv');
dotenv.config({ path: './backend/.env' });

async function fixIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    const Problem = mongoose.connection.collection('problems');
    
    // Get all indexes
    const indexes = await Problem.indexes();
    console.log('\nCurrent indexes:');
    indexes.forEach(idx => console.log('-', idx.name));

    // Drop the problematic index
    try {
      await Problem.dropIndex('platform_1_originalUrl_1');
      console.log('\n✓ Dropped old index: platform_1_originalUrl_1');
    } catch (err) {
      if (err.code === 27) {
        console.log('\n✓ Index platform_1_originalUrl_1 does not exist (already removed)');
      } else {
        throw err;
      }
    }

    // Check for other old indexes
    const oldIndexes = ['platform_1', 'originalUrl_1', 'source.originalUrl_1'];
    for (const indexName of oldIndexes) {
      try {
        await Problem.dropIndex(indexName);
        console.log(`✓ Dropped old index: ${indexName}`);
      } catch (err) {
        if (err.code !== 27) {
          console.log(`- Index ${indexName} not found (OK)`);
        }
      }
    }

    console.log('\n✓ Database indexes fixed');
    console.log('\nNew indexes:');
    const newIndexes = await Problem.indexes();
    newIndexes.forEach(idx => console.log('-', idx.name));

    await mongoose.connection.close();
    console.log('\n✓ Connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixIndexes();
